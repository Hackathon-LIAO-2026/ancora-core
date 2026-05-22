import { Injectable, Inject, Logger } from '@nestjs/common';
import {
  IShelterRepository,
  ShelterResult,
  SHELTER_REPOSITORY,
} from '../domain/interfaces/shelter-repository.interface';

/**
 * Use Case — Listar abrigos cadastrados.
 * Busca semântica no ChromaDB.
 */
@Injectable()
export class ListSheltersUseCase {
  private readonly logger = new Logger(ListSheltersUseCase.name);

  constructor(
    @Inject(SHELTER_REPOSITORY)
    private readonly shelterRepository: IShelterRepository,
  ) {}

  async execute(bairro?: string): Promise<ShelterResult[]> {
    if (bairro) {
      this.logger.log(`Listando abrigos do bairro: ${bairro}`);
      return this.shelterRepository.searchByBairro(bairro);
    }

    this.logger.log('Listando todos os abrigos');
    return this.shelterRepository.searchShelters('abrigos Salvador emergência', 20);
  }
}
