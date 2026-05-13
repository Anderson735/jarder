import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import type { Empresa } from '../../../core/models/app.models';
import { EmpresaService } from '../../../core/services/empresa.service';
import { ConfirmModalComponent } from '../../../core/components/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-superadmin-empresas',
  imports: [FormsModule, ConfirmModalComponent],
  templateUrl: './superadmin-empresas.component.html',
  styleUrl: './superadmin-empresas.component.css',
})
export class SuperadminEmpresasComponent {
  private readonly empresaService = inject(EmpresaService);

  readonly empresas = computed(() => this.empresaService.allEmpresas());

  readonly showForm = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly form = signal<{ nit: string; direccion: string; telefono: string }>({
    nit: '',
    direccion: '',
    telefono: '',
  });
  readonly error = signal('');

  openNew(): void {
    this.editingId.set(null);
    this.form.set({ nit: '', direccion: '', telefono: '' });
    this.error.set('');
    this.showForm.set(true);
  }

  openEdit(e: Empresa): void {
    this.editingId.set(e.id);
    this.form.set({ nit: e.nit, direccion: e.direccion, telefono: e.telefono });
    this.error.set('');
    this.showForm.set(true);
  }

  cancel(): void {
    this.showForm.set(false);
    this.error.set('');
  }

  save(): void {
    const f = this.form();
    if (!f.nit.trim() || !f.direccion.trim() || !f.telefono.trim()) {
      this.error.set('Todos los campos son obligatorios.');
      return;
    }
    this.error.set('');
    this.empresaService.upsert({
      ...(this.editingId() ? { id: this.editingId()! } : {}),
      nit: f.nit.trim(),
      direccion: f.direccion.trim(),
      telefono: f.telefono.trim(),
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
      this.empresaService.delete(this.pendingDeleteId()!);
      this.pendingDeleteId.set(null);
    }
    this.showConfirm.set(false);
  }

  cancelDelete(): void {
    this.pendingDeleteId.set(null);
    this.showConfirm.set(false);
  }

  remove(id: string): void {
    this.empresaService.delete(id);
  }
}
