import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ChromaDbModule } from './infrastructure/chromadb/chromadb.module';
import { SearchContactsUseCase } from './application/search-contacts.use-case';
import { ListAllContactsUseCase } from './application/list-all-contacts.use-case';
import { ContactSearchController } from './presentation/contact-search.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ChromaDbModule,
  ],
  controllers: [ContactSearchController],
  providers: [
    SearchContactsUseCase,
    ListAllContactsUseCase,
  ],
})
export class AppModule {}
