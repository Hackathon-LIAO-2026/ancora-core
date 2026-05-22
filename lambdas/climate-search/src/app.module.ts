import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ChromaDbModule } from './infrastructure/chromadb/chromadb.module';
import { SearchPipelineService } from './infrastructure/search/search-pipeline.service';
import { SemanticSearchStrategy } from './infrastructure/search/strategies/semantic-search.strategy';
import { MetadataFilterStrategy } from './infrastructure/search/strategies/metadata-filter.strategy';
import { RerankingStrategy } from './infrastructure/search/strategies/reranking.strategy';
import { SearchClimateUseCase } from './application/search-climate.use-case';
import { FindEmergencyContactUseCase } from './application/find-emergency-contact.use-case';
import { ClimateSearchController } from './presentation/climate-search.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ChromaDbModule,
  ],
  controllers: [ClimateSearchController],
  providers: [
    // Estratégias de busca
    SemanticSearchStrategy,
    MetadataFilterStrategy,
    RerankingStrategy,

    // Pipeline
    SearchPipelineService,

    // Use Cases
    SearchClimateUseCase,
    FindEmergencyContactUseCase,
  ],
})
export class AppModule {}
