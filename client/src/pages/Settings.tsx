import { useAuth } from "../auth/AuthContext";

export default function Settings() {
  const { user, logout } = useAuth();

  return (
    <div>
      <h1>Settings</h1>

      <section className="overview-card">
        <h2>Account Information</h2>

        <p>Email: {user?.email}</p>
        <p>Name: {user?.name || "Not provided"}</p>

        <button
          className="primary-button"
          onClick={logout}
        >
          Logout
        </button>
      </section>
    </div>
  );
}