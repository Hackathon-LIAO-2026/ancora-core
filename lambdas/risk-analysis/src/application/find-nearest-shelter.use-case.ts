import { Injectable, Inject, Logger } from '@nestjs/common';
import {
  IShelterRepository,
  ShelterResult,
  SHELTER_REPOSITORY,
} from '../domain/interfaces/shelter-repository.interface';
import {
  IClimateRiskRepository,
  ClimateRiskResult,
  CLIMATE_RISK_REPOSITORY,
} from '../domain/interfaces/climate-risk-repository.interface';
import { ShelterCsvService } from '../infrastructure/csv/shelter-csv.service';
import { GeoLocation } from '../domain/value-objects/geo-location.vo';
import { RiskRequestDto } from './dto/risk-request.dto';
import {
  RiskResponseDto,
  ShelterDto,
  EmergencyContactDto,
} from './dto/risk-response.dto';

/**
 * Use Case — Encontrar abrigo mais próximo com análise de risco vetorial.
 *
 * Fluxo:
 * 1. Busca vetorial no ChromaDB (clima_salvador / clima_bahia) com a query do usuário
 *    para derivar nível de risco a partir de dados climáticos históricos similares.
 * 2. Combina com panicScore do usuário (máximo dos dois sinais).
 * 3. Busca abrigos (ChromaDB → fallback CSV greedy).
 * 4. Ordena por distância geográfica e monta response.
 */
@Injectable()
export class FindNearestShelterUseCase {
  private readonly logger = new Logger(FindNearestShelterUseCase.name);

  private readonly SALVADOR_CENTER = new GeoLocation(-12.9714, -38.5014);

  constructor(
    @Inject(SHELTER_REPOSITORY)
    private readonly shelterRepository: IShelterRepository,
    @Inject(CLIMATE_RISK_REPOSITORY)
    private readonly climateRiskRepository: IClimateRiskRepository,
    private readonly shelterCsv: ShelterCsvService,
  ) {}

  async execute(dto: RiskRequestDto): Promise<RiskResponseDto> {
    const start = Date.now();

    // 1. Busca vetorial de risco climático
    const climateQuery = this.buildClimateQuery(dto);
    const climateResults = await this.climateRiskRepository.searchRisk(climateQuery, 5);
    const climateScore = this.scoreFromClimate(climateResults);

    // 2. Nível de risco combinado: max(clima, panicScore) + intent boost
    const riskLevel = this.calculateRiskLevel(dto.panicScore, dto.intencao, climateScore);

    // 3. Buscar abrigos (ChromaDB → fallback CSV)
    const shelters = await this.findShelters(dto);

    // 4. Ordenar por distância geográfica
    const userLocation = dto.lat && dto.lng ? new GeoLocation(dto.lat, dto.lng) : null;
    const sorted = this.sortByDistance(shelters, userLocation);

    const elapsed = Date.now() - start;

    this.logger.log(
      `[Salvador/${dto.bairro || 'geral'}] risco=${riskLevel} climaScore=${climateScore} ` +
      `climaDocs=${climateResults.length} abrigos=${sorted.length} (${elapsed}ms)`,
    );

    return this.buildResponse(sorted, dto, riskLevel, userLocation, elapsed, climateResults);
  }

  /**
   * Constrói a query para busca vetorial no dataset climático.
   * Usa a mensagem original do usuário quando disponível para máxima semântica.
   */
  private buildClimateQuery(dto: RiskRequestDto): string {
    if (dto.mensagemOriginal) {
      const location = dto.bairro ? `${dto.bairro} Salvador` : 'Salvador';
      return `${dto.mensagemOriginal} ${location}`;
    }

    const intentMap: Record<string, string> = {
      alagamento: 'alagamento inundação chuva intensa precipitação',
      risco_chuva: 'chuva forte precipitação tempestade',
      emergencia: 'emergência risco climático extremo',
    };

    const intentText = dto.intencao ? intentMap[dto.intencao] || dto.intencao : 'risco chuva';
    const location = dto.bairro ? `${dto.bairro} Salvador Bahia` : 'Salvador Bahia';
    return `${intentText} ${location}`;
  }

