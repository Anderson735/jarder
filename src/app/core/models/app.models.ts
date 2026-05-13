export type UserRole = 'superadmin' | 'admin' | 'worker';

export interface Empresa {
  id: string;
  nit: string;
  direccion: string;
  telefono: string;
}

export interface Empleado {
  id: string;
  empresaId: string;
  identificacion: string;
  tipoIdentificacion: 'CC' | 'CE' | 'TI' | 'PP';
  sexo: 'M' | 'F' | 'O';
  telefono: string;
  nombre: string;
}

export interface AppUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  empresaId: string | null;
  empleadoId: string | null;
}

export interface Certificacion {
  id: string;
  empleadoId: string;
  empresaId: string;
  nombre: string;
  cursoId: string;
  issuedAt: string;
}

export type MaterialKind = 'video' | 'document' | 'link';

export interface CourseMaterial {
  id: string;
  title: string;
  kind: MaterialKind;
  /** URL externa (YouTube, Vimeo, mp4, PDF en la web, etc.) */
  externalUrl?: string;
  /** Referencia en IndexedDB para archivos subidos */
  blobId?: string;
}

export interface CourseSession {
  id: string;
  courseId: string;
  title: string;
  description: string;
  order: number;
  materials: CourseMaterial[];
}

/** Pregunta de opción múltiple (4 opciones, una correcta). */
export interface EvaluationQuestion {
  id: string;
  prompt: string;
  choices: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
}

/** Evaluación asociada a un curso (examen final o módulo). */
export interface CourseEvaluation {
  id: string;
  courseId: string;
  title: string;
  description: string;
  /** Porcentaje mínimo de aciertos para aprobar (0–100). */
  passingScorePercent: number;
  questions: EvaluationQuestion[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnailUrl?: string;
  published: boolean;
  empresaId: string;
  certificacionId: string | null;
  createdAt: string;
  updatedAt: string;
  sessions: CourseSession[];
  evaluations: CourseEvaluation[];
}
