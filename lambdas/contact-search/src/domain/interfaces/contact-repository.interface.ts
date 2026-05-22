/**
 * Interface do repositório de contatos.
 */
export interface ContactResult {
  id: string;
  document: string;
  metadata: {
    nome: string;
    primeiro_nome: string;
    telefone: string;
    formato_e164: string;
    ddd: string;
    estado: string;
    tipo_numero: string;
  };
  distance: number;
}

export interface IContactRepository {
  /**
   * Busca semântica por contatos relevantes.
   */
  searchContacts(query: string, topK?: number): Promise<ContactResult[]>;

  /**
   * Retorna todos os contatos cadastrados.
   */
  listAll(): Promise<ContactResult[]>;

  /**
   * Busca contatos por região/DDD.
   */
  searchByRegion(region: string, topK?: number): Promise<ContactResult[]>;

  /**
   * Healthcheck da collection.
   */
  healthCheck(): Promise<{ ok: boolean; count: number }>;
}

export const CONTACT_REPOSITORY = Symbol('IContactRepository');
