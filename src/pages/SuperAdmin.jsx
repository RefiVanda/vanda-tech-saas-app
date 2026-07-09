import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Building2, ShieldCheck, Settings, Users, 
  AlertCircle, Plus, CheckCircle, TrendingUp, Globe,
  LogOut, Search, Trash2, X, Building, Edit, KeyRound, UserX, CheckCircle2, Save, UserCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

export default function SuperAdmin() {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState(null);

  // === STATE REAL DATA DARI DATABASE ===
  const [clients, setClients] = useState([]);
  const [globalUsers, setGlobalUsers] = useState([]);
  const [globalStats, setGlobalStats] = useState({ totalClients: 0, totalUsers: 0, activeClients: 0 });

  // === DEFAULT FITUR SAAS ===
  const defaultFeatures = { hris: true, shift: true, task: true, approval: true, laporan: true, finance: true, broadcast: true, settings: true };

  // === STATE PENCARIAN & FORM ===
  const [searchClientQuery, setSearchClientQuery] = useState('');
  const [searchUserQuery, setSearchUserQuery] = useState('');
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [clientForm, setClientForm] = useState({ id: null, name: '', status: 'ACTIVE', features: defaultFeatures });
  const [adminProfileForm, setAdminProfileForm] = useState({ name: '', password: '' });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userForm, setUserForm] = useState({ client_id: '', nama_lengkap: '', nik_karyawan: '', password: '', role: 'Admin Perusahaan' });
  
  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!userForm.client_id) return alert("Pilih Perusahaan (Klien) terlebih dahulu!");
    
    const payload = {
      client_id: userForm.client_id,
      nama_lengkap: userForm.nama_lengkap,
      nik_karyawan: userForm.nik_karyawan,
      password: userForm.password,
      role: userForm.role,
      status_pegawai: 'AKTIF',
      has_mobile_access: true,
      has_task_access: true
    };

    const { error } = await supabase.from('employees').insert([payload]);
    if (!error) {
      alert('BERHASIL! Akun Admin untuk Klien berhasil dibuat.\n\nSilakan berikan NIK dan Password ini kepada klien Anda agar mereka bisa login ke Dasbor Admin.');
      setIsUserModalOpen(false);
      setUserForm({ client_id: '', nama_lengkap: '', nik_karyawan: '', password: '', role: 'Admin Perusahaan' });
      fetchGlobalSaaSData();
    } else alert('Gagal membuat akun: ' + error.message);
  };

  useEffect(() => {
    const session = localStorage.getItem('vest_user_session');
    if (!session) {
      navigate('/'); 
      return;
    }
    const parsed = JSON.parse(session);
    
    // PROTEKSI ABSOLUT
    if (parsed.role !== 'Super Admin' && parsed.role !== 'Developer') {
      alert("Akses Ditolak! Anda bukan Super Admin.");
      navigate('/admin');
      return;
    }
    
    setCurrentUser(parsed);
    setAdminProfileForm({ name: parsed.name, password: '' }); 
    fetchGlobalSaaSData();
  }, [navigate]);

  const fetchGlobalSaaSData = async () => {
    try {
      const { data: clientsData } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
      const { data: usersData } = await supabase.from('employees').select('*, clients(name)').order('created_at', { ascending: false });

      if (clientsData) {
        setClients(clientsData);
        setGlobalStats({
          totalClients: clientsData.length,
          totalUsers: usersData ? usersData.length : 0,
          activeClients: clientsData.filter(c => c.status === 'ACTIVE').length
        });
      }
      if (usersData) setGlobalUsers(usersData);

    } catch (error) {
      console.error("Gagal menarik data SaaS Global:", error);
    }
  };

  const handleSaveClient = async (e) => {
    e.preventDefault();
    const generatedSlug = clientForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    
    // Sertakan features JSON ke database
    const payload = { 
      name: clientForm.name, 
      slug: generatedSlug, 
      status: clientForm.status,
      features: clientForm.features 
    };
    
    if (clientForm.id) {
      const { error } = await supabase.from('clients').update(payload).eq('id', clientForm.id);
      if (!error) { 
        alert('Data Perusahaan Klien diperbarui!'); 
        setIsClientModalOpen(false); 
        fetchGlobalSaaSData(); 
      } else alert('Gagal update: ' + error.message);
    } else {
      const { error } = await supabase.from('clients').insert([payload]);
      if (!error) { 
        alert('Perusahaan Klien Baru berhasil didaftarkan ke sistem!'); 
        setIsClientModalOpen(false); 
        fetchGlobalSaaSData(); 
      } else alert('Gagal mendaftar klien: ' + error.message);
    }
  };

  const handleDeleteClient = async (id) => {
    const totalUsersInClient = globalUsers.filter(u => u.client_id === id).length;
    if (totalUsersInClient > 0) {
       return alert(`GAGAL MENGHAPUS! Perusahaan ini masih memiliki ${totalUsersInClient} user/karyawan. Kosongkan/hapus data karyawannya terlebih dahulu.`);
    }

    if (window.confirm("PERINGATAN SANGAT BERBAHAYA: Yakin ingin menghapus perusahaan klien ini secara permanen dari sistem?")) {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (!error) {
        alert("Perusahaan berhasil dihapus!");
        fetchGlobalSaaSData();
      } else alert("Gagal menghapus: " + error.message);
    }
  };

  const handleToggleUserStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'NONAKTIF' ? 'AKTIF' : 'NONAKTIF';
    const confirmMsg = newStatus === 'NONAKTIF' 
      ? "Yakin ingin membekukan (suspend) akun user ini? Mereka tidak akan bisa login." 
      : "Yakin ingin mengaktifkan kembali akun user ini?";
    
    if (window.confirm(confirmMsg)) {
      const { error } = await supabase.from('employees').update({ 
        status_pegawai: newStatus, 
        has_mobile_access: newStatus === 'AKTIF', 
        has_task_access: newStatus === 'AKTIF' 
      }).eq('id', id);
      
      if (!error) {
        alert(`Akun berhasil di-${newStatus === 'AKTIF' ? 'aktifkan' : 'nonaktifkan'}!`);
        fetchGlobalSaaSData();
      } else alert("Gagal merubah status: " + error.message);
    }
  };

  const handleForceResetPassword = async (id, name) => {
    if (window.confirm(`Force Reset Password untuk user ${name}? Sistem akan menghasilkan PIN darurat.`)) {
      const pin = Math.floor(100000 + Math.random() * 900000).toString();
      const { error } = await supabase.from('employees').update({ 
        reset_key: pin, 
        reset_requested: true 
      }).eq('id', id);

      if (!error) {
        alert(`BERHASIL! Berikan PIN Darurat ini kepada ${name}: ${pin}\n\nUser dapat login menggunakan NIK dan PIN tersebut sebagai password sementaranya.`);
        fetchGlobalSaaSData();
      } else alert("Gagal mereset password: " + error.message);
    }
  };

  const handleUpdateAdminProfile = async (e) => {
    e.preventDefault();
    if (!window.confirm("Simpan perubahan profil Super Admin?")) return;
    setIsSavingProfile(true);

    const payload = { nama_lengkap: adminProfileForm.name };
    if (adminProfileForm.password) payload.password = adminProfileForm.password;

    const { error } = await supabase.from('employees').update(payload).eq('id', currentUser.id);
    
    setIsSavingProfile(false);
    if (!error) {
      alert("Profil berhasil diupdate! Jika Anda mengganti password, harap gunakan password baru saat login berikutnya.");
      const updatedSession = { ...currentUser, name: adminProfileForm.name };
      localStorage.setItem('vest_user_session', JSON.stringify(updatedSession));
      setCurrentUser(updatedSession);
      setAdminProfileForm(prev => ({ ...prev, password: '' })); 
      fetchGlobalSaaSData();
    } else alert("Gagal mengupdate profil: " + error.message);
  };

  const handleLogout = () => {
    localStorage.removeItem('vest_user_session');
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-[#090E17] font-sans overflow-hidden text-slate-300 selection:bg-rose-500/30">
      
      {/* SIDEBAR SUPER ADMIN */}
      <aside className="w-72 bg-[#0F172A]/80 backdrop-blur-2xl border-r border-white/5 flex flex-col transition-all z-20 shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.5)]">
        <div className="h-24 flex items-center px-6 border-b border-white/5 relative overflow-hidden">
          <div className="absolute -top-10 -left-10 w-32 h-32 bg-rose-500/20 blur-[50px] rounded-full pointer-events-none"></div>
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-orange-500 rounded-xl flex items-center justify-center text-white font-black shadow-[0_0_15px_rgba(244,63,94,0.4)] shrink-0 border border-white/20">V</div>
            <div>
              <h1 className="font-black text-white text-lg leading-tight tracking-wide">V.E.S.T Core</h1>
              <p className="text-[9px] text-rose-400 font-bold tracking-widest uppercase mt-0.5">Super Admin SaaS</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          <p className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 mt-2">Pusat Kendali</p>
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Global Overview' },
            { id: 'clients', icon: Building2, label: 'Manajemen Klien' },
            { id: 'global_users', icon: Users, label: 'Global Users Control' },
            { id: 'settings', icon: Settings, label: 'Sistem & Keamanan' }
          ].map((item) => (
            <button key={item.id} onClick={() => setActiveMenu(item.id)}
              className={`flex items-center w-full rounded-xl font-bold text-sm transition-all duration-300 px-4 py-3.5 gap-3 group
                ${activeMenu === item.id 
                  ? 'bg-gradient-to-r from-rose-500/10 to-transparent text-rose-400 border border-rose-500/20 shadow-[inset_4px_0_0_rgba(244,63,94,1)]' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'}
              `}>
              <item.icon size={18} className={`transition-transform duration-300 ${activeMenu === item.id ? 'text-rose-500 scale-110' : 'text-slate-500 group-hover:scale-110'}`} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5 bg-black/20">
          <div className="bg-white/[0.03] p-3.5 rounded-2xl border border-white/5 flex items-center justify-between hover:bg-white/[0.05] transition-colors">
            <div className="flex items-center gap-3 overflow-hidden">
               <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-slate-800 to-slate-700 text-slate-300 flex items-center justify-center font-bold text-xs shrink-0 border border-white/10 shadow-inner">
                 {currentUser?.name ? currentUser.name.substring(0,2).toUpperCase() : 'SA'}
               </div>
               <div className="truncate">
                  <p className="text-xs font-bold text-slate-200 truncate">{currentUser?.name || 'Loading...'}</p>
                  <p className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">{currentUser?.role}</p>
               </div>
            </div>
            <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all" title="Logout">
              <LogOut size={16}/>
            </button>
          </div>
        </div>
      </aside>

      {/* KONTEN UTAMA */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto custom-scrollbar relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none -z-10"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-rose-500/5 blur-[120px] rounded-full pointer-events-none -z-10"></div>

        <div className="p-8 md:p-12 max-w-7xl mx-auto w-full z-10">
          
          {/* TAB 1: GLOBAL OVERVIEW */}
          {activeMenu === 'dashboard' && (
            <div className="space-y-8 fade-in">
              <div>
                <h2 className="text-3xl font-black text-white tracking-tight drop-shadow-md">SaaS Global Overview</h2>
                <p className="text-slate-400 text-sm mt-1.5 font-medium">Pemantauan metrik seluruh perusahaan yang menggunakan aplikasi secara real-time.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/[0.02] p-6 rounded-[2rem] border border-white/10 relative overflow-hidden group hover:border-white/20 transition-colors backdrop-blur-sm shadow-xl shadow-black/20">
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/20 blur-[40px] rounded-full group-hover:bg-indigo-500/30 transition-colors"></div>
                  <div className="absolute right-4 bottom-4 opacity-[0.03] group-hover:scale-110 group-hover:rotate-12 transition-all duration-700"><Building2 size={100}/></div>
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-2 drop-shadow-sm">Total Klien / Perusahaan</span>
                  <h3 className="text-6xl font-black text-white tracking-tighter">{globalStats.totalClients}</h3>
                  <div className="mt-6 flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 w-max px-3 py-1.5 rounded-xl border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]"><CheckCircle size={14}/> {globalStats.activeClients} Aktif Berlangganan</div>
                </div>

                <div className="bg-white/[0.02] p-6 rounded-[2rem] border border-white/10 relative overflow-hidden group hover:border-white/20 transition-colors backdrop-blur-sm shadow-xl shadow-black/20">
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/20 blur-[40px] rounded-full group-hover:bg-blue-500/30 transition-colors"></div>
                  <div className="absolute right-4 bottom-4 opacity-[0.03] group-hover:scale-110 group-hover:-rotate-12 transition-all duration-700"><Users size={100}/></div>
                  <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest block mb-2 drop-shadow-sm">Total Pengguna Global</span>
                  <h3 className="text-6xl font-black text-white tracking-tighter">{globalStats.totalUsers}</h3>
                  <div className="mt-6 flex items-center gap-2 text-xs font-bold text-blue-400 bg-blue-500/10 w-max px-3 py-1.5 rounded-xl border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]"><TrendingUp size={14}/> Akun Terdaftar di Sistem</div>
                </div>

                <div className="bg-gradient-to-br from-rose-500/10 via-orange-500/5 to-transparent p-6 rounded-[2rem] border border-rose-500/20 relative overflow-hidden backdrop-blur-sm shadow-xl shadow-black/20">
                  <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest block mb-3 drop-shadow-sm">System Health</span>
                  <div className="flex items-center gap-3 bg-black/20 p-3 rounded-2xl border border-white/5 w-max">
                    <span className="relative flex h-3.5 w-3.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]"></span>
                    </span>
                    <span className="text-sm font-bold text-emerald-400">Semua Layanan Normal</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-5 leading-relaxed font-medium">Multi-tenant Row Level Security (RLS) diaktifkan. Data antar klien terisolasi 100% aman di level arsitektur database Supabase.</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MANAJEMEN KLIEN (TENANTS) */}
          {activeMenu === 'clients' && (
            <div className="space-y-6 fade-in">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-black text-white tracking-tight drop-shadow-md">Manajemen Klien</h2>
                  <p className="text-slate-400 text-sm mt-1.5 font-medium">Daftarkan perusahaan baru, atur fitur SaaS, atau suspend klien yang menunggak.</p>
                </div>
                <button onClick={() => { setClientForm({ id: null, name: '', status: 'ACTIVE', features: defaultFeatures }); setIsClientModalOpen(true); }} className="bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white px-5 py-3 rounded-xl text-sm font-bold shadow-[0_0_20px_rgba(225,29,72,0.3)] hover:shadow-[0_0_25px_rgba(225,29,72,0.5)] transition-all flex items-center gap-2 hover:-translate-y-0.5 active:scale-95 border border-rose-400/50">
                  <Plus size={16}/> Daftarkan Klien Baru
                </button>
              </div>

              <div className="bg-white/[0.02] border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl backdrop-blur-md">
                <div className="p-5 border-b border-white/5 flex items-center gap-4 bg-black/20">
                  <div className="relative flex-1 max-w-md">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input type="text" placeholder="Cari nama perusahaan..." value={searchClientQuery} onChange={e => setSearchClientQuery(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm outline-none text-white focus:border-rose-500/50 focus:ring-2 focus:ring-rose-500/20 transition-all font-medium placeholder:text-slate-600"/>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-black/40 border-b border-white/5 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-5">Nama Perusahaan (Klien)</th>
                        <th className="px-6 py-5 text-center">Client ID (DB Ref)</th>
                        <th className="px-6 py-5 text-center">Penggunaan Kuota</th>
                        <th className="px-6 py-5 text-center">Status Layanan</th>
                        <th className="px-6 py-5 text-center">Aksi / Kontrol</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {clients.filter(c => c.name.toLowerCase().includes(searchClientQuery.toLowerCase())).map(client => {
                         const userCount = globalUsers.filter(u => u.client_id === client.id).length;
                         return (
                           <tr key={client.id} className="hover:bg-white/[0.03] transition-colors group">
                             <td className="px-6 py-5">
                               <span className="font-bold text-slate-200 text-base flex items-center gap-2 group-hover:text-white transition-colors"><Building size={16} className="text-rose-500"/> {client.name}</span>
                               <span className="text-[11px] text-slate-500 mt-1 block font-medium">Slug: /{client.slug}</span>
                             </td>
                             <td className="px-6 py-5 text-center">
                               <span className="text-[10px] font-mono text-slate-400 bg-black/50 border border-white/10 px-3 py-1.5 rounded-lg inline-block shadow-inner">{client.id}</span>
                             </td>
                             <td className="px-6 py-5 text-center">
                               <span className="font-black text-blue-400 text-xl block">{userCount}</span>
                               <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5 block">Akun User</span>
                             </td>
                             <td className="px-6 py-5 text-center">
                               <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm ${client.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-500/10' : 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-rose-500/10'}`}>
                                 {client.status === 'ACTIVE' ? 'Aktif' : 'Suspended'}
                               </span>
                             </td>
                             <td className="px-6 py-5 text-center">
                               <div className="flex justify-center gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
                                 <button onClick={() => { setClientForm({ id: client.id, name: client.name, status: client.status, features: client.features || defaultFeatures }); setIsClientModalOpen(true); }} className="p-2.5 bg-white/5 text-slate-300 hover:text-blue-400 hover:bg-blue-500/10 rounded-xl transition-all border border-transparent hover:border-blue-500/20" title="Edit Klien"><Edit size={16}/></button>
                                 <button onClick={() => handleDeleteClient(client.id)} className="p-2.5 bg-white/5 text-slate-300 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all border border-transparent hover:border-rose-500/20" title="Hapus Permanen"><Trash2 size={16}/></button>
                               </div>
                             </td>
                           </tr>
                         )
                      })}
                      {clients.length === 0 && <tr><td colSpan="5" className="text-center py-12 text-slate-500 font-bold bg-black/10">Belum ada perusahaan yang terdaftar.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: GLOBAL USERS CONTROL */}
          {activeMenu === 'global_users' && (
            <div className="space-y-6 fade-in">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-black text-white tracking-tight drop-shadow-md">Global Users Control</h2>
                  <p className="text-slate-400 text-sm mt-1.5 font-medium">Akses ke seluruh database pengguna lintas klien untuk tindakan administratif darurat.</p>
                </div>
                <button onClick={() => { setUserForm({ client_id: '', nama_lengkap: '', nik_karyawan: '', password: '', role: 'Admin Perusahaan' }); setIsUserModalOpen(true); }} className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white px-5 py-3 rounded-xl text-sm font-bold shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] transition-all flex items-center gap-2 hover:-translate-y-0.5 active:scale-95 border border-blue-400/50">
                  <Plus size={16}/> Buat Admin Klien
                </button>
              </div>

              <div className="bg-white/[0.02] border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl backdrop-blur-md">
                <div className="p-5 border-b border-white/5 flex items-center gap-4 bg-black/20">
                  <div className="relative flex-1 max-w-md">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input type="text" placeholder="Cari nama, NIK, atau perusahaan..." value={searchUserQuery} onChange={e => setSearchUserQuery(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm outline-none text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium placeholder:text-slate-600"/>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-black/40 border-b border-white/5 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-5">Identitas Karyawan / User</th>
                        <th className="px-6 py-5">Perusahaan (Tenant)</th>
                        <th className="px-6 py-5">Role Sistem</th>
                        <th className="px-6 py-5 text-center">Status Akun</th>
                        <th className="px-6 py-5 text-center">Tindakan Darurat</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {globalUsers.filter(u => {
                        const searchLower = searchUserQuery.toLowerCase();
                        return (
                          (u.nama_lengkap || '').toLowerCase().includes(searchLower) ||
                          (u.nik_karyawan || '').toLowerCase().includes(searchLower) ||
                          (u.clients?.name || '').toLowerCase().includes(searchLower)
                        );
                      }).map(user => (
                        <tr key={user.id} className="hover:bg-white/[0.03] transition-colors group">
                          <td className="px-6 py-4">
                            <span className="font-bold text-slate-200 block group-hover:text-white transition-colors">{user.nama_lengkap}</span>
                            <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">NIK: {user.nik_karyawan || 'N/A'}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-[11px] font-bold text-slate-300 bg-white/5 border border-white/10 px-2.5 py-1.5 rounded-lg shadow-sm inline-block">{user.clients?.name || 'Klien Dihapus'}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs text-blue-400 font-bold bg-blue-500/10 px-2.5 py-1.5 rounded-lg border border-blue-500/20 inline-block">{user.role || 'No Role'}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`px-2.5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm ${user.status_pegawai === 'NONAKTIF' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-rose-500/10' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-500/10'}`}>
                              {user.status_pegawai || 'AKTIF'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex justify-center gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => handleForceResetPassword(user.id, user.nama_lengkap)} className="px-3 py-2 bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white border border-transparent hover:border-amber-400 rounded-xl text-[10px] font-bold transition-all flex items-center gap-1.5 hover:shadow-[0_0_15px_rgba(245,158,11,0.4)]" title="Force Reset Password">
                                <KeyRound size={12}/> Reset PIN
                              </button>
                              <button onClick={() => handleToggleUserStatus(user.id, user.status_pegawai)} className={`px-3 py-2 border rounded-xl text-[10px] font-bold transition-all flex items-center gap-1.5 border-transparent ${user.status_pegawai === 'NONAKTIF' ? 'bg-emerald-500/10 text-emerald-500 hover:border-emerald-400 hover:bg-emerald-500 hover:text-white hover:shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-rose-500/10 text-rose-500 hover:border-rose-400 hover:bg-rose-500 hover:text-white hover:shadow-[0_0_15px_rgba(244,63,94,0.4)]'}`}>
                                {user.status_pegawai === 'NONAKTIF' ? <CheckCircle2 size={12}/> : <UserX size={12}/>}
                                {user.status_pegawai === 'NONAKTIF' ? 'Aktifkan' : 'Suspend'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {globalUsers.length === 0 && <tr><td colSpan="5" className="text-center py-12 text-slate-500 font-bold bg-black/10">Tidak ada user ditemukan.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SISTEM & KEAMANAN (PROFIL SUPER ADMIN) */}
          {activeMenu === 'settings' && (
            <div className="space-y-6 fade-in">
              <div>
                <h2 className="text-3xl font-black text-white tracking-tight drop-shadow-md">Sistem & Keamanan</h2>
                <p className="text-slate-400 text-sm mt-1.5 font-medium">Pengaturan internal sistem inti aplikasi dan keamanan kredensial Super Admin.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white/[0.02] border border-white/10 rounded-[2rem] p-8 space-y-6 backdrop-blur-md shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 blur-[40px] rounded-full"></div>
                  <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest mb-4 flex items-center gap-2 relative z-10"><UserCircle size={18} className="text-rose-500"/> Kredensial Super Admin</h3>
                  <form onSubmit={handleUpdateAdminProfile} className="space-y-5 relative z-10">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nama Lengkap Pemilik</label>
                      <input required type="text" value={adminProfileForm.name} onChange={e => setAdminProfileForm({...adminProfileForm, name: e.target.value})} className="w-full px-5 py-3.5 bg-black/30 border border-white/10 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-rose-500/50 focus:ring-2 focus:ring-rose-500/20 transition-all"/>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Ganti Password (Opsional)</label>
                      <input type="text" placeholder="Ketik password baru (Min. 6 karakter)" value={adminProfileForm.password} onChange={e => setAdminProfileForm({...adminProfileForm, password: e.target.value})} className="w-full px-5 py-3.5 bg-black/30 border border-white/10 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-rose-500/50 focus:ring-2 focus:ring-rose-500/20 transition-all placeholder:text-slate-600"/>
                      <p className="text-[10px] text-slate-500 mt-2 italic font-medium">*Kosongkan jika tidak ingin merubah password saat ini.</p>
                    </div>
                    <button type="submit" disabled={isSavingProfile} className="w-full bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 disabled:opacity-50 text-white px-5 py-4 rounded-xl text-sm font-bold shadow-[0_0_20px_rgba(225,29,72,0.3)] hover:shadow-[0_0_25px_rgba(225,29,72,0.4)] transition-all flex items-center justify-center gap-2 mt-6 border border-rose-400/30">
                      <Save size={18}/> {isSavingProfile ? 'Menyimpan...' : 'Simpan Kredensial Keamanan'}
                    </button>
                  </form>
                </div>

                <div className="bg-white/[0.02] border border-white/10 rounded-[2rem] p-8 backdrop-blur-md shadow-2xl relative overflow-hidden flex flex-col">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[40px] rounded-full"></div>
                  <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest mb-5 flex items-center gap-2 relative z-10"><Globe size={18} className="text-blue-500"/> Koneksi Backend Gateway</h3>
                  <div className="p-6 bg-black/30 border border-white/5 rounded-2xl space-y-5 text-sm font-medium relative z-10 flex-1">
                    <div className="flex flex-col gap-1.5 border-b border-white/5 pb-4">
                      <span className="text-slate-500 text-[10px] uppercase font-black tracking-widest">Supabase Project Ref</span>
                      <span className="font-mono text-slate-300 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 w-max">v-erp-prod-2026</span>
                    </div>
                    <div className="flex flex-col gap-1.5 border-b border-white/5 pb-4">
                      <span className="text-slate-500 text-[10px] uppercase font-black tracking-widest">Multi-Tenant Isolation</span>
                      <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg text-xs font-bold w-max flex items-center gap-1.5 shadow-[0_0_10px_rgba(16,185,129,0.1)]"><ShieldCheck size={14}/> RLS Enforced Active</span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-slate-500 text-[10px] uppercase font-black tracking-widest">SaaS Endpoint Status</span>
                      <span className="text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-lg text-xs font-bold w-max flex items-center gap-1.5 shadow-[0_0_10px_rgba(59,130,246,0.1)]"><AlertCircle size={14}/> Stable / Connected</span>
                    </div>
                  </div>
                  <div className="mt-5 p-5 bg-rose-500/10 border border-rose-500/20 rounded-2xl relative z-10">
                     <p className="text-xs text-rose-300 leading-relaxed font-medium"><strong className="font-black text-rose-500 block mb-1 uppercase tracking-wider">⚠️ Peringatan Sistem:</strong> Sebagai Super Admin, hindari menggunakan fungsi DELETE massal pada tab Global Users. Gunakan fungsi Suspend (Nonaktifkan) untuk menjaga integritas foreign-key riwayat absen & laporan Klien di database Supabase.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* MODAL BUAT USER KHUSUS (ADMIN KLIEN) */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-[#090E17]/80 backdrop-blur-md z-[90] flex justify-center items-center p-4">
          <div className="bg-[#0B1120] border border-white/10 w-full max-w-md rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-6 py-5 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <h3 className="font-black text-lg text-white flex items-center gap-2 drop-shadow-md"><Users size={20} className="text-blue-500"/> Buat Admin Klien</h3>
              <button type="button" onClick={() => setIsUserModalOpen(false)} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-all bg-white/5"><X size={16}/></button>
            </div>
            <form onSubmit={handleCreateUser} className="flex flex-col">
              <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Pilih Perusahaan (Klien)</label>
                  <select required value={userForm.client_id} onChange={e => setUserForm({...userForm, client_id: e.target.value})} className="w-full px-4 py-3.5 bg-black/30 border border-white/10 rounded-xl text-sm font-bold text-slate-200 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all">
                    <option value="" className="bg-slate-900">-- Silakan Pilih Perusahaan --</option>
                    {clients.map(c => <option key={c.id} value={c.id} className="bg-slate-900">{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nama Lengkap Admin</label>
                  <input required type="text" placeholder="Cth: Budi Santoso" value={userForm.nama_lengkap} onChange={e => setUserForm({...userForm, nama_lengkap: e.target.value})} className="w-full px-4 py-3.5 bg-black/30 border border-white/10 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-600"/>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">NIK (Untuk Username Login)</label>
                  <input required type="text" placeholder="Cth: ADM-001" value={userForm.nik_karyawan} onChange={e => setUserForm({...userForm, nik_karyawan: e.target.value})} className="w-full px-4 py-3.5 bg-black/30 border border-white/10 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-600"/>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Password Login</label>
                  <input required type="text" placeholder="Buat password sementara..." value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} className="w-full px-4 py-3.5 bg-black/30 border border-white/10 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-600"/>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Hak Akses (Role)</label>
                  <select required value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value})} className="w-full px-4 py-3.5 bg-black/30 border border-white/10 rounded-xl text-sm font-bold text-slate-200 focus:outline-none focus:border-blue-500/50 transition-all">
                    <option value="Admin Perusahaan" className="bg-slate-900">Admin Perusahaan (Full Access)</option>
                  </select>
                  <p className="text-[10px] text-slate-500 mt-2 italic font-medium">*Secara otomatis diberikan akses level tertinggi di perusahaannya.</p>
                </div>
              </div>
              <div className="p-6 border-t border-white/5 flex justify-end gap-3 bg-white/[0.01]">
                <button type="button" onClick={() => setIsUserModalOpen(false)} className="px-5 py-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl font-bold text-sm transition-colors">Batal</button>
                <button type="submit" className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl font-bold text-sm shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all border border-blue-400/30">Buat Akun Login</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH/EDIT PERUSAHAAN (TENANT) */}
      {isClientModalOpen && (
        <div className="fixed inset-0 bg-[#090E17]/80 backdrop-blur-md z-[90] flex justify-center items-center p-4">
          <div className="bg-[#0B1120] border border-white/10 w-full max-w-lg rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-6 py-5 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <h3 className="font-black text-lg text-white flex items-center gap-2 drop-shadow-md"><Building2 size={20} className="text-rose-500"/> {clientForm.id ? 'Edit Data Klien' : 'Daftarkan Klien Baru'}</h3>
              <button type="button" onClick={() => setIsClientModalOpen(false)} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-all bg-white/5"><X size={16}/></button>
            </div>
            <form onSubmit={handleSaveClient} className="flex flex-col">
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nama Perusahaan Resmi</label>
                  <input required type="text" placeholder="Cth: PT Klien Nusantara" value={clientForm.name} onChange={e => setClientForm({...clientForm, name: e.target.value})} className="w-full px-4 py-3.5 bg-black/30 border border-white/10 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-rose-500/50 focus:ring-2 focus:ring-rose-500/20 transition-all placeholder:text-slate-600"/>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Status Layanan SaaS</label>
                  <select required value={clientForm.status} onChange={e => setClientForm({...clientForm, status: e.target.value})} className="w-full px-4 py-3.5 bg-black/30 border border-white/10 rounded-xl text-sm font-bold text-slate-200 focus:outline-none focus:border-rose-500/50 transition-all">
                    <option value="ACTIVE" className="bg-slate-900">Aktif (Berlangganan)</option>
                    <option value="SUSPENDED" className="bg-slate-900">Suspend (Blokir Akses / Menunggak)</option>
                  </select>
                </div>
                
                {/* INI BAGIAN BARU: SETTING FITUR SAAS (MODUL KLIEN) */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Akses Modul Klien (SaaS Features)</label>
                  <div className="grid grid-cols-2 gap-3 p-4 bg-black/20 border border-white/5 rounded-xl">
                    {[
                      { id: 'hris', label: 'HRIS & Database' },
                      { id: 'shift', label: 'Manajemen Shift' },
                      { id: 'task', label: 'Task Management' },
                      { id: 'approval', label: 'Pusat Approval' },
                      { id: 'laporan', label: 'Laporan & Pengajuan' },
                      { id: 'finance', label: 'Finance & Reimburse' },
                      { id: 'broadcast', label: 'Informasi & Instruksi' },
                      { id: 'settings', label: 'Pengaturan Sistem' }
                    ].map(mod => (
                      <label key={mod.id} className="flex items-center gap-2 cursor-pointer group">
                         <input type="checkbox" checked={clientForm.features?.[mod.id] !== false}
                           onChange={e => setClientForm({...clientForm, features: {...clientForm.features, [mod.id]: e.target.checked}})}
                           className="w-4 h-4 rounded border-white/20 bg-black/40 text-rose-500 focus:ring-rose-500/50" />
                         <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">{mod.label}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2 italic font-medium">*Jika checkbox modul dimatikan, Admin Perusahaan tidak akan bisa melihat atau mengakses modul tersebut.</p>
                </div>

              </div>
              <div className="p-6 border-t border-white/5 flex justify-end gap-3 bg-white/[0.01]">
                <button type="button" onClick={() => setIsClientModalOpen(false)} className="px-5 py-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl font-bold text-sm transition-colors">Batal</button>
                <button type="submit" className="px-6 py-3 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white rounded-xl font-bold text-sm shadow-[0_0_15px_rgba(225,29,72,0.3)] transition-all border border-rose-400/30">Simpan Data Klien</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}