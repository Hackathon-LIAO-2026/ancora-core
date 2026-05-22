import { ClimateRecord } from '../entities/climate-record.entity';
import { SearchQuery } from '../value-objects/search-query.vo';

/**
 * Interface do repositório de dados climáticos.
 * Segue Dependency Inversion — domínio define o contrato,
 * infraestrutura implementa.
 */
export interface IClimateRepository {
  /**
   * Busca semântica por similaridade vetorial.
   */
  semanticSearch(query: SearchQuery): Promise<ClimateRecord[]>;

  /**
   * Busca com filtros de metadata (estação, data, precipitação).
   */
  filteredSearch(
    query: SearchQuery,
    where?: Record<string, unknown>,
  ): Promise<ClimateRecord[]>;

  /**
   * Verifica se a collection existe e está populada.
   */
  healthCheck(collection: string): Promise<{ ok: boolean; count: number }>;
}

export const CLIMATE_REPOSITORY = Symbol('IClimateRepository');
