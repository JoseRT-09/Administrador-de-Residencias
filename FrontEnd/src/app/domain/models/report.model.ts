import { Residence } from './residence.model';
import { User } from './user.model';

export enum ReportType {
  INCENDIO = 'Incendio',
  ELECTRICO = 'Eléctrico',
  AGUA = 'Agua',
  ROBO = 'Robo',
  OTRO = 'Otro'
}

export enum ReportPriority {
  BAJA = 'Baja',
  MEDIA = 'Media',
  ALTA = 'Alta',
  CRITICA = 'Crítica'
}

export enum ReportStatus {
  ABIERTO = 'Abierto',
  EN_PROGRESO = 'En Progreso',
  RESUELTO = 'Resuelto',
  CERRADO = 'Cerrado'
}

export interface Report {
  id: number;
  tipo: ReportType;
  residencia_id?: number;
  reportado_por?: number;
  titulo: string;
  descripcion: string;
  prioridad: ReportPriority;
  estado: ReportStatus;
  asignado_a?: number;
  fecha_resolucion?: Date;
  created_at?: Date;
  updated_at?: Date;
  
  // Relaciones
  Residence?: Residence;
  reportadoPor?: User;
  asignadoA?: User;
}

export interface CreateReportDto {
  tipo: ReportType;
  residencia_id?: number;
  titulo: string;
  descripcion: string;
  prioridad?: ReportPriority;
}

export interface UpdateReportDto {
  titulo?: string;
  descripcion?: string;
  prioridad?: ReportPriority;
  estado?: ReportStatus;
  asignado_a?: number;
}

export interface ReportStatistics {
  total: number;
  byStatus: {
    abierto: number;
    enProgreso: number;
    resuelto: number;
    cerrado: number;
  };
  byPriority: {
    critica: number;
    alta: number;
  };
  byType: Array<{
    tipo: string;
    count: number;
  }>;
}