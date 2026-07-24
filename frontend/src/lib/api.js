// Compat shim — kept so pages using `import { api, formatApiError } from "@/lib/api"`
// continue to work. New code should import from `@/lib/http` and use the typed
// services under `@/services/*` instead.
export { api, http, formatApiError, API_BASE } from "@/lib/http";
