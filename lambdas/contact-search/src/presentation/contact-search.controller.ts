import { Controller, Post, Get, Body, Inject } from '@nestjs/common';
import { SearchContactsUseCase } from '../application/search-contacts.use-case';
import { ContactSearchRequestDto } from '../application/dto/contact-request.dto';
import { ContactSearchResponseDto } from '../application/dto/contact-response.dto';
import {
  IContactRepository,
  CONTACT_REPOSITORY,
} from '../domain/interfaces/contact-repository.interface';

@Controller('contacts')
export class ContactSearchController {
  constructor(
    private readonly searchContacts: SearchContactsUseCase,
    @Inject(CONTACT_REPOSITORY)
    private readonly repository: IContactRepository,
  ) {}

  /**
   * POST /contacts/search
   *
   * O n8n chama esse endpoint pra buscar contatos.
   * Retorna os números E.164 prontos pro WAHA enviar.
   */
  @Post('search')
  async search(@Body() dto: ContactSearchRequestDto): Promise<ContactSearchResponseDto> {
    return this.searchContacts.execute(dto);
  }

  /**
   * GET /contacts/all
   *
   * Retorna todos os contatos sem filtro.
   */
  @Get('all')
  async getAll(): Promise<ContactSearchResponseDto> {
    return this.searchContacts.execute({});
  }

  /**
   * GET /contacts/health
   */
  @Get('health')
  async health() {
    const status = await this.repository.healthCheck();
    return {
      service: 'contact-search',
      chromadb: status,
      timestamp: new Date().toISOString(),
    };
  }
}
