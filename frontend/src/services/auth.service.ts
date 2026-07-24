import { http } from "@/lib/http";
import type { LoginInput, RegisterInput, User } from "@/lib/types";

export const authService = {
  async me(): Promise<User> {
    const { data } = await http.get<User>("/auth/me");
    return data;
  },
  async login(input: LoginInput): Promise<User> {
    const { data } = await http.post<User>("/auth/login", input);
    return data;
  },
  async register(input: RegisterInput): Promise<User> {
    const { data } = await http.post<User>("/auth/register", input);
    return data;
  },
  async logout(): Promise<void> {
    await http.post("/auth/logout");
  },
  async refresh(): Promise<void> {
    await http.post("/auth/refresh");
  },
  async forgotPassword(email: string): Promise<void> {
    await http.post("/auth/forgot-password", { email });
  },
  async resetPassword(token: string, newPassword: string): Promise<void> {
    await http.post("/auth/reset-password", { token, new_password: newPassword });
  },
};
