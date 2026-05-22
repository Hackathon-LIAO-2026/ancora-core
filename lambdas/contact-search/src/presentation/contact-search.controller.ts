import { Controller, Post, Get, Body, Query, Inject } from '@nestjs/common';
import { SearchContactsUseCase } from '../application/search-contacts.use-case';
import { ListAllContactsUseCase } from '../application/list-all-contacts.use-case';
import { ContactSearchRequestDto, BroadcastRequestDto } from '../application/dto/contact-request.dto';
import { ContactSearchResponseDto, BroadcastResponseDto } from '../application/dto/contact-response.dto';
import {
  IContactRepository,
  CONTACT_REPOSITORY,
} from '../domain/interfaces/contact-repository.interface';

@Controller('contacts')
export class ContactSearchController {
  constructor(
    private readonly searchContacts: SearchContactsUseCase,
    private readonly listAllContacts: ListAllContactsUseCase,
    @Inject(CONTACT_REPOSITORY)
    private readonly repository: IContactRepository,
  ) {}

  /**
   * POST /contacts/search
   *
   * Busca contatos por query semântica ou região.
   * Retorna lista com telefones formatados.
   */
  @Post('search')
  async search(@Body() dto: ContactSearchRequestDto): Promise<ContactSearchResponseDto> {
    return this.searchContacts.execute(dto);
  }

  /**
   * POST /contacts/broadcast
   *
   * Endpoint principal pro n8n — retorna todos os números E.164
   * prontos pra disparar mensagem via WAHA.
   *
   * O n8n chama esse endpoint quando a Defesa Civil dispara um alerta.
   */
  @Post('broadcast')
  async broadcast(@Body() dto: BroadcastRequestDto): Promise<BroadcastResponseDto> {
    return this.listAllContacts.execute(dto);
  }

  /**
   * GET /contacts/all
   *
   * Lista todos os contatos cadastrados (sem filtro).
   */
  @Get('all')
  async getAll(@Query('limit') limit?: number) {
    const dto = new ContactSearchRequestDto();
    dto.limit = limit;
    return this.searchContacts.execute(dto);
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
