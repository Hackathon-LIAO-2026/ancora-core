/**
 * Value Object — score de relevância composto por múltiplos fatores.
 * Usado no re-ranking para ordenar resultados por utilidade real.
 */
export class RelevanceScore {
  constructor(
    public readonly semanticSimilarity: number,
    public readonly recencyBoost: number,
    public readonly severityBoost: number,
    public readonly clusterBonus: number = 0,
  ) {}

  /**
   * Score final ponderado.
   * Pesos calibrados para priorizar:
   *   1. Similaridade semântica (base)
   *   2. Severidade do evento (eventos extremos primeiro)
   *   3. Recência (dados mais recentes são mais relevantes)
   *   4. Cluster bonus (resultados que formam padrão)
   */
  get total(): number {
    return (
      this.semanticSimilarity * 0.40 +
      this.severityBoost * 0.30 +
      this.recencyBoost * 0.20 +
      this.clusterBonus * 0.10
    );
  }

  static fromDistance(distance: number): number {
    // ChromaDB retorna distância (menor = mais similar)
    // Convertemos para similaridade (maior = mais similar)
    return Math.max(0, 1 - distance);
  }
}
