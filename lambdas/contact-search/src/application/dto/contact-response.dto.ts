/**
 * Response com contatos formatados pro n8n disparar mensagens.
 */
export class ContactDto {
  nome: string;
  primeiroNome: string;
  telefone: string;
  formatoE164: string;
  ddd: string;
  estado: string;
}

export class ContactSearchResponseDto {
  /** Lista de contatos encontrados */
  contacts: ContactDto[];

  /** Total de contatos retornados */
  total: number;

  /** Metadados da busca */
  meta: {
    query: string | null;
    regiao: string | null;
    elapsedMs: number;
  };
}

/**
 * Response otimizado pro n8n fazer broadcast.
 * Retorna apenas os números E.164 prontos pra envio.
 */
export class BroadcastResponseDto {
  /** Números no formato E.164 prontos pro WAHA enviar */
  numbers: string[];

  /** Contatos com nome (pra personalização da mensagem) */
  recipients: Array<{
    nome: string;
    primeiroNome: string;
    numero: string;
  }>;

  /** Total de destinatários */
  total: number;

  /** Mensagem a ser enviada */
  mensagem: string;
}
