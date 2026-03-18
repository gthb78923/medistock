import { Routes, Route, Navigate } from 'react-router-dom'
import RutaProtegida from './components/RutaProtegida'
import Landing from './pages/Landing'
import Login from './pages/auth/Login'
import Registro from './pages/auth/Registro'
import DashboardAdmin from './pages/admin/DashboardAdmin'
import DashboardDoctor from './pages/doctor/DashboardDoctor'
import DashboardPaciente from './pages/paciente/DashboardPaciente'
import Insumos from './pages/admin/Insumos'
import Usuarios from './pages/admin/Usuarios'
import Logs from './pages/admin/Logs'
import Expedientes from './pages/doctor/Expedientes'
import InsumosDoctor from './pages/doctor/InsumosDoctor'
import Citas from './pages/paciente/Citas'
import Agenda from './pages/doctor/Agenda'
import NotFound from './pages/NotFound'
import Pacientes from './pages/doctor/Pacientes'
import MFA from './pages/MFA'               // ← NUEVA RUTA AGREGADA
import ValidarMFA from './pages/auth/ValidarMFA'  // ← NUEVA RUTA AGREGADA

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />
      <Route path="/auth/mfa" element={<ValidarMFA />} />  {/* ← NUEVA RUTA AGREGADA */}
      <Route path="/configurar-mfa" element={<MFA />} />   {/* ← NUEVA RUTA AGREGADA */}

      {/* Admin */}
      <Route path="/admin" element={<RutaProtegida rolesPermitidos={['admin']}><DashboardAdmin /></RutaProtegida>} />
      <Route path="/admin/insumos" element={<RutaProtegida rolesPermitidos={['admin']}><Insumos /></RutaProtegida>} />
      <Route path="/admin/usuarios" element={<RutaProtegida rolesPermitidos={['admin']}><Usuarios /></RutaProtegida>} />
      <Route path="/admin/logs" element={<RutaProtegida rolesPermitidos={['admin']}><Logs /></RutaProtegida>} />
      <Route path="/admin/expedientes" element={<RutaProtegida rolesPermitidos={['admin']}><Expedientes /></RutaProtegida>} />

      {/* Doctor */}
      <Route path="/doctor" element={<RutaProtegida rolesPermitidos={['doctor']}><DashboardDoctor /></RutaProtegida>} />
      <Route path="/doctor/expedientes" element={<RutaProtegida rolesPermitidos={['doctor', 'admin']}><Expedientes /></RutaProtegida>} />
      <Route path="/doctor/insumos" element={<RutaProtegida rolesPermitidos={['doctor']}><InsumosDoctor /></RutaProtegida>} />
      <Route path="/doctor/agenda" element={<RutaProtegida rolesPermitidos={['doctor']}><Agenda /></RutaProtegida>} />
      <Route path="/doctor/pacientes" element={<RutaProtegida rolesPermitidos={['doctor']}><Pacientes /></RutaProtegida>} />

      {/* Paciente */}
      <Route path="/paciente" element={<RutaProtegida rolesPermitidos={['paciente']}><DashboardPaciente /></RutaProtegida>} />
      <Route path="/paciente/citas" element={<RutaProtegida rolesPermitidos={['paciente']}><Citas /></RutaProtegida>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App