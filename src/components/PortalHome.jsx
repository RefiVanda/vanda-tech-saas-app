import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Users, LogOut, Settings, X, Search, LayoutDashboard, ImagePlus, Trash2, Calendar, UserCircle, RefreshCw, KeyRound, ShieldAlert, Bell, Paperclip, PlusCircle, CreditCard, FileText } from 'lucide-react';

import { supabase } from '../supabase'; 

import { onMessage } from "firebase/messaging";
import { requestForToken, messaging } from '../firebase';

const PortalHome = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState('profile');
  const [allUsers, setAllUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [divisions, setDivisions] = useState([]);
  
  // State untuk Banner
  const [banners, setBanners] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [currentDate, setCurrentDate] = useState('');

  // State untuk Fungsi Ubah Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // --- STATE UNTUK INFORMASI/PENGUMUMAN ---
  const [announcements, setAnnouncements] = useState([]);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [infoForm, setInfoForm] = useState({ title: '', content: '', file: null });
  const [isSubmittingInfo, setIsSubmittingInfo] = useState(false);

  const [showNotifPrompt, setShowNotifPrompt] = useState(false);

  // ==========================================
  // FITUR BARU: SLIP GAJI PRIBADI KARYAWAN
  // ==========================================
  const [myPayslips, setMyPayslips] = useState([]);
  const [showMyPayslipsModal, setShowMyPayslipsModal] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState(null);

  const formatRupiah = (angka) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka || 0);

  // Fungsi mengambil data pengumuman
  const fetchAnnouncements = async () => {
    const { data } = await supabase
      .from('portal_announcements')
      .select('*')
      .order('created_at', { ascending: false });
    setAnnouncements(data || []);
  };

  useEffect(() => {
    if (!("Notification" in window)) {
      alert("Peringatan Sistem: Browser HP ini tidak mendukung Notifikasi. Pastikan Anda menggunakan koneksi HTTPS atau 'Add to Home Screen' (jika iOS).");
      return; 
    }

    if (Notification.permission === "default") {
      setShowNotifPrompt(true); 
    } else if (Notification.permission === "granted") {
      requestForToken().then(token => {
        if(token) console.log("Token aktif sedia kala:", token);
      });
    } else if (Notification.permission === "denied") {
      console.log("Izin notifikasi sudah pernah ditolak oleh pengguna.");
    }
    if (messaging) {
      const unsubscribe = onMessage(messaging, (payload) => {
        console.log("Pesan masuk saat aplikasi terbuka:", payload);
        if (Notification.permission === 'granted') {
          new Notification(payload.notification.title, {
            body: payload.notification.body,
            icon: '/Logo_apps.png',
            vibrate: [200, 100, 200] 
          });
        }
      });
      return () => {
        unsubscribe(); 
      };
    }
  }, []);

  const handleAllowNotification = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const token = await requestForToken();
        console.log("Token Baru User:", token);
        setShowNotifPrompt(false);
      } else {
        setShowNotifPrompt(false);
      }
    } catch (error) {
      console.error("Gagal meminta izin:", error);
      setShowNotifPrompt(false);
    }
  };

  // Fungsi Tambah Informasi
  const handleAddInfo = async (e) => {
    e.preventDefault();
    setIsSubmittingInfo(true);
    try {
      let attachmentUrl = null;
      if (infoForm.file) {
        const fileExt = infoForm.file.name.split('.').pop();
        const fileName = `attach_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('portal_attachments')
          .upload(fileName, infoForm.file);
        
        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('portal_attachments').getPublicUrl(fileName);
        attachmentUrl = data.publicUrl;
      }

      const { error } = await supabase.from('portal_announcements').insert([{
        title: infoForm.title,
        content: infoForm.content,
        attachment_url: attachmentUrl,
        author_id: user.id
      }]);

      if (error) throw error;

      alert('Informasi berhasil dipublikasikan!');
      setIsInfoModalOpen(false);
      setInfoForm({ title: '', content: '', file: null });
      fetchAnnouncements(); 
    } catch (err) {
      alert('Gagal menambahkan informasi: ' + err.message);
    } finally {
      setIsSubmittingInfo(false);
    }
  };

  // Fungsi Hapus Informasi
  const deleteInfo = async (id) => {
    if (!window.confirm('Hapus informasi ini dari portal?')) return;
    const { error } = await supabase.from('portal_announcements').delete().eq('id', id);
    if (!error) fetchAnnouncements();
  };

  const refreshUserData = async () => {
    const session = JSON.parse(localStorage.getItem('vest_user_session'));
    if (!session?.id) return;

    // 1. Ambil data profil user yang sedang login saat ini
    const { data, error } = await supabase
      .from('initial_users')
      .select('*')
      .eq('id', session.id)
      .single();

    if (!error && data) {
      setUser(data);
      localStorage.setItem('vest_user_session', JSON.stringify(data));
      
      // 2. TARIK DATA GAJI SAJA (TANPA JOIN RELASI SUPABASE AGAR TIDAK ERROR)
      const { data: payslipData, error: payslipError } = await supabase
        .from('finance_payroll')
        .select('*') // Cukup ambil bintang (*), hapus panggilan initial_users
        .eq('user_id', data.id)
        .eq('status', 'PAID')
        .order('period_month', { ascending: false });
      
      if (payslipError) {
        console.error("Gagal menarik data slip:", payslipError);
      }
      
      // 3. SUNTIKKAN DATA USER KE DALAM SLIP GAJI SECARA MANUAL
      if (payslipData && payslipData.length > 0) {
        const gabunganSlipGaji = payslipData.map(slip => ({
          ...slip,
          // Kita tempelkan manual data profil user yang sedang login ke dalam slip ini
          initial_users: {
            name: data.name,
            nik: data.nik,
            division: data.division,
            position: data.position
          }
        }));
        setMyPayslips(gabunganSlipGaji);
      } else {
        // Kosongkan state jika memang tidak ada data
        setMyPayslips([]);
      }
    }
  };

  const updatePermission = async (userId, field, value) => {
    await fetchUsers();
    await refreshUserData();

    const { error } = await supabase
      .from('initial_users')
      .update({ [field]: value })
      .eq('id', userId);

    if (error) {
      alert(error.message);
      return;
    }

    fetchUsers();
  };

  useEffect(() => {
    refreshUserData();
    fetchAnnouncements();

    const session = JSON.parse(localStorage.getItem('vest_user_session'));

    if (session?.role === 'admin') {
      fetchUsers();
      const fetchDivisions = async () => {
        const { data } = await supabase.from('initial_divisions').select('*');
        if (data) {
          const defaultDivs = ['Pusat', 'Direksi'];
          const dbDivs = data.map(d => d.name);
          setDivisions([...new Set([...defaultDivs, ...dbDivs])]);
        }
      };
      fetchDivisions();
    }

    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    setCurrentDate(new Date().toLocaleDateString('id-ID', dateOptions));
    fetchBanners(); 
  }, []);

  // Efek Slideshow Otomatis
  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]); 

  const fetchUsers = async () => {
    const { data } = await supabase.from('initial_users').select('*').order('name', { ascending: true });
    setAllUsers(data || []);
  };

  const toggleAccess = async (targetUser) => {
    if (user?.role !== 'admin' && user?.can_manage_hrd_users !== true) {
      alert('Anda tidak memiliki hak mengelola akses');
      return;
    }
    try {
      const newStatus = !targetUser.has_portal_access;
      const { error } = await supabase.from('initial_users').update({ has_portal_access: newStatus }).eq('id', targetUser.id);
      if (error) throw error;
      await fetchUsers();
      alert(`${targetUser.name} ${newStatus ? 'berhasil diberikan akses HRD' : 'berhasil dicabut akses HRD'}`);
    } catch (err) {
      alert('Gagal mengubah akses: ' + err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('vest_user_session');
    localStorage.removeItem('isAuthenticated');
    window.location.href = '/login';
  };

  const canAccessRecruitment = () => {
    if (!user) return false;
    return user.has_portal_access === true;
  };

  const fetchBanners = async () => {
    const { data } = await supabase.storage.from('portal_banners').list();
    if (data) {
      const validFiles = data.filter(file => file.name !== '.emptyFolderPlaceholder' && file.id);
      const urls = validFiles.map(file => ({
        name: file.name,
        url: supabase.storage.from('portal_banners').getPublicUrl(file.name).data.publicUrl
      }));
      setBanners(urls);
    }
  };

  const handleBannerUpload = async (e) => {
    const fileInput = e.target;
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) return;
    
    try {
      const file = fileInput.files[0];
      if (file.size > 2 * 1024 * 1024) {
        alert('Gagal: Ukuran gambar terlalu besar! Maksimal 2MB.');
        fileInput.value = ''; 
        return;
      }

      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `banner_${Date.now()}.${fileExt}`;

      const { error } = await supabase.storage.from('portal_banners').upload(fileName, file);
      if (error) {
        alert('Gagal upload banner: ' + error.message);
      } else {
        await fetchBanners(); 
        alert('Banner baru berhasil diterapkan!');
      }
    } catch (err) {
      alert('Terjadi kesalahan sistem saat memproses gambar.');
    } finally {
      setIsUploading(false);
      if (fileInput) fileInput.value = ''; 
    }
  };

  const deleteBanner = async (fileName) => {
    if (!window.confirm('Hapus banner ini?')) return;
    const { error } = await supabase.storage.from('portal_banners').remove([fileName]);
    if (!error) {
      fetchBanners();
      setCurrentSlide(0);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (currentPassword !== user.password) {
      setPasswordError('Password saat ini tidak sesuai!');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Password baru minimal harus 6 karakter!');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Konfirmasi password baru tidak cocok!');
      return;
    }

    try {
      setIsUpdatingPassword(true);
      const { error } = await supabase.from('initial_users').update({ password: newPassword }).eq('id', user.id);
      if (error) throw error;

      setPasswordSuccess('Password Akun Anda berhasil diperbarui!');
      
      const updatedSession = { ...user, password: newPassword };
      localStorage.setItem('vest_user_session', JSON.stringify(updatedSession));
      setUser(updatedSession);
      
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError('Gagal menyimpan ke server: ' + err.message);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  if (!user) return null;

  const canManageInfo = user.role === 'admin' || user.can_manage_portal_info === true;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-24 md:pb-10">
      
      {/* HEADER NAVBAR */}
      <nav className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-400 p-2 rounded-lg shadow-md">
              <img src="/Logo_apps.png" alt="Logo" className="w-6 h-6 object-contain" />
            </div>
            <h1 className="text-xl font-black tracking-tight text-slate-900 hidden md:block">
              VANDA ERP SYSTEM TECH <span className="text-yellow-600/60">( V . E . S . T )</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <button onClick={() => { setIsSettingsModalOpen(true); setActiveSettingsTab('profile'); }} className="hidden md:block p-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-full transition-all text-slate-700 shadow-sm" title="Pengaturan Akun & Akses">
              <Settings size={18} />
            </button>
            <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-slate-950 text-white rounded-full font-bold text-xs md:text-sm shadow-md hover:bg-slate-800 transition-all">
              <LogOut size={14} /> <span className="hidden md:inline">Keluar</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 md:px-6 pt-6 md:pt-10">
        
        {/* BARIS ATAS: KARTU DATA KARYAWAN */}
        <div className="bg-slate-950 rounded-3xl p-6 md:p-8 mb-8 shadow-xl shadow-slate-900/10 text-white relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/20 blur-3xl rounded-full -translate-y-1/2 translate-x-1/3"></div>
           
           <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <div className="flex items-center gap-2 text-amber-500 font-bold text-xs uppercase tracking-widest mb-2">
                  <Calendar size={14} /> {currentDate}
                </div>
                <h2 className="text-2xl md:text-4xl font-black mb-1">Selamat Datang, <span className="text-yellow-400">{user.name}</span></h2>
                <p className="text-slate-400 text-xs md:text-sm">Portal Hub ERP V.E.S.T System</p>
              </div>

              <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl w-full md:w-auto min-w-[280px]">
                <div className="flex items-center gap-3 mb-2 border-b border-white/10 pb-2">
                   <div className="bg-yellow-500 p-1.5 rounded-full text-slate-950"><UserCircle size={18}/></div>
                   <div>
                     <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Nomor Induk Karyawan</p>
                     <p className="font-black text-xs md:text-sm text-slate-100">{user.nik || '-'}</p>
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                   <div>
                     <p className="text-[9px] text-slate-400 uppercase font-bold">Divisi</p>
                     <p className="font-bold text-yellow-400 truncate">{user.division || user.role}</p>
                   </div>
                   <div>
                     <p className="text-[9px] text-slate-400 uppercase font-bold">Jabatan</p>
                     <p className="font-bold text-white truncate">{user.position || user.role}</p>
                   </div>
                </div>
              </div>
           </div>
        </div>

        {/* PENGUMUMAN */}
        {(announcements.length > 0 || canManageInfo) && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-3 px-2">
               <h3 className="font-black text-slate-800 text-sm md:text-lg flex items-center gap-2">
                 <Bell size={18} className="text-amber-500" /> Pengumuman
               </h3>
               {canManageInfo && (
                 <button onClick={() => setIsInfoModalOpen(true)} className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-all">
                   <PlusCircle size={14} /> Tambah Info
                 </button>
               )}
            </div>

            {announcements.length > 0 ? (
              <div className="space-y-3">
                {announcements.map((info) => (
                  <div key={info.id} className="bg-white border-l-4 border-amber-500 border-y border-r border-slate-200 p-4 md:p-5 rounded-r-2xl shadow-sm relative group transition-all hover:shadow-md">
                    {(user.role === 'admin' || (user.can_manage_portal_info && info.author_id === user.id)) && (
                      <button onClick={() => deleteInfo(info.id)} className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors" title="Hapus Informasi">
                        <Trash2 size={16} />
                      </button>
                    )}
                    <h4 className="font-bold text-slate-900 text-sm md:text-base pr-8 mb-1">{info.title}</h4>
                    <p className="text-slate-600 text-xs md:text-sm whitespace-pre-wrap leading-relaxed">{info.content}</p>
                    {info.attachment_url && (
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <a href={info.attachment_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[10px] md:text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 py-1.5 px-3 rounded-lg transition-colors">
                          <Paperclip size={12} /> Buka Lampiran
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-6 border border-dashed border-slate-200 rounded-2xl bg-white/50 text-slate-400 text-xs font-medium">
                Belum ada pengumuman tertulis.
              </div>
            )}
          </div>
        )}

        {/* BANNER SLIDESHOW */}
        {(banners.length > 0 || user.role === 'admin') && (
          <div className="mb-10 relative">
            <div className="flex justify-between items-center mb-3 px-2">
               <h3 className="font-black text-slate-800 text-sm md:text-lg">Banner Informasi Event</h3>
               {user.role === 'admin' && (
                 <label className="flex items-center gap-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer shadow-sm transition-all">
                    {isUploading ? <RefreshCw size={14} className="animate-spin" /> : <ImagePlus size={14} />}
                    {isUploading ? 'Proses...' : 'Upload Banner'}
                    <input type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" disabled={isUploading} />
                 </label>
               )}
            </div>
            {banners.length > 0 ? (
              <div className="relative w-full h-auto bg-slate-100/50 rounded-3xl overflow-hidden shadow-md border border-slate-200 group flex items-center justify-center">
                <img src={banners[currentSlide].url} alt="Banner Internal" className="w-full h-auto object-contain transition-all duration-500 ease-in-out"/>
                {user.role === 'admin' && (
                   <button onClick={() => deleteBanner(banners[currentSlide].name)} className="absolute top-4 right-4 bg-red-600/90 hover:bg-red-700 text-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all z-10" title="Hapus Banner Ini">
                     <Trash2 size={16} />
                   </button>
                )}
                {banners.length > 1 && (
                  <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10 bg-gradient-to-t from-black/20 to-transparent pt-4 pb-2">
                    {banners.map((_, idx) => (
                      <div key={idx} onClick={() => setCurrentSlide(idx)} className={`h-1.5 rounded-full cursor-pointer transition-all duration-300 ${idx === currentSlide ? 'bg-amber-400 w-6' : 'bg-white/60 w-1.5 hover:bg-white'}`}/>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-[140px] border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400 bg-white p-4 text-center">
                 <p className="font-bold text-xs">Belum ada papan pengumuman digital yang diunggah.</p>
              </div>
            )}
          </div>
        )}

        <h3 className="font-black text-slate-800 text-sm md:text-lg mb-4 px-2">Menu Layanan</h3>
        
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-6`}>
          
          <div onClick={() => navigate('/TaskManagement')} className="group bg-white border border-slate-200 p-6 md:p-8 rounded-[2rem] hover:border-amber-500 hover:shadow-xl hover:shadow-amber-500/5 transition-all cursor-pointer relative overflow-hidden">
            <div className="w-12 h-12 bg-slate-950 text-amber-400 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
              <ClipboardList size={24} strokeWidth={2.5} />
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-1">Task Management</h3>
            <p className="text-slate-500 text-xs md:text-sm leading-relaxed mb-6">Kelola dan pantau seluruh laporan target kinerja divisi operasional harian.</p>
            <span className="font-bold text-xs text-amber-600 group-hover:underline">Buka Dashboard &rarr;</span>
          </div>

          {/* MENU SLIP GAJI (BARU) */}
          <div onClick={() => setShowMyPayslipsModal(true)} className="group bg-white border border-slate-200 p-6 md:p-8 rounded-[2rem] hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/5 transition-all cursor-pointer relative overflow-hidden">
            <div className="w-12 h-12 bg-blue-500 text-white rounded-2xl flex items-center justify-center mb-6 shadow-sm"><FileText size={24} strokeWidth={2.5} /></div>
            <h3 className="text-lg font-black text-slate-900 mb-1">Slip Gaji Saya</h3>
            <p className="text-slate-500 text-xs md:text-sm leading-relaxed mb-6">Lihat dan unduh riwayat slip gaji bulanan Anda yang telah diterbitkan perusahaan.</p>
            <span className="font-bold text-xs text-blue-600 group-hover:underline">Buka Slip Gaji &rarr;</span>
          </div>

          {(user.can_access_finance || user.role === 'admin' || user.role === 'direksi') && (
            <div onClick={() => navigate('/finance')} className="group bg-white border border-slate-200 p-6 md:p-8 rounded-[2rem] hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-500/5 transition-all cursor-pointer relative overflow-hidden">
              <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                <CreditCard size={24} strokeWidth={2.5} />
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-1">Modul Finance</h3>
              <p className="text-slate-500 text-xs md:text-sm leading-relaxed mb-6">Kelola arus kas, penggajian (payroll), tagihan klien, dan validasi reimbursement.</p>
              <span className="font-bold text-xs text-emerald-600 group-hover:underline">Buka Keuangan &rarr;</span>
            </div>
          )}

          {canAccessRecruitment() && (
            <div onClick={() => navigate('/recruitment-admin')} className="group bg-white border border-slate-200 p-6 md:p-8 rounded-[2rem] hover:border-amber-500 hover:shadow-xl hover:shadow-amber-500/5 transition-all cursor-pointer relative overflow-hidden">
              <div className="w-12 h-12 bg-yellow-500 text-slate-950 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                <Users size={24} strokeWidth={2.5} />
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-1">Menu HRD</h3>
              <p className="text-slate-500 text-xs md:text-sm leading-relaxed mb-6">Database screening pelamar, kuesioner fisik, uji kompetensi, dan plotting penempatan.</p>
              <span className="font-bold text-xs text-amber-600 group-hover:underline">Masuk Modul HRD &rarr;</span>
            </div>
          )}

        </div>
      </main>

      {/* MODAL SETTINGS & AKSES */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-2xl max-h-[85vh] rounded-[2.5rem] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">PENGATURAN KONTROL PORTAL</h3>
                <p className="text-xs text-slate-500">Kelola akun pribadi Anda dan hak keamanan sistem</p>
              </div>
              <button onClick={() => setIsSettingsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-full transition-colors"><X size={20}/></button>
            </div>

            <div className="flex border-b border-slate-100 px-6 bg-slate-50/50">
              <button onClick={() => setActiveSettingsTab('profile')} className={`py-3 px-4 text-xs font-black tracking-wider uppercase border-b-2 transition-all ${activeSettingsTab === 'profile' ? 'border-slate-950 text-slate-950' : 'border-transparent text-slate-400'}`}>
                Keamanan Akun (Password)
              </button>
              {user?.role === 'admin' && (
                <button onClick={() => setActiveSettingsTab('access')} className={`py-3 px-4 text-xs font-black tracking-wider uppercase border-b-2 transition-all ${activeSettingsTab === 'access' ? 'border-slate-950 text-slate-950' : 'border-transparent text-slate-400'}`}>
                  Manajemen Pengguna & Akses
                </button>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 pb-8 bg-white custom-scrollbar">
              {activeSettingsTab === 'profile' && (
                <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md mx-auto py-2">
                  <div className="text-center mb-6"><p className="text-xs text-slate-500 font-medium">Demi keamanan, ganti kata sandi Anda secara berkala secara rahasia.</p></div>
                  {passwordError && <div className="p-3 bg-red-50 text-red-600 rounded-xl border border-red-200 font-bold text-xs text-center">{passwordError}</div>}
                  {passwordSuccess && <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-200 font-bold text-xs text-center">{passwordSuccess}</div>}
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Kata Sandi Saat Ini</label>
                    <input required type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Masukkan password sekarang" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 focus:outline-none focus:border-amber-500 text-sm font-bold"/>
                  </div>
                  <div className="border-t border-slate-100 pt-3">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Kata Sandi Baru</label>
                    <input required type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Minimal 6 karakter" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 focus:outline-none focus:border-amber-500 text-sm font-bold"/>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Ulangi Kata Sandi Baru</label>
                    <input required type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Ketik ulang password baru" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 focus:outline-none focus:border-amber-500 text-sm font-bold"/>
                  </div>
                  <button type="submit" disabled={isUpdatingPassword} className="w-full mt-4 bg-slate-950 text-white font-bold py-3 rounded-xl shadow-md hover:bg-slate-800 transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2">
                     <KeyRound size={14}/> {isUpdatingPassword ? 'Menyimpan...' : 'Perbarui Kata Sandi Saya'}
                  </button>
                </form>
              )}

              {activeSettingsTab === 'access' && user?.role === 'admin' && (
                <div className="space-y-4">
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                    <input type="text" placeholder="Ketik nama karyawan untuk mencari..." onChange={(e) => setSearch(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:border-amber-500 text-xs md:text-sm"/>
                  </div>
                  <div className="space-y-2">
                    {allUsers.filter(u => u.name.toLowerCase().includes(search.toLowerCase())).map(u => (
                      <div key={u.id} className="flex flex-col p-4 bg-slate-50 hover:bg-slate-100/70 rounded-2xl border border-slate-200 transition-all gap-3">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div>
                              <p className="font-black text-sm md:text-base text-slate-900">{u.name}</p>
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">NIK: {u.nik || '-'} • JABATAN: {u.position || '-'}</p>
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto">
                              <select value={u.role} onChange={(e) => updatePermission(u.id, 'role', e.target.value)} className="bg-white border border-slate-200 text-xs font-bold rounded-lg px-2 py-1.5 outline-none focus:border-blue-500 shadow-sm cursor-pointer">
                                <option value="staff">Staff</option><option value="manager">Manager</option><option value="direksi">Direksi</option><option value="admin">Admin</option>
                              </select>
                              <select value={u.division} onChange={(e) => updatePermission(u.id, 'division', e.target.value)} className="bg-white border border-slate-200 text-xs font-bold rounded-lg px-2 py-1.5 outline-none focus:border-blue-500 shadow-sm cursor-pointer">
                                <option value="">- Divisi -</option>
                                {divisions.map(div => <option key={div} value={div}>{div}</option>)}
                              </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                             <label className="flex items-center gap-2 cursor-pointer bg-white px-2 py-1.5 rounded-lg border border-slate-200">
                                <input type="checkbox" checked={u.has_portal_access || false} onChange={(e) => updatePermission(u.id, 'has_portal_access', e.target.checked)} className="w-3.5 h-3.5"/>
                                <span className="text-[10px] font-bold text-slate-700">Akses HRD</span>
                             </label>
                             <label className="flex items-center gap-2 cursor-pointer bg-white px-2 py-1.5 rounded-lg border border-slate-200">
                                <input type="checkbox" checked={u.can_create_hrd || false} onChange={(e) => updatePermission(u.id, 'can_create_hrd', e.target.checked)} className="w-3.5 h-3.5"/>
                                <span className="text-[10px] font-bold text-slate-700">Akses Buat Data</span>
                             </label>
                             <label className="flex items-center gap-2 cursor-pointer bg-white px-2 py-1.5 rounded-lg border border-slate-200">
                                <input type="checkbox" checked={u.can_edit_hrd || false} onChange={(e) => updatePermission(u.id, 'can_edit_hrd', e.target.checked)} className="w-3.5 h-3.5"/>
                                <span className="text-[10px] font-bold text-slate-700">Akses Edit Data</span>
                             </label>
                             <label className="flex items-center gap-2 cursor-pointer bg-white px-2 py-1.5 rounded-lg border border-slate-200">
                                <input type="checkbox" checked={u.can_delete_hrd || false} onChange={(e) => updatePermission(u.id, 'can_delete_hrd', e.target.checked)} className="w-3.5 h-3.5"/>
                                <span className="text-[10px] font-bold text-slate-700">Akses Hapus Data</span>
                             </label>
                             <label className="flex items-center gap-2 cursor-pointer bg-white px-2 py-1.5 rounded-lg border border-slate-200">
                                <input type="checkbox" checked={u.can_manage_hrd_users || false} onChange={(e) => updatePermission(u.id, 'can_manage_hrd_users', e.target.checked)} className="w-3.5 h-3.5"/>
                                <span className="text-[10px] font-bold text-slate-700">Kelola Akses Management Users</span>
                             </label>
                             <label className="flex items-center gap-2 cursor-pointer bg-white px-2 py-1.5 rounded-lg border border-slate-200">
                                <input type="checkbox" checked={u.can_manage_portal_info || false} onChange={(e) => updatePermission(u.id, 'can_manage_portal_info', e.target.checked)} className="w-3.5 h-3.5"/>
                                <span className="text-[10px] font-bold text-slate-700">Kelola Info</span>
                             </label>

                              <div className="col-span-2 md:col-span-3 h-px bg-slate-200 my-1"></div>
                              <div className="col-span-2 md:col-span-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Akses Sub-Menu HRD</div>

                              <label className="flex items-center gap-2 cursor-pointer bg-white px-2 py-1.5 rounded-lg border border-slate-200">
                                <input type="checkbox" checked={u.can_access_recruitment || false} onChange={(e) => updatePermission(u.id, 'can_access_recruitment', e.target.checked)} className="w-3.5 h-3.5 text-blue-600 focus:ring-blue-500 rounded border-slate-300"/>
                                <span className="text-[10px] font-bold text-slate-700">Menu Recruitment</span>
                              </label>

                              <label className="flex items-center gap-2 cursor-pointer bg-white px-2 py-1.5 rounded-lg border border-slate-200">
                                <input type="checkbox" checked={u.can_access_hris || false} onChange={(e) => updatePermission(u.id, 'can_access_hris', e.target.checked)} className="w-3.5 h-3.5 text-blue-600 focus:ring-blue-500 rounded border-slate-300"/>
                                <span className="text-[10px] font-bold text-slate-700">Menu HRIS</span>
                              </label>
                              

                              <div className="col-span-2 md:col-span-3 h-px bg-slate-200 my-1"></div>
                              <div className="col-span-2 md:col-span-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Akses Sub-Menu Finance</div>

                              <label className="flex items-center gap-2 cursor-pointer bg-white px-2 py-1.5 rounded-lg border border-slate-200">
                                <input type="checkbox" checked={u.can_access_finance_dashboard || false} onChange={(e) => updatePermission(u.id, 'can_access_finance_dashboard', e.target.checked)} className="w-3.5 h-3.5 text-blue-600 focus:ring-blue-500 rounded border-slate-300"/>
                                <span className="text-[10px] font-bold text-slate-700">Menu Dashboard</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer bg-white px-2 py-1.5 rounded-lg border border-slate-200">
                                <input type="checkbox" checked={u.can_access_finance || false} onChange={(e) => updatePermission(u.id, 'can_access_finance', e.target.checked)} className="w-3.5 h-3.5 text-blue-600 focus:ring-blue-500 rounded border-slate-300"/>
                                <span className="text-[10px] font-bold text-slate-700">Akses Modul</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer bg-white px-2 py-1.5 rounded-lg border border-slate-200">
                                <input type="checkbox" checked={u.can_manage_cashflow || false} onChange={(e) => updatePermission(u.id, 'can_manage_cashflow', e.target.checked)} className="w-3.5 h-3.5 text-blue-600 focus:ring-blue-500 rounded border-slate-300"/>
                                <span className="text-[10px] font-bold text-slate-700">Kelola Arus Kas</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer bg-white px-2 py-1.5 rounded-lg border border-slate-200">
                                <input type="checkbox" checked={u.can_manage_payroll || false} onChange={(e) => updatePermission(u.id, 'can_manage_payroll', e.target.checked)} className="w-3.5 h-3.5 text-blue-600 focus:ring-blue-500 rounded border-slate-300"/>
                                <span className="text-[10px] font-bold text-slate-700">Kelola Payroll</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer bg-white px-2 py-1.5 rounded-lg border border-slate-200">
                                <input type="checkbox" checked={u.can_manage_finance || false} onChange={(e) => updatePermission(u.id, 'can_manage_finance', e.target.checked)} className="w-3.5 h-3.5 text-blue-600 focus:ring-blue-500 rounded border-slate-300"/>
                                <span className="text-[10px] font-bold text-slate-700">Kelola Invoice</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer bg-white px-2 py-1.5 rounded-lg border border-slate-200">
                                <input type="checkbox" checked={u.can_approve_finance || false} onChange={(e) => updatePermission(u.id, 'can_approve_finance', e.target.checked)} className="w-3.5 h-3.5 text-blue-600 focus:ring-blue-500 rounded border-slate-300"/>
                                <span className="text-[10px] font-bold text-slate-700">Hak Approval</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer bg-white px-2 py-1.5 rounded-lg border border-slate-200">
                                <input type="checkbox" checked={u.can_access_cashflow || false} onChange={(e) => updatePermission(u.id, 'can_access_cashflow', e.target.checked)} className="w-3.5 h-3.5 text-blue-600 focus:ring-blue-500 rounded border-slate-300"/>
                                <span className="text-[10px] font-bold text-slate-700">Menu Arus Kas</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer bg-white px-2 py-1.5 rounded-lg border border-slate-200">
                                <input type="checkbox" checked={u.can_access_invoice || false} onChange={(e) => updatePermission(u.id, 'can_access_invoice', e.target.checked)} className="w-3.5 h-3.5 text-blue-600 focus:ring-blue-500 rounded border-slate-300"/>
                                <span className="text-[10px] font-bold text-slate-700">Menu Invoice</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer bg-white px-2 py-1.5 rounded-lg border border-slate-200">
                                <input type="checkbox" checked={u.can_access_finance_report || false} onChange={(e) => updatePermission(u.id, 'can_access_finance_report', e.target.checked)} className="w-3.5 h-3.5 text-blue-600 focus:ring-blue-500 rounded border-slate-300"/>
                                <span className="text-[10px] font-bold text-slate-700">Menu Laporan</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer bg-white px-2 py-1.5 rounded-lg border border-slate-200">
                                <input type="checkbox" checked={u.can_access_finance_settings || false} onChange={(e) => updatePermission(u.id, 'can_access_finance_settings', e.target.checked)} className="w-3.5 h-3.5 text-blue-600 focus:ring-blue-500 rounded border-slate-300"/>
                                <span className="text-[10px] font-bold text-slate-700">Menu Setting</span>
                              </label>

                              {/* --- BLOK AKSES TASK & OPERASIONAL --- */}
                              <div className="col-span-2 md:col-span-3 h-px bg-slate-200 my-1"></div>
                              <div className="col-span-2 md:col-span-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Akses Operasional & Task Management</div>

                              <label className="flex items-center gap-2 cursor-pointer bg-white px-2 py-1.5 rounded-lg border border-emerald-200">
                                <input type="checkbox" checked={u.cleaningAccess || false} onChange={(e) => updatePermission(u.id, 'cleaningAccess', e.target.checked)} className="w-3.5 h-3.5 text-emerald-600 focus:ring-emerald-500 rounded border-slate-300"/>
                                <span className="text-[10px] font-bold text-slate-700">Laporan OB/Cleaning</span>
                              </label>
                              
                              {(u.role === 'manager' || u.role === 'direksi') && (
                                <label className="flex items-center gap-2 cursor-pointer bg-white px-2 py-1.5 rounded-lg border border-purple-200">
                                  <input type="checkbox" checked={u.crossDivision || false} onChange={(e) => updatePermission(u.id, 'crossDivision', e.target.checked)} className="w-3.5 h-3.5 text-purple-600 focus:ring-purple-500 rounded border-slate-300"/>
                                  <span className="text-[10px] font-bold text-slate-700">Pantau Lintas Divisi (All)</span>
                                </label>
                              )}
                              
                              {u.role === 'direksi' && !u.crossDivision && (
                                <div className="col-span-2 md:col-span-3 bg-purple-50 border border-purple-100 p-2 rounded-lg mt-1">
                                   <span className="text-[9px] font-bold text-purple-800 block mb-1">Pilih Divisi Spesifik yang Bisa Dipantau oleh Direksi:</span>
                                   <div className="flex flex-wrap gap-2">
                                     {divisions.map(div => (
                                       <label key={div} className="flex items-center gap-1.5 cursor-pointer">
                                          <input type="checkbox" checked={(u.accessible_divisions || []).includes(div)} onChange={(e) => {
                                            const current = u.accessible_divisions || [];
                                            const updated = e.target.checked ? [...current, div] : current.filter(d => d !== div);
                                            updatePermission(u.id, 'accessible_divisions', updated);
                                          }} className="w-3 h-3 text-purple-600 rounded border-slate-300"/>
                                          <span className="text-[9px] font-bold text-slate-700">{div}</span>
                                       </label>
                                     ))}
                                   </div>
                                </div>
                              )}
                        </div>
                      </div>
                    ))}
                    {allUsers.filter(u => u.name.toLowerCase().includes(search.toLowerCase())).length === 0 && (
                      <div className="text-center py-6 text-slate-400 text-xs">Karyawan tidak ditemukan.</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH INFORMASI (KHUSUS ADMIN) */}
      {isInfoModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-black text-slate-900 text-sm tracking-tight uppercase">Buat Pengumuman Baru</h3>
              <button onClick={() => setIsInfoModalOpen(false)} className="text-slate-400 hover:text-slate-800"><X size={20}/></button>
            </div>
            <form onSubmit={handleAddInfo} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1.5">Judul Informasi</label>
                <input required type="text" value={infoForm.title} onChange={e => setInfoForm({...infoForm, title: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-amber-500" placeholder="Contoh: Jadwal Maintenance Server" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1.5">Isi Pesan</label>
                <textarea required rows="4" value={infoForm.content} onChange={e => setInfoForm({...infoForm, content: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-amber-500" placeholder="Tuliskan detail informasi..." />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1.5">Lampiran File / Gambar (Opsional)</label>
                <input type="file" onChange={e => setInfoForm({...infoForm, file: e.target.files[0]})} className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 cursor-pointer" />
              </div>
              <div className="pt-2">
                <button type="submit" disabled={isSubmittingInfo} className="w-full bg-slate-950 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-all text-xs uppercase tracking-wider">
                  {isSubmittingInfo ? 'Memproses...' : 'Publikasikan Sekarang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL PUSH NOTIFICATION --- */}
      {showNotifPrompt && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-6 text-center animate-fade-in-up">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell size={32} />
            </div>
            <h3 className="font-black text-slate-900 text-xl mb-2">Nyalakan Notifikasi</h3>
            <p className="text-sm text-slate-500 mb-6 font-medium">Agar Anda tidak ketinggalan informasi tugas dan instruksi penting dari operasional perusahaan.</p>
            <div className="space-y-3">
              <button onClick={handleAllowNotification} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3.5 rounded-xl shadow-lg transition-all">Ya, Izinkan Notifikasi</button>
              <button onClick={() => setShowNotifPrompt(false)} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold py-3.5 rounded-xl transition-all">Nanti Saja</button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL DAFTAR SLIP GAJI SAYA */}
      {/* ========================================== */}
      {showMyPayslipsModal && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-blue-600 text-white shrink-0">
              <div>
                <h3 className="font-black text-lg tracking-tight">Riwayat Slip Gaji</h3>
                <p className="text-[10px] text-blue-100 mt-0.5">Hanya menampilkan slip yang sudah disetujui (PAID).</p>
              </div>
              <button onClick={() => setShowMyPayslipsModal(false)} className="text-white hover:bg-white/20 p-2 rounded-full transition"><X size={20}/></button>
            </div>
            
            <div className="p-4 flex-1 overflow-y-auto custom-scrollbar bg-slate-50">
              {myPayslips.length === 0 ? (
                <div className="text-center py-10">
                  <FileText size={48} className="mx-auto text-slate-300 mb-3"/>
                  <p className="text-slate-500 font-bold text-sm">Belum ada slip gaji yang diterbitkan.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myPayslips.map(slip => (
                    <div key={slip.id} onClick={() => setSelectedPayslip(slip)} className="bg-white border border-slate-200 p-4 rounded-2xl flex justify-between items-center shadow-sm hover:border-blue-500 hover:shadow-md cursor-pointer transition-all">
                       <div>
                         <h4 className="font-black text-slate-800 text-sm">Periode {slip.period_month}</h4>
                         <p className="text-[10px] text-slate-500 font-bold mt-1">THP: <span className="text-emerald-600">{formatRupiah(slip.net_salary)}</span></p>
                       </div>
                       <button className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest">Buka</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL POP-UP DETAIL / CETAK SLIP GAJI */}
      {/* ========================================== */}
      {selectedPayslip && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[300] flex justify-center items-center p-4 print:p-0 print:bg-transparent print:block print:relative print:z-auto">
          <div className="bg-white w-full max-w-4xl max-h-[95vh] overflow-y-auto rounded-2xl shadow-2xl flex flex-col relative print:max-h-none print:overflow-visible print:shadow-none print:rounded-none print:border-none print:block">
            
            {/* Header Aksi (Hanya Tampil di Layar, Hilang Saat Print) */}
            <div className="sticky top-0 bg-slate-50 border-b border-slate-200 p-4 flex justify-between items-center z-10 print:hidden">
               <h3 className="font-black text-slate-800 flex items-center gap-2">
                 <FileText size={18} className="text-blue-600"/> Pratinjau Slip Gaji
               </h3>
               <div className="flex gap-2">
                  <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-md transition-all">
                    <FileText size={16}/> Cetak / Simpan PDF
                  </button>
                  <button onClick={() => setSelectedPayslip(null)} className="bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 px-5 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all">
                    <X size={16}/> Tutup
                  </button>
               </div>
            </div>

            {/* KERTAS SLIP GAJI (Area yang Akan Dicetak) */}
            <div id="official-payslip-print" className="p-8 md:p-12 bg-white text-black font-sans print:p-0 print:m-0" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
               
               {/* Header Perusahaan */}
               <div className="border-[3px] border-black p-4 mb-6 relative flex flex-col items-center justify-center bg-green-50/30">
                  <div className="absolute left-4 top-4 w-20 h-20 flex flex-col items-center justify-center">
                    {/* Placeholder Logo (Ganti src dengan link logo perusahaanmu jika ada) */}
                    <img src="/Logo_apps.png" alt="Logo" className="w-12 h-12 object-contain" />
                  </div>
                  <div className="text-center">
                     <h1 className="text-3xl font-black uppercase tracking-widest">PAY SLIP</h1>
                     <h2 className="text-xl font-medium mt-1 text-slate-800">PT Satria Wira Sriwijaya</h2>
                     <h3 className="text-lg font-bold mt-1 text-slate-900">{selectedPayslip.period_month}</h3>
                  </div>
               </div>

               {/* Keterangan Identitas Karyawan */}
               <div className="mb-6 px-2">
                  <table className="text-sm font-medium">
                     <tbody>
                        <tr><td className="w-40 py-1 text-slate-700">Employee ID</td><td className="px-2">:</td><td className="font-bold">{selectedPayslip.initial_users?.nik || '-'}</td></tr>
                        <tr><td className="py-1 text-slate-700">Employee Name</td><td className="px-2">:</td><td className="font-bold">{selectedPayslip.initial_users?.name || '-'}</td></tr>
                        <tr><td className="py-1 text-slate-700">Position</td><td className="px-2">:</td><td className="font-bold">{selectedPayslip.initial_users?.position || '-'}</td></tr>
                        <tr><td className="py-1 text-slate-700">Area / Site</td><td className="px-2">:</td><td className="font-bold">{selectedPayslip.initial_users?.division || 'Pusat (HO)'}</td></tr>
                     </tbody>
                  </table>
               </div>

               {/* Tabel Penghasilan (Earning) & Potongan (Deduction) */}
               <table className="w-full border-collapse border-[3px] border-black text-sm mb-8">
                  <thead>
                     <tr className="bg-blue-100 border-b-[3px] border-black">
                        <th className="border-r border-black p-2 text-center w-1/4 font-black">Earning</th>
                        <th className="border-r-[3px] border-black p-2 text-center w-1/4 font-black">Amount</th>
                        <th className="border-r border-black p-2 text-center w-1/4 font-black">Deductions</th>
                        <th className="p-2 text-center w-1/4 font-black">Amount</th>
                     </tr>
                  </thead>
                  <tbody>
                     {(() => {
                        // Memisahkan Earning dan Deduction
                        const earnings = [{ name: 'Basic Salary', amount: selectedPayslip.base_salary }, ...(selectedPayslip.custom_details || []).filter(c => c.type === 'earning')];
                        const deductions = (selectedPayslip.custom_details || []).filter(c => c.type === 'deduction');
                        const totalEarning = earnings.reduce((sum, e) => sum + Number(e.amount), 0);
                        const totalDeduction = deductions.reduce((sum, d) => sum + Number(d.amount), 0);
                        
                        // PERUBAHAN DISINI: Menyesuaikan baris tepat sesuai jumlah inputan terbesar (minimal 1 baris)
                        const maxRows = Math.max(earnings.length, deductions.length) || 1; 
                        const rows = [];
                        
                        for (let i = 0; i < maxRows; i++) {
                           rows.push(
                              <tr key={i} className="border-b border-black align-top">
                                 <td className="border-r border-black p-2">{earnings[i] ? earnings[i].name : ''}</td>
                                 <td className="border-r-[3px] border-black p-2 text-right">{earnings[i] ? formatRupiah(earnings[i].amount).replace('Rp', '') : ''}</td>
                                 <td className="border-r border-black p-2">{deductions[i] ? deductions[i].name : ''}</td>
                                 <td className="p-2 text-right">{deductions[i] ? formatRupiah(deductions[i].amount).replace('Rp', '') : ''}</td>
                              </tr>
                           );
                        }
                        
                        return (
                           <>
                              {rows}
                              <tr className="border-t-[3px] border-black font-black">
                                 <td className="border-r border-black p-2">Total Earning</td>
                                 <td className="border-r-[3px] border-black p-2 text-right">{formatRupiah(totalEarning)}</td>
                                 <td className="border-r border-black p-2">Total Deductions</td>
                                 <td className="p-2 text-right">{formatRupiah(totalDeduction)}</td>
                              </tr>
                              <tr className="font-black bg-slate-50 border-t-[3px] border-black">
                                 <td colSpan="2" className="border-r-[3px] border-black p-2 bg-white"></td>
                                 <td className="border-r border-black p-3 text-base">Take Home Pay</td>
                                 <td className="p-3 text-right text-lg">{formatRupiah(selectedPayslip.net_salary)}</td>
                              </tr>
                           </>
                        );
                     })()}
                  </tbody>
               </table>

               {/* Footer Notes Merah Italic */}
               <div className="mt-12 text-xs font-bold text-red-600 italic px-2">
                  <p>*This Pay Slip is computer generated printout and no signature required.</p>
                  <p>Please note that the contents of this statement should be treated with absolute confidential.</p>
               </div>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `        
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body { background: white !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          
          /* Sembunyikan elemen web yang tidak perlu dicetak */
          #root > div > nav, 
          #root > div > main,
          .md\\:hidden.fixed.bottom-0,
          .print\\:hidden {
            display: none !important;
          }
          
          /* Kunci agar pop-up memenuhi kertas */
          .fixed.inset-0 { position: relative !important; display: block !important; background: transparent !important; padding: 0 !important; margin: 0 !important; }
          .max-w-4xl { max-width: 100% !important; width: 100% !important; margin: 0 !important; }
          .shadow-2xl, .rounded-2xl { box-shadow: none !important; border-radius: 0 !important; border: none !important; }
          
          /* Padding standar kertas fisik */
          #official-payslip-print { padding: 15mm !important; width: 100% !important; box-sizing: border-box !important; }
          
          /* Memaksa warna tabel agar tampil di PDF */
          .bg-blue-100 { background-color: #dbeafe !important; }
          .bg-green-50\\/30 { background-color: #f0fdf4 !important; }
          .border-black { border-color: #000 !important; }
          .text-red-600 { color: #dc2626 !important; }
        }
      `}} />

      {/* MOBILE BOTTOM NAVBAR */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-200 z-50 px-4 py-2 flex justify-around items-center shadow-[0_-4px_24px_-10px_rgba(0,0,0,0.15)]">
        <button onClick={() => navigate('/')} className="flex flex-col items-center gap-0.5 text-amber-500 flex-1 py-1"><LayoutDashboard size={22} /><span className="text-[9px] font-black uppercase tracking-wider">Home</span></button>
        <button onClick={() => navigate('/TaskManagement')} className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-slate-900 transition-colors flex-1 py-1"><ClipboardList size={22} /><span className="text-[9px] font-bold uppercase tracking-wider">Tasks</span></button>
        {canAccessRecruitment() && (<button onClick={() => navigate('/recruitment-admin')} className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-slate-900 transition-colors flex-1 py-1"><Users size={22} /><span className="text-[9px] font-bold uppercase tracking-wider">HRD</span></button>)}
        <button onClick={() => { setIsSettingsModalOpen(true); setActiveSettingsTab('profile'); }} className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-slate-900 transition-colors flex-1 py-1"><Settings size={22} /><span className="text-[9px] font-bold uppercase tracking-wider">Setting</span></button>
      </div>

    </div>
  );
};

export default PortalHome;