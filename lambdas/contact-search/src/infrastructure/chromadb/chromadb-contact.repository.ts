import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChromaClient, Collection } from 'chromadb';
import {
  IContactRepository,
  ContactResult,
} from '../../domain/interfaces/contact-repository.interface';

@Injectable()
export class ChromaDbContactRepository implements IContactRepository, OnModuleInit {
  private client: ChromaClient;
  private readonly logger = new Logger(ChromaDbContactRepository.name);
  private readonly COLLECTION = 'contatos';

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    const host = this.config.get<string>('CHROMA_HOST', 'localhost');
    const port = this.config.get<number>('CHROMA_PORT', 8000);

    this.client = new ChromaClient({
      path: `http://${host}:${port}`,
    });

    this.logger.log(`ChromaDB conectado em ${host}:${port}`);
  }

  async searchContacts(query: string, topK = 10): Promise<ContactResult[]> {
    const collection = await this.getCollection();

    const results = await collection.query({
      queryTexts: [query],
      nResults: topK,
    });

    return this.mapResults(results);
  }

  async listAll(): Promise<ContactResult[]> {
    const collection = await this.getCollection();

    // Get all documents (sem filtro semântico)
    const count = await collection.count();
    const results = await collection.get({
      limit: count || 100,
    });

    return this.mapGetResults(results);
  }

  async searchByRegion(region: string, topK = 10): Promise<ContactResult[]> {
    const collection = await this.getCollection();

    const results = await collection.query({
      queryTexts: [`contato ${region} Bahia`],
      nResults: topK,
    });

    return this.mapResults(results);
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
    return this.client.getCollection({ name: this.COLLECTION });
  }

  private mapResults(results: any): ContactResult[] {
    if (!results.ids?.[0]?.length) return [];

    return results.ids[0].map((id: string, i: number) => {
      const meta = results.metadatas[0][i] || {};
      return {
        id,
        document: results.documents[0][i] || '',
        metadata: {
          nome: meta.nome || '',
          primeiro_nome: meta.primeiro_nome || '',
          telefone: meta.telefone || '',
          formato_e164: meta.formato_e164 || '',
          ddd: meta.ddd || '',
          estado: meta.estado || '',
          tipo_numero: meta.tipo_numero || '',
        },
        distance: results.distances?.[0]?.[i] || 0,
      };
    });
  }

  private mapGetResults(results: any): ContactResult[] {
    if (!results.ids?.length) return [];

    return results.ids.map((id: string, i: number) => {
      const meta = results.metadatas[i] || {};
      return {
        id,
        document: results.documents[i] || '',
        metadata: {
          nome: meta.nome || '',
          primeiro_nome: meta.primeiro_nome || '',
          telefone: meta.telefone || '',
          formato_e164: meta.formato_e164 || '',
          ddd: meta.ddd || '',
          estado: meta.estado || '',
          tipo_numero: meta.tipo_numero || '',
        },
        distance: 0,
      };
    });
  }
}
