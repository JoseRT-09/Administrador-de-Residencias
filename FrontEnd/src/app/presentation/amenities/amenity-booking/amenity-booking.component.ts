import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { GetAmenityByIdUseCase } from '../../../domain/use-cases/amenity/get-amenity-by-id.usecase';
import { Amenity } from '../../../domain/models/amenity.model';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-amenity-booking',
  standalone: true,
  imports: [
    CommonModule, RouterModule, ReactiveFormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule,
    MatDividerModule, MatDatepickerModule, MatNativeDateModule
  ],
  templateUrl: './amenity-booking.component.html',
  styleUrls: ['./amenity-booking.component.scss']
})
export class AmenityBookingComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private getAmenityById = inject(GetAmenityByIdUseCase);
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);

  bookingForm!: FormGroup;
  amenity: Amenity | null = null;
  isLoading = true;
  isSaving = false;
  amenityId!: number;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.amenityId = +id;
      this.initForm();
      this.loadAmenity();
    } else {
      this.router.navigate(['/amenities']);
    }
  }

  initForm(): void {
    const currentUser = this.authService.getCurrentUser();
    
    this.bookingForm = this.fb.group({
      amenidad_id: [this.amenityId, [Validators.required]],
      usuario_id: [currentUser?.id, [Validators.required]],
      fecha_inicio: [new Date(), [Validators.required]],
      fecha_fin: [new Date(), [Validators.required]],
      num_personas: [1, [Validators.required, Validators.min(1)]],
      proposito: ['', [Validators.required, Validators.minLength(10)]],
      notas: ['']
    });
  }

  loadAmenity(): void {
    this.isLoading = true;
    this.getAmenityById.execute(this.amenityId).subscribe({
      next: (amenity) => {
        this.amenity = amenity;
        
        const disponible = amenity.disponible_reserva ?? amenity.requiere_reserva;
        if (!disponible) {
          this.notificationService.warning('Esta amenidad no está disponible para reservas');
          this.router.navigate(['/amenities', this.amenityId]);
        }
        
        this.isLoading = false;
      },
      error: (error) => {
        this.notificationService.error('Error al cargar amenidad');
        this.router.navigate(['/amenities']);
        this.isLoading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.bookingForm.valid) {
      this.isSaving = true;
      const formData = { ...this.bookingForm.value };

      // Convertir fechas a ISO string
      if (formData.fecha_inicio instanceof Date) {
        formData.fecha_inicio = formData.fecha_inicio.toISOString();
      }
      if (formData.fecha_fin instanceof Date) {
        formData.fecha_fin = formData.fecha_fin.toISOString();
      }

      // Simular creación de reserva
      setTimeout(() => {
        this.notificationService.success('Reserva creada correctamente');
        this.router.navigate(['/amenities', this.amenityId]);
        this.isSaving = false;
      }, 1500);
    } else {
      this.markFormGroupTouched(this.bookingForm);
      this.notificationService.warning('Por favor, completa todos los campos requeridos');
    }
  }

  onCancel(): void {
    this.router.navigate(['/amenities', this.amenityId]);
  }

  getCosto(): number {
    if (!this.amenity) return 0;
    return this.amenity.costo_reserva ?? this.amenity.costo_uso ?? 0;
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      formGroup.get(key)?.markAsTouched();
    });
  }

  getErrorMessage(fieldName: string): string {
    const control = this.bookingForm.get(fieldName);
    
    if (control?.hasError('required')) {
      return 'Este campo es requerido';
    }
    
    if (control?.hasError('minlength')) {
      const minLength = control.errors?.['minlength'].requiredLength;
      return `Mínimo ${minLength} caracteres`;
    }

    if (control?.hasError('min')) {
      return 'Debe ser al menos 1 persona';
    }
    
    return '';
  }
}