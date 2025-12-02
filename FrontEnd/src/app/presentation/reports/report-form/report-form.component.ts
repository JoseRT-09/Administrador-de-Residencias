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
import { MatChipsModule } from '@angular/material/chips';
import { GetReportByIdUseCase } from '../../../domain/use-cases/report/get-report-by-id.usecase';
import { CreateReportUseCase } from '../../../domain/use-cases/report/create-report.usecase';
import { UpdateReportUseCase } from '../../../domain/use-cases/report/update-report.usecase';
import { GetAllResidencesUseCase } from '../../../domain/use-cases/residence/get-all-residences.usecase';
import { Report, ReportType, ReportStatus, ReportPriority } from '../../../domain/models/report.model';
import { Residence } from '../../../domain/models/residence.model';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-report-form',
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
    MatChipsModule
  ],
  templateUrl: './report-form.component.html',
  styleUrls: ['./report-form.component.scss']
})
export class ReportFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private getReportById = inject(GetReportByIdUseCase);
  private createReport = inject(CreateReportUseCase);
  private updateReport = inject(UpdateReportUseCase);
  private getAllResidences = inject(GetAllResidencesUseCase);
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);

  reportForm!: FormGroup;
  isEditMode = false;
  reportId?: number;
  isLoading = false;
  isSaving = false;
  residences: Residence[] = [];

  // Tipos actualizados según el backend
  tipos = [
    { 
      value: ReportType.INCENDIO, 
      label: 'Incendio',
      icon: 'local_fire_department',
      description: 'Emergencias relacionadas con fuego'
    },
    { 
      value: ReportType.ELECTRICO, 
      label: 'Eléctrico',
      icon: 'flash_on',
      description: 'Problemas con instalaciones eléctricas'
    },
    { 
      value: ReportType.AGUA, 
      label: 'Agua',
      icon: 'water_drop',
      description: 'Fugas y problemas de plomería'
    },
    { 
      value: ReportType.ROBO, 
      label: 'Robo',
      icon: 'security',
      description: 'Incidentes de seguridad y robos'
    },
    { 
      value: ReportType.OTRO, 
      label: 'Otro',
      icon: 'help_outline',
      description: 'Otros tipos de incidencias'
    }
  ];

  prioridades = [
    { 
      value: ReportPriority.BAJA, 
      label: 'Baja',
      icon: 'arrow_downward',
      color: '#4caf50',
      description: 'No es urgente'
    },
    { 
      value: ReportPriority.MEDIA, 
      label: 'Media',
      icon: 'remove',
      color: '#ffc107',
      description: 'Atención moderada'
    },
    { 
      value: ReportPriority.ALTA, 
      label: 'Alta',
      icon: 'arrow_upward',
      color: '#ff9800',
      description: 'Requiere atención pronta'
    },
    { 
      value: ReportPriority.CRITICA, 
      label: 'Crítica',
      icon: 'priority_high',
      color: '#f44336',
      description: 'Atención inmediata'
    }
  ];

  estados = [
    { 
      value: ReportStatus.ABIERTO, 
      label: 'Abierto',
      icon: 'error_outline',
      color: '#ff9800'
    },
    { 
      value: ReportStatus.EN_PROGRESO, 
      label: 'En Progreso',
      icon: 'sync',
      color: '#2196f3'
    },
    { 
      value: ReportStatus.RESUELTO, 
      label: 'Resuelto',
      icon: 'check_circle',
      color: '#4caf50'
    },
    { 
      value: ReportStatus.CERRADO, 
      label: 'Cerrado',
      icon: 'archive',
      color: '#9e9e9e'
    }
  ];

  ngOnInit(): void {
    this.initForm();
    this.loadResidences();
    this.checkEditMode();
  }

  initForm(): void {
    this.reportForm = this.fb.group({
      titulo: ['', [Validators.required, Validators.minLength(5)]],
      descripcion: ['', [Validators.required, Validators.minLength(10)]],
      tipo: [ReportType.OTRO, [Validators.required]],
      prioridad: [ReportPriority.MEDIA, [Validators.required]],
      estado: [ReportStatus.ABIERTO, [Validators.required]],
      residencia_id: [null]
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
      this.reportId = +id;
      this.loadReport();
    }
  }

  loadReport(): void {
    if (!this.reportId) return;

    this.isLoading = true;
    this.getReportById.execute(this.reportId).subscribe({
      next: (report) => {
        this.reportForm.patchValue({
          titulo: report.titulo,
          descripcion: report.descripcion,
          tipo: report.tipo,
          prioridad: report.prioridad,
          estado: report.estado,
          residencia_id: report.residencia_id
        });
        this.isLoading = false;
      },
      error: (error) => {
        this.notificationService.error('Error al cargar reporte');
        this.router.navigate(['/reports']);
        this.isLoading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.reportForm.valid) {
      this.isSaving = true;
      const formData = { ...this.reportForm.value };

      // Convertir valores vacíos a null
      Object.keys(formData).forEach(key => {
        if (formData[key] === '' || formData[key] === undefined) {
          formData[key] = null;
        }
      });

      const operation = this.isEditMode
        ? this.updateReport.execute(this.reportId!, formData)
        : this.createReport.execute(formData);

      operation.subscribe({
        next: () => {
          this.notificationService.success(
            this.isEditMode ? 'Reporte actualizado correctamente' : 'Reporte creado correctamente'
          );
          this.router.navigate(['/reports']);
        },
        error: (error) => {
          this.notificationService.error('Error al guardar reporte');
          this.isSaving = false;
        },
        complete: () => {
          this.isSaving = false;
        }
      });
    } else {
      this.markFormGroupTouched(this.reportForm);
      this.notificationService.warning('Por favor, completa todos los campos requeridos');
    }
  }

  onCancel(): void {
    if (this.reportForm.dirty) {
      if (confirm('¿Estás seguro de cancelar? Los cambios no guardados se perderán.')) {
        this.router.navigate(['/reports']);
      }
    } else {
      this.router.navigate(['/reports']);
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  getErrorMessage(fieldName: string): string {
    const control = this.reportForm.get(fieldName);
    
    if (control?.hasError('required')) {
      return 'Este campo es requerido';
    }
    
    if (control?.hasError('minlength')) {
      const minLength = control.errors?.['minlength'].requiredLength;
      return `Mínimo ${minLength} caracteres`;
    }
    
    return '';
  }

  getTypeIcon(type: ReportType): string {
    const tipo = this.tipos.find(t => t.value === type);
    return tipo?.icon || 'help_outline';
  }
}