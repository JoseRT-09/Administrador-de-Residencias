import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { GetAllActivitiesUseCase } from '../../../domain/use-cases/activity/get-all-activities.usecase';
import { Activity, ActivityType, ActivityStatus } from '../../../domain/models/activity.model';
import { NotificationService } from '../../../core/services/notification.service';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  activities: Activity[];
}

@Component({
  selector: 'app-activity-calendar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatChipsModule,
    MatMenuModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatBadgeModule,
    MatDividerModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './activity-calendar.component.html',
  styleUrls: ['./activity-calendar.component.scss']
})
export class ActivityCalendarComponent implements OnInit {
  private getAllActivities = inject(GetAllActivitiesUseCase);
  private notificationService = inject(NotificationService);

  // Exponer enums al template
  ActivityType = ActivityType;
  ActivityStatus = ActivityStatus;

  currentDate = new Date();
  currentMonth: Date;
  calendarDays: CalendarDay[] = [];
  selectedDate: Date | null = null;
  activities: Activity[] = [];
  isLoading = true;

  weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  viewMode: 'month' | 'week' | 'day' = 'month';

  constructor() {
    this.currentMonth = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
  }

  ngOnInit(): void {
    this.loadActivities();
  }

  loadActivities(): void {
    this.isLoading = true;

    const startOfMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth(), 1);
    const endOfMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 0);

    this.getAllActivities.execute({
      page: 1,
      limit: 1000,
      fecha_inicio: startOfMonth.toISOString(),
      fecha_fin: endOfMonth.toISOString()
    }).subscribe({
      next: (response) => {
        this.activities = response.data;
        this.generateCalendar();
        this.isLoading = false;
      },
      error: (error) => {
        this.notificationService.error('Error al cargar actividades');
        this.isLoading = false;
      }
    });
  }

  generateCalendar(): void {
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const firstDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    this.calendarDays = [];
    
    // Días del mes anterior
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      this.calendarDays.push({
        date,
        isCurrentMonth: false,
        isToday: this.isToday(date),
        activities: this.getActivitiesForDate(date)
      });
    }
    
    // Días del mes actual
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      this.calendarDays.push({
        date,
        isCurrentMonth: true,
        isToday: this.isToday(date),
        activities: this.getActivitiesForDate(date)
      });
    }
    
    // Días del mes siguiente para completar la última semana
    const remainingDays = 42 - this.calendarDays.length; // 6 semanas * 7 días
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      this.calendarDays.push({
        date,
        isCurrentMonth: false,
        isToday: this.isToday(date),
        activities: this.getActivitiesForDate(date)
      });
    }
  }

  getActivitiesForDate(date: Date): Activity[] {
    return this.activities.filter(activity => {
      const activityDate = new Date(activity.fecha_inicio);
      return activityDate.getDate() === date.getDate() &&
             activityDate.getMonth() === date.getMonth() &&
             activityDate.getFullYear() === date.getFullYear();
    });
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }

  previousMonth(): void {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1, 1);
    this.loadActivities();
  }

  nextMonth(): void {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 1);
    this.loadActivities();
  }

  goToToday(): void {
    this.currentMonth = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
    this.loadActivities();
  }

  selectDate(day: CalendarDay): void {
    this.selectedDate = day.date;
  }

  getMonthYear(): string {
    return this.currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  }

  getTypeClass(type: ActivityType): string {
    const typeMap: Record<ActivityType, string> = {
      [ActivityType.REUNION]: 'type-meeting',
      [ActivityType.EVENTO]: 'type-event',
      [ActivityType.MANTENIMIENTO]: 'type-maintenance',
      [ActivityType.ASAMBLEA]: 'type-assembly',
      [ActivityType.CELEBRACION]: 'type-celebration',
      [ActivityType.OTRO]: 'type-other'
    };
    return typeMap[type];
  }

  getTypeIcon(type: ActivityType): string {
    const iconMap: Record<ActivityType, string> = {
      [ActivityType.REUNION]: 'group',
      [ActivityType.EVENTO]: 'event',
      [ActivityType.MANTENIMIENTO]: 'build',
      [ActivityType.ASAMBLEA]: 'how_to_vote',
      [ActivityType.CELEBRACION]: 'celebration',
      [ActivityType.OTRO]: 'event_note'
    };
    return iconMap[type];
  }

  getUpcomingActivities(): Activity[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return this.activities
      .filter(activity => {
        const activityDate = new Date(activity.fecha_inicio);
        activityDate.setHours(0, 0, 0, 0);
        return activityDate >= today;
      })
      .sort((a, b) => new Date(a.fecha_inicio).getTime() - new Date(b.fecha_inicio).getTime())
      .slice(0, 5);
  }

  getTodayActivities(): Activity[] {
    const today = new Date();
    return this.getActivitiesForDate(today);
  }
}