import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { ShelterResult } from '../../domain/interfaces/shelter-repository.interface';

interface ShelterRow {
  id: string;
  nome: string;
  endereco: string;
  bairro: string;
  lat: number;
  lng: number;
  telefone: string;
  area_risco: string;
  modo_ativacao: string;
  servicos: string;
}

@Injectable()
export class ShelterCsvService implements OnModuleInit {
  private readonly logger = new Logger(ShelterCsvService.name);
  private shelters: ShelterRow[] = [];

  onModuleInit() {
    this.shelters = this.loadCsv();
    this.logger.log(`CSV carregado: ${this.shelters.length} abrigos válidos`);
  }

  get count(): number {
    return this.shelters.length;
  }

  /**
   * Busca gulosa k-vizinhos-mais-próximos: O(k*n).
   *
   * Em cada rodada, percorre todos os abrigos restantes e seleciona
   * o de menor distância (greedy minimum). Repete k vezes.
   * Para n=32 e k≤10 isto é mais simples e direto que ordenar todo o array.
   */
  findNearest(lat: number, lng: number, topK = 10): ShelterResult[] {
    const candidates = this.shelters.map((s) => ({
      shelter: s,
      dist: this.haversine(lat, lng, s.lat, s.lng),
    }));

    const result: ShelterResult[] = [];

    for (let i = 0; i < Math.min(topK, candidates.length); i++) {
      let minIdx = 0;
      for (let j = 1; j < candidates.length; j++) {
        if (candidates[j].dist < candidates[minIdx].dist) minIdx = j;
      }
      const { shelter, dist } = candidates[minIdx];
      result.push(this.toResult(shelter, dist));
      candidates.splice(minIdx, 1);
    }

    return result;
  }

  /**
   * Filtra por bairro (correspondência parcial) e aplica busca gulosa
   * por distância dentro do subconjunto encontrado.
   * Se nenhum bairro casar, usa todos os abrigos.
   */
  findByBairro(bairro: string, lat?: number, lng?: number, topK = 10): ShelterResult[] {
    const lower = bairro.toLowerCase();
    const pool = this.shelters.filter((s) =>
      s.bairro.toLowerCase().includes(lower),
    );
    const source = pool.length > 0 ? pool : this.shelters;

    if (lat !== undefined && lng !== undefined) {
      const candidates = source.map((s) => ({
        shelter: s,
        dist: this.haversine(lat, lng, s.lat, s.lng),
      }));
      const result: ShelterResult[] = [];
      for (let i = 0; i < Math.min(topK, candidates.length); i++) {
        let minIdx = 0;
        for (let j = 1; j < candidates.length; j++) {
          if (candidates[j].dist < candidates[minIdx].dist) minIdx = j;
        }
        const { shelter, dist } = candidates[minIdx];
        result.push(this.toResult(shelter, dist));
        candidates.splice(minIdx, 1);
      }
      return result;
    }

    return source.slice(0, topK).map((s) => this.toResult(s, 0));
  }

  private loadCsv(): ShelterRow[] {
    // Sobe 6 níveis de dist/src/infrastructure/csv → raiz do projeto
    const csvPath = path.join(
      __dirname,
      '../../../../../../data/csv/abrigos_salvador_bahia_v2.csv',
    );

    if (!fs.existsSync(csvPath)) {
      this.logger.warn(`CSV não encontrado em: ${csvPath}`);
      return [];
    }

    const lines = fs.readFileSync(csvPath, 'utf-8').split('\n').filter(Boolean);
    const headers = this.parseLine(lines[0]);
    const rows: ShelterRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = this.parseLine(lines[i]);
      if (cols.length < 12) continue;

      const row: Record<string, string> = {};
      headers.forEach((h, idx) => { row[h] = (cols[idx] ?? '').trim(); });

      const { lat, lng } = this.fixCoords(row);

      // Descarta coordenadas inválidas ou claramente erradas (ex: row 31 lng=50.0)
      if (isNaN(lat) || isNaN(lng) || lng > -30 || lng < -50 || lat > -10 || lat < -20) {
        continue;
      }

      rows.push({
        id: row['id'],
        nome: row['nome'],
        endereco: row['endereco'],
        bairro: row['bairro'],
        lat,
        lng,
        telefone: this.isNumeric(row['telefone']) ? '' : row['telefone'],
        area_risco: row['area_risco_associada'],
        modo_ativacao: row['modo_ativacao'],
        servicos: row['servicos_oferecidos'],
      });
    }

    return rows;
  }

  /**
   * Corrige o deslocamento de colunas: quando não há telefone,
   * o CSV coloca latitude em 'telefone' e longitude em 'latitude'.
   */
  private fixCoords(row: Record<string, string>): { lat: number; lng: number } {
    const telNum = parseFloat(row['telefone']);
    const latNum = parseFloat(row['latitude']);
    const lngNum = parseFloat(row['longitude']);

    if (!isNaN(telNum) && !isNaN(latNum) && isNaN(lngNum)) {
      return { lat: telNum, lng: latNum };
    }
    return { lat: latNum, lng: lngNum };
  }

  private isNumeric(val: string): boolean {
    return val !== '' && !isNaN(parseFloat(val)) && isFinite(Number(val));
  }

  /** Haversine distance em metros */
  private haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000;
    const rad = (v: number) => (v * Math.PI) / 180;
    const dLat = rad(lat2 - lat1);
    const dLng = rad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private toResult(s: ShelterRow, distanceMeters: number): ShelterResult {
    return {
      id: s.id,
      document: `${s.nome}, ${s.bairro}, Salvador`,
      metadata: {
        nome: s.nome,
        bairro: s.bairro,
        endereco: s.endereco,
        latitude: s.lat,
        longitude: s.lng,
        area_risco: s.area_risco,
        modo_ativacao: s.modo_ativacao,
        servicos: s.servicos,
        telefone: s.telefone || undefined,
      },
      distance: distanceMeters,
    };
  }

  /** Parser CSV mínimo que respeita campos entre aspas */
  private parseLine(line: string): string[] {
    const result: string[] = [];
    let field = '';
    let inQuotes = false;
    for (const ch of line) {
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        result.push(field);
        field = '';
      } else {
        field += ch;
      }
    }
    result.push(field);
    return result;
  }
}
