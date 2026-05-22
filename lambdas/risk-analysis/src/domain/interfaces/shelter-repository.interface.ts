/**
 * Interface do repositório de abrigos.
 * Segue Dependency Inversion — domínio define o contrato,
 * infraestrutura implementa (ChromaDB).
 */
export interface ShelterResult {
  id: string;
  document: string;
  metadata: {
    nome: string;
    bairro: string;
    endereco: string;
    latitude: number;
    longitude: number;
    area_risco: string;
    modo_ativacao: string;
    servicos: string;
    telefone?: string;
  };
  distance: number;
}

export interface IShelterRepository {
  /**
   * Busca semântica por abrigos relevantes ao contexto.
   */
  searchShelters(query: string, topK?: number): Promise<ShelterResult[]>;

  /**
   * Busca abrigos por bairro (filtro de metadata).
   */
  searchByBairro(bairro: string, topK?: number): Promise<ShelterResult[]>;

  /**
   * Verifica se a collection existe e está populada.
   */
  healthCheck(): Promise<{ ok: boolean; count: number }>;
}

export const SHELTER_REPOSITORY = Symbol('IShelterRepository');
