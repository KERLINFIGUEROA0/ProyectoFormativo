import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsuarioPermiso } from './entities/usuarios_permiso.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { Permiso } from '../permisos/entities/permiso.entity';
import { NotificationsGateway } from '../../notifications/notifications.gateway';

@Injectable()
export class UsuarioPermisoService {
  constructor(
    @InjectRepository(UsuarioPermiso)
    private usuarioPermisoRepo: Repository<UsuarioPermiso>,
    @InjectRepository(Usuario)
    private usuarioRepo: Repository<Usuario>,
    @InjectRepository(Permiso)
    private permisoRepo: Repository<Permiso>,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  async getPermissionsForUser(userId: number) {
    const user = await this.usuarioRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`Usuario con id ${userId} no encontrado.`);
    }

    const allPermissions = await this.permisoRepo.find();
    const assignedPermissions = await this.usuarioPermisoRepo.find({
      where: { usuario: { id: userId } },
      relations: ['permiso'],
    });

    const assignedPermissionIds = new Set(
      assignedPermissions.map((up) => up.permiso.id),
    );

    return allPermissions.map((permiso) => ({
      permisoId: permiso.id,
      nombre: permiso.nombre,
      descripcion: permiso.descripcion,
      activo: assignedPermissionIds.has(permiso.id),
    }));
  }

  async togglePermission(dto: {
    usuarioId: number;
    permisoId: number;
    estado: boolean;
  }) {
    const { usuarioId, permisoId, estado } = dto;

    const usuarioPermisoExistente = await this.usuarioPermisoRepo.findOne({
      where: {
        usuario: { id: usuarioId },
        permiso: { id: permisoId },
      },
    });

    let result;

    if (estado) {
      if (!usuarioPermisoExistente) {
        const usuario = await this.usuarioRepo.findOneBy({ id: usuarioId });
        if (!usuario) throw new NotFoundException(`Usuario con id ${usuarioId} no encontrado.`);

        const permiso = await this.permisoRepo.findOneBy({ id: permisoId });
        if (!permiso) throw new NotFoundException(`Permiso con id ${permisoId} no encontrado.`);

        const nuevoUsuarioPermiso = this.usuarioPermisoRepo.create({ usuario, permiso });
        result = await this.usuarioPermisoRepo.save(nuevoUsuarioPermiso);
      } else {
        result = usuarioPermisoExistente;
      }
    } else {
      if (usuarioPermisoExistente) {
        await this.usuarioPermisoRepo.remove(usuarioPermisoExistente);
        result = { message: 'Permiso desasignado correctamente.' };
      } else {
        result = { message: 'El permiso no estaba asignado. No se realizó ninguna acción.' };
      }
    }
    
    // Notificar al usuario específico afectado
    this.notificationsGateway.sendPermissionsUpdate(usuarioId);
    
    return result;
  }
}
