import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();

  return (
    <div>
      <h1>Repository Intelligence</h1>

      <p>
        Understand repositories. Explore code.
        Contribute confidently.
      </p>

      <button onClick={login}>
        Login / Sign Up
      </button>
    </div>
  );
}