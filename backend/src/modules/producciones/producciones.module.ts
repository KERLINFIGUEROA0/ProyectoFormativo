import { Module } from '@nestjs/common';
import { ProduccionesService } from './producciones.service';
import { ProduccionesController } from './producciones.controller';

@Module({
  controllers: [ProduccionesController],
  providers: [ProduccionesService],
})
export class ProduccionesModule {}
