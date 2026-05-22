/**
 * Response que a Lambda 2 retorna pro n8n.
 * Contém análise de risco + abrigo mais próximo para Salvador.
 */
export class ShelterDto {
  id: string;
  nome: string;
  endereco: string;
  bairro: string;
  latitude: number;
  longitude: number;
  distancia: string;
  telefone: string | null;
  servicosOferecidos: string | null;
  modoAtivacao: string | null;
}

export class RiskResponseDto {
  /** Nível de risco baseado no panic score + contexto */
  riskLevel: 'BAIXO' | 'MÉDIO' | 'ALTO' | 'CRÍTICO';

  /** Confiança da análise (0 a 1) */
  confidence: number;

  /** Resumo textual para a LLM usar na resposta */
  summary: string;

  /** Abrigo mais próximo (aparece quando riskLevel >= ALTO) */
  shelter: ShelterDto | null;

  /** Lista de abrigos alternativos próximos */
  nearbyShelters: ShelterDto[];

  /** Se deve exibir botão de emergência (panicScore = 5) */
  showEmergencyButton: boolean;

  /** Contatos de emergência */
  emergencyContacts: EmergencyContactDto[];

  /** Metadados da busca */
  meta: {
    cidade: string;
    bairro: string | null;
    totalShelters: number;
    elapsedMs: number;
  };
}

export class EmergencyContactDto {
  orgao: string;
  telefone: string;
  tipo: string;
}
