import { useState } from 'react';
import { Building2, KeyRound, Eye, EyeOff, IdCard, LogIn } from 'lucide-react';

export default function Login() {
  const [nik, setNik] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Simulasi data klien (Diatur dari Super Admin)
  const clientData = {
    companyName: "PT Klien Nusantara",
    brandColor: "bg-blue-600",
    buttonHover: "hover:bg-blue-700",
    ringFocus: "focus:ring-blue-600"
  };

  const handleLogin = (e) => {
    e.preventDefault();
    console.log("Login Attempt:", { nik, password });
    // Logika fetch API login di sini
  };

  return (
    // Background utama yang menengahkan konten
    <div className="min-h-screen flex items-center justify-center bg-slate-200 font-sans p-4 md:p-8">
      
      {/* Container Card Melengkung di Tengah (Rounded Medium) */}
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden">
        
        {/* ========================================================= */}
        {/* 1. SISI DESKTOP (KIRI): Branding SaaS V.E.S.T             */}
        {/* ========================================================= */}
        <div className="hidden md:flex md:w-1/2 bg-slate-950 p-12 flex-col justify-between relative overflow-hidden">
          {/* Dekorasi Background Abstract */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-600/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3"></div>

          <div className="relative z-10">
            <h1 className="text-4xl font-black text-white tracking-tight">V.E.S.T</h1>
            <p className="text-sm text-slate-400 font-medium tracking-widest mt-1">VANDA ERP SYSTEM TECH</p>
          </div>

          <div className="relative z-10">
            <h2 className="text-3xl font-bold text-white mb-4 leading-tight">
              Sistem Tata Kelola<br />Operasional & Hierarki Tugas.
            </h2>
            <p className="text-slate-400 max-w-md">
              Platform SaaS terintegrasi untuk manajemen HRIS, pengawasan lapangan, dan kontrol operasional multi-level.
            </p>
          </div>

          <div className="relative z-10 text-xs text-slate-500">
            &copy; 2026 V.E.S.T Core Systems. All rights reserved.
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2. SISI MOBILE & FORM (KANAN)                             */}
        {/* ========================================================= */}
        <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-8 sm:p-12 relative bg-white">
          
          <div className="w-full max-w-md space-y-8">
            
            {/* Header Identitas Klien */}
            <div className="text-center md:text-left flex flex-col items-center md:items-start">
              <div className={`w-20 h-20 ${clientData.brandColor} rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20 mb-6`}>
                <Building2 size={36} className="text-white" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">
                Selamat Datang
              </h2>
              <p className="text-slate-500 text-sm mt-2">
                Masuk ke portal internal <span className="font-bold text-slate-700">{clientData.companyName}</span>
              </p>
            </div>

            {/* Form Login */}
            <form onSubmit={handleLogin} className="space-y-6 mt-8">
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">NIK Perusahaan</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                    <IdCard size={20} />
                  </div>
                  <input
                    type="number"
                    value={nik}
                    onChange={(e) => setNik(e.target.value)}
                    className={`w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:bg-white transition-all ${clientData.ringFocus} focus:border-transparent`}
                    placeholder="Masukkan Nomor Induk Karyawan"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Kata Sandi</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                    <KeyRound size={20} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:bg-white transition-all ${clientData.ringFocus} focus:border-transparent`}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="pt-2 space-y-6">
                <div className="flex justify-end">
                  <button type="button" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                    Lupa kata sandi?
                  </button>
                </div>

                <button
                  type="submit"
                  className={`w-full flex justify-center items-center gap-2 ${clientData.brandColor} ${clientData.buttonHover} text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98]`}
                >
                  Masuk <LogIn size={18} />
                </button>
              </div>

            </form>

            {/* Footer Mobile (Tampil hanya di layar kecil) */}
            <div className="md:hidden pt-8 text-center">
               <p className="text-[11px] text-slate-400 font-medium">POWERED BY V.E.S.T</p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}