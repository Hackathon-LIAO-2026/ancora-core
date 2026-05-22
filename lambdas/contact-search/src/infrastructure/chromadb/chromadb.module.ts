import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ChromaDbContactRepository } from './chromadb-contact.repository';
import { CONTACT_REPOSITORY } from '../../domain/interfaces/contact-repository.interface';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: CONTACT_REPOSITORY,
      useClass: ChromaDbContactRepository,
    },
  ],
  exports: [CONTACT_REPOSITORY],
})
export class ChromaDbModule {}
