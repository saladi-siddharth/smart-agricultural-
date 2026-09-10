import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import AppLayout from '@/layouts/AppLayout';

// Pages
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import DashboardPage from '@/pages/DashboardPage';
import FarmsPage from '@/pages/FarmsPage';
import FarmDetailsPage from '@/pages/FarmDetailsPage';
import FieldsPage from '@/pages/FieldsPage';
import CropsPage from '@/pages/CropsPage';
import CropDetailPage from '@/pages/CropDetailPage';
import ActivitiesPage from '@/pages/ActivitiesPage';
import InputsPage from '@/pages/InputsPage';
import ExpensesPage from '@/pages/ExpensesPage';
import IrrigationPage from '@/pages/IrrigationPage';
import HarvestPage from '@/pages/HarvestPage';
import IntelligencePage from '@/pages/IntelligencePage';
import ReportsPage from '@/pages/ReportsPage';
import { Loader2 } from 'lucide-react';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[var(--color-surface-secondary)]">
        <Loader2 className="w-10 h-10 animate-spin text-[var(--color-primary-600)] mb-3" />
        <p className="text-sm font-medium text-[var(--color-text-secondary)]">
          Starting FarmPilot Command Center...
        </p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Application Layout */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/farms" element={<FarmsPage />} />
            <Route path="/farms/:id" element={<FarmDetailsPage />} />
            <Route path="/fields" element={<FieldsPage />} />
            <Route path="/crops" element={<CropsPage />} />
            <Route path="/crops/:id" element={<CropDetailPage />} />
            <Route path="/activities" element={<ActivitiesPage />} />
            <Route path="/inputs" element={<InputsPage />} />
            <Route path="/expenses" element={<ExpensesPage />} />
            <Route path="/irrigation" element={<IrrigationPage />} />
            <Route path="/harvest" element={<HarvestPage />} />
            <Route path="/intelligence" element={<IntelligencePage />} />
            <Route path="/reports" element={<ReportsPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
