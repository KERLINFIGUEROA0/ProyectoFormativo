import { Injectable } from '@nestjs/common';
import { CreateMaterialeDto } from './dto/create-materiale.dto';
import { UpdateMaterialeDto } from './dto/update-materiale.dto';

@Injectable()
export class MaterialesService {
  create(createMaterialeDto: CreateMaterialeDto) {
    return 'This action adds a new materiale';
  }

  findAll() {
    return `This action returns all materiales`;
  }

  findOne(id: number) {
    return `This action returns a #${id} materiale`;
  }

  update(id: number, updateMaterialeDto: UpdateMaterialeDto) {
    return `This action updates a #${id} materiale`;
  }

  remove(id: number) {
    return `This action removes a #${id} materiale`;
  }
}
