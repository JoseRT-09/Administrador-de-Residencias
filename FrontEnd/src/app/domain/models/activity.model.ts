import { User } from './user.model';

export enum ActivityStatus {
  PROGRAMADA = 'Programada',
  EN_CURSO = 'En Curso',
  COMPLETADA = 'Completada',
  CANCELADA = 'Cancelada'
}

export interface Activity {
  id: number;
  nombre: string;
  descripcion?: string;
  fecha_hora: Date | string;
  ubicacion?: string;
  organizador_id?: number;
  cupo_maximo?: number;
  inscritos_count: number;
  estado: ActivityStatus;
  created_at?: Date;
  updated_at?: Date;
  
  // Relaciones
  organizador?: User;
}

export interface CreateActivityDto {
  nombre: string;
  descripcion?: string;
  fecha_hora: Date | string;
  ubicacion?: string;
  cupo_maximo?: number;
}

export interface UpdateActivityDto {
  nombre?: string;
  descripcion?: string;
  fecha_hora?: Date | string;
  ubicacion?: string;
  cupo_maximo?: number;
  estado?: ActivityStatus;
}