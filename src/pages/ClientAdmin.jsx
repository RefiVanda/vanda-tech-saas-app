import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Users, Wallet, Briefcase, Settings, MessageSquare, 
  UserCircle, LogOut, Clock, MapPin, Shield, ArrowLeft, 
  RefreshCw, Camera, Upload, Key, X, Check, LayoutGrid, 
  Sparkles, ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

// ============================================================================
// DAFTAR KONFIGURASI 5 KOTAK MENU UTAMA
// ============================================================================
const MAIN_MENUS = [
  {
    id: 'hrd',
    title: 'Menu HRD',
    description: 'Kelola database karyawan, presensi, jadwal shift, dan rekrutmen.',
    icon: Users,
    gradient: 'from-blue-600 to-indigo-700',
    badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
    hoverBorder: 'hover:border-blue-400'
  },
  {
    id: 'finance',
    title: 'Menu Finance',
    description: 'Kelola buku arus kas, penggajian (payroll), tagihan invoice, dan reimburse.',
    icon: Wallet,
    gradient: 'from-emerald-600 to-teal-700',
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    hoverBorder: 'hover:border-emerald-400'
  },
  {
    id: 'operational',
    title: 'Menu Operational',
    description: 'Pusat semua pelaporan pekerjaan lapangan, patroli, form custom, dan tugas.',
    icon: Briefcase,
    gradient: 'from-amber-500 to-orange-600',
    badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
    hoverBorder: 'hover:border-amber-400'
  },
  {
    id: 'settings',
    title: 'Menu Pengaturan Sistem',
    description: 'Konfigurasi jabatan (RBAC), hak akses user, titik GPS cabang, dan form builder.',
    icon: Settings,
    gradient: 'from-slate-700 to-slate-900',
    badgeBg: 'bg-slate-100 text-slate-700 border-slate-300',
    hoverBorder: 'hover:border-slate-500'
  },
  {
    id: 'communication',
    title: 'Menu Komunikasi',
    description: 'Pusat siaran informasi resmi perusahaan dan instruksi kerja personil.',
    icon: MessageSquare,
    gradient: 'from-purple-600 to-fuchsia-700',
    badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
    hoverBorder: 'hover:border-purple-400'
  }
];

