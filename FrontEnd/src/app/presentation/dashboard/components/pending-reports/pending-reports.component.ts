import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { GetAllReportsUseCase } from '../../../../domain/use-cases/report/get-all-reports.usecase';
import { Report, ReportPriority, ReportType } from '../../../../domain/models/report.model';

@Component({
  selector: 'app-pending-reports',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatTooltipModule
  ],
  templateUrl: './pending-reports.component.html',
  styleUrls: ['./pending-reports.component.scss']
})
export class PendingReportsComponent implements OnInit {
  private getAllReports = inject(GetAllReportsUseCase);

  pendingReports: Report[] = [];
  isLoading = true;

  ngOnInit(): void {
    this.loadPendingReports();
  }

  loadPendingReports(): void {
    this.isLoading = true;

    this.getAllReports.execute({ 
      page: 1, 
      limit: 6,
      estado: 'Abierto,En Progreso'
    }).subscribe({
      next: (result) => {
        this.pendingReports = result.data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading pending reports:', error);
        this.isLoading = false;
      }
    });
  }

  getPriorityClass(priority: ReportPriority): string {
    const priorityMap: Record<ReportPriority, string> = {
      [ReportPriority.CRITICA]: 'priority-critical',
      [ReportPriority.ALTA]: 'priority-high',
      [ReportPriority.MEDIA]: 'priority-medium',
      [ReportPriority.BAJA]: 'priority-low'
    };
    return priorityMap[priority];
  }

  getPriorityIcon(priority: ReportPriority): string {
    const iconMap: Record<ReportPriority, string> = {
      [ReportPriority.CRITICA]: 'priority_high',
      [ReportPriority.ALTA]: 'arrow_upward',
      [ReportPriority.MEDIA]: 'remove',
      [ReportPriority.BAJA]: 'arrow_downward'
    };
    return iconMap[priority];
  }

  getReportIcon(type: ReportType): string {
    const icons: Record<ReportType, string> = {
      [ReportType.INCENDIO]: 'local_fire_department',
      [ReportType.ELECTRICO]: 'electrical_services',
      [ReportType.AGUA]: 'water_drop',
      [ReportType.ROBO]: 'security',
      [ReportType.OTRO]: 'report_problem'
    };
    return icons[type];
  }

  getReportColor(type: ReportType): string {
    const colors: Record<ReportType, string> = {
      [ReportType.INCENDIO]: '#f44336',
      [ReportType.ELECTRICO]: '#ff9800',
      [ReportType.AGUA]: '#2196f3',
      [ReportType.ROBO]: '#9c27b0',
      [ReportType.OTRO]: '#666'
    };
    return colors[type];
  }

  getTimeAgo(date?: Date): string {
    if (!date) return '';
    
    const now = new Date();
    const reportDate = new Date(date);
    const diff = now.getTime() - reportDate.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (hours < 24) {
      return `Hace ${hours}h`;
    } else {
      return `Hace ${days}d`;
    }
  }
}