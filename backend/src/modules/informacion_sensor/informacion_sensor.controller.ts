// src/modules/informacion_sensor/informacion_sensor.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { InformacionSensorService } from './informacion_sensor.service';
import { CreateInformacionSensorDto } from './dto/create-informacion_sensor.dto';

@Controller('informacion-sensor')
export class InformacionSensorController {
  constructor(private readonly infoSensorService: InformacionSensorService) {}

  @Post('registrar')
  // NOTA: Este endpoint debería tener una estrategia de seguridad diferente,
  // como un API Key, en lugar de JWT, ya que será consumido por dispositivos.
  // Por ahora, lo dejamos abierto para simplicidad.
  create(@Body() createDto: CreateInformacionSensorDto) {
    return this.infoSensorService.create(createDto);
  }
}