  /**
   * Converte os resultados do vector search climático em um score 1-5.
   *
   * Usa precipitação total como sinal primário: o dataset clima_bahia
   * armazena `precip_total` em mm por dia por estação. Encontrar registros
   * com alta precipitação via busca semântica indica contexto de chuva intensa.
   */
  private scoreFromClimate(results: ClimateRiskResult[]): number {
    if (results.length === 0) return 1;

    // Usa o top resultado (menor distância vetorial = mais relevante)
    const top = results[0];
    const precip = Number(top.metadata.precip_total ?? 0);

    if (precip >= 50) return 5;  // CRÍTICO: >= 50mm/dia
    if (precip >= 20) return 4;  // ALTO: >= 20mm/dia
    if (precip >= 5)  return 3;  // MÉDIO: >= 5mm/dia
    if (precip > 0)   return 2;  // BAIXO-MÉDIO: chuva leve
    return 1;
  }

  /**
   * Risco final = max(sinal_climático, sinal_panic) com boost por intenção.
   */
  private calculateRiskLevel(
    panicScore?: number,
    intencao?: string,
    climateScore = 1,
  ): 'BAIXO' | 'MÉDIO' | 'ALTO' | 'CRÍTICO' {
    const panic = panicScore || 1;
    const highRiskIntents = ['alagamento', 'risco_chuva'];
    const intentBoost = intencao && highRiskIntents.includes(intencao) ? 1 : 0;
    const panicEffective = Math.min(panic + intentBoost, 5);

    const effectiveScore = Math.max(panicEffective, climateScore);

    if (effectiveScore >= 5) return 'CRÍTICO';
    if (effectiveScore >= 4) return 'ALTO';
    if (effectiveScore >= 3) return 'MÉDIO';
    return 'BAIXO';
  }

  /**
   * Busca abrigos: ChromaDB → fallback CSV greedy.
   */
  private async findShelters(dto: RiskRequestDto): Promise<ShelterResult[]> {
    let shelters = dto.bairro
      ? await this.shelterRepository.searchByBairro(dto.bairro)
      : await this.shelterRepository.searchShelters(
          dto.mensagemOriginal
            ? `abrigo emergência Salvador ${dto.mensagemOriginal}`
            : 'abrigo emergência Salvador',
        );

    if (shelters.length === 0) {
      this.logger.debug('ChromaDB vazio — usando busca gulosa no CSV');
      if (dto.lat && dto.lng) {
        shelters = dto.bairro
          ? this.shelterCsv.findByBairro(dto.bairro, dto.lat, dto.lng)
          : this.shelterCsv.findNearest(dto.lat, dto.lng);
      } else if (dto.bairro) {
        shelters = this.shelterCsv.findByBairro(dto.bairro);
      } else {
        shelters = this.shelterCsv.findNearest(-12.9714, -38.5014);
      }
    }

    return shelters;
  }

  private sortByDistance(
    shelters: ShelterResult[],
    userLocation: GeoLocation | null,
  ): Array<{ shelter: ShelterResult; distance: number }> {
    const reference = userLocation || this.SALVADOR_CENTER;
    return shelters
      .map((shelter) => ({
        shelter,
        distance: reference.distanceTo(
          new GeoLocation(Number(shelter.metadata.latitude), Number(shelter.metadata.longitude)),
        ),
      }))
      .sort((a, b) => a.distance - b.distance);
  }

