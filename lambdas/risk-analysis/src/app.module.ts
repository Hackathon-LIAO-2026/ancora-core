import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ChromaDbModule } from './infrastructure/chromadb/chromadb.module';
import { ShelterCsvService } from './infrastructure/csv/shelter-csv.service';
import { FindNearestShelterUseCase } from './application/find-nearest-shelter.use-case';
import { ListSheltersUseCase } from './application/list-shelters.use-case';
import { RiskAnalysisController } from './presentation/risk-analysis.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ChromaDbModule,
  ],
  controllers: [RiskAnalysisController],
  providers: [
    ShelterCsvService,
    FindNearestShelterUseCase,
    ListSheltersUseCase,
  ],
})
export class AppModule {}
