import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';

import type { AppUser, UserRole } from '../models/app.models';

const STORAGE_KEY = 'jarder_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly platformId = inject(PLATFORM_ID);

  readonly user = signal<AppUser | null>(null);

  readonly isAuthenticated = computed(() => this.user() !== null);
  readonly role = computed(() => this.user()?.role ?? null);
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

  loginAs(role: UserRole, displayName: string, email?: string): void {
    const u: AppUser = {
      id: crypto.randomUUID(),
      email: email?.trim() || (role === 'admin' ? 'admin@empresa.local' : 'trabajador@empresa.local'),
      displayName: displayName.trim() || (role === 'admin' ? 'Administrador' : 'Trabajador'),
      role,
    };
    this.user.set(u);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    }
  }

  logout(): void {
    this.user.set(null);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
}
