import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div>
      <h1>Repository Intelligence Dashboard</h1>

      <p>
        Welcome, {user?.name || user?.email}
      </p>

      <p>Email: {user?.email}</p>

      <button onClick={logout}>
        Logout
      </button>
    </div>
  );
}