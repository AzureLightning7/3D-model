import { useAuthStore } from "@/features/auth/store";
import type {
  AuthResponse,
  CatalogProduct,
  EditOp,
  Project,
  RankedProduct,
  Scene,
  StyleProfile,
  Survey,
  SurveyAnswer,
  TokenPair,
  User,
} from "@/shared/types";

const BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";

class ApiError extends Error {
  status: number;
  detail: unknown;
  constructor(status: number, detail: unknown) {
    super(typeof detail === "string" ? detail : `HTTP ${status}`);
    this.status = status;
    this.detail = detail;
  }
}

/**
 * In-flight refresh promise, so a burst of 401s only triggers one /auth/refresh
 * round-trip. All callers await the same promise and then retry with the new
 * access token.
 */
let refreshInFlight: Promise<TokenPair | null> | null = null;

async function refreshTokens(): Promise<TokenPair | null> {
  if (refreshInFlight) return refreshInFlight;
  const refreshToken = useAuthStore.getState().tokens?.refreshToken;
  if (!refreshToken) return null;

  refreshInFlight = (async () => {
    try {
      const res = await fetch(`${BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) {
        // Refresh token itself is bad/expired — sign out.
        useAuthStore.getState().clear();
        return null;
      }
      const tokens = (await res.json()) as TokenPair;
      useAuthStore.getState().setTokens(tokens);
      return tokens;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

async function rawFetch(
  path: string,
  init: RequestInit,
  authToken: string | undefined,
): Promise<Response> {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }
  if (authToken) headers.set("Authorization", `Bearer ${authToken}`);
  return fetch(`${BASE}${path}`, { ...init, headers });
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  { auth = true }: { auth?: boolean } = {},
): Promise<T> {
  const token = auth ? useAuthStore.getState().tokens?.accessToken : undefined;
  let res = await rawFetch(path, init, token);

  // If we get a 401 on an authed request, try one silent refresh + retry.
  if (auth && res.status === 401 && useAuthStore.getState().tokens?.refreshToken) {
    const fresh = await refreshTokens();
    if (fresh) {
      res = await rawFetch(path, init, fresh.accessToken);
    }
  }

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  const body: unknown = text ? JSON.parse(text) : undefined;
  if (!res.ok) {
    // If still 401 after refresh, the session is dead. Clear it.
    if (auth && res.status === 401) useAuthStore.getState().clear();
    const detail =
      body && typeof body === "object" && "detail" in body
        ? (body as { detail: unknown }).detail
        : body;
    throw new ApiError(res.status, detail);
  }
  return body as T;
}

export const api = {
  auth: {
    register: (email: string, password: string, displayName: string) =>
      request<AuthResponse>(
        "/auth/register",
        { method: "POST", body: JSON.stringify({ email, password, displayName }) },
        { auth: false },
      ),
    login: (email: string, password: string) =>
      request<AuthResponse>(
        "/auth/login",
        { method: "POST", body: JSON.stringify({ email, password }) },
        { auth: false },
      ),
    refresh: (refreshToken: string) =>
      request<TokenPair>(
        "/auth/refresh",
        { method: "POST", body: JSON.stringify({ refreshToken }) },
        { auth: false },
      ),
    me: () => request<User>("/auth/me"),
  },
  projects: {
    list: () => request<{ items: Project[] }>("/projects"),
    create: (input: {
      name: string;
      roomWidthM: number;
      roomDepthM: number;
      roomHeightM: number;
    }) =>
      request<Project>("/projects", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    get: (id: string) => request<Project>(`/projects/${id}`),
    updateScene: (id: string, scene: Scene) =>
      request<Project>(`/projects/${id}/scene`, {
        method: "PUT",
        body: JSON.stringify({ scene }),
      }),
    remove: (id: string) =>
      request<void>(`/projects/${id}`, { method: "DELETE" }),
    applyEdits: (id: string, expectedVersion: number, ops: EditOp[]) =>
      request<Project>(`/projects/${id}/scene/edits`, {
        method: "POST",
        body: JSON.stringify({ expectedVersion, ops }),
      }),
    recompose: (
      id: string,
      args: { style?: string; profileId?: string | null; preserveLocked?: boolean },
    ) =>
      request<Project>(`/projects/${id}/scene/recompose`, {
        method: "POST",
        body: JSON.stringify({
          style: args.style ?? "cozy",
          profileId: args.profileId ?? null,
          preserveLocked: args.preserveLocked ?? true,
        }),
      }),
  },
  catalog: {
    list: () => request<{ items: CatalogProduct[] }>("/catalog/products"),
    recommend: (args: { style?: string; profileId?: string | null; limit?: number }) => {
      const params = new URLSearchParams();
      if (args.profileId) params.set("profileId", args.profileId);
      else params.set("style", args.style ?? "cozy");
      params.set("limit", String(args.limit ?? 20));
      return request<{ items: RankedProduct[] }>(`/catalog/recommend?${params}`);
    },
  },
  styleProfiles: {
    getSurvey: () => request<Survey>("/style-profiles/survey", {}, { auth: false }),
    create: (answers: SurveyAnswer[]) =>
      request<StyleProfile>("/style-profiles", {
        method: "POST",
        body: JSON.stringify({ answers }),
      }),
    latest: () => request<StyleProfile>("/style-profiles/me/latest"),
  },
  upload: {
    transformRoom: async (body: {
      roomType: string;
      style: string;
      colorPalette: string;
      budget: string;
      interests: string[];
      origin: string;
      roomDna: string;
    }): Promise<{ success: boolean; imageUrl: string; promptUsed: string }> => {
      const res = await request<{ success: boolean; image_url: string; prompt_used: string }>(
        "/transform-room",
        {
          method: "POST",
          body: JSON.stringify({
            room_type: body.roomType,
            style: body.style,
            color_palette: body.colorPalette,
            budget: body.budget,
            interests: body.interests,
            origin: body.origin,
            room_dna: body.roomDna,
          }),
        },
      );
      return { success: res.success, imageUrl: res.image_url, promptUsed: res.prompt_used };
    },
  },
};

export { ApiError };
