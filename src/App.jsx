import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import ProtectedRoute from "./auth/ProtectedRoute";
import Layout from "./components/Layout";
import LoginPage from "./auth/LoginPage";
import TurfPage from "./modules/turf/TurfPage";
import SwimmingPage from "./modules/swimming/SwimmingPage";
import FoodPage from "./modules/food/FoodPage";
import OtherItemsPage from "./modules/otherItems/OtherItemsPage";
import DashboardPage from "./modules/dashboard/DashboardPage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected — all staff & owner */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            {/* Default: redirect to turf */}
            <Route index element={<Navigate to="/turf" replace />} />
            <Route path="turf" element={<TurfPage />} />
            <Route path="swimming" element={<SwimmingPage />} />
            <Route path="food" element={<FoodPage />} />
            <Route path="other" element={<OtherItemsPage />} />

            {/* Dashboard — owner only */}
            <Route
              path="dashboard"
              element={
                <ProtectedRoute ownerOnly>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
