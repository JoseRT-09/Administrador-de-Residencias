import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { GetAllReportsUseCase } from '../../../../domain/use-cases/report/get-all-reports.usecase';
import { Report, ReportType, ReportStatus } from '../../../../domain/models/report.model';

interface Activity {
  id: number;
  type: 'report' | 'payment' | 'activity' | 'user';
  icon: string;
  color: string;
  title: string;
  description: string;
  timestamp: Date;
  status?: string;
}

@Component({
  selector: 'app-recent-activities',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule
  ],
  templateUrl: './recent-activities.component.html',
  styleUrls: ['./recent-activities.component.scss']
})
export class RecentActivitiesComponent implements OnInit {
  private getAllReports = inject(GetAllReportsUseCase);

  activities: Activity[] = [];
  isLoading = true;

  ngOnInit(): void {
    this.loadRecentActivities();
  }

  loadRecentActivities(): void {
    this.isLoading = true;

    // Cargar reportes recientes
    this.getAllReports.execute({ page: 1, limit: 5 }).subscribe({
      next: (result) => {
        this.activities = result.data.map(report => this.mapReportToActivity(report));
        
        // Agregar actividades de ejemplo (en producción vendrían de diferentes fuentes)
        this.activities.push(
          {
            id: 100,
            type: 'payment',
            icon: 'payment',
            color: '#4caf50',
            title: 'Pago Recibido',
            description: 'Residente Juan Pérez realizó pago de mantenimiento',
            timestamp: new Date(Date.now() - 3600000),
            status: 'Completado'
          },
          {
            id: 101,
            type: 'activity',
            icon: 'event',
            color: '#ff9800',
            title: 'Nueva Actividad',
            description: 'Torneo de fútbol programado para el sábado',
            timestamp: new Date(Date.now() - 7200000),
            status: 'Programada'
          }
        );

        // Ordenar por fecha más reciente
        this.activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        this.activities = this.activities.slice(0, 8);
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading activities:', error);
        this.isLoading = false;
      }
    });
  }

  private mapReportToActivity(report: Report): Activity {
    return {
      id: report.id,
      type: 'report',
      icon: this.getReportIcon(report.tipo),
      color: this.getReportColor(report.tipo),
      title: `Reporte: ${report.titulo}`,
      description: report.descripcion.substring(0, 80) + '...',
      timestamp: report.created_at ? new Date(report.created_at) : new Date(),
      status: report.estado
    };
  }

  private getReportIcon(type: ReportType): string {
    const icons: Record<ReportType, string> = {
      [ReportType.INCENDIO]: 'local_fire_department',
      [ReportType.ELECTRICO]: 'electrical_services',
      [ReportType.AGUA]: 'water_drop',
      [ReportType.ROBO]: 'security',
      [ReportType.OTRO]: 'report_problem'
    };
    return icons[type] || 'report_problem';
  }

  private getReportColor(type: ReportType): string {
    const colors: Record<ReportType, string> = {
      [ReportType.INCENDIO]: '#f44336',
      [ReportType.ELECTRICO]: '#ff9800',
      [ReportType.AGUA]: '#2196f3',
      [ReportType.ROBO]: '#9c27b0',
      [ReportType.OTRO]: '#666'
    };
    return colors[type] || '#666';
  }

  getTimeAgo(timestamp: Date): string {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) {
      return `Hace ${minutes} minuto${minutes !== 1 ? 's' : ''}`;
    } else if (hours < 24) {
      return `Hace ${hours} hora${hours !== 1 ? 's' : ''}`;
    } else {
      return `Hace ${days} día${days !== 1 ? 's' : ''}`;
    }
  }

  getStatusClass(status?: string): string {
    if (!status) return '';
    
    const statusMap: Record<string, string> = {
      'Abierto': 'status-open',
      'En Progreso': 'status-progress',
      'Resuelto': 'status-resolved',
      'Cerrado': 'status-closed',
      'Completado': 'status-completed',
      'Programada': 'status-scheduled'
    };

    return statusMap[status] || '';
  }

  navigateToActivity(activity: Activity): void {
    // Implementar navegación según el tipo de actividad
    console.log('Navigate to activity:', activity);
  }
}