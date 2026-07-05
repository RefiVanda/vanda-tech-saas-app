import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Import dari folder pages 
import Login from './pages/Login';
import SuperAdmin from './pages/SuperAdmin';
import ClientAdmin from './pages/ClientAdmin';
import MobileApp from './pages/MobileApp';
import FormRekrutmen from './pages/FormRekrutmen';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default route sekarang diarahkan ke halaman Login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Rute Login */}
        <Route path="/login" element={<Login />} />
        
        {/* Rute ke 3 Modul Utama */}
        <Route path="/superadmin" element={<SuperAdmin />} />
        <Route path="/client" element={<ClientAdmin />} />
        <Route path="/mobile" element={<MobileApp />} />

        {/* Rute ke form recruitment */}
        <Route path="/recruitment" element={<FormRekrutmen />} />

      </Routes>
    </BrowserRouter>
  );
}