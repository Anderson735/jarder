import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-worker-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './worker-shell.component.html',
  styleUrl: './worker-shell.component.css',
})
export class WorkerShellComponent {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/login');
  }
}