export default function ClientAdmin() {
  const navigate = useNavigate();

  // ==========================================================================
  // [A] STATE & HANDLER GLOBAL: AKUN, PERUSAHAAN & NAVIGASI UTAMA
  // ==========================================================================
  
  // activeMenu bernilai `null` di awal agar user wajib klik kotak menu dulu
  const [activeMenu, setActiveMenu] = useState(null); 
  const [isLoadingAccount, setIsLoadingAccount] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // State Kotak Informasi Akun (Terhubung ke Supabase)
  const [currentUser, setCurrentUser] = useState({
    id: null,
    client_id: null,
    nik: '-',
    name: 'Memuat Akun...',
    role: '-',
    division: '-',
    location: '-',
    avatar_initials: 'U',
    avatar_url: null,
    avatar_path: null,
    permissions: {},
    features: {}
  });

  // State Identitas Perusahaan / Tenant (Tabel `clients`)
  const [companyInfo, setCompanyInfo] = useState({
    id: null,
    name: 'Memuat Perusahaan...',
    short: 'ENT',
    logo_url: null,
    status: 'ACTIVE'
  });

  // State Modal Edit Profil & Kamera Akun
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({ password: '', file: null, avatar_url: '', avatar_path: '' });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Jam Digital Real-Time
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Fungsi Penarikan Data Akun & Perusahaan dari Supabase
  const fetchAccountAndCompany = useCallback(async (sessionUser) => {
    setIsLoadingAccount(true);
    try {
      const targetId = sessionUser?.id || currentUser.id;
      if (!targetId) return;

      const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId);
      
      let query = supabase
        .from('employees')
        .select('*, clients(id, name, status, features, logo_url)');

      const { data: myProfile, error } = isValidUUID
        ? await query.eq('id', targetId).maybeSingle()
        : await query.eq('nik_karyawan', sessionUser?.nik || targetId).maybeSingle();

      if (error) throw error;

      if (myProfile) {
        if (myProfile.clients?.status === 'SUSPENDED') {
          alert('Layanan perusahaan sedang ditangguhkan (SUSPENDED). Hubungi administrator.');
          localStorage.removeItem('vest_user_session');
          navigate('/');
          return;
        }

        const pd = typeof myProfile.personal_data === 'string'
          ? JSON.parse(myProfile.personal_data || '{}')
          : (myProfile.personal_data || {});

        const fullName = myProfile.nama_lengkap || sessionUser?.name || 'User';
        const initials = fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

        setCurrentUser({
          id: myProfile.id,
          client_id: myProfile.client_id,
          nik: myProfile.nik_karyawan || '-',
          name: fullName,
          role: myProfile.role || 'Admin',
          division: myProfile.bidang_jasa || 'Manajemen',
          location: myProfile.lokasi_penempatan || 'Pusat',
          avatar_initials: initials,
          avatar_url: myProfile.avatar_url || pd.avatar_url || sessionUser?.avatar_url || null,
          avatar_path: pd.avatar_path || sessionUser?.avatar_path || null,
          permissions: myProfile.permissions || {},
          features: myProfile.clients?.features || {}
        });

        if (myProfile.clients) {
          const cName = myProfile.clients.name || 'Perusahaan';
          const shortName = cName
            .replace(/^(PT|CV|UD|Tbk)\.?\s+/i, '')
            .split(' ')
            .map(w => w[0])
            .join('')
            .toUpperCase()
            .substring(0, 3) || 'ENT';

          setCompanyInfo({
            id: myProfile.clients.id,
            name: cName,
            short: shortName,
            logo_url: myProfile.clients.logo_url || null,
            status: myProfile.clients.status || 'ACTIVE'
          });
        }
      }
    } catch (err) {
      console.error('Gagal memuat profil akun:', err.message);
    } finally {
      setIsLoadingAccount(false);
    }
  }, [currentUser.id, navigate]);

  // Cek Sesi Login Saat Halaman Dimuat
  useEffect(() => {
    const rawSession = localStorage.getItem('vest_user_session');
    if (!rawSession) {
      navigate('/');
      return;
    }
    const parsedSession = JSON.parse(rawSession);
    const safeName = parsedSession.name || 'User';
    const initials = safeName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    setCurrentUser(prev => ({
      ...prev,
      id: parsedSession.id,
      nik: parsedSession.nik || '-',
      name: safeName,
      role: parsedSession.role || 'User',
      avatar_initials: initials,
      avatar_url: parsedSession.avatar_url || null,
      avatar_path: parsedSession.avatar_path || null
    }));

    fetchAccountAndCompany(parsedSession);
  }, [navigate, fetchAccountAndCompany]);

  // Handler Buka & Tutup Halaman Menu
  const handleOpenMenu = (menuId) => {
    setActiveMenu(menuId);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Panggil fungsi fetch data masing-masing modul saat kotaknya diklik
    if (menuId === 'hrd') handleInitHrdMenu();
    if (menuId === 'finance') handleInitFinanceMenu();
    if (menuId === 'operational') handleInitOperationalMenu();
    if (menuId === 'settings') handleInitSettingsMenu();
    if (menuId === 'communication') handleInitCommunicationMenu();
  };

  const handleBackToMainMenu = () => {
    setActiveMenu(null);
  };

  const handleLogout = () => {
    if (window.confirm('Keluar dari sistem sekarang?')) {
      localStorage.removeItem('vest_user_session');
      navigate('/');
    }
  };

  // Handler Kamera & Update Profil Akun
  const startCamera = async () => {
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 400, height: 400 } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      alert('Gagal mengakses kamera: ' + err.message);
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext('2d').drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `avatar_${Date.now()}.jpeg`, { type: 'image/jpeg' });
          setProfileForm(prev => ({ ...prev, file }));
          stopCamera();
        }
      }, 'image/jpeg', 0.85);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      let newAvatarUrl = profileForm.avatar_url;
      let newAvatarPath = profileForm.avatar_path;

      if (profileForm.file) {
        const ext = profileForm.file.name.split('.').pop();
        const filePath = `avatars/${currentUser.id}_${Date.now()}.${ext}`;
        if (profileForm.avatar_path) {
          await supabase.storage.from('avatars').remove([profileForm.avatar_path]);
        }
        const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, profileForm.file);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
        newAvatarUrl = data.publicUrl;
        newAvatarPath = filePath;
      }

      const payload = {};
      if (profileForm.password.trim() !== '') payload.password = profileForm.password;

      const { data: empData } = await supabase.from('employees').select('personal_data').eq('id', currentUser.id).maybeSingle();
      const existingPD = typeof empData?.personal_data === 'string' ? JSON.parse(empData.personal_data || '{}') : (empData?.personal_data || {});
      payload.personal_data = { ...existingPD, avatar_url: newAvatarUrl, avatar_path: newAvatarPath };

      const { error } = await supabase.from('employees').update(payload).eq('id', currentUser.id);
      if (error) throw error;

      const session = JSON.parse(localStorage.getItem('vest_user_session') || '{}');
      session.avatar_url = newAvatarUrl;
      session.avatar_path = newAvatarPath;
      localStorage.setItem('vest_user_session', JSON.stringify(session));

      setCurrentUser(prev => ({ ...prev, avatar_url: newAvatarUrl, avatar_path: newAvatarPath }));
      setIsProfileModalOpen(false);
      alert('Profil akun berhasil diperbarui!');
    } catch (err) {
      alert('Gagal memperbarui profil: ' + err.message);
    } finally {
      setIsUpdatingProfile(false);
    }
  };


  // ==========================================================================
  // [1] STATE & HANDLER KHUSUS: MENU HRD
  // Tulis semua state, query Supabase, dan fungsi CRUD HRD Anda di blok ini
  // ==========================================================================
  const [hrdState, setHrdState] = useState({
    isLoading: false,
    // Tambahkan state tabel HRD baru Anda di sini nanti
  });

  const handleInitHrdMenu = async () => {
    // Fungsi ini otomatis dipanggil saat kotak "Menu HRD" diklik
    console.log('Membuka Halaman Menu HRD - Siap tarik data dari Supabase untuk client_id:', currentUser.client_id);
  };


  // ==========================================================================
  // [2] STATE & HANDLER KHUSUS: MENU FINANCE
  // Tulis semua state, query Supabase, dan fungsi CRUD Finance Anda di blok ini
  // ==========================================================================
  const [financeState, setFinanceState] = useState({
    isLoading: false,
    // Tambahkan state tabel Finance baru Anda di sini nanti
  });

  const handleInitFinanceMenu = async () => {
    // Fungsi ini otomatis dipanggil saat kotak "Menu Finance" diklik
    console.log('Membuka Halaman Menu Finance - Siap tarik data dari Supabase untuk client_id:', currentUser.client_id);
  };


  // ==========================================================================
  // [3] STATE & HANDLER KHUSUS: MENU OPERATIONAL (PELAPORAN PEKERJAAN)
  // Tulis semua state, query Supabase, dan fungsi Pelaporan Pekerjaan di sini
  // ==========================================================================
  const [operationalState, setOperationalState] = useState({
    isLoading: false,
    // Tambahkan state tabel Pelaporan Pekerjaan baru Anda di sini nanti
  });

  const handleInitOperationalMenu = async () => {
    // Fungsi ini otomatis dipanggil saat kotak "Menu Operational" diklik
    console.log('Membuka Halaman Menu Operational - Siap tarik data pelaporan dari Supabase untuk client_id:', currentUser.client_id);
  };


  // ==========================================================================
  // [4] STATE & HANDLER KHUSUS: MENU PENGATURAN SISTEM
  // Tulis semua state, query Supabase, dan fungsi Pengaturan Sistem di sini
  // ==========================================================================
  const [settingsState, setSettingsState] = useState({
    isLoading: false,
    // Tambahkan state tabel Pengaturan Sistem baru Anda di sini nanti
  });

  const handleInitSettingsMenu = async () => {
    // Fungsi ini otomatis dipanggil saat kotak "Menu Pengaturan Sistem" diklik
    console.log('Membuka Halaman Pengaturan Sistem - Siap tarik konfigurasi dari Supabase untuk client_id:', currentUser.client_id);
  };


  // ==========================================================================
  // [5] STATE & HANDLER KHUSUS: MENU KOMUNIKASI
  // Tulis semua state, query Supabase, dan fungsi Broadcast Komunikasi di sini
  // ==========================================================================
  const [communicationState, setCommunicationState] = useState({
    isLoading: false,
    // Tambahkan state tabel Komunikasi baru Anda di sini nanti
  });

  const handleInitCommunicationMenu = async () => {
    // Fungsi ini otomatis dipanggil saat kotak "Menu Komunikasi" diklik
    console.log('Membuka Halaman Menu Komunikasi - Siap tarik pesan dari Supabase untuk client_id:', currentUser.client_id);
  };


  // Helper untuk mengambil metadata menu yang sedang aktif dibuka
  const activeMenuConfig = MAIN_MENUS.find(m => m.id === activeMenu);


  // ==========================================================================
  // RENDER TAMPILAN UTAMA (JSX)
  // ==========================================================================
  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">

        {/* ==================================================================== */}
        {/* BAGIAN ATAS: KOTAK INFORMASI AKUN & IDENTITAS PERUSAHAAN             */}
        {/* ==================================================================== */}
        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Baris Identitas Perusahaan / Tenant */}
          <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 px-6 py-3.5 text-white flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-black text-xs shadow-inner overflow-hidden shrink-0">
                {companyInfo.logo_url ? (
                  <img src={companyInfo.logo_url} alt="Logo" className="w-full h-full object-cover bg-white" />
                ) : (
                  companyInfo.short
                )}
              </div>
              <div className="flex items-center gap-2.5">
                <span className="font-bold text-sm tracking-wide">{companyInfo.name}</span>
                <span className="text-[10px] bg-blue-500/20 border border-blue-400/30 text-blue-300 px-2.5 py-0.5 rounded-full font-extrabold uppercase tracking-widest">
                  Vanda Tech ERP
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-300 font-medium">
              <div className="hidden sm:flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-lg border border-white/10">
                <Clock size={13} className="text-blue-400" />
                <span>
                  {currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' })}
                  {' • '}
                  {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                </span>
              </div>
              <button
                onClick={() => fetchAccountAndCompany()}
                className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded-lg transition-colors font-semibold text-xs"
              >
                <RefreshCw size={13} className={isLoadingAccount ? 'animate-spin text-blue-300' : ''} />
                <span className="hidden md:inline">{isLoadingAccount ? 'Memuat...' : 'Sinkronkan'}</span>
              </button>
            </div>
          </div>

          {/* Detail Informasi Akun Pengguna */}
          <div className="p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 w-full lg:w-auto">
              {/* Foto / Inisial Akun */}
              <div className="relative shrink-0">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-black text-2xl shadow-md overflow-hidden border-2 border-white ring-2 ring-slate-100">
                  {currentUser.avatar_url ? (
                    <img src={currentUser.avatar_url} alt={currentUser.name} className="w-full h-full object-cover" />
                  ) : (
                    currentUser.avatar_initials
                  )}
                </div>
                <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" title="Online"></span>
              </div>

              {/* Biodata Singkat Akun */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                    {currentUser.name}
                  </h1>
                  <span className="px-3 py-0.5 rounded-full text-xs font-extrabold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                    <Shield size={12} /> {currentUser.role}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1.5 pt-1 text-xs">
                  <div>
                    <span className="text-slate-400 font-bold uppercase text-[10px] block">NIK Sistem</span>
                    <span className="font-bold text-slate-700">{currentUser.nik}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold uppercase text-[10px] block">Divisi / Bidang</span>
                    <span className="font-bold text-slate-700">{currentUser.division}</span>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <span className="text-slate-400 font-bold uppercase text-[10px] block">Penempatan</span>
                    <span className="font-bold text-slate-700 flex items-center gap-1">
                      <MapPin size={12} className="text-blue-500 shrink-0" /> {currentUser.location}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tombol Aksi Akun */}
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100">
              {activeMenu !== null && (
                <button
                  onClick={handleBackToMainMenu}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
                >
                  <LayoutGrid size={15} /> Semua Kotak Menu
                </button>
              )}

              <button
                onClick={() => {
                  setProfileForm({
                    password: '',
                    file: null,
                    avatar_url: currentUser.avatar_url || '',
                    avatar_path: currentUser.avatar_path || ''
                  });
                  setIsProfileModalOpen(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold flex items-center gap-2 transition-colors"
              >
                <UserCircle size={16} /> Pengaturan Akun
              </button>

              <button
                onClick={handleLogout}
                className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold flex items-center gap-2 transition-colors"
              >
                <LogOut size={16} /> Keluar
              </button>
            </div>
          </div>
        </section>


        {/* ==================================================================== */}
        {/* KONDISI 1: TAMPILAN KOTAK-KOTAK MENU UTAMA (SEBELUM MENU DIKLIK)     */}
        {/* ==================================================================== */}
        {activeMenu === null && (
          <section className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between px-1">
              <div>
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <LayoutGrid size={16} className="text-blue-600" />
                  Pilih Menu Operasional Sistem
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Klik salah satu kotak menu di bawah ini untuk masuk ke halaman pengelolaan modul terkait.
                </p>
              </div>
            </div>

            {/* Grid 5 Kotak Menu */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {MAIN_MENUS.map((menu) => {
                const IconComponent = menu.icon;
                return (
                  <button
                    key={menu.id}
                    onClick={() => handleOpenMenu(menu.id)}
                    className={`group bg-white p-6 rounded-3xl border border-slate-200/90 ${menu.hoverBorder} shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 text-left flex flex-col justify-between relative overflow-hidden min-h-[210px]`}
                  >
                    {/* Garis Aksen Atas */}
                    <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${menu.gradient}`} />

                    <div>
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${menu.gradient} text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform`}>
                          <IconComponent size={26} />
                        </div>
                        <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border ${menu.badgeBg} flex items-center gap-1`}>
                          Buka Halaman <ChevronRight size={12} />
                        </span>
                      </div>

                      <h3 className="text-lg font-black text-slate-800 group-hover:text-blue-600 transition-colors">
                        {menu.title}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium mt-1.5 leading-relaxed">
                        {menu.description}
                      </p>
                    </div>

                    <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-400 group-hover:text-slate-700">
                      <span>Klik untuk masuk ke halaman</span>
                      <ChevronRight size={15} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}


        {/* ==================================================================== */}
        {/* KONDISI 2: TAMPILAN HALAMAN MENU SETELAH DIKLIK                      */}
        {/* ==================================================================== */}
        {activeMenu !== null && activeMenuConfig && (
          <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-200">
            
            {/* Header Navigasi Halaman Aktif (Tombol Kembali & Info Halaman) */}
            <div className="px-6 py-5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleBackToMainMenu}
                  className="p-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-sm transition-all flex items-center gap-2 text-xs font-bold shrink-0"
                >
                  <ArrowLeft size={16} /> Kembali ke Menu
                </button>

                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${activeMenuConfig.gradient} text-white flex items-center justify-center shadow-sm shrink-0`}>
                    <activeMenuConfig.icon size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-800 leading-tight">
                      {activeMenuConfig.title}
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      {activeMenuConfig.description}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-xl bg-slate-200/70 text-slate-600 text-[11px] font-extrabold uppercase tracking-wider">
                  Tenant ID: {currentUser.client_id ? 'Terhubung' : 'Global'}
                </span>
              </div>
            </div>


            {/* ================================================================ */}
            {/* [HALAMAN 1] ISI HALAMAN MENU HRD                                 */}
            {/* ================================================================ */}
            {activeMenu === 'hrd' && (
              <div className="p-8 min-h-[420px] flex flex-col items-center justify-center text-center">
                {/* 
                  ==============================================================
                  TANDA KODE: ISI HALAMAN MENU HRD DIMULAI DI SINI
                  Letakkan komponen Tabel Karyawan, Presensi, Shift, & Rekrutmen
                  setelah Anda merombak tabel database HRD di Supabase.
                  ==============================================================
                */}
                <div className="max-w-md space-y-3 p-6 rounded-3xl bg-blue-50/50 border border-dashed border-blue-200">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-sm">
                    <Users size={24} />
                  </div>
                  <h3 className="font-black text-slate-800 text-base">Area Kerja Halaman HRD</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Halaman ini sengaja dikosongkan dan siap dihubungkan dengan struktur tabel HRD baru Anda di Supabase.
                  </p>
                </div>
                {/* === AKHIR ISI HALAMAN MENU HRD === */}
              </div>
            )}


            {/* ================================================================ */}
            {/* [HALAMAN 2] ISI HALAMAN MENU FINANCE                             */}
            {/* ================================================================ */}
            {activeMenu === 'finance' && (
              <div className="p-8 min-h-[420px] flex flex-col items-center justify-center text-center">
                {/* 
                  ==============================================================
                  TANDA KODE: ISI HALAMAN MENU FINANCE DIMULAI DI SINI
                  Letakkan komponen Arus Kas, Payroll, Invoice, & Reimburse
                  setelah Anda merombak tabel database Finance di Supabase.
                  ==============================================================
                */}
                <div className="max-w-md space-y-3 p-6 rounded-3xl bg-emerald-50/50 border border-dashed border-emerald-200">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-sm">
                    <Wallet size={24} />
                  </div>
                  <h3 className="font-black text-slate-800 text-base">Area Kerja Halaman Finance</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Halaman ini sengaja dikosongkan dan siap dihubungkan dengan struktur tabel Finance baru Anda di Supabase.
                  </p>
                </div>
                {/* === AKHIR ISI HALAMAN MENU FINANCE === */}
              </div>
            )}


            {/* ================================================================ */}
            {/* [HALAMAN 3] ISI HALAMAN MENU OPERATIONAL (PELAPORAN PEKERJAAN)   */}
            {/* ================================================================ */}
            {activeMenu === 'operational' && (
              <div className="p-8 min-h-[420px] flex flex-col items-center justify-center text-center">
                {/* 
                  ==============================================================
                  TANDA KODE: ISI HALAMAN MENU OPERATIONAL DIMULAI DI SINI
                  (PUSAT SEMUA PELAPORAN PEKERJAAN)
                  Letakkan semua fitur Laporan Patroli, Laporan Reguler, 
                  Laporan Custom, dan Delegasi Tugas di blok ini.
                  ==============================================================
                */}
                <div className="max-w-md space-y-3 p-6 rounded-3xl bg-amber-50/50 border border-dashed border-amber-200">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center mx-auto shadow-sm">
                    <Briefcase size={24} />
                  </div>
                  <h3 className="font-black text-slate-800 text-base">Area Kerja Halaman Operational (Pelaporan Pekerjaan)</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Halaman ini sengaja dikosongkan dan siap dihubungkan dengan struktur tabel Pelaporan Pekerjaan baru Anda di Supabase.
                  </p>
                </div>
                {/* === AKHIR ISI HALAMAN MENU OPERATIONAL === */}
              </div>
            )}


            {/* ================================================================ */}
            {/* [HALAMAN 4] ISI HALAMAN MENU PENGATURAN SISTEM                   */}
            {/* ================================================================ */}
            {activeMenu === 'settings' && (
              <div className="p-8 min-h-[420px] flex flex-col items-center justify-center text-center">
                {/* 
                  ==============================================================
                  TANDA KODE: ISI HALAMAN MENU PENGATURAN SISTEM DIMULAI DI SINI
                  Letakkan fitur RBAC Role, Hak Akses User, Titik GPS Cabang,
                  dan Form Builder di blok ini.
                  ==============================================================
                */}
                <div className="max-w-md space-y-3 p-6 rounded-3xl bg-slate-100 border border-dashed border-slate-300">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 text-white flex items-center justify-center mx-auto shadow-sm">
                    <Settings size={24} />
                  </div>
                  <h3 className="font-black text-slate-800 text-base">Area Kerja Halaman Pengaturan Sistem</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Halaman ini sengaja dikosongkan dan siap dihubungkan dengan struktur tabel Pengaturan Sistem baru Anda di Supabase.
                  </p>
                </div>
                {/* === AKHIR ISI HALAMAN MENU PENGATURAN SISTEM === */}
              </div>
            )}


            {/* ================================================================ */}
            {/* [HALAMAN 5] ISI HALAMAN MENU KOMUNIKASI                          */}
            {/* ================================================================ */}
            {activeMenu === 'communication' && (
              <div className="p-8 min-h-[420px] flex flex-col items-center justify-center text-center">
                {/* 
                  ==============================================================
                  TANDA KODE: ISI HALAMAN MENU KOMUNIKASI DIMULAI DI SINI
                  Letakkan fitur Pengumuman, Instruksi Kerja, dan Chat/Broadcast
                  di blok ini.
                  ==============================================================
                */}
                <div className="max-w-md space-y-3 p-6 rounded-3xl bg-purple-50/50 border border-dashed border-purple-200">
                  <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center mx-auto shadow-sm">
                    <MessageSquare size={24} />
                  </div>
                  <h3 className="font-black text-slate-800 text-base">Area Kerja Halaman Komunikasi</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Halaman ini sengaja dikosongkan dan siap dihubungkan dengan struktur tabel Komunikasi baru Anda di Supabase.
                  </p>
                </div>
                {/* === AKHIR ISI HALAMAN MENU KOMUNIKASI === */}
              </div>
            )}

          </section>
        )}

      </div>


      {/* ==================================================================== */}
      {/* MODAL PENGATURAN AKUN (TETAP AKTIF UNTUK GANTI FOTO & PASSWORD)      */}
      {/* ==================================================================== */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="h-28 bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4 flex justify-between items-start text-white">
              <h3 className="font-black text-base flex items-center gap-2">
                <UserCircle size={18} /> Pengaturan Akun Saya
              </h3>
              <button
                type="button"
                onClick={() => { stopCamera(); setIsProfileModalOpen(false); }}
                className="p-1.5 rounded-full bg-black/20 hover:bg-black/40"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="px-6 pb-6">
              <div className="flex flex-col items-center -mt-14 mb-5">
                <div className="w-28 h-28 rounded-2xl bg-white border-4 border-white shadow-lg overflow-hidden flex items-center justify-center">
                  {isCameraActive ? (
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover transform -scale-x-100" />
                  ) : profileForm.file ? (
                    <img src={URL.createObjectURL(profileForm.file)} alt="Preview" className="w-full h-full object-cover" />
                  ) : profileForm.avatar_url ? (
                    <img src={profileForm.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <UserCircle size={56} className="text-slate-300" />
                  )}
                </div>

                <div className="mt-4">
                  {isCameraActive ? (
                    <div className="flex gap-2">
                      <button type="button" onClick={capturePhoto} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5">
                        <Camera size={14} /> Jepret Foto
                      </button>
                      <button type="button" onClick={stopCamera} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold">
                        Batal
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button type="button" onClick={startCamera} className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5">
                        <Camera size={14} /> Live Kamera
                      </button>
                      <label className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                        <Upload size={14} /> Pilih Galeri
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => { stopCamera(); setProfileForm({ ...profileForm, file: e.target.files[0] }); }}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5 flex items-center gap-1.5">
                    <Key size={12} /> Password Baru (Opsional)
                  </label>
                  <input
                    type="password"
                    placeholder="Kosongkan jika tidak ingin mengganti password..."
                    value={profileForm.password}
                    onChange={(e) => setProfileForm({ ...profileForm, password: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => { stopCamera(); setIsProfileModalOpen(false); }}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingProfile}
                    className="flex-[2] py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Check size={16} /> {isUpdatingProfile ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}