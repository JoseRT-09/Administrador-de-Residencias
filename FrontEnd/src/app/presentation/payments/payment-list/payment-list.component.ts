import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
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
import { GetAllPaymentsUseCase } from '../../../domain/use-cases/payment/get-all-payments.usecase';
import { DeletePaymentUseCase } from '../../../domain/use-cases/payment/delete-payment.usecase';
import { Payment, PaymentMethod, PaymentStatus } from '../../../domain/models/payment.model';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { FilterPipe } from '../../../shared/pipes/filter.pipe';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-payment-list',
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
    FilterPipe
  ],
  templateUrl: './payment-list.component.html',
  styleUrls: ['./payment-list.component.scss']
})
export class PaymentListComponent implements OnInit {
  private getAllPayments = inject(GetAllPaymentsUseCase);
  private deletePayment = inject(DeletePaymentUseCase);
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns: string[] = ['fecha_pago', 'usuario', 'costo_servicio', 'monto', 'metodo_pago', 'estado', 'acciones'];
  dataSource = new MatTableDataSource<Payment>();
  
  filterForm!: FormGroup;
  isLoading = true;
  totalPayments = 0;
  pageSize = 10;
  pageIndex = 0;

  metodosPago = [
    { value: '', label: 'Todos los métodos' },
    { value: PaymentMethod.EFECTIVO, label: 'Efectivo' },
    { value: PaymentMethod.TARJETA, label: 'Tarjeta' },
    { value: PaymentMethod.TRANSFERENCIA, label: 'Transferencia' },
    { value: PaymentMethod.CHEQUE, label: 'Cheque' }
  ];

  estados = [
    { value: '', label: 'Todos los estados' },
    { value: PaymentStatus.COMPLETADO, label: 'Completado' },
    { value: PaymentStatus.PENDIENTE, label: 'Pendiente' },
    { value: PaymentStatus.RECHAZADO, label: 'Rechazado' }
  ];

  ngOnInit(): void {
    this.initFilterForm();
    this.loadPayments();
    this.setupFilterListeners();
  }

  initFilterForm(): void {
    this.filterForm = this.fb.group({
      search: [''],
      metodo_pago: [''],
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
        this.loadPayments();
      });
  }

  loadPayments(): void {
    this.isLoading = true;

    const filters = this.filterForm.value;
    const params: any = {
      page: this.pageIndex + 1,
      limit: this.pageSize
    };

    if (filters.metodo_pago) params.metodo_pago = filters.metodo_pago;
    if (filters.estado) params.estado = filters.estado;
    if (filters.search) params.search = filters.search;
    if (filters.fecha_inicio) params.fecha_inicio = filters.fecha_inicio.toISOString();
    if (filters.fecha_fin) params.fecha_fin = filters.fecha_fin.toISOString();

    this.getAllPayments.execute(params).subscribe({
      next: (response) => {
        this.dataSource.data = response.data;
        this.totalPayments = response.total;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar pagos:', error);
        this.notificationService.error('Error al cargar pagos');
        this.isLoading = false;
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadPayments();
  }

  clearFilters(): void {
    this.filterForm.reset({
      search: '',
      metodo_pago: '',
      estado: '',
      fecha_inicio: null,
      fecha_fin: null
    });
  }

  onDelete(payment: Payment): void {
    if (confirm(`¿Estás seguro de eliminar este pago?\n\nMonto: $${payment.monto || payment.monto_pagado}`)) {
      this.deletePayment.execute(payment.id).subscribe({
        next: () => {
          this.notificationService.success('Pago eliminado correctamente');
          this.loadPayments();
        },
        error: (error) => {
          console.error('Error al eliminar pago:', error);
          this.notificationService.error('Error al eliminar pago');
        }
      });
    }
  }

  getStatusClass(status: PaymentStatus): string {
    const statusMap: Record<PaymentStatus, string> = {
      [PaymentStatus.COMPLETADO]: 'status-completed',
      [PaymentStatus.PENDIENTE]: 'status-pending',
      [PaymentStatus.RECHAZADO]: 'status-rejected'
    };
    return statusMap[status];
  }

  getStatusIcon(status: PaymentStatus): string {
    const iconMap: Record<PaymentStatus, string> = {
      [PaymentStatus.COMPLETADO]: 'check_circle',
      [PaymentStatus.PENDIENTE]: 'schedule',
      [PaymentStatus.RECHAZADO]: 'cancel'
    };
    return iconMap[status];
  }

  getMethodIcon(method: PaymentMethod): string {
    const iconMap: Record<PaymentMethod, string> = {
      [PaymentMethod.EFECTIVO]: 'payments',
      [PaymentMethod.TARJETA]: 'credit_card',
      [PaymentMethod.TRANSFERENCIA]: 'account_balance',
      [PaymentMethod.CHEQUE]: 'receipt'
    };
    return iconMap[method];
  }

  getTotalAmount(): number {
    return this.dataSource.data.reduce((sum, payment) => {
      const monto = payment.monto || payment.monto_pagado || 0;
      return sum + Number(monto);
    }, 0);
  }

  getCompletedAmount(): number {
    return this.dataSource.data
      .filter(payment => payment.estado === PaymentStatus.COMPLETADO)
      .reduce((sum, payment) => {
        const monto = payment.monto || payment.monto_pagado || 0;
        return sum + Number(monto);
      }, 0);
  }

  getUserName(payment: Payment): string {
    const user = payment.usuario || payment.residente;
    if (user) {
      return `${user.nombre} ${user.apellido}`;
    }
    return 'Usuario desconocido';
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

  printReceipt(payment: Payment): void {
    this.router.navigate(['/payments', payment.id], { 
      queryParams: { print: true } 
    });
  }
}