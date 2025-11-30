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
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { GetResidenceByIdUseCase } from '../../../domain/use-cases/residence/get-residence-by-id.usecase';
import { CreateResidenceUseCase } from '../../../domain/use-cases/residence/create-residence.usecase';
import { UpdateResidenceUseCase } from '../../../domain/use-cases/residence/update-residence.usecase';
import { GetActiveResidentsUseCase } from '../../../domain/use-cases/user/get-active-residents.usecase';
import { Residence, ResidenceStatus } from '../../../domain/models/residence.model';
import { User } from '../../../domain/models/user.model';
import { NotificationService } from '../../../core/services/notification.service';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-residence-form',
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
    MatSlideToggleModule,
    MatChipsModule
  ],
  templateUrl: './residence-form.component.html',
  styleUrls: ['./residence-form.component.scss']
})
export class ResidenceFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private getResidenceById = inject(GetResidenceByIdUseCase);
  private createResidence = inject(CreateResidenceUseCase);
  private updateResidence = inject(UpdateResidenceUseCase);
  private getActiveResidents = inject(GetActiveResidentsUseCase);
  private notificationService = inject(NotificationService);

  residenceForm!: FormGroup;
  isEditMode = false;
  residenceId?: number;
  isLoading = false;
  isSaving = false;
  users: User[] = [];

  estados = [
    { 
      value: ResidenceStatus.DISPONIBLE, 
      label: 'Disponible', 
      icon: 'home_work',
      description: 'Lista para ser ocupada',
      color: '#4caf50'
    },
    { 
      value: ResidenceStatus.OCUPADA, 
      label: 'Ocupada', 
      icon: 'home',
      description: 'Actualmente habitada',
      color: '#ff9800'
    },
    { 
      value: ResidenceStatus.MANTENIMIENTO, 
      label: 'Mantenimiento', 
      icon: 'home_repair_service',
      description: 'En reparación o mejoras',
      color: '#f44336'
    }
  ];

  ngOnInit(): void {
    this.initForm();
    this.loadUsers();
    this.checkEditMode();
  }

  initForm(): void {
    this.residenceForm = this.fb.group({
      numero_unidad: ['', [Validators.required, Validators.minLength(1)]],
      bloque: [''],
      piso: ['', [Validators.pattern(/^[0-9]+$/)]],
      area_m2: ['', [Validators.pattern(/^[0-9]+(\.[0-9]{1,2})?$/)]],
      habitaciones: ['', [Validators.pattern(/^[0-9]+$/)]],
      banos: ['', [Validators.pattern(/^[0-9]+(\.[0-9]{1})?$/)]],
      estacionamientos: ['', [Validators.pattern(/^[0-9]+$/)]],
      dueno_id: [null],
      residente_actual_id: [null],
      administrador_id: [null],
      estado: [ResidenceStatus.DISPONIBLE, [Validators.required]],
      descripcion: [''],
      notas_adicionales: ['']
    });
  }

  loadUsers(): void {
    this.getActiveResidents.execute().subscribe({
      next: (users) => {
        this.users = users;
      },
      error: (error) => {
        console.error('Error loading users:', error);
      }
    });
  }

  checkEditMode(): void {
    const id = this.route.snapshot.paramMap.get('id');
    
    if (id && id !== 'new') {
      this.isEditMode = true;
      this.residenceId = +id;
      this.loadResidence();
    }
  }

  loadResidence(): void {
    if (!this.residenceId) return;

    this.isLoading = true;
    this.getResidenceById.execute(this.residenceId).subscribe({
      next: (residence) => {
        this.residenceForm.patchValue({
          numero_unidad: residence.numero_unidad,
          bloque: residence.bloque,
          piso: residence.piso,
          area_m2: residence.area_m2,
          habitaciones: residence.habitaciones,
          banos: residence.banos,
          estacionamientos: residence.estacionamientos,
          dueno_id: residence.dueno_id,
          residente_actual_id: residence.residente_actual_id,
          administrador_id: residence.administrador_id,
          estado: residence.estado,
          descripcion: residence.descripcion,
          notas_adicionales: residence.notas_adicionales
        });
        this.isLoading = false;
      },
      error: (error) => {
        this.notificationService.error('Error al cargar residencia');
        this.router.navigate(['/residences']);
        this.isLoading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.residenceForm.valid) {
      this.isSaving = true;
      const formData = { ...this.residenceForm.value };

      // Convertir valores vacíos a null
      Object.keys(formData).forEach(key => {
        if (formData[key] === '' || formData[key] === undefined) {
          formData[key] = null;
        }
      });

      const operation = this.isEditMode
        ? this.updateResidence.execute(this.residenceId!, formData)
        : this.createResidence.execute(formData);

      operation.subscribe({
        next: () => {
          this.notificationService.success(
            this.isEditMode ? 'Residencia actualizada correctamente' : 'Residencia creada correctamente'
          );
          this.router.navigate(['/residences']);
        },
        error: (error) => {
          this.notificationService.error('Error al guardar residencia');
          this.isSaving = false;
        },
        complete: () => {
          this.isSaving = false;
        }
      });
    } else {
      this.markFormGroupTouched(this.residenceForm);
      this.notificationService.warning('Por favor, completa todos los campos requeridos');
    }
  }

  onCancel(): void {
    if (this.residenceForm.dirty) {
      if (confirm('¿Estás seguro de cancelar? Los cambios no guardados se perderán.')) {
        this.router.navigate(['/residences']);
      }
    } else {
      this.router.navigate(['/residences']);
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  getErrorMessage(fieldName: string): string {
    const control = this.residenceForm.get(fieldName);
    
    if (control?.hasError('required')) {
      return 'Este campo es requerido';
    }
    
    if (control?.hasError('minlength')) {
      const minLength = control.errors?.['minlength'].requiredLength;
      return `Mínimo ${minLength} caracteres`;
    }

    if (control?.hasError('pattern')) {
      return 'Formato inválido';
    }
    
    return '';
  }

  getStatusColor(status: ResidenceStatus): string {
    const estado = this.estados.find(e => e.value === status);
    return estado?.color || '#667eea';
  }
}