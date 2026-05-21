import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ChromaDbClimateRepository } from './chromadb-climate.repository';
import { CLIMATE_REPOSITORY } from '../../domain/interfaces/climate-repository.interface';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: CLIMATE_REPOSITORY,
      useClass: ChromaDbClimateRepository,
    },
  ],
  exports: [CLIMATE_REPOSITORY],
})
export class ChromaDbModule {}
