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
import { MatDividerModule } from '@angular/material/divider';
import { GetAllServiceCostsUseCase } from '../../../domain/use-cases/service-cost/get-all-service-costs.usecase';
import { DeleteServiceCostUseCase } from '../../../domain/use-cases/service-cost/delete-service-cost.usecase';
import { ServiceCost, ServiceCostPeriod, ServiceCostStatus } from '../../../domain/models/service-cost.model';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { TruncatePipe } from '../../../shared/pipes/truncate.pipe';

@Component({
  selector: 'app-service-cost-list',
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
    MatDividerModule,
    TruncatePipe
  ],
  templateUrl: './service-cost-list.component.html',
  styleUrls: ['./service-cost-list.component.scss']
})
export class ServiceCostListComponent implements OnInit {
  private getAllServiceCosts = inject(GetAllServiceCostsUseCase);
  private deleteServiceCost = inject(DeleteServiceCostUseCase);
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns: string[] = ['concepto', 'residencia', 'monto', 'periodo', 'fecha_vencimiento', 'estado', 'acciones'];
  dataSource = new MatTableDataSource<ServiceCost>();
  
  filterForm!: FormGroup;
  isLoading = true;
  totalCosts = 0;
  pageSize = 10;
  pageIndex = 0;

  periodos = [
    { value: '', label: 'Todos los periodos' },
    { value: ServiceCostPeriod.MENSUAL, label: 'Mensual' },
    { value: ServiceCostPeriod.TRIMESTRAL, label: 'Trimestral' },
    { value: ServiceCostPeriod.ANUAL, label: 'Anual' }
  ];

  estados = [
    { value: '', label: 'Todos los estados' },
    { value: ServiceCostStatus.PENDIENTE, label: 'Pendiente' },
    { value: ServiceCostStatus.PAGADO, label: 'Pagado' },
    { value: ServiceCostStatus.VENCIDO, label: 'Vencido' }
  ];

  ngOnInit(): void {
    this.initFilterForm();
    this.loadServiceCosts();
    this.setupFilterListeners();
  }

  initFilterForm(): void {
    this.filterForm = this.fb.group({
      search: [''],
      periodo: [''],
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
        this.loadServiceCosts();
      });
  }

  loadServiceCosts(): void {
    this.isLoading = true;

    const filters = this.filterForm.value;
    const params: any = {
      page: this.pageIndex + 1,
      limit: this.pageSize
    };

    if (filters.periodo) params.periodo = filters.periodo;
    if (filters.estado) params.estado = filters.estado;
    if (filters.search) params.search = filters.search;
    if (filters.fecha_inicio) params.fecha_inicio = filters.fecha_inicio.toISOString();
    if (filters.fecha_fin) params.fecha_fin = filters.fecha_fin.toISOString();

    this.getAllServiceCosts.execute(params).subscribe({
      next: (response) => {
        this.dataSource.data = response.data;
        this.totalCosts = response.total;
        this.isLoading = false;
      },
      error: (error) => {
        this.notificationService.error('Error al cargar costos de servicio');
        this.isLoading = false;
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadServiceCosts();
  }

  clearFilters(): void {
    this.filterForm.reset({
      search: '',
      periodo: '',
      estado: '',
      fecha_inicio: null,
      fecha_fin: null
    });
  }

  onDelete(cost: ServiceCost): void {
    if (confirm(`¿Estás seguro de eliminar el costo "${cost.nombre_servicio}"?`)) {
      this.deleteServiceCost.execute(cost.id).subscribe({
        next: () => {
          this.notificationService.success('Costo eliminado correctamente');
          this.loadServiceCosts();
        },
        error: () => {
          this.notificationService.error('Error al eliminar costo');
        }
      });
    }
  }

  getStatusClass(status: ServiceCostStatus): string {
    const statusMap: Record<ServiceCostStatus, string> = {
      [ServiceCostStatus.PENDIENTE]: 'status-pending',
      [ServiceCostStatus.PAGADO]: 'status-paid',
      [ServiceCostStatus.VENCIDO]: 'status-overdue'
    };
    return statusMap[status];
  }

  getStatusIcon(status: ServiceCostStatus): string {
    const iconMap: Record<ServiceCostStatus, string> = {
      [ServiceCostStatus.PENDIENTE]: 'schedule',
      [ServiceCostStatus.PAGADO]: 'check_circle',
      [ServiceCostStatus.VENCIDO]: 'error'
    };
    return iconMap[status];
  }

  getPeriodIcon(period: ServiceCostPeriod): string {
    const iconMap: Record<ServiceCostPeriod, string> = {
      [ServiceCostPeriod.MENSUAL]: 'calendar_view_month',
      [ServiceCostPeriod.TRIMESTRAL]: 'calendar_view_week',
      [ServiceCostPeriod.ANUAL]: 'calendar_today'
    };
    return iconMap[period];
  }

  isOverdue(cost: ServiceCost): boolean {
    if (!cost.fecha_vencimiento) return false;
    const today = new Date();
    const dueDate = new Date(cost.fecha_vencimiento);
    return dueDate < today && cost.estado !== ServiceCostStatus.PAGADO;
  }

  getDaysUntilDue(cost: ServiceCost): number {
    if (!cost.fecha_vencimiento) return 0;
    const today = new Date();
    const dueDate = new Date(cost.fecha_vencimiento);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  getTotalAmount(): number {
    return this.dataSource.data.reduce((sum, cost) => sum + cost.monto, 0);
  }

  getPendingAmount(): number {
    return this.dataSource.data
      .filter(cost => cost.estado === ServiceCostStatus.PENDIENTE)
      .reduce((sum, cost) => sum + cost.monto, 0);
  }

  getPaidCount(): number {
    return this.dataSource.data
      .filter(cost => cost.estado === ServiceCostStatus.PAGADO)
      .length;
  }

  canEdit(): boolean {
    return this.authService.isAdmin();
  }

  canDelete(): boolean {
    return this.authService.isSuperAdmin();
  }

  exportToCSV(): void {
    this.notificationService.info('Exportando a CSV...');
  }
}