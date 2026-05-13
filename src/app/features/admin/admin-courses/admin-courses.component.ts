import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { CourseService } from '../../../core/services/course.service';
import { ConfirmModalComponent } from '../../../core/components/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-admin-courses',
  imports: [RouterLink, ConfirmModalComponent],
  templateUrl: './admin-courses.component.html',
  styleUrl: './admin-courses.component.css',
})
export class AdminCoursesComponent {
  private readonly courseService = inject(CourseService);
  private readonly auth = inject(AuthService);

  readonly courses = computed(() =>
    this.courseService.byEmpresa(this.auth.user()!.empresaId!),
  );

  readonly showConfirm = signal(false);
  readonly pendingDeleteId = signal<string | null>(null);

  requestDelete(id: string): void {
    this.pendingDeleteId.set(id);
    this.showConfirm.set(true);
  }

  confirmDelete(): void {
    if (this.pendingDeleteId()) {
      this.courseService.deleteCourse(this.pendingDeleteId()!);
      this.pendingDeleteId.set(null);
    }
    this.showConfirm.set(false);
  }

  cancelDelete(): void {
    this.pendingDeleteId.set(null);
    this.showConfirm.set(false);
  }
}
