import axios, { type AxiosInstance } from "axios";
import { toAppError } from "@/lib/errors";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API_BASE = `${BACKEND_URL}/api`;

/**
 * Single shared axios instance. Every network call in the app funnels
 * through this — never call axios directly from components.
 *
 * - Cookies are always sent (session lives in httpOnly cookies)
 * - 401 responses attempt a single silent refresh before bubbling
 * - Every error is normalised to an `AppError`
 */
export const http: AxiosInstance = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
  timeout: 20000,
});

let refreshInFlight: Promise<void> | null = null;
async function tryRefresh(): Promise<void> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = axios
    .post(`${API_BASE}/auth/refresh`, null, { withCredentials: true })
    .then(() => undefined)
    .finally(() => {
      refreshInFlight = null;
    });
  return refreshInFlight;
}

http.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config ?? {};
    // silent one-shot refresh on 401 (except on /auth/* endpoints themselves)
    const url: string = original.url ?? "";
    const isAuthCall = url.startsWith("/auth/");
    if (error.response?.status === 401 && !isAuthCall && !original.__retried) {
      try {
        original.__retried = true;
        await tryRefresh();
        return http(original);
      } catch {
        /* fall through to reject */
      }
    }
    return Promise.reject(toAppError(error));
  },
);

