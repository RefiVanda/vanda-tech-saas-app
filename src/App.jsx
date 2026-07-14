import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Import dari folder pages 
import Login from './pages/Login';
import SuperAdmin from './pages/SuperAdmin';
import ClientAdmin from './pages/ClientAdmin';
import MobileApp from './pages/MobileApp';
import FormRekrutmen from './pages/FormRekrutmen';

// ==============================================================
// TAMBAHAN: Komponen Penjaga Rute Khusus Mobile
// ==============================================================
function MobileProtectedRoute({ children }) {
  // Cek apakah user sudah memiliki sesi (sudah login)
  const session = localStorage.getItem('vest_user_session');
  
  // Jika BELUM LOGIN, arahkan ke login dan berikan parameter ?mode=mobile
  if (!session) {
    return <Navigate to="/login?mode=mobile" replace />;
  }
  
  // Jika SUDAH LOGIN, izinkan masuk ke komponen MobileApp
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default route sekarang diarahkan ke halaman Login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Rute Login */}
        <Route path="/login" element={<Login />} />
        
        {/* Rute ke Modul Admin */}
        <Route path="/superadmin" element={<SuperAdmin />} />
        <Route path="/admin" element={<ClientAdmin />} />
        
        {/* ========================================================= */}
        {/* PERUBAHAN: Rute Mobile Sekarang Dibungkus Penjaga         */}
        {/* ========================================================= */}
        <Route 
          path="/mobile" 
          element={
            <MobileProtectedRoute>
              <MobileApp />
            </MobileProtectedRoute>
          } 
        />

        {/* Rute ke form recruitment */}
        <Route path="/recruitment" element={<FormRekrutmen />} />

      </Routes>
    </BrowserRouter>
  );
}