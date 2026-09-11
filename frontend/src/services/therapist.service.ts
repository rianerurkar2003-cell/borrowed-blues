import { http } from "@/lib/http";
import type {
  Appointment,
  AppointmentInput,
  ConsultationRequest,
  GoogleCalendarStatus,
  Homework,
  HomeworkInput,
  Reflection,
  Resource,
  ResourceInput,
  SessionNote,
  SessionNoteInput,
  TherapistDashboardPayload,
  User,
} from "@/lib/types";

export const therapistService = {
  dashboard: async (): Promise<TherapistDashboardPayload> =>
    (await http.get<TherapistDashboardPayload>("/therapist/dashboard")).data,

  clients: async (): Promise<User[]> =>
    (await http.get<User[]>("/therapist/clients")).data,

  createClient: async (input: { name: string; email: string; password?: string }): Promise<User & { generated_password?: string }> =>
    (await http.post<User & { generated_password?: string }>("/therapist/clients", input)).data,

  removeClient: async (clientId: string): Promise<void> => {
    await http.delete(`/therapist/clients/${clientId}`);
  },

  googleStatus: async (): Promise<GoogleCalendarStatus> =>
    (await http.get<GoogleCalendarStatus>("/therapist/google/status")).data,

  googleAuthUrl: async (): Promise<string> =>
    (await http.get<{ url: string }>("/therapist/google/auth-url")).data.url,

  googleDisconnect: async (): Promise<void> => {
    await http.post("/therapist/google/disconnect");
  },

  appointments: async (): Promise<Appointment[]> =>
    (await http.get<Appointment[]>("/therapist/appointments")).data,

  createAppointment: async (input: AppointmentInput): Promise<Appointment> =>
    (await http.post<Appointment>("/therapist/appointments", input)).data,

  updateAppointment: async (id: string, patch: Partial<Appointment>): Promise<Appointment> =>
    (await http.patch<Appointment>(`/therapist/appointments/${id}`, patch)).data,

  requests: async (): Promise<ConsultationRequest[]> =>
    (await http.get<ConsultationRequest[]>("/therapist/requests")).data,

  updateRequestStatus: async (id: string, status: ConsultationRequest["status"]): Promise<void> => {
    await http.patch(`/therapist/requests/${id}`, { status });
  },

  reflections: async (): Promise<Reflection[]> =>
    (await http.get<Reflection[]>("/therapist/reflections")).data,

  sessionNotes: async (clientId?: string): Promise<SessionNote[]> =>
    (await http.get<SessionNote[]>("/therapist/session-notes", { params: clientId ? { client_id: clientId } : undefined })).data,

  createSessionNote: async (input: SessionNoteInput): Promise<SessionNote> =>
    (await http.post<SessionNote>("/therapist/session-notes", input)).data,

  assignHomework: async (input: HomeworkInput): Promise<Homework> =>
    (await http.post<Homework>("/therapist/homework", input)).data,

  resources: async (): Promise<Resource[]> =>
    (await http.get<Resource[]>("/therapist/resources")).data,

  createResource: async (input: ResourceInput): Promise<Resource> =>
    (await http.post<Resource>("/therapist/resources", input)).data,

  updateResource: async (id: string, patch: Partial<ResourceInput>): Promise<Resource> =>
    (await http.patch<Resource>(`/therapist/resources/${id}`, patch)).data,
};
