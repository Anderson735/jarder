import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { CourseService } from '../../../core/services/course.service';

@Component({
  selector: 'app-admin-course-new',
  imports: [FormsModule],
  templateUrl: './admin-course-new.component.html',
  styleUrl: './admin-course-new.component.css',
})
export class AdminCourseNewComponent {
  private readonly courses = inject(CourseService);
  private readonly router = inject(Router);

  title = '';
  description = '';
  published = false;

  save(): void {
    const t = this.title.trim();
    if (!t) {
      return;
    }
    const c = this.courses.upsertCourse({
      title: t,
      description: this.description.trim(),
      published: this.published,
    });
    void this.router.navigate(['/admin/courses', c.id]);
  }

  back(): void {
    void this.router.navigateByUrl('/admin/courses');
  }
}
