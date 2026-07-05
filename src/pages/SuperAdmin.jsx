import { useState } from 'react';
import { 
  LayoutDashboard, 
  Building2, 
  ShieldCheck, 
  Settings, 
  Users, 
  AlertCircle, 
  Plus, 
  CheckCircle,
  TrendingUp,
  Globe,
  Palette
} from 'lucide-react';

export default function SuperAdmin() {
  // Navigation State
  const [activeMenu, setActiveMenu] = useState('dashboard');

  // ==========================================
  // === START: STATE DATA DUMMY (TENANT) ===
  // ==========================================
  // Simulasi database klien untuk fitur Manajemen Klien & Hak Akses
  const [clients, setClients] = useState([
    { 
      id: 1, 
      name: "PT Nusantara Jaya", 
      slug: "nusantara", 
      themeColor: "bg-blue-600",
      status: "Aktif", 
      features: ["HRIS", "Task Management", "Finance"],
      userCount: 145,
      lastReport: "Laporan Patroli Pos 3 selesai (10 menit lalu)"
    },
    { 
      id: 2, 
      name: "Maju Mapan Site Cilegon", 
      slug: "majumapan", 
      themeColor: "bg-emerald-600",
      status: "Aktif", 
      features: ["HRIS", "Task Management"],
      userCount: 82,
      lastReport: "Absen masuk shift malam overload (1 jam lalu)"
    }
  ]);

  // State untuk form tambah klien baru
  const [newClient, setNewClient] = useState({
    name: "",
    slug: "",
    themeColor: "bg-blue-600",
    features: []
  });
  // ==========================================
  // === END: STATE DATA DUMMY (TENANT) ===
  // ==========================================

  // Fungsi pembantu untuk mengaktifkan/menonaktifkan modul fitur klien
  const toggleFeature = (feature) => {
    if (newClient.features.includes(feature)) {
      setNewClient({ ...newClient, features: newClient.features.filter(f => f !== feature) });
    } else {
      setNewClient({ ...newClient, features: [...newClient.features, feature] });
    }
  };

  // Fungsi simpan klien baru
  const handleAddClient = (e) => {
    e.preventDefault();
    if (!newClient.name || !newClient.slug) return;
    
    const clientToAdd = {
      id: clients.length + 1,
      name: newClient.name,
      slug: newClient.slug.toLowerCase().replace(/\s+/g, '-'),
      themeColor: newClient.themeColor,
      status: "Aktif",
      features: newClient.features,
      userCount: 0,
      lastReport: "Belum ada aktivitas"
    };

    setClients([...clients, clientToAdd]);
    setNewClient({ name: "", slug: "", themeColor: "bg-blue-600", features: [] });
  };

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 font-sans overflow-hidden">
      
      {/* ========================================== */}
      {/* === START: GLOBAL SIDEBAR NAVIGATION === */}
      {/* ========================================== */}
      <aside className="w-68 bg-slate-950 border-r border-slate-800 flex flex-col justify-between p-6">
        <div>
          {/* Header Aplikasi */}
          <div className="mb-10 px-2">
            <h1 className="text-2xl font-black tracking-wider text-blue-500">V.E.S.T</h1>
            <p className="text-xs text-slate-500 font-medium tracking-tight">Vanda ERP System Tech • SuperAdmin</p>
          </div>

          {/* Navigasi Utama */}
          <nav className="space-y-2">
            <button 
              onClick={() => setActiveMenu('dashboard')}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl font-medium text-sm transition-all ${activeMenu === 'dashboard' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
            >
              <LayoutDashboard size={18} /> Dashboard Analitik
            </button>
            <button 
              onClick={() => setActiveMenu('clients')}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl font-medium text-sm transition-all ${activeMenu === 'clients' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
            >
              <Building2 size={18} /> Manajemen & Brand Klien
            </button>
            <button 
              onClick={() => setActiveMenu('access')}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl font-medium text-sm transition-all ${activeMenu === 'access' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
            >
              <ShieldCheck size={18} /> Kontrol Hak Akses Global
            </button>
            <button 
              onClick={() => setActiveMenu('settings')}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl font-medium text-sm transition-all ${activeMenu === 'settings' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
            >
              <Settings size={18} /> Pengaturan Global
            </button>
          </nav>
        </div>

        {/* Info Akun Pengembang */}
        <div className="border-t border-slate-800 pt-4 flex items-center gap-3 px-2">
          <div className="w-9 h-9 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center font-bold text-sm">
            RF
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-200">Refi System Owner</p>
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-bold">Root Access</span>
          </div>
        </div>
      </aside>
      {/* ========================================== */}
      {/* === END: GLOBAL SIDEBAR NAVIGATION ===   */}
      {/* ========================================== */}


      {/* Main Content Area Container */}
      <main className="flex-1 flex flex-col overflow-y-auto bg-slate-900">
        
        {/* Topbar Info Ringkas */}
        <header className="border-b border-slate-800 px-8 py-4 flex justify-between items-center bg-slate-950/40 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            <Globe size={14} className="text-blue-500 animate-pulse" />
            <span>SaaS Core Network: Online</span>
          </div>
          <div className="text-sm font-medium text-slate-400">
            Total Perusahaan Klien Aktif: <span className="text-white font-bold">{clients.length}</span>
          </div>
        </header>

        {/* Konten Utama Dinamis */}
        <div className="p-8 max-w-7xl w-full mx-auto space-y-8">

          {/* ========================================== */}
          {/* === REGION: 1. DASHBOARD ANALITIK FITUR === */}
          {/* ========================================== */}
          {activeMenu === 'dashboard' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Dashboard Monitor SaaS</h2>
                <p className="text-slate-400 text-sm">Pantau kondisi infrastruktur, aktivitas klien, dan laporan masuk secara real-time.</p>
              </div>

              {/* Grid Ringkasan Informasi Utama */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl">
                  <span className="text-xs font-semibold text-slate-500 block mb-1">TOTAL PENGGUNA SAAS</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-white">227</span>
                    <span className="text-xs text-emerald-400 font-medium flex items-center gap-0.5"><TrendingUp size={12}/> +12% mtd</span>
                  </div>
                </div>
                <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl">
                  <span className="text-xs font-semibold text-slate-500 block mb-1">LAPORAN KLIEN HARI INI</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-white">48</span>
                    <span className="text-xs text-slate-400">Patroli & Reguler</span>
                  </div>
                </div>
                <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl">
                  <span className="text-xs font-semibold text-slate-500 block mb-1">TOTAL SUBSCRIPTION VALUE</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-blue-400">Active</span>
                    <span className="text-xs text-slate-400">Enterprise Tiers</span>
                  </div>
                </div>
                <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl">
                  <span className="text-xs font-semibold text-slate-500 block mb-1">HEALTH MONITOR</span>
                  <div className="flex items-center gap-2 mt-1">
                    <CheckCircle size={16} className="text-emerald-400" />
                    <span className="text-sm font-medium text-emerald-400">System Stable (99.9%)</span>
                  </div>
                </div>
              </div>

              {/* Grafik Simulasi Menggunakan CSS Grid Pure Tailwind */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-slate-300 mb-6">Grafik Trafik Aktivitas Laporan Klien (7 Hari Terakhir)</h3>
                <div className="h-48 flex items-end justify-between gap-4 pt-4 px-2 border-b border-slate-800">
                  <div className="w-full bg-blue-600/20 hover:bg-blue-600/40 rounded-t-lg transition-all relative group" style={{height: '45%'}}><div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">22</div></div>
                  <div className="w-full bg-blue-600/20 hover:bg-blue-600/40 rounded-t-lg transition-all relative group" style={{height: '60%'}}><div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">30</div></div>
                  <div className="w-full bg-blue-600/20 hover:bg-blue-600/40 rounded-t-lg transition-all relative group" style={{height: '35%'}}><div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">18</div></div>
                  <div className="w-full bg-blue-600/20 hover:bg-blue-600/40 rounded-t-lg transition-all relative group" style={{height: '75%'}}><div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">38</div></div>
                  <div className="w-full bg-blue-600/20 hover:bg-blue-600/40 rounded-t-lg transition-all relative group" style={{height: '50%'}}><div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">25</div></div>
                  <div className="w-full bg-blue-600/20 hover:bg-blue-600/40 rounded-t-lg transition-all relative group" style={{height: '90%'}}><div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">45</div></div>
                  <div className="w-full bg-blue-600 hover:bg-blue-500 rounded-t-lg transition-all relative group" style={{height: '95%'}}><div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">48</div></div>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 mt-2 px-1">
                  <span>Senin</span><span>Selasa</span><span>Rabu</span><span>Kamis</span><span>Jumat</span><span>Sabtu</span><span>Minggu (Hari Ini)</span>
                </div>
              </div>

              {/* Log Alur Informasi/Laporan Masuk Dari Client */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-slate-300 mb-4">Feed Informasi Terkini Dari Klien</h3>
                <div className="divide-y divide-slate-800">
                  {clients.map((client) => (
                    <div key={client.id} className="py-4 flex items-start gap-4 first:pt-0 last:pb-0">
                      <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-amber-400 mt-0.5">
                        <AlertCircle size={16} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-400 tracking-wide uppercase">{client.name}</span>
                        <p className="text-sm text-slate-200 mt-0.5">{client.lastReport}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* === REGION: 2. MANAJEMEN KLIEN & BRAND === */}
          {/* ========================================== */}
          {activeMenu === 'clients' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Manajemen Klien & Kustomisasi Brand</h2>
                <p className="text-slate-400 text-sm">Tambahkan perusahaan baru, daftarkan domain/slug login, dan pasang brand identitas eksklusif mereka.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                
                {/* Form Tambah Tenant Baru */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4 lg:col-span-1">
                  <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <Plus size={16} className="text-blue-500" /> Daftarkan Klien Baru
                  </h3>
                  <form onSubmit={handleAddClient} className="space-y-4 text-xs">
                    <div>
                      <label className="block text-slate-400 mb-1.5 font-medium">Nama Perusahaan Klien</label>
                      <input 
                        type="text" 
                        value={newClient.name}
                        onChange={(e) => setNewClient({...newClient, name: e.target.value})}
                        placeholder="Contoh: PT Angkasa Raya"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1.5 font-medium">Domain Login Slug (Subdomain)</label>
                      <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg overflow-hidden focus-within:border-blue-500">
                        <input 
                          type="text" 
                          value={newClient.slug}
                          onChange={(e) => setNewClient({...newClient, slug: e.target.value})}
                          placeholder="angkasaraya"
                          className="w-full bg-transparent p-2.5 text-white focus:outline-none"
                        />
                        <span className="bg-slate-950 px-3 py-2.5 text-slate-500 border-l border-slate-800">.vest.id</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1.5 font-medium">Aksen Warna Tema Brand (Login/Menu)</label>
                      <div className="flex gap-2">
                        {['bg-blue-600', 'bg-emerald-600', 'bg-amber-600', 'bg-rose-600', 'bg-violet-600'].map((color) => (
                          <button
                            type="button"
                            key={color}
                            onClick={() => setNewClient({...newClient, themeColor: color})}
                            className={`w-6 h-6 rounded-full ${color} border-2 ${newClient.themeColor === color ? 'border-white scale-110' : 'border-transparent'}`}
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1.5 font-medium">Modul Paket Awal (Akses)</label>
                      <div className="space-y-2 bg-slate-900 p-3 rounded-lg border border-slate-800">
                        {["HRIS", "Task Management", "Finance"].map((module) => (
                          <label key={module} className="flex items-center gap-2 cursor-pointer text-slate-300">
                            <input 
                              type="checkbox"
                              checked={newClient.features.includes(module)}
                              onChange={() => toggleFeature(module)}
                              className="rounded border-slate-800 bg-slate-950 text-blue-600 focus:ring-0 focus:ring-offset-0" 
                            />
                            <span>{module}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <button 
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1 text-sm mt-2"
                    >
                      <Plus size={16} /> Daftarkan Mitra
                    </button>
                  </form>
                </div>

                {/* List Klien & Preview Dinamis Brand */}
                <div className="lg:col-span-2 space-y-4">
                  <h3 className="text-sm font-semibold text-slate-300">Daftar Mitra Aktif Terintegrasi</h3>
                  
                  <div className="grid grid-cols-1 gap-4">
                    {clients.map((client) => (
                      <div key={client.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          {/* Simulasi Logo berdasarkan setingan warna dari Super Admin */}
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold shadow-md ${client.themeColor}`}>
                            {client.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-white text-base">{client.name}</h4>
                              <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded">slug: {client.slug}</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              {client.features.map((f, i) => (
                                <span key={i} className="text-[10px] font-medium bg-slate-900 text-blue-400 px-2 py-0.5 rounded border border-blue-500/10">{f}</span>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 border-slate-900 pt-3 md:pt-0">
                          <div className="text-left md:text-right">
                            <span className="text-xs text-slate-500 block">Karyawan Terdaftar</span>
                            <span className="text-sm font-bold text-slate-200 flex items-center gap-1 md:justify-end"><Users size={14}/> {client.userCount}</span>
                          </div>
                          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">{client.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* === REGION: 3. KONTROL HAK AKSES GLOBAL === */}
          {/* ========================================== */}
          {activeMenu === 'access' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Otoritas Hak Akses Sistem Global</h2>
                <p className="text-slate-400 text-sm">Kelola modul-modul master SaaS ERP yang dikunci atau dibuka untuk paket penggunaan klien secara global.</p>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full border-collapse text-left text-sm">
                  <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-medium text-xs">
                    <tr>
                      <th className="p-4">NAMA MODUL MASTER</th>
                      <th className="p-4">KODE CORE</th>
                      <th className="p-4">TARGET OPERASIONAL</th>
                      <th className="p-4">STATUS DISTRIBUSI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 bg-slate-950/40">
                    <tr className="hover:bg-slate-950/80">
                      <td className="p-4 font-semibold text-white">HRIS Dashboard & ESS</td>
                      <td className="p-4 text-slate-400 font-mono">mod-hris-core</td>
                      <td className="p-4 text-slate-300">Admin Klien & Mobile App Karyawan</td>
                      <td className="p-4"><span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-bold">Aktif Stabil</span></td>
                    </tr>
                    <tr className="hover:bg-slate-950/80">
                      <td className="p-4 font-semibold text-white">Task Management Hierarki</td>
                      <td className="p-4 text-slate-400 font-mono">mod-task-lvl</td>
                      <td className="p-4 text-slate-300">Admin Klien (Level 0 - Level 2)</td>
                      <td className="p-4"><span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-bold">Aktif Stabil</span></td>
                    </tr>
                    <tr className="hover:bg-slate-950/80">
                      <td className="p-4 font-semibold text-white">Laporan Patroli & Mobile Site</td>
                      <td className="p-4 text-slate-400 font-mono">mod-patrol-field</td>
                      <td className="p-4 text-slate-300">Karyawan Lapangan/Site Cabang</td>
                      <td className="p-4"><span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-bold">Aktif Stabil</span></td>
                    </tr>
                    <tr className="hover:bg-slate-950/80">
                      <td className="p-4 font-semibold text-white">Finance Dashboard Core</td>
                      <td className="p-4 text-slate-400 font-mono">mod-finance-client</td>
                      <td className="p-4 text-slate-300">Admin Keuangan Klien Utama</td>
                      <td className="p-4"><span className="text-xs bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full font-bold">BETA Uji Coba</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* === REGION: 4. PENGATURAN GLOBAL FITUR === */}
          {/* ========================================== */}
          {activeMenu === 'settings' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Konfigurasi Master V.E.S.T</h2>
                <p className="text-slate-400 text-sm">Pengaturan internal sistem inti aplikasi, lisensi, dan arsitektur database Supabase global.</p>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 max-w-2xl space-y-4">
                <h3 className="text-sm font-semibold text-slate-200">Koneksi Backend Gateway</h3>
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between"><span className="text-slate-500">Global Supabase Project Reference</span><span className="font-mono text-slate-300">v-erp-prod-2026</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Multi-Tenant Isolation Mode</span><span className="text-emerald-400 font-medium">Row-Level Security (RLS) Enforced</span></div>
                </div>
                <p className="text-xs text-slate-500 italic">Catatan: Mengubah pengaturan di halaman ini akan berdampak langsung ke seluruh endpoint API login client.</p>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}