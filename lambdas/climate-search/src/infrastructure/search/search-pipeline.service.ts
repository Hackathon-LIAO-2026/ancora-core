import { Injectable, Logger } from '@nestjs/common';
import { ClimateRecord } from '../../domain/entities/climate-record.entity';
import { SearchQuery } from '../../domain/value-objects/search-query.vo';
import { SemanticSearchStrategy } from './strategies/semantic-search.strategy';
import { MetadataFilterStrategy } from './strategies/metadata-filter.strategy';
import { RerankingStrategy } from './strategies/reranking.strategy';

/**
 * Pipeline de busca — orquestra as estratégias em sequência.
 *
 * Fluxo:
 *   1. Se há filtros de metadata → MetadataFilter (pré-filtra + busca semântica)
 *   2. Se não há filtros → SemanticSearch puro (HNSW)
 *   3. Sempre → Re-ranking (recalcula relevância com múltiplos fatores)
 *
 * O pipeline é extensível: novas estratégias podem ser adicionadas
 * sem alterar o fluxo existente (Open/Closed Principle).
 */
@Injectable()
export class SearchPipelineService {
  private readonly logger = new Logger(SearchPipelineService.name);

  constructor(
    private readonly semanticSearch: SemanticSearchStrategy,
    private readonly metadataFilter: MetadataFilterStrategy,
    private readonly reranking: RerankingStrategy,
  ) {}

  async search(query: SearchQuery): Promise<ClimateRecord[]> {
    const start = Date.now();

    // Etapa 1: Busca (com ou sem filtros)
    let candidates: ClimateRecord[];

    if (query.filters && Object.keys(query.filters).length > 0) {
      this.logger.debug('Pipeline: MetadataFilter + Semantic');
      candidates = await this.metadataFilter.execute(query);
    } else {
      this.logger.debug('Pipeline: Semantic Search puro');
      candidates = await this.semanticSearch.execute(query);
    }

    if (candidates.length === 0) {
      this.logger.warn(`Nenhum resultado para: "${query.text}"`);
      return [];
    }

    // Etapa 2: Re-ranking
    const ranked = this.reranking.execute(candidates);

    const elapsed = Date.now() - start;
    this.logger.log(
      `Busca concluída: ${ranked.length} resultados em ${elapsed}ms`,
    );

    return ranked;
  }
}
