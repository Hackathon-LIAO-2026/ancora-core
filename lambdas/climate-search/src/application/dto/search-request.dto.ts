import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';

/**
 * Payload que o n8n/Gemini envia para a Lambda.
 * O Gemini extrai esses campos da mensagem da usuária.
 */
export enum Intencao {
  RISCO_CHUVA = 'risco_chuva',
  PREVISAO = 'previsao',
  ALAGAMENTO = 'alagamento',
  CLIMA_GERAL = 'clima_geral',
  HISTORICO = 'historico',
}

export class SearchRequestDto {
  @IsString()
  cidade: string;

  @IsOptional()
  @IsString()
  bairro?: string;

  @IsOptional()
  @IsNumber()
  lat?: number;

  @IsOptional()
  @IsNumber()
  lng?: number;

  @IsOptional()
  @IsString()
  intencao?: string;

  @IsOptional()
  @IsNumber()
  panicScore?: number;

  @IsOptional()
  @IsString()
  mensagemOriginal?: string;
}
