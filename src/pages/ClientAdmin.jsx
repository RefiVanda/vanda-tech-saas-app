import { useState, useEffect, useRef } from 'react';
import { 
  Menu, X, CheckSquare, Wallet, Settings, 
  Users, Bell, Search, FileText, 
  ShieldAlert, Clock, ArrowUpRight, ArrowDownRight,
  ChevronLeft, ChevronRight, UserCircle, LogOut,
  UserPlus, Database, QrCode, Download, CheckCircle2, 
  Trash2, MapPin, LayoutDashboard, Receipt, CreditCard, 
  TrendingUp, TrendingDown, Activity, BarChart3, Building, MessageSquare, Plus, Send
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase'; // Pastikan nama file ini sesuai dengan yang kamu buat

export default function ClientAdmin() {
  const [activeMenu, setActiveMenu] = useState('finance'); // Saya set default ke finance agar kamu bisa langsung lihat
  const [activeTaskLevel, setActiveTaskLevel] = useState('Level 1');
  
  // State Sub-Menu
  const [hrisTab, setHrisTab] = useState('overview'); 
  const [financeTab, setFinanceTab] = useState('overview');

  const navigate = useNavigate();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isProfilePopupOpen, setIsProfilePopupOpen] = useState(false);
  const popupRef = useRef(null);

  // === REAL DATABASE STATE ===
  const [currentUser, setCurrentUser] = useState({ id: '', name: 'Loading...', role: '', division: '', avatar: '' });
  const [candidates, setCandidates] = useState([]);
  const [cashflows, setCashflows] = useState([]);
  const [payrolls, setPayrolls] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    // 1. Cek Sesi Login
    const session = localStorage.getItem('syntegra_user_session');
    if (!session) {
      navigate('/'); // Lempar ke halaman login jika belum login
      return;
    }
    const parsedSession = JSON.parse(session);
    // Buat Avatar (2 Huruf Pertama)
    const initials = parsedSession.name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
    setCurrentUser({ ...parsedSession, avatar: initials });

    // 2. Tarik Semua Data dari Supabase
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      // Fetch HRIS
      const { data: candData } = await supabase.from('candidates').select('*').order('created_at', { ascending: false });
      if (candData) {
        setCandidates(candData.map(c => ({
          ...c,
          hasTaskAccess: c.has_task_access,
          hasMobileAccess: c.has_mobile_access
        })));
      }

      // Fetch Tasks & Comments
      const { data: taskData } = await supabase.from('tasks').select('*, task_comments(*)').order('created_at', { ascending: false });
      if (taskData) {
        setTasks(taskData.map(t => ({
          ...t,
          dueDate: t.due_date,
          assignedTo: t.assigned_to || [],
          assignedBy: t.assigned_by,
          comments: (t.task_comments || []).map(c => ({
            id: c.id,
            userId: c.user_id,
            text: c.text,
            timestamp: new Date(c.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
          }))
        })));
      }

      // Fetch Finance
      const { data: cfData } = await supabase.from('cashflows').select('*').order('created_at', { ascending: false });
      if (cfData) setCashflows(cfData);
      const { data: pyData } = await supabase.from('payrolls').select('*').order('created_at', { ascending: false });
      if (pyData) setPayrolls(pyData);
      const { data: invData } = await supabase.from('invoices').select('*').order('created_at', { ascending: false });
      if (invData) setInvoices(invData);
    } catch (error) {
      console.error("Gagal menarik data:", error);
    }
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (popupRef.current && !popupRef.current.contains(event.target)) setIsProfilePopupOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const clientData = {
    name: "PT Klien Nusantara",
    short: "KN",
    color: "bg-blue-600",
    text: "text-blue-600",
    light: "bg-blue-50"
  };

  const formatRupiah = (angka) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka || 0);

  // === FUNGSI LOGIKA (REAL DATABASE) ===
  const activeEmployees = candidates.filter(c => c.status === 'INTI');
  const employeesWithTaskAccess = activeEmployees.filter(c => c.hasTaskAccess);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [newTask, setNewTask] = useState({ title: '', description: '', assignedTo: [], priority: 'medium', dueDate: '' });
  const [taskSearchQuery, setTaskSearchQuery] = useState('');
  const [newComment, setNewComment] = useState('');

  const formatDateTime = (val) => val ? val.replace('T', ' ').substring(0, 16) : '-';
  const getNowStr = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}T${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; };
  const getUserName = (id) => { if(id === currentUser.id) return currentUser.name; const c = candidates.find(u => u.id === id); return c ? c.nama_lengkap : 'Unknown'; };
  const getAssigneesNames = (assignedToArr) => assignedToArr.map(id => getUserName(id)).join(', ') || 'Belum Ada';
  const getStatusBadgeClass = (status) => {
    const colors = { 'pending': 'bg-slate-100 text-slate-600', 'in-progress': 'bg-blue-100 text-blue-700', 'done': 'bg-emerald-100 text-emerald-700' };
    return `px-2 py-0.5 rounded text-[9px] font-black uppercase shadow-sm ${colors[status] || colors.pending}`;
  };

  // 1. Simpan Task Baru ke Supabase
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if(newTask.assignedTo.length === 0) return alert("Pilih minimal satu penerima instruksi!");
    
    const taskObj = { 
      title: newTask.title, 
      description: newTask.description, 
      priority: newTask.priority,
      due_date: newTask.dueDate,
      assigned_to: newTask.assignedTo, 
      status: 'pending', 
      assigned_by: currentUser.id 
    };

    const { data, error } = await supabase.from('tasks').insert([taskObj]).select();
    if (!error && data) {
      setTasks([{ ...data[0], dueDate: data[0].due_date, assignedTo: data[0].assigned_to, assignedBy: data[0].assigned_by, comments: [] }, ...tasks]);
      setIsTaskModalOpen(false);
      setNewTask({ title: '', description: '', assignedTo: [], priority: 'medium', dueDate: '' });
      alert("Tugas berhasil dikirim ke database!");
    } else {
      alert("Gagal mengirim tugas: " + error.message);
    }
  };

  // 2. Update Status Task di Supabase
  const handleStatusUpdate = async (taskId, newStatus) => {
    const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId);
    if (!error) {
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
      if(selectedTask && selectedTask.id === taskId) setSelectedTask({ ...selectedTask, status: newStatus });
    }
  };

  // 3. Kirim Komentar Chat ke Supabase
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedTask) return;
    
    const commentObj = { task_id: selectedTask.id, user_id: currentUser.id, text: newComment };
    const { data, error } = await supabase.from('task_comments').insert([commentObj]).select();
    
    if (!error && data) {
      const newUIComment = { id: data[0].id, userId: currentUser.id, text: newComment, timestamp: new Date(data[0].created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) };
      const updatedTask = { ...selectedTask, comments: [...selectedTask.comments, newUIComment] };
      setTasks(tasks.map(t => t.id === selectedTask.id ? updatedTask : t));
      setSelectedTask(updatedTask);
      setNewComment('');
    }
  };

  // 4. Update Hak Akses Task di Supabase
  const toggleTaskAccess = async (employeeId) => {
    const emp = candidates.find(c => c.id === employeeId);
    const { error } = await supabase.from('candidates').update({ has_task_access: !emp.hasTaskAccess }).eq('id', employeeId);
    if (!error) {
      setCandidates(candidates.map(c => c.id === employeeId ? { ...c, hasTaskAccess: !c.hasTaskAccess } : c));
    }
  };

  // 5. Update Hak Akses Mobile di Supabase
  const toggleMobileAccess = async (employeeId) => {
    const emp = candidates.find(c => c.id === employeeId);
    const { error } = await supabase.from('candidates').update({ has_mobile_access: !emp.hasMobileAccess }).eq('id', employeeId);
    if (!error) {
      setCandidates(candidates.map(c => c.id === employeeId ? { ...c, hasMobileAccess: !c.hasMobileAccess } : c));
    }
  };

  // 6. Fungsi Log Out Sistem
  const handleLogout = () => {
    localStorage.removeItem('syntegra_user_session');
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      
      {/* ========================================================= */}
      {/* 1. SIDEBAR DESKTOP                                        */}
      {/* ========================================================= */}
      <aside className={`hidden md:flex flex-col bg-white border-r border-slate-200 transition-all duration-300 ease-in-out relative z-20 ${isSidebarExpanded ? 'w-72' : 'w-20'}`}>
        <button onClick={() => setIsSidebarExpanded(!isSidebarExpanded)} className="absolute -right-3.5 top-8 bg-white border border-slate-200 rounded-full p-1 text-slate-400 hover:text-blue-600 shadow-sm z-30">
          {isSidebarExpanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>

        <div className={`h-24 flex items-center border-b border-slate-100 transition-all ${isSidebarExpanded ? 'px-6' : 'px-0 justify-center'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${clientData.color} rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-blue-600/20 shrink-0`}>
              {clientData.short}
            </div>
            {isSidebarExpanded && (
              <div className="overflow-hidden whitespace-nowrap fade-in">
                <h1 className="font-bold text-slate-800 leading-tight">{clientData.name}</h1>
                <p className="text-[10px] text-slate-500 font-medium">Admin Portal</p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 mt-2 overflow-y-auto overflow-x-hidden custom-scrollbar">
          {isSidebarExpanded && <p className="px-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Main Menu</p>}
          
          {[
            { id: 'hris', icon: Users, label: 'HRIS Dashboard' },
            { id: 'task', icon: CheckSquare, label: 'Task Management', restricted: true }, // Tambahkan properti restricted
            { id: 'finance', icon: Wallet, label: 'Finance Dashboard' }
          ].map((item) => (
            <button key={item.id} 
              // Tambahan validasi akses untuk staff
              disabled={item.restricted && currentUser.role === 'staff' && !candidates.find(c => c.id === currentUser.id)?.hasTaskAccess}
              onClick={() => {setActiveMenu(item.id); setSelectedTask(null);}}
              className={`flex items-center w-full rounded-xl font-medium text-sm transition-all overflow-hidden whitespace-nowrap
                ${activeMenu === item.id ? `${clientData.light} ${clientData.text}` : 'text-slate-600 hover:bg-slate-50'}
                ${isSidebarExpanded ? 'gap-3 px-4 py-3.5' : 'justify-center p-3.5'}
                ${(item.restricted && currentUser.role === 'staff' && !candidates.find(c => c.id === currentUser.id)?.hasTaskAccess) ? 'opacity-30 cursor-not-allowed' : ''}
              `}>
              <item.icon size={20} className={`shrink-0 ${activeMenu === item.id ? clientData.text : 'text-slate-400'}`} />
              {isSidebarExpanded && <span>{item.label}</span>}
            </button>
          ))}

          <div className="pt-4 mt-4 border-t border-slate-100">
            {isSidebarExpanded && <p className="px-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">System</p>}
            <button onClick={() => setActiveMenu('settings')} title={!isSidebarExpanded ? "Konfigurasi Akses" : ''}
              className={`flex items-center w-full rounded-xl font-medium text-sm transition-all overflow-hidden whitespace-nowrap
                ${activeMenu === 'settings' ? `${clientData.light} ${clientData.text}` : 'text-slate-600 hover:bg-slate-50'}
                ${isSidebarExpanded ? 'gap-3 px-4 py-3.5' : 'justify-center p-3.5'}
              `}>
              <Settings size={20} className={`shrink-0 ${activeMenu === 'settings' ? clientData.text : 'text-slate-400'}`} />
              {isSidebarExpanded && <span>Konfigurasi Akses</span>}
            </button>
          </div>
        </nav>
      </aside>

      {/* ========================================================= */}
      {/* 2. AREA KONTEN UTAMA                                      */}
      {/* ========================================================= */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        
        {/* --- Topbar Desktop --- */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 bg-white border-b border-slate-200 z-10 shrink-0">
          <div className="relative w-96">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Cari data..." className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
          </div>
          
          <div className="flex items-center gap-4 relative" ref={popupRef}>
            <button className="relative p-2.5 text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border border-white"></span>
            </button>

            <button onClick={() => setIsProfilePopupOpen(!isProfilePopupOpen)} className="flex items-center gap-3 pl-4 border-l border-slate-200 hover:opacity-80 transition-opacity">
              <img src="https://ui-avatars.com/api/?name=Admin+Utama&background=eff6ff&color=2563eb" alt="User" className="w-9 h-9 rounded-full border border-slate-200" />
              <div className="text-left hidden lg:block">
                <p className="text-sm font-bold text-slate-800 leading-tight">Admin Utama</p>
                <p className="text-[10px] text-slate-500 font-medium">Manager Operasional</p>
              </div>
            </button>

            {isProfilePopupOpen && (
              <div className="absolute top-14 right-0 w-56 bg-white border border-slate-100 rounded-2xl shadow-xl py-2 fade-in z-50">
                <div className="px-4 py-3 border-b border-slate-100 mb-2">
                  <p className="text-sm font-bold text-slate-800">Admin Utama</p>
                  <p className="text-xs text-slate-500">{clientData.name}</p>
                </div>
                <button className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-3"><UserCircle size={18} className="text-slate-400"/> Profil Saya</button>
                <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-3 mt-1"><LogOut size={18} className="text-rose-400"/> Keluar Sistem</button>
              </div>
            )}
          </div>
        </header>

        {/* --- Topbar Mobile --- */}
        <header className="md:hidden bg-blue-600 px-5 pt-10 pb-6 rounded-b-3xl shadow-md text-white z-10 shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center font-bold text-blue-600 shadow-inner">{clientData.short}</div>
              <div>
                <p className="text-[10px] text-blue-200 uppercase tracking-widest font-semibold mb-0.5">Admin Portal</p>
                <h1 className="font-bold text-lg leading-tight">{clientData.name}</h1>
              </div>
            </div>
            <button className="relative p-2 bg-white/20 rounded-full backdrop-blur-sm">
              <Bell size={20} className="text-white" />
              <span className="absolute top-1.5 right-2 w-2 h-2 bg-rose-500 rounded-full border border-blue-600"></span>
            </button>
          </div>
        </header>

        {/* --- Scrollable Content Area --- */}
        <div className="flex-1 overflow-y-auto p-4 pb-28 md:pb-8 md:p-8 bg-slate-50/50 custom-scrollbar">
          <div className="w-full"> 

            {/* ========================================================= */}
            {/* KONTEN: HRIS DASHBOARD                                      */}
            {/* ========================================================= */}
            {activeMenu === 'hris' && (
              <div className="space-y-6 fade-in">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">HRIS & Recruitment</h2>
                    <p className="text-slate-500 text-sm mt-1">Kelola database karyawan, absensi, dan data pelamar baru.</p>
                  </div>
                  <span className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 flex items-center gap-2 shadow-sm w-max"><Clock size={14}/> 5 Juli 2026</span>
                </div>

                <div className="flex overflow-x-auto hide-scrollbar p-1.5 bg-slate-200/50 rounded-xl w-full">
                  {[
                    { id: 'overview', icon: CheckSquare, label: 'Overview' },
                    { id: 'recruitment', icon: UserPlus, label: 'Data Recruitment' },
                    { id: 'database', icon: Database, label: 'Database Karyawan' },
                    { id: 'qrcode', icon: QrCode, label: 'QR Form Lamaran' },
                  ].map((tab) => (
                    <button key={tab.id} onClick={() => setHrisTab(tab.id)}
                      className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2.5 px-4 whitespace-nowrap text-sm font-semibold rounded-lg transition-all ${hrisTab === tab.id ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}>
                      <tab.icon size={16} className={hrisTab === tab.id ? 'text-blue-600' : 'text-slate-400'}/> {tab.label}
                    </button>
                  ))}
                </div>

                {hrisTab === 'overview' && (
                  <div className="space-y-6 fade-in">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
                      <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100">
                        <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase">Total Karyawan</p>
                        <h3 className="text-2xl md:text-3xl font-black text-slate-800 mt-1 md:mt-2">{candidates.filter(c => c.status === 'INTI').length}</h3>
                        <p className="text-[10px] md:text-xs text-blue-600 font-medium mt-1">Berstatus Aktif</p>
                      </div>
                      <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100">
                        <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase">Pelamar Baru</p>
                        <h3 className="text-2xl md:text-3xl font-black text-slate-800 mt-1 md:mt-2">{candidates.filter(c => c.status === 'PENDING').length}</h3>
                        <p className="text-[10px] md:text-xs text-amber-500 font-medium mt-1">Menunggu Review</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {hrisTab === 'database' && (
                  <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden fade-in">
                    <div className="p-4 md:p-5 border-b border-slate-100 bg-blue-50/30 flex justify-between items-center">
                      <h3 className="font-bold text-blue-900 text-sm md:text-base flex items-center gap-2"><Database size={18} className="text-blue-500"/> Master Data Karyawan (Aktif)</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                          <tr><th className="px-6 py-4">Pegawai</th><th className="px-6 py-4">Divisi</th><th className="px-6 py-4">Penempatan</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                          {candidates.filter(c => c.status === 'INTI').map(c => (
                            <tr key={c.id} className="hover:bg-slate-50">
                              <td className="px-6 py-4"><span className="font-bold text-slate-800 block">{c.nama_lengkap}</span></td>
                              <td className="px-6 py-4"><span className="block font-bold text-slate-700">{c.bidang_jasa}</span></td>
                              <td className="px-6 py-4"><span className="text-xs font-bold text-slate-700">{c.lokasi_penempatan}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ========================================================= */}
            {/* KONTEN BARU: FINANCE DASHBOARD DENGAN SUB-NAVBAR          */}
            {/* ========================================================= */}
            {activeMenu === 'finance' && (
              <div className="space-y-6 fade-in">
                
                {/* Header Utama Finance */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Finance & Accounting</h2>
                    <p className="text-slate-500 text-sm mt-1">Kelola arus kas, penggajian, dan tagihan invoice perusahaan.</p>
                  </div>
                  <span className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 flex items-center gap-2 shadow-sm w-max"><Clock size={14}/> 5 Juli 2026</span>
                </div>

                {/* Sub-Navbar Finance */}
                <div className="flex overflow-x-auto hide-scrollbar p-1.5 bg-slate-200/50 rounded-xl w-full">
                  {[
                    { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
                    { id: 'cashflow', icon: Wallet, label: 'Arus Kas' },
                    { id: 'payroll', icon: CreditCard, label: 'Penggajian' },
                    { id: 'invoice', icon: Receipt, label: 'Tagihan Invoice' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setFinanceTab(tab.id)}
                      className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2.5 px-4 whitespace-nowrap text-sm font-semibold rounded-lg transition-all ${financeTab === tab.id ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      <tab.icon size={16} className={financeTab === tab.id ? 'text-emerald-600' : 'text-slate-400'}/> {tab.label}
                    </button>
                  ))}
                </div>

                {/* --- TAB: OVERVIEW (EXECUTIVE SUMMARY) --- */}
                {financeTab === 'overview' && (
                  <div className="space-y-6 fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Saldo Kas */}
                      <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-lg flex flex-col justify-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 blur-2xl rounded-full -translate-y-1/2 translate-x-1/2"></div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">Saldo Kas Aktif</span>
                        <h3 className="text-3xl font-black text-emerald-400">Rp 45.500.000</h3>
                        <p className="text-[9px] text-slate-400 mt-3 border-t border-slate-800 pt-2 leading-relaxed">Total Pemasukan dikurangi Pengeluaran.</p>
                      </div>
                      {/* Pemasukan */}
                      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-center relative overflow-hidden">
                        <div className="absolute right-6 opacity-10"><TrendingUp size={48} className="text-blue-500"/></div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">Pemasukan (Bulan Ini)</span>
                        <h3 className="text-2xl font-black text-slate-800">Rp 25.000.000</h3>
                        <p className="text-[9px] text-slate-500 mt-3 border-t border-slate-100 pt-2 leading-relaxed">Total Transaksi INCOME berstatus LUNAS.</p>
                      </div>
                      {/* Pengeluaran */}
                      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-center relative overflow-hidden">
                        <div className="absolute right-6 opacity-10"><TrendingDown size={48} className="text-red-500"/></div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">Pengeluaran (Bulan Ini)</span>
                        <h3 className="text-2xl font-black text-slate-800">Rp 4.700.000</h3>
                        <p className="text-[9px] text-slate-500 mt-3 border-t border-slate-100 pt-2 leading-relaxed">Total Transaksi EXPENSE berstatus LUNAS.</p>
                      </div>
                    </div>

                    {/* Grafik Simulasi (Bawaan Kode Asli) */}
                    <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm">
                      <h3 className="font-black text-slate-800 mb-6 flex items-center gap-2"><BarChart3 size={20} className="text-blue-500"/> Grafik Arus Kas (Bulan Terakhir)</h3>
                      
                      {/* CSS Based Bar Chart Placeholder */}
                      <div className="flex items-end gap-4 h-48 pt-6 border-b border-slate-100 relative justify-around px-4">
                          <div className="w-16 flex justify-center items-end gap-1 h-full">
                            <div className="w-1/2 bg-blue-500 rounded-t-md h-[40%]"></div>
                            <div className="w-1/2 bg-red-400 rounded-t-md h-[20%]"></div>
                          </div>
                          <div className="w-16 flex justify-center items-end gap-1 h-full">
                            <div className="w-1/2 bg-blue-500 rounded-t-md h-[60%]"></div>
                            <div className="w-1/2 bg-red-400 rounded-t-md h-[30%]"></div>
                          </div>
                          <div className="w-16 flex justify-center items-end gap-1 h-full">
                            <div className="w-1/2 bg-blue-500 rounded-t-md h-[90%]"></div>
                            <div className="w-1/2 bg-red-400 rounded-t-md h-[10%]"></div>
                          </div>
                      </div>
                      <div className="flex justify-center gap-6 mt-6 pb-2">
                        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500"></span><span className="text-xs font-bold text-slate-600">Pemasukan</span></div>
                        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-400"></span><span className="text-xs font-bold text-slate-600">Pengeluaran</span></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* --- TAB: ARUS KAS (CASHFLOW) --- */}
                {financeTab === 'cashflow' && (
                  <div className="space-y-4 fade-in">
                    <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center gap-2 justify-between">
                       <div className="flex w-full md:w-1/2 items-center bg-slate-50 rounded-xl px-4 py-2 border border-slate-100 focus-within:border-emerald-300">
                         <Search className="w-5 h-5 text-slate-400 shrink-0" />
                         <input type="text" placeholder="Cari transaksi arus kas..." className="w-full bg-transparent border-none outline-none pl-3 text-sm font-bold text-slate-700" />
                       </div>
                       <button className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all">+ Input Manual</button>
                    </div>

                    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-left">
                          <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                            <tr>
                              <th className="px-6 py-4">Tanggal</th>
                              <th className="px-6 py-4">Kategori & Penempatan</th>
                              <th className="px-6 py-4 text-center">Status</th>
                              <th className="px-6 py-4 text-right">Nominal (Rp)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-sm">
                            {cashflows.map(item => (
                              <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 font-bold text-slate-700">{item.date}</td>
                                <td className="px-6 py-4">
                                  <span className="font-black text-slate-800 block">{item.category}</span>
                                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 mt-1 inline-flex items-center gap-1"><MapPin size={10}/> {item.location}</span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${item.type === 'INCOME' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                                    {item.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran'}
                                  </span>
                                  {item.status === 'WAITING_APPROVAL' && <span className="block mt-1 text-[9px] font-black text-orange-600 animate-pulse">Menunggu Approval</span>}
                                </td>
                                <td className={`px-6 py-4 text-right font-black ${item.type === 'INCOME' ? 'text-blue-600' : 'text-red-600'}`}>
                                  {item.type === 'INCOME' ? '+' : '-'}{formatRupiah(item.amount)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* --- TAB: PAYROLL --- */}
                {financeTab === 'payroll' && (
                  <div className="space-y-4 fade-in">
                    <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center gap-2 justify-between">
                       <div className="flex w-full md:w-1/2 items-center bg-slate-50 rounded-xl px-4 py-2 border border-slate-100 focus-within:border-blue-300">
                         <Search className="w-5 h-5 text-slate-400 shrink-0" />
                         <input type="text" placeholder="Cari slip gaji karyawan..." className="w-full bg-transparent border-none outline-none pl-3 text-sm font-bold text-slate-700" />
                       </div>
                       <button className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all">+ Buat Slip Manual</button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      {payrolls.map(slip => (
                        <div key={slip.id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:border-blue-500 transition-all group flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start mb-4">
                              <div className="bg-blue-50 text-blue-600 p-2.5 rounded-2xl group-hover:scale-110 transition-transform"><Building size={20}/></div>
                              <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest shadow-sm ${slip.status === 'WAITING_APPROVAL' ? 'bg-orange-100 text-orange-700 animate-pulse' : 'bg-emerald-100 text-emerald-700'}`}>{slip.status.replace('_', ' ')}</span>
                            </div>
                            <h4 className="font-black text-slate-800 text-lg line-clamp-1">{slip.name}</h4>
                            <p className="text-[10px] text-slate-500 font-bold mb-4">NIK: {slip.nik} • {slip.location}</p>
                          </div>
                          <div className="border-t border-slate-100 pt-4 flex justify-between items-center">
                            <span className="text-[10px] font-black text-slate-400 uppercase">Take Home Pay</span>
                            <span className="font-black text-blue-600 text-lg">{formatRupiah(slip.net_salary)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* --- TAB: INVOICE --- */}
                {financeTab === 'invoice' && (
                  <div className="space-y-4 fade-in">
                    <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center gap-2 justify-between">
                       <div className="flex w-full md:w-1/2 items-center bg-slate-50 rounded-xl px-4 py-2 border border-slate-100 focus-within:border-blue-300">
                         <Search className="w-5 h-5 text-slate-400 shrink-0" />
                         <input type="text" placeholder="Cari nomor invoice atau klien..." className="w-full bg-transparent border-none outline-none pl-3 text-sm font-bold text-slate-700" />
                       </div>
                       <button className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all">+ Terbitkan Invoice</button>
                    </div>

                    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-left">
                          <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                            <tr>
                              <th className="px-6 py-4">Nomor Invoice</th>
                              <th className="px-6 py-4">Klien & Lokasi</th>
                              <th className="px-6 py-4">Tanggal (Terbit - Tempo)</th>
                              <th className="px-6 py-4 text-center">Status</th>
                              <th className="px-6 py-4 text-right">Total Tagihan</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-sm">
                            {invoices.map(inv => (
                              <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 font-black text-slate-800">{inv.number}</td>
                                <td className="px-6 py-4">
                                  <span className="font-black text-slate-800 block">{inv.client}</span>
                                  <span className="text-[10px] text-slate-500 font-medium inline-flex items-center gap-1 mt-1"><MapPin size={10}/> {inv.location}</span>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="text-[10px] font-bold text-slate-500 block mb-0.5">Terbit: {inv.issue_date}</span>
                                  <span className="text-[10px] font-bold text-red-500">Tempo: {inv.due_date}</span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  {inv.status === 'SENT' ? (
                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded text-[9px] font-black uppercase">Terkirim</span>
                                  ) : (
                                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 rounded text-[9px] font-black uppercase">Lunas</span>
                                  )}
                                  <button className="mt-2 text-[9px] bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded font-bold text-slate-600 w-full">Detail</button>
                                </td>
                                <td className="px-6 py-4 text-right font-black text-slate-800">{formatRupiah(inv.amount)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* ========================================================= */}
            {/* KONTEN UTAMA: TASK MANAGEMENT (TERINTEGRASI DATABASE HRIS)*/}
            {/* ========================================================= */}
            {activeMenu === 'task' && (
              <div className="flex flex-col h-full fade-in">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 shrink-0">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Task Management</h2>
                    <p className="text-slate-500 text-sm mt-1">Delegasi tugas langsung ke Karyawan yang memiliki akses.</p>
                  </div>
                  <button onClick={() => setIsTaskModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2">
                    <Plus size={16}/> Buat Tugas Baru
                  </button>
                </div>

                <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200/60 flex flex-col md:flex-row items-center gap-2 mb-6 shrink-0">
                  <div className="flex w-full items-center bg-slate-50 rounded-xl px-4 py-2 border border-slate-100 focus-within:border-blue-300 transition-colors">
                    <Search className="w-5 h-5 text-slate-400 shrink-0" />
                    <input type="text" placeholder="Cari judul pekerjaan..." value={taskSearchQuery} onChange={(e) => setTaskSearchQuery(e.target.value)} className="w-full bg-transparent border-none outline-none pl-3 text-sm font-bold text-slate-700" />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-10">
                  {tasks.filter(t => !taskSearchQuery || t.title.toLowerCase().includes(taskSearchQuery.toLowerCase())).map(task => {
                    const isOverdue = task.dueDate < getNowStr() && task.status !== 'done';
                    return (
                      <div key={task.id} onClick={() => setSelectedTask(task)} className="bg-white p-5 rounded-[1.5rem] border border-slate-200 shadow-sm cursor-pointer hover:border-blue-400 hover:shadow-md transition-all active:scale-[0.99] flex flex-col h-full">
                         <div className="flex justify-between items-start mb-3">
                           <div className="flex gap-2">
                             <span className={getStatusBadgeClass(task.status)}>{task.status.replace('-', ' ')}</span>
                             {isOverdue && <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase shadow-sm bg-red-600 text-white">OVERDUE</span>}
                           </div>
                           <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase shadow-sm bg-blue-50 text-blue-600">Prioritas {task.priority}</span>
                         </div>
                         <h4 className="text-lg font-black text-slate-800 line-clamp-2 mb-2">{task.title}</h4>
                         <p className="text-xs text-slate-500 line-clamp-2 mb-4 flex-1">{task.description}</p>
                         
                         <div className="border-t border-slate-100 pt-4 flex justify-between items-center mt-auto">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Penerima Tugas</span>
                              <span className="text-xs font-bold text-blue-600 truncate max-w-[150px]">{getAssigneesNames(task.assignedTo)}</span>
                            </div>
                            <div className="flex flex-col text-right">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Deadline</span>
                              <span className={`text-xs font-bold flex items-center justify-end gap-1 ${isOverdue ? 'text-red-600' : 'text-slate-700'}`}>
                                <Clock size={12}/> {formatDateTime(task.dueDate)}
                              </span>
                            </div>
                         </div>
                      </div>
                    )
                  })}
                  {tasks.length === 0 && <div className="col-span-2 p-10 text-center text-slate-400 font-bold">Belum ada tugas yang dibuat.</div>}
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* KONTEN: PENGATURAN HAK AKSES TASK MANAGEMENT DARI HRIS    */}
            {/* ========================================================= */}
            {activeMenu === 'settings' && (
              <div className="space-y-6 fade-in">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Konfigurasi Akses Sistem</h2>
                  <p className="text-slate-500 text-sm mt-1">Atur hak akses karyawan terhadap Modul Task Management.</p>
                </div>
                <div className="bg-white border border-slate-200 shadow-sm rounded-[2rem] overflow-hidden">
                  <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                     <h3 className="font-black text-slate-800 flex items-center gap-2"><ShieldAlert size={18} className="text-blue-600"/> Hak Akses Karyawan (INTI)</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                        <tr><th className="px-6 py-4">Nama Pegawai & NIK</th><th className="px-6 py-4">Divisi & Jabatan</th><th className="px-6 py-4 text-center">Status Data</th><th className="px-6 py-4 text-center">Akses Task</th><th className="px-6 py-4 text-center">Akses Mobile App</th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {activeEmployees.map(emp => (
                          <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4"><span className="font-bold text-slate-800 block">{emp.nama_lengkap}</span><span className="text-[10px] font-bold text-slate-500">{emp.nik_karyawan}</span></td>
                            <td className="px-6 py-4"><span className="block font-bold text-slate-700">{emp.bidang_jasa}</span><span className="text-[10px] bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-slate-600 inline-block mt-1">{emp.posisi_jabatan}</span></td>
                            <td className="px-6 py-4 text-center"><span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[9px] font-black uppercase">Karyawan Inti</span></td>
                            <td className="px-6 py-4 text-center align-middle">
                              <label className="relative inline-flex items-center cursor-pointer justify-center">
                                <input type="checkbox" className="sr-only peer" checked={emp.hasTaskAccess} onChange={() => toggleTaskAccess(emp.id)} />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                <span className={`ml-3 text-xs font-bold ${emp.hasTaskAccess ? 'text-blue-600' : 'text-slate-400'}`}>{emp.hasTaskAccess ? 'Aktif' : 'Nonaktif'}</span>
                              </label>
                            </td>
                            <td className="px-6 py-4 text-center align-middle">
                              <label className="relative inline-flex items-center cursor-pointer justify-center">
                                <input type="checkbox" className="sr-only peer" checked={emp.hasMobileAccess} onChange={() => toggleMobileAccess(emp.id)} />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                <span className={`ml-3 text-xs font-bold ${emp.hasMobileAccess ? 'text-emerald-600' : 'text-slate-400'}`}>{emp.hasMobileAccess ? 'Aktif' : 'Nonaktif'}</span>
                              </label>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            </div>
        </div>

        {/* ========================================================= */}
        {/* MODAL 1: BUAT TUGAS BARU                                  */}
        {/* ========================================================= */}
        {isTaskModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[80] flex justify-center items-end md:items-center md:p-4">
            <div className="bg-white w-full h-[90vh] md:h-auto md:max-w-2xl rounded-t-[2rem] md:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-full md:zoom-in duration-300 relative">
              <div className="px-6 py-5 border-b border-blue-600 bg-blue-600 text-white flex justify-between items-center shrink-0">
                <div>
                  <h3 className="font-black text-lg">Buat Tugas Baru</h3>
                  <p className="text-[10px] text-blue-200 mt-0.5">Penerima tugas ditarik otomatis dari Karyawan INTI.</p>
                </div>
                <button type="button" onClick={() => setIsTaskModalOpen(false)} className="bg-white/10 p-2 rounded-full hover:bg-white/20"><X size={18}/></button>
              </div>
              
              <form onSubmit={handleCreateTask} className="flex flex-col flex-1 min-h-0">
                <div className="p-6 md:p-8 overflow-y-auto space-y-5 custom-scrollbar flex-1">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Judul Pekerjaan</label>
                    <input required type="text" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 text-sm outline-none font-bold bg-slate-50 focus:bg-white transition-all"/>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Prioritas</label>
                      <select value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value})} className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 text-sm outline-none font-bold bg-slate-50 focus:bg-white transition-all"><option value="low">Rendah</option><option value="medium">Sedang</option><option value="high">Tinggi</option></select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Deadline (Batas Waktu)</label>
                      <input required type="datetime-local" value={newTask.dueDate} onChange={e => setNewTask({...newTask, dueDate: e.target.value})} className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 text-sm outline-none font-bold bg-slate-50 focus:bg-white transition-all"/>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center justify-between">
                      <span>Pilih Karyawan Penerima Tugas</span>
                      <span className="text-blue-500 font-bold normal-case">Tersedia: {employeesWithTaskAccess.length} Karyawan</span>
                    </label>
                    <div className="max-h-40 overflow-y-auto border-2 border-slate-200 rounded-xl p-3 bg-slate-50 space-y-1 custom-scrollbar">
                      {employeesWithTaskAccess.length === 0 ? (
                        <p className="text-xs text-slate-400 font-bold text-center py-4">Tidak ada karyawan yang memiliki akses tugas.</p>
                      ) : (
                        employeesWithTaskAccess.map(emp => (
                          <label key={emp.id} className="flex items-center gap-3 p-3 bg-white border border-slate-100 hover:border-blue-300 rounded-lg cursor-pointer shadow-sm transition-all">
                            <input type="checkbox" checked={newTask.assignedTo.includes(emp.id)} onChange={(e) => setNewTask(p => ({ ...p, assignedTo: e.target.checked ? [...p.assignedTo, emp.id] : p.assignedTo.filter(id => id !== emp.id) }))} className="w-4 h-4 text-blue-600 rounded border-slate-300" />
                            <div className="flex-1">
                              <span className="text-sm font-bold text-slate-800 block">{emp.nama_lengkap}</span>
                              <span className="text-[10px] text-slate-500 font-medium">{emp.bidang_jasa} • {emp.lokasi_penempatan}</span>
                            </div>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Deskripsi Lengkap Instruksi</label>
                    <textarea required rows="3" value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 text-sm outline-none font-medium min-h-[100px] bg-slate-50 focus:bg-white transition-all"></textarea>
                  </div>
                </div>
                <div className="p-5 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0 pb-10 md:pb-5">
                  <button type="button" onClick={() => setIsTaskModalOpen(false)} className="px-5 py-3 text-slate-500 hover:bg-slate-200 rounded-xl font-bold text-sm transition-colors">Batal</button>
                  <button type="submit" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5 flex items-center gap-2">Kirim Tugas Sekarang</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODAL 2: DETAIL TUGAS & DISKUSI (POP-UP)                    */}
        {/* ========================================================= */}
        {selectedTask && (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[90] flex justify-center items-end md:items-center md:p-8">
            <div className="w-full h-[90vh] md:max-w-5xl md:h-[85vh] bg-slate-100 rounded-t-[2rem] md:rounded-[2rem] shadow-2xl flex flex-col md:flex-row overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="w-full md:w-1/2 flex flex-col bg-white border-r border-slate-200 h-1/2 md:h-full">
                <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white z-10 shrink-0">
                  <h3 className="font-black text-lg text-slate-800 flex items-center gap-2"><FileText size={18} className="text-blue-500"/> Info Pekerjaan</h3>
                  <button type="button" onClick={() => setSelectedTask(null)} className="p-1.5 bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors md:hidden"><X size={18} /></button>
                </div>
                <div className="p-6 overflow-y-auto flex-1 space-y-6 custom-scrollbar">
                  <div>
                    <div className="flex gap-2 mb-3">
                      <span className={getStatusBadgeClass(selectedTask.status)}>{selectedTask.status.replace('-', ' ')}</span>
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 leading-tight">{selectedTask.title}</h2>
                    <div className="grid grid-cols-2 gap-4 mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Penerima Tugas</span><span className="text-xs font-bold text-blue-600">{getAssigneesNames(selectedTask.assignedTo)}</span></div>
                      <div><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Diberikan Oleh</span><span className="text-xs font-bold text-slate-700">{getUserName(selectedTask.assignedBy)}</span></div>
                      <div className="col-span-2 pt-2 border-t border-slate-200"><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Batas Waktu (Deadline)</span><span className="text-sm font-black text-red-600 flex items-center gap-1.5"><Clock size={14}/> {formatDateTime(selectedTask.dueDate)}</span></div>
                    </div>
                    <div className="mt-6 text-slate-700 text-sm leading-relaxed font-medium p-4 bg-yellow-50/50 border border-yellow-100 rounded-xl">
                      <span className="block text-[10px] font-black text-yellow-600 uppercase tracking-widest mb-2">Instruksi:</span>{selectedTask.description}
                    </div>
                  </div>
                  <div className="mt-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Update Status Laporan</label>
                    <select value={selectedTask.status} onChange={(e) => handleStatusUpdate(selectedTask.id, e.target.value)} className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 text-sm font-bold bg-slate-50 focus:bg-white transition-colors cursor-pointer outline-none">
                      <option value="pending">Pending (Belum Dikerjakan)</option><option value="in-progress">In Progress (Sedang Diproses)</option><option value="done">Done (Selesai)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="w-full md:w-1/2 flex flex-col bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-slate-100 h-1/2 md:h-full relative">
                <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center bg-white/90 backdrop-blur-md z-10 shrink-0">
                  <h3 className="font-black text-lg text-slate-800 flex items-center gap-2"><MessageSquare size={18} className="text-blue-500" /> Diskusi Tim</h3>
                  <button type="button" onClick={() => setSelectedTask(null)} className="hidden md:block p-1.5 bg-slate-100 text-slate-600 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"><X size={18} /></button>
                </div>
                <div className="flex-1 p-5 overflow-y-auto space-y-4 custom-scrollbar">
                  {(selectedTask.comments || []).length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400"><p className="text-xs font-bold uppercase tracking-widest">Belum ada diskusi</p></div>
                  ) : (
                    selectedTask.comments.map((chat, idx) => {
                      const isMe = String(chat.userId) === String(currentUser.id);
                      return (
                        <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          <div className={`p-3 md:p-4 rounded-2xl shadow-sm max-w-[85%] ${isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'}`}>
                            <p className="text-[11px] md:text-sm font-medium leading-relaxed">{chat.text}</p>
                          </div>
                          <span className="text-[8px] md:text-[10px] font-black tracking-widest text-slate-400 mt-1 px-1 uppercase">{isMe ? 'Anda' : getUserName(chat.userId)} • {chat.timestamp}</span>
                        </div>
                      );
                    })
                  )}
                </div>
                <div className="p-4 md:p-5 bg-white border-t border-slate-200 pb-10 md:pb-5 shrink-0 shadow-[0_-10px_20px_rgba(0,0,0,0.03)]">
                  <form onSubmit={handleAddComment} className="flex gap-2 items-center">
                    <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Ketik laporan atau balasan..." className="flex-1 px-4 py-3.5 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm bg-slate-50 focus:bg-white font-bold transition-colors" />
                    <button type="submit" disabled={!newComment.trim()} className="bg-blue-600 text-white p-3.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 shadow-md shrink-0 transition-transform active:scale-95"><Send size={20} className="ml-0.5" /></button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================= */}
      {/* 3. MOBILE BOTTOM NAVIGATION                                 */}
      {/* ========================================================= */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white border-t border-slate-200 flex justify-around items-center px-2 py-3 pb-6 z-40 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
        <button onClick={() => setActiveMenu('hris')} className={`flex flex-col items-center gap-1.5 w-16 transition-colors ${activeMenu === 'hris' ? clientData.text : 'text-slate-400'}`}>
          <div className={`p-1.5 rounded-xl ${activeMenu === 'hris' ? clientData.light : 'bg-transparent'}`}><Users size={22} className={activeMenu === 'hris' ? `fill-blue-100 ${clientData.text}` : ''} /></div>
          <span className={`text-[10px] font-bold ${activeMenu === 'hris' ? clientData.text : 'font-medium'}`}>HRIS</span>
        </button>
        <button onClick={() => setActiveMenu('task')} className={`flex flex-col items-center gap-1.5 w-16 transition-colors ${activeMenu === 'task' ? clientData.text : 'text-slate-400'}`}>
          <div className={`p-1.5 rounded-xl ${activeMenu === 'task' ? clientData.light : 'bg-transparent'}`}><CheckSquare size={22} className={activeMenu === 'task' ? `fill-blue-100 ${clientData.text}` : ''} /></div>
          <span className={`text-[10px] font-bold ${activeMenu === 'task' ? clientData.text : 'font-medium'}`}>Task</span>
        </button>
        <button onClick={() => setActiveMenu('finance')} className={`flex flex-col items-center gap-1.5 w-16 transition-colors ${activeMenu === 'finance' ? clientData.text : 'text-slate-400'}`}>
          <div className={`p-1.5 rounded-xl ${activeMenu === 'finance' ? clientData.light : 'bg-transparent'}`}><Wallet size={22} className={activeMenu === 'finance' ? `fill-blue-100 ${clientData.text}` : ''} /></div>
          <span className={`text-[10px] font-bold ${activeMenu === 'finance' ? clientData.text : 'font-medium'}`}>Finance</span>
        </button>
        <button onClick={() => setActiveMenu('settings')} className={`flex flex-col items-center gap-1.5 w-16 transition-colors ${activeMenu === 'settings' ? clientData.text : 'text-slate-400'}`}>
          <div className={`p-1.5 rounded-xl ${activeMenu === 'settings' ? clientData.light : 'bg-transparent'}`}><Settings size={22} className={activeMenu === 'settings' ? `fill-blue-100 ${clientData.text}` : ''} /></div>
          <span className={`text-[10px] font-bold ${activeMenu === 'settings' ? clientData.text : 'font-medium'}`}>Sistem</span>
        </button>
      </nav>

    </div>
  );
}