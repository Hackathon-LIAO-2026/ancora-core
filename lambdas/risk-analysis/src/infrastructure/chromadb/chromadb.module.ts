import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ChromaDbShelterRepository } from './chromadb-shelter.repository';
import { ChromaDbClimateRiskRepository } from './chromadb-climate-risk.repository';
import { SHELTER_REPOSITORY } from '../../domain/interfaces/shelter-repository.interface';
import { CLIMATE_RISK_REPOSITORY } from '../../domain/interfaces/climate-risk-repository.interface';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: SHELTER_REPOSITORY,
      useClass: ChromaDbShelterRepository,
    },
    {
      provide: CLIMATE_RISK_REPOSITORY,
      useClass: ChromaDbClimateRiskRepository,
    },
  ],
  exports: [SHELTER_REPOSITORY, CLIMATE_RISK_REPOSITORY],
})
export class ChromaDbModule {}
