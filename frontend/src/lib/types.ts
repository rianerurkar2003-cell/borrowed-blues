/**
 * Shared domain types. Every service response and every UI component that
 * consumes API data should reference the types here to keep the client and
 * server contracts in one place.
 */

export type Role = "therapist" | "client";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  created_at: string;
}

export type AppointmentStatus = "scheduled" | "completed" | "cancelled" | "requested";
export type AppointmentMode = "online" | "in-person";

export interface Appointment {
  id: string;
  client_id: string;
  therapist_id: string;
  date: string;
  time: string;
  duration_min: number;
  mode: AppointmentMode;
  status: AppointmentStatus;
  notes?: string;
  created_at: string;
}

export interface AppointmentInput {
  client_id?: string;
  date: string;
  time: string;
  duration_min?: number;
  mode?: AppointmentMode;
  notes?: string;
}

export interface SessionNote {
  id: string;
  therapist_id: string;
  client_id: string;
  summary: string;
  homework?: string;
  resources?: string[];
  shared_with_client: boolean;
  created_at: string;
}

export interface SessionNoteInput {
  appointment_id?: string;
  client_id: string;
  summary: string;
  homework?: string;
  resources?: string[];
  shared_with_client: boolean;
}

export type HomeworkType = "checklist" | "writing" | "breathing" | "reading";

export interface Homework {
  id: string;
  therapist_id: string;
  client_id: string;
  title: string;
  description: string;
  type: HomeworkType;
  items?: string[];
  due_date?: string;
  completed: boolean;
  completed_items: number[];
  client_notes: string;
  created_at: string;
}

export interface HomeworkInput {
  client_id: string;
  title: string;
  description: string;
  type: HomeworkType;
  items?: string[];
  due_date?: string;
}

export interface HomeworkStatusInput {
  completed: boolean;
  completed_items?: number[];
  client_notes?: string;
}

export interface Reflection {
  id: string;
  user_id: string;
  title: string;
  body: string;
  mood?: string;
  is_draft: boolean;
  created_at: string;
}

export interface ReflectionInput {
  title: string;
  body: string;
  mood?: string;
  is_draft: boolean;
}

export type ResourceKind = "article" | "pdf" | "video" | "link";

export interface Resource {
  id: string;
  title: string;
  description: string;
  category: string;
  kind: ResourceKind;
  url?: string;
  body?: string;
  is_public: boolean;
  created_at: string;
}

export interface ResourceInput {
  title: string;
  description: string;
  category: string;
  kind: ResourceKind;
  url?: string;
  body?: string;
  is_public: boolean;
}

export type ConsultationStatus = "new" | "accepted" | "declined";

export interface ConsultationRequest {
  id: string;
  name: string;
  email: string;
  phone?: string;
  reason?: string;
  preferred_time?: string;
  status: ConsultationStatus;
  created_at: string;
}

export interface ConsultationRequestInput {
  name: string;
  email: string;
  phone?: string;
  reason?: string;
  preferred_time?: string;
}

export interface TherapistProfile {
  slug: string;
  name: string;
  title: string;
  personal_note: string;
  approach: string;
  qualifications: { label: string; value: string }[];
  areas: string[];
  pillars: { title: string; body: string }[];
}

export interface TherapistDashboardPayload {
  today: Appointment[];
  upcoming: Appointment[];
  requests: ConsultationRequest[];
  reflections: Reflection[];
  client_count: number;
}

export interface ClientDashboardPayload {
  upcoming: Appointment[];
  latest_summary: SessionNote | null;
  homework: Homework[];
  reflections: Reflection[];
}

export interface LoginInput {
  email: string;
  password: string;
  remember?: boolean;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}
