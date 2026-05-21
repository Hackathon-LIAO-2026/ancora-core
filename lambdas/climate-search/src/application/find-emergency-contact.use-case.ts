import { Injectable, Inject, Logger } from '@nestjs/common';
import {
  IClimateRepository,
  CLIMATE_REPOSITORY,
} from '../domain/interfaces/climate-repository.interface';
import { SearchQuery } from '../domain/value-objects/search-query.vo';

export interface EmergencyContact {
  orgao: string;
  telefone: string;
  tipo: string;
  cobertura: string;
}

/**
 * Use Case — Encontrar órgão de emergência adequado.
 *
 * Busca no ChromaDB (collection orgaos_emergencia) o órgão mais
 * relevante baseado no nível de risco e cidade da usuária.
 */
@Injectable()
export class FindEmergencyContactUseCase {
  private readonly logger = new Logger(FindEmergencyContactUseCase.name);

  constructor(
    @Inject(CLIMATE_REPOSITORY)
    private readonly repository: IClimateRepository,
  ) {}

  async execute(
    riskLevel: string,
    cidade: string,
  ): Promise<EmergencyContact[]> {
    // Só retorna contatos quando risco >= ALTO
    if (riskLevel === 'BAIXO' || riskLevel === 'MÉDIO') {
      return [];
    }

    const searchText = `emergência ${riskLevel} ${cidade} defesa civil`;

    const query = new SearchQuery({
      text: searchText,
      collection: 'orgaos_emergencia',
      topK: 5,
    });

    try {
      const records = await this.repository.semanticSearch(query);

      // Filtrar por cobertura relevante (cidade específica, estado ou nacional)
      const cidadeNorm = cidade.toLowerCase();
      const relevant = records.filter((r) => {
        const cobertura = (r.metadata as any).cobertura?.toLowerCase() || '';
        return (
          cobertura === 'nacional' ||
          cobertura === 'bahia' ||
          cobertura.includes(cidadeNorm)
        );
      });

      return relevant.map((r) => ({
        orgao: (r.metadata as any).orgao || '',
        telefone: (r.metadata as any).telefone || '',
        tipo: (r.metadata as any).tipo || '',
        cobertura: (r.metadata as any).cobertura || '',
      }));
    } catch (error) {
      this.logger.warn(`Erro ao buscar órgãos de emergência: ${error.message}`);
      // Fallback — retorna contatos essenciais hardcoded
      return [
        { orgao: 'Defesa Civil Estadual', telefone: '(71) 3116-5399', tipo: 'defesa_civil', cobertura: 'Bahia' },
        { orgao: 'SAMU', telefone: '192', tipo: 'saude', cobertura: 'Nacional' },
        { orgao: 'Bombeiros', telefone: '193', tipo: 'bombeiros', cobertura: 'Nacional' },
      ];
    }
  }
}
