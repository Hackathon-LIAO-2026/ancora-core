import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class SearchRequestDto {
  @IsString()
  query: string;

  @IsOptional()
  @IsString()
  collection?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  topK?: number;

  @IsOptional()
  @IsString()
  estacao?: string;

  @IsOptional()
  @IsNumber()
  precipMin?: number;

  @IsOptional()
  @IsNumber()
  precipMax?: number;
}
