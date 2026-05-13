import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { AdminCertificacionesComponent } from './features/admin/admin-certificaciones/admin-certificaciones.component';
import { AdminCourseEditComponent } from './features/admin/admin-course-edit/admin-course-edit.component';
import { AdminCourseNewComponent } from './features/admin/admin-course-new/admin-course-new.component';
import { AdminCoursesComponent } from './features/admin/admin-courses/admin-courses.component';
import { AdminEmpleadosComponent } from './features/admin/admin-empleados/admin-empleados.component';
import { AdminEvaluationEditComponent } from './features/admin/admin-evaluation-edit/admin-evaluation-edit.component';
import { AdminSessionEditComponent } from './features/admin/admin-session-edit/admin-session-edit.component';
import { AdminShellComponent } from './features/admin/admin-shell/admin-shell.component';
import { AdminUsuariosComponent } from './features/admin/admin-usuarios/admin-usuarios.component';
import { LoginComponent } from './features/auth/login/login.component';
import { SuperadminEmpresasComponent } from './features/superadmin/superadmin-empresas/superadmin-empresas.component';
import { SuperadminShellComponent } from './features/superadmin/superadmin-shell/superadmin-shell.component';
import { WorkerCatalogComponent } from './features/worker/worker-catalog/worker-catalog.component';
import { WorkerCertificateComponent } from './features/worker/worker-certificate/worker-certificate.component';
import { WorkerExamComponent } from './features/worker/worker-exam/worker-exam.component';
import { WorkerLearnComponent } from './features/worker/worker-learn/worker-learn.component';
import { WorkerShellComponent } from './features/worker/worker-shell/worker-shell.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', component: LoginComponent },
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard('admin')],
    component: AdminShellComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'courses' },
      { path: 'courses', component: AdminCoursesComponent },
      { path: 'courses/new', component: AdminCourseNewComponent },
      { path: 'empleados', component: AdminEmpleadosComponent },
      { path: 'usuarios', component: AdminUsuariosComponent },
      { path: 'certificaciones', component: AdminCertificacionesComponent },
      { path: 'courses/:courseId/evaluations/new', component: AdminEvaluationEditComponent },
      { path: 'courses/:courseId/evaluations/:evaluationId', component: AdminEvaluationEditComponent },
      { path: 'courses/:courseId', component: AdminCourseEditComponent },
      { path: 'courses/:courseId/sessions/:sessionId', component: AdminSessionEditComponent },
    ],
  },
  {
    path: 'superadmin',
    canActivate: [authGuard, roleGuard('superadmin')],
    component: SuperadminShellComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'empresas' },
      { path: 'empresas', component: SuperadminEmpresasComponent },
    ],
  },
  {
    path: 'worker',
    canActivate: [authGuard, roleGuard('worker')],
    component: WorkerShellComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'catalog' },
      { path: 'catalog', component: WorkerCatalogComponent },
      { path: 'learn/:courseId/examen/:evaluationId', component: WorkerExamComponent },
      { path: 'learn/:courseId/certificado/:evaluationId', component: WorkerCertificateComponent },
      { path: 'learn/:courseId', component: WorkerLearnComponent },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
