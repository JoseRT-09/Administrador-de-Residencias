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
import { GetAllComplaintsUseCase } from '../../../domain/use-cases/complaint/get-all-complaints.usecase';
import { DeleteComplaintUseCase } from '../../../domain/use-cases/complaint/delete-complaint.usecase';
import { UpdateComplaintUseCase } from '../../../domain/use-cases/complaint/update-complaint.usecase';
import { Complaint, ComplaintCategory, ComplaintStatus, ComplaintPriority } from '../../../domain/models/complaint.model';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-complaint-list',
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
  templateUrl: './complaint-list.component.html',
  styleUrls: ['./complaint-list.component.scss']
})
export class ComplaintListComponent implements OnInit {
  private getAllComplaints = inject(GetAllComplaintsUseCase);
  private deleteComplaint = inject(DeleteComplaintUseCase);
  private updateComplaint = inject(UpdateComplaintUseCase);
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns: string[] = ['asunto', 'categoria', 'prioridad', 'usuario', 'residencia', 'estado', 'fecha', 'acciones'];
  dataSource = new MatTableDataSource<Complaint>();
  
  filterForm!: FormGroup;
  isLoading = true;
  totalComplaints = 0;
  pageSize = 10;
  pageIndex = 0;

  categorias = [
    { value: '', label: 'Todas las categorías' },
    { value: ComplaintCategory.RUIDO, label: 'Ruido' },
    { value: ComplaintCategory.CONVIVENCIA, label: 'Convivencia' },
    { value: ComplaintCategory.MASCOTAS, label: 'Mascotas' },
    { value: ComplaintCategory.ESTACIONAMIENTO, label: 'Estacionamiento' },
    { value: ComplaintCategory.AREAS_COMUNES, label: 'Áreas Comunes' },
    { value: ComplaintCategory.LIMPIEZA, label: 'Limpieza' },
    { value: ComplaintCategory.SEGURIDAD, label: 'Seguridad' },
    { value: ComplaintCategory.MANTENIMIENTO, label: 'Mantenimiento' },
    { value: ComplaintCategory.ADMINISTRACION, label: 'Administración' },
    { value: ComplaintCategory.OTRO, label: 'Otro' }
  ];

  estados = [
    { value: '', label: 'Todos los estados' },
    { value: ComplaintStatus.NUEVA, label: 'Nueva' },
    { value: ComplaintStatus.EN_REVISION, label: 'En Revisión' },
    { value: ComplaintStatus.EN_PROCESO, label: 'En Proceso' },
    { value: ComplaintStatus.RESUELTA, label: 'Resuelta' },
    { value: ComplaintStatus.CERRADA, label: 'Cerrada' },
    { value: ComplaintStatus.RECHAZADA, label: 'Rechazada' }
  ];

  prioridades = [
    { value: '', label: 'Todas las prioridades' },
    { value: ComplaintPriority.BAJA, label: 'Baja' },
    { value: ComplaintPriority.MEDIA, label: 'Media' },
    { value: ComplaintPriority.ALTA, label: 'Alta' },
    { value: ComplaintPriority.URGENTE, label: 'Urgente' }
  ];

  ngOnInit(): void {
    this.initFilterForm();
    this.loadComplaints();
    this.setupFilterListeners();
  }

  initFilterForm(): void {
    this.filterForm = this.fb.group({
      search: [''],
      categoria: [''],
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
        this.loadComplaints();
      });
  }

