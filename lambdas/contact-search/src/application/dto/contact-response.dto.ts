/**
 * Response com contatos — o n8n usa pra disparar mensagens via WAHA.
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
  /** Números E.164 prontos pro WAHA */
  numbers: string[];

  /** Contatos completos (pra personalização) */
  contacts: ContactDto[];

  /** Total */
  total: number;

  /** Metadados da busca */
  meta: {
    query: string | null;
    elapsedMs: number;
  };
}
