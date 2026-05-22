import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChromaClient, Collection } from 'chromadb';
import { IClimateRepository } from '../../domain/interfaces/climate-repository.interface';
import { ClimateRecord, ClimateMetadata } from '../../domain/entities/climate-record.entity';
import { SearchQuery } from '../../domain/value-objects/search-query.vo';

@Injectable()
export class ChromaDbClimateRepository implements IClimateRepository, OnModuleInit {
  private client: ChromaClient;
  private readonly logger = new Logger(ChromaDbClimateRepository.name);

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    const host = this.config.get<string>('CHROMA_HOST', 'localhost');
    const port = this.config.get<number>('CHROMA_PORT', 8000);

    this.client = new ChromaClient({
      host,
      port: Number(port),
      ssl: false,
    });

    this.logger.log(`ChromaDB conectado em ${host}:${port}`);
  }

  async semanticSearch(query: SearchQuery): Promise<ClimateRecord[]> {
    const collection = await this.getCollection(query.collection);

    const results = await collection.query({
      queryTexts: [query.expandedText],
      nResults: query.topK,
    });

    return this.mapResults(results);
  }

  async filteredSearch(
    query: SearchQuery,
    where?: Record<string, unknown>,
  ): Promise<ClimateRecord[]> {
    const collection = await this.getCollection(query.collection);

    const queryParams: any = {
      queryTexts: [query.expandedText],
      nResults: query.topK,
    };

    if (where && Object.keys(where).length > 0) {
      queryParams.where = where;
    }

    const results = await collection.query(queryParams);
    return this.mapResults(results);
  }

  async healthCheck(collectionName: string): Promise<{ ok: boolean; count: number }> {
    try {
      const collection = await this.getCollection(collectionName);
      const count = await collection.count();
      return { ok: true, count };
    } catch {
      return { ok: false, count: 0 };
    }
  }

  private async getCollection(name: string): Promise<Collection> {
    return this.client.getCollection({ name });
  }

  private mapResults(results: any): ClimateRecord[] {
    if (!results.ids?.[0]?.length) return [];

    return results.ids[0].map((id: string, i: number) => {
      const meta = results.metadatas[0][i] || {};
      const metadata: ClimateMetadata = {
        estacao: meta.estacao || '',
        data: meta.data || '',
        precipTotal: meta.precip_total || 0,
        tempMedia: meta.temp_media || 0,
        tempMax: meta.temp_max || 0,
        tempMin: meta.temp_min || 0,
      };

      return new ClimateRecord(
        id,
        results.documents[0][i] || '',
        metadata,
        results.distances?.[0]?.[i] || 0,
      );
    });
  }
}
