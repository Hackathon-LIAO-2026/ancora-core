import { Injectable, Inject } from '@nestjs/common';
import { ClimateRecord } from '../../../domain/entities/climate-record.entity';
import { SearchQuery } from '../../../domain/value-objects/search-query.vo';
import {
  IClimateRepository,
  CLIMATE_REPOSITORY,
} from '../../../domain/interfaces/climate-repository.interface';

/**
 * Estratégia 1 — Busca Semântica (HNSW nativo do ChromaDB).
 *
 * O ChromaDB usa internamente o algoritmo HNSW (Hierarchical Navigable Small World),
 * que é um grafo navegável multicamada para busca aproximada de vizinhos mais próximos.
 *
 * Complexidade: O(log n) — muito mais eficiente que BFS/DFS linear O(n).
 * Precisão: ~95% recall@10 comparado com busca exata.
 */
@Injectable()
export class SemanticSearchStrategy {
  constructor(
    @Inject(CLIMATE_REPOSITORY)
    private readonly repository: IClimateRepository,
  ) {}

  async execute(query: SearchQuery): Promise<ClimateRecord[]> {
    return this.repository.semanticSearch(query);
  }
}