  loadComplaints(): void {
    this.isLoading = true;

    const filters = this.filterForm.value;
    const params: any = {
      page: this.pageIndex + 1,
      limit: this.pageSize
    };

    if (filters.categoria) params.categoria = filters.categoria;
    if (filters.estado) params.estado = filters.estado;
    if (filters.prioridad) params.prioridad = filters.prioridad;
    if (filters.search) params.search = filters.search;
    if (filters.fecha_inicio) params.fecha_inicio = filters.fecha_inicio.toISOString();
    if (filters.fecha_fin) params.fecha_fin = filters.fecha_fin.toISOString();

    this.getAllComplaints.execute(params).subscribe({
      next: (response) => {
        this.dataSource.data = response.data;
        this.totalComplaints = response.total;
        this.isLoading = false;
      },
      error: (error) => {
        this.notificationService.error('Error al cargar quejas');
        this.isLoading = false;
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadComplaints();
  }

  clearFilters(): void {
    this.filterForm.reset({
      search: '',
      categoria: '',
      estado: '',
      prioridad: '',
      fecha_inicio: null,
      fecha_fin: null
    });
  }

  onDelete(complaint: Complaint): void {
    if (confirm(`¿Estás seguro de eliminar la queja "${complaint.asunto}"?`)) {
      this.deleteComplaint.execute(complaint.id).subscribe({
        next: () => {
          this.notificationService.success('Queja eliminada correctamente');
          this.loadComplaints();
        },
        error: () => {
          this.notificationService.error('Error al eliminar queja');
        }
      });
    }
  }

  changeStatus(complaint: Complaint, newStatus: ComplaintStatus): void {
    this.updateComplaint.execute(complaint.id, { estado: newStatus }).subscribe({
      next: () => {
        this.notificationService.success(`Estado actualizado a: ${newStatus}`);
        this.loadComplaints();
      },
      error: () => {
        this.notificationService.error('Error al actualizar estado');
      }
    });
  }

  getCategoryClass(category: ComplaintCategory): string {
    const categoryMap: Record<ComplaintCategory, string> = {
      [ComplaintCategory.RUIDO]: 'category-noise',
      [ComplaintCategory.CONVIVENCIA]: 'category-coexistence',
      [ComplaintCategory.MASCOTAS]: 'category-pets',
      [ComplaintCategory.ESTACIONAMIENTO]: 'category-parking',
      [ComplaintCategory.AREAS_COMUNES]: 'category-common',
      [ComplaintCategory.LIMPIEZA]: 'category-cleaning',
      [ComplaintCategory.SEGURIDAD]: 'category-security',
      [ComplaintCategory.MANTENIMIENTO]: 'category-maintenance',
      [ComplaintCategory.ADMINISTRACION]: 'category-admin',
      [ComplaintCategory.OTRO]: 'category-other'
    };
    return categoryMap[category];
  }

  getCategoryIcon(category: ComplaintCategory): string {
    const iconMap: Record<ComplaintCategory, string> = {
      [ComplaintCategory.RUIDO]: 'volume_up',
      [ComplaintCategory.CONVIVENCIA]: 'groups',
      [ComplaintCategory.MASCOTAS]: 'pets',
      [ComplaintCategory.ESTACIONAMIENTO]: 'local_parking',
      [ComplaintCategory.AREAS_COMUNES]: 'domain',
      [ComplaintCategory.LIMPIEZA]: 'cleaning_services',
      [ComplaintCategory.SEGURIDAD]: 'security',
      [ComplaintCategory.MANTENIMIENTO]: 'build',
      [ComplaintCategory.ADMINISTRACION]: 'admin_panel_settings',
      [ComplaintCategory.OTRO]: 'help_outline'
    };
    return iconMap[category];
  }

  getStatusClass(status: ComplaintStatus): string {
    const statusMap: Record<ComplaintStatus, string> = {
      [ComplaintStatus.NUEVA]: 'status-new',
      [ComplaintStatus.EN_REVISION]: 'status-review',
      [ComplaintStatus.EN_PROCESO]: 'status-process',
      [ComplaintStatus.RESUELTA]: 'status-resolved',
      [ComplaintStatus.CERRADA]: 'status-closed',
      [ComplaintStatus.RECHAZADA]: 'status-rejected'
    };
    return statusMap[status];
  }

  getStatusIcon(status: ComplaintStatus): string {
    const iconMap: Record<ComplaintStatus, string> = {
      [ComplaintStatus.NUEVA]: 'fiber_new',
      [ComplaintStatus.EN_REVISION]: 'rate_review',
      [ComplaintStatus.EN_PROCESO]: 'sync',
      [ComplaintStatus.RESUELTA]: 'check_circle',
      [ComplaintStatus.CERRADA]: 'archive',
      [ComplaintStatus.RECHAZADA]: 'cancel'
    };
    return iconMap[status];
  }

  getPriorityClass(priority: ComplaintPriority): string {
    const priorityMap: Record<ComplaintPriority, string> = {
      [ComplaintPriority.BAJA]: 'priority-low',
      [ComplaintPriority.MEDIA]: 'priority-medium',
      [ComplaintPriority.ALTA]: 'priority-high',
      [ComplaintPriority.URGENTE]: 'priority-urgent'
    };
    return priorityMap[priority];
  }

  getPriorityIcon(priority: ComplaintPriority): string {
    const iconMap: Record<ComplaintPriority, string> = {
      [ComplaintPriority.BAJA]: 'arrow_downward',
      [ComplaintPriority.MEDIA]: 'remove',
      [ComplaintPriority.ALTA]: 'arrow_upward',
      [ComplaintPriority.URGENTE]: 'priority_high'
    };
    return iconMap[priority];
  }

  getUserName(complaint: Complaint): string {
    if (complaint.usuario) {
      return `${complaint.usuario.nombre} ${complaint.usuario.apellido}`;
    }
    return 'Usuario desconocido';
  }

  canEdit(complaint: Complaint): boolean {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return false;
    
    if (this.authService.isAdmin()) return true;
    
    return complaint.usuario?.id === currentUser.id && complaint.estado === ComplaintStatus.NUEVA;
  }

  canDelete(): boolean {
    return this.authService.isAdmin();
  }

  exportToCSV(): void {
    this.notificationService.info('Exportando a CSV...');
  }

  getNewCount(): number {
    return this.dataSource.data.filter(c => c.estado === ComplaintStatus.NUEVA).length;
  }

  getInProcessCount(): number {
    return this.dataSource.data.filter(c => 
      c.estado === ComplaintStatus.EN_REVISION || c.estado === ComplaintStatus.EN_PROCESO
    ).length;
  }

  getUrgentCount(): number {
    return this.dataSource.data.filter(c => c.prioridad === ComplaintPriority.URGENTE).length;
  }
}