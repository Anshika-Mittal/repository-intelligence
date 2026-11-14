
const API_URL = import.meta.env.VITE_API_URL;

export interface User {
  sub: string;
  email: string;
  emailVerified: boolean;
  name: string;
}

export interface AuthResponse {
  authenticated: boolean;
  user: User;
}

export const authService = {
  // Redirect browser to Express login endpoint
  login() {
    window.location.href = `${API_URL}/auth/login`;
  },

  // Get currently authenticated user
  async getCurrentUser(): Promise<AuthResponse> {
    const response = await fetch(
      `${API_URL}/auth/me`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error("Not authenticated");
    }

    return response.json();
  },

  // Logout through Express
  logout() {
    window.location.href = `${API_URL}/auth/logout`;
  },
};
