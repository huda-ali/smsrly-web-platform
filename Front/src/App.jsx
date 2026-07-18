import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth, usePlatform } from "./context/AuthContext";
import LandingPage from "./pages/LandingPage";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import SearchPage from "./pages/SearchPage";
import PropertyDetailsPage from "./pages/PropertyDetailsPage";
import OwnerDashboardPage from "./pages/OwnerDashboardPage";
import AdminPanelPage from "./pages/AdminPanelPage";
import AddEditPropertyPage from "./pages/AddEditPropertyPage";
import ProfilePage from "./pages/ProfilePage";

function ProtectedRoute({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/signin" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/signin" element={<SignInPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/search" element={<SearchPage />} />
      <Route path="/property/:id" element={<PropertyDetailsPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute roles={["owner"]}>
            <OwnerDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={["admin"]}>
            <AdminPanelPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/add-property"
        element={
          <ProtectedRoute roles={["owner"]}>
            <AddEditPropertyPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/edit-property/:id"
        element={
          <ProtectedRoute roles={["owner"]}>
            <AddEditPropertyPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
