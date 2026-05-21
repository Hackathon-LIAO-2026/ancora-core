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
   * POST /climate/risk
   *
   * Endpoint principal — recebe o payload do n8n/Gemini e retorna
   * análise de risco climático com contexto histórico.
   *
   * O n8n chama esse endpoint após o Gemini extrair cidade/intenção
   * da mensagem da usuária. O retorno é passado de volta pro Gemini
   * pra gerar a resposta empática adaptada ao Panic Score.
   */
  @Post('risk')
  async analyzeRisk(@Body() dto: SearchRequestDto): Promise<SearchResponseDto> {
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
