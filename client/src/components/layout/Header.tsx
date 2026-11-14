import { useLocation } from "react-router-dom";
import { Bell, CircleUserRound } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";

export default function Header() {
  const { user } = useAuth();
  const location = useLocation();

  const pageTitles: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/repositories": "My Repositories",
    "/repositories/add": "Add Repository",
    "/activity": "Recent Activity",
    "/settings": "Settings",
  };

  const title =
    pageTitles[location.pathname] ||
    "Repository Workspace";

  return (
    <header className="header">
      <h2>{title}</h2>

      <div className="header-user">
        <button className="icon-button" aria-label="Notifications">
          <Bell size={19} />
        </button>

        <div className="user-info">
          <CircleUserRound size={25} />
          <span>{user?.name || user?.email || "Developer"}</span>
        </div>
      </div>
    </header>
  );
}