import {
  IsString,
  IsOptional,
  IsNumber,
  IsNotEmpty,
  Min,
  Max,
  IsIn,
} from 'class-validator';

export const INTENCOES_VALIDAS = [
  'risco_chuva',
  'previsao',
  'alagamento',
  'clima_geral',
  'historico',
] as const;

export type Intencao = (typeof INTENCOES_VALIDAS)[number];

export class SearchRequestDto {
  @IsString()
  @IsNotEmpty()
  cidade: string;

  @IsOptional()
  @IsString()
  bairro?: string;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng?: number;

  @IsOptional()
  @IsIn(INTENCOES_VALIDAS)
  intencao?: Intencao;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  panicScore?: number;

  @IsOptional()
  @IsString()
  mensagemOriginal?: string;
}
