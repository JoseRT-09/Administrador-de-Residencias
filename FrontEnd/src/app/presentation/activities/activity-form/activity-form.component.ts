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
import { GetActivityByIdUseCase } from '../../../domain/use-cases/activity/get-activity-by-id.usecase';
import { CreateActivityUseCase } from '../../../domain/use-cases/activity/create-activity.usecase';
import { UpdateActivityUseCase } from '../../../domain/use-cases/activity/update-activity.usecase';
import { Activity, ActivityType, ActivityStatus } from '../../../domain/models/activity.model';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-activity-form',
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
    MatNativeDateModule
  ],
  templateUrl: './activity-form.component.html',
  styleUrls: ['./activity-form.component.scss']
})
export class ActivityFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private getActivityById = inject(GetActivityByIdUseCase);
  private createActivity = inject(CreateActivityUseCase);
  private updateActivity = inject(UpdateActivityUseCase);
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);

  activityForm!: FormGroup;
  isEditMode = false;
  activityId?: number;
  isLoading = false;
  isSaving = false;

  tipos = [
    { value: ActivityType.REUNION, label: 'Reunión', icon: 'group', description: 'Reunión de residentes o junta' },
    { value: ActivityType.EVENTO, label: 'Evento', icon: 'event', description: 'Evento social o comunitario' },
    { value: ActivityType.MANTENIMIENTO, label: 'Mantenimiento', icon: 'build', description: 'Trabajo de mantenimiento programado' },
    { value: ActivityType.ASAMBLEA, label: 'Asamblea', icon: 'how_to_vote', description: 'Asamblea general de propietarios' },
    { value: ActivityType.CELEBRACION, label: 'Celebración', icon: 'celebration', description: 'Fiesta o celebración' },
    { value: ActivityType.OTRO, label: 'Otro', icon: 'event_note', description: 'Otra actividad' }
  ];

  estados = [
    { value: ActivityStatus.PROGRAMADA, label: 'Programada', icon: 'schedule', color: '#ff9800' },
    { value: ActivityStatus.EN_CURSO, label: 'En Curso', icon: 'play_circle', color: '#2196f3' },
    { value: ActivityStatus.COMPLETADA, label: 'Completada', icon: 'check_circle', color: '#4caf50' },
    { value: ActivityStatus.CANCELADA, label: 'Cancelada', icon: 'cancel', color: '#f44336' }
  ];

  ngOnInit(): void {
    this.initForm();
    this.checkEditMode();
  }

  initForm(): void {
    const currentUser = this.authService.getCurrentUser();
    
    this.activityForm = this.fb.group({
      titulo: ['', [Validators.required, Validators.minLength(5)]],
      descripcion: ['', [Validators.required, Validators.minLength(10)]],
      tipo: [ActivityType.EVENTO, [Validators.required]],
      fecha_inicio: [new Date(), [Validators.required]],
      fecha_fin: [''],
      ubicacion: ['', [Validators.required]],
      organizador_id: [currentUser?.id, [Validators.required]],
      max_participantes: [null],
      estado: [ActivityStatus.PROGRAMADA, [Validators.required]],
      notas: ['']
    });
  }

  checkEditMode(): void {
    const id = this.route.snapshot.paramMap.get('id');
    
    if (id && id !== 'new') {
      this.isEditMode = true;
      this.activityId = +id;
      this.loadActivity();
    }
  }

  loadActivity(): void {
    if (!this.activityId) return;

    this.isLoading = true;
    this.getActivityById.execute(this.activityId).subscribe({
      next: (activity) => {
        this.activityForm.patchValue({
          titulo: activity.titulo,
          descripcion: activity.descripcion,
          tipo: activity.tipo,
          fecha_inicio: new Date(activity.fecha_inicio),
          fecha_fin: activity.fecha_fin ? new Date(activity.fecha_fin) : null,
          ubicacion: activity.ubicacion,
          organizador_id: activity.organizador_id,
          max_participantes: activity.max_participantes,
          estado: activity.estado,
          notas: activity.notas
        });
        this.isLoading = false;
      },
      error: (error) => {
        this.notificationService.error('Error al cargar actividad');
        this.router.navigate(['/activities']);
        this.isLoading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.activityForm.valid) {
      this.isSaving = true;
      const formData = { ...this.activityForm.value };

      // Convertir fechas a ISO string
      if (formData.fecha_inicio instanceof Date) {
        formData.fecha_inicio = formData.fecha_inicio.toISOString();
      }
      if (formData.fecha_fin instanceof Date) {
        formData.fecha_fin = formData.fecha_fin.toISOString();
      }

      // Convertir valores vacíos a null
      Object.keys(formData).forEach(key => {
        if (formData[key] === '' || formData[key] === undefined) {
          formData[key] = null;
        }
      });

      const operation = this.isEditMode
        ? this.updateActivity.execute(this.activityId!, formData)
        : this.createActivity.execute(formData);

      operation.subscribe({
        next: () => {
          this.notificationService.success(
            this.isEditMode ? 'Actividad actualizada correctamente' : 'Actividad creada correctamente'
          );
          this.router.navigate(['/activities']);
        },
        error: (error) => {
          this.notificationService.error('Error al guardar actividad');
          this.isSaving = false;
        },
        complete: () => {
          this.isSaving = false;
        }
      });
    } else {
      this.markFormGroupTouched(this.activityForm);
      this.notificationService.warning('Por favor, completa todos los campos requeridos');
    }
  }

  onCancel(): void {
    if (this.activityForm.dirty) {
      if (confirm('¿Estás seguro de cancelar? Los cambios no guardados se perderán.')) {
        this.router.navigate(['/activities']);
      }
    } else {
      this.router.navigate(['/activities']);
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  getErrorMessage(fieldName: string): string {
    const control = this.activityForm.get(fieldName);
    
    if (control?.hasError('required')) {
      return 'Este campo es requerido';
    }
    
    if (control?.hasError('minlength')) {
      const minLength = control.errors?.['minlength'].requiredLength;
      return `Mínimo ${minLength} caracteres`;
    }
    
    return '';
  }
}