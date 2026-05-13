import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-superadmin-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './superadmin-shell.component.html',
  styleUrl: './superadmin-shell.component.css',
})
export class SuperadminShellComponent {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/login');
  }
}
