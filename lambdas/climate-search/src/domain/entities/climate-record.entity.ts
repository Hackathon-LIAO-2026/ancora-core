/**
 * Entidade de domínio — representa um registro climático retornado do ChromaDB.
 * Imutável após criação (Value Object semantics).
 */
export class ClimateRecord {
  constructor(
    public readonly id: string,
    public readonly document: string,
    public readonly metadata: ClimateMetadata,
    public readonly distance: number,
    public readonly relevanceScore: number = 0,
  ) {}

  /**
   * Calcula score de severidade climática baseado nos metadados.
   * Usado no re-ranking para priorizar eventos extremos.
   */
  get severityScore(): number {
    const precipWeight = Math.min(this.metadata.precipTotal / 100, 1) * 0.5;
    const tempWeight = this.metadata.tempMax > 35 ? 0.3 : 0;
    const windWeight = Math.min((this.metadata.rajaMax || 0) / 80, 1) * 0.2;
    return precipWeight + tempWeight + windWeight;
  }

  /**
   * Verifica se o registro representa um evento climático extremo.
   */
  get isExtremeEvent(): boolean {
    return (
      this.metadata.precipTotal > 50 ||
      this.metadata.tempMax > 38 ||
      (this.metadata.rajaMax || 0) > 60
    );
  }

  withRelevanceScore(score: number): ClimateRecord {
    return new ClimateRecord(
      this.id,
      this.document,
      this.metadata,
      this.distance,
      score,
    );
  }
}

export interface ClimateMetadata {
  estacao: string;
  data: string;
  precipTotal: number;
  tempMedia: number;
  tempMax: number;
  tempMin: number;
  rajaMax?: number;
}
