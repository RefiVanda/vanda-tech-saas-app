import { useState } from 'react';
import { 
  Home, MapPin, Camera, FileText, User, 
  Clock, ClipboardList, ShieldAlert, CreditCard, 
  ChevronRight, Calendar, AlertCircle, FileSpreadsheet
} from 'lucide-react';

export default function MobileApp() {
  const [activeMenu, setActiveMenu] = useState('home');
  const [laporanTab, setLaporanTab] = useState('reguler');

  // Dummy State Data Karyawan
  const employeeData = {
    name: "Ahmad Teknisi",
    role: "Karyawan Lapangan (Site)",
    branch: "PT Klien Nusantara",
    avatar: "AT"
  };

  return (
    // Wrapper luar untuk simulasi layar mobile jika dibuka di Desktop
    <div className="min-h-screen bg-slate-200 flex justify-center font-sans">
      
      {/* Mobile Container (Maksimal lebar layar HP) */}
      <div className="w-full max-w-md bg-slate-50 min-h-screen shadow-2xl relative overflow-hidden flex flex-col">
        
        {/* ========================================== */}
        {/* === START: TOP HEADER (STATIS) === */}
        {/* ========================================== */}
        <header className="bg-blue-600 px-5 pt-8 pb-6 rounded-b-3xl shadow-md z-10 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold border border-white/30 backdrop-blur-sm">
                {employeeData.avatar}
              </div>
              <div>
                <h1 className="font-bold text-sm leading-tight">{employeeData.name}</h1>
                <p className="text-[10px] text-blue-100">{employeeData.role}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] bg-white/20 px-2 py-1 rounded-full border border-white/30 font-medium">
                {employeeData.branch}
              </span>
            </div>
          </div>
        </header>

        {/* ========================================== */}
        {/* === START: MAIN SCROLLABLE CONTENT === */}
        {/* ========================================== */}
        <main className="flex-1 overflow-y-auto pb-24 -mt-4 px-4 pt-6 space-y-6 z-0">

          {/* === REGION: 1. HOME & DASHBOARD === */}
          {activeMenu === 'home' && (
            <div className="space-y-6 fade-in">
              
              {/* Widget Waktu & Lokasi Real-time */}
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 text-center">
                <p className="text-sm font-bold text-slate-800">07:45:22 WIB</p>
                <p className="text-xs text-slate-500 mb-3">Minggu, 5 Juli 2026</p>
                <div className="flex items-center justify-center gap-1 text-[10px] text-emerald-600 bg-emerald-50 py-1.5 rounded-lg">
                  <MapPin size={12} /> Akurasi GPS: Tinggi (Jarak: 15m dari Pos)
                </div>
              </div>

              {/* Quick Actions (Shortcut) */}
              <div className="grid grid-cols-4 gap-3 text-center">
                <button onClick={() => setActiveMenu('absen')} className="flex flex-col items-center gap-1.5">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center"><Camera size={24}/></div>
                  <span className="text-[10px] font-bold text-slate-600">Absen</span>
                </button>
                <button onClick={() => setActiveMenu('laporan')} className="flex flex-col items-center gap-1.5">
                  <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center"><ShieldAlert size={24}/></div>
                  <span className="text-[10px] font-bold text-slate-600">Laporan</span>
                </button>
                <button onClick={() => setActiveMenu('pengajuan')} className="flex flex-col items-center gap-1.5">
                  <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center"><Calendar size={24}/></div>
                  <span className="text-[10px] font-bold text-slate-600">Cuti/Izin</span>
                </button>
                <button onClick={() => setActiveMenu('profil')} className="flex flex-col items-center gap-1.5">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center"><FileSpreadsheet size={24}/></div>
                  <span className="text-[10px] font-bold text-slate-600">Payslip</span>
                </button>
              </div>

              {/* Status Kehadiran Hari Ini */}
              <div className="bg-slate-800 rounded-2xl p-4 text-white shadow-lg relative overflow-hidden">
                <div className="absolute right-0 top-0 w-20 h-20 bg-white/5 rounded-bl-full"></div>
                <h3 className="text-xs font-bold text-slate-400 mb-3">STATUS HARI INI</h3>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-[10px] text-slate-400">Jam Masuk</p>
                    <p className="font-bold text-lg text-emerald-400">07:15</p>
                  </div>
                  <div className="h-8 w-px bg-slate-600"></div>
                  <div>
                    <p className="text-[10px] text-slate-400">Jam Pulang</p>
                    <p className="font-bold text-lg text-slate-300">--:--</p>
                  </div>
                  <div className="h-8 w-px bg-slate-600"></div>
                  <div>
                    <p className="text-[10px] text-slate-400">Total Jam</p>
                    <p className="font-bold text-lg text-blue-400">On Duty</p>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* === REGION: 2. MENU ABSENSI === */}
          {activeMenu === 'absen' && (
            <div className="space-y-4 fade-in">
              <h2 className="font-bold text-slate-800 text-lg px-1">Presensi Kehadiran</h2>
              
              <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
                {/* Dummy Area Kamera */}
                <div className="w-full h-64 bg-slate-900 rounded-xl relative flex flex-col items-center justify-center text-slate-500 overflow-hidden">
                  <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1541888087525-450e82c5a01f?q=80&w=600&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-luminosity"></div>
                  <div className="w-48 h-48 border-2 border-dashed border-white/50 rounded-full absolute z-10"></div>
                  <Camera size={32} className="z-10 text-white/80 mb-2"/>
                  <span className="text-xs z-10 text-white/80">Arahkan wajah ke dalam area</span>
                </div>
                
                <div className="mt-4 space-y-3">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-start gap-3">
                    <MapPin size={18} className="text-blue-500 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-slate-700">Area Terdeteksi: Head Office</p>
                      <p className="text-[10px] text-slate-500">Jl. Pahlawan No. 12, Sektor 7</p>
                    </div>
                  </div>
                  <button className="w-full bg-blue-600 active:bg-blue-700 text-white font-bold py-3.5 rounded-xl text-sm transition-colors shadow-lg shadow-blue-600/30">
                    Absen Masuk Sekarang
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* === REGION: 3. MENU LAPORAN === */}
          {activeMenu === 'laporan' && (
            <div className="space-y-4 fade-in">
              <h2 className="font-bold text-slate-800 text-lg px-1">Formulir Laporan</h2>
              
              {/* Tab Toggle (Reguler / Patroli) */}
              <div className="flex p-1 bg-white border border-slate-200 rounded-xl w-full shadow-sm">
                <button
                  onClick={() => setLaporanTab('reguler')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${laporanTab === 'reguler' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}
                >
                  Laporan Reguler
                </button>
                <button
                  onClick={() => setLaporanTab('patroli')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${laporanTab === 'patroli' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}
                >
                  Laporan Patroli
                </button>
              </div>

              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                {laporanTab === 'reguler' ? (
                  <p className="text-xs text-slate-500 mb-2">Gunakan form ini untuk pelaporan kejadian umum yang bisa dilakukan di mana saja.</p>
                ) : (
                  <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg mb-2 flex items-center gap-2 font-medium">
                    <AlertCircle size={14}/> Laporan terikat dengan titik Checkpoint GPS
                  </p>
                )}

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Judul Laporan</label>
                  <input type="text" className="w-full text-sm p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500" placeholder="Contoh: Lampu Koridor Mati" />
                </div>
                
                {laporanTab === 'patroli' && (
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Titik Checkpoint (QR/NFC)</label>
                    <button className="w-full text-sm p-3 bg-slate-50 border border-slate-200 border-dashed rounded-xl text-blue-600 font-bold flex items-center justify-center gap-2">
                      <Camera size={16}/> Scan QR Checkpoint
                    </button>
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Keterangan / Temuan</label>
                  <textarea rows="3" className="w-full text-sm p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500" placeholder="Jelaskan detail temuan..."></textarea>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Lampiran Foto</label>
                  <div className="flex gap-2">
                    <button className="w-16 h-16 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center text-slate-400">
                      <Camera size={20}/>
                    </button>
                  </div>
                </div>

                <button className="w-full bg-slate-800 text-white font-bold py-3.5 rounded-xl text-sm mt-4">Kirim Laporan</button>
              </div>
            </div>
          )}

          {/* === REGION: 4. MENU PENGAJUAN (CUTI/IZIN/REIMBURSE) === */}
          {activeMenu === 'pengajuan' && (
            <div className="space-y-4 fade-in">
              <h2 className="font-bold text-slate-800 text-lg px-1">Pusat Pengajuan</h2>
              
              <div className="grid grid-cols-1 gap-3">
                <button className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between active:bg-slate-50">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center"><Calendar size={20}/></div>
                    <div className="text-left">
                      <h3 className="font-bold text-slate-700 text-sm">Cuti / Izin</h3>
                      <p className="text-[10px] text-slate-500">Sisa Cuti Tahunan: 8 Hari</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-400" />
                </button>

                <button className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between active:bg-slate-50">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"><Clock size={20}/></div>
                    <div className="text-left">
                      <h3 className="font-bold text-slate-700 text-sm">Koreksi Absen</h3>
                      <p className="text-[10px] text-slate-500">Lupa absen atau kendala jaringan</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-400" />
                </button>

                <button className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between active:bg-slate-50">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center"><CreditCard size={20}/></div>
                    <div className="text-left">
                      <h3 className="font-bold text-slate-700 text-sm">Reimbursement</h3>
                      <p className="text-[10px] text-slate-500">Klaim biaya operasional / bensin</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-400" />
                </button>
              </div>
            </div>
          )}

          {/* === REGION: 5. MENU PROFIL & PAYSLIP === */}
          {activeMenu === 'profil' && (
            <div className="space-y-4 fade-in">
              <h2 className="font-bold text-slate-800 text-lg px-1">Profil & Keuangan</h2>
              
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 text-center">
                <div className="w-20 h-20 bg-slate-100 rounded-full mx-auto flex items-center justify-center font-bold text-2xl text-slate-400 mb-3 border-4 border-white shadow-md">
                  {employeeData.avatar}
                </div>
                <h3 className="font-bold text-slate-800">{employeeData.name}</h3>
                <p className="text-xs text-slate-500">{employeeData.role}</p>
                <div className="mt-4 pt-4 border-t border-slate-100 flex justify-around text-center">
                  <div>
                    <p className="text-lg font-bold text-slate-700">12</p>
                    <p className="text-[10px] text-slate-500">Tugas Selesai</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-700">100%</p>
                    <p className="text-[10px] text-slate-500">Kehadiran</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-100 font-bold text-sm text-slate-700">Riwayat Slip Gaji (Payslip)</div>
                <div className="p-4 flex items-center justify-between border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet size={18} className="text-slate-400"/>
                    <div>
                      <p className="font-bold text-sm text-slate-700">Gaji Juni 2026</p>
                      <p className="text-[10px] text-slate-500">Diterbitkan: 25 Jun 2026</p>
                    </div>
                  </div>
                  <button className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg">Download PDF</button>
                </div>
                <div className="p-4 flex items-center justify-between border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet size={18} className="text-slate-400"/>
                    <div>
                      <p className="font-bold text-sm text-slate-700">Gaji Mei 2026</p>
                      <p className="text-[10px] text-slate-500">Diterbitkan: 25 Mei 2026</p>
                    </div>
                  </div>
                  <button className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg">Download PDF</button>
                </div>
              </div>
            </div>
          )}

        </main>
        {/* ========================================== */}
        {/* === END: MAIN SCROLLABLE CONTENT === */}
        {/* ========================================== */}


        {/* ========================================== */}
        {/* === START: BOTTOM NAVIGATION BAR === */}
        {/* ========================================== */}
        <nav className="absolute bottom-0 w-full bg-white border-t border-slate-200 flex justify-around items-center px-2 py-3 pb-6 z-20">
          <button onClick={() => setActiveMenu('home')} className={`flex flex-col items-center gap-1 w-16 ${activeMenu === 'home' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
            <Home size={22} className={activeMenu === 'home' ? 'fill-blue-50 text-blue-600' : ''} />
            <span className="text-[9px] font-bold">Beranda</span>
          </button>
          
          <button onClick={() => setActiveMenu('absen')} className={`flex flex-col items-center gap-1 w-16 ${activeMenu === 'absen' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
            <Camera size={22} className={activeMenu === 'absen' ? 'fill-blue-50 text-blue-600' : ''} />
            <span className="text-[9px] font-bold">Absen</span>
          </button>
          
          <button onClick={() => setActiveMenu('laporan')} className={`flex flex-col items-center gap-1 w-16 ${activeMenu === 'laporan' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
            <ClipboardList size={22} className={activeMenu === 'laporan' ? 'fill-blue-50 text-blue-600' : ''} />
            <span className="text-[9px] font-bold">Laporan</span>
          </button>
          
          <button onClick={() => setActiveMenu('pengajuan')} className={`flex flex-col items-center gap-1 w-16 ${activeMenu === 'pengajuan' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
            <FileText size={22} className={activeMenu === 'pengajuan' ? 'fill-blue-50 text-blue-600' : ''} />
            <span className="text-[9px] font-bold">Pengajuan</span>
          </button>
          
          <button onClick={() => setActiveMenu('profil')} className={`flex flex-col items-center gap-1 w-16 ${activeMenu === 'profil' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
            <User size={22} className={activeMenu === 'profil' ? 'fill-blue-50 text-blue-600' : ''} />
            <span className="text-[9px] font-bold">Profil</span>
          </button>
        </nav>
        {/* ========================================== */}
        {/* === END: BOTTOM NAVIGATION BAR === */}
        {/* ========================================== */}

      </div>
    </div>
  );
}