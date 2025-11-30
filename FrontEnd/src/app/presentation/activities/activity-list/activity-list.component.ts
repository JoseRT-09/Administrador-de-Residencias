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
import { GetAllActivitiesUseCase } from '../../../domain/use-cases/activity/get-all-activities.usecase';
import { DeleteActivityUseCase } from '../../../domain/use-cases/activity/delete-activity.usecase';
import { Activity, ActivityType, ActivityStatus } from '../../../domain/models/activity.model';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-activity-list',
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
    TimeAgoPipe
  ],
  templateUrl: './activity-list.component.html',
  styleUrls: ['./activity-list.component.scss']
})
export class ActivityListComponent implements OnInit {
  private getAllActivities = inject(GetAllActivitiesUseCase);
  private deleteActivity = inject(DeleteActivityUseCase);
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns: string[] = ['titulo', 'tipo', 'fecha_inicio', 'ubicacion', 'organizador', 'estado', 'participantes', 'acciones'];
  dataSource = new MatTableDataSource<Activity>();
  
  filterForm!: FormGroup;
  isLoading = true;
  totalActivities = 0;
  pageSize = 10;
  pageIndex = 0;

  tipos = [
    { value: '', label: 'Todos los tipos' },
    { value: ActivityType.REUNION, label: 'Reunión' },
    { value: ActivityType.EVENTO, label: 'Evento' },
    { value: ActivityType.MANTENIMIENTO, label: 'Mantenimiento' },
    { value: ActivityType.ASAMBLEA, label: 'Asamblea' },
    { value: ActivityType.CELEBRACION, label: 'Celebración' },
    { value: ActivityType.OTRO, label: 'Otro' }
  ];

  estados = [
    { value: '', label: 'Todos los estados' },
    { value: ActivityStatus.PROGRAMADA, label: 'Programada' },
    { value: ActivityStatus.EN_CURSO, label: 'En Curso' },
    { value: ActivityStatus.COMPLETADA, label: 'Completada' },
    { value: ActivityStatus.CANCELADA, label: 'Cancelada' }
  ];

  ngOnInit(): void {
    this.initFilterForm();
    this.loadActivities();
    this.setupFilterListeners();
  }

  initFilterForm(): void {
    this.filterForm = this.fb.group({
      search: [''],
      tipo: [''],
      estado: [''],
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
        this.loadActivities();
      });
  }

  loadActivities(): void {
    this.isLoading = true;

    const filters = this.filterForm.value;
    const params: any = {
      page: this.pageIndex + 1,
      limit: this.pageSize
    };

    if (filters.tipo) params.tipo = filters.tipo;
    if (filters.estado) params.estado = filters.estado;
    if (filters.search) params.search = filters.search;
    if (filters.fecha_inicio) params.fecha_inicio = filters.fecha_inicio.toISOString();
    if (filters.fecha_fin) params.fecha_fin = filters.fecha_fin.toISOString();

    this.getAllActivities.execute(params).subscribe({
      next: (response) => {
        this.dataSource.data = response.data;
        this.totalActivities = response.total;
        this.isLoading = false;
      },
      error: (error) => {
        this.notificationService.error('Error al cargar actividades');
        this.isLoading = false;
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadActivities();
  }

  clearFilters(): void {
    this.filterForm.reset({
      search: '',
      tipo: '',
      estado: '',
      fecha_inicio: null,
      fecha_fin: null
    });
  }

  onDelete(activity: Activity): void {
    if (confirm(`¿Estás seguro de eliminar la actividad "${activity.titulo}"?`)) {
      this.deleteActivity.execute(activity.id).subscribe({
        next: () => {
          this.notificationService.success('Actividad eliminada correctamente');
          this.loadActivities();
        },
        error: () => {
          this.notificationService.error('Error al eliminar actividad');
        }
      });
    }
  }

  getTypeClass(type: ActivityType): string {
    const typeMap: Record<ActivityType, string> = {
      [ActivityType.REUNION]: 'type-meeting',
      [ActivityType.EVENTO]: 'type-event',
      [ActivityType.MANTENIMIENTO]: 'type-maintenance',
      [ActivityType.ASAMBLEA]: 'type-assembly',
      [ActivityType.CELEBRACION]: 'type-celebration',
      [ActivityType.OTRO]: 'type-other'
    };
    return typeMap[type];
  }

  getTypeIcon(type: ActivityType): string {
    const iconMap: Record<ActivityType, string> = {
      [ActivityType.REUNION]: 'group',
      [ActivityType.EVENTO]: 'event',
      [ActivityType.MANTENIMIENTO]: 'build',
      [ActivityType.ASAMBLEA]: 'how_to_vote',
      [ActivityType.CELEBRACION]: 'celebration',
      [ActivityType.OTRO]: 'event_note'
    };
    return iconMap[type];
  }

  getStatusClass(status: ActivityStatus): string {
    const statusMap: Record<ActivityStatus, string> = {
      [ActivityStatus.PROGRAMADA]: 'status-scheduled',
      [ActivityStatus.EN_CURSO]: 'status-ongoing',
      [ActivityStatus.COMPLETADA]: 'status-completed',
      [ActivityStatus.CANCELADA]: 'status-cancelled'
    };
    return statusMap[status];
  }

  getStatusIcon(status: ActivityStatus): string {
    const iconMap: Record<ActivityStatus, string> = {
      [ActivityStatus.PROGRAMADA]: 'schedule',
      [ActivityStatus.EN_CURSO]: 'play_circle',
      [ActivityStatus.COMPLETADA]: 'check_circle',
      [ActivityStatus.CANCELADA]: 'cancel'
    };
    return iconMap[status];
  }

  canEdit(): boolean {
    return this.authService.isAdmin();
  }

  canDelete(): boolean {
    return this.authService.isAdmin();
  }

  exportToCSV(): void {
    this.notificationService.info('Exportando a CSV...');
  }
}