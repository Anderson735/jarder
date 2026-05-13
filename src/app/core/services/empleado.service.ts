import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';

import type { Empleado } from '../models/app.models';

const STORAGE_KEY = 'jarder_empleados_v1';

const SEED: Empleado = {
  id: 'emp-1',
  empresaId: 'empresa-1',
  identificacion: '1234567890',
  tipoIdentificacion: 'CC',
  sexo: 'M',
  telefono: '3001234567',
  nombre: 'Trabajador Demo',
};

@Injectable({ providedIn: 'root' })
export class EmpleadoService {
  private readonly platformId = inject(PLATFORM_ID);

  private readonly empleadosSignal = signal<Empleado[]>([]);

  readonly allEmpleados = computed(() => this.empleadosSignal());

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.hydrateFromStorage();
    }
  }

  private hydrateFromStorage(): void {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      this.empleadosSignal.set([SEED]);
      this.persist();
      return;
    }
    try {
      const parsed = JSON.parse(raw) as Empleado[];
      this.empleadosSignal.set(Array.isArray(parsed) ? parsed : []);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  private persist(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.empleadosSignal()));
  }

  getById(id: string): Empleado | undefined {
    return this.empleadosSignal().find((e) => e.id === id);
  }

  byEmpresa(empresaId: string): Empleado[] {
    return this.empleadosSignal().filter((e) => e.empresaId === empresaId);
  }

  upsert(partial: Partial<Empleado> & Pick<Empleado, 'identificacion' | 'empresaId'>): Empleado {
    const list = this.empleadosSignal();
    let next: Empleado[];
    if (partial.id) {
      next = list.map((e) => (e.id === partial.id ? { ...e, ...partial } : e));
    } else {
      const empleado: Empleado = {
        id: crypto.randomUUID(),
        empresaId: partial.empresaId,
        identificacion: partial.identificacion,
        tipoIdentificacion: partial.tipoIdentificacion ?? 'CC',
        sexo: partial.sexo ?? 'O',
        telefono: partial.telefono ?? '',
        nombre: partial.nombre ?? '',
      };
      next = [...list, empleado];
    }
    this.empleadosSignal.set(next);
    this.persist();
    return this.getById(partial.id ?? next[next.length - 1].id)!;
  }

  delete(id: string): void {
    this.empleadosSignal.set(this.empleadosSignal().filter((e) => e.id !== id));
    this.persist();
  }
}
