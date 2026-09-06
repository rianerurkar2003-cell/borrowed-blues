// zod schemas mirroring backend/models.py's Pydantic request models 1:1.
"use strict";
const { z } = require("zod");

const email = z.string().email();

const LoginRequest = z.object({
  email,
  password: z.string(),
  remember: z.boolean().optional().default(false),
});

// Public registration always creates a client account. Therapist accounts
// are provisioned only via ADMIN_EMAIL/ADMIN_PASSWORD in seed.js — never
// take the role from client input, or anyone could self-register as
// "therapist" and read every client's journal entries and session notes.
const RegisterRequest = z.object({
  email,
  password: z.string(),
  name: z.string(),
});

const ForgotPasswordRequest = z.object({ email });

const ResetPasswordRequest = z.object({
  token: z.string(),
  new_password: z.string(),
});

const AppointmentIn = z.object({
  client_id: z.string().optional().nullable(),
  date: z.string(),
  time: z.string(),
  duration_min: z.number().int().optional().default(50),
  mode: z.enum(["online", "in-person"]).optional().default("online"),
  notes: z.string().optional().nullable(),
});

const ConsultationRequestIn = z.object({
  name: z.string(),
  email,
  phone: z.string().optional().nullable(),
  reason: z.string().optional().nullable(),
  preferred_time: z.string().optional().nullable(),
});

const SessionSummaryIn = z.object({
  appointment_id: z.string().optional().nullable(),
  client_id: z.string(),
  summary: z.string(),
  homework: z.string().optional().nullable(),
  resources: z.array(z.string()).optional().nullable(),
  shared_with_client: z.boolean().optional().default(true),
});

const ReflectionIn = z.object({
  title: z.string(),
  body: z.string(),
  mood: z.string().optional().nullable(),
  is_draft: z.boolean().optional().default(false),
});

const HomeworkIn = z.object({
  client_id: z.string(),
  title: z.string(),
  description: z.string(),
  type: z.enum(["checklist", "writing", "breathing", "reading"]).optional().default("writing"),
  items: z.array(z.string()).optional().nullable(),
  due_date: z.string().optional().nullable(),
});

const HomeworkStatusIn = z.object({
  completed: z.boolean(),
  completed_items: z.array(z.number().int()).optional().nullable(),
  client_notes: z.string().optional().nullable(),
});

const ResourceIn = z.object({
  title: z.string(),
  description: z.string(),
  category: z.string(),
  kind: z.enum(["article", "pdf", "video", "link"]).optional().default("article"),
  url: z.string().optional().nullable(),
  body: z.string().optional().nullable(),
  is_public: z.boolean().optional().default(true),
});

// Therapist-created client accounts. Password is optional — omit it to have
// the server generate one, which is then returned once (and only once) so
// the therapist can share it with the client directly.
const CreateClientIn = z.object({
  name: z.string(),
  email,
  password: z.string().min(8).optional(),
});

module.exports = {
  LoginRequest, RegisterRequest, ForgotPasswordRequest, ResetPasswordRequest,
  AppointmentIn, ConsultationRequestIn, SessionSummaryIn, ReflectionIn,
  HomeworkIn, HomeworkStatusIn, ResourceIn, CreateClientIn,
};
