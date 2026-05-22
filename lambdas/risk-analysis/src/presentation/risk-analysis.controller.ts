import { Controller, Post, Get, Body, Query, Inject } from '@nestjs/common';
import { FindNearestShelterUseCase } from '../application/find-nearest-shelter.use-case';
import { ListSheltersUseCase } from '../application/list-shelters.use-case';
import { RiskRequestDto } from '../application/dto/risk-request.dto';
import { RiskResponseDto } from '../application/dto/risk-response.dto';
import {
  IShelterRepository,
  SHELTER_REPOSITORY,
} from '../domain/interfaces/shelter-repository.interface';

@Controller('risk')
export class RiskAnalysisController {
  constructor(
    private readonly findNearestShelter: FindNearestShelterUseCase,
    private readonly listShelters: ListSheltersUseCase,
    @Inject(SHELTER_REPOSITORY)
    private readonly repository: IShelterRepository,
  ) {}

  /**
   * POST /risk/analyze
   *
   * Endpoint principal — recebe o payload do n8n/Gemini para Salvador
   * e retorna análise de risco + abrigo mais próximo.
   */
  @Post('analyze')
  async analyzeRisk(@Body() dto: RiskRequestDto): Promise<RiskResponseDto> {
    return this.findNearestShelter.execute(dto);
  }

  /**
   * GET /risk/shelters
   *
   * Lista abrigos. Aceita filtro por bairro via query param.
   */
  @Get('shelters')
  async getShelters(@Query('bairro') bairro?: string) {
    const shelters = await this.listShelters.execute(bairro);
    return {
      total: shelters.length,
      shelters: shelters.map((s) => ({
        id: s.id,
        nome: s.metadata.nome,
        endereco: s.metadata.endereco || `${s.metadata.bairro}, Salvador`,
        bairro: s.metadata.bairro,
        latitude: s.metadata.latitude,
        longitude: s.metadata.longitude,
        telefone: s.metadata.telefone || null,
        servicosOferecidos: s.metadata.servicos || null,
        areaRiscoAssociada: s.metadata.area_risco || null,
      })),
    };
  }

  /**
   * GET /risk/health
   * Verifica se a collection está acessível e populada.
   */
  @Get('health')
  async health() {
    const status = await this.repository.healthCheck();
    return {
      service: 'risk-analysis',
      chromadb: status,
      timestamp: new Date().toISOString(),
    };
  }
}
