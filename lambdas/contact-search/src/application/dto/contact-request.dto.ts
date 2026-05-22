import { IsString, IsOptional, IsNumber, IsArray } from 'class-validator';

/**
 * Payload que o n8n envia para buscar contatos.
 * Pode buscar por nome, região ou retornar todos.
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

/**
 * Payload para broadcast — n8n envia a mensagem e recebe os números.
 */
export class BroadcastRequestDto {
  @IsString()
  mensagem: string;

  @IsOptional()
  @IsString()
  regiao?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  excluir?: string[];
}
