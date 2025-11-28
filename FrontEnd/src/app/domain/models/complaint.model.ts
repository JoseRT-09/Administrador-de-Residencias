import { User } from './user.model';

export enum ComplaintTarget {
  ADMINISTRACION = 'Administración',
  RESIDENTE = 'Residente',
  MANTENIMIENTO = 'Mantenimiento'
}

export enum ComplaintStatus {
  NUEVO = 'Nuevo',
  REVISADO = 'Revisado',
  EN_PROCESO = 'En Proceso',
  RESUELTO = 'Resuelto'
}

export interface Complaint {
  id: number;
  autor_id: number;
  asunto: string;
  dirigido_a: ComplaintTarget;
  residente_objetivo_id?: number;
  cuerpo_mensaje: string;
  es_anonimo: boolean;
  estado: ComplaintStatus;
  respuesta?: string;
  created_at?: Date;
  updated_at?: Date;
  
  // Relaciones
  autor?: User;
  residenteObjetivo?: User;
}

export interface CreateComplaintDto {
  asunto: string;
  dirigido_a: ComplaintTarget;
  residente_objetivo_id?: number;
  cuerpo_mensaje: string;
  es_anonimo?: boolean;
}

export interface UpdateComplaintDto {
  estado?: ComplaintStatus;
  respuesta?: string;
}