import { ClimateRecord } from '../../domain/entities/climate-record.entity';

export class SearchResultDto {
  id: string;
  document: string;
  relevanceScore: number;
  isExtremeEvent: boolean;
  metadata: {
    estacao: string;
    data: string;
    precipTotal: number;
    tempMedia: number;
    tempMax: number;
    tempMin: number;
  };
}

export class SearchResponseDto {
  results: SearchResultDto[];
  total: number;
  query: string;
  collection: string;
  elapsedMs: number;

  static fromRecords(
    records: ClimateRecord[],
    query: string,
    collection: string,
    elapsedMs: number,
  ): SearchResponseDto {
    const response = new SearchResponseDto();
    response.query = query;
    response.collection = collection;
    response.total = records.length;
    response.elapsedMs = elapsedMs;
    response.results = records.map((r) => ({
      id: r.id,
      document: r.document,
      relevanceScore: Math.round(r.relevanceScore * 1000) / 1000,
      isExtremeEvent: r.isExtremeEvent,
      metadata: {
        estacao: r.metadata.estacao,
        data: r.metadata.data,
        precipTotal: r.metadata.precipTotal,
        tempMedia: r.metadata.tempMedia,
        tempMax: r.metadata.tempMax,
        tempMin: r.metadata.tempMin,
      },
    }));
    return response;
  }
}
