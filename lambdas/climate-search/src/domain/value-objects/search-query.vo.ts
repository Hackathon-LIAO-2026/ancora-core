/**
 * Value Object — encapsula a query de busca com validações de domínio.
 */
export class SearchQuery {
  public readonly text: string;
  public readonly collection: string;
  public readonly topK: number;
  public readonly filters?: MetadataFilter;

  constructor(params: {
    text: string;
    collection?: string;
    topK?: number;
    filters?: MetadataFilter;
  }) {
    if (!params.text || params.text.trim().length === 0) {
      throw new Error('SearchQuery: texto não pode ser vazio');
    }

    this.text = params.text.trim();
    this.collection = params.collection || 'clima_bahia';
    this.topK = Math.min(params.topK || 10, 50); // máximo 50 resultados
    this.filters = params.filters;
  }

  /**
   * Expande a query com termos climáticos sinônimos para melhorar recall.
   */
  get expandedText(): string {
    const expansions: Record<string, string[]> = {
      chuva: ['precipitação', 'temporal', 'alagamento'],
      calor: ['temperatura alta', 'onda de calor'],
      vento: ['rajada', 'ventania', 'vendaval'],
      frio: ['temperatura baixa', 'friagem'],
      seca: ['estiagem', 'sem chuva', 'precipitação zero'],
    };

    let expanded = this.text;
    for (const [term, synonyms] of Object.entries(expansions)) {
      if (this.text.toLowerCase().includes(term)) {
        expanded += ` ${synonyms.join(' ')}`;
        break;
      }
    }
    return expanded;
  }
}

export interface MetadataFilter {
  estacao?: string;
  dataInicio?: string;
  dataFim?: string;
  precipMin?: number;
  precipMax?: number;
}
