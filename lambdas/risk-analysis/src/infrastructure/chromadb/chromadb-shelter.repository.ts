import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChromaClient, Collection } from 'chromadb';
import { DefaultEmbeddingFunction } from '@chroma-core/default-embed';
import {
  IShelterRepository,
  ShelterResult,
} from '../../domain/interfaces/shelter-repository.interface';

/**
 * Implementação concreta do repositório de abrigos usando ChromaDB.
 * Busca semântica na collection `abrigos_salvador`.
 */
@Injectable()
export class ChromaDbShelterRepository implements IShelterRepository, OnModuleInit {
  private client: ChromaClient;
  private embedFn: DefaultEmbeddingFunction;
  private readonly logger = new Logger(ChromaDbShelterRepository.name);
  private readonly COLLECTION = 'abrigos_salvador';

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    const host = this.config.get<string>('CHROMA_HOST', 'localhost');
    const port = this.config.get<number>('CHROMA_PORT', 8000);

    this.client = new ChromaClient({
      host,
      port: Number(port),
      ssl: false,
    });
    this.embedFn = new DefaultEmbeddingFunction();

    this.logger.log(`ChromaDB conectado em ${host}:${port}`);
  }

  async searchShelters(query: string, topK = 10): Promise<ShelterResult[]> {
    try {
      const collection = await this.getCollection();
      const results = await collection.query({ queryTexts: [query], nResults: topK });
      return this.mapResults(results);
    } catch (err) {
      this.logger.warn(`searchShelters falhou (collection pode não existir ainda): ${err.message}`);
      return [];
    }
  }

  async searchByBairro(bairro: string, topK = 10): Promise<ShelterResult[]> {
    try {
      const collection = await this.getCollection();
      const results = await collection.query({
        queryTexts: [`abrigo ${bairro} Salvador`],
        nResults: topK,
      });
      return this.mapResults(results);
    } catch (err) {
      this.logger.warn(`searchByBairro falhou (collection pode não existir ainda): ${err.message}`);
      return [];
    }
  }

  async healthCheck(): Promise<{ ok: boolean; count: number }> {
    try {
      const collection = await this.getCollection();
      const count = await collection.count();
      return { ok: true, count };
    } catch {
      return { ok: false, count: 0 };
    }
  }

  private async getCollection(): Promise<Collection> {
    return this.client.getCollection({ name: this.COLLECTION, embeddingFunction: this.embedFn });
  }

  private mapResults(results: any): ShelterResult[] {
    if (!results.ids?.[0]?.length) return [];

    return results.ids[0].map((id: string, i: number) => {
      const meta = results.metadatas[0][i] || {};
      return {
        id,
        document: results.documents[0][i] || '',
        metadata: {
          nome: meta.nome || '',
          bairro: meta.bairro || '',
          endereco: meta.endereco || '',
          latitude: meta.latitude || -12.9714,
          longitude: meta.longitude || -38.5014,
          area_risco: meta.area_risco || '',
          // Campos invertidos na ingestão original (CSV com vírgulas em aspas)
          modo_ativacao: meta.servicos || '',
          servicos: meta.modo_ativacao || '',
          telefone: meta.telefone || undefined,
        },
        distance: results.distances?.[0]?.[i] || 0,
      };
    });
  }
}
