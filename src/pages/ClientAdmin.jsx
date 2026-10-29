import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Users, Wallet, Briefcase, Settings, MessageSquare, 
  UserCircle, LogOut, Clock, Building, Shield, CheckCircle2, 
  FileText, CalendarClock, UserPlus, Database, ClipboardCheck, 
  Receipt, CreditCard, TrendingUp, TrendingDown, MapPin, 
  Plus, Search, Filter, RefreshCw, ChevronRight, ChevronDown, 
  ChevronUp, Camera, Upload, Key, X, Check, ShieldAlert, 
  FolderTree, Send, Download, Trash2, Edit3, Eye, Sparkles,
  LayoutGrid, ArrowLeft, Bell
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

// ============================================================================
// KONFIGURASI STRUKTUR MODUL & SUB-MENU (ARSITEKTUR DINAMIS SUPABASE)
// ============================================================================
const CORE_MODULES = [
  {
    id: 'hrd',
    title: 'Menu HRD',
    subtitle: 'Personalia, Presensi, Shift & Rekrutmen',
    icon: Users,
    accent: 'blue',
    bgGrad: 'from-blue-600 to-indigo-700',
    lightBg: 'bg-blue-50 text-blue-600 border-blue-200',
    ringColor: 'ring-blue-500',
    subTabs: [
      { id: 'absensi', label: 'Data Presensi', icon: CheckCircle2 },
      { id: 'shift', label: 'Manajemen Shift', icon: CalendarClock },
      { id: 'database', label: 'Database Karyawan', icon: Database },
      { id: 'recruitment', label: 'Rekrutmen & QR', icon: UserPlus },
      { id: 'approval_hrd', label: 'Approval Cuti & Koreksi', icon: ClipboardCheck }
    ]
  },
  {
    id: 'finance',
    title: 'Menu Finance',
    subtitle: 'Arus Kas, Payroll, Invoice & Reimburse',
    icon: Wallet,
    accent: 'emerald',
    bgGrad: 'from-emerald-600 to-teal-700',
    lightBg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    ringColor: 'ring-emerald-500',
    subTabs: [
      { id: 'cashflow', label: 'Buku Arus Kas', icon: Wallet },
      { id: 'payroll', label: 'Penggajian (Payroll)', icon: CreditCard },
      { id: 'invoice', label: 'Tagihan & Invoice', icon: Receipt },
      { id: 'reimburse', label: 'Approval Reimburse', icon: ClipboardCheck }
    ]
  },
  {
    id: 'operational',
    title: 'Menu Operational',
    subtitle: 'Pusat Pelaporan Pekerjaan & Tugas Lapangan',
    icon: Briefcase,
    accent: 'amber',
    bgGrad: 'from-amber-500 to-orange-600',
    lightBg: 'bg-amber-50 text-amber-700 border-amber-200',
    ringColor: 'ring-amber-500',
    subTabs: [
      { id: 'laporan_utama', label: 'Laporan Patroli & Reguler', icon: ShieldAlert },
      { id: 'laporan_custom', label: 'Laporan Form Custom', icon: FileText },
      { id: 'task_management', label: 'Delegasi & Laporan Tugas', icon: ClipboardCheck }
    ]
  },
  {
    id: 'settings',
    title: 'Pengaturan Sistem',
    subtitle: 'Otoritas Role, Akses, Geo-GPS & Form Builder',
    icon: Settings,
    accent: 'slate',
    bgGrad: 'from-slate-700 to-slate-900',
    lightBg: 'bg-slate-100 text-slate-700 border-slate-300',
    ringColor: 'ring-slate-700',
    subTabs: [
      { id: 'roles', label: 'Manajemen Role (RBAC)', icon: Shield },
      { id: 'user_access', label: 'Hak Akses Pegawai', icon: Key },
      { id: 'gps_rules', label: 'Cabang & Geo-Fencing GPS', icon: MapPin },
      { id: 'form_builder', label: 'Form Builder Laporan', icon: FolderTree },
      { id: 'company_profile', label: 'Profil & Logo Perusahaan', icon: Building }
    ]
  },
  {
    id: 'communication',
    title: 'Menu Komunikasi',
    subtitle: 'Broadcast Instruksi Kerja & Informasi Resmi',
    icon: MessageSquare,
    accent: 'purple',
    bgGrad: 'from-purple-600 to-fuchsia-700',
    lightBg: 'bg-purple-50 text-purple-600 border-purple-200',
    ringColor: 'ring-purple-500',
    subTabs: [
      { id: 'feed_komunikasi', label: 'Papan Informasi & Instruksi', icon: MessageSquare },
      { id: 'buat_pesan', label: 'Kirim Instruksi / Broadcast', icon: Send }
    ]
  }
];

