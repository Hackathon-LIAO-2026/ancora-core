import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { SearchQuery } from '../domain/value-objects/search-query.vo';
import { SearchPipelineService } from '../infrastructure/search/search-pipeline.service';
import { FindEmergencyContactUseCase } from './find-emergency-contact.use-case';
import { SearchRequestDto } from './dto/search-request.dto';
import { SearchResponseDto } from './dto/search-response.dto';

/**
 * Use Case — Buscar contexto climático para a LLM.
 *
 * Recebe o payload extraído pelo Gemini (cidade, lat/lng, intenção),
 * decide qual collection consultar, executa o pipeline de busca,
 * e retorna um JSON estruturado pro n8n/Gemini gerar a resposta.
 */
@Injectable()
export class SearchClimateUseCase {
  private readonly logger = new Logger(SearchClimateUseCase.name);

  // Cidades que NÃO devem ser atendidas por esta Lambda (vão pra Lambda 2)
  private readonly SALVADOR_VARIANTS = [
    'salvador', 'ssa', 'soteropolis',
  ];

  /**
   * Flags de filtro automático por intenção.
   * Garante que a busca retorne dados relevantes ao contexto.
   *
   * Ex: se a intenção é "alagamento", só retorna registros com precipitação >= 20mm.
   * Isso evita que a busca semântica traga dias secos só porque a estação é próxima.
   */
  private readonly INTENT_FILTERS: Record<string, { precipMin?: number; precipMax?: number }> = {
    alagamento: { precipMin: 20 },
    risco_chuva: { precipMin: 10 },
    previsao: {},
    clima_geral: {},
    historico: {},
  };

  constructor(
    private readonly searchPipeline: SearchPipelineService,
    private readonly findEmergencyContact: FindEmergencyContactUseCase,
  ) {}

  async execute(dto: SearchRequestDto): Promise<SearchResponseDto> {
    const start = Date.now();

    // Validação de domínio — Salvador não pertence a esta Lambda
    this.validateCidade(dto.cidade);

    // Rotear para a collection correta
    const collection = this.resolveCollection(dto.cidade);

    // Montar texto de busca
    const searchText = this.buildSearchText(dto);

    // Resolver flags de filtro baseado na intenção
    const intentFilter = this.resolveIntentFilters(dto.intencao);

    const query = new SearchQuery({
      text: searchText,
      collection,
      topK: 20, // Busca mais candidatos pra compensar filtros
      filters: {
        precipMin: intentFilter.precipMin,
        precipMax: intentFilter.precipMax,
      },
    });

    this.logger.log(
      `[${dto.cidade}] Buscando em "${collection}" | intenção: ${dto.intencao || 'geral'} | ` +
      `filtros: precipMin=${intentFilter.precipMin || 'N/A'}`,
    );

    // Executa pipeline de busca (semantic + metadata filter + reranking)
    let records = await this.searchPipeline.search(query);

    // Fallback: se filtro restritivo não retornou resultados, tenta sem filtro
    if (records.length === 0 && intentFilter.precipMin) {
      this.logger.warn(
        `[${dto.cidade}] Nenhum resultado com filtro precipMin=${intentFilter.precipMin}. Tentando sem filtro...`,
      );
      const fallbackQuery = new SearchQuery({
        text: searchText,
        collection,
        topK: 10,
      });
      records = await this.searchPipeline.search(fallbackQuery);
    }

    const elapsed = Date.now() - start;

    this.logger.log(
      `[${dto.cidade}] ${records.length} resultados em ${elapsed}ms`,
    );

    // Monta response com risco
    const response = SearchResponseDto.fromRecords(records, dto.cidade, collection, elapsed);

    // Busca órgãos de emergência baseado no riskLevel
    response.emergencyContacts = await this.findEmergencyContact.execute(
      response.riskLevel,
      dto.cidade,
    );

    return response;
  }

  /**
   * Valida que a cidade não é Salvador.
   */
  private validateCidade(cidade: string): void {
    const normalized = cidade.toLowerCase().trim();
    if (this.SALVADOR_VARIANTS.includes(normalized)) {
      throw new BadRequestException(
        `Cidade "${cidade}" deve ser roteada para a Lambda 2 (risk-analysis). ` +
        `Esta Lambda atende apenas cidades fora de Salvador.`,
      );
    }
  }

  /**
   * Decide qual collection usar.
   */
  private resolveCollection(cidade: string): string {
    return 'clima_bahia';
  }

  /**
   * Resolve flags de filtro automático baseado na intenção.
   * Intenções de risco/alagamento exigem precipitação mínima
   * pra evitar retornar dias secos irrelevantes.
   */
  private resolveIntentFilters(intencao?: string): { precipMin?: number; precipMax?: number } {
    if (!intencao) return {};
    return this.INTENT_FILTERS[intencao] || {};
  }

  /**
   * Monta o texto de busca semântica a partir do payload do Gemini.
   * Combina cidade + bairro + intenção + mensagem original.
   */
  private buildSearchText(dto: SearchRequestDto): string {
    const parts: string[] = [];

    parts.push(dto.cidade);
    if (dto.bairro) parts.push(dto.bairro);

    // Intenção mapeada pra termos climáticos (expansão de query)
    const intencaoMap: Record<string, string> = {
      risco_chuva: 'chuva forte precipitação alta risco alagamento temporal',
      previsao: 'previsão tempo clima temperatura umidade',
      alagamento: 'alagamento enchente precipitação extrema inundação chuva intensa',
      clima_geral: 'clima temperatura umidade vento pressão',
      historico: 'histórico dados passado registros clima',
    };

    if (dto.intencao && intencaoMap[dto.intencao]) {
      parts.push(intencaoMap[dto.intencao]);
    }

    if (dto.mensagemOriginal) {
      parts.push(dto.mensagemOriginal);
    }

    return parts.join(' ');
  }
}
