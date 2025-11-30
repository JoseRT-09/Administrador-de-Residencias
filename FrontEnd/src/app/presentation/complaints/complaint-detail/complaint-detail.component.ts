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
import { MatListModule } from '@angular/material/list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatExpansionModule } from '@angular/material/expansion';
import { GetComplaintByIdUseCase } from '../../../domain/use-cases/complaint/get-complaint-by-id.usecase';
import { DeleteComplaintUseCase } from '../../../domain/use-cases/complaint/delete-complaint.usecase';
import { UpdateComplaintUseCase } from '../../../domain/use-cases/complaint/update-complaint.usecase';
import { Complaint, ComplaintStatus, ComplaintCategory, ComplaintPriority } from '../../../domain/models/complaint.model';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';

interface Comment {
  id: number;
  usuario: string;
  comentario: string;
  fecha: Date;
  esAdministrador: boolean;
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
    CommonModule, RouterModule, ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatChipsModule, MatDividerModule, MatProgressSpinnerModule,
    MatMenuModule, MatTabsModule, MatListModule,
    MatFormFieldModule, MatInputModule, MatExpansionModule,
    TimeAgoPipe
  ],
  templateUrl: './complaint-detail.component.html',
  styleUrls: ['./complaint-detail.component.scss']
})
export class ComplaintDetailComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private getComplaintById = inject(GetComplaintByIdUseCase);
  private deleteComplaint = inject(DeleteComplaintUseCase);
  private updateComplaint = inject(UpdateComplaintUseCase);
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);

  complaint: Complaint | null = null;
  isLoading = true;
  complaintId!: number;
  commentForm!: FormGroup;
  isSavingComment = false;

  // Mock data - en producción vendría del backend
  comments: Comment[] = [
    {
      id: 1,
      usuario: 'Admin Sistema',
      comentario: 'Hemos recibido tu queja y está siendo revisada por el equipo correspondiente.',
      fecha: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      esAdministrador: true
    },
    {
      id: 2,
      usuario: 'Juan Pérez',
      comentario: 'Agradezco la atención. ¿Cuándo podría tener una respuesta?',
      fecha: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      esAdministrador: false
    }
  ];

  activityLog: ActivityLog[] = [
    {
      id: 1,
      accion: 'Queja creada',
      usuario: 'Juan Pérez',
      fecha: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    },
    {
      id: 2,
      accion: 'Estado cambiado a En Revisión',
      usuario: 'Admin Sistema',
      fecha: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      detalles: 'La queja ha sido asignada al departamento de convivencia'
    },
    {
      id: 3,
      accion: 'Comentario agregado',
      usuario: 'Admin Sistema',
      fecha: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    }
  ];

  ngOnInit(): void {
    this.initCommentForm();
    
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.complaintId = +id;
      this.loadComplaint();
    } else {
      this.router.navigate(['/complaints']);
    }
  }

  initCommentForm(): void {
    this.commentForm = this.fb.group({
      comentario: ['', [Validators.required, Validators.minLength(10)]]
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

  onEdit(): void {
    this.router.navigate(['/complaints', this.complaintId, 'edit']);
  }

  onDelete(): void {
    if (!this.complaint) return;

    const confirmed = confirm(
      `¿Estás seguro de eliminar la queja "${this.complaint.asunto}"?\n\nEsta acción no se puede deshacer.`
    );

    if (confirmed) {
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

  changeStatus(newStatus: ComplaintStatus): void {
    if (!this.complaint) return;

    this.updateComplaint.execute(this.complaintId, { estado: newStatus }).subscribe({
      next: () => {
        this.notificationService.success(`Estado actualizado a: ${newStatus}`);
        this.loadComplaint();
      },
      error: () => {
        this.notificationService.error('Error al actualizar estado');
      }
    });
  }

  onSubmitComment(): void {
    if (this.commentForm.valid) {
      this.isSavingComment = true;
      
      const currentUser = this.authService.getCurrentUser();
      const newComment: Comment = {
        id: this.comments.length + 1,
        usuario: currentUser ? `${currentUser.nombre} ${currentUser.apellido}` : 'Usuario',
        comentario: this.commentForm.value.comentario,
        fecha: new Date(),
        esAdministrador: this.authService.isAdmin()
      };

      // Simular guardado
      setTimeout(() => {
        this.comments.push(newComment);
        this.commentForm.reset();
        this.notificationService.success('Comentario agregado correctamente');
        this.isSavingComment = false;
      }, 500);
    }
  }

  getCategoryClass(category: ComplaintCategory): string {
    const categoryMap: Record<ComplaintCategory, string> = {
      [ComplaintCategory.RUIDO]: 'category-noise',
      [ComplaintCategory.CONVIVENCIA]: 'category-coexistence',
      [ComplaintCategory.MASCOTAS]: 'category-pets',
      [ComplaintCategory.ESTACIONAMIENTO]: 'category-parking',
      [ComplaintCategory.AREAS_COMUNES]: 'category-common',
      [ComplaintCategory.LIMPIEZA]: 'category-cleaning',
      [ComplaintCategory.SEGURIDAD]: 'category-security',
      [ComplaintCategory.MANTENIMIENTO]: 'category-maintenance',
      [ComplaintCategory.ADMINISTRACION]: 'category-admin',
      [ComplaintCategory.OTRO]: 'category-other'
    };
    return categoryMap[category];
  }

  getCategoryIcon(category: ComplaintCategory): string {
    const iconMap: Record<ComplaintCategory, string> = {
      [ComplaintCategory.RUIDO]: 'volume_up',
      [ComplaintCategory.CONVIVENCIA]: 'groups',
      [ComplaintCategory.MASCOTAS]: 'pets',
      [ComplaintCategory.ESTACIONAMIENTO]: 'local_parking',
      [ComplaintCategory.AREAS_COMUNES]: 'domain',
      [ComplaintCategory.LIMPIEZA]: 'cleaning_services',
      [ComplaintCategory.SEGURIDAD]: 'security',
      [ComplaintCategory.MANTENIMIENTO]: 'build',
      [ComplaintCategory.ADMINISTRACION]: 'admin_panel_settings',
      [ComplaintCategory.OTRO]: 'help_outline'
    };
    return iconMap[category];
  }

  getStatusClass(status: ComplaintStatus): string {
    const statusMap: Record<ComplaintStatus, string> = {
      [ComplaintStatus.NUEVA]: 'status-new',
      [ComplaintStatus.EN_REVISION]: 'status-review',
      [ComplaintStatus.EN_PROCESO]: 'status-process',
      [ComplaintStatus.RESUELTA]: 'status-resolved',
      [ComplaintStatus.CERRADA]: 'status-closed',
      [ComplaintStatus.RECHAZADA]: 'status-rejected'
    };
    return statusMap[status];
  }

  getStatusIcon(status: ComplaintStatus): string {
    const iconMap: Record<ComplaintStatus, string> = {
      [ComplaintStatus.NUEVA]: 'fiber_new',
      [ComplaintStatus.EN_REVISION]: 'rate_review',
      [ComplaintStatus.EN_PROCESO]: 'sync',
      [ComplaintStatus.RESUELTA]: 'check_circle',
      [ComplaintStatus.CERRADA]: 'archive',
      [ComplaintStatus.RECHAZADA]: 'cancel'
    };
    return iconMap[status];
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
    if (!this.complaint?.usuario) return 'Usuario desconocido';
    if (this.complaint.es_anonima) return 'Usuario Anónimo';
    return `${this.complaint.usuario.nombre} ${this.complaint.usuario.apellido}`;
  }

  getUserInitials(): string {
    if (!this.complaint?.usuario || this.complaint.es_anonima) return '?';
    return `${this.complaint.usuario.nombre.charAt(0)}${this.complaint.usuario.apellido.charAt(0)}`.toUpperCase();
  }

  getResidenceName(): string {
    if (!this.complaint?.residencia) return 'Queja General';
    return `Unidad ${this.complaint.residencia.numero_unidad}`;
  }

  canEdit(): boolean {
    if (!this.complaint) return false;
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return false;
    
    if (this.authService.isAdmin()) return true;
    
    return this.complaint.usuario?.id === currentUser.id && 
           this.complaint.estado === ComplaintStatus.NUEVA;
  }

  canDelete(): boolean {
    return this.authService.isAdmin();
  }

  canChangeStatus(): boolean {
    return this.authService.isAdmin();
  }

  printComplaint(): void {
    window.print();
  }

  notifyUser(): void {
    this.notificationService.info('Enviando notificación al usuario...');
  }
}