export default function ClientAdmin() {
  const navigate = useNavigate();

  // ==========================================================================
  // 1. STATE IDENTITAS AKUN & TENANT PERUSAHAAN (KOTAK INFORMASI ATAS)
  // ==========================================================================
  const [currentUser, setCurrentUser] = useState({
    id: null,
    client_id: null,
    nik: '-',
    name: 'Memuat Akun...',
    role: 'Checking...',
    division: '-',
    location: 'Pusat',
    avatar_initials: 'U',
    avatar_url: null,
    avatar_path: null,
    permissions: {},
    features: {}
  });

  const [companyInfo, setCompanyInfo] = useState({
    name: 'Memuat Perusahaan...',
    short: 'ADM',
    logo_url: null,
    status: 'ACTIVE'
  });

  const [currentTime, setCurrentTime] = useState(new Date());

  // ==========================================================================
  // 2. STATE NAVIGASI KOTAK MENU & WORKSPACE
  // ==========================================================================
  const [activeModule, setActiveModule] = useState('operational'); // Default buka Operational / bisa diset null
  const [activeSubTab, setActiveSubTab] = useState('laporan_utama');
  const [isMenuGridCompact, setIsMenuGridCompact] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // ==========================================================================
  // 3. STATE DATA MODUL (TERINTEGRASI SUPABASE - SIAP ROMBAK TABEL)
  // ==========================================================================
  const [dbStats, setDbStats] = useState({
    hrd: { totalEmployees: 0, presentToday: 0, pendingApprovals: 0 },
    finance: { balance: 0, monthIncome: 0, monthExpense: 0, unpaidInvoices: 0 },
    operational: { totalReports: 0, patrolReports: 0, customReports: 0, activeTasks: 0 },
    settings: { totalRoles: 0, totalLocations: 0, totalCustomForms: 0 },
    communication: { totalBroadcasts: 0 }
  });

  // State Data Koleksi dari Supabase
  const [employees, setEmployees] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [cashflows, setCashflows] = useState([]);
  const [payrolls, setPayrolls] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [reimbursements, setReimbursements] = useState([]);
  const [fieldReports, setFieldReports] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [companyRoles, setCompanyRoles] = useState([]);
  const [officeLocations, setOfficeLocations] = useState([]);
  const [customMenus, setCustomMenus] = useState([]);
  const [instructions, setInstructions] = useState([]);

  // State Filter Global di Workspace
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterCategory, setFilterCategory] = useState('Semua');
  const [expandedRowId, setExpandedRowId] = useState(null);

  // State Modal Profil Akun & Kamera
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({ password: '', file: null, avatar_url: '', avatar_path: '' });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Jam Digital Real-time
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // ==========================================================================
  // 4. ENGINE SINKRONISASI SUPABASE (MULTI-TENANT & SESSION HANDLER)
  // ==========================================================================
  const fetchWorkspaceData = useCallback(async (sessionUser) => {
    setIsLoadingData(true);
    try {
      const targetId = sessionUser?.id || currentUser.id;
      if (!targetId) return;

      // Deteksi apakah ID berupa UUID atau NIK Karyawan
      const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId);
      
      let profileQuery = supabase
        .from('employees')
        .select('*, clients(id, name, status, features, logo_url)');

      const { data: myProfile, error: profileErr } = isValidUUID
        ? await profileQuery.eq('id', targetId).maybeSingle()
        : await profileQuery.eq('nik_karyawan', sessionUser?.nik || targetId).maybeSingle();

      if (profileErr) console.warn('Peringatan ambil profil:', profileErr.message);

      if (myProfile) {
        // Proteksi Status Langganan Perusahaan (SaaS)
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
          location: myProfile.lokasi_penempatan || 'Kantor Pusat',
          avatar_initials: initials,
          avatar_url: myProfile.avatar_url || pd.avatar_url || sessionUser?.avatar_url || null,
          avatar_path: pd.avatar_path || sessionUser?.avatar_path || null,
          permissions: myProfile.permissions || {},
          features: myProfile.clients?.features || {}
        });

        if (myProfile.clients) {
          const cName = myProfile.clients.name || 'Perusahaan';
          const shortCode = cName
            .replace(/^(PT|CV|UD|Tbk)\.?\s+/i, '')
            .split(' ')
            .map(w => w[0])
            .join('')
            .toUpperCase()
            .substring(0, 3) || 'ENT';

          setCompanyInfo({
            id: myProfile.clients.id,
            name: cName,
            short: shortCode,
            logo_url: myProfile.clients.logo_url || null,
            status: myProfile.clients.status || 'ACTIVE'
          });
        }

        // Helper Query Multi-Tenant (Siap disesuaikan saat Anda merombak tabel)
        const tenantId = myProfile.client_id;
        const isSuper = myProfile.role === 'Super Admin' || myProfile.role === 'Developer';

        const tenantQuery = (table, selectStr = '*') => {
          let q = supabase.from(table).select(selectStr);
          if (!isSuper && tenantId) q = q.eq('client_id', tenantId);
          return q;
        };

        // Penarikan Data Paralel agar Cepat & Efisien
        const [
          empRes, attRes, shiftRes, candRes, leaveRes,
          cfRes, payRes, invRes, rmRes,
          repRes, taskRes,
          roleRes, locRes, cmRes, instRes
        ] = await Promise.all([
          tenantQuery('employees').order('created_at', { ascending: false }),
          tenantQuery('attendances', '*, employees(nama_lengkap, nik_karyawan, bidang_jasa)').order('date', { ascending: false }).limit(100),
          tenantQuery('employee_shifts', '*, employees(nama_lengkap, nik_karyawan)').order('date', { ascending: false }).limit(100),
          tenantQuery('candidates').order('created_at', { ascending: false }),
          tenantQuery('leave_requests', '*, employees(nama_lengkap)').order('created_at', { ascending: false }),
          tenantQuery('cashflows').order('created_at', { ascending: false }),
          tenantQuery('payrolls').order('created_at', { ascending: false }),
          tenantQuery('invoices').order('created_at', { ascending: false }),
          tenantQuery('reimbursements', '*, employees(nama_lengkap)').order('created_at', { ascending: false }),
          tenantQuery('field_reports', '*, employees(nama_lengkap, posisi_jabatan)').order('created_at', { ascending: false }),
          tenantQuery('tasks').order('created_at', { ascending: false }),
          tenantQuery('company_roles').order('name', { ascending: true }),
          tenantQuery('office_locations'),
          tenantQuery('custom_menus').order('created_at', { ascending: false }),
          tenantQuery('instructions', '*, employees!sender_id(nama_lengkap, posisi_jabatan)').order('created_at', { ascending: false })
        ]);

        const empList = empRes.data || [];
        const attList = attRes.data || [];
        const leaveList = leaveRes.data || [];
        const cfList = cfRes.data || [];
        const invList = invRes.data || [];
        const repList = repRes.data || [];
        const taskList = taskRes.data || [];
        const roleList = roleRes.data || [];
        const locList = locRes.data || [];
        const cmList = cmRes.data || [];
        const instList = instRes.data || [];

        setEmployees(empList);
        setAttendances(attList);
        setShifts(shiftRes.data || []);
        setCandidates(candRes.data || []);
        setLeaveRequests(leaveList);
        setCashflows(cfList);
        setPayrolls(payRes.data || []);
        setInvoices(invList);
        setReimbursements(rmRes.data || []);
        setFieldReports(repList);
        setTasks(taskList);
        setCompanyRoles(roleList);
        setOfficeLocations(locList);
        setCustomMenus(cmList);
        setInstructions(instList);

        // Kalkulasi Ringkasan Metrik untuk Indikator Kotak Menu
        const todayStr = new Date().toISOString().split('T')[0];
        const currentMonthStr = todayStr.substring(0, 7);

        const totalIncome = cfList.filter(c => c.type === 'INCOME').reduce((s, c) => s + Number(c.amount || 0), 0);
        const totalExpense = cfList.filter(c => c.type === 'EXPENSE').reduce((s, c) => s + Number(c.amount || 0), 0);
        const mIncome = cfList.filter(c => c.type === 'INCOME' && (c.date || '').startsWith(currentMonthStr)).reduce((s, c) => s + Number(c.amount || 0), 0);
        const mExpense = cfList.filter(c => c.type === 'EXPENSE' && (c.date || '').startsWith(currentMonthStr)).reduce((s, c) => s + Number(c.amount || 0), 0);

        setDbStats({
          hrd: {
            totalEmployees: empList.filter(e => e.status_pegawai !== 'NONAKTIF').length,
            presentToday: attList.filter(a => a.date === todayStr).length,
            pendingApprovals: leaveList.filter(l => l.status === 'PENDING').length
          },
          finance: {
            balance: totalIncome - totalExpense,
            monthIncome: mIncome,
            monthExpense: mExpense,
            unpaidInvoices: invList.filter(i => i.status === 'UNPAID').length
          },
          operational: {
            totalReports: repList.length,
            patrolReports: repList.filter(r => r.report_type === 'patroli' || r.report_type === 'reguler').length,
            customReports: repList.filter(r => r.report_type !== 'patroli' && r.report_type !== 'reguler').length,
            activeTasks: taskList.filter(t => t.status !== 'done').length
          },
          settings: {
            totalRoles: roleList.length,
            totalLocations: locList.length,
            totalCustomForms: cmList.length
          },
          communication: {
            totalBroadcasts: instList.length
          }
        });
      }
    } catch (err) {
      console.error('Gagal menyinkronkan data Supabase:', err);
    } finally {
      setIsLoadingData(false);
    }
  }, [currentUser.id, navigate]);

  useEffect(() => {
    const rawSession = localStorage.getItem('vest_user_session');
    if (!rawSession) {
      navigate('/');
      return;
    }
    const parsed = JSON.parse(rawSession);
    const safeName = parsed.name || 'User';
    const initials = safeName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    setCurrentUser(prev => ({
      ...prev,
      id: parsed.id,
      nik: parsed.nik || '-',
      name: safeName,
      role: parsed.role || 'User',
      avatar_initials: initials,
      avatar_url: parsed.avatar_url || null,
      avatar_path: parsed.avatar_path || null
    }));

    fetchWorkspaceData(parsed);
  }, [navigate, fetchWorkspaceData]);

  // ==========================================================================
  // 5. HELPER & HANDLER FUNGSI UMUM
  // ==========================================================================
  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(Number(val) || 0);
  };

  const handleSelectMainModule = (moduleId) => {
    const targetMod = CORE_MODULES.find(m => m.id === moduleId);
    setActiveModule(moduleId);
    if (targetMod && targetMod.subTabs.length > 0) {
      setActiveSubTab(targetMod.subTabs[0].id);
    }
    setSearchQuery('');
    setFilterDate('');
    setFilterCategory('Semua');
    setExpandedRowId(null);
  };

  const handleLogout = () => {
    if (window.confirm('Keluar dari sesi sistem sekarang?')) {
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
      alert('Tidak dapat mengakses kamera: ' + err.message);
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
        const { error: upErr } = await supabase.storage.from('avatars').upload(filePath, profileForm.file);
        if (upErr) throw upErr;
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

  // Helper Render Badge Ringkasan untuk Masing-masing Kotak Menu
  const renderModuleSummaryBadge = (modId) => {
    switch (modId) {
      case 'hrd':
        return (
          <div className="flex items-center gap-2 text-[11px] font-bold">
            <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-100">
              {dbStats.hrd.totalEmployees} Pegawai
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
              {dbStats.hrd.presentToday} Hadir
            </span>
          </div>
        );
      case 'finance':
        return (
          <div className="flex items-center gap-2 text-[11px] font-bold">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 truncate max-w-[160px]">
              Kas: {formatRupiah(dbStats.finance.balance)}
            </span>
          </div>
        );
      case 'operational':
        return (
          <div className="flex items-center gap-2 text-[11px] font-bold">
            <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
              {dbStats.operational.totalReports} Laporan Masuk
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-orange-50 text-orange-700 border border-orange-200">
              {dbStats.operational.activeTasks} Tugas Aktif
            </span>
          </div>
        );
      case 'settings':
        return (
          <div className="flex items-center gap-2 text-[11px] font-bold">
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
              {dbStats.settings.totalRoles} Role
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
              {dbStats.settings.totalLocations} Titik GPS
            </span>
          </div>
        );
      case 'communication':
        return (
          <div className="flex items-center gap-2 text-[11px] font-bold">
            <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-100">
              {dbStats.communication.totalBroadcasts} Pesan Siaran
            </span>
          </div>
        );
      default:
        return null;
    }
  };

  const currentModuleObj = CORE_MODULES.find(m => m.id === activeModule);

  return (
    <div className="min-h-screen bg-slate-100/80 text-slate-800 font-sans pb-16">
      {/* CONTAINER UTAMA */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">

        {/* ==================================================================== */}
        {/* BAGIAN 1: KOTAK INFORMASI AKUN & PERUSAHAAN (DI ATAS)                 */}
        {/* ==================================================================== */}
        <section className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden transition-all">
          {/* Top Bar Identitas Perusahaan / Tenant */}
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
                <span className="text-[10px] bg-blue-500/20 border border-blue-400/30 text-blue-300 px-2 py-0.5 rounded-full font-extrabold uppercase tracking-widest">
                  Enterprise Portal
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-300 font-medium">
              <div className="hidden sm:flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-lg border border-white/10">
                <Clock size={13} className="text-blue-400" />
                <span>
                  {currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' })}
                  {' • '}
                  {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                </span>
              </div>
              <button
                onClick={() => fetchWorkspaceData()}
                title="Sinkronkan Data Supabase"
                className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded-lg transition-colors font-semibold text-xs"
              >
                <RefreshCw size={13} className={isLoadingData ? 'animate-spin text-blue-300' : ''} />
                <span className="hidden md:inline">{isLoadingData ? 'Sinkronisasi...' : 'Refresh Data'}</span>
              </button>
            </div>
          </div>

          {/* Body Kotak Informasi Akun Pengguna */}
          <div className="p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            {/* Kiri: Avatar & Profil Lengkap User */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 w-full lg:w-auto">
              <div className="relative group shrink-0">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-black text-2xl shadow-md overflow-hidden border-2 border-white ring-2 ring-slate-100">
                  {currentUser.avatar_url ? (
                    <img src={currentUser.avatar_url} alt={currentUser.name} className="w-full h-full object-cover" />
                  ) : (
                    currentUser.avatar_initials
                  )}
                </div>
                <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" title="Sesi Aktif"></span>
              </div>

              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                    {currentUser.name}
                  </h1>
                  <span className="px-3 py-0.5 rounded-full text-xs font-extrabold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                    <Shield size={12} /> {currentUser.role}
                  </span>
                </div>

                {/* Grid Meta Informasi Akun */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1.5 pt-1 text-xs">
                  <div>
                    <span className="text-slate-400 font-bold uppercase text-[10px] block">NIK Sistem</span>
                    <span className="font-bold text-slate-700">{currentUser.nik}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold uppercase text-[10px] block">Divisi / Unit</span>
                    <span className="font-bold text-slate-700">{currentUser.division}</span>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <span className="text-slate-400 font-bold uppercase text-[10px] block">Lokasi Penempatan</span>
                    <span className="font-bold text-slate-700 flex items-center gap-1">
                      <MapPin size={12} className="text-blue-500 shrink-0" /> {currentUser.location}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Kanan: Aksi Cepat Akun */}
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100">
              <button
                onClick={() => setIsMenuGridCompact(!isMenuGridCompact)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-2 transition-colors"
              >
                <LayoutGrid size={15} />
                {isMenuGridCompact ? 'Perbesar Kotak Menu' : 'Ringkas Kotak Menu'}
              </button>

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
                className="px-4 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 text-xs font-bold flex items-center gap-2 transition-colors"
              >
                <UserCircle size={16} /> Pengaturan Akun
              </button>

              <button
                onClick={handleLogout}
                className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/80 text-xs font-bold flex items-center gap-2 transition-colors"
              >
                <LogOut size={16} /> Keluar
              </button>
            </div>
          </div>
        </section>

        {/* ==================================================================== */}
        {/* BAGIAN 2: KOTAK-KOTAK MENU UTAMA (5 MODUL INTI DI BAWAH KOTAK AKUN)  */}
        {/* ==================================================================== */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <LayoutGrid size={14} className="text-blue-600" />
              Navigasi Modul Utama (Pilih Kotak Menu)
            </h2>
            <span className="text-[11px] font-semibold text-slate-400">
              Klik kotak di bawah untuk membuka ruang kerja modul
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {CORE_MODULES.map((mod) => {
              const IconComponent = mod.icon;
              const isSelected = activeModule === mod.id;

              return (
                <button
                  key={mod.id}
                  onClick={() => handleSelectMainModule(mod.id)}
                  className={`group text-left rounded-3xl transition-all duration-200 relative overflow-hidden flex flex-col justify-between border ${
                    isMenuGridCompact ? 'p-4' : 'p-5'
                  } ${
                    isSelected
                      ? `bg-white border-transparent ring-2 ${mod.ringColor} shadow-lg -translate-y-0.5`
                      : 'bg-white/90 hover:bg-white border-slate-200/90 hover:border-slate-300 shadow-sm hover:shadow-md'
                  }`}
                >
                  {/* Top Bar Accent Indicator */}
                  <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${mod.bgGrad} ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'} transition-opacity`} />

                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${mod.bgGrad} text-white flex items-center justify-center shadow-md shrink-0 group-hover:scale-105 transition-transform`}>
                        <IconComponent size={22} />
                      </div>
                      <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                        isSelected ? mod.lightBg : 'bg-slate-50 text-slate-400 border-slate-200'
                      }`}>
                        {isSelected ? 'Aktif' : 'Buka'}
                      </span>
                    </div>

                    <h3 className="font-black text-base text-slate-800 group-hover:text-blue-600 transition-colors">
                      {mod.title}
                    </h3>

                    {!isMenuGridCompact && (
                      <p className="text-xs text-slate-500 font-medium mt-1 line-clamp-2 leading-relaxed">
                        {mod.subtitle}
                      </p>
                    )}
                  </div>

                  {!isMenuGridCompact && (
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      {renderModuleSummaryBadge(mod.id)}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* ==================================================================== */}
        {/* BAGIAN 3: RUANG KERJA DINAMIS SESUAI KOTAK MENU YANG DIPILIH          */}
        {/* ==================================================================== */}
        {currentModuleObj && (
          <section className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden animate-in fade-in duration-200">
            
            {/* Header Modul & Navigasi Sub-Menu */}
            <div className="border-b border-slate-200 bg-slate-50/70 p-5 sm:p-6 space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${currentModuleObj.bgGrad} text-white flex items-center justify-center shadow-sm shrink-0`}>
                    <currentModuleObj.icon size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-black text-slate-800">{currentModuleObj.title}</h2>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                        Supabase Connected
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">{currentModuleObj.subtitle}</p>
                  </div>
                </div>

                {/* Filter Pencarian Cepat Global Modul */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="relative flex-1 sm:w-64">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari data di modul ini..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-blue-500"
                    />
                  </div>
                  <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 outline-none focus:border-blue-500"
                  />
                  {(searchQuery || filterDate) && (
                    <button
                      onClick={() => { setSearchQuery(''); setFilterDate(''); }}
                      className="px-3 py-2 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-100"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>

              {/* Baris Sub-Tab Modul */}
              <div className="flex overflow-x-auto hide-scrollbar gap-2 pt-1">
                {currentModuleObj.subTabs.map((tab) => {
                  const SubIcon = tab.icon;
                  const isSubActive = activeSubTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => { setActiveSubTab(tab.id); setExpandedRowId(null); }}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                        isSubActive
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                      }`}
                    >
                      <SubIcon size={15} className={isSubActive ? 'text-blue-400' : 'text-slate-400'} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ================================================================ */}
            {/* ISI RUANG KERJA: 1. MENU OPERATIONAL (SEMUA PELAPORAN PEKERJAAN) */}
            {/* ================================================================ */}
            {activeModule === 'operational' && (
              <div className="p-6 space-y-6">
                {/* Ringkasan Cepat Pelaporan Pekerjaan */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80">
                    <span className="text-[10px] font-black uppercase text-amber-700">Total Laporan Masuk</span>
                    <p className="text-2xl font-black text-slate-800 mt-1">{dbStats.operational.totalReports}</p>
                    <span className="text-[11px] text-amber-700 font-medium">Semua kategori pekerjaan</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80">
                    <span className="text-[10px] font-black uppercase text-blue-700">Patroli & Reguler</span>
                    <p className="text-2xl font-black text-slate-800 mt-1">{dbStats.operational.patrolReports}</p>
                    <span className="text-[11px] text-blue-700 font-medium">Laporan rutin lapangan</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/80">
                    <span className="text-[10px] font-black uppercase text-indigo-700">Laporan Form Custom</span>
                    <p className="text-2xl font-black text-slate-800 mt-1">{dbStats.operational.customReports}</p>
                    <span className="text-[11px] text-indigo-700 font-medium">Dari menu dinamis</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80">
                    <span className="text-[10px] font-black uppercase text-emerald-700">Penugasan (Task) Aktif</span>
                    <p className="text-2xl font-black text-slate-800 mt-1">{dbStats.operational.activeTasks}</p>
                    <span className="text-[11px] text-emerald-700 font-medium">Delegasi pekerjaan</span>
                  </div>
                </div>

                {/* SUB-TAB 1: LAPORAN PATROLI & REGULER */}
                {activeSubTab === 'laporan_utama' && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500">Filter Tipe:</span>
                        {['Semua', 'patroli', 'reguler'].map(tipe => (
                          <button
                            key={tipe}
                            onClick={() => setFilterCategory(tipe)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize border ${
                              filterCategory === tipe
                                ? 'bg-amber-500 text-white border-amber-500'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            {tipe}
                          </button>
                        ))}
                      </div>
                      <button className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2">
                        <Download size={14} /> Export Laporan Pekerjaan
                      </button>
                    </div>

                    <div className="border border-slate-200 rounded-2xl overflow-hidden">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                          <tr>
                            <th className="px-6 py-4">Waktu Pelaporan</th>
                            <th className="px-6 py-4">Personil Pelapor</th>
                            <th className="px-6 py-4">Kategori</th>
                            <th className="px-6 py-4">Judul & Ringkasan Pekerjaan</th>
                            <th className="px-6 py-4 text-center">Rincian</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                          {fieldReports
                            .filter(r => r.report_type === 'patroli' || r.report_type === 'reguler')
                            .filter(r => filterCategory === 'Semua' || r.report_type === filterCategory)
                            .filter(r => !searchQuery || (r.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || (r.employees?.nama_lengkap || '').toLowerCase().includes(searchQuery.toLowerCase()))
                            .filter(r => !filterDate || (r.created_at || '').startsWith(filterDate))
                            .map((rep) => {
                              const isExpanded = expandedRowId === rep.id;
                              let parsedDesc = null;
                              try { parsedDesc = JSON.parse(rep.description); } catch {}

                              return (
                                <tr key={rep.id} className="hover:bg-slate-50/80">
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="font-bold text-slate-700 block text-xs">
                                      {new Date(rep.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </span>
                                    <span className="text-[11px] text-slate-400 font-semibold">
                                      {new Date(rep.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                                    </span>
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className="font-bold text-slate-800 block">{rep.employees?.nama_lengkap || 'Personil'}</span>
                                    <span className="text-[11px] text-slate-400">{rep.employees?.posisi_jabatan || 'Staff Lapangan'}</span>
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase ${
                                      rep.report_type === 'patroli' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                                    }`}>
                                      {rep.report_type}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4">
                                    <p className="font-bold text-slate-800">{rep.title}</p>
                                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                                      {parsedDesc?.notes || rep.description || '-'}
                                    </p>
                                    {isExpanded && (
                                      <div className="mt-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                                        <p className="font-bold text-slate-700">Catatan Lengkap:</p>
                                        <p className="text-slate-600 leading-relaxed">{parsedDesc?.notes || rep.description}</p>
                                        {parsedDesc?.photos?.length > 0 && (
                                          <div className="flex flex-wrap gap-2 pt-2">
                                            {parsedDesc.photos.map((p, idx) => (
                                              <a key={idx} href={p.url} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-blue-600 hover:underline flex items-center gap-1">
                                                <Camera size={13} /> Foto Dokumentasi {idx + 1}
                                              </a>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                    <button
                                      onClick={() => setExpandedRowId(isExpanded ? null : rep.id)}
                                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600"
                                    >
                                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          {fieldReports.filter(r => r.report_type === 'patroli' || r.report_type === 'reguler').length === 0 && (
                            <tr>
                              <td colSpan="5" className="text-center py-12 text-slate-400 font-bold">
                                Belum ada data laporan pekerjaan patroli/reguler.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* SUB-TAB 2: LAPORAN FORM CUSTOM DINAMIS */}
                {activeSubTab === 'laporan_custom' && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500">Pilih Kategori Form:</span>
                        <select
                          value={filterCategory}
                          onChange={(e) => setFilterCategory(e.target.value)}
                          className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
                        >
                          <option value="Semua">Semua Form Custom</option>
                          {customMenus.map(cm => (
                            <option key={cm.id} value={cm.menu_name}>{cm.menu_name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="border border-slate-200 rounded-2xl overflow-hidden">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                          <tr>
                            <th className="px-6 py-4">Tanggal</th>
                            <th className="px-6 py-4">Pelapor</th>
                            <th className="px-6 py-4">Nama Form Custom</th>
                            <th className="px-6 py-4">Judul Laporan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                          {fieldReports
                            .filter(r => r.report_type !== 'patroli' && r.report_type !== 'reguler')
                            .filter(r => filterCategory === 'Semua' || r.report_type === filterCategory)
                            .map(rep => (
                              <tr key={rep.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 text-xs font-bold text-slate-600">
                                  {new Date(rep.created_at).toLocaleString('id-ID')}
                                </td>
                                <td className="px-6 py-4 font-bold text-slate-800">
                                  {rep.employees?.nama_lengkap || 'Unknown'}
                                </td>
                                <td className="px-6 py-4">
                                  <span className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 text-xs font-bold">
                                    {rep.report_type}
                                  </span>
                                </td>
                                <td className="px-6 py-4 font-semibold text-slate-700">{rep.title}</td>
                              </tr>
                            ))}
                          {fieldReports.filter(r => r.report_type !== 'patroli' && r.report_type !== 'reguler').length === 0 && (
                            <tr>
                              <td colSpan="4" className="text-center py-12 text-slate-400 font-bold">
                                Belum ada laporan dari menu form custom.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* SUB-TAB 3: DELEGASI & PELAPORAN TUGAS (TASK MANAGEMENT) */}
                {activeSubTab === 'task_management' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-slate-800 text-sm">Daftar Penugasan & Pelaporan Pekerjaan</h3>
                      <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm">
                        <Plus size={15} /> Buat Penugasan Baru
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {tasks.map(task => (
                        <div key={task.id} className="p-5 rounded-2xl border border-slate-200 hover:border-blue-300 bg-white shadow-sm flex flex-col justify-between gap-3">
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase bg-blue-50 text-blue-700">
                                Status: {task.status}
                              </span>
                              <span className="text-[11px] font-bold text-slate-400">
                                Prioritas: {task.priority}
                              </span>
                            </div>
                            <h4 className="font-black text-slate-800 text-base">{task.title}</h4>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{task.description}</p>
                          </div>
                          <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                            <span className="text-slate-500 font-medium">Batas Waktu:</span>
                            <span className="font-bold text-slate-700">{task.due_date || '-'}</span>
                          </div>
                        </div>
                      ))}
                      {tasks.length === 0 && (
                        <div className="col-span-2 text-center py-12 text-slate-400 font-bold border border-dashed border-slate-200 rounded-2xl">
                          Belum ada penugasan kerja aktif.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ================================================================ */}
            {/* ISI RUANG KERJA: 2. MENU HRD                                     */}
            {/* ================================================================ */}
            {activeModule === 'hrd' && (
              <div className="p-6 space-y-6">
                {activeSubTab === 'absensi' && (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase">
                        <tr>
                          <th className="px-6 py-4">Tanggal</th>
                          <th className="px-6 py-4">Nama Personil</th>
                          <th className="px-6 py-4">Lokasi GPS</th>
                          <th className="px-6 py-4">Jam Masuk / Pulang</th>
                          <th className="px-6 py-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {attendances
                          .filter(a => !searchQuery || (a.employees?.nama_lengkap || '').toLowerCase().includes(searchQuery.toLowerCase()))
                          .filter(a => !filterDate || a.date === filterDate)
                          .map(att => (
                            <tr key={att.id} className="hover:bg-slate-50">
                              <td className="px-6 py-4 font-bold text-slate-700">{att.date}</td>
                              <td className="px-6 py-4 font-bold text-slate-800">{att.employees?.nama_lengkap || '-'}</td>
                              <td className="px-6 py-4 text-xs text-slate-500">{att.location_gps || '-'}</td>
                              <td className="px-6 py-4 text-xs font-bold">
                                <span className="text-emerald-600">IN: {att.check_in_time?.substring(0, 5) || '--:--'}</span>
                                {' • '}
                                <span className="text-rose-600">OUT: {att.check_out_time?.substring(0, 5) || '--:--'}</span>
                              </td>
                              <td className="px-6 py-4">
                                <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase bg-emerald-50 text-emerald-700">
                                  {att.status || 'HADIR'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        {attendances.length === 0 && (
                          <tr><td colSpan="5" className="text-center py-12 text-slate-400 font-bold">Belum ada data presensi.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeSubTab === 'database' && (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase">
                        <tr>
                          <th className="px-6 py-4">NIK</th>
                          <th className="px-6 py-4">Nama Lengkap</th>
                          <th className="px-6 py-4">Divisi & Jabatan</th>
                          <th className="px-6 py-4">Penempatan</th>
                          <th className="px-6 py-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {employees
                          .filter(e => !searchQuery || (e.nama_lengkap || '').toLowerCase().includes(searchQuery.toLowerCase()) || (e.nik_karyawan || '').toLowerCase().includes(searchQuery.toLowerCase()))
                          .map(emp => (
                            <tr key={emp.id} className="hover:bg-slate-50">
                              <td className="px-6 py-4 font-bold text-xs text-slate-500">{emp.nik_karyawan}</td>
                              <td className="px-6 py-4 font-bold text-slate-800">{emp.nama_lengkap}</td>
                              <td className="px-6 py-4 text-xs">
                                <span className="font-bold text-slate-700 block">{emp.posisi_jabatan || '-'}</span>
                                <span className="text-slate-400">{emp.bidang_jasa || '-'}</span>
                              </td>
                              <td className="px-6 py-4 text-xs font-semibold text-slate-600">{emp.lokasi_penempatan || 'Pusat'}</td>
                              <td className="px-6 py-4">
                                <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase ${
                                  emp.status_pegawai === 'NONAKTIF' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-700'
                                }`}>
                                  {emp.status_pegawai || 'AKTIF'}
                                </span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeSubTab === 'shift' && (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase">
                        <tr>
                          <th className="px-6 py-4">Tanggal</th>
                          <th className="px-6 py-4">Karyawan</th>
                          <th className="px-6 py-4">Tipe Shift</th>
                          <th className="px-6 py-4">Jam Kerja</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {shifts.map(s => (
                          <tr key={s.id} className="hover:bg-slate-50">
                            <td className="px-6 py-4 font-bold text-slate-700">{s.date}</td>
                            <td className="px-6 py-4 font-bold text-slate-800">{s.employees?.nama_lengkap || '-'}</td>
                            <td className="px-6 py-4"><span className="px-2.5 py-1 rounded bg-indigo-50 text-indigo-700 text-xs font-bold">{s.shift_type}</span></td>
                            <td className="px-6 py-4 text-xs font-bold text-slate-600">{s.time_in || 'OFF'} - {s.time_out || 'OFF'}</td>
                          </tr>
                        ))}
                        {shifts.length === 0 && (
                          <tr><td colSpan="4" className="text-center py-12 text-slate-400 font-bold">Belum ada jadwal shift terdaftar.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeSubTab === 'recruitment' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-2xl text-white flex flex-col items-center text-center justify-center space-y-4">
                      <h4 className="font-black text-lg">QR Portal Rekrutmen</h4>
                      <p className="text-xs text-blue-100">Bagikan kode QR ini kepada pelamar untuk pengisian biodata mandiri.</p>
                      <div className="bg-white p-3 rounded-xl">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(window.location.origin + '/recruitment?cid=' + currentUser.client_id)}`}
                          alt="QR Recruitment"
                          className="w-32 h-32"
                        />
                      </div>
                    </div>
                    <div className="md:col-span-2 border border-slate-200 rounded-2xl overflow-hidden">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase">
                          <tr>
                            <th className="px-6 py-4">Nama Pelamar</th>
                            <th className="px-6 py-4">Posisi Dilamar</th>
                            <th className="px-6 py-4">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                          {candidates.map(c => (
                            <tr key={c.id} className="hover:bg-slate-50">
                              <td className="px-6 py-4 font-bold text-slate-800">{c.nama_lengkap}</td>
                              <td className="px-6 py-4 text-xs text-slate-600">{c.posisi_jabatan} ({c.bidang_jasa})</td>
                              <td className="px-6 py-4"><span className="px-2.5 py-1 rounded bg-amber-50 text-amber-700 text-xs font-bold">{c.status}</span></td>
                            </tr>
                          ))}
                          {candidates.length === 0 && (
                            <tr><td colSpan="3" className="text-center py-12 text-slate-400 font-bold">Belum ada data pelamar baru.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activeSubTab === 'approval_hrd' && (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase">
                        <tr>
                          <th className="px-6 py-4">Pemohon</th>
                          <th className="px-6 py-4">Jenis & Kategori</th>
                          <th className="px-6 py-4">Rentang Tanggal</th>
                          <th className="px-6 py-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {leaveRequests.map(req => (
                          <tr key={req.id} className="hover:bg-slate-50">
                            <td className="px-6 py-4 font-bold text-slate-800">{req.employees?.nama_lengkap || '-'}</td>
                            <td className="px-6 py-4 text-xs font-bold text-slate-700">{req.request_type} - {req.category}</td>
                            <td className="px-6 py-4 text-xs text-slate-500">{req.start_date} s/d {req.end_date}</td>
                            <td className="px-6 py-4">
                              <span className="px-2.5 py-1 rounded text-[10px] font-black uppercase bg-amber-50 text-amber-700">
                                {req.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {leaveRequests.length === 0 && (
                          <tr><td colSpan="4" className="text-center py-12 text-slate-400 font-bold">Tidak ada antrean pengajuan cuti/izin.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ================================================================ */}
            {/* ISI RUANG KERJA: 3. MENU FINANCE                                 */}
            {/* ================================================================ */}
            {activeModule === 'finance' && (
              <div className="p-6 space-y-6">
                {/* Ringkasan Finansial */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-5 rounded-2xl bg-slate-900 text-white">
                    <span className="text-[10px] font-black uppercase text-slate-400">Saldo Kas Aktif</span>
                    <p className="text-2xl font-black text-emerald-400 mt-1">{formatRupiah(dbStats.finance.balance)}</p>
                  </div>
                  <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200">
                    <span className="text-[10px] font-black uppercase text-emerald-700">Pemasukan Bulan Ini</span>
                    <p className="text-2xl font-black text-slate-800 mt-1">{formatRupiah(dbStats.finance.monthIncome)}</p>
                  </div>
                  <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200">
                    <span className="text-[10px] font-black uppercase text-rose-700">Pengeluaran Bulan Ini</span>
                    <p className="text-2xl font-black text-slate-800 mt-1">{formatRupiah(dbStats.finance.monthExpense)}</p>
                  </div>
                </div>

                {activeSubTab === 'cashflow' && (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase">
                        <tr>
                          <th className="px-6 py-4">Tanggal</th>
                          <th className="px-6 py-4">Kategori & Deskripsi</th>
                          <th className="px-6 py-4">Tipe</th>
                          <th className="px-6 py-4">Nominal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {cashflows.map(cf => (
                          <tr key={cf.id} className="hover:bg-slate-50">
                            <td className="px-6 py-4 font-bold text-slate-700 text-xs">{cf.date}</td>
                            <td className="px-6 py-4">
                              <span className="font-bold text-slate-800 block text-xs">{cf.category}</span>
                              <span className="text-xs text-slate-500">{cf.description}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase ${
                                cf.type === 'INCOME' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                              }`}>
                                {cf.type}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-black text-slate-800">{formatRupiah(cf.amount)}</td>
                          </tr>
                        ))}
                        {cashflows.length === 0 && (
                          <tr><td colSpan="4" className="text-center py-12 text-slate-400 font-bold">Belum ada catatan arus kas.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeSubTab === 'payroll' && (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase">
                        <tr>
                          <th className="px-6 py-4">Periode</th>
                          <th className="px-6 py-4">Gaji Pokok</th>
                          <th className="px-6 py-4">Pajak PPh21</th>
                          <th className="px-6 py-4">Gaji Bersih (THP)</th>
                          <th className="px-6 py-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {payrolls.map(p => (
                          <tr key={p.id} className="hover:bg-slate-50">
                            <td className="px-6 py-4 font-bold text-slate-700">{p.period}</td>
                            <td className="px-6 py-4 font-semibold">{formatRupiah(p.basic_salary)}</td>
                            <td className="px-6 py-4 text-rose-600 font-semibold">{formatRupiah(p.tax_pph21)}</td>
                            <td className="px-6 py-4 font-black text-emerald-600">{formatRupiah(p.net_salary)}</td>
                            <td className="px-6 py-4"><span className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 text-xs font-bold">{p.status}</span></td>
                          </tr>
                        ))}
                        {payrolls.length === 0 && (
                          <tr><td colSpan="5" className="text-center py-12 text-slate-400 font-bold">Belum ada data payroll pada periode ini.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeSubTab === 'invoice' && (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase">
                        <tr>
                          <th className="px-6 py-4">No. Invoice</th>
                          <th className="px-6 py-4">Klien</th>
                          <th className="px-6 py-4">Jatuh Tempo</th>
                          <th className="px-6 py-4">Total Tagihan</th>
                          <th className="px-6 py-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {invoices.map(inv => (
                          <tr key={inv.id} className="hover:bg-slate-50">
                            <td className="px-6 py-4 font-black text-slate-800">{inv.invoice_number}</td>
                            <td className="px-6 py-4 font-bold text-slate-700">{inv.client_name}</td>
                            <td className="px-6 py-4 text-xs text-rose-600 font-bold">{inv.due_date}</td>
                            <td className="px-6 py-4 font-black text-slate-800">{formatRupiah(inv.total)}</td>
                            <td className="px-6 py-4"><span className="px-2.5 py-1 rounded bg-amber-50 text-amber-700 text-xs font-bold">{inv.status}</span></td>
                          </tr>
                        ))}
                        {invoices.length === 0 && (
                          <tr><td colSpan="5" className="text-center py-12 text-slate-400 font-bold">Belum ada tagihan invoice.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeSubTab === 'reimburse' && (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase">
                        <tr>
                          <th className="px-6 py-4">Pemohon</th>
                          <th className="px-6 py-4">Kategori & Keterangan</th>
                          <th className="px-6 py-4">Nominal</th>
                          <th className="px-6 py-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {reimbursements.map(rm => (
                          <tr key={rm.id} className="hover:bg-slate-50">
                            <td className="px-6 py-4 font-bold text-slate-800">{rm.employees?.nama_lengkap || '-'}</td>
                            <td className="px-6 py-4 text-xs">
                              <span className="font-bold text-slate-700 block">{rm.category}</span>
                              <span className="text-slate-500">{rm.description}</span>
                            </td>
                            <td className="px-6 py-4 font-black text-slate-800">{formatRupiah(rm.amount)}</td>
                            <td className="px-6 py-4"><span className="px-2.5 py-1 rounded bg-amber-50 text-amber-700 text-xs font-bold">{rm.status}</span></td>
                          </tr>
                        ))}
                        {reimbursements.length === 0 && (
                          <tr><td colSpan="4" className="text-center py-12 text-slate-400 font-bold">Belum ada klaim reimbursement.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ================================================================ */}
            {/* ISI RUANG KERJA: 4. MENU PENGATURAN SISTEM                       */}
            {/* ================================================================ */}
            {activeModule === 'settings' && (
              <div className="p-6 space-y-6">
                {activeSubTab === 'roles' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {companyRoles.map(role => (
                      <div key={role.id} className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-2">
                        <span className="text-[10px] font-black uppercase text-indigo-600 flex items-center gap-1">
                          <Key size={12} /> Custom Role
                        </span>
                        <h4 className="font-black text-slate-800 text-base">{role.name}</h4>
                        <p className="text-xs text-slate-500">{role.description || 'Otoritas jabatan kustom.'}</p>
                      </div>
                    ))}
                    {companyRoles.length === 0 && (
                      <div className="col-span-3 text-center py-12 text-slate-400 font-bold border border-dashed border-slate-200 rounded-2xl">
                        Belum ada role kustom yang dikonfigurasi.
                      </div>
                    )}
                  </div>
                )}

                {activeSubTab === 'gps_rules' && (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase">
                        <tr>
                          <th className="px-6 py-4">Nama Titik Lokasi</th>
                          <th className="px-6 py-4">Koordinat (Lat, Lng)</th>
                          <th className="px-6 py-4">Radius Toleransi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {officeLocations.map(loc => (
                          <tr key={loc.id} className="hover:bg-slate-50">
                            <td className="px-6 py-4 font-bold text-slate-800">{loc.name}</td>
                            <td className="px-6 py-4 font-mono text-xs text-slate-500">{loc.latitude}, {loc.longitude}</td>
                            <td className="px-6 py-4 font-black text-emerald-600">{loc.radius} Meter</td>
                          </tr>
                        ))}
                        {officeLocations.length === 0 && (
                          <tr><td colSpan="3" className="text-center py-12 text-slate-400 font-bold">Belum ada titik koordinat GPS terdaftar.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeSubTab === 'form_builder' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {customMenus.map(menu => (
                      <div key={menu.id} className="p-5 rounded-2xl border border-slate-200 bg-white flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm">{menu.menu_name}</h4>
                          <p className="text-xs text-slate-400">{menu.fields?.length || 0} Komponen Input</p>
                        </div>
                        <FileText size={20} className="text-blue-600" />
                      </div>
                    ))}
                    {customMenus.length === 0 && (
                      <div className="col-span-3 text-center py-12 text-slate-400 font-bold border border-dashed border-slate-200 rounded-2xl">
                        Belum ada form laporan dinamis.
                      </div>
                    )}
                  </div>
                )}

                {(activeSubTab === 'user_access' || activeSubTab === 'company_profile') && (
                  <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
                    <Settings size={32} className="mx-auto text-slate-400" />
                    <h4 className="font-bold text-slate-800">Panel Konfigurasi Siap Dihubungkan</h4>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Komponen ini telah dipersiapkan untuk langsung membaca struktur tabel otoritas dan parameter sistem baru Anda di Supabase.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ================================================================ */}
            {/* ISI RUANG KERJA: 5. MENU KOMUNIKASI                              */}
            {/* ================================================================ */}
            {activeModule === 'communication' && (
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {instructions.map(inst => (
                    <div key={inst.id} className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase bg-purple-50 text-purple-700">
                          {inst.broadcast_type || 'Instruksi'}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          Target: {inst.target_type} ({inst.target_val})
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{inst.content}</p>
                      <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-[11px] text-slate-400 font-semibold">
                        <span>Oleh: {inst.employees?.nama_lengkap || 'Admin'}</span>
                        <span>{new Date(inst.created_at).toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                  ))}
                  {instructions.length === 0 && (
                    <div className="col-span-2 text-center py-12 text-slate-400 font-bold border border-dashed border-slate-200 rounded-2xl">
                      Belum ada siaran informasi atau instruksi kerja.
                    </div>
                  )}
                </div>
              </div>
            )}

          </section>
        )}
      </div>

      {/* ==================================================================== */}
      {/* MODAL PENGATURAN AKUN (FOTO PROFIL LIVE KAMERA / GALERI & PASSWORD)  */}
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
                        <Camera size={14} /> Ambil Foto
                      </button>
                      <button type="button" onClick={stopCamera} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold">
                        Batal
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button type="button" onClick={startCamera} className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5">
                        <Camera size={14} /> Kamera
                      </button>
                      <label className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                        <Upload size={14} /> Galeri
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
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5">
                    Password Baru (Opsional)
                  </label>
                  <input
                    type="password"
                    placeholder="Kosongkan jika tidak mengubah password..."
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
                    <Check size={16} /> {isUpdatingProfile ? 'Menyimpan...' : 'Simpan Profil'}
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