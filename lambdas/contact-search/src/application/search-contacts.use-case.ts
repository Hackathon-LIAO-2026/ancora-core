import { Injectable, Inject, Logger } from '@nestjs/common';
import {
  IContactRepository,
  CONTACT_REPOSITORY,
} from '../domain/interfaces/contact-repository.interface';
import { ContactSearchRequestDto } from './dto/contact-request.dto';
import { ContactSearchResponseDto, ContactDto } from './dto/contact-response.dto';

/**
 * Use Case — Buscar contatos no ChromaDB.
 *
 * O n8n chama essa Lambda quando precisa dos números de telefone
 * pra disparar mensagens via WAHA. A busca é semântica (por nome,
 * região, DDD) ou retorna todos se nenhum filtro for passado.
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
    const limit = dto.limit || 50;

    let results;

    if (dto.query) {
      this.logger.log(`Buscando contatos: "${dto.query}"`);
      results = await this.contactRepository.searchContacts(dto.query, limit);
    } else if (dto.regiao || dto.ddd) {
      const region = dto.regiao || `DDD ${dto.ddd}`;
      this.logger.log(`Buscando contatos por região: ${region}`);
      results = await this.contactRepository.searchByRegion(region, limit);
    } else {
      this.logger.log('Retornando todos os contatos');
      results = await this.contactRepository.listAll();
    }

    const elapsed = Date.now() - start;

    const response = new ContactSearchResponseDto();

    response.numbers = results.map((r) => r.metadata.formato_e164);

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
      query: dto.query || dto.regiao || dto.ddd || null,
      elapsedMs: elapsed,
    };

    this.logger.log(`${response.total} contatos retornados em ${elapsed}ms`);
    return response;
  }
}
