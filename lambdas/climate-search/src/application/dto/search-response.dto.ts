import { ClimateRecord } from '../../domain/entities/climate-record.entity';
import { EmergencyContact } from '../find-emergency-contact.use-case';

/**
 * Response que a Lambda retorna pro n8n.
 * O n8n passa esse JSON pro Gemini gerar a resposta empática.
 */
export class ClimateContextDto {
  document: string;
  data: string;
  precipTotal: number;
  tempMedia: number;
  tempMax: number;
  isExtremeEvent: boolean;
  relevanceScore: number;
}

export class SearchResponseDto {
  /** Nível de risco calculado com base nos dados históricos */
  riskLevel: 'BAIXO' | 'MÉDIO' | 'ALTO' | 'CRÍTICO';

  /** Confiança da previsão (0 a 1) */
  confidence: number;

  /** Resumo textual para a LLM usar na resposta */
  summary: string;

  /** Padrão histórico identificado */
  historicalPattern: string;

  /** Contexto climático (registros relevantes) */
  context: ClimateContextDto[];

  /** Metadados da busca */
  meta: {
    cidade: string;
    collection: string;
    totalResults: number;
    elapsedMs: number;
  };

  /** Órgãos de emergência recomendados (aparece quando riskLevel >= ALTO) */
  emergencyContacts: EmergencyContact[];

  static fromRecords(
    records: ClimateRecord[],
    cidade: string,
    collection: string,
    elapsedMs: number,
  ): SearchResponseDto {
    const response = new SearchResponseDto();

    // Calcular risco baseado nos registros encontrados
    const extremeCount = records.filter((r) => r.isExtremeEvent).length;
    const avgPrecip = records.length > 0
      ? records.reduce((sum, r) => sum + r.metadata.precipTotal, 0) / records.length
      : 0;

    response.riskLevel = SearchResponseDto.calculateRiskLevel(extremeCount, avgPrecip, records.length);
    response.confidence = SearchResponseDto.calculateConfidence(records);

    response.summary = SearchResponseDto.buildSummary(records, cidade, response.riskLevel);
    response.historicalPattern = SearchResponseDto.buildPattern(records);

    response.context = records.slice(0, 5).map((r) => ({
      document: r.document,
      data: r.metadata.data,
      precipTotal: r.metadata.precipTotal,
      tempMedia: r.metadata.tempMedia,
      tempMax: r.metadata.tempMax,
      isExtremeEvent: r.isExtremeEvent,
      relevanceScore: Math.round(r.relevanceScore * 1000) / 1000,
    }));

    response.meta = {
      cidade,
      collection,
      totalResults: records.length,
      elapsedMs,
    };

    return response;
  }

  private static calculateRiskLevel(
    extremeCount: number,
    avgPrecip: number,
    totalResults: number,
  ): 'BAIXO' | 'MÉDIO' | 'ALTO' | 'CRÍTICO' {
    if (totalResults === 0) return 'BAIXO';

    const extremeRatio = extremeCount / totalResults;

    if (extremeRatio >= 0.6 || avgPrecip > 80) return 'CRÍTICO';
    if (extremeRatio >= 0.4 || avgPrecip > 50) return 'ALTO';
    if (extremeRatio >= 0.2 || avgPrecip > 30) return 'MÉDIO';
    return 'BAIXO';
  }

  private static calculateConfidence(records: ClimateRecord[]): number {
    if (records.length === 0) return 0;

    // Confiança baseada na quantidade e qualidade dos resultados
    const quantityFactor = Math.min(records.length / 10, 1);
    const qualityFactor = records.length > 0
      ? records.reduce((sum, r) => sum + r.relevanceScore, 0) / records.length
      : 0;

    return Math.round((quantityFactor * 0.4 + qualityFactor * 0.6) * 100) / 100;
  }

  private static buildSummary(
    records: ClimateRecord[],
    cidade: string,
    riskLevel: string,
  ): string {
    if (records.length === 0) {
      return `Sem dados históricos suficientes para ${cidade}.`;
    }

    const extremeCount = records.filter((r) => r.isExtremeEvent).length;
    const avgPrecip = records.reduce((sum, r) => sum + r.metadata.precipTotal, 0) / records.length;

    return (
      `Análise de ${records.length} registros históricos para ${cidade}. ` +
      `${extremeCount} eventos extremos identificados. ` +
      `Precipitação média: ${avgPrecip.toFixed(1)}mm. ` +
      `Nível de risco: ${riskLevel}.`
    );
  }

  private static buildPattern(records: ClimateRecord[]): string {
    if (records.length === 0) return 'Sem padrão identificado.';

    const extremes = records.filter((r) => r.isExtremeEvent);
    if (extremes.length === 0) {
      return 'Histórico sem eventos extremos recentes nesta região.';
    }

    const maxPrecip = Math.max(...records.map((r) => r.metadata.precipTotal));
    const dates = extremes.map((r) => r.metadata.data).slice(0, 3);

    return (
      `Padrão identificado: ${extremes.length} eventos extremos nos registros similares. ` +
      `Precipitação máxima registrada: ${maxPrecip.toFixed(1)}mm. ` +
      `Datas relevantes: ${dates.join(', ')}.`
    );
  }
}
