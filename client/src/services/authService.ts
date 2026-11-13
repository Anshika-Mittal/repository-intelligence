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
  console.log("API_URL:", API_URL);

  const loginUrl = `${API_URL}/login`;

  console.log("Redirecting to:", loginUrl);

  window.location.href = loginUrl;
},

  // Get current authenticated user
  async getCurrentUser(): Promise<AuthResponse> {
    const response = await fetch(
      `${API_URL}/me`,
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
    window.location.href = `${API_URL}/logout`;
  },
};