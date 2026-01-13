import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { GetServiceCostByIdUseCase } from '../../../domain/use-cases/service-cost/get-service-cost-by-id.usecase';
import { CreateServiceCostUseCase } from '../../../domain/use-cases/service-cost/create-service-cost.usecase';
import { UpdateServiceCostUseCase } from '../../../domain/use-cases/service-cost/update-service-cost.usecase';
import { GetAllResidencesUseCase } from '../../../domain/use-cases/residence/get-all-residences.usecase';
import { ServiceCost, ServiceCostPeriod, ServiceCostStatus } from '../../../domain/models/service-cost.model';
import { Residence } from '../../../domain/models/residence.model';
import { NotificationService } from '../../../core/services/notification.service';
import { MatTooltipModule } from '@angular/material/tooltip';
@Component({
  selector: 'app-service-cost-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTooltipModule
  ],
  templateUrl: './service-cost-form.component.html',
  styleUrls: ['./service-cost-form.component.scss']
})
export class ServiceCostFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private getServiceCostById = inject(GetServiceCostByIdUseCase);
  private createServiceCost = inject(CreateServiceCostUseCase);
  private updateServiceCost = inject(UpdateServiceCostUseCase);
  private getAllResidences = inject(GetAllResidencesUseCase);
  private notificationService = inject(NotificationService);

  costForm!: FormGroup;
  isEditMode = false;
  costId?: number;
  isLoading = false;
  isSaving = false;
  residences: Residence[] = [];

  periodos = [
    { 
      value: ServiceCostPeriod.MENSUAL, 
      label: 'Mensual',
      icon: 'calendar_view_month',
      description: 'Cobro mensual recurrente'
    },
    { 
      value: ServiceCostPeriod.TRIMESTRAL, 
      label: 'Trimestral',
      icon: 'calendar_view_week',
      description: 'Cobro cada 3 meses'
    },
    { 
      value: ServiceCostPeriod.ANUAL, 
      label: 'Anual',
      icon: 'calendar_today',
      description: 'Cobro anual'
    }
  ];

  estados = [
    { 
      value: ServiceCostStatus.PENDIENTE, 
      label: 'Pendiente',
      icon: 'schedule',
      color: '#ff9800'
    },
    { 
      value: ServiceCostStatus.PAGADO, 
      label: 'Pagado',
      icon: 'check_circle',
      color: '#4caf50'
    },
    { 
      value: ServiceCostStatus.VENCIDO, 
      label: 'Vencido',
      icon: 'error',
      color: '#f44336'
    }
  ];

  ngOnInit(): void {
    this.initForm();
    this.loadResidences();
    this.checkEditMode();
  }

  initForm(): void {
    this.costForm = this.fb.group({
      concepto: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: [''],
      monto: ['', [Validators.required, Validators.min(0.01)]],
      periodo: [ServiceCostPeriod.MENSUAL, [Validators.required]],
      fecha_inicio: [new Date(), [Validators.required]],
      fecha_vencimiento: ['', [Validators.required]],
      residencia_id: [null],
      estado: [ServiceCostStatus.PENDIENTE, [Validators.required]],
      notas: ['']
    });
  }

  loadResidences(): void {
    this.getAllResidences.execute({ page: 1, limit: 1000 }).subscribe({
      next: (response) => {
        this.residences = response.data;
      },
      error: (error) => {
        console.error('Error loading residences:', error);
      }
    });
  }

  checkEditMode(): void {
    const id = this.route.snapshot.paramMap.get('id');
    
    if (id && id !== 'new') {
      this.isEditMode = true;
      this.costId = +id;
      this.loadServiceCost();
    }
  }

  loadServiceCost(): void {
    if (!this.costId) return;

    this.isLoading = true;
    this.getServiceCostById.execute(this.costId).subscribe({
      next: (cost) => {
        this.costForm.patchValue({
          nombre_servicio: cost.nombre_servicio,
          descripcion: cost.descripcion,
          monto: cost.monto,
          periodo: cost.periodo,
          fecha_inicio: new Date(cost.fecha_inicio),
          fecha_vencimiento: new Date(cost.fecha_vencimiento),
          residencia_id: cost.residencia_id,
          estado: cost.estado,
        });
        this.isLoading = false;
      },
      error: (error) => {
        this.notificationService.error('Error al cargar costo');
        this.router.navigate(['/service-costs']);
        this.isLoading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.costForm.valid) {
      this.isSaving = true;
      const formData = { ...this.costForm.value };

      // Convertir fechas a ISO string
      if (formData.fecha_inicio instanceof Date) {
        formData.fecha_inicio = formData.fecha_inicio.toISOString();
      }
      if (formData.fecha_vencimiento instanceof Date) {
        formData.fecha_vencimiento = formData.fecha_vencimiento.toISOString();
      }

      // Convertir valores vacíos a null
      Object.keys(formData).forEach(key => {
        if (formData[key] === '' || formData[key] === undefined) {
          formData[key] = null;
        }
      });

      const operation = this.isEditMode
        ? this.updateServiceCost.execute(this.costId!, formData)
        : this.createServiceCost.execute(formData);

      operation.subscribe({
        next: () => {
          this.notificationService.success(
            this.isEditMode ? 'Costo actualizado correctamente' : 'Costo creado correctamente'
          );
          this.router.navigate(['/service-costs']);
        },
        error: (error) => {
          this.notificationService.error('Error al guardar costo');
          this.isSaving = false;
        },
        complete: () => {
          this.isSaving = false;
        }
      });
    } else {
      this.markFormGroupTouched(this.costForm);
      this.notificationService.warning('Por favor, completa todos los campos requeridos');
    }
  }

  onCancel(): void {
    if (this.costForm.dirty) {
      if (confirm('¿Estás seguro de cancelar? Los cambios no guardados se perderán.')) {
        this.router.navigate(['/service-costs']);
      }
    } else {
      this.router.navigate(['/service-costs']);
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  getErrorMessage(fieldName: string): string {
    const control = this.costForm.get(fieldName);
    
    if (control?.hasError('required')) {
      return 'Este campo es requerido';
    }
    
    if (control?.hasError('minlength')) {
      const minLength = control.errors?.['minlength'].requiredLength;
      return `Mínimo ${minLength} caracteres`;
    }

    if (control?.hasError('min')) {
      return 'El monto debe ser mayor a 0';
    }
    
    return '';
  }

  calculateDueDate(): void {
    const startDate = this.costForm.get('fecha_inicio')?.value;
    const period = this.costForm.get('periodo')?.value;

    if (startDate && period) {
      const dueDate = new Date(startDate);
      
      switch (period) {
        case ServiceCostPeriod.MENSUAL:
          dueDate.setMonth(dueDate.getMonth() + 1);
          break;
        case ServiceCostPeriod.TRIMESTRAL:
          dueDate.setMonth(dueDate.getMonth() + 3);
          break;
        case ServiceCostPeriod.ANUAL:
          dueDate.setFullYear(dueDate.getFullYear() + 1);
          break;
      }

      this.costForm.patchValue({ fecha_vencimiento: dueDate });
    }
  }
}