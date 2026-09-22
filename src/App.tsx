import { Route, Routes } from "react-router-dom"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { LoginPage } from "@/pages/login"
import { RegisterPage } from "@/pages/register"
import { EsqueciSenhaPage } from "@/pages/esqueci-senha"
import { RedefinirSenhaPage } from "@/pages/redefinir-senha"
import { DashboardPage } from "@/pages/dashboard"
import { AgendamentosPage } from "@/pages/agendamentos"
import { ServicosPage } from "@/pages/servicos"
import { ProfissionaisPage } from "@/pages/profissionais"
import { ClientesPage } from "@/pages/clientes"
import { PersonalizacaoPage } from "@/pages/personalizacao"

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/esqueci-senha" element={<EsqueciSenhaPage />} />
      <Route path="/redefinir-senha" element={<RedefinirSenhaPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/agendamentos"
        element={
          <ProtectedRoute>
            <AgendamentosPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/servicos"
        element={
          <ProtectedRoute>
            <ServicosPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profissionais"
        element={
          <ProtectedRoute>
            <ProfissionaisPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/clientes"
        element={
          <ProtectedRoute>
            <ClientesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/personalizacao"
        element={
          <ProtectedRoute>
            <PersonalizacaoPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App
