import { Injectable } from '@nestjs/common';
import { ClimateRecord } from '../../../domain/entities/climate-record.entity';
import { RelevanceScore } from '../../../domain/value-objects/relevance-score.vo';

/**
 * Estratégia 3 — Re-ranking com score ponderado.
 *
 * Após a busca semântica retornar candidatos, este módulo recalcula
 * a relevância usando múltiplos fatores:
 *   - Similaridade semântica (distância vetorial)
 *   - Recência (dados mais recentes pesam mais)
 *   - Severidade (eventos extremos são priorizados)
 *   - Cluster bonus (resultados que formam padrão temporal)
 *
 * Inspirado em Learning-to-Rank (LTR) simplificado.
 */
@Injectable()
export class RerankingStrategy {
  execute(records: ClimateRecord[]): ClimateRecord[] {
    if (records.length === 0) return [];

    const scored = records.map((record) => {
      const similarity = RelevanceScore.fromDistance(record.distance);
      const recency = this.calculateRecencyBoost(record.metadata.data);
      const severity = record.severityScore;
      const cluster = this.calculateClusterBonus(record, records);

      const score = new RelevanceScore(similarity, recency, severity, cluster);
      return record.withRelevanceScore(score.total);
    });

    // Ordena por relevância total (maior primeiro)
    return scored.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * Boost de recência — dados mais recentes são mais relevantes.
   * Decai exponencialmente: dados de hoje = 1.0, 1 ano atrás = ~0.37
   */
  private calculateRecencyBoost(dateStr: string): number {
    try {
      const recordDate = new Date(dateStr);
      const now = new Date();
      const daysDiff = (now.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24);
      // Decay exponencial com half-life de 365 dias
      return Math.exp(-daysDiff / 365);
    } catch {
      return 0.5; // fallback para datas inválidas
    }
  }

  /**
   * Cluster bonus — se múltiplos resultados são da mesma estação/período,
   * isso indica um padrão climático consistente (mais confiável).
   */
  private calculateClusterBonus(
    record: ClimateRecord,
    allRecords: ClimateRecord[],
  ): number {
    const sameStation = allRecords.filter(
      (r) => r.metadata.estacao === record.metadata.estacao && r.id !== record.id,
    );

    // Quanto mais resultados da mesma estação, maior o bonus
    return Math.min(sameStation.length / 5, 1.0);
  }
}
