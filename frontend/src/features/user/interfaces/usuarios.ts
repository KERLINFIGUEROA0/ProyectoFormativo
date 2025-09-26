export interface Rol {
  id: number;
  nombre: string;
  descripcion?: string;
  usuariosAsignados?: number;
  permisos?: Record<string, boolean>;
}

export interface Usuario {
  id: number;
  identificacion: number;
  tipo?: string;
  nombre: string;
  apellidos?: string;
  correo: string;
  telefono: string;
  estado: boolean;
  tipoUsuario?: { 
    id: number;
    nombre: string;
  };
  permisos?: Record<string, boolean>;
}

export interface UsuarioForm {
  tipo?: string;
  identificacion?: number;
  nombre?: string;
  apellidos?: string;
  correo?: string;
  telefono?: string;
  rolId?: number;
}
