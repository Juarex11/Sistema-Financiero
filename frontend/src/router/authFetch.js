const API_BASE = import.meta.env.VITE_API_URL;

export async function authFetch(endpoint, token, options = {}) {
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), 8_000);

  const isFormData = options.body instanceof FormData;

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        // ✅ Si es FormData NO ponemos Content-Type, el browser lo genera con el boundary
        ...(!isFormData && { "Content-Type": "application/json" }),
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });
    return res;
  } finally {
    clearTimeout(tid);
  }
}

export function normalizeUser(token, user) {
  return {
    token,
    name:     user.name,
    email:    user.email,
    role:     user.role,
    photo:    user.photo    ?? null,
    currency: user.currency ?? "PEN",
    cargo:    user.cargo    ?? null,
  };
}