import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';

import type { UserRole } from '../models/app.models';

interface AppUserCredential {
  id: string;
  email: string;
  password: string;
  role: UserRole;
  displayName: string;
  empresaId: string;
  empleadoId: string | null;
}

const STORAGE_KEY = 'jarder_usuarios_v1';

const SEED: AppUserCredential[] = [
  { id: 'u-super', email: 'super@jarder.com', password: 'super123', role: 'superadmin', displayName: 'Super Admin', empresaId: '', empleadoId: null },
  { id: 'u-admin', email: 'admin@empresa.com', password: 'admin123', role: 'admin', displayName: 'Administrador', empresaId: 'empresa-1', empleadoId: null },
  { id: 'u-worker', email: 'worker@empresa.com', password: 'worker123', role: 'worker', displayName: 'Trabajador Demo', empresaId: 'empresa-1', empleadoId: 'emp-1' },
];

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly platformId = inject(PLATFORM_ID);

  private readonly usuariosSignal = signal<AppUserCredential[]>([]);

  readonly allUsuarios = computed(() => this.usuariosSignal());

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.hydrateFromStorage();
    }
  }

  private hydrateFromStorage(): void {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      this.usuariosSignal.set(SEED);
      this.persist();
      return;
    }
    try {
      const parsed = JSON.parse(raw) as AppUserCredential[];
      this.usuariosSignal.set(Array.isArray(parsed) ? parsed : []);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  private persist(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.usuariosSignal()));
  }

  getById(id: string): AppUserCredential | undefined {
    return this.usuariosSignal().find((u) => u.id === id);
  }

  getByEmail(email: string): AppUserCredential | undefined {
    return this.usuariosSignal().find((u) => u.email === email);
  }

  byEmpresa(empresaId: string): AppUserCredential[] {
    return this.usuariosSignal().filter((u) => u.empresaId === empresaId);
  }

  upsert(partial: Partial<AppUserCredential> & Pick<AppUserCredential, 'email' | 'password' | 'role' | 'empresaId'>): AppUserCredential {
    const list = this.usuariosSignal();
    let next: AppUserCredential[];
    if (partial.id) {
      next = list.map((u) => (u.id === partial.id ? { ...u, ...partial } : u));
    } else {
      const usuario: AppUserCredential = {
        id: crypto.randomUUID(),
        email: partial.email,
        password: partial.password,
        role: partial.role,
        displayName: partial.displayName ?? '',
        empresaId: partial.empresaId,
        empleadoId: partial.empleadoId ?? null,
      };
      next = [...list, usuario];
    }
    this.usuariosSignal.set(next);
    this.persist();
    return this.getById(partial.id ?? next[next.length - 1].id)!;
  }

  delete(id: string): void {
    this.usuariosSignal.set(this.usuariosSignal().filter((u) => u.id !== id));
    this.persist();
  }

  validateLogin(email: string, password: string): AppUserCredential | null {
    const user = this.getByEmail(email);
    if (!user || user.password !== password) {
      return null;
    }
    return user;
  }
}
