import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { CourseService } from '../../../core/services/course.service';

@Component({
  selector: 'app-worker-catalog',
  imports: [RouterLink],
  templateUrl: './worker-catalog.component.html',
  styleUrl: './worker-catalog.component.css',
})
export class WorkerCatalogComponent {
  private readonly courseService = inject(CourseService);
  private readonly auth = inject(AuthService);

  readonly courses = computed(() =>
    this.courseService.publishedByEmpresa(this.auth.user()!.empresaId!),
  );
}
