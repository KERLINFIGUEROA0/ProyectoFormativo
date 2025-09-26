import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuariosService } from './usuarios.service';
import { UsuariosController } from './usuarios.controller';
import { RecuperacionController } from './recuperacion.controller';
import { Usuario } from './entities/usuario.entity';
import { CorreoModule } from '../../correo/correo.module';
import { AuthorizationModule } from '../../authorization/authorization.module';
import { TipoUsuario } from '../tipo_usuario/entities/tipo_usuario.entity';
@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario, TipoUsuario, ]),
    CorreoModule,
    AuthorizationModule,
  ],
  controllers: [UsuariosController, RecuperacionController],
  providers: [UsuariosService],
  exports: [UsuariosService],
})
export class UsuariosModule {}
