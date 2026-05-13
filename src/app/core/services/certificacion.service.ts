import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';

import type { Certificacion } from '../models/app.models';

const STORAGE_KEY = 'jarder_certificaciones_v1';

@Injectable({ providedIn: 'root' })
export class CertificacionService {
  private readonly platformId = inject(PLATFORM_ID);

  private readonly certificacionesSignal = signal<Certificacion[]>([]);

  readonly allCertificaciones = computed(() => this.certificacionesSignal());

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.hydrateFromStorage();
    }
  }

  private hydrateFromStorage(): void {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }
    try {
      const parsed = JSON.parse(raw) as Certificacion[];
      this.certificacionesSignal.set(Array.isArray(parsed) ? parsed : []);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  private persist(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.certificacionesSignal()));
  }

  getById(id: string): Certificacion | undefined {
    return this.certificacionesSignal().find((c) => c.id === id);
  }

  byEmpleado(empleadoId: string): Certificacion[] {
    return this.certificacionesSignal().filter((c) => c.empleadoId === empleadoId);
  }

  byEmpresa(empresaId: string): Certificacion[] {
    return this.certificacionesSignal().filter((c) => c.empresaId === empresaId);
  }

  byCurso(cursoId: string): Certificacion[] {
    return this.certificacionesSignal().filter((c) => c.cursoId === cursoId);
  }

  issue(data: Omit<Certificacion, 'id' | 'issuedAt'>): Certificacion {
    const cert: Certificacion = {
      id: crypto.randomUUID(),
      ...data,
      issuedAt: new Date().toISOString(),
    };
    this.certificacionesSignal.set([...this.certificacionesSignal(), cert]);
    this.persist();
    return cert;
  }

  delete(id: string): void {
    this.certificacionesSignal.set(this.certificacionesSignal().filter((c) => c.id !== id));
    this.persist();
  }
}
