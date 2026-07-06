import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { 
  Home, MapPin, Camera, FileText, User, 
  Clock, ShieldAlert, CreditCard, 
  Calendar, Settings, Lock, Image as ImageIcon, Bell, ArrowRight,
  CheckCircle2, LogOut, History, Check
} from 'lucide-react';

export default function MobileApp() {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState('home');
  const [laporanTab, setLaporanTab] = useState('reguler');
  
  // State Aksi & Form
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State Absensi (In & Out)
  const [absenId, setAbsenId] = useState(null);
  const [hasAbsenMasuk, setHasAbsenMasuk] = useState(false);
  const [hasAbsenKeluar, setHasAbsenKeluar] = useState(false);
  const [absenInTime, setAbsenInTime] = useState('--:--');
  const [absenOutTime, setAbsenOutTime] = useState('--:--');
  const [absenPhoto, setAbsenPhoto] = useState(null);

  const [reportTitle, setReportTitle] = useState('');
  const [reportDesc, setReportDesc] = useState('');

  // State User & Database
  const [currentUser, setCurrentUser] = useState({ id: '', name: 'Loading...', role: '', division: '', avatar: '' });
  const [permissions, setPermissions] = useState({ patroli: false, reguler: false, cuti: false, koreksi: false, reimburse: false, bebas_gps: false });
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [reportHistory, setReportHistory] = useState([]);

  useEffect(() => {
    const session = localStorage.getItem('syntegra_user_session');
    if (!session) { navigate('/'); return; }
    
    const parsed = JSON.parse(session);
    fetchUserData(parsed.id, parsed);
    checkTodayAttendance(parsed.id);
    fetchHistories(parsed.id);
  }, []);

  const fetchUserData = async (userId, parsedSession) => {
    const { data } = await supabase.from('candidates').select('nama_lengkap, role, bidang_jasa, permissions').eq('id', userId).single();
    if (data) {
      const initials = data.nama_lengkap.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
      setCurrentUser({ id: userId, name: data.nama_lengkap, role: data.role, division: data.bidang_jasa, avatar: initials });
      if (data.permissions) setPermissions(data.permissions);
    } else {
      const initials = (parsedSession.name || 'User').split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
      setCurrentUser({ ...parsedSession, avatar: initials });
    }
  };

  const fetchHistories = async (userId) => {
    const { data: attData } = await supabase.from('attendances').select('*').eq('employee_id', userId).order('created_at', { ascending: false }).limit(3);
    if (attData) setAttendanceHistory(attData);

    const { data: repData } = await supabase.from('field_reports').select('*').eq('employee_id', userId).order('created_at', { ascending: false }).limit(3);
    if (repData) setReportHistory(repData);
  };

  const checkTodayAttendance = async (userId) => {
    const d = new Date();
    const today = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    const { data } = await supabase.from('attendances').select('*').eq('employee_id', userId).eq('date', today).single();
    
    if (data) {
      setAbsenId(data.id);
      setHasAbsenMasuk(true);
      setAbsenInTime(data.check_in_time?.substring(0, 5) || '--:--');
      if (data.check_out_time) {
        setHasAbsenKeluar(true);
        setAbsenOutTime(data.check_out_time.substring(0, 5));
      }
    }
  };

  const handleAbsen = async () => {
    if (!absenPhoto) return alert("Wajib melampirkan foto selfie/kamera untuk absen!");
    setIsSubmitting(true);
    
    const d = new Date();
    const timeString = d.toTimeString().split(' ')[0];
    const dateString = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    const lokasiStr = permissions.bebas_gps ? 'Bebas GPS (Remote)' : 'Sektor 7 (Sesuai Radius)';

    if (!hasAbsenMasuk) {
      // PROSES ABSEN MASUK
      const { error } = await supabase.from('attendances').insert([{
        employee_id: currentUser.id, date: dateString, check_in_time: timeString, location_gps: lokasiStr, photo_url: absenPhoto, status: 'HADIR'
      }]);
      if (!error) {
        alert("Absen Masuk Berhasil!");
        checkTodayAttendance(currentUser.id);
        fetchHistories(currentUser.id);
        setAbsenPhoto(null);
        setActiveMenu('home');
      } else alert("Gagal absen: " + error.message);
    } else if (hasAbsenMasuk && !hasAbsenKeluar) {
      // PROSES ABSEN KELUAR (PULANG SHIFT)
      const { error } = await supabase.from('attendances').update({ check_out_time: timeString }).eq('id', absenId);
      if (!error) {
        alert("Absen Keluar Berhasil! Shift selesai.");
        setHasAbsenKeluar(true);
        setAbsenOutTime(timeString.substring(0, 5));
        fetchHistories(currentUser.id);
        setAbsenPhoto(null);
        setActiveMenu('home');
      } else alert("Gagal absen keluar: " + error.message);
    }

    setIsSubmitting(false);
  };

  const handleKirimLaporan = async () => {
    if (!reportTitle || !reportDesc) return alert("Judul dan keterangan wajib diisi!");
    setIsSubmitting(true);
    const { error } = await supabase.from('field_reports').insert([{ employee_id: currentUser.id, report_type: laporanTab.toUpperCase(), title: reportTitle, description: reportDesc }]);
    setIsSubmitting(false);
    
    if (!error) {
      alert("Laporan berhasil dikirim!");
      setReportTitle(''); setReportDesc('');
      fetchHistories(currentUser.id);
      setActiveMenu('home');
    } else alert("Gagal mengirim laporan: " + error.message);
  };

  const handleLogout = () => {
    localStorage.removeItem('syntegra_user_session');
    navigate('/');
  };

  // Komponen Helper Grid Menu Dinamis
  const MenuIcon = ({ icon: Icon, label, colorClass, bgClass, onClick }) => (
    <button onClick={onClick} className="flex flex-col items-center gap-2 group transition-transform active:scale-95">
      <div className={`w-14 h-14 rounded-[1.25rem] flex items-center justify-center shadow-sm ${bgClass}`}>
        <Icon size={24} className={colorClass} strokeWidth={2.5}/>
      </div>
      <span className="text-[10px] font-bold text-slate-600 text-center leading-tight max-w-[60px]">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center font-sans selection:bg-indigo-500 selection:text-white">
      {/* Wrapper Utama Mobile */}
      <div className="w-full max-w-md bg-slate-50 min-h-screen shadow-2xl relative flex flex-col h-screen overflow-hidden">
        
        {/* ========================================== */}
        {/* === STICKY HEADER (BANKING STYLE)        === */}
        {/* ========================================== */}
        <header className="bg-gradient-to-b from-indigo-900 via-indigo-800 to-indigo-700 px-6 pt-12 pb-20 shrink-0 shadow-lg relative z-20 rounded-b-[2.5rem]">
          <div className="flex justify-between items-center relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-white/10 rounded-full flex items-center justify-center font-bold text-white border border-white/20 backdrop-blur-md shadow-inner">
                {currentUser.avatar}
              </div>
              <div>
                <p className="text-[10px] text-indigo-200 font-medium tracking-wider uppercase mb-0.5">Selamat Bekerja,</p>
                <h1 className="font-bold text-base text-white leading-tight">{currentUser.name}</h1>
              </div>
            </div>
            <button className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white backdrop-blur-md border border-white/20 hover:bg-white/20 transition-colors relative">
              <Bell size={18} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border border-indigo-800"></span>
            </button>
          </div>
          
          <div className="mt-6 flex justify-between items-end relative z-10">
            <div>
              <p className="text-indigo-200 text-xs font-medium mb-1">Jam Masuk</p>
              <h2 className="text-3xl font-black text-white tracking-tight">{hasAbsenMasuk ? absenInTime : '--:--'}</h2>
            </div>
            <div className="text-right">
              <p className="text-indigo-200 text-xs font-medium mb-1">Jam Pulang</p>
              <h2 className="text-3xl font-black text-white tracking-tight">{hasAbsenKeluar ? absenOutTime : '--:--'}</h2>
            </div>
          </div>

          <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white opacity-5 blur-[80px] rounded-full pointer-events-none"></div>
          <div className="absolute bottom-[-10%] left-[-20%] w-48 h-48 bg-indigo-500 opacity-20 blur-[60px] rounded-full pointer-events-none"></div>
        </header>

        {/* ========================================== */}
        {/* === KONTEN UTAMA (SCROLLABLE AREA)       === */}
        {/* ========================================== */}
        <main className="flex-1 overflow-y-auto px-5 pb-32 -mt-8 z-10 custom-scrollbar relative">

          {/* --- TAB: HOME DASHBOARD --- */}
          {activeMenu === 'home' && (
            <div className="space-y-6 fade-in pt-2">
              <div className="bg-white rounded-3xl p-5 shadow-xl shadow-indigo-900/5 border border-slate-100 flex justify-between items-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-indigo-50 to-transparent rounded-bl-full pointer-events-none"></div>
                <div className="relative z-10 flex-1 border-r border-slate-100">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase mb-1"><MapPin size={12}/> Lokasi GPS</div>
                  <p className="font-black text-sm text-indigo-950 truncate pr-2">{permissions.bebas_gps ? 'Bebas Radius' : 'Deteksi Aktif'}</p>
                </div>
                <div className="relative z-10 flex-1 pl-4 text-right">
                  <div className="flex items-center justify-end gap-1.5 text-xs font-bold text-slate-400 uppercase mb-1"><Clock size={12}/> Status</div>
                  <p className="font-black text-sm text-indigo-950">{hasAbsenMasuk && !hasAbsenKeluar ? 'Sedang Bertugas' : 'Off Duty'}</p>
                </div>
              </div>

              {/* Grid Menu Dinamis */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                <h3 className="text-sm font-bold text-slate-800 mb-5">Menu Operasional</h3>
                <div className="grid grid-cols-4 gap-y-6 gap-x-2">
                  {permissions.patroli && <MenuIcon icon={ShieldAlert} label="Patroli" bgClass="bg-rose-50" colorClass="text-rose-500" onClick={() => { setLaporanTab('patroli'); setActiveMenu('laporan'); }}/>}
                  {permissions.reguler && <MenuIcon icon={FileText} label="Laporan" bgClass="bg-indigo-50" colorClass="text-indigo-500" onClick={() => { setLaporanTab('reguler'); setActiveMenu('laporan'); }}/>}
                  {permissions.cuti && <MenuIcon icon={Calendar} label="Izin/Cuti" bgClass="bg-amber-50" colorClass="text-amber-500" onClick={() => setActiveMenu('pengajuan')}/>}
                  {permissions.koreksi && <MenuIcon icon={Clock} label="Koreksi" bgClass="bg-emerald-50" colorClass="text-emerald-500" onClick={() => setActiveMenu('pengajuan')}/>}
                  {permissions.reimburse && <MenuIcon icon={CreditCard} label="Klaim" bgClass="bg-sky-50" colorClass="text-sky-500" onClick={() => setActiveMenu('pengajuan')}/>}
                  <MenuIcon icon={User} label="Profil" bgClass="bg-purple-50" colorClass="text-purple-500" onClick={() => setActiveMenu('settings')}/>
                </div>
                
                {!permissions.patroli && !permissions.reguler && !permissions.cuti && !permissions.koreksi && !permissions.reimburse && (
                  <div className="mt-4 p-3 bg-amber-50 rounded-xl text-center border border-amber-100">
                    <p className="text-[10px] font-bold text-amber-700">Hubungi Admin untuk membuka akses menu pengajuan.</p>
                  </div>
                )}
              </div>

              {/* Pengumuman HRD */}
              <div className="bg-gradient-to-r from-indigo-900 to-indigo-700 rounded-3xl p-6 shadow-md text-white relative overflow-hidden flex items-center justify-between">
                <div className="absolute right-0 opacity-10 pointer-events-none"><Bell size={100} className="-translate-y-4 translate-x-4"/></div>
                <div className="relative z-10 w-2/3">
                  <span className="text-[9px] font-black tracking-widest text-indigo-300 uppercase mb-1 block">Informasi HRD</span>
                  <h3 className="font-bold text-sm leading-tight">Pengingat: Verifikasi wajah wajib saat absen keluar shift.</h3>
                </div>
                <div className="relative z-10 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md"><ArrowRight size={18}/></div>
              </div>
            </div>
          )}

          {/* --- TAB: ABSENSI (Kamera & Logika In/Out) --- */}
          {activeMenu === 'absen' && (
            <div className="space-y-4 fade-in mt-6">
              <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center">
                <h2 className="font-black text-slate-800 text-lg mb-4">
                  {hasAbsenMasuk && !hasAbsenKeluar ? 'Verifikasi Absen Keluar' : 'Verifikasi Absen Masuk'}
                </h2>
                
                {/* Area Kamera HTML5 Capture */}
                <label className="w-full h-72 bg-slate-900 rounded-[2rem] relative flex flex-col items-center justify-center text-slate-500 overflow-hidden shadow-inner cursor-pointer active:scale-95 transition-transform group">
                  {absenPhoto ? (
                    <img src={absenPhoto} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-90" />
                  ) : (
                    <>
                      <div className="absolute inset-0 bg-indigo-900/40 mix-blend-multiply pointer-events-none"></div>
                      <div className="w-48 h-48 border-2 border-dashed border-white/50 rounded-full absolute z-10 animate-[spin_10s_linear_infinite] pointer-events-none"></div>
                      <Camera size={40} className="z-10 text-white/90 mb-3 drop-shadow-md group-hover:scale-110 transition-transform"/>
                      <span className="text-xs font-bold tracking-wide z-10 text-white/90 bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm pointer-events-none">Ketuk untuk Buka Kamera</span>
                    </>
                  )}
                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => {
                    if(e.target.files && e.target.files[0]) setAbsenPhoto(URL.createObjectURL(e.target.files[0]));
                  }}/>
                </label>
                
                <div className="w-full mt-6 space-y-4">
                  <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl"><MapPin size={18}/></div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">Akurasi GPS Mendukung</p>
                        <p className="text-[10px] font-medium text-slate-500">{permissions.bebas_gps ? 'Bypass Mode Aktif' : 'Posisi: Sektor 7 (Jarak 12m)'}</p>
                      </div>
                    </div>
                    <CheckCircle2 size={20} className="text-emerald-500"/>
                  </div>
                  
                  <button 
                    onClick={handleAbsen}
                    disabled={isSubmitting || hasAbsenKeluar}
                    className={`w-full text-white font-black py-4 rounded-2xl text-sm transition-all shadow-xl 
                      ${hasAbsenKeluar ? 'bg-slate-400 shadow-none' : hasAbsenMasuk ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/30' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30'} 
                      ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'active:scale-95'}`}
                  >
                    {isSubmitting ? 'MEMPROSES...' : hasAbsenKeluar ? 'ABSENSI HARI INI SELESAI' : hasAbsenMasuk ? 'REKAM ABSEN KELUAR' : 'REKAM ABSEN MASUK'}
                  </button>

                  <div className="pt-5 border-t border-slate-100 w-full text-left">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5"><History size={12}/> Riwayat Absen Terakhir</h3>
                    <div className="space-y-2">
                      {attendanceHistory.map(att => (
                        <div key={att.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <div>
                            <p className="text-xs font-bold text-slate-700">{att.date}</p>
                            <p className="text-[9px] font-medium text-slate-500"><MapPin size={8} className="inline mr-0.5 text-indigo-400"/> {att.location_gps}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-black text-emerald-600">IN: {att.check_in_time?.substring(0,5) || '--'}</p>
                            <p className="text-[10px] font-bold text-slate-500">OUT: {att.check_out_time?.substring(0,5) || '--'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* --- TAB: LAPORAN (Patroli & Reguler) --- */}
          {activeMenu === 'laporan' && (
            <div className="space-y-4 fade-in mt-6">
              <div className="flex p-1.5 bg-white border border-slate-100 rounded-2xl shadow-sm">
                {permissions.reguler && <button onClick={() => setLaporanTab('reguler')} className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${laporanTab === 'reguler' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>Lap. Reguler</button>}
                {permissions.patroli && <button onClick={() => setLaporanTab('patroli')} className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${laporanTab === 'patroli' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>Lap. Patroli</button>}
              </div>

              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-5">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Judul Laporan</label>
                  <input type="text" value={reportTitle} onChange={(e) => setReportTitle(e.target.value)} className="w-full text-sm p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:outline-none focus:border-indigo-500 transition-colors" placeholder="Ketik judul kejadian..." />
                </div>
                
                {laporanTab === 'patroli' && (
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Verifikasi Area Pos</label>
                    <button className="w-full text-sm p-4 bg-indigo-50 border-2 border-indigo-200 border-dashed rounded-2xl text-indigo-600 font-black flex items-center justify-center gap-2 hover:bg-indigo-100 transition-colors">
                      <Camera size={18}/> Pindai QR Code Pos
                    </button>
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Keterangan Detail</label>
                  <textarea rows="4" value={reportDesc} onChange={(e) => setReportDesc(e.target.value)} className="w-full text-sm p-4 bg-slate-50 border border-slate-200 rounded-2xl font-medium focus:outline-none focus:border-indigo-500 transition-colors resize-none custom-scrollbar" placeholder="Jelaskan temuan secara rinci..."></textarea>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Bukti Foto Laporan</label>
                  <button className="w-20 h-20 bg-slate-50 border-2 border-slate-200 border-dashed hover:bg-slate-100 hover:border-indigo-300 rounded-2xl flex flex-col items-center justify-center text-slate-400 transition-colors">
                    <ImageIcon size={24} className="mb-1"/><span className="text-[9px] font-bold">Tambah</span>
                  </button>
                </div>

                <button onClick={handleKirimLaporan} disabled={isSubmitting} className="w-full bg-slate-800 hover:bg-slate-900 active:scale-95 text-white font-black py-4 rounded-2xl text-sm mt-2 transition-all shadow-lg shadow-slate-800/20 disabled:opacity-70">
                  {isSubmitting ? 'MENYIMPAN DATA...' : 'KIRIM LAPORAN SEKARANG'}
                </button>
              </div>

              {/* Riwayat Laporan */}
              <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 mt-4">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5"><History size={12}/> Riwayat Laporan Anda</h3>
                <div className="space-y-3">
                  {reportHistory.map(rep => (
                    <div key={rep.id} className="flex justify-between items-start bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div>
                        <p className="text-xs font-bold text-slate-700 line-clamp-1">{rep.title}</p>
                        <p className="text-[9px] font-medium text-slate-500 mt-0.5">{rep.report_type}</p>
                      </div>
                      <span className="text-[9px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0"><Check size={10}/> Terkirim</span>
                    </div>
                  ))}
                  {reportHistory.length === 0 && <p className="text-xs text-slate-400 italic">Belum ada riwayat laporan.</p>}
                </div>
              </div>
            </div>
          )}

          {/* --- TAB: PENGAJUAN --- */}
          {activeMenu === 'pengajuan' && (
            <div className="space-y-4 fade-in mt-6">
              <h2 className="font-black text-slate-800 text-lg px-2">Form Pengajuan</h2>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-5">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Jenis Pengajuan</label>
                  <select className="w-full text-sm p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:outline-none focus:border-indigo-500">
                    <option value="Cuti">Cuti / Izin Tidak Masuk</option>
                    <option value="Koreksi">Perbaikan Absen (Lupa Absen)</option>
                    <option value="Reimburse">Reimbursement (Klaim Biaya)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Tanggal Berlakunya</label>
                  <input type="date" className="w-full text-sm p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Alasan / Keterangan</label>
                  <textarea rows="3" className="w-full text-sm p-4 bg-slate-50 border border-slate-200 rounded-2xl font-medium focus:outline-none focus:border-indigo-500 resize-none" placeholder="Tuliskan alasan pengajuan secara jelas..."></textarea>
                </div>
                <button onClick={() => { alert("Pengajuan berhasil dikirim ke Admin/HRD untuk di-review!"); setActiveMenu('home'); }} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl text-sm mt-2 transition-all shadow-lg shadow-indigo-600/30">
                  KIRIM PENGAJUAN
                </button>
              </div>
            </div>
          )}

          {/* --- TAB: SETTINGS & PROFIL --- */}
          {activeMenu === 'settings' && (
            <div className="space-y-4 fade-in mt-6">
              <h2 className="font-black text-slate-800 text-lg px-2">Pengaturan Akun</h2>
              {/* Form Ganti Password Langsung */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4 mb-4">
                <h3 className="font-bold text-slate-700 text-sm mb-2 flex items-center gap-2"><Lock size={16}/> Ubah Kata Sandi Login</h3>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Password Baru</label>
                  <input type="password" placeholder="Masukkan password baru..." className="w-full text-sm p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:outline-none focus:border-indigo-500" />
                </div>
                <button onClick={() => { alert("Password berhasil diperbarui!"); setActiveMenu('home'); }} className="w-full bg-slate-800 hover:bg-slate-900 text-white font-black py-3.5 rounded-2xl text-sm transition-all shadow-lg">
                  SIMPAN PASSWORD
                </button>
              </div>
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden divide-y divide-slate-100">
                <button onClick={() => alert("Permintaan ubah foto profil dikirim ke Admin HRD.")} className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><User size={20}/></div>
                    <div className="text-left"><h3 className="font-bold text-slate-700 text-sm">Ubah Foto Profil</h3><p className="text-[10px] text-slate-500 font-medium mt-0.5">Butuh persetujuan HRD</p></div>
                  </div>
                </button>
                <button onClick={() => alert("Form pergantian kata sandi.")} className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><Lock size={20}/></div>
                    <div className="text-left"><h3 className="font-bold text-slate-700 text-sm">Ganti Kata Sandi</h3><p className="text-[10px] text-slate-500 font-medium mt-0.5">Pembaruan akses login</p></div>
                  </div>
                </button>
                <button onClick={handleLogout} className="w-full flex items-center justify-between p-5 hover:bg-rose-50 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl group-hover:bg-rose-100 transition-colors"><LogOut size={20}/></div>
                    <div className="text-left"><h3 className="font-bold text-rose-600 text-sm">Keluar Aplikasi</h3><p className="text-[10px] text-rose-400 font-medium mt-0.5">Akhiri sesi Anda saat ini</p></div>
                  </div>
                </button>
              </div>
            </div>
          )}

        </main>
        
        {/* ========================================== */}
        {/* === BOTTOM NAVBAR STICKY (BANKING STYLE) === */}
        {/* ========================================== */}
        <nav className="absolute bottom-0 w-full bg-white rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.08)] z-50 flex justify-between items-center px-12 py-4 pb-6 shrink-0">
          
          <button onClick={() => setActiveMenu('home')} className="flex flex-col items-center gap-1.5 w-12 transition-transform active:scale-95">
            <Home size={24} className={activeMenu === 'home' ? 'text-indigo-600' : 'text-slate-300'} />
            <span className={`text-[9px] font-bold ${activeMenu === 'home' ? 'text-indigo-600' : 'text-slate-400'}`}>Beranda</span>
          </button>

          {/* Tombol Absen Tengah (Floating melayang ke atas) */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-8">
            <button 
              onClick={() => setActiveMenu('absen')}
              className="w-16 h-16 bg-indigo-600 rounded-full border-4 border-slate-50 flex flex-col items-center justify-center text-white shadow-xl shadow-indigo-600/30 hover:bg-indigo-700 hover:-translate-y-1 transition-all active:scale-95"
            >
              <Camera size={26} className={hasAbsenMasuk && hasAbsenKeluar ? 'opacity-50' : ''}/>
            </button>
            <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-black text-indigo-600 tracking-wider">ABSEN</span>
          </div>

          <button onClick={() => setActiveMenu('settings')} className="flex flex-col items-center gap-1.5 w-12 transition-transform active:scale-95">
            <Settings size={24} className={activeMenu === 'settings' ? 'text-indigo-600' : 'text-slate-300'} />
            <span className={`text-[9px] font-bold ${activeMenu === 'settings' ? 'text-indigo-600' : 'text-slate-400'}`}>Akun</span>
          </button>

        </nav>
      </div>
    </div>
  );
}