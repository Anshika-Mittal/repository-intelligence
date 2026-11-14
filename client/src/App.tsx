import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";

import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
// import Repositories from "./pages/Repositories";
// import AddRepository from "./pages/AddRepository";
// import RepositoryWorkspace from "./pages/RepositoryWorkspace";
// import Chat from "./pages/Chat";
// import Activity from "./pages/Activity";
// import Settings from "./pages/Settings";
// import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/auth/ProtectedRoute";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            {/* <Route path="/repositories" element={<Repositories />} />
            <Route path="/repositories/add" element={<AddRepository />} />
            <Route path="/repositories/:id" element={<RepositoryWorkspace />} />
            <Route path="/repositories/:id/chat" element={<Chat />} />
            <Route path="/activity" element={<Activity />} />
            <Route path="/settings" element={<Settings />} /> */}
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          {/* <Route path="*" element={<NotFound />} /> */}
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}