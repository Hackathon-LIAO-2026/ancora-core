import { Controller, Post, Get, Body, Inject, Query } from '@nestjs/common';
import { SearchClimateUseCase } from '../application/search-climate.use-case';
import { SearchRequestDto } from '../application/dto/search-request.dto';
import { SearchResponseDto } from '../application/dto/search-response.dto';
import {
  IClimateRepository,
  CLIMATE_REPOSITORY,
} from '../domain/interfaces/climate-repository.interface';

@Controller('climate')
export class ClimateSearchController {
  constructor(
    private readonly searchUseCase: SearchClimateUseCase,
    @Inject(CLIMATE_REPOSITORY)
    private readonly repository: IClimateRepository,
  ) {}

  /**
   * POST /climate/search
   * Busca semântica com re-ranking no ChromaDB.
   */
  @Post('search')
  async search(@Body() dto: SearchRequestDto): Promise<SearchResponseDto> {
    return this.searchUseCase.execute(dto);
  }

  /**
   * GET /climate/health
   * Verifica se as collections estão populadas.
   */
  @Get('health')
  async health(@Query('collection') collection?: string) {
    const target = collection || 'clima_bahia';
    const status = await this.repository.healthCheck(target);
    return {
      service: 'climate-search',
      chromadb: status,
      timestamp: new Date().toISOString(),
    };
  }
}