  private buildResponse(
    sorted: Array<{ shelter: ShelterResult; distance: number }>,
    dto: RiskRequestDto,
    riskLevel: 'BAIXO' | 'MÉDIO' | 'ALTO' | 'CRÍTICO',
    userLocation: GeoLocation | null,
    elapsedMs: number,
    climateResults: ClimateRiskResult[],
  ): RiskResponseDto {
    const response = new RiskResponseDto();

    response.riskLevel = riskLevel;
    response.confidence = this.calculateConfidence(dto, sorted.length, climateResults.length);
    response.showEmergencyButton =
      (dto.panicScore || 0) >= 4 || riskLevel === 'ALTO' || riskLevel === 'CRÍTICO';

    const showShelter = riskLevel === 'ALTO' || riskLevel === 'CRÍTICO';
    const nearest = sorted[0];

    response.shelter = showShelter && nearest ? this.toShelterDto(nearest.shelter, nearest.distance) : null;
    response.nearbyShelters = sorted
      .slice(showShelter ? 1 : 0, showShelter ? 4 : 3)
      .map(({ shelter, distance }) => this.toShelterDto(shelter, distance));

    response.summary = this.buildSummary(dto, riskLevel, nearest, sorted.length, climateResults);
    response.emergencyContacts = showShelter ? this.getEmergencyContacts() : [];

    response.meta = {
      cidade: dto.cidade,
      bairro: dto.bairro || null,
      totalShelters: sorted.length,
      elapsedMs,
    };

    return response;
  }

  private toShelterDto(shelter: ShelterResult, distanceMeters: number): ShelterDto {
    const dto = new ShelterDto();
    dto.id = shelter.id;
    dto.nome = shelter.metadata.nome;
    dto.endereco = shelter.metadata.endereco || `${shelter.metadata.bairro}, Salvador`;
    dto.bairro = shelter.metadata.bairro;
    dto.latitude = Number(shelter.metadata.latitude);
    dto.longitude = Number(shelter.metadata.longitude);
    dto.distancia = distanceMeters < 1000
      ? `${Math.round(distanceMeters)}m`
      : `${(distanceMeters / 1000).toFixed(1)}km`;
    dto.telefone = shelter.metadata.telefone || null;
    dto.servicosOferecidos = shelter.metadata.servicos || null;
    dto.modoAtivacao = shelter.metadata.modo_ativacao || null;
    return dto;
  }

  private calculateConfidence(dto: RiskRequestDto, shelterCount: number, climateCount: number): number {
    let confidence = 0.4;
    if (dto.lat && dto.lng) confidence += 0.3;
    else if (dto.bairro) confidence += 0.15;
    if (climateCount > 0) confidence += 0.15;
    if (shelterCount >= 3) confidence += 0.1;
    if (shelterCount >= 5) confidence += 0.05;
    return Math.min(Math.round(confidence * 100) / 100, 1);
  }

  private buildSummary(
    dto: RiskRequestDto,
    riskLevel: string,
    nearest: { shelter: ShelterResult; distance: number } | undefined,
    totalShelters: number,
    climateResults: ClimateRiskResult[],
  ): string {
    const location = dto.bairro ? `${dto.bairro}, Salvador` : 'Salvador';

    const climatePart = climateResults.length > 0
      ? (() => {
          const precip = Number(climateResults[0].metadata.precip_total ?? 0);
          return precip > 0
            ? ` Histórico climático similar registra precipitação de ${precip.toFixed(1)}mm.`
            : ' Dados climáticos históricos consultados.';
        })()
      : '';

    if (!nearest) {
      return `Análise para ${location}. Nível de risco: ${riskLevel}.${climatePart} Nenhum abrigo encontrado.`;
    }

    const distStr = nearest.distance < 1000
      ? `${Math.round(nearest.distance)}m`
      : `${(nearest.distance / 1000).toFixed(1)}km`;

    return (
      `Análise para ${location}. Nível de risco: ${riskLevel}.${climatePart} ` +
      `Abrigo mais próximo: ${nearest.shelter.metadata.nome} (${distStr}). ` +
      `${totalShelters} abrigos disponíveis na região.`
    );
  }

  private getEmergencyContacts(): EmergencyContactDto[] {
    return [
      { orgao: 'CODESAL Salvador', telefone: '199', tipo: 'defesa_civil' },
      { orgao: 'Defesa Civil Estadual', telefone: '(71) 3116-5399', tipo: 'defesa_civil' },
      { orgao: 'SAMU', telefone: '192', tipo: 'saude' },
      { orgao: 'Bombeiros', telefone: '193', tipo: 'bombeiros' },
    ];
  }
}
