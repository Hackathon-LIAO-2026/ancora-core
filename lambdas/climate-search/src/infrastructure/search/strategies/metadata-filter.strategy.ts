import { Injectable, Inject } from '@nestjs/common';
import { ClimateRecord } from '../../../domain/entities/climate-record.entity';
import { SearchQuery, MetadataFilter } from '../../../domain/value-objects/search-query.vo';
import {
  IClimateRepository,
  CLIMATE_REPOSITORY,
} from '../../../domain/interfaces/climate-repository.interface';

/**
 * Estratégia 2 — Filtragem por Metadata.
 *
 * Reduz o espaço de busca antes da comparação vetorial.
 * Equivalente a um "pré-filtro" que elimina documentos irrelevantes
 * antes do HNSW calcular distâncias — melhora precisão e performance.
 */
@Injectable()
export class MetadataFilterStrategy {
  constructor(
    @Inject(CLIMATE_REPOSITORY)
    private readonly repository: IClimateRepository,
  ) {}

  async execute(query: SearchQuery): Promise<ClimateRecord[]> {
    const where = this.buildWhereClause(query.filters);

    if (!where) {
      return this.repository.semanticSearch(query);
    }

    return this.repository.filteredSearch(query, where);
  }

  private buildWhereClause(
    filters?: MetadataFilter,
  ): Record<string, unknown> | null {
    if (!filters) return null;

    const conditions: Record<string, unknown>[] = [];

    if (filters.estacao) {
      conditions.push({ estacao: { $eq: filters.estacao } });
    }

    if (filters.precipMin !== undefined) {
      conditions.push({ precip_total: { $gte: filters.precipMin } });
    }

    if (filters.precipMax !== undefined) {
      conditions.push({ precip_total: { $lte: filters.precipMax } });
    }

    if (conditions.length === 0) return null;
    if (conditions.length === 1) return conditions[0];

    return { $and: conditions };
  }
}
