import { useState, useEffect, useRef } from 'react';
import { 
  Camera, Menu, X, CheckSquare, Wallet, Settings, 
  Users, Bell, Search, FileText, 
  ShieldAlert, Clock, ArrowUpRight, ArrowDownRight,
  ChevronLeft, ChevronRight, UserCircle, LogOut,
  UserPlus, Database, QrCode, Download, CheckCircle2, 
  Trash2, MapPin, LayoutDashboard, Receipt, CreditCard, 
  TrendingUp, TrendingDown, Activity, BarChart3, Building, MessageSquare, Plus, Send, FolderTree
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase'; 

export default function ClientAdmin() {
  const [activeMenu, setActiveMenu] = useState('hris'); 
  const [activeTaskLevel, setActiveTaskLevel] = useState('Level 1');
  
  const [hrisTab, setHrisTab] = useState('absensi'); 
  const [financeTab, setFinanceTab] = useState('overview');
  const [laporanTab, setLaporanTab] = useState('patroli');
  const [settingTab, setSettingTab] = useState('gps_rules');

  const navigate = useNavigate();
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [selectedEmployeeAccess, setSelectedEmployeeAccess] = useState(null);
  const [editPermissions, setEditPermissions] = useState({ patroli: false, reguler: false, cuti: false, koreksi: false, reimburse: false, bebas_gps: false });
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isProfilePopupOpen, setIsProfilePopupOpen] = useState(false);
  const popupRef = useRef(null);

  const [currentUser, setCurrentUser] = useState({ id: '', name: 'Loading...', role: '', division: '', avatar: '' });
  
  // STATE DATA UTAMA
  const [candidates, setCandidates] = useState([]); 
  const [employees, setEmployees] = useState([]); 
  const [cashflows, setCashflows] = useState([]);
  
  const [attendances, setAttendances] = useState([]);
  const [filterNama, setFilterNama] = useState('');
  const [filterLokasi, setFilterLokasi] = useState('');
  const [filterTanggal, setFilterTanggal] = useState('');
  const [isAbsenModalOpen, setIsAbsenModalOpen] = useState(false);
  const [absenForm, setAbsenForm] = useState({ id: null, employee_id: '', date: '', check_in_time: '', check_out_time: '', location_gps: '', photo_url: '', status: 'HADIR' });

  // STATE UNTUK CRUD KLIEN/CABANG & LOKASI (GEO-FENCING)
  const [clientsList, setClientsList] = useState([]);
  const [officeLocations, setOfficeLocations] = useState([]);
  
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [clientForm, setClientForm] = useState({ id: null, name: '', status: 'ACTIVE' });
  
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [locationForm, setLocationForm] = useState({ id: null, client_id: '', name: '', latitude: '', longitude: '', radius: 50 });

  const [payrolls, setPayrolls] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [fieldReports, setFieldReports] = useState([]);

  const [expandedReportId, setExpandedReportId] = useState(null);

  // State Filter Laporan
  const [filterReportName, setFilterReportName] = useState('');
  const [filterReportTitle, setFilterReportTitle] = useState('');
  const [filterReportDate, setFilterReportDate] = useState('');
  const [filterReportType, setFilterReportType] = useState('Semua');

  useEffect(() => {
    const session = localStorage.getItem('vest_user_session');
    if (!session) {
      navigate('/'); 
      return;
    }
    const parsedSession = JSON.parse(session);
    const safeName = parsedSession.name || 'User'; 
    const initials = safeName.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
    setCurrentUser({ ...parsedSession, avatar: initials });

    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const { data: candData } = await supabase.from('candidates').select('*').order('created_at', { ascending: false });
      if (candData) setCandidates(candData);

      const { data: empData } = await supabase.from('employees').select('*').order('created_at', { ascending: false });
      if (empData) {
        setEmployees(empData.map(e => ({
          ...e,
          hasTaskAccess: e.has_task_access,
          hasMobileAccess: e.has_mobile_access
        })));
      }

      // Fetch Absensi (JOIN dengan tabel employees untuk dapat nama)
      const { data: attData } = await supabase.from('attendances').select('*, employees(nama_lengkap, lokasi_penempatan)').order('date', { ascending: false });
      if (attData) setAttendances(attData);

      const { data: repData } = await supabase.from('field_reports').select('*, employees(nama_lengkap)').order('created_at', { ascending: false });
      if (repData) setFieldReports(repData);

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

      const { data: cfData } = await supabase.from('cashflows').select('*').order('created_at', { ascending: false });
      if (cfData) setCashflows(cfData);
      
      const { data: pyData } = await supabase.from('payrolls').select('*').order('created_at', { ascending: false });
      if (pyData) setPayrolls(pyData);
      
      const { data: invData } = await supabase.from('invoices').select('*').order('created_at', { ascending: false });
      if (invData) setInvoices(invData);

      // Fetch Data Klien & Lokasi Absensi
      const { data: clientDataRes } = await supabase.from('clients').select('*').order('name', { ascending: true });
      if (clientDataRes) setClientsList(clientDataRes);

      const { data: locData } = await supabase.from('office_locations').select('*');
      if (locData) setOfficeLocations(locData);

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

  // Konfigurasi Bawaan UI App
  const appConfig = {
    name: "PT Klien Nusantara",
    short: "KN",
    color: "bg-blue-600",
    text: "text-blue-600",
    light: "bg-blue-50"
  };

  const formatRupiah = (angka) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka || 0);

  const activeEmployees = employees.filter(e => e.status === 'INTI' || !e.status);
  const employeesWithTaskAccess = activeEmployees.filter(e => e.hasTaskAccess);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [newTask, setNewTask] = useState({ title: '', description: '', assignedTo: [], priority: 'medium', dueDate: '' });
  const [taskSearchQuery, setTaskSearchQuery] = useState('');
  const [newComment, setNewComment] = useState('');

  const formatDateTime = (val) => val ? val.replace('T', ' ').substring(0, 16) : '-';
  const getNowStr = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}T${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; };
  const getUserName = (id) => { if(id === currentUser.id) return currentUser.name; const e = employees.find(u => u.id === id); return e ? e.nama_lengkap : 'Unknown'; };
  const getAssigneesNames = (assignedToArr) => assignedToArr.map(id => getUserName(id)).join(', ') || 'Belum Ada';
  const getStatusBadgeClass = (status) => {
    const colors = { 'pending': 'bg-slate-100 text-slate-600', 'in-progress': 'bg-blue-100 text-blue-700', 'done': 'bg-emerald-100 text-emerald-700' };
    return `px-2 py-0.5 rounded text-[9px] font-black uppercase shadow-sm ${colors[status] || colors.pending}`;
  };

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

  const handleStatusUpdate = async (taskId, newStatus) => {
    const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId);
    if (!error) {
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
      if(selectedTask && selectedTask.id === taskId) setSelectedTask({ ...selectedTask, status: newStatus });
    }
  };

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

  const handleLogout = () => {
    localStorage.removeItem('vest_user_session');
    navigate('/');
  };

  const handleSaveUserAccess = async () => {
    const { error } = await supabase
      .from('employees')
      .update({ permissions: editPermissions }) 
      .eq('id', selectedEmployeeAccess.id);
      
    if (!error) {
      alert(`Hak akses untuk ${selectedEmployeeAccess.nama_lengkap} berhasil tersimpan!`);
      setIsAccessModalOpen(false);
    } else {
      alert("Gagal simpan: " + error.message);
    }
  };

  // ==========================================
  // FUNGSI CRUD KLIEN/CABANG & LOKASI (GEO-FENCING)
  // ==========================================
  const handleSaveClient = async (e) => {
    e.preventDefault();
    // Generate slug otomatis dari nama cabang
    const generatedSlug = clientForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const payload = { name: clientForm.name, slug: generatedSlug, status: clientForm.status };
    
    if (clientForm.id) {
      const { error } = await supabase.from('clients').update(payload).eq('id', clientForm.id);
      if (!error) { alert('Cabang Klien diperbarui!'); fetchAllData(); setIsClientModalOpen(false); }
      else alert('Gagal update cabang: ' + error.message);
    } else {
      const { error } = await supabase.from('clients').insert([payload]);
      if (!error) { alert('Cabang Klien ditambahkan!'); fetchAllData(); setIsClientModalOpen(false); }
      else alert('Gagal menambah cabang: ' + error.message);
    }
  };

  const handleDeleteClient = async (id) => {
    if (window.confirm("Hapus Klien/Cabang ini? Semua lokasi di dalamnya akan terpengaruh.")) {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (!error) fetchAllData();
      else alert("Gagal hapus klien. Pastikan titik lokasi di dalamnya sudah dihapus lebih dulu.");
    }
  };

  const handleSaveLocation = async (e) => {
    e.preventDefault();
    const payload = { 
      client_id: locationForm.client_id, // Menyambungkan ke ID Klien/Cabang
      name: locationForm.name, 
      latitude: parseFloat(locationForm.latitude), 
      longitude: parseFloat(locationForm.longitude), 
      radius: parseInt(locationForm.radius) 
    };

    if (locationForm.id) {
      const { error } = await supabase.from('office_locations').update(payload).eq('id', locationForm.id);
      if (!error) { alert('Lokasi berhasil diperbarui!'); fetchAllData(); setIsLocationModalOpen(false); }
      else alert('Gagal update lokasi: ' + error.message);
    } else {
      const { error } = await supabase.from('office_locations').insert([payload]);
      if (!error) { alert('Lokasi baru berhasil ditambahkan!'); fetchAllData(); setIsLocationModalOpen(false); }
      else alert('Gagal menambah lokasi: ' + error.message);
    }
  };

  const handleDeleteLocation = async (id) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus titik lokasi ini? Karyawan tidak akan bisa absen di area ini lagi.")) {
      const { error } = await supabase.from('office_locations').delete().eq('id', id);
      if (!error) fetchAllData();
    }
  };

  const handleDeleteAbsen = async (id) => {
    if (window.confirm("Hapus data absen ini permanen?")) {
      const { error } = await supabase.from('attendances').delete().eq('id', id);
      if (!error) fetchAllData();
    }
  };

  const downloadTemplateAbsen = () => {
    const csvContent = "data:text/csv;charset=utf-8,employee_id,date,check_in_time,check_out_time,location_gps,photo_url,status\nUID_KARYAWAN_DISINI,2026-07-06,08:00:00,17:00:00,Head Office,https://link-foto.com/foto.jpg,HADIR";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Template_Import_Absensi.csv");
    document.body.appendChild(link);
    link.click();
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className={`hidden md:flex flex-col bg-white border-r border-slate-200 transition-all duration-300 ease-in-out relative z-20 ${isSidebarExpanded ? 'w-72' : 'w-20'}`}>
        <button onClick={() => setIsSidebarExpanded(!isSidebarExpanded)} className="absolute -right-3.5 top-8 bg-white border border-slate-200 rounded-full p-1 text-slate-400 hover:text-blue-600 shadow-sm z-30">
          {isSidebarExpanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>

        <div className={`h-24 flex items-center border-b border-slate-100 transition-all ${isSidebarExpanded ? 'px-6' : 'px-0 justify-center'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${appConfig.color} rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-blue-600/20 shrink-0`}>
              {appConfig.short}
            </div>
            {isSidebarExpanded && (
              <div className="overflow-hidden whitespace-nowrap fade-in">
                <h1 className="font-bold text-slate-800 leading-tight">{appConfig.name}</h1>
                <p className="text-[10px] text-slate-500 font-medium">Admin Portal</p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 mt-2 overflow-y-auto overflow-x-hidden custom-scrollbar">
          {isSidebarExpanded && <p className="px-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Main Menu</p>}
          
          {[
            { id: 'hris', icon: Users, label: 'HRIS Dashboard' },
            { id: 'task', icon: CheckSquare, label: 'Task Management', restricted: true },
            { id: 'laporan', icon: FileText, label: 'Laporan & Pengajuan' },
            { id: 'finance', icon: Wallet, label: 'Finance Dashboard' }
          ].map((item) => (
            <button key={item.id} 
              disabled={item.restricted && currentUser.role === 'staff' && !employees.find(e => e.id === currentUser.id)?.hasTaskAccess}
              onClick={() => {setActiveMenu(item.id); setSelectedTask(null);}}
              className={`flex items-center w-full rounded-xl font-medium text-sm transition-all overflow-hidden whitespace-nowrap
                ${activeMenu === item.id ? `${appConfig.light} ${appConfig.text}` : 'text-slate-600 hover:bg-slate-50'}
                ${isSidebarExpanded ? 'gap-3 px-4 py-3.5' : 'justify-center p-3.5'}
                ${(item.restricted && currentUser.role === 'staff' && !employees.find(e => e.id === currentUser.id)?.hasTaskAccess) ? 'opacity-30 cursor-not-allowed' : ''}
              `}>
              <item.icon size={20} className={`shrink-0 ${activeMenu === item.id ? appConfig.text : 'text-slate-400'}`} />
              {isSidebarExpanded && <span>{item.label}</span>}
            </button>
          ))}

          <div className="pt-4 mt-4 border-t border-slate-100">
            {isSidebarExpanded && <p className="px-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">System</p>}
            <button onClick={() => setActiveMenu('settings')} title={!isSidebarExpanded ? "Konfigurasi Akses" : ''}
              className={`flex items-center w-full rounded-xl font-medium text-sm transition-all overflow-hidden whitespace-nowrap
                ${activeMenu === 'settings' ? `${appConfig.light} ${appConfig.text}` : 'text-slate-600 hover:bg-slate-50'}
                ${isSidebarExpanded ? 'gap-3 px-4 py-3.5' : 'justify-center p-3.5'}
              `}>
              <Settings size={20} className={`shrink-0 ${activeMenu === 'settings' ? appConfig.text : 'text-slate-400'}`} />
              {isSidebarExpanded && <span>Konfigurasi Akses</span>}
            </button>
          </div>
        </nav>
      </aside>

      {/* KONTEN UTAMA */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        
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
                  <p className="text-xs text-slate-500">{appConfig.name}</p>
                </div>
                <button className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-3"><UserCircle size={18} className="text-slate-400"/> Profil Saya</button>
                <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-3 mt-1"><LogOut size={18} className="text-rose-400"/> Keluar Sistem</button>
              </div>
            )}
          </div>
        </header>

        <header className="md:hidden bg-blue-600 px-5 pt-10 pb-6 rounded-b-3xl shadow-md text-white z-10 shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center font-bold text-blue-600 shadow-inner">{appConfig.short}</div>
              <div>
                <p className="text-[10px] text-blue-200 uppercase tracking-widest font-semibold mb-0.5">Admin Portal</p>
                <h1 className="font-bold text-lg leading-tight">{appConfig.name}</h1>
              </div>
            </div>
            <button className="relative p-2 bg-white/20 rounded-full backdrop-blur-sm">
              <Bell size={20} className="text-white" />
              <span className="absolute top-1.5 right-2 w-2 h-2 bg-rose-500 rounded-full border border-blue-600"></span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 pb-28 md:pb-8 md:p-8 bg-slate-50/50 custom-scrollbar">
          <div className="w-full"> 

            {/* HRIS DASHBOARD */}
            {activeMenu === 'hris' && (
              <div className="space-y-6 fade-in">
                
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">HRIS & Recruitment</h2>
                    <p className="text-slate-500 text-sm mt-1">Kelola database karyawan, absensi, dan data pelamar baru.</p>
                  </div>
                  <span className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 flex items-center gap-2 shadow-sm w-max"><Clock size={14}/> Hari Ini</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
                  <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100">
                    <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase">Total Karyawan</p>
                    <h3 className="text-2xl md:text-3xl font-black text-slate-800 mt-1 md:mt-2">{employees.length}</h3>
                    <p className="text-[10px] md:text-xs text-blue-600 font-medium mt-1">Berstatus Aktif</p>
                  </div>
                  <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100">
                    <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase">Pelamar Baru</p>
                    <h3 className="text-2xl md:text-3xl font-black text-slate-800 mt-1 md:mt-2">{candidates.filter(c => c.status === 'PENDING').length}</h3>
                    <p className="text-[10px] md:text-xs text-amber-500 font-medium mt-1">Menunggu Review</p>
                  </div>
                  <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100">
                    <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase">Hadir Hari Ini</p>
                    <h3 className="text-2xl md:text-3xl font-black text-emerald-600 mt-1 md:mt-2">{attendances.filter(a => a.date === new Date().toISOString().split('T')[0]).length}</h3>
                    <p className="text-[10px] md:text-xs text-slate-500 font-medium mt-1">Check-in tercatat</p>
                  </div>
                </div>

                <div className="flex overflow-x-auto hide-scrollbar p-1.5 bg-slate-200/50 rounded-xl w-full">
                  {[
                    { id: 'absensi', icon: CheckSquare, label: 'Data Absensi' },
                    { id: 'recruitment', icon: UserPlus, label: 'Data Recruitment & QR' },
                    { id: 'database', icon: Database, label: 'Database Karyawan' },
                  ].map((tab) => (
                    <button key={tab.id} onClick={() => setHrisTab(tab.id)}
                      className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2.5 px-4 whitespace-nowrap text-sm font-semibold rounded-lg transition-all ${hrisTab === tab.id ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}>
                      <tab.icon size={16} className={hrisTab === tab.id ? 'text-blue-600' : 'text-slate-400'}/> {tab.label}
                    </button>
                  ))}
                </div>

                {hrisTab === 'absensi' && (
                  <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden fade-in space-y-4 p-4 md:p-5">
                    <div className="flex flex-col md:flex-row justify-between gap-4 border-b border-slate-100 pb-4">
                      <div className="flex flex-col md:flex-row gap-3 flex-1">
                        <div className="relative flex-1">
                          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input type="text" placeholder="Cari Nama Pegawai..." value={filterNama} onChange={e => setFilterNama(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400"/>
                        </div>
                        <input type="text" placeholder="Filter Area Lokasi..." value={filterLokasi} onChange={e => setFilterLokasi(e.target.value)} className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400"/>
                        <input type="date" value={filterTanggal} onChange={e => setFilterTanggal(e.target.value)} className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400"/>
                      </div>
                      <div className="flex flex-wrap gap-2 shrink-0">
                        <button onClick={downloadTemplateAbsen} className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-2 rounded-lg text-xs font-bold transition-colors">Template Excel</button>
                        <button onClick={() => alert("Fitur Import CSV/Excel berjalan via backend parser.")} className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 px-3 py-2 rounded-lg text-xs font-bold transition-colors">Import Data</button>
                      </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                          <tr><th className="px-6 py-4">Tanggal</th><th className="px-6 py-4">Pegawai</th><th className="px-6 py-4">Lokasi & Foto</th><th className="px-6 py-4">Waktu (IN/OUT)</th><th className="px-6 py-4 text-center">Aksi</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                          {attendances.filter(a => {
                            const matchNama = (a.employees?.nama_lengkap || '').toLowerCase().includes(filterNama.toLowerCase());
                            const matchLokasi = (a.location_gps || '').toLowerCase().includes(filterLokasi.toLowerCase());
                            const matchTanggal = filterTanggal === '' || a.date === filterTanggal;
                            return matchNama && matchLokasi && matchTanggal;
                          }).map(att => (
                            <tr key={att.id} className="hover:bg-slate-50">
                              <td className="px-6 py-4 font-bold text-slate-700">{att.date}</td>
                              <td className="px-6 py-4 font-bold text-slate-800">{att.employees?.nama_lengkap || 'Karyawan Dihapus'}</td>
                              <td className="px-6 py-4">
                                <span className="text-xs font-bold text-slate-500 block mb-1"><MapPin size={12} className="inline mr-1 text-blue-500"/>{att.location_gps}</span>
                                <div className="flex gap-2 mt-1">
                                  {att.photo_url ? <a href={att.photo_url} target="_blank" rel="noreferrer" className="text-[10px] font-black text-emerald-600 hover:underline bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">Foto IN</a> : <span className="text-[10px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded">No IN</span>}
                                  {att.photo_out_url ? <a href={att.photo_out_url} target="_blank" rel="noreferrer" className="text-[10px] font-black text-rose-600 hover:underline bg-rose-50 px-2 py-0.5 rounded border border-rose-100">Foto OUT</a> : <span className="text-[10px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded">No OUT</span>}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className="font-black text-emerald-600 block">IN: {att.check_in_time ? att.check_in_time.substring(0,5) : '--:--'}</span>
                                <span className="font-black text-slate-500 block mt-0.5">OUT: {att.check_out_time ? att.check_out_time.substring(0,5) : '--:--'}</span>
                              </td>
                              <td className="px-6 py-4 text-center align-middle">
                                <div className="flex justify-center gap-2">
                                  <button onClick={() => handleDeleteAbsen(att.id)} className="p-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors"><Trash2 size={16}/></button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {attendances.length === 0 && <tr><td colSpan="5" className="text-center py-8 text-slate-400 font-bold">Belum ada data absensi yang cocok.</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {hrisTab === 'recruitment' && (
                  <div className="space-y-6 fade-in">
                    <div className="bg-blue-600 p-6 md:p-8 rounded-2xl shadow-md text-white flex flex-col md:flex-row items-center justify-between gap-6">
                      <div>
                        <h3 className="text-xl font-bold mb-2 flex items-center gap-2"><QrCode size={24}/> Form Pendaftaran Online</h3>
                        <p className="text-blue-100 text-sm max-w-md leading-relaxed">Cetak atau bagikan kode QR ini kepada calon pelamar. Pelamar dapat langsung mengisi data diri melalui smartphone mereka secara mandiri.</p>
                      </div>
                      <div className="bg-white p-4 rounded-xl shrink-0">
                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${window.location.origin}/recruitment`} alt="QR Form" className="w-32 h-32" />
                      </div>
                    </div>

                    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                      <div className="p-4 md:p-5 border-b border-slate-100 bg-amber-50/30 flex justify-between items-center">
                        <h3 className="font-bold text-amber-900 text-sm md:text-base flex items-center gap-2"><UserPlus size={18} className="text-amber-500"/> Daftar Pelamar Baru Menunggu Review</h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                            <tr><th className="px-6 py-4">Nama Pelamar</th><th className="px-6 py-4">Posisi Dilamar</th><th className="px-6 py-4">No. HP</th><th className="px-6 py-4 text-center">Aksi</th></tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-sm">
                            {candidates.filter(c => c.status === 'PENDING').map(c => (
                              <tr key={c.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4"><span className="font-bold text-slate-800 block">{c.nama_lengkap}</span></td>
                                <td className="px-6 py-4"><span className="block font-bold text-slate-700">{c.posisi_jabatan}</span></td>
                                <td className="px-6 py-4"><span className="text-xs font-bold text-slate-700">{c.no_hp || '-'}</span></td>
                                <td className="px-6 py-4 text-center">
                                  <button className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors">Review Berkas</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
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
                          {employees.map(e => (
                            <tr key={e.id} className="hover:bg-slate-50">
                              <td className="px-6 py-4"><span className="font-bold text-slate-800 block">{e.nama_lengkap}</span></td>
                              <td className="px-6 py-4"><span className="block font-bold text-slate-700">{e.bidang_jasa}</span></td>
                              <td className="px-6 py-4"><span className="text-xs font-bold text-slate-700">{e.lokasi_penempatan}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* FINANCE DASHBOARD */}
            {activeMenu === 'finance' && (
              <div className="space-y-6 fade-in">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Finance & Accounting</h2>
                    <p className="text-slate-500 text-sm mt-1">Kelola arus kas, penggajian, dan tagihan invoice perusahaan.</p>
                  </div>
                </div>

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

                {financeTab === 'overview' && (
                  <div className="space-y-6 fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-lg flex flex-col justify-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 blur-2xl rounded-full -translate-y-1/2 translate-x-1/2"></div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">Saldo Kas Aktif</span>
                        <h3 className="text-3xl font-black text-emerald-400">Rp 45.500.000</h3>
                        <p className="text-[9px] text-slate-400 mt-3 border-t border-slate-800 pt-2 leading-relaxed">Total Pemasukan dikurangi Pengeluaran.</p>
                      </div>
                      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-center relative overflow-hidden">
                        <div className="absolute right-6 opacity-10"><TrendingUp size={48} className="text-blue-500"/></div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">Pemasukan (Bulan Ini)</span>
                        <h3 className="text-2xl font-black text-slate-800">Rp 25.000.000</h3>
                        <p className="text-[9px] text-slate-500 mt-3 border-t border-slate-100 pt-2 leading-relaxed">Total Transaksi INCOME berstatus LUNAS.</p>
                      </div>
                      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-center relative overflow-hidden">
                        <div className="absolute right-6 opacity-10"><TrendingDown size={48} className="text-red-500"/></div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">Pengeluaran (Bulan Ini)</span>
                        <h3 className="text-2xl font-black text-slate-800">Rp 4.700.000</h3>
                        <p className="text-[9px] text-slate-500 mt-3 border-t border-slate-100 pt-2 leading-relaxed">Total Transaksi EXPENSE berstatus LUNAS.</p>
                      </div>
                    </div>
                  </div>
                )}
                {financeTab !== 'overview' && (
                  <div className="bg-white p-8 rounded-2xl border border-slate-100 text-center text-slate-400 font-bold">
                    Modul detail {financeTab} sedang disiapkan.
                  </div>
                )}
              </div>
            )}

            {/* TASK MANAGEMENT */}
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

            {/* LAPORAN & PENGAJUAN */}
            {activeMenu === 'laporan' && (
              <div className="space-y-6 fade-in">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Laporan & Pengajuan</h2>
                    <p className="text-slate-500 text-sm mt-1">Pantau seluruh laporan masuk dari Mobile App karyawan lapangan.</p>
                  </div>
                </div>
                <div className="flex overflow-x-auto hide-scrollbar p-1.5 bg-slate-200/50 rounded-xl w-full">
                  {[
                    { id: 'laporan_lapangan', label: 'Laporan Patroli & Reguler' },
                    { id: 'cuti', label: 'Pengajuan Cuti/Izin' },
                    { id: 'koreksi', label: 'Perbaikan Absen' },
                    { id: 'reimburse', label: 'Reimbursement' },
                  ].map((tab) => (
                    <button key={tab.id} onClick={() => setLaporanTab(tab.id)}
                      className={`flex-1 min-w-[150px] py-2.5 px-4 whitespace-nowrap text-sm font-semibold rounded-lg transition-all ${laporanTab === tab.id ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}>
                      {tab.label}
                    </button>
                  ))}
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                      {/* --- BARIS FILTER --- */}
                      {laporanTab === 'laporan_lapangan' && (
                        <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-col md:flex-row gap-3">
                          <div className="relative flex-1">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input type="text" placeholder="Cari Nama Karyawan..." value={filterReportName} onChange={e => setFilterReportName(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-[#0a195c] transition-colors"/>
                          </div>
                          <input type="text" placeholder="Cari Judul Laporan..." value={filterReportTitle} onChange={e => setFilterReportTitle(e.target.value)} className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-[#0a195c] transition-colors"/>
                          <input type="date" value={filterReportDate} onChange={e => setFilterReportDate(e.target.value)} className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-[#0a195c] text-slate-500 transition-colors"/>
                          <select value={filterReportType} onChange={e => setFilterReportType(e.target.value)} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-[#0a195c] font-bold text-slate-600 transition-colors cursor-pointer">
                            <option value="Semua">Semua Tipe</option>
                            <option value="patroli">Khusus Patroli</option>
                            <option value="reguler">Khusus Reguler</option>
                          </select>
                        </div>
                      )}

                      {/* --- TABEL AKORDION --- */}
                      <table className="w-full text-left">
                        <thead className="bg-white border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                          <tr><th className="px-6 py-4 w-40">Tanggal Masuk</th><th className="px-6 py-4 w-56">Pelapor (Mobile App)</th><th className="px-6 py-4">Judul & Keterangan Laporan</th><th className="px-6 py-4 text-center w-24">Detail</th></tr>
                        </thead>
                        
                        {(() => {
                          // 1. Eksekusi Filter
                          const filteredReports = fieldReports.filter(r => {
                            if (laporanTab !== 'laporan_lapangan') return r.report_type.toLowerCase() === laporanTab;
                            
                            const matchTab = r.report_type === 'patroli' || r.report_type === 'reguler';
                            const matchType = filterReportType === 'Semua' || r.report_type === filterReportType;
                            const matchName = (r.employees?.nama_lengkap || '').toLowerCase().includes(filterReportName.toLowerCase());
                            const matchTitle = (r.title || '').toLowerCase().includes(filterReportTitle.toLowerCase());
                            const matchDate = filterReportDate === '' || r.created_at.startsWith(filterReportDate);

                            return matchTab && matchType && matchName && matchTitle && matchDate;
                          });

                          // 2. Tampilan Jika Kosong
                          if (filteredReports.length === 0) {
                            return <tbody><tr><td colSpan="4" className="text-center py-12 text-slate-400 font-bold"><FileText size={32} className="mx-auto text-slate-200 mb-3"/>Tidak ada laporan yang cocok dengan filter.</td></tr></tbody>;
                          }

                          // 3. Render Data Akordion
                          return filteredReports.map(report => {
                            let parsedDesc = null;
                            try { parsedDesc = JSON.parse(report.description); } catch (e) {}

                            const isExpanded = expandedReportId === report.id;

                            return (
                              <tbody key={report.id} className="divide-y divide-slate-100 border-b border-slate-100 last:border-0">
                                
                                {/* --- BARIS UTAMA (Bisa Di-Klik) --- */}
                                <tr onClick={() => setExpandedReportId(isExpanded ? null : report.id)} className={`hover:bg-slate-50 cursor-pointer transition-colors ${isExpanded ? 'bg-blue-50/20' : ''}`}>
                                  <td className="px-6 py-4 align-top">
                                    <span className="font-bold text-slate-700 block">{new Date(report.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                    <span className="text-[10px] text-slate-500 font-bold mt-1.5 bg-slate-100 px-2.5 py-1 rounded-md inline-flex items-center gap-1"><Clock size={10}/> {new Date(report.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</span>
                                  </td>
                                  
                                  <td className="px-6 py-4 align-top font-bold text-slate-800">
                                    <div className="flex items-center gap-3">
                                      <div className="w-9 h-9 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-black shadow-inner shrink-0">
                                        {report.employees?.nama_lengkap ? report.employees.nama_lengkap.substring(0,2).toUpperCase() : '??'}
                                      </div>
                                      <span>{report.employees?.nama_lengkap || 'Unknown'}</span>
                                    </div>
                                  </td>
                                  
                                  <td className="px-6 py-4 align-middle">
                                    <span className="font-black text-blue-700 text-base flex items-center gap-2">
                                      <ShieldAlert size={18} className="text-blue-500"/> {report.title}
                                    </span>
                                  </td>

                                  <td className="px-6 py-4 align-middle text-center">
                                    <button className={`p-2 rounded-full transition-all ${isExpanded ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 hover:bg-slate-200 text-slate-500'}`}>
                                        <ChevronRight size={18} className={`transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} />
                                    </button>
                                  </td>
                                </tr>
                                
                                {/* --- BARIS DETAIL (Terbuka Jika Di-Klik) --- */}
                                {isExpanded && (
                                  <tr className="bg-slate-50/30">
                                    <td></td>
                                    <td colSpan="3" className="px-6 py-6 pb-10 border-l-2 border-blue-200">
                                      {parsedDesc ? (
                                        <div className="space-y-5 max-w-4xl animate-in slide-in-from-top-4 fade-in duration-300">
                                          {parsedDesc.notes && (
                                            <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 shadow-sm relative overflow-hidden">
                                              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-300/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                                              <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest block mb-2">Kesimpulan Situasi:</span>
                                              <p className="text-sm text-slate-800 font-medium leading-relaxed relative z-10">{parsedDesc.notes}</p>
                                            </div>
                                          )}
                                          
                                          {parsedDesc.photos && parsedDesc.photos.length > 0 && (
                                            <div className="flex flex-wrap gap-4">
                                              {parsedDesc.photos.map((p, i) => (
                                                <div key={i} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col w-56 group">
                                                  <div className="relative h-44 bg-slate-100 overflow-hidden">
                                                    <img src={p.url} alt="Lampiran" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a195c]/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-3">
                                                      <a href={p.url} target="_blank" rel="noreferrer" className="text-xs font-bold text-white flex items-center gap-1 hover:underline"><ArrowUpRight size={14}/> Buka Full</a>
                                                    </div>
                                                  </div>
                                                  <div className="p-3 bg-white">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1"><Camera size={12}/> Lampiran {i+1}</p>
                                                    <p className="text-[11px] text-slate-700 font-medium leading-snug">
                                                      {p.desc || <span className="italic text-slate-400">Tidak ada keterangan lampiran.</span>}
                                                    </p>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      ) : (
                                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm inline-block max-w-xl animate-in slide-in-from-top-4 fade-in">
                                          <span className="text-sm text-slate-600 leading-relaxed font-medium">{report.description}</span>
                                        </div>
                                      )}
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            );
                          });
                        })()}
                      </table>
                    </div>
                </div>
            )}

            {/* PENGATURAN AKSES & SISTEM (CLIENT & GEO-FENCING UPDATED) */}
            {activeMenu === 'settings' && (
              <div className="space-y-6 fade-in">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Konfigurasi Sistem & Akses</h2>
                  <p className="text-slate-500 text-sm mt-1">Kelola perizinan menu per pengguna, otoritas jabatan, dan parameter operasional.</p>
                </div>

                <div className="flex gap-2 border-b border-slate-200 pb-px">
                   <button onClick={() => setSettingTab('user_access')} className={`px-5 py-3 text-sm font-bold border-b-2 transition-colors ${settingTab === 'user_access' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>Akses Per Pegawai</button>
                   <button onClick={() => setSettingTab('gps_rules')} className={`px-5 py-3 text-sm font-bold border-b-2 transition-colors ${settingTab === 'gps_rules' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>Aturan GPS & Absensi</button>
                </div>

                {settingTab === 'user_access' && (
                  <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                        <tr><th className="px-6 py-4">Nama Pegawai</th><th className="px-6 py-4 text-center">Tindakan</th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {activeEmployees.map(emp => (
                          <tr key={emp.id} className="hover:bg-slate-50">
                            <td className="px-6 py-4"><span className="font-bold text-slate-800 block">{emp.nama_lengkap}</span></td>
                            <td className="px-6 py-4 text-center">
                               <button onClick={() => { 
                                 setSelectedEmployeeAccess(emp); 
                                 const perms = typeof emp.permissions === 'string' ? JSON.parse(emp.permissions) : (emp.permissions || {});
                                 setEditPermissions({ patroli: !!perms.patroli, reguler: !!perms.reguler, cuti: !!perms.cuti, koreksi: !!perms.koreksi, reimburse: !!perms.reimburse, bebas_gps: !!perms.bebas_gps });
                                 setIsAccessModalOpen(true); 
                               }} className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors">Atur Akses</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* MANAJEMEN LOKASI BERCABANG (GEO-FENCING MENGGUNAKAN TABEL CLIENTS) */}
                {settingTab === 'gps_rules' && (
                  <div className="space-y-6 fade-in">
                    <div className="flex justify-between items-center bg-blue-50 p-4 rounded-xl border border-blue-100">
                      <div>
                        <h3 className="font-bold text-blue-900 flex items-center gap-2"><FolderTree size={18}/> Hierarki Klien & Titik Absensi</h3>
                        <p className="text-xs text-blue-700 mt-1">Buat Cabang Klien, lalu tambahkan titik lokasi (Geo-Fencing) di dalam cabang tersebut.</p>
                      </div>
                      <button onClick={() => { setClientForm({ id: null, name: '', status: 'ACTIVE' }); setIsClientModalOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-2 shrink-0">
                        <Plus size={16}/> Tambah Cabang Klien
                      </button>
                    </div>
                    
                    {/* Render Setiap Klien/Cabang menjadi Tabel Tersendiri */}
                    {clientsList.map(client => (
                      <div key={client.id} className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
                        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <h3 className="font-black text-slate-700 text-base flex items-center gap-2">
                            <Building size={16} className="text-slate-400"/> {client.name}
                          </h3>
                          <div className="flex gap-2">
                             <button onClick={() => { setClientForm({ id: client.id, name: client.name, status: client.status }); setIsClientModalOpen(true); }} className="text-slate-500 hover:text-blue-600 text-xs font-bold bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">Edit Cabang</button>
                             <button onClick={() => { setLocationForm({ id: null, client_id: client.id, name: '', latitude: '', longitude: '', radius: 50 }); setIsLocationModalOpen(true); }} className="bg-slate-800 hover:bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm flex items-center gap-1">
                               <Plus size={14}/> Tambah Titik di Sini
                             </button>
                          </div>
                        </div>
                        
                        <div className="overflow-x-auto">
                          <table className="w-full text-left">
                            <thead className="bg-white border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                              <tr>
                                <th className="px-6 py-4">Nama Titik Lokasi</th>
                                <th className="px-6 py-4">Titik Koordinat (Lat, Lng)</th>
                                <th className="px-6 py-4">Batas Radius</th>
                                <th className="px-6 py-4 text-center">Aksi</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm bg-white">
                              {/* Filter titik lokasi yang sesuai dengan ID Klien/Cabang ini */}
                              {officeLocations.filter(loc => loc.client_id === client.id).map(loc => (
                                <tr key={loc.id} className="hover:bg-slate-50 transition-colors">
                                  <td className="px-6 py-4 font-bold text-slate-700"><MapPin size={14} className="inline mr-2 text-slate-400"/>{loc.name}</td>
                                  <td className="px-6 py-4 font-medium text-slate-500 font-mono text-xs">{loc.latitude}, {loc.longitude}</td>
                                  <td className="px-6 py-4 font-black text-emerald-600">{loc.radius} Meter</td>
                                  <td className="px-6 py-4 text-center">
                                    <div className="flex justify-center gap-2">
                                      <button onClick={() => { setLocationForm(loc); setIsLocationModalOpen(true); }} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"><FileText size={16}/></button>
                                      <button onClick={() => handleDeleteLocation(loc.id)} className="p-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100"><Trash2 size={16}/></button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                              {officeLocations.filter(loc => loc.client_id === client.id).length === 0 && (
                                <tr><td colSpan="4" className="text-center py-6 text-slate-400 font-bold text-xs bg-slate-50/50">Klien ini belum memiliki titik lokasi absen.</td></tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}

                    {clientsList.length === 0 && (
                       <div className="text-center py-16 bg-white border border-slate-200 border-dashed rounded-3xl">
                          <FolderTree size={48} className="mx-auto text-slate-300 mb-4"/>
                          <h3 className="text-slate-500 font-bold">Belum Ada Klien/Cabang</h3>
                          <p className="text-xs text-slate-400 mt-1 mb-4">Mulai dengan membuat cabang/klien pertama Anda.</p>
                          <button onClick={() => { setClientForm({ id: null, name: '', status: 'ACTIVE' }); setIsClientModalOpen(true); }} className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-sm inline-flex items-center gap-2"><Plus size={16}/> Buat Klien Baru</button>
                       </div>
                    )}
                  </div>
                )}
              </div>
            )}
            </div>
        </div>

        {/* ========================================================= */}
        {/* SEMUA MODAL POP-UP                                        */}
        {/* ========================================================= */}
        
        {/* 1. MODAL TUGAS BARU */}
        {isTaskModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[80] flex justify-center items-end md:items-center md:p-4">
            <div className="bg-white w-full h-[90vh] md:h-auto md:max-w-2xl rounded-t-[2rem] md:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-full md:zoom-in duration-300 relative">
              <div className="px-6 py-5 border-b border-blue-600 bg-blue-600 text-white flex justify-between items-center shrink-0">
                <div><h3 className="font-black text-lg">Buat Tugas Baru</h3></div>
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
                    </label>
                    <div className="max-h-40 overflow-y-auto border-2 border-slate-200 rounded-xl p-3 bg-slate-50 space-y-1 custom-scrollbar">
                      {employeesWithTaskAccess.map(emp => (
                        <label key={emp.id} className="flex items-center gap-3 p-3 bg-white border border-slate-100 hover:border-blue-300 rounded-lg cursor-pointer shadow-sm transition-all">
                          <input type="checkbox" checked={newTask.assignedTo.includes(emp.id)} onChange={(e) => setNewTask(p => ({ ...p, assignedTo: e.target.checked ? [...p.assignedTo, emp.id] : p.assignedTo.filter(id => id !== emp.id) }))} className="w-4 h-4 text-blue-600 rounded border-slate-300" />
                          <div className="flex-1"><span className="text-sm font-bold text-slate-800 block">{emp.nama_lengkap}</span></div>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Deskripsi Lengkap Instruksi</label>
                    <textarea required rows="3" value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 text-sm outline-none font-medium min-h-[100px] bg-slate-50 focus:bg-white transition-all"></textarea>
                  </div>
                </div>
                <div className="p-5 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0 pb-10 md:pb-5">
                  <button type="button" onClick={() => setIsTaskModalOpen(false)} className="px-5 py-3 text-slate-500 hover:bg-slate-200 rounded-xl font-bold text-sm transition-colors">Batal</button>
                  <button type="submit" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-600/20">Kirim Tugas</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 2. MODAL PENGATURAN AKSES USER */}
        {isAccessModalOpen && selectedEmployeeAccess && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[80] flex justify-center items-center p-4">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in duration-300">
              <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div><h3 className="font-black text-lg text-slate-800">Manajer Akses User</h3></div>
                <button onClick={() => setIsAccessModalOpen(false)} className="p-2 bg-slate-200 text-slate-600 rounded-full hover:bg-slate-300"><X size={16}/></button>
              </div>
              <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh] custom-scrollbar">
                {/* Otoritas Menu Mobile App */}
                <div>
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 mb-3">Akses Menu Laporan</h4>
                  <div className="space-y-2">
                    <label className="flex items-center justify-between p-3 border border-slate-100 bg-slate-50 hover:bg-blue-50 rounded-xl cursor-pointer transition-colors">
                      <span className="text-sm font-bold text-slate-700">Laporan Reguler</span>
                      <input type="checkbox" checked={editPermissions.reguler} onChange={(e) => setEditPermissions({...editPermissions, reguler: e.target.checked})} className="w-5 h-5 text-blue-600 rounded-md border-slate-300" />
                    </label>
                    
                    <label className="flex items-center justify-between p-3 border border-slate-100 bg-slate-50 hover:bg-blue-50 rounded-xl cursor-pointer transition-colors">
                      <span className="text-sm font-bold text-slate-700">Laporan Patroli</span>
                      <input type="checkbox" checked={editPermissions.patroli} onChange={(e) => setEditPermissions({...editPermissions, patroli: e.target.checked})} className="w-5 h-5 text-blue-600 rounded-md border-slate-300" />
                    </label>

                    <label className="flex items-center justify-between p-3 border border-slate-100 bg-slate-50 hover:bg-blue-50 rounded-xl cursor-pointer transition-colors">
                      <span className="text-sm font-bold text-slate-700">Reimbursement</span>
                      <input type="checkbox" checked={editPermissions.reimburse} onChange={(e) => setEditPermissions({...editPermissions, reimburse: e.target.checked})} className="w-5 h-5 text-blue-600 rounded-md border-slate-300" />
                    </label>
                  </div>
                </div>

                {/* Otoritas Khusus */}
                <div>
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 mb-3">Otoritas Khusus</h4>
                  <label className="flex items-center justify-between p-3 border border-amber-200 bg-amber-50/50 rounded-xl cursor-pointer transition-colors">
                    <div>
                      <span className="text-sm font-bold text-amber-900 block">Bypass Area GPS Absensi</span>
                      <span className="text-[10px] text-amber-700 leading-tight block mt-0.5">Bisa absen dari lokasi mana saja tanpa terblokir radius.</span>
                    </div>
                    {/* Perbaikan onChange pada checkbox GPS */}
                    <input type="checkbox" checked={editPermissions.bebas_gps} onChange={(e) => setEditPermissions({...editPermissions, bebas_gps: e.target.checked})} className="w-5 h-5 text-amber-600 rounded-md border-amber-300" />
                  </label>
                </div>
              </div>
              <div className="p-5 border-t border-slate-100 bg-white">
                <button onClick={handleSaveUserAccess} className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20">Simpan Konfigurasi</button>
              </div>
            </div>
          </div>
        )}

        {/* 3. MODAL TAMBAH/EDIT CABANG (MENGGUNAKAN TABEL CLIENTS) */}
        {isClientModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[90] flex justify-center items-center p-4">
            <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in duration-300">
              <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-black text-lg text-slate-800 flex items-center gap-2"><Building size={20} className="text-blue-600"/> {clientForm.id ? 'Edit Cabang' : 'Cabang Klien Baru'}</h3>
                <button type="button" onClick={() => setIsClientModalOpen(false)} className="p-2 bg-slate-200 text-slate-600 rounded-full hover:bg-slate-300"><X size={16}/></button>
              </div>
              <form onSubmit={handleSaveClient} className="flex flex-col">
                <div className="p-6 bg-white">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Nama Cabang / Klien</label>
                  <input required type="text" placeholder="Cth: PT Klien Maju Mundur" value={clientForm.name} onChange={e => setClientForm({...clientForm, name: e.target.value})} className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 text-sm outline-none font-bold bg-slate-50 focus:bg-white transition-all"/>
                </div>
                <div className="p-5 bg-slate-50 border-t border-slate-100 flex justify-between gap-3">
                  {clientForm.id ? (
                     <button type="button" onClick={() => handleDeleteClient(clientForm.id)} className="px-4 py-3 text-rose-500 hover:bg-rose-100 rounded-xl font-bold text-sm transition-colors">Hapus</button>
                  ) : <div></div>}
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setIsClientModalOpen(false)} className="px-5 py-3 text-slate-500 hover:bg-slate-200 rounded-xl font-bold text-sm transition-colors">Batal</button>
                    <button type="submit" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-600/20">Simpan</button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 4. MODAL TAMBAH/EDIT LOKASI GEO-FENCING */}
        {isLocationModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[90] flex justify-center items-center p-4">
            <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in duration-300">
              <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-black text-lg text-slate-800 flex items-center gap-2"><MapPin size={20} className="text-blue-600"/> {locationForm.id ? 'Edit Titik Lokasi' : 'Tambah Titik Baru'}</h3>
                <button type="button" onClick={() => setIsLocationModalOpen(false)} className="p-2 bg-slate-200 text-slate-600 rounded-full hover:bg-slate-300"><X size={16}/></button>
              </div>
              <form onSubmit={handleSaveLocation} className="flex flex-col">
                <div className="p-6 space-y-5 overflow-y-auto bg-white max-h-[70vh]">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Titik Untuk Cabang/Klien:</label>
                    <div className="px-4 py-3 border-2 border-blue-100 bg-blue-50 text-blue-800 rounded-xl text-sm font-bold truncate">
                      {clientsList.find(c => c.id === locationForm.client_id)?.name || 'Klien Tidak Ditemukan'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Nama Titik Lokasi</label>
                    <input required type="text" placeholder="Cth: Pintu Utama Barat" value={locationForm.name} onChange={e => setLocationForm({...locationForm, name: e.target.value})} className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 text-sm outline-none font-bold bg-slate-50 focus:bg-white transition-all"/>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Latitude</label>
                      <input required type="number" step="any" placeholder="-6.200000" value={locationForm.latitude} onChange={e => setLocationForm({...locationForm, latitude: e.target.value})} className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 text-sm outline-none font-bold bg-slate-50 focus:bg-white transition-all"/>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Longitude</label>
                      <input required type="number" step="any" placeholder="106.816666" value={locationForm.longitude} onChange={e => setLocationForm({...locationForm, longitude: e.target.value})} className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 text-sm outline-none font-bold bg-slate-50 focus:bg-white transition-all"/>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Batas Radius Absensi (Meter)</label>
                    <div className="relative">
                      <input required type="number" min="10" placeholder="50" value={locationForm.radius} onChange={e => setLocationForm({...locationForm, radius: e.target.value})} className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 text-sm outline-none font-bold bg-slate-50 focus:bg-white transition-all pr-16"/>
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">METER</span>
                    </div>
                  </div>
                </div>
                <div className="p-5 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsLocationModalOpen(false)} className="px-5 py-3 text-slate-500 hover:bg-slate-200 rounded-xl font-bold text-sm transition-colors">Batal</button>
                  <button type="submit" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-600/20">Simpan Titik</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white border-t border-slate-200 flex justify-around items-center px-2 py-3 pb-6 z-40 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
        <button onClick={() => setActiveMenu('hris')} className={`flex flex-col items-center gap-1.5 w-16 transition-colors ${activeMenu === 'hris' ? appConfig.text : 'text-slate-400'}`}>
          <div className={`p-1.5 rounded-xl ${activeMenu === 'hris' ? appConfig.light : 'bg-transparent'}`}><Users size={22} className={activeMenu === 'hris' ? `fill-blue-100 ${appConfig.text}` : ''} /></div>
          <span className={`text-[10px] font-bold ${activeMenu === 'hris' ? appConfig.text : 'font-medium'}`}>HRIS</span>
        </button>
        <button onClick={() => setActiveMenu('task')} className={`flex flex-col items-center gap-1.5 w-16 transition-colors ${activeMenu === 'task' ? appConfig.text : 'text-slate-400'}`}>
          <div className={`p-1.5 rounded-xl ${activeMenu === 'task' ? appConfig.light : 'bg-transparent'}`}><CheckSquare size={22} className={activeMenu === 'task' ? `fill-blue-100 ${appConfig.text}` : ''} /></div>
          <span className={`text-[10px] font-bold ${activeMenu === 'task' ? appConfig.text : 'font-medium'}`}>Task</span>
        </button>
        <button onClick={() => setActiveMenu('finance')} className={`flex flex-col items-center gap-1.5 w-16 transition-colors ${activeMenu === 'finance' ? appConfig.text : 'text-slate-400'}`}>
          <div className={`p-1.5 rounded-xl ${activeMenu === 'finance' ? appConfig.light : 'bg-transparent'}`}><Wallet size={22} className={activeMenu === 'finance' ? `fill-blue-100 ${appConfig.text}` : ''} /></div>
          <span className={`text-[10px] font-bold ${activeMenu === 'finance' ? appConfig.text : 'font-medium'}`}>Finance</span>
        </button>
        <button onClick={() => setActiveMenu('settings')} className={`flex flex-col items-center gap-1.5 w-16 transition-colors ${activeMenu === 'settings' ? appConfig.text : 'text-slate-400'}`}>
          <div className={`p-1.5 rounded-xl ${activeMenu === 'settings' ? appConfig.light : 'bg-transparent'}`}><Settings size={22} className={activeMenu === 'settings' ? `fill-blue-100 ${appConfig.text}` : ''} /></div>
          <span className={`text-[10px] font-bold ${activeMenu === 'settings' ? appConfig.text : 'font-medium'}`}>Sistem</span>
        </button>
      </nav>

    </div>
  );
}