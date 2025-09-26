import { Injectable } from '@nestjs/common';
import { CreateProduccioneDto } from './dto/create-produccione.dto';
import { UpdateProduccioneDto } from './dto/update-produccione.dto';

@Injectable()
export class ProduccionesService {
  create(createProduccioneDto: CreateProduccioneDto) {
    return 'This action adds a new produccione';
  }

  findAll() {
    return `This action returns all producciones`;
  }

  findOne(id: number) {
    return `This action returns a #${id} produccione`;
  }

  update(id: number, updateProduccioneDto: UpdateProduccioneDto) {
    return `This action updates a #${id} produccione`;
  }

  remove(id: number) {
    return `This action removes a #${id} produccione`;
  }
}
