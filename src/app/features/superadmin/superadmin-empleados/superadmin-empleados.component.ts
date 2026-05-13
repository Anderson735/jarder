import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import type { Empleado } from '../../../core/models/app.models';
import { EmpleadoService } from '../../../core/services/empleado.service';
import { EmpresaService } from '../../../core/services/empresa.service';
import { ConfirmModalComponent } from '../../../core/components/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-superadmin-empleados',
  imports: [FormsModule, ConfirmModalComponent],
  templateUrl: './superadmin-empleados.component.html',
  styleUrl: './superadmin-empleados.component.css',
})
export class SuperadminEmpleadosComponent {
  private readonly empleadoService = inject(EmpleadoService);
  private readonly empresaService = inject(EmpresaService);

  readonly empleados = computed(() => this.empleadoService.allEmpleados());
  readonly empresas = computed(() => this.empresaService.allEmpresas());

  readonly showForm = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly form = signal<{
    empresaId: string;
    identificacion: string;
    tipoIdentificacion: string;
    sexo: string;
    telefono: string;
    nombre: string;
  }>({
    empresaId: '',
    identificacion: '',
    tipoIdentificacion: 'CC',
    sexo: 'M',
    telefono: '',
    nombre: '',
  });
  readonly error = signal('');

  openNew(): void {
    this.editingId.set(null);
    this.form.set({
      empresaId: '',
      identificacion: '',
      tipoIdentificacion: 'CC',
      sexo: 'M',
      telefono: '',
      nombre: '',
    });
    this.error.set('');
    this.showForm.set(true);
  }

  openEdit(e: Empleado): void {
    this.editingId.set(e.id);
    this.form.set({
      empresaId: e.empresaId,
      identificacion: e.identificacion,
      tipoIdentificacion: e.tipoIdentificacion,
      sexo: e.sexo,
      telefono: e.telefono,
      nombre: e.nombre,
    });
    this.error.set('');
    this.showForm.set(true);
  }

  cancel(): void {
    this.showForm.set(false);
    this.error.set('');
  }

  save(): void {
    const f = this.form();
    if (
      !f.nombre.trim() ||
      !f.identificacion.trim() ||
      !f.tipoIdentificacion ||
      !f.empresaId ||
      !f.sexo ||
      !f.telefono.trim()
    ) {
      this.error.set('Todos los campos son obligatorios.');
      return;
    }
    this.error.set('');
    this.empleadoService.upsert({
      ...(this.editingId() ? { id: this.editingId()! } : {}),
      empresaId: f.empresaId,
      identificacion: f.identificacion.trim(),
      tipoIdentificacion: f.tipoIdentificacion as Empleado['tipoIdentificacion'],
      sexo: f.sexo as Empleado['sexo'],
      telefono: f.telefono.trim(),
      nombre: f.nombre.trim(),
    });
    this.cancel();
  }

  readonly showConfirm = signal(false);
  readonly pendingDeleteId = signal<string | null>(null);

  requestDelete(id: string): void {
    this.pendingDeleteId.set(id);
    this.showConfirm.set(true);
  }

  confirmDelete(): void {
    if (this.pendingDeleteId()) {
      this.empleadoService.delete(this.pendingDeleteId()!);
      this.pendingDeleteId.set(null);
    }
    this.showConfirm.set(false);
  }

  cancelDelete(): void {
    this.pendingDeleteId.set(null);
    this.showConfirm.set(false);
  }

  remove(id: string): void {
    this.empleadoService.delete(id);
  }

  empresaNombre(empresaId: string): string {
    const e = this.empresaService.getById(empresaId);
    return e ? e.nit : 'Sin empresa';
  }
}
