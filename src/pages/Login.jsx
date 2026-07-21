import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase'; 
import { Building2, KeyRound, Eye, EyeOff, IdCard, LogIn, ShieldQuestion, CheckCircle2, ArrowLeft, Check } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  
  // State Navigasi Halaman Login
  const [viewMode, setViewMode] = useState('login'); // 'login', 'forgot', 'reset'

  // State Form
  const [nik, setNik] = useState('');
  const [password, setPassword] = useState('');
  const [resetKey, setResetKey] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const savedNik = localStorage.getItem('vest_saved_nik');
    if (savedNik) {
      setNik(savedNik);
      setRememberMe(true);
    }
  }, []);

  const clientData = {
    companyName: "PT Klien Nusantara",
    brandColor: "bg-blue-600",
    buttonHover: "hover:bg-blue-700",
    ringFocus: "focus:ring-blue-600"
  };

  const [clientLogo, setClientLogo] = useState(null);
  const [dynamicCompanyName, setDynamicCompanyName] = useState(clientData.companyName);

  // === CCTV PENCARI LOGO OTOMATIS DI LATAR BELAKANG ===
  useEffect(() => {
    const fetchLogo = async () => {
      // Hanya mencari jika NIK sudah diketik minimal 4 huruf
      if (nik.length >= 4) {
        try {
          // Menggunakan .ilike agar otomatis mendeteksi huruf besar maupun kecil
          const { data, error } = await supabase
            .from('employees')
            .select('client_id, clients(name, logo_url)')
            .ilike('nik_karyawan', nik)
            .maybeSingle();

          if (data && data.clients) {
            // PINTAR: Menangani jika Supabase mengembalikan Array maupun Object
            const clientInfo = Array.isArray(data.clients) ? data.clients[0] : data.clients;

            // Memastikan logo dan nama berganti
            if (clientInfo && clientInfo.logo_url) {
              setClientLogo(clientInfo.logo_url);
            } else {
              setClientLogo(null);
            }

            if (clientInfo && clientInfo.name) {
              setDynamicCompanyName(clientInfo.name);
            }
          } else {
            setClientLogo(null);
            setDynamicCompanyName(clientData.companyName);
          }
        } catch (err) {
          setClientLogo(null);
          setDynamicCompanyName(clientData.companyName);
        }
      } else {
        setClientLogo(null);
        setDynamicCompanyName(clientData.companyName);
      }
    };

    // Memberikan jeda 0.5 detik agar database tidak jebol saat user mengetik cepat
    const delaySearch = setTimeout(() => {
      fetchLogo();
    }, 500);

    return () => clearTimeout(delaySearch);
  }, [nik]);
  // ====================================================

  // 1. FUNGSI LOGIN UTAMA
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg(''); setSuccessMsg(''); setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('nik_karyawan', nik) 
        .eq('password', password)
        .single();

      if (error || !data) {
        setErrorMsg('NIK atau Kata Sandi salah atau tidak terdaftar!');
      } else if (data.status_pegawai === 'NONAKTIF') {
        setErrorMsg('Akses ditolak. Akun Anda telah dinonaktifkan oleh HRD.');
      } else {
        const userSession = {
          id: data.id,
          nik: data.nik_karyawan,
          name: data.nama_lengkap || 'User VEST', 
          role: data.role || 'staff',
          division: data.bidang_jasa || '-',
          position: data.posisi_jabatan || '-',
          hasMobileAccess: Boolean(data.has_mobile_access),
          hasTaskAccess: Boolean(data.has_task_access)
        };
        localStorage.setItem('vest_user_session', JSON.stringify(userSession));localStorage.setItem('vest_user_session', JSON.stringify(userSession));
        
        if (rememberMe) {
          localStorage.setItem('vest_saved_nik', nik);
        } else {
          localStorage.removeItem('vest_saved_nik');
        }

        const isExplicitMobile = window.location.pathname.includes('/mobile') || window.location.search.includes('mobile');

        if (isExplicitMobile) {
          // Jika link mendefinisikan mobile, paksa masuk ke mobile app tanpa memandang role
          navigate('/mobile'); 
        } else if (['Super Admin', 'Developer', 'Admin Perusahaan', 'Manager Operasional'].includes(data.role)) {
          // Jika link biasa dan dia punya hak akses admin, lempar ke dashboard admin
          navigate('/admin'); 
        } else {
          // Jika staff biasa, tetap ke mobile app
          navigate('/mobile'); 
        }
      }
    } catch (err) {
      setErrorMsg('Gagal terhubung ke database.');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. FUNGSI MINTA RESET PASSWORD (GENERATE 4-DIGIT KEY)
  const handleRequestReset = async (e) => {
    e.preventDefault();
    setErrorMsg(''); setSuccessMsg(''); setIsLoading(true);

    try {
      const { data, error } = await supabase.from('employees').select('id, nama_lengkap').eq('nik_karyawan', nik).single();
      
      if (error || !data) throw new Error('Pencarian gagal: NIK tidak ditemukan di database kami.');

      const generatedKey = Math.floor(1000 + Math.random() * 9000).toString();
      
      const { error: updateError } = await supabase.from('employees')
        .update({ reset_key: generatedKey, reset_requested: true })
        .eq('id', data.id);

      if (updateError) throw updateError;

      setSuccessMsg(`Permintaan terkirim! Sistem telah memberitahu Admin HRD. Silakan temui/hubungi Admin untuk meminta 4-Digit PIN Anda.`);
      setViewMode('reset'); // Pindah ke layar input PIN
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 3. FUNGSI EKSEKUSI GANTI PASSWORD
  const handleExecuteReset = async (e) => {
    e.preventDefault();
    setErrorMsg(''); setSuccessMsg(''); setIsLoading(true);

    try {
      const { data, error } = await supabase.from('employees')
        .select('id')
        .eq('nik_karyawan', nik)
        .eq('reset_key', resetKey)
        .eq('reset_requested', true)
        .single();
      
      if (error || !data) throw new Error('GAGAL: NIK atau 4-Digit PIN dari Admin tidak cocok/salah.');

      if (newPassword.length < 6) throw new Error('Kata sandi baru minimal 6 karakter.');

      // Update password baru & bersihkan log reset
      const { error: resetError } = await supabase.from('employees')
        .update({ password: newPassword, reset_key: null, reset_requested: false })
        .eq('id', data.id);

      if (resetError) throw resetError;

      alert('Berhasil! Kata sandi Anda telah diubah. Silakan login kembali menggunakan kata sandi yang baru.');
      setViewMode('login');
      setPassword(''); setResetKey(''); setNewPassword('');
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-200 font-sans p-4 md:p-8">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden transition-all duration-500">
        
        {/* SISI DESKTOP (KIRI): Branding V.E.S.T & Logo Hardcode */}
        <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-blue-500 via-blue-700 to-blue-900 p-12 flex-col justify-between relative overflow-hidden">
          {/* Mengurangi opacity pendaran agar background tidak terlalu sibuk */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-300/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-400/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3"></div>

          {/* PERUBAHAN: Penambahan Logo Hardcode di samping teks V.E.S.T */}
          <div className="relative z-10 flex items-center gap-4">
            {/* Ganti src di bawah dengan path gambar logo kamu yang ada di folder public, misal: "/vanda-logo.png" */}
            <img 
              src="../vanda-tech-logo.png" 
              alt="Vanda Tech Logo" 
              className="w-16 h-16 object-contain drop-shadow-lg"
            />
            <div>
              <h1 className="text-4xl font-black text-white tracking-tight">V.E.S.T</h1>
              <p className="text-sm text-white font-medium tracking-widest mt-1">VANDA ERP SYSTEM TECH</p>
            </div>
          </div>

          <div className="relative z-10 mt-8">
            <h2 className="text-3xl font-bold text-white mb-4 leading-tight">
              Sistem Tata Kelola<br />Operasional & Hierarki Tugas.
            </h2>
            <p className="text-white max-w-md">
              Platform SaaS terintegrasi untuk manajemen HRIS, pengawasan lapangan, dan kontrol operasional multi-level.
            </p>
          </div>

          <div className="relative z-10 text-xs text-white">
            &copy; {new Date().getFullYear()} V.E.S.T Core Systems. All rights reserved.
          </div>
        </div>

        {/* SISI FORM (KANAN) */}
        <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-8 sm:p-12 relative bg-white">
          <div className="w-full max-w-md space-y-8 relative">
            
            {/* --- LAYAR 1: LOGIN UTAMA --- */}
            {viewMode === 'login' && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="text-center md:text-left flex flex-col items-center md:items-start">
                  
                  {/* LOGO CLIENT: Akan berubah dari icon gedung ke Logo Client saat NIK diketik */}
                  <div className="flex justify-center md:justify-start mb-6 h-20">
                    {clientLogo ? (
                      <img src={clientLogo} alt="Logo Perusahaan" className="h-full object-contain drop-shadow-md animate-in zoom-in duration-300" />
                    ) : (
                      <div className={`w-20 h-20 ${clientData.brandColor} rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20`}>
                        <Building2 size={36} className="text-white" />
                      </div>
                    )}
                  </div>

                  <h2 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">Selamat Datang</h2>
                  <p className="text-slate-500 text-sm mt-2">Masuk ke portal internal <span className="font-bold text-slate-700">{dynamicCompanyName}</span></p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5 mt-8">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700 ml-1">NIK Sistem / NIK Karyawan</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors"><IdCard size={20} /></div>
                      <input type="text" value={nik} onChange={(e) => setNik(e.target.value)} className={`w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:bg-white transition-all ${clientData.ringFocus} focus:border-transparent`} placeholder="Masukkan NIK" required />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700 ml-1">Kata Sandi</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors"><KeyRound size={20} /></div>
                      <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className={`w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:bg-white transition-all ${clientData.ringFocus} focus:border-transparent`} placeholder="••••••••" required />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600">
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  {errorMsg && <div className="bg-rose-50 text-rose-600 p-3 rounded-xl text-sm font-bold border border-rose-100 text-center animate-pulse">{errorMsg}</div>}
                  {successMsg && <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl text-sm font-bold border border-emerald-100 text-center">{successMsg}</div>}

                  <div className="pt-2 space-y-6">
                      {/* Tata letak sejajar (Ingat Saya di Kiri, Lupa Sandi di Kanan) */}
                      <div className="flex justify-between items-center">
                        <label className="flex items-center gap-2 cursor-pointer group">
                          <div className="relative flex items-center justify-center">
                            <input 
                              type="checkbox" 
                              checked={rememberMe} 
                              onChange={(e) => setRememberMe(e.target.checked)} 
                              className="peer appearance-none w-5 h-5 border-2 border-slate-300 rounded-md checked:bg-blue-600 checked:border-blue-600 transition-all cursor-pointer" 
                            />
                            <Check size={14} className="text-white absolute opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" strokeWidth={3} />
                          </div>
                          <span className="text-sm font-medium text-slate-600 group-hover:text-slate-800 transition-colors">Remember Me</span>
                        </label>
                        
                        <button type="button" onClick={() => {setViewMode('forgot'); setErrorMsg(''); setSuccessMsg('');}} className="text-sm font-semibold text-blue-600 hover:text-blue-700">Lupa sandi?</button>
                      </div>

                      {/* INI TOMBOL MASUK YANG KEMARIN TERHAPUS */}
                      <button type="submit" disabled={isLoading} className={`w-full flex justify-center items-center gap-2 ${clientData.brandColor} ${clientData.buttonHover} text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98] ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}>
                        {isLoading ? 'Memverifikasi Data...' : <>Masuk <LogIn size={18} /></>}
                      </button>
                  </div>
                </form>
              </div>
            )}

            {/* --- LAYAR 2: MINTA RESET PASSWORD --- */}
            {viewMode === 'forgot' && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <button type="button" onClick={() => setViewMode('login')} className="mb-6 flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"><ArrowLeft size={16}/> Kembali ke Login</button>
                <div className="text-left flex flex-col items-start mb-8">
                  <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mb-4"><ShieldQuestion size={32} className="text-amber-600" /></div>
                  <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Lupa Kata Sandi?</h2>
                  <p className="text-slate-500 text-sm mt-2 leading-relaxed">Masukkan NIK Anda di bawah ini. Sistem akan memberitahu Admin HRD agar membuatkan PIN khusus untuk Anda.</p>
                </div>

                <form onSubmit={handleRequestReset} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700 ml-1">NIK Karyawan Anda</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-amber-600 transition-colors"><IdCard size={20} /></div>
                      <input type="text" value={nik} onChange={(e) => setNik(e.target.value)} className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all" placeholder="Masukkan NIK" required />
                    </div>
                  </div>

                  {errorMsg && <div className="bg-rose-50 text-rose-600 p-3 rounded-xl text-sm font-bold border border-rose-100 text-center">{errorMsg}</div>}

                  <div className="pt-4">
                    <button type="submit" disabled={isLoading} className={`w-full flex justify-center items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg active:scale-[0.98] ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}>
                      {isLoading ? 'Memproses...' : 'Kirim Permintaan ke Admin HRD'}
                    </button>
                  </div>
                  <div className="text-center mt-4">
                     <button type="button" onClick={() => setViewMode('reset')} className="text-xs font-bold text-blue-600 hover:underline">Saya sudah punya 4-Digit PIN dari Admin</button>
                  </div>
                </form>
              </div>
            )}

            {/* --- LAYAR 3: EKSEKUSI GANTI PASSWORD --- */}
            {viewMode === 'reset' && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <button type="button" onClick={() => setViewMode('login')} className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"><ArrowLeft size={16}/> Batal</button>
                <div className="text-left flex flex-col items-start mb-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-4"><KeyRound size={32} className="text-blue-600" /></div>
                  <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Buat Sandi Baru</h2>
                  <p className="text-slate-500 text-sm mt-2 leading-relaxed">Masukkan 4-Digit PIN yang Anda dapatkan dari Admin beserta Kata Sandi Baru Anda.</p>
                </div>

                {successMsg && <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl text-xs font-semibold border border-emerald-100 mb-6 leading-relaxed flex items-start gap-2"><CheckCircle2 size={16} className="shrink-0 mt-0.5"/> {successMsg}</div>}

                <form onSubmit={handleExecuteReset} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1 block mb-1">NIK Anda</label>
                    <input type="text" value={nik} onChange={(e) => setNik(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ketik NIK" required />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1 block mb-1">4-Digit PIN dari Admin</label>
                    <input type="number" value={resetKey} onChange={(e) => setResetKey(e.target.value)} className="w-full px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-lg font-black tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="0000" required />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1 block mb-1">Kata Sandi Baru</label>
                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Minimal 6 karakter" required minLength={6} />
                  </div>

                  {errorMsg && <div className="bg-rose-50 text-rose-600 p-3 rounded-xl text-sm font-bold border border-rose-100 text-center">{errorMsg}</div>}

                  <div className="pt-4">
                    <button type="submit" disabled={isLoading} className={`w-full flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg active:scale-[0.98] ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}>
                      {isLoading ? 'Memproses...' : 'Simpan Kata Sandi Baru'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Footer Mobile */}
            <div className="md:hidden pt-8 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                {/* Logo untuk Mobile (Pastikan logonya juga tersedia) */}
                <img src="/vanda-tech-logo.png" alt="Vanda Tech" className="w-10 h-10 object-contain" />
              </div>
              <p className="text-[11px] text-slate-400 font-medium">POWERED BY V.E.S.T</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}