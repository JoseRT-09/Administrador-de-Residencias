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
import { GetAllResidencesUseCase } from '../../../domain/use-cases/residence/get-all-residences.usecase';
import { DeleteResidenceUseCase } from '../../../domain/use-cases/residence/delete-residence.usecase';
import { Residence, ResidenceStatus } from '../../../domain/models/residence.model';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatDividerModule } from '@angular/material/divider';
import { FilterPipe } from '@shared/pipes';

@Component({
  selector: 'app-residence-list',
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
    MatDividerModule,
    FilterPipe
  ],
  templateUrl: './residence-list.component.html',
  styleUrls: ['./residence-list.component.scss']
})
export class ResidenceListComponent implements OnInit {
  private getAllResidences = inject(GetAllResidencesUseCase);
  private deleteResidence = inject(DeleteResidenceUseCase);
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns: string[] = ['numero_unidad', 'bloque', 'piso', 'area_m2', 'dueno', 'residente_actual', 'estado', 'acciones'];
  dataSource = new MatTableDataSource<Residence>();
  
  filterForm!: FormGroup;
  isLoading = true;
  totalResidences = 0;
  pageSize = 10;
  pageIndex = 0;

  estados = [
    { value: '', label: 'Todos los estados' },
    { value: ResidenceStatus.OCUPADA, label: 'Ocupada' },
    { value: ResidenceStatus.DISPONIBLE, label: 'Disponible' },
    { value: ResidenceStatus.MANTENIMIENTO, label: 'Mantenimiento' }
  ];

  ngOnInit(): void {
    this.initFilterForm();
    this.loadResidences();
    this.setupFilterListeners();
  }

  initFilterForm(): void {
    this.filterForm = this.fb.group({
      search: [''],
      estado: [''],
      bloque: ['']
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
        this.loadResidences();
      });
  }

  loadResidences(): void {
    this.isLoading = true;

    const filters = this.filterForm.value;
    const params: any = {
      page: this.pageIndex + 1,
      limit: this.pageSize
    };

    if (filters.estado) params.estado = filters.estado;
    if (filters.bloque) params.bloque = filters.bloque;
    if (filters.search) params.search = filters.search;

    this.getAllResidences.execute(params).subscribe({
      next: (response) => {
        this.dataSource.data = response.data;
        this.totalResidences = response.total;
        this.isLoading = false;
      },
      error: (error) => {
        this.notificationService.error('Error al cargar residencias');
        this.isLoading = false;
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadResidences();
  }

  clearFilters(): void {
    this.filterForm.reset({
      search: '',
      estado: '',
      bloque: ''
    });
  }

  onDelete(residence: Residence): void {
    if (confirm(`¿Estás seguro de eliminar la residencia ${residence.numero_unidad}?`)) {
      this.deleteResidence.execute(residence.id).subscribe({
        next: () => {
          this.notificationService.success('Residencia eliminada correctamente');
          this.loadResidences();
        },
        error: () => {
          this.notificationService.error('Error al eliminar residencia');
        }
      });
    }
  }

  getStatusClass(status: ResidenceStatus): string {
    const statusMap: Record<ResidenceStatus, string> = {
      [ResidenceStatus.OCUPADA]: 'status-occupied',
      [ResidenceStatus.DISPONIBLE]: 'status-available',
      [ResidenceStatus.MANTENIMIENTO]: 'status-maintenance'
    };
    return statusMap[status];
  }

  getStatusIcon(status: ResidenceStatus): string {
    const iconMap: Record<ResidenceStatus, string> = {
      [ResidenceStatus.OCUPADA]: 'home',
      [ResidenceStatus.DISPONIBLE]: 'home_work',
      [ResidenceStatus.MANTENIMIENTO]: 'home_repair_service'
    };
    return iconMap[status];
  }

  getResidentName(residence: Residence): string {
    if (residence.residenteActual) {
      return `${residence.residenteActual.nombre} ${residence.residenteActual.apellido}`;
    }
    return 'Sin asignar';
  }

  getOwnerName(residence: Residence): string {
    if (residence.dueno) {
      return `${residence.dueno.nombre} ${residence.dueno.apellido}`;
    }
    return 'Sin dueño';
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