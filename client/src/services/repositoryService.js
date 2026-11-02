
import { getAccessToken } from "../auth/authService";

export async function getRepositories() {
  const token = await getAccessToken();

  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/api/repositories`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch repositories");
  }

  return response.json();
}
