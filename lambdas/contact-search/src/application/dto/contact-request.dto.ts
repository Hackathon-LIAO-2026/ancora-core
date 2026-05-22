import { IsString, IsOptional, IsNumber } from 'class-validator';

/**
 * Payload que o n8n envia para buscar contatos.
 * Busca semântica no ChromaDB — pode filtrar por nome, região ou DDD.
 */
export class ContactSearchRequestDto {
  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @IsString()
  regiao?: string;

  @IsOptional()
  @IsString()
  ddd?: string;

  @IsOptional()
  @IsNumber()
  limit?: number;
}
