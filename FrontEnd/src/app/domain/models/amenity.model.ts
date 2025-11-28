import { User } from './user.model';

export enum AmenityAvailability {
  DISPONIBLE = 'Disponible',
  OCUPADA = 'Ocupada',
  MANTENIMIENTO = 'Mantenimiento',
  CERRADA = 'Cerrada'
}

export enum ReservationStatus {
  PENDIENTE = 'Pendiente',
  CONFIRMADA = 'Confirmada',
  CANCELADA = 'Cancelada',
  COMPLETADA = 'Completada'
}

export interface Amenity {
  id: number;
  nombre: string;
  descripcion?: string;
  ubicacion?: string;
  capacidad?: number;
  disponibilidad: AmenityAvailability;
  horario_apertura?: string;
  horario_cierre?: string;
  requiere_reserva: boolean;
  costo_uso: number;
  imagen_url?: string;
  created_at?: Date;
}

export interface CreateAmenityDto {
  nombre: string;
  descripcion?: string;
  ubicacion?: string;
  capacidad?: number;
  horario_apertura?: string;
  horario_cierre?: string;
  requiere_reserva?: boolean;
  costo_uso?: number;
  imagen_url?: string;
}

export interface UpdateAmenityDto {
  nombre?: string;
  descripcion?: string;
  ubicacion?: string;
  capacidad?: number;
  disponibilidad?: AmenityAvailability;
  horario_apertura?: string;
  horario_cierre?: string;
  requiere_reserva?: boolean;
  costo_uso?: number;
  imagen_url?: string;
}

export interface AmenityReservation {
  id: number;
  amenidad_id: number;
  residente_id: number;
  fecha_reserva: Date | string;
  hora_inicio: string;
  hora_fin: string;
  estado: ReservationStatus;
  motivo?: string;
  created_at?: Date;
  
  // Relaciones
  Amenity?: Amenity;
  residente?: User;
}

export interface CreateReservationDto {
  amenidad_id: number;
  fecha_reserva: Date | string;
  hora_inicio: string;
  hora_fin: string;
  motivo?: string;
}