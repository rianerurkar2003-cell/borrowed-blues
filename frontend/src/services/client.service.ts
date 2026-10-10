import { http } from "@/lib/http";
import type {
  Appointment,
  AppointmentInput,
  ClientDashboardPayload,
  ClientProfile,
  ClientProfileInput,
  Homework,
  HomeworkStatusInput,
  OnboardingPayload,
  Reflection,
  ReflectionInput,
  Resource,
  SessionNote,
} from "@/lib/types";

export const clientService = {
  dashboard: async (): Promise<ClientDashboardPayload> =>
    (await http.get<ClientDashboardPayload>("/client/dashboard")).data,

  onboarding: async (): Promise<OnboardingPayload> =>
    (await http.get<OnboardingPayload>("/client/onboarding")).data,

  updateOnboarding: async (input: ClientProfileInput): Promise<ClientProfile> =>
    (await http.put<ClientProfile>("/client/onboarding", input)).data,

  appointments: async (): Promise<Appointment[]> =>
    (await http.get<Appointment[]>("/client/appointments")).data,

  requestAppointment: async (input: AppointmentInput): Promise<Appointment> =>
    (await http.post<Appointment>("/client/appointments/request", input)).data,

  reflections: async (): Promise<Reflection[]> =>
    (await http.get<Reflection[]>("/client/reflections")).data,

  createReflection: async (input: ReflectionInput): Promise<Reflection> =>
    (await http.post<Reflection>("/client/reflections", input)).data,

  updateReflectionVisibility: async (id: string, visibility: "private" | "shared"): Promise<Reflection> =>
    (await http.patch<Reflection>(`/client/reflections/${id}`, { visibility })).data,

  homework: async (): Promise<Homework[]> =>
    (await http.get<Homework[]>("/client/homework")).data,

  updateHomework: async (id: string, patch: HomeworkStatusInput): Promise<Homework> =>
    (await http.patch<Homework>(`/client/homework/${id}`, patch)).data,

  sessionNotes: async (): Promise<SessionNote[]> =>
    (await http.get<SessionNote[]>("/client/session-notes")).data,

  resources: async (): Promise<Resource[]> =>
    (await http.get<Resource[]>("/client/resources")).data,

  resource: async (id: string): Promise<Resource> =>
    (await http.get<Resource>(`/client/resources/${id}`)).data,
};
