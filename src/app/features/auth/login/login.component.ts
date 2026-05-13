import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import type { UserRole } from '../../../core/models/app.models';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  displayName = '';

  enter(role: UserRole): void {
    this.auth.loginAs(role, this.displayName);
    void this.router.navigateByUrl(role === 'admin' ? '/admin' : '/worker');
  }

  logout(): void {
    this.auth.logout();
  }
}
