import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { GetComplaintByIdUseCase } from '../../../domain/use-cases/complaint/get-complaint-by-id.usecase';
import { UpdateComplaintUseCase } from '../../../domain/use-cases/complaint/update-complaint.usecase';
import { DeleteComplaintUseCase } from '../../../domain/use-cases/complaint/delete-complaint.usecase';
import { Complaint, ComplaintStatus, ComplaintCategory, ComplaintPriority } from '../../../domain/models/complaint.model';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';

interface Comment {
  id: number;
  usuario: string;
  contenido: string;
  comentario?: string; // Alias para contenido
  fecha: Date;
  isAdmin: boolean;
  esAdministrador?: boolean; // Alias para isAdmin
}

interface ActivityLog {
  id: number;
  accion: string;
  usuario: string;
  fecha: Date;
  detalles?: string;
}

@Component({
  selector: 'app-complaint-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    TimeAgoPipe
  ],
  templateUrl: './complaint-detail.component.html',
  styleUrls: ['./complaint-detail.component.scss']
})
export class ComplaintDetailComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private getComplaintById = inject(GetComplaintByIdUseCase);
  private updateComplaint = inject(UpdateComplaintUseCase);
  private deleteComplaint = inject(DeleteComplaintUseCase);
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  // Exponer enums al template
  ComplaintStatus = ComplaintStatus;
  ComplaintCategory = ComplaintCategory;
  ComplaintPriority = ComplaintPriority;

  complaint: Complaint | null = null;
  isLoading = true;
  isSavingComment = false;
  complaintId!: number;
  commentForm!: FormGroup;
  comments: Comment[] = [];
  activityLog: ActivityLog[] = [];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.complaintId = +id;
      this.initCommentForm();
      this.loadComplaint();
      this.loadMockData();
    } else {
      this.router.navigate(['/complaints']);
    }
  }

  initCommentForm(): void {
    this.commentForm = this.fb.group({
      contenido: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  loadComplaint(): void {
    this.isLoading = true;
    this.getComplaintById.execute(this.complaintId).subscribe({
      next: (complaint) => {
        this.complaint = complaint;
        this.isLoading = false;
      },
      error: (error) => {
        this.notificationService.error('Error al cargar queja');
        this.router.navigate(['/complaints']);
        this.isLoading = false;
      }
    });
  }

  loadMockData(): void {
    // Mock data para comentarios y actividad
    this.comments = [
      {
        id: 1,
        usuario: 'Admin Sistema',
        contenido: 'Hemos recibido su queja y la estamos revisando.',
        comentario: 'Hemos recibido su queja y la estamos revisando.',
        fecha: new Date(Date.now() - 86400000),
        isAdmin: true,
        esAdministrador: true
      }
    ];

    this.activityLog = [
      {
        id: 1,
        accion: 'Queja creada',
        usuario: 'Sistema',
        fecha: new Date(Date.now() - 172800000),
        detalles: 'Queja registrada en el sistema'
      },
      {
        id: 2,
        accion: 'Estado actualizado',
        usuario: 'Admin',
        fecha: new Date(Date.now() - 86400000),
        detalles: 'Cambio de estado: Nuevo → Revisado'
      }
    ];
  }

  onEdit(): void {
    this.router.navigate(['/complaints', this.complaintId, 'edit']);
  }

  changeStatus(newStatus: ComplaintStatus): void {
    if (!this.complaint) return;
    
    this.updateComplaint.execute(this.complaintId, { estado: newStatus }).subscribe({
      next: () => {
        this.notificationService.success('Estado actualizado correctamente');
        this.loadComplaint();
      },
      error: () => {
        this.notificationService.error('Error al actualizar estado');
      }
    });
  }

  onDelete(): void {
    if (!this.complaint) return;
    if (confirm(`¿Estás seguro de eliminar la queja "${this.complaint.asunto}"?`)) {
      this.deleteComplaint.execute(this.complaintId).subscribe({
        next: () => {
          this.notificationService.success('Queja eliminada correctamente');
          this.router.navigate(['/complaints']);
        },
        error: () => {
          this.notificationService.error('Error al eliminar queja');
        }
      });
    }
  }

  onSubmitComment(): void {
    if (this.commentForm.valid) {
      this.isSavingComment = true;
      const currentUser = this.authService.getCurrentUser();
      const newComment: Comment = {
        id: this.comments.length + 1,
        usuario: currentUser ? `${currentUser.nombre} ${currentUser.apellido}` : 'Usuario',
        contenido: this.commentForm.value.contenido,
        comentario: this.commentForm.value.contenido,
        fecha: new Date(),
        isAdmin: this.authService.isAdmin(),
        esAdministrador: this.authService.isAdmin()
      };

      // Simular delay de red
      setTimeout(() => {
        this.comments.push(newComment);
        this.commentForm.reset();
        this.isSavingComment = false;
        this.notificationService.success('Comentario agregado');
      }, 500);
    }
  }

  printComplaint(): void {
    window.print();
  }

  notifyUser(): void {
    this.notificationService.info('Notificación enviada al usuario');
  }

  getStatusClass(status: ComplaintStatus): string {
    const statusMap: Record<ComplaintStatus, string> = {
      [ComplaintStatus.NUEVO]: 'status-new',
      [ComplaintStatus.REVISADO]: 'status-reviewed',
      [ComplaintStatus.EN_PROCESO]: 'status-in-progress',
      [ComplaintStatus.RESUELTO]: 'status-resolved'
    };
    return statusMap[status];
  }

  getStatusIcon(status: ComplaintStatus): string {
    const iconMap: Record<ComplaintStatus, string> = {
      [ComplaintStatus.NUEVO]: 'fiber_new',
      [ComplaintStatus.REVISADO]: 'visibility',
      [ComplaintStatus.EN_PROCESO]: 'pending',
      [ComplaintStatus.RESUELTO]: 'check_circle'
    };
    return iconMap[status];
  }

  getCategoryClass(category: ComplaintCategory): string {
    const categoryMap: Record<ComplaintCategory, string> = {
      [ComplaintCategory.RUIDO]: 'category-noise',
      [ComplaintCategory.CONVIVENCIA]: 'category-coexistence',
      [ComplaintCategory.MASCOTAS]: 'category-pets',
      [ComplaintCategory.ESTACIONAMIENTO]: 'category-parking',
      [ComplaintCategory.AREAS_COMUNES]: 'category-common-areas',
      [ComplaintCategory.LIMPIEZA]: 'category-cleaning',
      [ComplaintCategory.SEGURIDAD]: 'category-security',
      [ComplaintCategory.MANTENIMIENTO]: 'category-maintenance',
      [ComplaintCategory.ADMINISTRACION]: 'category-administration',
      [ComplaintCategory.OTRO]: 'category-other'
    };
    return categoryMap[category];
  }

  getCategoryIcon(category: ComplaintCategory): string {
    const iconMap: Record<ComplaintCategory, string> = {
      [ComplaintCategory.RUIDO]: 'volume_up',
      [ComplaintCategory.CONVIVENCIA]: 'group',
      [ComplaintCategory.MASCOTAS]: 'pets',
      [ComplaintCategory.ESTACIONAMIENTO]: 'local_parking',
      [ComplaintCategory.AREAS_COMUNES]: 'apartment',
      [ComplaintCategory.LIMPIEZA]: 'cleaning_services',
      [ComplaintCategory.SEGURIDAD]: 'security',
      [ComplaintCategory.MANTENIMIENTO]: 'build',
      [ComplaintCategory.ADMINISTRACION]: 'admin_panel_settings',
      [ComplaintCategory.OTRO]: 'help_outline'
    };
    return iconMap[category];
  }

  getPriorityClass(priority: ComplaintPriority): string {
    const priorityMap: Record<ComplaintPriority, string> = {
      [ComplaintPriority.BAJA]: 'priority-low',
      [ComplaintPriority.MEDIA]: 'priority-medium',
      [ComplaintPriority.ALTA]: 'priority-high',
      [ComplaintPriority.URGENTE]: 'priority-urgent'
    };
    return priorityMap[priority];
  }

  getPriorityIcon(priority: ComplaintPriority): string {
    const iconMap: Record<ComplaintPriority, string> = {
      [ComplaintPriority.BAJA]: 'arrow_downward',
      [ComplaintPriority.MEDIA]: 'remove',
      [ComplaintPriority.ALTA]: 'arrow_upward',
      [ComplaintPriority.URGENTE]: 'priority_high'
    };
    return iconMap[priority];
  }

  getUserName(): string {
    if (!this.complaint) return 'N/A';
    if (this.complaint.es_anonima) {
      return 'Usuario Anónimo';
    }
    const user = this.complaint.usuario || this.complaint.autor;
    if (!user) return 'N/A';
    return `${user.nombre} ${user.apellido}`;
  }

  getUserInitials(): string {
    if (!this.complaint) return '?';
    if (this.complaint.es_anonima) {
      return 'AN';
    }
    const user = this.complaint.usuario || this.complaint.autor;
    if (!user) return '?';
    return `${user.nombre.charAt(0)}${user.apellido.charAt(0)}`.toUpperCase();
  }

  getResidenceName(): string {
    if (!this.complaint || !this.complaint.residencia) {
      return 'Queja General';
    }
    const res = this.complaint.residencia;
    return res.bloque 
      ? `Unidad ${res.numero_unidad} - Bloque ${res.bloque}`
      : `Unidad ${res.numero_unidad}`;
  }

  canEdit(): boolean {
    if (!this.complaint || !this.authService.isAdmin()) return false;
    return this.complaint.estado === ComplaintStatus.NUEVO;
  }

  canDelete(): boolean {
    return this.authService.isAdmin();
  }

  canChangeStatus(): boolean {
    return this.authService.isAdmin();
  }
}