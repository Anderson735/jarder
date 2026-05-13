import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

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

  email = '';
  password = '';
  errorMsg = '';
  loading = false;

  getPanel(role: string): string {
    if (role === 'superadmin') return '/superadmin';
    if (role === 'admin') return '/admin';
    return '/worker';
  }

  submit(): void {
    this.loading = true;
    this.errorMsg = '';
    const ok = this.auth.login(this.email, this.password);
    if (!ok) {
      this.errorMsg = 'Credenciales incorrectas';
      this.loading = false;
      return;
    }
    void this.router.navigateByUrl(this.getPanel(this.auth.role()!));
  }

  logout(): void {
    this.auth.logout();
  }
}
