import React from 'react';
import { Route, Routes, BrowserRouter as Router, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from './components/ProtectedRoute';
import { Toaster } from '@/components/ui/sonner';

import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import ClientesPage from './pages/ClientesPage';
import ClientDetailPage from './pages/ClientDetailPage';
import TareasPage from './pages/TareasPage';
import SeguimientosPage from './pages/SeguimientosPage';
import PricingPage from './pages/PricingPage';
import SuccessPage from './pages/SuccessPage';
import UsersPage from './pages/UsersPage';
import ReportsPage from './pages/ReportsPage';
import EmailTemplatesPage from './pages/EmailTemplatesPage';
import EmailHistoryPage from './pages/EmailHistoryPage';
import CalendarPage from './pages/CalendarPage';
import ConversionAnalysisPage from './pages/ConversionAnalysisPage';
import ActivityTimelinePage from './pages/ActivityTimelinePage';
import AdvancedSearchPage from './pages/AdvancedSearchPage';
import ImportClientsPage from './pages/ImportClientsPage';
import AutomationsPage from './pages/AutomationsPage';
import IntegrationsPage from './pages/IntegrationsPage';
import InventarioPage from './pages/InventarioPage';
import VentasPage from './pages/VentasPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/clientes" element={<ProtectedRoute><ClientesPage /></ProtectedRoute>} />
          <Route path="/clientes/:id" element={<ProtectedRoute><ClientDetailPage /></ProtectedRoute>} />
          <Route path="/tareas" element={<ProtectedRoute><TareasPage /></ProtectedRoute>} />
          <Route path="/seguimientos" element={<ProtectedRoute><SeguimientosPage /></ProtectedRoute>} />
          <Route path="/ventas" element={<ProtectedRoute><VentasPage /></ProtectedRoute>} />
          <Route path="/inventario" element={<ProtectedRoute><InventarioPage /></ProtectedRoute>} />
          <Route path="/pricing" element={<ProtectedRoute><PricingPage /></ProtectedRoute>} />
          <Route path="/success" element={<ProtectedRoute><SuccessPage /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute><UsersPage /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
          <Route path="/emails" element={<ProtectedRoute><EmailHistoryPage /></ProtectedRoute>} />
          <Route path="/emails/templates" element={<ProtectedRoute><EmailTemplatesPage /></ProtectedRoute>} />
          <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
          <Route path="/conversion-analysis" element={<ProtectedRoute><ConversionAnalysisPage /></ProtectedRoute>} />
          <Route path="/timeline" element={<ProtectedRoute><ActivityTimelinePage /></ProtectedRoute>} />
          <Route path="/search" element={<ProtectedRoute><AdvancedSearchPage /></ProtectedRoute>} />
          <Route path="/import" element={<ProtectedRoute><ImportClientsPage /></ProtectedRoute>} />
          <Route path="/automations" element={<ProtectedRoute><AutomationsPage /></ProtectedRoute>} />
          <Route path="/integrations" element={<ProtectedRoute><IntegrationsPage /></ProtectedRoute>} />
        </Routes>
        <Toaster />
      </Router>
    </AuthProvider>
  );
}

export default App;