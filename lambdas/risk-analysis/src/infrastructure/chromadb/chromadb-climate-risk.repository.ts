import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChromaClient } from 'chromadb';
import { DefaultEmbeddingFunction } from '@chroma-core/default-embed';
import {
  IClimateRiskRepository,
  ClimateRiskResult,
} from '../../domain/interfaces/climate-risk-repository.interface';

@Injectable()
export class ChromaDbClimateRiskRepository
  implements IClimateRiskRepository, OnModuleInit
{
  private client: ChromaClient;
  private embedFn: DefaultEmbeddingFunction;
  private readonly logger = new Logger(ChromaDbClimateRiskRepository.name);

  // Tenta clima_salvador (mais específico) depois clima_bahia (mais abrangente)
  private readonly COLLECTIONS = ['clima_salvador', 'clima_bahia'];

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    const host = this.config.get<string>('CHROMA_HOST', 'localhost');
    const port = this.config.get<number>('CHROMA_PORT', 8000);
    this.client = new ChromaClient({ host, port: Number(port), ssl: false });
    this.embedFn = new DefaultEmbeddingFunction();
    this.logger.log(`ChromaDB climate-risk conectado em ${host}:${port}`);
  }

  async searchRisk(query: string, topK = 5): Promise<ClimateRiskResult[]> {
    for (const name of this.COLLECTIONS) {
      try {
        const collection = await this.client.getCollection({
          name,
          embeddingFunction: this.embedFn,
        });
        const results = await collection.query({ queryTexts: [query], nResults: topK });
        const mapped = this.mapResults(results);
        if (mapped.length > 0) {
          this.logger.debug(`Risco vetorial em '${name}': ${mapped.length} docs`);
          return mapped;
        }
      } catch (err) {
        this.logger.debug(`Collection '${name}' indisponível: ${(err as Error).message}`);
      }
    }
    return [];
  }

  private mapResults(results: any): ClimateRiskResult[] {
    if (!results.ids?.[0]?.length) return [];
    return results.ids[0].map((id: string, i: number) => ({
      id,
      document: results.documents[0][i] || '',
      metadata: results.metadatas[0][i] || {},
      distance: results.distances?.[0]?.[i] || 0,
    }));
  }
}
