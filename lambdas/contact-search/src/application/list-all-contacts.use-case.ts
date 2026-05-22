import { Injectable, Inject, Logger } from '@nestjs/common';
import {
  IContactRepository,
  CONTACT_REPOSITORY,
} from '../domain/interfaces/contact-repository.interface';
import { BroadcastRequestDto } from './dto/contact-request.dto';
import { BroadcastResponseDto } from './dto/contact-response.dto';

/**
 * Use Case — Retornar todos os contatos formatados pro n8n fazer broadcast.
 * O n8n usa esse endpoint pra pegar os números e disparar mensagens via WAHA.
 */
@Injectable()
export class ListAllContactsUseCase {
  private readonly logger = new Logger(ListAllContactsUseCase.name);

  constructor(
    @Inject(CONTACT_REPOSITORY)
    private readonly contactRepository: IContactRepository,
  ) {}

  async execute(dto: BroadcastRequestDto): Promise<BroadcastResponseDto> {
    const start = Date.now();

    let results;

    if (dto.regiao) {
      results = await this.contactRepository.searchByRegion(dto.regiao, 100);
    } else {
      results = await this.contactRepository.listAll();
    }

    // Filtrar excluídos
    if (dto.excluir?.length) {
      const excluirSet = new Set(dto.excluir.map((n) => n.replace(/\D/g, '')));
      results = results.filter(
        (r) => !excluirSet.has(r.metadata.formato_e164.replace(/\D/g, '')),
      );
    }

    const elapsed = Date.now() - start;

    const response = new BroadcastResponseDto();
    response.numbers = results.map((r) => r.metadata.formato_e164);
    response.recipients = results.map((r) => ({
      nome: r.metadata.nome,
      primeiroNome: r.metadata.primeiro_nome,
      numero: r.metadata.formato_e164,
    }));
    response.total = results.length;
    response.mensagem = dto.mensagem;

    this.logger.log(
      `Broadcast preparado: ${response.total} destinatários em ${elapsed}ms`,
    );

    return response;
  }
}
