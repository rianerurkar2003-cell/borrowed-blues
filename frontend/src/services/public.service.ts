import { http } from "@/lib/http";
import type { ConsultationRequest, ConsultationRequestInput, Resource, TherapistProfile } from "@/lib/types";

export const publicService = {
  async therapistProfile(): Promise<TherapistProfile> {
    const { data } = await http.get<TherapistProfile>("/therapist/profile");
    return data;
  },
  async resources(params: { category?: string; q?: string } = {}): Promise<Resource[]> {
    const { data } = await http.get<Resource[]>("/resources/public", { params });
    return data;
  },
  async submitConsultation(input: ConsultationRequestInput): Promise<ConsultationRequest> {
    const { data } = await http.post<ConsultationRequest>("/consultation-requests", input);
    return data;
  },
};
