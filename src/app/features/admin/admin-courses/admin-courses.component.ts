import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CourseService } from '../../../core/services/course.service';

@Component({
  selector: 'app-admin-courses',
  imports: [RouterLink],
  templateUrl: './admin-courses.component.html',
  styleUrl: './admin-courses.component.css',
})
export class AdminCoursesComponent {
  protected readonly courses = inject(CourseService);

  remove(id: string): void {
    if (confirm('¿Eliminar este curso y todos sus materiales almacenados?')) {
      this.courses.deleteCourse(id);
    }
  }
}
