export interface ClimateRiskResult {
  id: string;
  document: string;
  metadata: {
    precip_total?: number;
    temp_media?: number;
    temp_max?: number;
    temp_min?: number;
    estacao?: string;
    data?: string;
    [key: string]: unknown;
  };
  distance: number;
}

export interface IClimateRiskRepository {
  searchRisk(query: string, topK?: number): Promise<ClimateRiskResult[]>;
}

export const CLIMATE_RISK_REPOSITORY = Symbol('IClimateRiskRepository');
