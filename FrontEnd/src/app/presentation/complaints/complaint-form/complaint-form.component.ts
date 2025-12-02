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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { GetComplaintByIdUseCase } from '../../../domain/use-cases/complaint/get-complaint-by-id.usecase';
import { CreateComplaintUseCase } from '../../../domain/use-cases/complaint/create-complaint.usecase';
import { UpdateComplaintUseCase } from '../../../domain/use-cases/complaint/update-complaint.usecase';
import { GetAllResidencesUseCase } from '../../../domain/use-cases/residence/get-all-residences.usecase';
import { Complaint, ComplaintCategory, ComplaintStatus, ComplaintPriority } from '../../../domain/models/complaint.model';
import { Residence } from '../../../domain/models/residence.model';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-complaint-form',
  standalone: true,
  imports: [
    CommonModule, RouterModule, ReactiveFormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatSelectModule,
    MatProgressSpinnerModule, MatDividerModule,
    MatDatepickerModule, MatNativeDateModule, MatCheckboxModule
  ],
  templateUrl: './complaint-form.component.html',
  styleUrls: ['./complaint-form.component.scss']
})
export class ComplaintFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private getComplaintById = inject(GetComplaintByIdUseCase);
  private createComplaint = inject(CreateComplaintUseCase);
  private updateComplaint = inject(UpdateComplaintUseCase);
  private getAllResidences = inject(GetAllResidencesUseCase);
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);

  complaintForm!: FormGroup;
  isEditMode = false;
  complaintId?: number;
  isLoading = false;
  isSaving = false;
  residences: Residence[] = [];

  categorias = [
    { value: ComplaintCategory.RUIDO, label: 'Ruido', icon: 'volume_up', description: 'Molestias por ruido excesivo' },
    { value: ComplaintCategory.CONVIVENCIA, label: 'Convivencia', icon: 'groups', description: 'Problemas de convivencia entre residentes' },
    { value: ComplaintCategory.MASCOTAS, label: 'Mascotas', icon: 'pets', description: 'Situaciones relacionadas con mascotas' },
    { value: ComplaintCategory.ESTACIONAMIENTO, label: 'Estacionamiento', icon: 'local_parking', description: 'Problemas de estacionamiento' },
    { value: ComplaintCategory.AREAS_COMUNES, label: 'Áreas Comunes', icon: 'domain', description: 'Mal uso de áreas comunes' },
    { value: ComplaintCategory.LIMPIEZA, label: 'Limpieza', icon: 'cleaning_services', description: 'Falta de limpieza o higiene' },
    { value: ComplaintCategory.SEGURIDAD, label: 'Seguridad', icon: 'security', description: 'Problemas de seguridad' },
    { value: ComplaintCategory.MANTENIMIENTO, label: 'Mantenimiento', icon: 'build', description: 'Falta de mantenimiento' },
    { value: ComplaintCategory.ADMINISTRACION, label: 'Administración', icon: 'admin_panel_settings', description: 'Quejas sobre administración' },
    { value: ComplaintCategory.OTRO, label: 'Otro', icon: 'help_outline', description: 'Otras quejas' }
  ];

  prioridades = [
    { value: ComplaintPriority.BAJA, label: 'Baja', icon: 'arrow_downward', color: '#4caf50', description: 'No requiere atención inmediata' },
    { value: ComplaintPriority.MEDIA, label: 'Media', icon: 'remove', color: '#ffc107', description: 'Requiere atención en corto plazo' },
    { value: ComplaintPriority.ALTA, label: 'Alta', icon: 'arrow_upward', color: '#ff9800', description: 'Requiere atención prioritaria' },
    { value: ComplaintPriority.URGENTE, label: 'Urgente', icon: 'priority_high', color: '#f44336', description: 'Requiere atención inmediata' }
  ];

  estados = [
    { value: ComplaintStatus.NUEVO, label: 'Nuevo', icon: 'fiber_new' },
    { value: ComplaintStatus.REVISADO, label: 'Revisado', icon: 'rate_review' },
    { value: ComplaintStatus.EN_PROCESO, label: 'En Proceso', icon: 'sync' },
    { value: ComplaintStatus.RESUELTO, label: 'Resuelto', icon: 'check_circle' }
  ];

  ngOnInit(): void {
    this.initForm();
    this.loadResidences();
    this.checkEditMode();
  }

  initForm(): void {
    const currentUser = this.authService.getCurrentUser();
    
    this.complaintForm = this.fb.group({
      asunto: ['', [Validators.required, Validators.minLength(5)]],
      descripcion: ['', [Validators.required, Validators.minLength(20)]],
      categoria: [ComplaintCategory.OTRO, [Validators.required]],
      prioridad: [ComplaintPriority.MEDIA, [Validators.required]],
      estado: [ComplaintStatus.NUEVO, [Validators.required]],
      usuario_id: [currentUser?.id, [Validators.required]],
      residencia_id: [null],
      fecha_queja: [new Date(), [Validators.required]],
      es_anonima: [false]
    });
  }

  loadResidences(): void {
    this.getAllResidences.execute({ limit: 1000 }).subscribe({
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
      this.complaintId = +id;
      this.loadComplaint();
    }
  }

loadComplaint(): void {
  if (!this.complaintId) return;

  this.isLoading = true;
  this.getComplaintById.execute(this.complaintId).subscribe({
    next: (complaint) => {
      this.complaintForm.patchValue({
        asunto: complaint.asunto,
        descripcion: complaint.cuerpo_mensaje || complaint.descripcion,
        categoria: complaint.categoria,
        prioridad: complaint.prioridad,
        estado: complaint.estado,
        usuario_id: complaint.usuario_id || complaint.autor_id,
        residencia_id: complaint.residencia_id,
        fecha_queja: complaint.fecha_queja ? new Date(complaint.fecha_queja) : new Date(),
        es_anonima: complaint.es_anonima
      });
      this.isLoading = false;
    },
    error: (error) => {
      this.notificationService.error('Error al cargar queja');
      this.router.navigate(['/complaints']);
      this.isLoading = false;
    }
  });
}

  onSubmit(): void {
    if (this.complaintForm.valid) {
      this.isSaving = true;
      const formData = { ...this.complaintForm.value };

      // Convertir fecha a ISO string
      if (formData.fecha_queja instanceof Date) {
        formData.fecha_queja = formData.fecha_queja.toISOString();
      }

      // Asegurar compatibilidad con backend
      formData.cuerpo_mensaje = formData.descripcion;
      formData.autor_id = formData.usuario_id;

      // Convertir valores vacíos a null
      Object.keys(formData).forEach(key => {
        if (formData[key] === '' || formData[key] === undefined) {
          formData[key] = null;
        }
      });

      const operation = this.isEditMode && this.complaintId
        ? this.updateComplaint.execute(this.complaintId, formData)
        : this.createComplaint.execute(formData);

      operation.subscribe({
        next: () => {
          this.notificationService.success(
            this.isEditMode ? 'Queja actualizada correctamente' : 'Queja creada correctamente'
          );
          this.router.navigate(['/complaints']);
        },
        error: (error) => {
          console.error('Error saving complaint:', error);
          this.notificationService.error('Error al guardar queja');
          this.isSaving = false;
        },
        complete: () => {
          this.isSaving = false;
        }
      });
    } else {
      this.markFormGroupTouched(this.complaintForm);
      this.notificationService.warning('Por favor, completa todos los campos requeridos');
    }
  }

  onCancel(): void {
    if (this.complaintForm.dirty) {
      if (confirm('¿Estás seguro de cancelar? Los cambios no guardados se perderán.')) {
        this.router.navigate(['/complaints']);
      }
    } else {
      this.router.navigate(['/complaints']);
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      formGroup.get(key)?.markAsTouched();
    });
  }

  getErrorMessage(fieldName: string): string {
    const control = this.complaintForm.get(fieldName);
    
    if (control?.hasError('required')) {
      return 'Este campo es requerido';
    }
    
    if (control?.hasError('minlength')) {
      const minLength = control.errors?.['minlength'].requiredLength;
      return `Mínimo ${minLength} caracteres`;
    }
    
    return '';
  }

  canEditStatus(): boolean {
    return this.authService.isAdmin();
  }
}