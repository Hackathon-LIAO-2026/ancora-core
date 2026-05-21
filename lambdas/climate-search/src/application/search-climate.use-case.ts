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

  async execute(dto: SearchRequestDto): Promise<SearchResponseDto> {
    const start = Date.now();

    // Validação de domínio — Salvador não pertence a esta Lambda
    this.validateCidade(dto.cidade);

    // Rotear para a collection correta baseado na cidade
    const collection = this.resolveCollection(dto.cidade);

    // Montar texto de busca a partir do payload do Gemini
    const searchText = this.buildSearchText(dto);

    const query = new SearchQuery({
      text: searchText,
      collection,
      topK: 10,
    });

    this.logger.log(
      `[${dto.cidade}] Buscando em "${collection}": "${searchText}" (intenção: ${dto.intencao || 'geral'})`,
    );

    // Executa pipeline de busca (semantic + filter + reranking)
    const records = await this.searchPipeline.search(query);

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

  constructor(
    private readonly searchPipeline: SearchPipelineService,
    private readonly findEmergencyContact: FindEmergencyContactUseCase,
  ) {}

  /**
   * Valida que a cidade não é Salvador.
   * Salvador deve ser roteada para a Lambda 2 (risk-analysis).
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
   * Esta Lambda atende APENAS cidades fora de Salvador.
   * Salvador é responsabilidade da Lambda 2 (risk-analysis).
   */
  private resolveCollection(cidade: string): string {
    return 'clima_bahia';
  }

  /**
   * Monta o texto de busca semântica a partir do payload do Gemini.
   * Combina cidade + bairro + intenção + mensagem original pra
   * maximizar a qualidade da busca vetorial.
   */
  private buildSearchText(dto: SearchRequestDto): string {
    const parts: string[] = [];

    // Contexto geográfico
    parts.push(dto.cidade);
    if (dto.bairro) parts.push(dto.bairro);

    // Intenção mapeada pra termos climáticos
    const intencaoMap: Record<string, string> = {
      risco_chuva: 'chuva forte precipitação alta risco alagamento',
      previsao: 'previsão tempo clima temperatura',
      alagamento: 'alagamento enchente precipitação extrema inundação',
      clima_geral: 'clima temperatura umidade vento',
      historico: 'histórico dados passado registros',
    };

    if (dto.intencao && intencaoMap[dto.intencao]) {
      parts.push(intencaoMap[dto.intencao]);
    }

    // Mensagem original da usuária (contexto rico)
    if (dto.mensagemOriginal) {
      parts.push(dto.mensagemOriginal);
    }

    return parts.join(' ');
  }
}
