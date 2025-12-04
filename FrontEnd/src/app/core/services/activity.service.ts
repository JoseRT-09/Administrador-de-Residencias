import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Activity {
  id: number;
  titulo: string;
  descripcion?: string;
  tipo: 'Reunión' | 'Evento' | 'Mantenimiento' | 'Asamblea' | 'Celebración' | 'Otro';
  fecha_inicio: string;
  fecha_fin?: string;
  ubicacion?: string;
  organizador_id: number;
  max_participantes?: number;
  inscritos_count: number;
  estado: 'Programada' | 'En Curso' | 'Completada' | 'Cancelada';
  created_at?: string;
  updated_at?: string;
  organizador?: any;
}

export interface ActivityListResponse {
  data: Activity[];
  total: number;
  pages: number;
  currentPage: number;
}

export interface CreateActivityData {
  titulo: string;
  descripcion?: string;
  tipo?: 'Reunión' | 'Evento' | 'Mantenimiento' | 'Asamblea' | 'Celebración' | 'Otro';
  fecha_inicio: string;
  fecha_fin?: string;
  ubicacion?: string;
  max_participantes?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ActivityService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/activities`;

  getAllActivities(filters?: {
    tipo?: string;
    estado?: string;
    upcoming?: boolean;
    page?: number;
    limit?: number;
  }): Observable<ActivityListResponse> {
    let params = new HttpParams();

    if (filters) {
      if (filters.tipo) params = params.set('tipo', filters.tipo);
      if (filters.estado) params = params.set('estado', filters.estado);
      if (filters.upcoming !== undefined) params = params.set('upcoming', filters.upcoming.toString());
      if (filters.page) params = params.set('page', filters.page.toString());
      if (filters.limit) params = params.set('limit', filters.limit.toString());
    }

    return this.http.get<ActivityListResponse>(this.apiUrl, { params });
  }

  getActivityById(id: number): Observable<{ activity: Activity }> {
    return this.http.get<{ activity: Activity }>(`${this.apiUrl}/${id}`);
  }

  createActivity(data: CreateActivityData): Observable<{ message: string; activity: Activity }> {
    return this.http.post<{ message: string; activity: Activity }>(this.apiUrl, data);
  }

  updateActivity(id: number, data: Partial<CreateActivityData & {
    estado?: 'Programada' | 'En Curso' | 'Completada' | 'Cancelada';
  }>): Observable<{ message: string; activity: Activity }> {
    return this.http.put<{ message: string; activity: Activity }>(`${this.apiUrl}/${id}`, data);
  }

  deleteActivity(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  registerForActivity(id: number): Observable<{ message: string; activity: Activity }> {
    return this.http.post<{ message: string; activity: Activity }>(
      `${this.apiUrl}/${id}/register`,
      {}
    );
  }

  unregisterFromActivity(id: number): Observable<{ message: string; activity: Activity }> {
    return this.http.post<{ message: string; activity: Activity }>(
      `${this.apiUrl}/${id}/unregister`,
      {}
    );
  }
}