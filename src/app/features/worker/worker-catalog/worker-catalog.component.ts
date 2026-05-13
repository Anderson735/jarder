import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CourseService } from '../../../core/services/course.service';

@Component({
  selector: 'app-worker-catalog',
  imports: [RouterLink],
  templateUrl: './worker-catalog.component.html',
  styleUrl: './worker-catalog.component.css',
})
export class WorkerCatalogComponent {
  protected readonly courses = inject(CourseService);
}
