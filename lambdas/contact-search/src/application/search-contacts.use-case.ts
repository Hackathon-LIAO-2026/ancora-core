import { Injectable, Inject, Logger } from '@nestjs/common';
import {
  IContactRepository,
  CONTACT_REPOSITORY,
} from '../domain/interfaces/contact-repository.interface';
import { ContactSearchRequestDto } from './dto/contact-request.dto';
import { ContactSearchResponseDto, ContactDto } from './dto/contact-response.dto';

/**
 * Use Case — Buscar contatos por query semântica ou região.
 */
@Injectable()
export class SearchContactsUseCase {
  private readonly logger = new Logger(SearchContactsUseCase.name);

  constructor(
    @Inject(CONTACT_REPOSITORY)
    private readonly contactRepository: IContactRepository,
  ) {}

  async execute(dto: ContactSearchRequestDto): Promise<ContactSearchResponseDto> {
    const start = Date.now();
    const limit = dto.limit || 20;

    let results;

    if (dto.query) {
      this.logger.log(`Buscando contatos: "${dto.query}"`);
      results = await this.contactRepository.searchContacts(dto.query, limit);
    } else if (dto.regiao || dto.ddd) {
      const region = dto.regiao || `DDD ${dto.ddd}`;
      this.logger.log(`Buscando contatos por região: ${region}`);
      results = await this.contactRepository.searchByRegion(region, limit);
    } else {
      this.logger.log('Listando todos os contatos');
      results = await this.contactRepository.listAll();
    }

    const elapsed = Date.now() - start;

    const response = new ContactSearchResponseDto();
    response.contacts = results.map((r) => {
      const contact = new ContactDto();
      contact.nome = r.metadata.nome;
      contact.primeiroNome = r.metadata.primeiro_nome;
      contact.telefone = r.metadata.telefone;
      contact.formatoE164 = r.metadata.formato_e164;
      contact.ddd = r.metadata.ddd;
      contact.estado = r.metadata.estado;
      return contact;
    });
    response.total = response.contacts.length;
    response.meta = {
      query: dto.query || null,
      regiao: dto.regiao || dto.ddd || null,
      elapsedMs: elapsed,
    };

    this.logger.log(`${response.total} contatos encontrados em ${elapsed}ms`);
    return response;
  }
}
