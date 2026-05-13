import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';

import type { Empresa } from '../models/app.models';

const STORAGE_KEY = 'jarder_empresas_v1';

const SEED: Empresa = {
  id: 'empresa-1',
  nit: '900123456-1',
  direccion: 'Calle 10 # 5-20, Bogotá',
  telefono: '6012345678',
};

@Injectable({ providedIn: 'root' })
export class EmpresaService {
  private readonly platformId = inject(PLATFORM_ID);

  private readonly empresasSignal = signal<Empresa[]>([]);

  readonly allEmpresas = computed(() => this.empresasSignal());

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.hydrateFromStorage();
    }
  }

  private hydrateFromStorage(): void {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      this.empresasSignal.set([SEED]);
      this.persist();
      return;
    }
    try {
      const parsed = JSON.parse(raw) as Empresa[];
      this.empresasSignal.set(Array.isArray(parsed) ? parsed : []);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  private persist(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.empresasSignal()));
  }

  getById(id: string): Empresa | undefined {
    return this.empresasSignal().find((e) => e.id === id);
  }

  upsert(partial: Partial<Empresa> & Pick<Empresa, 'nit'>): Empresa {
    const list = this.empresasSignal();
    let next: Empresa[];
    if (partial.id) {
      next = list.map((e) => (e.id === partial.id ? { ...e, ...partial } : e));
    } else {
      const empresa: Empresa = {
        id: crypto.randomUUID(),
        nit: partial.nit,
        direccion: partial.direccion ?? '',
        telefono: partial.telefono ?? '',
      };
      next = [...list, empresa];
    }
    this.empresasSignal.set(next);
    this.persist();
    return this.getById(partial.id ?? next[next.length - 1].id)!;
  }

  delete(id: string): void {
    this.empresasSignal.set(this.empresasSignal().filter((e) => e.id !== id));
    this.persist();
  }
}
