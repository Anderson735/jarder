import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';

import type { AppUser } from '../models/app.models';
import { UsuarioService } from './usuario.service';

const STORAGE_KEY = 'jarder_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly usuarioService = inject(UsuarioService);

  readonly user = signal<AppUser | null>(null);

  readonly isAuthenticated = computed(() => this.user() !== null);
  readonly role = computed(() => this.user()?.role ?? null);
  readonly isSuperadmin = computed(() => this.user()?.role === 'superadmin');
  readonly isAdmin = computed(() => this.user()?.role === 'admin');
  readonly isWorker = computed(() => this.user()?.role === 'worker');

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        try {
          this.user.set(JSON.parse(raw) as AppUser);
        } catch {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    }
  }

  login(email: string, password: string): boolean {
    const credential = this.usuarioService.validateLogin(email, password);
    if (!credential) return false;

    const u: AppUser = {
      id: credential.id,
      email: credential.email,
      displayName: credential.displayName,
      role: credential.role,
      empresaId: credential.empresaId || null,
      empleadoId: credential.empleadoId,
    };
    this.user.set(u);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    }
    return true;
  }

  logout(): void {
    this.user.set(null);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
}
