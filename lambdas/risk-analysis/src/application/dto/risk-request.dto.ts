import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';

/**
 * Payload que o n8n/Gemini envia para a Lambda 2.
 * Usado quando a usuária é de Salvador — roteia para análise de risco + abrigo.
 */
export class RiskRequestDto {
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
  @Min(1)
  @Max(5)
  panicScore?: number;

  @IsOptional()
  @IsString()
  mensagemOriginal?: string;
}
