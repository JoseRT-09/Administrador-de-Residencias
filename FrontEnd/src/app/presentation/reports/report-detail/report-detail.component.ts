import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { GetReportByIdUseCase } from '../../../domain/use-cases/report/get-report-by-id.usecase';
import { DeleteReportUseCase } from '../../../domain/use-cases/report/delete-report.usecase';
import { UpdateReportUseCase } from '../../../domain/use-cases/report/update-report.usecase';
import { Report, ReportStatus, ReportType, ReportPriority } from '../../../domain/models/report.model';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';

@Component({
  selector: 'app-report-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatMenuModule,
    MatFormFieldModule,
    MatInputModule,
    MatTabsModule,
    TimeAgoPipe
  ],
  templateUrl: './report-detail.component.html',
  styleUrls: ['./report-detail.component.scss']
})
export class ReportDetailComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private getReportById = inject(GetReportByIdUseCase);
  private deleteReport = inject(DeleteReportUseCase);
  private updateReport = inject(UpdateReportUseCase);
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);

  report: Report | null = null;
  isLoading = true;
  reportId!: number;
  commentForm!: FormGroup;
  isSavingComment = false;

  // Mock comments (en una implementación real vendrían del backend)
  comments: any[] = [];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.reportId = +id;
      this.loadReport();
      this.initCommentForm();
    } else {
      this.router.navigate(['/reports']);
    }
  }

  initCommentForm(): void {
    this.commentForm = this.fb.group({
      comment: ['']
    });
  }

  loadReport(): void {
    this.isLoading = true;
    
    this.getReportById.execute(this.reportId).subscribe({
      next: (report) => {
        this.report = report;
        this.isLoading = false;
      },
      error: (error) => {
        this.notificationService.error('Error al cargar reporte');
        this.router.navigate(['/reports']);
        this.isLoading = false;
      }
    });
  }

  onEdit(): void {
    this.router.navigate(['/reports', this.reportId, 'edit']);
  }

  onDelete(): void {
    if (!this.report) return;

    const confirmed = confirm(
      `¿Estás seguro de eliminar el reporte "${this.report.titulo}"?\n\nEsta acción no se puede deshacer.`
    );

    if (confirmed) {
      this.deleteReport.execute(this.reportId).subscribe({
        next: () => {
          this.notificationService.success('Reporte eliminado correctamente');
          this.router.navigate(['/reports']);
        },
        error: () => {
          this.notificationService.error('Error al eliminar reporte');
        }
      });
    }
  }

  changeStatus(newStatus: ReportStatus): void {
    if (!this.report) return;

    this.updateReport.execute(this.reportId, { estado: newStatus }).subscribe({
      next: () => {
        this.notificationService.success(`Estado actualizado a: ${newStatus}`);
        this.loadReport();
      },
      error: () => {
        this.notificationService.error('Error al actualizar estado');
      }
    });
  }

  addComment(): void {
    const comment = this.commentForm.get('comment')?.value;
    if (!comment.trim()) return;

    this.isSavingComment = true;

    // Simular guardado de comentario
    setTimeout(() => {
      const currentUser = this.authService.getCurrentUser();
      this.comments.unshift({
        id: Date.now(),
        texto: comment,
        usuario: currentUser,
        fecha: new Date()
      });
      this.commentForm.reset();
      this.isSavingComment = false;
      this.notificationService.success('Comentario agregado');
    }, 500);
  }

  getTypeClass(type: ReportType): string {
    const typeMap: Record<ReportType, string> = {
      [ReportType.MANTENIMIENTO]: 'type-maintenance',
      [ReportType.LIMPIEZA]: 'type-cleaning',
      [ReportType.SEGURIDAD]: 'type-security',
      [ReportType.INSTALACIONES]: 'type-facilities',
      [ReportType.OTRO]: 'type-other'
    };
    return typeMap[type];
  }

  getTypeIcon(type: ReportType): string {
    const iconMap: Record<ReportType, string> = {
      [ReportType.MANTENIMIENTO]: 'build',
      [ReportType.LIMPIEZA]: 'cleaning_services',
      [ReportType.SEGURIDAD]: 'security',
      [ReportType.INSTALACIONES]: 'apartment',
      [ReportType.OTRO]: 'help_outline'
    };
    return iconMap[type];
  }

  getStatusClass(status: ReportStatus): string {
    const statusMap: Record<ReportStatus, string> = {
      [ReportStatus.ABIERTO]: 'status-open',
      [ReportStatus.EN_PROGRESO]: 'status-progress',
      [ReportStatus.RESUELTO]: 'status-resolved',
      [ReportStatus.CERRADO]: 'status-closed'
    };
    return statusMap[status];
  }

  getStatusIcon(status: ReportStatus): string {
    const iconMap: Record<ReportStatus, string> = {
      [ReportStatus.ABIERTO]: 'error_outline',
      [ReportStatus.EN_PROGRESO]: 'sync',
      [ReportStatus.RESUELTO]: 'check_circle',
      [ReportStatus.CERRADO]: 'archive'
    };
    return iconMap[status];
  }

  getPriorityClass(priority: ReportPriority): string {
    const priorityMap: Record<ReportPriority, string> = {
      [ReportPriority.BAJA]: 'priority-low',
      [ReportPriority.MEDIA]: 'priority-medium',
      [ReportPriority.ALTA]: 'priority-high',
      [ReportPriority.CRITICA]: 'priority-critical'
    };
    return priorityMap[priority];
  }

  getPriorityIcon(priority: ReportPriority): string {
    const iconMap: Record<ReportPriority, string> = {
      [ReportPriority.BAJA]: 'arrow_downward',
      [ReportPriority.MEDIA]: 'remove',
      [ReportPriority.ALTA]: 'arrow_upward',
      [ReportPriority.CRITICA]: 'priority_high'
    };
    return iconMap[priority];
  }

  getReporterName(): string {
    if (!this.report?.reportado_por) return 'Usuario desconocido';
    return `${this.report.reportado_por.nombre} ${this.report.reportado_por.apellido}`;
  }

  getUserInitials(firstName: string, lastName: string): string {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }

  canEdit(): boolean {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || !this.report) return false;
    
    if (this.authService.isAdmin()) return true;
    
    return this.report.reportado_por?.id === currentUser.id && 
           this.report.estado === ReportStatus.ABIERTO;
  }

  canDelete(): boolean {
    return this.authService.isAdmin();
  }

  printReport(): void {
    window.print();
  }
}