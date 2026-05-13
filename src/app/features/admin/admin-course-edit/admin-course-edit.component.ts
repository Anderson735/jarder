import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';

import { CourseService } from '../../../core/services/course.service';

@Component({
  selector: 'app-admin-course-edit',
  imports: [FormsModule, RouterLink],
  templateUrl: './admin-course-edit.component.html',
  styleUrl: './admin-course-edit.component.css',
})
export class AdminCourseEditComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly courseApi = inject(CourseService);

  private readonly courseId = toSignal(this.route.paramMap.pipe(map((p) => p.get('courseId'))), {
    initialValue: null,
  });

  protected readonly course = computed(() => {
    const id = this.courseId();
    return id ? this.courseApi.getById(id) : undefined;
  });

  editTitle = '';
  editDescription = '';
  editThumb = '';
  editPublished = false;

  constructor() {
    this.route.paramMap.subscribe(() => this.syncForm());
  }

  private syncForm(): void {
    const c = this.course();
    if (!c) {
      return;
    }
    this.editTitle = c.title;
    this.editDescription = c.description;
    this.editThumb = c.thumbnailUrl ?? '';
    this.editPublished = c.published;
  }

  saveMeta(): void {
    const c = this.course();
    if (!c) {
      return;
    }
    this.courseApi.upsertCourse({
      ...c,
      title: this.editTitle.trim() || c.title,
      description: this.editDescription.trim(),
      thumbnailUrl: this.editThumb.trim() || undefined,
      published: this.editPublished,
    });
  }

  addSession(): void {
    const c = this.course();
    if (!c) {
      return;
    }
    const title = prompt('Título de la nueva sesión');
    if (!title?.trim()) {
      return;
    }
    const s = this.courseApi.addSession(c.id, title.trim());
    if (s) {
      void this.router.navigate(['/admin/courses', c.id, 'sessions', s.id]);
    }
  }

  move(sessionId: string, delta: number): void {
    const c = this.course();
    if (!c) {
      return;
    }
    const ids = c.sessions.map((s) => s.id);
    const i = ids.indexOf(sessionId);
    const j = i + delta;
    if (i < 0 || j < 0 || j >= ids.length) {
      return;
    }
    const t = ids[i];
    ids[i] = ids[j]!;
    ids[j] = t!;
    this.courseApi.reorderSessions(c.id, ids);
  }

  removeSession(sessionId: string): void {
    const c = this.course();
    if (!c || !confirm('¿Eliminar esta sesión y sus materiales?')) {
      return;
    }
    this.courseApi.deleteSession(c.id, sessionId);
  }
}
