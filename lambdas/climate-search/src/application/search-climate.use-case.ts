import { Injectable, Logger } from '@nestjs/common';
import { SearchQuery } from '../domain/value-objects/search-query.vo';
import { SearchPipelineService } from '../infrastructure/search/search-pipeline.service';
import { SearchRequestDto } from './dto/search-request.dto';
import { SearchResponseDto } from './dto/search-response.dto';

/**
 * Use Case — Buscar contexto climático.
 *
 * Orquestra a busca no ChromaDB usando o pipeline de estratégias.
 * Camada de aplicação: traduz DTOs → Value Objects → chama domínio → retorna DTO.
 */
@Injectable()
export class SearchClimateUseCase {
  private readonly logger = new Logger(SearchClimateUseCase.name);

  constructor(private readonly searchPipeline: SearchPipelineService) {}

  async execute(dto: SearchRequestDto): Promise<SearchResponseDto> {
    const start = Date.now();

    // DTO → Value Object (validação de domínio)
    const query = new SearchQuery({
      text: dto.query,
      collection: dto.collection,
      topK: dto.topK,
      filters: {
        estacao: dto.estacao,
        precipMin: dto.precipMin,
        precipMax: dto.precipMax,
      },
    });

    this.logger.log(
      `Buscando: "${query.text}" na collection "${query.collection}" (top ${query.topK})`,
    );

    // Executa pipeline de busca
    const records = await this.searchPipeline.search(query);

    const elapsed = Date.now() - start;

    return SearchResponseDto.fromRecords(
      records,
      query.text,
      query.collection,
      elapsed,
    );
  }
}
