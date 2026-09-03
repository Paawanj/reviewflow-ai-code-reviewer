import api from "@/lib/api";

let refreshSessionPromise = null;

export async function registerUser(values) {
  const response = await api.post("/auth/register", values);
  return response.data;
}

export async function loginUser(values) {
  const response = await api.post("/auth/login", values);
  return response.data;
}

export async function refreshSession() {
  refreshSessionPromise ??= api.post("/auth/refresh")
    .then((response) => response.data)
    .finally(() => {
      refreshSessionPromise = null;
    });

  return refreshSessionPromise;
}

export async function logoutUser() {
  await api.post("/auth/logout");
}

export async function getCurrentUser() {
  const response = await api.get("/auth/me");
  return response.data.user;
}
