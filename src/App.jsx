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
import StaffPage from "./modules/staff/StaffPage";
import DownloadsPage from "./modules/downloads/DownloadsPage";
import ExpensesPage from "./modules/expenses/ExpensesPage";
import HomePage from "./modules/home/HomePage";

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
            <Route index element={<Navigate to="/home" replace />} />
            <Route path="home"      element={<HomePage />} />
            <Route path="turf"      element={<TurfPage />} />
            <Route path="swimming"  element={<SwimmingPage />} />
            <Route path="food"      element={<FoodPage />} />
            <Route path="other"     element={<OtherItemsPage />} />

            {/* Dashboard — staff: Today only; owner: Today + Monthly */}
            <Route path="dashboard" element={<DashboardPage />} />

            {/* Expenses — staff + owner, staff sees today only */}
            <Route path="expenses" element={<ExpensesPage />} />

            {/* Owner-only routes */}
            <Route
              path="staff"
              element={
                <ProtectedRoute ownerOnly>
                  <StaffPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="downloads"
              element={
                <ProtectedRoute ownerOnly>
                  <DownloadsPage />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
