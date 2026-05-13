import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../../core/services/auth.service';
import { EmpleadoService } from '../../../core/services/empleado.service';
import { UsuarioService } from '../../../core/services/usuario.service';
import { ConfirmModalComponent } from '../../../core/components/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-admin-usuarios',
  imports: [FormsModule, ConfirmModalComponent],
  templateUrl: './admin-usuarios.component.html',
  styleUrl: './admin-usuarios.component.css',
})
export class AdminUsuariosComponent {
  private readonly usuarioService = inject(UsuarioService);
  private readonly empleadoService = inject(EmpleadoService);
  private readonly auth = inject(AuthService);

  readonly usuarios = computed(() => this.usuarioService.byEmpresa(this.auth.user()!.empresaId!));
  readonly empleados = computed(() => this.empleadoService.byEmpresa(this.auth.user()!.empresaId!));

  readonly showForm = signal(false);
  readonly editingId = signal<string | null>(null);

  readonly form = signal<{ email: string; password: string; role: string; displayName: string; empleadoId: string }>({
    email: '',
    password: '',
    role: 'worker',
    displayName: '',
    empleadoId: '',
  });
  readonly error = signal('');

  openNew(): void {
    this.form.set({ email: '', password: '', role: 'worker', displayName: '', empleadoId: '' });
    this.editingId.set(null);
    this.showForm.set(true);
    this.error.set('');
  }

  openEdit(u: { id: string; email: string; displayName: string; role: string; empleadoId: string | null }): void {
    this.form.set({
      email: u.email,
      password: '',
      role: u.role,
      displayName: u.displayName,
      empleadoId: u.empleadoId ?? '',
    });
    this.editingId.set(u.id);
    this.showForm.set(true);
    this.error.set('');
  }

  cancel(): void {
    this.showForm.set(false);
    this.error.set('');
  }

  save(): void {
    const f = this.form();
    if (!f.email.trim() || !f.displayName.trim() || !f.role) {
      this.error.set('Completa todos los campos obligatorios.');
      return;
    }
    if (!this.editingId() && !f.password.trim()) {
      this.error.set('La contraseña es obligatoria para nuevos usuarios.');
      return;
    }

    const empresaId = this.auth.user()!.empresaId!;

    if (this.editingId()) {
      const existing = this.usuarioService.getById(this.editingId()!);
      this.usuarioService.upsert({
        id: this.editingId()!,
        email: f.email.trim(),
        password: f.password.trim() || existing?.password || '',
        role: f.role as 'admin' | 'worker',
        displayName: f.displayName.trim(),
        empresaId,
        empleadoId: f.empleadoId || null,
      });
    } else {
      this.usuarioService.upsert({
        email: f.email.trim(),
        password: f.password.trim(),
        role: f.role as 'admin' | 'worker',
        displayName: f.displayName.trim(),
        empresaId,
        empleadoId: f.empleadoId || null,
      });
    }

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
      this.usuarioService.delete(this.pendingDeleteId()!);
      this.pendingDeleteId.set(null);
    }
    this.showConfirm.set(false);
  }

  cancelDelete(): void {
    this.pendingDeleteId.set(null);
    this.showConfirm.set(false);
  }

  remove(id: string): void {
    if (confirm('¿Eliminar este usuario?')) {
      this.usuarioService.delete(id);
    }
  }

  empleadoNombre(empleadoId: string): string {
    return empleadoId ? this.empleadoService.getById(empleadoId)?.nombre ?? '—' : '—';
  }
}
