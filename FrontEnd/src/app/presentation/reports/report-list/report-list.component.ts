import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatBadgeModule } from '@angular/material/badge';
import { GetAllReportsUseCase } from '../../../domain/use-cases/report/get-all-reports.usecase';
import { DeleteReportUseCase } from '../../../domain/use-cases/report/delete-report.usecase';
import { UpdateReportUseCase } from '../../../domain/use-cases/report/update-report.usecase';
import { Report, ReportType, ReportStatus, ReportPriority } from '../../../domain/models/report.model';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-report-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatMenuModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatBadgeModule,
    TimeAgoPipe
  ],
  templateUrl: './report-list.component.html',
  styleUrls: ['./report-list.component.scss']
})
export class ReportListComponent implements OnInit {
  private getAllReports = inject(GetAllReportsUseCase);
  private deleteReport = inject(DeleteReportUseCase);
  private updateReport = inject(UpdateReportUseCase);
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns: string[] = ['titulo', 'tipo', 'prioridad', 'residencia', 'reportado_por', 'estado', 'fecha_reporte', 'acciones'];
  dataSource = new MatTableDataSource<Report>();
  
  filterForm: FormGroup;
  isLoading = true;
  totalReports = 0;
  pageSize = 10;
  pageIndex = 0;

  tipos = [
    { value: '', label: 'Todos los tipos' },
    { value: ReportType.MANTENIMIENTO, label: 'Mantenimiento' },
    { value: ReportType.LIMPIEZA, label: 'Limpieza' },
    { value: ReportType.SEGURIDAD, label: 'Seguridad' },
    { value: ReportType.INSTALACIONES, label: 'Instalaciones' },
    { value: ReportType.OTRO, label: 'Otro' }
  ];

  estados = [
    { value: '', label: 'Todos los estados' },
    { value: ReportStatus.ABIERTO, label: 'Abierto' },
    { value: ReportStatus.EN_PROGRESO, label: 'En Progreso' },
    { value: ReportStatus.RESUELTO, label: 'Resuelto' },
    { value: ReportStatus.CERRADO, label: 'Cerrado' }
  ];

  prioridades = [
    { value: '', label: 'Todas las prioridades' },
    { value: ReportPriority.BAJA, label: 'Baja' },
    { value: ReportPriority.MEDIA, label: 'Media' },
    { value: ReportPriority.ALTA, label: 'Alta' },
    { value: ReportPriority.CRITICA, label: 'Crítica' }
  ];

  ngOnInit(): void {
    this.initFilterForm();
    this.loadReports();
    this.setupFilterListeners();
  }

  initFilterForm(): void {
    this.filterForm = this.fb.group({
      search: [''],
      tipo: [''],
      estado: [''],
      prioridad: [''],
      fecha_inicio: [null],
      fecha_fin: [null]
    });
  }

  setupFilterListeners(): void {
    this.filterForm.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.pageIndex = 0;
        this.loadReports();
      });
  }

  loadReports(): void {
    this.isLoading = true;

    const filters = this.filterForm.value;
    const params: any = {
      page: this.pageIndex + 1,
      limit: this.pageSize
    };

    if (filters.tipo) params.tipo = filters.tipo;
    if (filters.estado) params.estado = filters.estado;
    if (filters.prioridad) params.prioridad = filters.prioridad;
    if (filters.search) params.search = filters.search;
    if (filters.fecha_inicio) params.fecha_inicio = filters.fecha_inicio.toISOString();
    if (filters.fecha_fin) params.fecha_fin = filters.fecha_fin.toISOString();

    this.getAllReports.execute(params).subscribe({
      next: (response) => {
        this.dataSource.data = response.data;
        this.totalReports = response.total;
        this.isLoading = false;
      },
      error: (error) => {
        this.notificationService.error('Error al cargar reportes');
        this.isLoading = false;
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadReports();
  }

  clearFilters(): void {
    this.filterForm.reset({
      search: '',
      tipo: '',
      estado: '',
      prioridad: '',
      fecha_inicio: null,
      fecha_fin: null
    });
  }

  onDelete(report: Report): void {
    if (confirm(`¿Estás seguro de eliminar el reporte "${report.titulo}"?`)) {
      this.deleteReport.execute(report.id).subscribe({
        next: () => {
          this.notificationService.success('Reporte eliminado correctamente');
          this.loadReports();
        },
        error: () => {
          this.notificationService.error('Error al eliminar reporte');
        }
      });
    }
  }

  changeStatus(report: Report, newStatus: ReportStatus): void {
    this.updateReport.execute(report.id, { estado: newStatus }).subscribe({
      next: () => {
        this.notificationService.success(`Estado actualizado a: ${newStatus}`);
        this.loadReports();
      },
      error: () => {
        this.notificationService.error('Error al actualizar estado');
      }
    });
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

  getReporterName(report: Report): string {
    if (report.reportado_por) {
      return `${report.reportado_por.nombre} ${report.reportado_por.apellido}`;
    }
    return 'Usuario desconocido';
  }

  canEdit(report: Report): boolean {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return false;
    
    // Admin puede editar todos
    if (this.authService.isAdmin()) return true;
    
    // Usuario puede editar sus propios reportes si están abiertos
    return report.reportado_por?.id === currentUser.id && report.estado === ReportStatus.ABIERTO;
  }

  canDelete(): boolean {
    return this.authService.isAdmin();
  }

  exportToCSV(): void {
    this.notificationService.info('Exportando a CSV...');
  }

  getOpenCount(): number {
    return this.dataSource.data.filter(r => r.estado === ReportStatus.ABIERTO).length;
  }

  getInProgressCount(): number {
    return this.dataSource.data.filter(r => r.estado === ReportStatus.EN_PROGRESO).length;
  }

  getCriticalCount(): number {
    return this.dataSource.data.filter(r => r.prioridad === ReportPriority.CRITICA).length;
  }
}