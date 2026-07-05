import { useState, useEffect, useRef } from 'react';
import { 
  Menu, X, CheckSquare, Wallet, Settings, 
  Users, Bell, Search, FileText, 
  ShieldAlert, Clock, ArrowUpRight, ArrowDownRight,
  ChevronLeft, ChevronRight, UserCircle, LogOut
} from 'lucide-react';

export default function ClientAdmin() {
  const [activeMenu, setActiveMenu] = useState('hris');
  const [activeTaskLevel, setActiveTaskLevel] = useState('Level 1');
  
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isProfilePopupOpen, setIsProfilePopupOpen] = useState(false);
  
  const popupRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        setIsProfilePopupOpen(false);
      }
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

  const handleMenuChange = (menu) => {
    setActiveMenu(menu);
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      
      {/* ========================================================= */}
      {/* 1. SISI DESKTOP: SIDEBAR (Expandable / Collapsible)       */}
      {/* ========================================================= */}
      <aside className={`
        hidden md:flex flex-col bg-white border-r border-slate-200 transition-all duration-300 ease-in-out relative z-20
        ${isSidebarExpanded ? 'w-72' : 'w-20'}
      `}>
        <button 
          onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
          className="absolute -right-3.5 top-8 bg-white border border-slate-200 rounded-full p-1 text-slate-400 hover:text-blue-600 shadow-sm z-30"
        >
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

        <nav className="flex-1 p-4 space-y-2 mt-2 overflow-y-auto overflow-x-hidden">
          {isSidebarExpanded && <p className="px-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Main Menu</p>}
          
          {[
            { id: 'hris', icon: Users, label: 'HRIS Dashboard' },
            { id: 'task', icon: CheckSquare, label: 'Task Management' },
            { id: 'finance', icon: Wallet, label: 'Finance Dashboard' }
          ].map((item) => (
            <button 
              key={item.id}
              onClick={() => handleMenuChange(item.id)} 
              title={!isSidebarExpanded ? item.label : ''}
              className={`flex items-center w-full rounded-xl font-medium text-sm transition-all overflow-hidden whitespace-nowrap
                ${activeMenu === item.id ? `${clientData.light} ${clientData.text}` : 'text-slate-600 hover:bg-slate-50'}
                ${isSidebarExpanded ? 'gap-3 px-4 py-3.5' : 'justify-center p-3.5'}
              `}
            >
              <item.icon size={20} className={`shrink-0 ${activeMenu === item.id ? clientData.text : 'text-slate-400'}`} />
              {isSidebarExpanded && <span>{item.label}</span>}
            </button>
          ))}

          <div className="pt-4 mt-4 border-t border-slate-100">
            {isSidebarExpanded && <p className="px-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">System</p>}
            <button 
              onClick={() => handleMenuChange('settings')} 
              title={!isSidebarExpanded ? "Konfigurasi Akses" : ''}
              className={`flex items-center w-full rounded-xl font-medium text-sm transition-all overflow-hidden whitespace-nowrap
                ${activeMenu === 'settings' ? `${clientData.light} ${clientData.text}` : 'text-slate-600 hover:bg-slate-50'}
                ${isSidebarExpanded ? 'gap-3 px-4 py-3.5' : 'justify-center p-3.5'}
              `}
            >
              <Settings size={20} className={`shrink-0 ${activeMenu === 'settings' ? clientData.text : 'text-slate-400'}`} />
              {isSidebarExpanded && <span>Konfigurasi Akses</span>}
            </button>
          </div>
        </nav>
      </aside>

      {/* ========================================================= */}
      {/* 2. AREA KONTEN UTAMA (Desktop & Mobile)                   */}
      {/* ========================================================= */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        
        {/* --- Topbar Desktop --- */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 bg-white border-b border-slate-200 z-10">
          <div className="relative w-96">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Cari karyawan, laporan..." className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
          </div>
          
          <div className="flex items-center gap-4 relative" ref={popupRef}>
            <button className="relative p-2.5 text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border border-white"></span>
            </button>

            <button 
              onClick={() => setIsProfilePopupOpen(!isProfilePopupOpen)}
              className="flex items-center gap-3 pl-4 border-l border-slate-200 hover:opacity-80 transition-opacity"
            >
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
                <button className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-3">
                  <UserCircle size={18} className="text-slate-400"/> Profil Saya
                </button>
                <button className="w-full text-left px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-3 mt-1">
                  <LogOut size={18} className="text-rose-400"/> Keluar Sistem
                </button>
              </div>
            )}
          </div>
        </header>

        {/* --- Topbar Mobile --- */}
        <header className="md:hidden bg-blue-600 px-5 pt-10 pb-6 rounded-b-3xl shadow-md text-white z-10 shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center font-bold text-blue-600 shadow-inner">
                {clientData.short}
              </div>
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
        <div className="flex-1 overflow-y-auto p-4 pb-28 md:pb-8 md:p-8 bg-slate-50/50">
          
          {/* Perubahan utama: Dibuat w-full agar melebar penuh (Full Width) */}
          <div className="w-full"> 

            {/* KONTEN: HRIS DASHBOARD */}
            {activeMenu === 'hris' && (
              <div className="space-y-6 fade-in">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">HRIS Dashboard</h2>
                    <p className="text-slate-500 text-sm mt-1">Pantau kehadiran harian dan laporan lapangan.</p>
                  </div>
                  <span className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 flex items-center gap-2 shadow-sm w-max"><Clock size={14}/> 5 Juli 2026</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-4 gap-3 md:gap-6">
                  <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100">
                    <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase">Hadir</p>
                    <h3 className="text-2xl md:text-3xl font-black text-slate-800 mt-1 md:mt-2">128</h3>
                    <p className="text-[10px] md:text-xs text-emerald-600 font-medium mt-1">Sesuai Jadwal</p>
                  </div>
                  <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100">
                    <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase">Terlambat</p>
                    <h3 className="text-2xl md:text-3xl font-black text-slate-800 mt-1 md:mt-2">12</h3>
                    <p className="text-[10px] md:text-xs text-amber-500 font-medium mt-1">Butuh Review</p>
                  </div>
                </div>

                <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden mt-6">
                  <div className="p-4 md:p-5 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 text-sm md:text-base">Aktivitas Terkini</h3>
                  </div>
                  <div className="divide-y divide-slate-50">
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-sm shrink-0">BJ</div>
                        <div>
                          <p className="font-bold text-slate-800 text-xs md:text-sm">Budi Jaya (Security Site)</p>
                          <p className="text-[10px] md:text-xs text-slate-500">Absen Masuk (WFO) • 07:15 WIB</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* KONTEN: TASK MANAGEMENT */}
            {activeMenu === 'task' && (
              <div className="space-y-6 fade-in">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Task Management</h2>
                  <p className="text-slate-500 text-sm mt-1">Delegasi tugas hierarki level.</p>
                </div>

                <div className="flex overflow-x-auto hide-scrollbar p-1 bg-slate-200/50 rounded-xl md:w-max">
                  {['Level 0', 'Level 1', 'Level 2'].map((level) => (
                    <button
                      key={level}
                      onClick={() => setActiveTaskLevel(level)}
                      className={`flex-1 md:w-32 py-2 px-4 whitespace-nowrap text-sm font-semibold rounded-lg transition-all ${activeTaskLevel === level ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      {level}
                    </button>
                  ))}
                </div>

                <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-4 md:p-6">
                  {activeTaskLevel === 'Level 0' && (
                    <div className="space-y-4">
                      <div className="p-4 border border-slate-100 rounded-xl flex flex-col md:flex-row md:items-start gap-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-3 flex-1">
                          <ShieldAlert size={20} className="text-rose-500 shrink-0"/>
                          <div>
                            <h4 className="font-bold text-slate-800 text-sm">Patroli Sektor A (Pos Jaga)</h4>
                            <p className="text-xs text-slate-500 mt-1">Penyisiran area timur dan dokumentasi gerbang utama.</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2.5 py-1 rounded-lg self-start">High Priority</span>
                      </div>
                    </div>
                  )}
                  {activeTaskLevel === 'Level 1' && (
                     <div className="p-4 border border-slate-100 rounded-xl flex items-start gap-4">
                        <FileText size={20} className={clientData.text}/>
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm">Review Laporan Drone Blok B</h4>
                          <p className="text-xs text-slate-500 mt-1">Validasi data visual dan anomali.</p>
                        </div>
                     </div>
                  )}
                </div>
              </div>
            )}

            {/* KONTEN: FINANCE DASHBOARD */}
            {activeMenu === 'finance' && (
              <div className="space-y-6 fade-in">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Finance Dashboard</h2>
                </div>
                <div className="bg-slate-900 text-white p-6 md:p-10 rounded-3xl shadow-xl relative overflow-hidden xl:w-2/3">
                  <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-bl-full blur-2xl"></div>
                  <p className="text-sm font-medium text-slate-300">Saldo Kas Operasional</p>
                  <h3 className="text-3xl md:text-5xl font-black mt-2 mb-8 tracking-tight">Rp 45.500.000</h3>
                  <div className="flex gap-3 max-w-sm">
                    <button className="flex-1 py-3 bg-white text-slate-900 rounded-xl text-sm font-bold shadow-md flex justify-center items-center gap-1 active:scale-95 transition-transform"><ArrowDownRight size={16}/> Top Up</button>
                    <button className="flex-1 py-3 bg-white/20 text-white rounded-xl text-sm font-bold border border-white/10 flex justify-center items-center gap-1 active:scale-95 transition-transform"><ArrowUpRight size={16}/> Mutasi</button>
                  </div>
                </div>
              </div>
            )}

            {/* KONTEN: SETTINGS */}
            {activeMenu === 'settings' && (
              <div className="space-y-6 fade-in">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Konfigurasi Akses</h2>
                  <p className="text-slate-500 text-sm mt-1">Manajemen akses peran karyawan.</p>
                </div>
                <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5 text-center py-16">
                   <Settings size={48} className="mx-auto text-slate-300 mb-4" />
                   <h3 className="font-bold text-slate-700 text-lg">Modul Konfigurasi Terkunci</h3>
                   <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">Hubungi Super Admin (V.E.S.T) untuk mengubah arsitektur hak akses perusahaan Anda.</p>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>

      {/* ========================================================= */}
      {/* 3. SISI MOBILE: BOTTOM NAVIGATION BAR (Murni Mobile App) */}
      {/* ========================================================= */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white border-t border-slate-200 flex justify-around items-center px-2 py-3 pb-6 z-40 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
        
        <button onClick={() => handleMenuChange('hris')} className={`flex flex-col items-center gap-1.5 w-16 transition-colors ${activeMenu === 'hris' ? clientData.text : 'text-slate-400'}`}>
          <div className={`p-1.5 rounded-xl ${activeMenu === 'hris' ? clientData.light : 'bg-transparent'}`}>
            <Users size={22} className={activeMenu === 'hris' ? `fill-blue-100 ${clientData.text}` : ''} />
          </div>
          <span className={`text-[10px] font-bold ${activeMenu === 'hris' ? clientData.text : 'font-medium'}`}>HRIS</span>
        </button>

        <button onClick={() => handleMenuChange('task')} className={`flex flex-col items-center gap-1.5 w-16 transition-colors ${activeMenu === 'task' ? clientData.text : 'text-slate-400'}`}>
          <div className={`p-1.5 rounded-xl ${activeMenu === 'task' ? clientData.light : 'bg-transparent'}`}>
            <CheckSquare size={22} className={activeMenu === 'task' ? `fill-blue-100 ${clientData.text}` : ''} />
          </div>
          <span className={`text-[10px] font-bold ${activeMenu === 'task' ? clientData.text : 'font-medium'}`}>Task</span>
        </button>

        <button onClick={() => handleMenuChange('finance')} className={`flex flex-col items-center gap-1.5 w-16 transition-colors ${activeMenu === 'finance' ? clientData.text : 'text-slate-400'}`}>
          <div className={`p-1.5 rounded-xl ${activeMenu === 'finance' ? clientData.light : 'bg-transparent'}`}>
            <Wallet size={22} className={activeMenu === 'finance' ? `fill-blue-100 ${clientData.text}` : ''} />
          </div>
          <span className={`text-[10px] font-bold ${activeMenu === 'finance' ? clientData.text : 'font-medium'}`}>Finance</span>
        </button>

        <button onClick={() => handleMenuChange('settings')} className={`flex flex-col items-center gap-1.5 w-16 transition-colors ${activeMenu === 'settings' ? clientData.text : 'text-slate-400'}`}>
          <div className={`p-1.5 rounded-xl ${activeMenu === 'settings' ? clientData.light : 'bg-transparent'}`}>
            <Settings size={22} className={activeMenu === 'settings' ? `fill-blue-100 ${clientData.text}` : ''} />
          </div>
          <span className={`text-[10px] font-bold ${activeMenu === 'settings' ? clientData.text : 'font-medium'}`}>Sistem</span>
        </button>

      </nav>

    </div>
  );
}