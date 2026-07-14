import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { 
  Home, MapPin, Camera, FileText, User, Download,
  Clock, ShieldAlert, CreditCard, 
  Calendar, Settings, Lock, Image as ImageIcon, Bell, ArrowRight,
  CheckCircle2, LogOut, LogIn, History, Check, ChevronLeft, ChevronRight, Upload, X, RefreshCw, Plus,
  FolderOpen, CalendarMinus, FileWarning, UserX, Trash2
} from 'lucide-react';

export default function MobileApp() {

  // FUNGSI PDF UNTUK MOBILE APP
  const handleDownloadPDFMobile = (elementId, fileName) => {
    const element = document.getElementById(elementId);
    if (!element) return alert("Elemen dokumen tidak ditemukan!");
    
    const generate = () => {
      const opt = {
        margin:       [5, 5, 5, 5],
        filename:     fileName,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      window.html2pdf().set(opt).from(element).save().catch(err => alert("Gagal membuat PDF: " + err.message));
    };

    if (typeof window.html2pdf === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.onload = generate;
      script.onerror = () => alert("Gagal memuat library PDF. Pastikan internet stabil.");
      document.head.appendChild(script);
    } else {
      generate();
    }
  };

  const navigate = useNavigate();
  // KONFIGURASI NAMA PERUSAHAAN
  const appConfig = {
    name: "PT Klien Nusantara",
    short: "KN",
    color: "bg-blue-600",
    text: "text-blue-600",
    light: "bg-blue-50"
  };
  const [activeMenu, setActiveMenu] = useState('home');
  
  // FUNGSI CEK HAK AKSES MENU MOBILE (SMART DETECTOR)
  const hasMobileMenu = (menuName) => {
    // 1. BLOKIR MUTLAK DARI SUPERADMIN (Jika fitur dimatikan dari luar)
    if (menuName === 'task' && clientFeatures?.task === false) return false;

    // 2. CEK OVERRIDE PERORANGAN (Jika diset khusus per-pegawai)
    if (currentUser?.permissions?.mobile && currentUser.permissions.mobile[menuName] !== undefined) {
      return currentUser.permissions.mobile[menuName];
    }

    // 3. CEK BAWAAN JABATAN / ROLE (Membaca checkbox matriks dari dasbor Admin)
    if (rolePermissions?.mobile && rolePermissions.mobile[menuName] !== undefined) {
      return rolePermissions.mobile[menuName];
    }

    // 4. FALLBACK KHUSUS HANYA UNTUK DEVELOPER / SUPER ADMIN SAAS (Bukan Admin Perusahaan)
    if (['Super Admin', 'Developer'].includes(currentUser?.role)) {
      return true;
    }

    // Jika tidak dicentang di mana-mana, pastikan sembunyi!
    return false; 
  };
  const [laporanTab, setLaporanTab] = useState('reguler');
  const currentHour = new Date().getHours();
  const greetingText = currentHour < 11 ? 'PAGI' : currentHour < 15 ? 'SIANG' : currentHour < 18 ? 'SORE' : 'MALAM';
  
  // State Aksi & Form
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [expandedAbsen, setExpandedAbsen] = useState(null);
  const fileInputRef = useRef(null);
  const izinFileInputRef = useRef(null);
  const attachmentInputRef = useRef(null);
  const [activeAttendanceId, setActiveAttendanceId] = useState(null);

  // Tambahkan ini di bawah state laporan / attendance history
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [expandedLeave, setExpandedLeave] = useState(null);
  
  // State User & Database
  const [currentUser, setCurrentUser] = useState({ id: '', name: 'Loading...', role: '', division: '', avatar: '', avatar_url: null });
  const [rolePermissions, setRolePermissions] = useState({});
  const [clientFeatures, setClientFeatures] = useState({});
  const [permissions, setPermissions] = useState({ patroli: false, reguler: false, cuti: false, koreksi: false, reimburse: false, bebas_gps: false });
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [reportHistory, setReportHistory] = useState([]);

  // State Khusus Laporan Patroli
  const [patrolLocStatus, setPatrolLocStatus] = useState(null);
  const [patrolLocName, setPatrolLocName] = useState('');
  const [patrolPhotos, setPatrolPhotos] = useState([]); 
  const [patrolDesc, setPatrolDesc] = useState(''); 
  const [expandedPatrolDate, setExpandedPatrolDate] = useState(null); 
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [isPatrolCameraOpen, setIsPatrolCameraOpen] = useState(false);
  const [patrolFacingMode, setPatrolFacingMode] = useState('environment'); 
  const patrolVideoRef = useRef(null);
  const patrolCanvasRef = useRef(null);
  const [patrolCameraStream, setPatrolCameraStream] = useState(null);

  // State Khusus Laporan Reguler
  const [regulerPhotos, setRegulerPhotos] = useState([]);
  const [regulerDesc, setRegulerDesc] = useState('');
  const [expandedRegulerDate, setExpandedRegulerDate] = useState(null);
  const [isRegulerFormOpen, setIsRegulerFormOpen] = useState(false);

  // State Khusus Pengajuan (Cuti & Izin)
  const [pengajuanForm, setPengajuanForm] = useState({ jenis: '', startDate: '', endDate: '', alasan: '', lampiran: null });
  const [isSubmittingPengajuan, setIsSubmittingPengajuan] = useState(false);

  const [instructions, setInstructions] = useState([]);
  const [colleagues, setColleagues] = useState([]); // Daftar bawahan/rekan selokasi untuk Danru
  const [isInstructionModalOpen, setIsInstructionModalOpen] = useState(false);
  const [instForm, setInstForm] = useState({ broadcast_type: 'Instruksi', target_type: 'LOCATION', target_val: '', content: '', file: null });
  const [isSubmittingInst, setIsSubmittingInst] = useState(false);

  // State Khusus Reimbursement
  const reimburseFileInputRef = useRef(null);
  const [reimburseForm, setReimburseForm] = useState({ category: 'Transportasi', amount: '', description: '', receipt: null });
  const [isSubmittingReimburse, setIsSubmittingReimburse] = useState(false);
  const [reimburseHistory, setReimburseHistory] = useState([]);
  const [expandedReimburse, setExpandedReimburse] = useState(null);

  // State Khusus Koreksi Absen
  const [koreksiForm, setKoreksiForm] = useState({ date: '', type: 'OUT', timeIn: '', timeOut: '', reason: '' });
  const [isSubmittingKoreksi, setIsSubmittingKoreksi] = useState(false);

  // State Absensi Kamera Live
  const [absenId, setAbsenId] = useState(null);
  const [hasAbsenMasuk, setHasAbsenMasuk] = useState(false);
  const [hasAbsenKeluar, setHasAbsenKeluar] = useState(false);
  const [absenInTime, setAbsenInTime] = useState('--:--');
  const [absenOutTime, setAbsenOutTime] = useState('--:--');

  const [absenInPhotoDb, setAbsenInPhotoDb] = useState(null);
  const [absenOutPhotoDb, setAbsenOutPhotoDb] = useState(null);

  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [payrolls, setPayrolls] = useState([]);
  
  // --- TAMBAHAN PERBAIKAN: Fungsi Format Rupiah ---
  const formatRupiah = (number) => {
    if (number === undefined || number === null) return "Rp 0";
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(number);
  };
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraStream, setCameraStream] = useState(null);
  const [absenPhoto, setAbsenPhoto] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);

  const [officeLocations, setOfficeLocations] = useState([]);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; 
  };

  useEffect(() => {
    const session = localStorage.getItem('vest_user_session');
    if (!session) { navigate('/'); return; }
    
    const parsed = JSON.parse(session);
    setCurrentUser(prev => ({ ...prev, ...parsed }));
    fetchUserData(parsed.id, parsed);
    checkTodayAttendance(parsed.id);
    fetchHistories(parsed.id);
    fetchOfficeLocations();
  }, []);

  useEffect(() => {
    if (activeMenu === 'absen') {
      startCamera();
      getLocation();
    } else {
      stopCamera();
    }
  }, [activeMenu]);

  // UBAH FUNGSI INI DI MobileApp.jsx:
  const fetchCustomMenus = async (clientId) => {
    const { data, error } = await supabase
      .from('custom_menus')
      .select('*')
      .eq('client_id', clientId);
    
    if (data && !error) {
      setCustomMenus(data);
    }
  };

  const fetchUserData = async (userId, parsedSession) => {
    try {
      // 1. Tambahkan 'features' ke dalam select clients()
      const { data, error } = await supabase.from('employees')
        .select('client_id, nama_lengkap, role, bidang_jasa, permissions, avatar_url, sisa_cuti, lokasi_penempatan, clients(status, features)')
        .eq('nik_karyawan', parsedSession.nik).single(); 

      if (error) throw error;
      
      if (data) {
        if (data.clients && data.clients.status === 'SUSPENDED') {
           alert("Akses Perusahaan dibekukan oleh Pusat. Silakan hubungi HRD Anda.");
           localStorage.removeItem('vest_user_session');
           navigate('/');
           return;
        }

        // 2. Simpan fitur Super Admin ke state
        if (data.clients?.features) {
           setClientFeatures(data.clients.features);
        }

        setCurrentUser({
          id: parsedSession.id,
          client_id: data.client_id,
          nik: parsedSession.nik,
          name: data.nama_lengkap,
          role: data.role,
          division: data.bidang_jasa,
          permissions: data.permissions || {},
          avatar: data.avatar_url,
          avatar_url: data.avatar_url,
          sisa_cuti: data.sisa_cuti || 0,
          location: data.lokasi_penempatan
        });
        
        if (data.permissions) {
          setPermissions(data.permissions);
        }

        // 3. TARIK HAK AKSES JABATAN (ROLE) SESUAI ADMIN PERUSAHAAN
        const { data: roleData } = await supabase.from('company_roles')
          .select('permissions')
          .eq('name', data.role)
          .eq('client_id', data.client_id)
          .maybeSingle();

        if (roleData && roleData.permissions) {
           const parsedPerms = typeof roleData.permissions === 'string' ? JSON.parse(roleData.permissions) : roleData.permissions;
           setRolePermissions(parsedPerms);
        }

        // 4. PANGGIL MENU CUSTOM DI SINI AGAR MUNCUL
        fetchCustomMenus(data.client_id);
      }
    } catch (err) {
      console.error("Gagal menarik data profil:", err);
    }
  };

  const fetchOfficeLocations = async () => {
    const { data } = await supabase.from('office_locations').select('*');
    if (data) setOfficeLocations(data);
  };

  const fetchHistories = async (userId) => {
    const { data: attData } = await supabase.from('attendances').select('*').eq('employee_id', userId).order('created_at', { ascending: false }).limit(31);
    if (attData) setAttendanceHistory(attData);

    const { data: repData } = await supabase.from('field_reports').select('*').eq('employee_id', userId).order('created_at', { ascending: false }).limit(20);
    if (repData) setReportHistory(repData);

    // --- TAMBAHKAN BARIS INI UNTUK MENARIK RIWAYAT PENGAJUAN ---
    const { data: lvData } = await supabase.from('leave_requests').select('*').eq('employee_id', userId).order('created_at', { ascending: false }).limit(20);
    if (lvData) setLeaveHistory(lvData);

    // --- FETCH RIWAYAT REIMBURSEMENT ---
    const { data: rmData } = await supabase.from('reimbursements').select('*').eq('employee_id', userId).order('created_at', { ascending: false }).limit(20);
    if (rmData) setReimburseHistory(rmData);

    // FETCH RIWAYAT GAJI
    const { data: payData } = await supabase.from('payrolls').select('*').eq('employee_id', userId).order('created_at', { ascending: false });
    if (payData) setPayrolls(payData);

    // FETCH INSTRUKSI (Penyaringan Multi-Level)
    const { data: userDb } = await supabase.from('employees').select('lokasi_penempatan').eq('id', userId).single();
    const loc = userDb?.lokasi_penempatan || 'Unknown';

    const { data: instData } = await supabase.from('instructions')
      .select('*, employees!sender_id(nama_lengkap, posisi_jabatan)')
      .order('created_at', { ascending: false });
    
    if (instData) {
      // Filter di sisi Client: Cuma lihat ALL, Lokasi dia, atau ID dia.
      const myInst = instData.filter(i => 
        i.target_type === 'ALL' || 
        (i.target_type === 'LOCATION' && i.target_val === loc) || 
        (i.target_type === 'INDIVIDUAL' && i.target_val === userId) ||
        i.sender_id === userId // Bisa melihat instruksi yang dia buat sendiri
      );
      setInstructions(myInst);
    }

    // Jika dia Danru/Manager, tarik data rekan di lokasi yang sama untuk form target
    const { data: temanData } = await supabase.from('employees').select('id, nama_lengkap').eq('lokasi_penempatan', loc);
    if (temanData) setColleagues(temanData);
  };

  const checkTodayAttendance = async (userId) => {
    try {
      const d = new Date();
      const today = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];

      // 1. Ambil 1 data absen PALING TERAKHIR DIBUAT (Bukan berdasarkan tanggal hari ini)
      const { data: attData } = await supabase.from('attendances')
        .select('*')
        .eq('employee_id', userId)
        .order('created_at', { ascending: false }) // Kunci Open Shift ada di sini!
        .limit(1);

      if (attData && attData.length > 0) {
        const lastAtt = attData[0];

        // SKENARIO A: OPEN SHIFT LINTAS HARI (Sudah Masuk, Tapi Belum Keluar)
        if (lastAtt.check_in_time && !lastAtt.check_out_time) {
          setHasAbsenMasuk(true);
          setHasAbsenKeluar(false);
          setActiveAttendanceId(lastAtt.id); // <--- SIMPAN ID SHIFT MENGGANTUNG
          setAbsenInTime(lastAtt.check_in_time.substring(0, 5));
          setAbsenOutTime('--:--');
        }
        // SKENARIO B: SHIFT HARI INI SUDAH SELESAI DITUTUP
        else if (lastAtt.date === today && lastAtt.check_in_time && lastAtt.check_out_time) {
          setHasAbsenMasuk(true);
          setHasAbsenKeluar(true);
          setActiveAttendanceId(null);
          setAbsenInTime(lastAtt.check_in_time.substring(0, 5));
          setAbsenOutTime(lastAtt.check_out_time.substring(0, 5));
        }
        // SKENARIO C: BELUM MULAI SHIFT HARI INI
        else {
          setHasAbsenMasuk(false);
          setHasAbsenKeluar(false);
          setActiveAttendanceId(null);
          setAbsenInTime('--:--');
          setAbsenOutTime('--:--');
        }
      } else {
        // JIKA BELUM PERNAH ABSEN SAMA SEKALI
        setHasAbsenMasuk(false);
        setHasAbsenKeluar(false);
        setActiveAttendanceId(null);
        setAbsenInTime('--:--');
        setAbsenOutTime('--:--');
      }
    } catch (err) {
      console.error("Gagal cek status shift:", err);
    }
  };

  const startCamera = async () => {
    try {
      setAbsenPhoto(null);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setCameraStream(stream);
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      alert("Akses kamera ditolak atau perangkat tidak memiliki kamera.");
      setActiveMenu('home');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const MAX_WIDTH = 640; 
      const scaleSize = MAX_WIDTH / video.videoWidth;
      const newWidth = MAX_WIDTH;
      const newHeight = video.videoHeight * scaleSize;

      canvas.width = newWidth;
      canvas.height = newHeight;
      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0, newWidth, newHeight);
      
      const photoData = canvas.toDataURL('image/jpeg', 0.6); 
      setAbsenPhoto(photoData);
      stopCamera();
    }
  };

  const getLocation = () => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
          setIsLocating(false);
        },
        (error) => {
          console.error("Gagal mendapatkan lokasi:", error);
          setUserLocation(null);
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setIsLocating(false);
    }
  };

  const checkPatrolLocation = () => {
    setPatrolLocStatus('locating');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          let valid = false;
          let locName = '';
          for (const office of officeLocations) {
            const distance = calculateDistance(position.coords.latitude, position.coords.longitude, office.latitude, office.longitude);
            if (distance <= office.radius) { valid = true; locName = office.name; break; }
          }
          if (valid || permissions.bebas_gps) {
            setPatrolLocStatus('valid'); 
            setPatrolLocName(valid ? locName : 'Bypass Area (Bebas GPS)');
          } else { setPatrolLocStatus('invalid'); }
        },
        () => setPatrolLocStatus('invalid'), { enableHighAccuracy: true }
      );
    } else { setPatrolLocStatus('invalid'); }
  };

  const startPatrolCamera = async (mode = 'environment') => {
    try {
      if (patrolCameraStream) patrolCameraStream.getTracks().forEach(t => t.stop());
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: mode } });
      setPatrolCameraStream(stream);
      if (patrolVideoRef.current) patrolVideoRef.current.srcObject = stream;
      setPatrolFacingMode(mode);
      setIsPatrolCameraOpen(true);
    } catch (err) {
      alert("Gagal mengakses kamera.");
    }
  };

  const stopPatrolCamera = () => {
    if (patrolCameraStream) {
      patrolCameraStream.getTracks().forEach(t => t.stop());
      setPatrolCameraStream(null);
    }
    setIsPatrolCameraOpen(false);
  };

  const capturePatrolPhoto = () => {
    if (patrolVideoRef.current && patrolCanvasRef.current) {
      const video = patrolVideoRef.current;
      const canvas = patrolCanvasRef.current;
      const MAX_WIDTH = 800; 
      const scaleSize = MAX_WIDTH / video.videoWidth;
      canvas.width = MAX_WIDTH;
      canvas.height = video.videoHeight * scaleSize;

      const context = canvas.getContext('2d');
      if (patrolFacingMode === 'user') {
        context.translate(canvas.width, 0);
        context.scale(-1, 1);
      }
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7); 
      if (laporanTab === 'patroli') {
        setPatrolPhotos(prev => [...prev, { base64: compressedBase64, desc: '' }]);
      } else if (laporanTab === 'reguler') {
        setRegulerPhotos(prev => [...prev, { base64: compressedBase64, desc: '' }]);
      }
      stopPatrolCamera();
    }
  };

  const handlePatrolSubmit = async () => {
    if(patrolPhotos.length === 0) return alert("Minimal lampirkan 1 foto kegiatan!");
    setIsSubmittingReport(true);
    try {
      let uploadedData = [];
      for (let i = 0; i < patrolPhotos.length; i++) {
        const photo = patrolPhotos[i];
        const base64Response = await fetch(photo.base64);
        const blob = await base64Response.blob();
        const fileName = `patrol-${currentUser.id}-${Date.now()}-${i}.jpg`;
        const { error: uploadError } = await supabase.storage.from('attendance_photos').upload(fileName, blob);
        if(uploadError) throw uploadError;
        const { data } = supabase.storage.from('attendance_photos').getPublicUrl(fileName);
        uploadedData.push({ url: data.publicUrl, desc: photo.desc });
      }

      const descJson = JSON.stringify({ notes: patrolDesc, photos: uploadedData });
      const { error } = await supabase.from('field_reports').insert([{
        client_id: currentUser.client_id, employee_id: currentUser.id, report_type: 'patroli', title: `Patroli di ${patrolLocName}`, description: descJson
      }]);

      if (error) throw error;
      alert("Laporan Patroli Berhasil Terkirim!");
      setPatrolPhotos([]);
      setPatrolDesc('');
      setPatrolLocStatus(null);
      fetchHistories(currentUser.id);
    } catch (error) {
      alert("Gagal kirim laporan: " + error.message);
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const handleRegulerSubmit = async () => {
    if(regulerPhotos.length === 0 && !regulerDesc) return alert("Wajib mengisi keterangan atau melampirkan minimal 1 foto!");
    setIsSubmittingReport(true);
    try {
      let uploadedData = [];
      for (let i = 0; i < regulerPhotos.length; i++) {
        const photo = regulerPhotos[i];
        const base64Response = await fetch(photo.base64);
        const blob = await base64Response.blob();
        const fileName = `reguler-${currentUser.id}-${Date.now()}-${i}.jpg`;
        const { error: uploadError } = await supabase.storage.from('attendance_photos').upload(fileName, blob);
        if(uploadError) throw uploadError;
        const { data } = supabase.storage.from('attendance_photos').getPublicUrl(fileName);
        uploadedData.push({ url: data.publicUrl, desc: photo.desc });
      }

      const descJson = JSON.stringify({ notes: regulerDesc, photos: uploadedData });
      const { error } = await supabase.from('field_reports').insert([{
        client_id: currentUser.client_id, employee_id: currentUser.id, report_type: 'reguler', title: `Laporan Reguler Lapangan`, description: descJson
      }]);

      if (error) throw error;
      alert("Laporan Reguler Berhasil Terkirim!");
      setRegulerPhotos([]);
      setRegulerDesc('');
      setIsRegulerFormOpen(false);
      fetchHistories(currentUser.id);
    } catch (error) {
      alert("Gagal kirim laporan: " + error.message);
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const handleCreateInstruction = async (e) => {
    e.preventDefault();
    if (!instForm.content) return alert("Isi instruksi kosong!");
    setIsSubmittingInst(true);
    try {
      let fileUrl = null; let filePath = null;
      if (instForm.file) {
        const fileExt = instForm.file.name.split('.').pop();
        filePath = `mobile/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('instruction_files').upload(filePath, instForm.file);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('instruction_files').getPublicUrl(filePath);
        fileUrl = data.publicUrl;
      }

      // Danru hanya bisa kirim ke lokasinya atau perorangan di lokasinya
      const payload = {
        client_id: currentUser.client_id,
        sender_id: currentUser.id,
        broadcast_type: instForm.broadcast_type, 
        target_type: instForm.target_type,
        target_val: instForm.target_type === 'LOCATION' ? currentUser.location : instForm.target_val,
        content: instForm.content,
        attachment_url: fileUrl,
        attachment_path: filePath
      };

      const { error } = await supabase.from('instructions').insert([payload]);
      if (error) throw error;
      alert("Instruksi terkirim!");
      setIsInstructionModalOpen(false);
      setInstForm({ broadcast_type: 'Instruksi', target_type: 'LOCATION', target_val: '', content: '', file: null });
      fetchHistories(currentUser.id);
    } catch (err) { alert("Gagal: " + err.message); } finally { setIsSubmittingInst(false); }
  };

  const handleDeleteInstruction = async (id, filePath) => {
    if (!window.confirm("Hapus instruksi ini?")) return;
    if (filePath) await supabase.storage.from('instruction_files').remove([filePath]);
    await supabase.from('instructions').delete().eq('id', id);
    fetchHistories(currentUser.id);
  };

  // FUNGSI UNTUK SUBMIT PENGAJUAN IZIN & CUTI
  const handleSubmitPengajuan = async () => {
    // 1. Validasi Dinamis (Pisahkan aturan Cuti dan Izin)
    if (activeMenu === 'form_cuti') {
      if (!pengajuanForm.startDate || !pengajuanForm.endDate || !pengajuanForm.alasan) {
        return alert("Harap lengkapi tanggal mulai, tanggal selesai, dan alasan cuti!");
      }
    } else if (activeMenu === 'form_izin') {
      if (!pengajuanForm.startDate || !pengajuanForm.alasan) {
        return alert("Harap lengkapi tanggal dan alasan izin!");
      }
    }

    // 2. Validasi Wajib Lampiran Khusus Izin Sakit
    if (activeMenu === 'form_izin' && pengajuanForm.jenis === 'Sakit' && !pengajuanForm.lampiran) {
      return alert("Pengajuan Izin Sakit WAJIB melampirkan Surat Keterangan Dokter!");
    }
    
    setIsSubmittingPengajuan(true);
    try {
      let finalAttachmentUrl = null;

      // Proses Upload Lampiran
      if (pengajuanForm.lampiran) {
        const file = pengajuanForm.lampiran;
        const fileExt = file.name.split('.').pop();
        const fileName = `izin-${currentUser.id}-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage.from('attendance_photos').upload(fileName, file);
        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage.from('attendance_photos').getPublicUrl(fileName);
        finalAttachmentUrl = publicUrlData.publicUrl;
      }

      // Siapkan Payload Data ke Database
      const payload = {
        client_id: currentUser.client_id,
        employee_id: currentUser.id,
        request_type: activeMenu === 'form_cuti' ? 'CUTI' : 'IZIN',
        category: pengajuanForm.jenis || (activeMenu === 'form_cuti' ? 'Tahunan' : 'Sakit'),
        start_date: pengajuanForm.startDate,
        end_date: pengajuanForm.endDate || pengajuanForm.startDate, 
        reason: pengajuanForm.alasan,
        attachment_url: finalAttachmentUrl,
        status: 'PENDING'
      };

      const { error } = await supabase.from('leave_requests').insert([payload]);
      if (error) throw error;

      alert("Berhasil! Pengajuan Anda sudah terkirim ke HRD.");
      setActiveMenu('pengajuan'); 
      setPengajuanForm({ jenis: '', startDate: '', endDate: '', alasan: '', lampiran: null });
      fetchHistories(currentUser.id);
    } catch (error) {
      alert("Gagal mengirim pengajuan: " + error.message);
    } finally {
      setIsSubmittingPengajuan(false);
    }
  };

  const handleReimburseSubmit = async () => {
    if (!reimburseForm.amount || !reimburseForm.description || !reimburseForm.receipt) {
      return alert("Harap isi nominal, keterangan, dan lampirkan foto struk/nota!");
    }
    
    setIsSubmittingReimburse(true);
    try {
      // 1. Upload Struk/Nota
      const file = reimburseForm.receipt;
      const fileExt = file.name.split('.').pop();
      const fileName = `reimburse-${currentUser.id}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage.from('attendance_photos').upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('attendance_photos').getPublicUrl(fileName);
      
      // 2. Simpan ke database
      const payload = {
        client_id: currentUser.client_id,
        employee_id: currentUser.id,
        category: reimburseForm.category,
        amount: parseFloat(reimburseForm.amount),
        description: reimburseForm.description,
        receipt_url: publicUrlData.publicUrl,
        status: 'PENDING'
      };

      const { error } = await supabase.from('reimbursements').insert([payload]);
      if (error) throw error;

      alert("Berhasil! Pengajuan Reimbursement terkirim ke Finance.");
      setActiveMenu('pengajuan'); 
      setReimburseForm({ category: 'Transportasi', amount: '', description: '', receipt: null });
      fetchHistories(currentUser.id);
    } catch (error) {
      alert("Gagal mengirim reimburse: " + error.message);
    } finally {
      setIsSubmittingReimburse(false);
    }
  };

  const [customMenus, setCustomMenus] = useState([]);
  const [activeCustomMenu, setActiveCustomMenu] = useState(null);
  const [customFormData, setCustomFormData] = useState({});

  // FUNGSI UNTUK SUBMIT PERBAIKAN ABSEN
  const handleKoreksiSubmit = async () => {
    if (!koreksiForm.date || !koreksiForm.reason) return alert("Harap isi tanggal dan alasan perbaikan!");
    if (koreksiForm.type === 'IN' && !koreksiForm.timeIn) return alert("Isi usulan jam masuk!");
    if (koreksiForm.type === 'OUT' && !koreksiForm.timeOut) return alert("Isi usulan jam keluar!");
    if (koreksiForm.type === 'BOTH' && (!koreksiForm.timeIn || !koreksiForm.timeOut)) return alert("Isi jam masuk & keluar!");

    setIsSubmittingKoreksi(true);
    try {
      const payload = {
        client_id: currentUser.client_id,
        employee_id: currentUser.id,
        date: koreksiForm.date,
        correction_type: koreksiForm.type,
        time_in: koreksiForm.type !== 'OUT' ? koreksiForm.timeIn : null,
        time_out: koreksiForm.type !== 'IN' ? koreksiForm.timeOut : null,
        reason: koreksiForm.reason,
        status: 'PENDING'
      };

      const { error } = await supabase.from('attendance_corrections').insert([payload]);
      if (error) throw error;

      alert("Berhasil! Pengajuan Perbaikan Absen terkirim ke HRD.");
      setActiveMenu('pengajuan'); 
      setKoreksiForm({ date: '', type: 'OUT', timeIn: '', timeOut: '', reason: '' });
      fetchHistories(currentUser.id);
    } catch (error) {
      alert("Gagal mengirim perbaikan: " + error.message);
    } finally {
      setIsSubmittingKoreksi(false);
    }
  };

  const handleAbsenSubmit = async () => {
    if (!absenPhoto) return alert("Foto wajib diambil!");
    if (!userLocation && !permissions.bebas_gps) return alert("Lokasi GPS belum ditemukan.");
    setIsSubmitting(true);
    
    try {
      let lokasiStr = 'Lokasi tidak terdeteksi';
      
      if (permissions.bebas_gps) {
        lokasiStr = userLocation ? `Bebas GPS (${userLocation.lat}, ${userLocation.lng})` : 'Bebas GPS';
      } else {
        let isValidLocation = false;
        for (const office of officeLocations) {
          const distance = calculateDistance(userLocation.lat, userLocation.lng, office.latitude, office.longitude);
          if (distance <= office.radius) {
            isValidLocation = true;
            lokasiStr = office.name;
            break;
          }
        }
        if (!isValidLocation) {
          setIsSubmitting(false);
          return alert("GAGAL ABSEN: Anda berada di luar radius lokasi kantor!");
        }
      }

      const base64Response = await fetch(absenPhoto);
      const blob = await base64Response.blob();
      const fileName = `absen-${currentUser.id}-${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage.from('attendance_photos').upload(fileName, blob);
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('attendance_photos').getPublicUrl(fileName);
      const finalPhotoUrl = publicUrlData.publicUrl;

      const d = new Date();
      const timeString = d.toTimeString().split(' ')[0];
      const dateString = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];

      if (!hasAbsenMasuk) {
        // PROSES 1: CHECK-IN SHIFT BARU (Jam Berapapun)
        const payloadIn = {
          client_id: currentUser.client_id, 
          employee_id: currentUser.id, 
          date: dateString, // Tanggal dimulainya shift
          check_in_time: timeString, 
          location_gps: lokasiStr, 
          photo_url: finalPhotoUrl, 
          status: 'HADIR'
        };
        const { error } = await supabase.from('attendances').insert([payloadIn]);
        if (error) throw error;
        alert("Check-In Shift berhasil!");
        
      } else if (!hasAbsenKeluar && activeAttendanceId) {
        // PROSES 2: CHECK-OUT SHIFT (Meskipun sudah beda hari, dia akan mengunci ke ID Shift Semalam)
        const payloadOut = {
          check_out_time: timeString,
          photo_out_url: finalPhotoUrl
          // Catatan: Kita tidak mengubah 'date', agar hitungan masuknya tetap di tanggal Shift dimulai.
        };
        const { error } = await supabase.from('attendances').update(payloadOut).eq('id', activeAttendanceId);
        if (error) throw error;
        alert("Check-Out Shift selesai. Selamat istirahat!");
      }

      checkTodayAttendance(currentUser.id);
      fetchHistories(currentUser.id);
      setActiveMenu('home');
      setAbsenPhoto(null);
    } catch (error) {
      alert("Gagal memproses absen: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAvatarUpload = async (event) => {
    try {
      setUploadingAvatar(true);
      const file = event.target.files[0];
      if (!file) return;

      // --- PERBAIKAN: Hapus foto lama di Storage jika sudah ada ---
      if (currentUser.avatar_url) {
        const oldUrl = currentUser.avatar_url;
        // Mengambil nama file asli dari URL panjang
        const oldFileName = oldUrl.substring(oldUrl.lastIndexOf('/') + 1);
        if (oldFileName) {
          await supabase.storage.from('avatars').remove([oldFileName]);
        }
      }
      // ------------------------------------------------------------

      const fileExt = file.name.split('.').pop();
      const fileName = `${currentUser.id}-${Math.random()}.${fileExt}`;

      let { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const avatarUrl = publicUrlData.publicUrl;

      const { error: updateError } = await supabase.from('employees').update({ avatar_url: avatarUrl }).eq('id', currentUser.id);
      if (updateError) throw updateError;

      setCurrentUser(prev => ({ ...prev, avatar_url: avatarUrl }));
      const sessionData = JSON.parse(localStorage.getItem('vest_user_session'));
      if(sessionData) { sessionData.avatar_url = avatarUrl; localStorage.setItem('vest_user_session', JSON.stringify(sessionData)); }
      alert('Foto profil berhasil diperbarui!');    
    } catch (error) {
      alert('Gagal mengupload foto: ' + error.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('vest_user_session');
    navigate('/');
  };

  const renderUserAvatar = (sizeClasses) => {
    if (currentUser.avatar_url) return <img src={currentUser.avatar_url} alt="Profile" className={`${sizeClasses} object-cover rounded-2xl shadow-lg border border-white/20`} />;
    return <div className={`${sizeClasses} bg-[#86d764] rounded-2xl flex items-center justify-center font-bold text-white shadow-lg border border-green-400`}>{currentUser.avatar}</div>;
  };

  let activeLocationName = 'Mencari lokasi...';
  if (userLocation) {
    if (permissions.bebas_gps) {
      activeLocationName = 'Bebas GPS (Bisa absen di mana saja)';
    } else {
      activeLocationName = 'Di Luar Radius Kantor';
      for (const office of officeLocations) {
        const distance = calculateDistance(userLocation.lat, userLocation.lng, office.latitude, office.longitude);
        if (distance <= office.radius) { activeLocationName = office.name; break; }
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F7FB] flex justify-center font-sans">
      <div className="w-full max-w-md bg-[#F4F7FB] h-[100dvh] relative flex flex-col overflow-hidden shadow-2xl">
        
        <div className="relative flex-1 overflow-hidden">
          {/* ========================================== */}
          {/* === VIEW 1: HOME === */}
          {/* ========================================== */}
          <div className={`absolute inset-0 flex flex-col transition-transform duration-300 ease-in-out z-10 ${activeMenu !== 'home' ? '-translate-x-full' : 'translate-x-0'}`}>
            <div className="shrink-0 relative z-20">
              <div className="bg-gradient-to-br from-[#0a195c] to-[#142c94] rounded-b-[2rem] pt-10 pb-16 px-6 shadow-md">
                <div className="flex flex-col gap-5">
                  <div className="flex justify-between items-center">
                    <div>
                      <h1 className="text-[10px] font-bold text-white/70 tracking-widest mb-0.5">SELAMAT {greetingText},</h1>
                      <h2 className="text-xl font-bold text-white tracking-tight">{currentUser.name}</h2>
                    </div>
                  {renderUserAvatar("w-12 h-12 rounded-full border-2 border-white/20 shadow-lg")}
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 w-full shadow-inner relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="flex justify-between text-[10px] text-white/70 mb-1.5 uppercase tracking-wider font-semibold"><span>Nomor Induk Karyawan</span><span>Head Office</span></div>
                    <div className="flex justify-between text-sm font-black text-white mb-3 pb-3 border-b border-white/10 relative z-10"><span>O-31-140225-00047</span><span></span></div>
                    <div className="flex text-[10px] text-white/70 mb-1 uppercase tracking-wider font-semibold"><span className="w-1/2">Divisi</span><span className="w-1/2 text-right">Jabatan</span></div>
                    <div className="flex text-xs font-bold text-white relative z-10"><span className="w-1/2 truncate pr-2">{currentUser.division || 'Operasional'}</span><span className="w-1/2 text-right truncate">Staff</span></div>
                  </div>
                </div>
              </div>

              <div className="px-5 -mt-10">
                <div className="bg-white rounded-2xl p-4 shadow-lg shadow-blue-900/5 border border-slate-100">
                  <div className="flex justify-between items-center mb-3 pb-3 border-b border-slate-100">
                    <h2 className="text-lg font-bold text-slate-800">Kehadiran</h2>
                    <p className="text-xs font-semibold text-slate-500">
                      {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-center w-1/2 border-r border-slate-100 flex flex-col items-center">
                      <p className="text-[#55c158] text-xs font-bold flex items-center justify-center gap-1 mb-1"><LogIn size={16} strokeWidth={3}/> Absen In</p>
                      <p className="text-2xl font-black text-slate-800 tracking-tight">{hasAbsenMasuk ? absenInTime : '--:--'}</p>
                    </div>
                    <div className="text-center w-1/2 flex flex-col items-center">
                      <p className="text-[#e24e4e] text-xs font-bold flex items-center justify-center gap-1 mb-1"><LogOut size={16} strokeWidth={3}/> Absen Out</p>
                      <p className="text-2xl font-black text-slate-800 tracking-tight">{hasAbsenKeluar ? absenOutTime : '--:--'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <main className="flex-1 overflow-y-auto px-5 py-4 z-10 scroll-smooth pb-24">
              <div className="mb-6">
                <h3 className="font-bold text-slate-800 text-sm mb-3">Informasi dan Instruksi</h3>
                {/* TOMBOL BUAT INSTRUKSI KHUSUS DANRU/MANAGER/ADMIN */}
                {['Komandan Regu', 'Manager Operasional', 'Admin Perusahaan'].includes(currentUser.role) && (
                  <button onClick={() => setIsInstructionModalOpen(true)} className="mb-3 w-full bg-indigo-50 border border-indigo-200 text-indigo-700 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-transform"><Plus size={16}/> Buat Instruksi Lapangan</button>
                )}

                <div className="space-y-3">
                  {instructions.map(inst => (
                    <div key={inst.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 relative">
                      {inst.sender_id === currentUser.id && (
                        <button onClick={() => handleDeleteInstruction(inst.id, inst.attachment_path)} className="absolute top-3 right-3 text-slate-400 hover:text-rose-500"><Trash2 size={14}/></button>
                      )}
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-[10px]">{inst.employees?.nama_lengkap.substring(0,2).toUpperCase()}</div>
                        <div>
                          <p className="text-xs font-bold text-slate-800 flex items-center gap-2">
                             {inst.employees?.nama_lengkap} 
                             <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${inst.broadcast_type === 'Informasi' ? 'bg-indigo-100 text-indigo-700' : 'bg-rose-100 text-rose-700'}`}>{inst.broadcast_type || 'Instruksi'}</span>
                          </p>
                          <p className="text-[9px] text-slate-500">{inst.employees?.posisi_jabatan} • {new Date(inst.created_at).toLocaleDateString('id-ID', {day:'numeric', month:'short'})}</p>
                        </div>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{inst.content}</p>
                      {inst.attachment_url && (
                        <a href={inst.attachment_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 bg-slate-50 text-blue-600 border border-slate-200 px-3 py-1.5 rounded text-[10px] font-bold">
                          <FileText size={12}/> Buka Lampiran
                        </a>
                      )}
                    </div>
                  ))}
                  {instructions.length === 0 && <div className="w-full py-6 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-center text-slate-400 text-xs font-semibold">Belum ada pengumuman/instruksi.</div>}
                </div>
              </div>

              <div className="mb-4">
                <h3 className="font-bold text-slate-800 text-sm mb-3">Menu</h3>
                <div className="grid grid-cols-4 gap-4 bg-white/90 backdrop-blur-md p-5 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                  
                  {/* Gembok Laporan Reguler */}
                  {hasMobileMenu('laporan') && permissions?.reguler && (
                    <button onClick={() => { setLaporanTab('reguler'); setActiveMenu('laporan'); }} className="flex flex-col items-center gap-2 active:scale-95">
                      <div className="w-14 h-14 bg-gradient-to-br from-amber-50 to-amber-100/80 rounded-2xl flex items-center justify-center shadow-sm"><FileText size={24} className="text-yellow-600"/></div>
                      <span className="text-[10px] font-bold text-slate-700 leading-tight text-center">Reguler</span>
                    </button>
                  )}

                  {/* Gembok Laporan Patroli */}
                  {hasMobileMenu('laporan') && permissions?.patroli && (
                    <button onClick={() => { setLaporanTab('patroli'); setActiveMenu('laporan'); }} className="flex flex-col items-center gap-2 active:scale-95">
                      <div className="w-14 h-14 bg-gradient-to-br from-amber-50 to-amber-100/80 rounded-2xl flex items-center justify-center shadow-sm"><ShieldAlert size={24} className="text-yellow-600"/></div>
                      <span className="text-[10px] font-bold text-slate-700 leading-tight text-center">Patroli</span>
                    </button>
                  )}

                  {/* Gembok Pengajuan */}
                  {hasMobileMenu('pengajuan') && (
                    <button onClick={() => setActiveMenu('pengajuan')} className="flex flex-col items-center gap-2 active:scale-95">
                      <div className="w-14 h-14 bg-gradient-to-br from-indigo-50 to-indigo-100/80 rounded-2xl flex items-center justify-center shadow-sm"><FolderOpen size={24} className="text-indigo-600"/></div>
                      <span className="text-[10px] font-bold text-slate-700 leading-tight text-center">Pengajuan</span>
                    </button>
                  )}

                  {/* Gembok Ringkasan Absen */}
                  {hasMobileMenu('absen') && (
                    <button onClick={() => setActiveMenu('ringkasan')} className="flex flex-col items-center gap-2 active:scale-95">
                      <div className="w-14 h-14 bg-gradient-to-br from-emerald-50 to-emerald-100/80 rounded-2xl flex items-center justify-center shadow-sm"><History size={24} className="text-emerald-600"/></div>
                      <span className="text-[10px] font-bold text-slate-700 leading-tight text-center">Ringkasan<br/>Absen</span>
                    </button>
                  )}

                  {/* Tombol Tambahan: Task (Akan muncul jika dicentang di Admin) */}
                  {hasMobileMenu('task') && (
                    <button onClick={() => alert('Fitur Task sedang dalam pengembangan')} className="flex flex-col items-center gap-2 active:scale-95">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-50 to-blue-100/80 rounded-2xl flex items-center justify-center shadow-sm"><CheckCircle2 size={24} className="text-blue-600"/></div>
                      <span className="text-[10px] font-bold text-slate-700 leading-tight text-center">Task</span>
                    </button>
                  )}

                  {/* Tombol Tambahan: Slip Gaji */}
                  {hasMobileMenu('slip') && (
                    <button onClick={() => setActiveMenu('slip')} className="flex flex-col items-center gap-2 active:scale-95">
                      <div className="w-14 h-14 bg-gradient-to-br from-rose-50 to-rose-100/80 rounded-2xl flex items-center justify-center shadow-sm"><CreditCard size={24} className="text-rose-600"/></div>
                      <span className="text-[10px] font-bold text-slate-700 leading-tight text-center">Slip Gaji</span>
                    </button>
                  )}

                  {customMenus.map(menu => {
                  if (!hasMobileMenu(`custom_${menu.id}`)) return null;
                    return (
                      <button key={menu.id} onClick={() => {
                        setActiveCustomMenu(menu);
                        setCustomFormData({});
                        setActiveMenu('custom_form_view');
                      }} className="flex flex-col items-center gap-2 active:scale-95">
                        <div className="w-14 h-14 bg-gradient-to-br from-cyan-50 to-cyan-100/80 rounded-2xl flex items-center justify-center shadow-sm">
                          <FileText size={24} className="text-cyan-600"/>
                        </div>
                        <span className="text-[10px] font-bold text-slate-700 leading-tight text-center">{menu.menu_name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </main>
          </div>

          {/* ========================================== */}
          {/* === VIEW: MENU PUSAT PENGAJUAN === */}
          {/* ========================================== */}
          <div className={`absolute inset-0 bg-[#F4F7FB] flex flex-col transition-transform duration-300 ease-in-out z-20 ${activeMenu === 'pengajuan' ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="px-6 pt-12 pb-6 bg-white shadow-sm flex items-center justify-between z-10">
              <button onClick={() => setActiveMenu('home')} className="p-2 bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200 active:scale-95 transition-transform"><ChevronLeft size={20}/></button>
              <h1 className="text-lg font-bold text-slate-800">Pusat Pengajuan</h1>
              <div className="w-9"></div>
            </div>

            <main className="flex-1 overflow-y-auto px-5 py-6 space-y-5 pb-24 custom-scrollbar">
              <div className="bg-gradient-to-r from-[#0a195c] to-blue-800 rounded-3xl p-5 text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="relative z-10">
                  <p className="text-xs font-semibold text-blue-200 mb-1">Sisa Kuota Cuti Tahunan</p>
                  <div className="flex items-baseline gap-1">
                    <h2 className="text-4xl font-black">{currentUser.sisa_cuti !== undefined ? currentUser.sisa_cuti : '...'}</h2>
                    <span className="text-sm font-medium text-blue-100">Hari</span>
                  </div>
                </div>
              </div>

              <h3 className="font-bold text-slate-800 text-sm px-1 border-b border-slate-200 pb-2">Kategori Pengajuan</h3>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => { setPengajuanForm({...pengajuanForm, jenis: 'Tahunan'}); setActiveMenu('form_cuti'); }} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-[0_4px_15px_rgb(0,0,0,0.02)] flex flex-col items-center gap-3 active:scale-95 transition-transform hover:border-emerald-300">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><CalendarMinus size={24}/></div>
                  <span className="font-bold text-slate-700 text-sm">Cuti</span>
                </button>

                <button onClick={() => { setPengajuanForm({...pengajuanForm, jenis: 'Sakit'}); setActiveMenu('form_izin'); }} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-[0_4px_15px_rgb(0,0,0,0.02)] flex flex-col items-center gap-3 active:scale-95 transition-transform hover:border-amber-300">
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><FileWarning size={24}/></div>
                  <span className="font-bold text-slate-700 text-sm">Izin</span>
                </button>

                <button onClick={() => setActiveMenu('form_absen')} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-[0_4px_15px_rgb(0,0,0,0.02)] flex flex-col items-center gap-3 active:scale-95 transition-transform hover:border-blue-300">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Clock size={24}/></div>
                  <span className="font-bold text-slate-700 text-sm text-center leading-tight">Perbaikan Absen</span>
                </button>

                <button onClick={() => setActiveMenu('form_reimburse')} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-[0_4px_15px_rgb(0,0,0,0.02)] flex flex-col items-center gap-3 active:scale-95 transition-transform hover:border-rose-300">
                  <div className="p-3 bg-rose-50 text-rose-600 rounded-xl"><CreditCard size={24}/></div>
                  <span className="font-bold text-slate-700 text-sm text-center leading-tight">Reimbursement</span>
                </button>

                <button onClick={() => setActiveMenu('riwayat_pengajuan')} className="col-span-2 bg-slate-800 p-4 rounded-2xl shadow-md flex items-center justify-center gap-3 active:scale-95 transition-transform">
                  <div className="p-2 bg-slate-700 text-white rounded-xl"><History size={20}/></div>
                  <span className="font-bold text-white text-sm">Riwayat Pengajuan Saya</span>
                </button>
              </div>
            </main>
          </div>

          {/* ========================================== */}
          {/* === VIEW: FORM CUTI === */}
          {/* ========================================== */}
          <div className={`absolute inset-0 bg-[#F4F7FB] flex flex-col transition-transform duration-300 ease-in-out z-30 ${activeMenu === 'form_cuti' ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="px-6 pt-12 pb-6 bg-white shadow-sm flex items-center justify-between z-10">
              <button onClick={() => setActiveMenu('pengajuan')} className="p-2 bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200 active:scale-95"><ChevronLeft size={20}/></button>
              <h1 className="text-lg font-bold text-slate-800">Form Cuti</h1>
              <div className="w-9"></div>
            </div>

            <main className="flex-1 overflow-y-auto px-5 py-6 pb-24 custom-scrollbar">
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-5">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Jenis Cuti</label>
                  <select value={pengajuanForm.jenis} onChange={e => setPengajuanForm({...pengajuanForm, jenis: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-[#0a195c]">
                    <option value="Tahunan">Cuti Tahunan (Sisa: {currentUser.sisa_cuti} Hari)</option>
                    <option value="Menikah">Cuti Menikah</option>
                    <option value="Melahirkan">Cuti Melahirkan</option>
                    <option value="Kedukaan">Cuti Kedukaan</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Dari Tanggal</label>
                    <input type="date" value={pengajuanForm.startDate} onChange={e => setPengajuanForm({...pengajuanForm, startDate: e.target.value})} className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-[#0a195c]"/>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Sampai Tanggal</label>
                    <input type="date" value={pengajuanForm.endDate} onChange={e => setPengajuanForm({...pengajuanForm, endDate: e.target.value})} className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-[#0a195c]"/>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Alasan Lengkap</label>
                  <textarea rows="3" placeholder="Jelaskan alasan cuti Anda..." value={pengajuanForm.alasan} onChange={e => setPengajuanForm({...pengajuanForm, alasan: e.target.value})} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:border-[#0a195c] resize-none"></textarea>
                </div>
                <button onClick={handleSubmitPengajuan} disabled={isSubmittingPengajuan} className="w-full bg-[#0a195c] text-white py-3.5 rounded-xl font-bold text-sm hover:bg-blue-900 active:scale-95 transition-transform flex items-center justify-center gap-2 disabled:opacity-50">
                  {isSubmittingPengajuan ? <RefreshCw size={18} className="animate-spin"/> : <CheckCircle2 size={18}/>}
                  {isSubmittingPengajuan ? 'Memproses Data...' : 'Ajukan Cuti'}
                </button>
              </div>
            </main>
          </div>

          {/* ========================================== */}
          {/* === VIEW: FORM IZIN === */}
          {/* ========================================== */}
          <div className={`absolute inset-0 bg-[#F4F7FB] flex flex-col transition-transform duration-300 ease-in-out z-30 ${activeMenu === 'form_izin' ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="px-6 pt-12 pb-6 bg-white shadow-sm flex items-center justify-between z-10">
              <button onClick={() => setActiveMenu('pengajuan')} className="p-2 bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200 active:scale-95"><ChevronLeft size={20}/></button>
              <h1 className="text-lg font-bold text-slate-800">Form Izin</h1>
              <div className="w-9"></div>
            </div>

            <main className="flex-1 overflow-y-auto px-5 py-6 pb-24 custom-scrollbar">
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-5">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Kategori Izin</label>
                  <select value={pengajuanForm.jenis} onChange={e => setPengajuanForm({...pengajuanForm, jenis: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-[#0a195c]">
                    <option value="Sakit">Sakit (Wajib Surat Dokter)</option>
                    <option value="Pribadi">Keperluan Pribadi / Keluarga</option>
                    <option value="Terlambat">Izin Datang Terlambat</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Tanggal Izin</label>
                  <input type="date" value={pengajuanForm.startDate} onChange={e => setPengajuanForm({...pengajuanForm, startDate: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-[#0a195c]"/>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center justify-between">
                    Lampiran Bukti {pengajuanForm.jenis === 'Sakit' && <span className="text-rose-500 font-bold">*Wajib</span>}
                  </label>
                  
                  <input 
                    type="file" 
                    ref={izinFileInputRef} 
                    className="hidden" 
                    accept="image/*,.pdf" 
                    onChange={(e) => setPengajuanForm({...pengajuanForm, lampiran: e.target.files[0]})} 
                  />
                  
                  {!pengajuanForm.lampiran ? (
                    <button onClick={() => izinFileInputRef.current.click()} className="w-full py-4 border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 rounded-xl text-blue-600 font-bold text-xs flex flex-col items-center gap-2 active:scale-95 transition-transform">
                      <Upload size={24}/> Ambil Foto / Pilih File PDF
                    </button>
                  ) : (
                    <div className="flex items-center justify-between w-full p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <CheckCircle2 size={18} className="text-emerald-500 shrink-0"/>
                        <span className="text-xs font-bold text-emerald-700 truncate">{pengajuanForm.lampiran.name}</span>
                      </div>
                      <button onClick={() => setPengajuanForm({...pengajuanForm, lampiran: null})} className="text-rose-500 p-1.5 bg-white rounded-lg border border-rose-100 shadow-sm active:scale-95">
                        <X size={14}/>
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Alasan Detail</label>
                  <textarea rows="3" placeholder="Sebutkan detail izin Anda..." value={pengajuanForm.alasan} onChange={e => setPengajuanForm({...pengajuanForm, alasan: e.target.value})} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:border-[#0a195c] resize-none"></textarea>
                </div>
                <button onClick={handleSubmitPengajuan} disabled={isSubmittingPengajuan} className="w-full bg-[#0a195c] text-white py-3.5 rounded-xl font-bold text-sm hover:bg-blue-900 active:scale-95 transition-transform flex items-center justify-center gap-2 disabled:opacity-50">
                  {isSubmittingPengajuan ? <RefreshCw size={18} className="animate-spin"/> : <CheckCircle2 size={18}/>}
                  {isSubmittingPengajuan ? 'Memproses Data...' : 'Kirim Izin'}
                </button>
              </div>
            </main>
          </div>

          {/* ========================================== */}
          {/* === VIEW: FORM KOREKSI ABSEN === */}
          {/* ========================================== */}
          <div className={`absolute inset-0 bg-[#F4F7FB] flex flex-col transition-transform duration-300 ease-in-out z-30 ${activeMenu === 'form_absen' ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="px-6 pt-12 pb-6 bg-white shadow-sm flex items-center justify-between z-10">
              <button onClick={() => setActiveMenu('pengajuan')} className="p-2 bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200 active:scale-95"><ChevronLeft size={20}/></button>
              <h1 className="text-lg font-bold text-slate-800">Koreksi Absen</h1>
              <div className="w-9"></div>
            </div>

            <main className="flex-1 overflow-y-auto px-5 py-6 pb-24 custom-scrollbar">
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-5">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Tanggal Absen yang Salah</label>
                  <input type="date" value={koreksiForm.date} onChange={e => setKoreksiForm({...koreksiForm, date: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-[#0a195c]"/>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Bagian yang Diperbaiki</label>
                  <select value={koreksiForm.type} onChange={e => setKoreksiForm({...koreksiForm, type: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-[#0a195c]">
                    <option value="OUT">Hanya Jam Keluar (Lupa Absen Pulang)</option>
                    <option value="IN">Hanya Jam Masuk (Lupa Absen Masuk)</option>
                    <option value="BOTH">Keduanya (Lupa Absen Sama Sekali)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className={`${koreksiForm.type === 'OUT' ? 'opacity-30 pointer-events-none' : ''}`}>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Jam Masuk</label>
                    <input type="time" value={koreksiForm.timeIn} onChange={e => setKoreksiForm({...koreksiForm, timeIn: e.target.value})} className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-[#0a195c]"/>
                  </div>
                  <div className={`${koreksiForm.type === 'IN' ? 'opacity-30 pointer-events-none' : ''}`}>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Jam Keluar</label>
                    <input type="time" value={koreksiForm.timeOut} onChange={e => setKoreksiForm({...koreksiForm, timeOut: e.target.value})} className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-[#0a195c]"/>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Alasan Detail</label>
                  <textarea rows="3" placeholder="Cth: HP mati / Baterai habis saat mau pulang..." value={koreksiForm.reason} onChange={e => setKoreksiForm({...koreksiForm, reason: e.target.value})} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:border-[#0a195c] resize-none"></textarea>
                </div>
                <button onClick={handleKoreksiSubmit} disabled={isSubmittingKoreksi} className="w-full bg-[#0a195c] text-white py-3.5 rounded-xl font-bold text-sm hover:bg-blue-900 active:scale-95 transition-transform flex items-center justify-center gap-2 disabled:opacity-50">
                  {isSubmittingKoreksi ? <RefreshCw size={18} className="animate-spin"/> : <CheckCircle2 size={18}/>}
                  {isSubmittingKoreksi ? 'Memproses Data...' : 'Kirim Perbaikan'}
                </button>
              </div>
            </main>
          </div>

          {/* ========================================== */}
          {/* === VIEW: RIWAYAT PENGAJUAN === */}
          {/* ========================================== */}
          <div className={`absolute inset-0 bg-[#F4F7FB] flex flex-col transition-transform duration-300 ease-in-out z-30 ${activeMenu === 'riwayat_pengajuan' ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="px-6 pt-12 pb-6 bg-white shadow-sm flex items-center justify-between z-10">
              <button onClick={() => setActiveMenu('pengajuan')} className="p-2 bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200 active:scale-95"><ChevronLeft size={20}/></button>
              <h1 className="text-lg font-bold text-slate-800">Riwayat Pengajuan</h1>
              <div className="w-9"></div>
            </div>

            <main className="flex-1 overflow-y-auto px-5 py-6 pb-24 space-y-3 custom-scrollbar">
              {leaveHistory.map(req => (
                <div key={req.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden transition-all">
                  <button onClick={() => setExpandedLeave(expandedLeave === req.id ? null : req.id)} className="w-full p-4 flex justify-between items-center bg-white hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${req.request_type === 'CUTI' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                        {req.request_type === 'CUTI' ? <CalendarMinus size={20}/> : <FileWarning size={20}/>}
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-slate-800">{req.request_type} - {req.category}</p>
                        <p className="text-[10px] font-semibold text-slate-500">{new Date(req.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md border ${
                          req.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                          req.status === 'REJECTED' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                          'bg-amber-50 text-amber-600 border-amber-200'
                       }`}>
                         {req.status === 'PENDING' ? 'Menunggu' : req.status === 'APPROVED' ? 'Disetujui' : 'Ditolak'}
                       </span>
                    </div>
                  </button>

                  {/* DETAIL AKORDION SAAT DIKLIK */}
                  {expandedLeave === req.id && (
                    <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-400">Tanggal:</span>
                        <span className="font-bold text-slate-700">{req.start_date} {req.end_date !== req.start_date ? `s/d ${req.end_date}` : ''}</span>
                      </div>
                      <div className="flex flex-col gap-1 text-xs">
                        <span className="font-bold text-slate-400">Alasan:</span>
                        <span className="font-medium text-slate-700 bg-white p-2 rounded-lg border border-slate-200">{req.reason}</span>
                      </div>
                      {req.admin_note && (
                        <div className="flex flex-col gap-1 text-xs mt-2">
                          <span className="font-bold text-slate-400">Catatan Admin/HRD:</span>
                          <span className="font-medium text-slate-700 italic bg-amber-50 p-2 rounded-lg border border-amber-200">"{req.admin_note}"</span>
                        </div>
                      )}
                      {req.attachment_url && (
                        <a href={req.attachment_url} target="_blank" rel="noreferrer" className="mt-2 flex items-center justify-center gap-2 w-full py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold border border-blue-100 hover:bg-blue-100">
                          <CheckCircle2 size={14}/> Lihat File Lampiran
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {leaveHistory.length === 0 && <div className="text-center py-10 text-slate-400 font-bold">Belum ada riwayat pengajuan.</div>}
            </main>
          </div>

          {/* ========================================== */}
          {/* === VIEW: FORM REIMBURSEMENT === */}
          {/* ========================================== */}
          <div className={`absolute inset-0 bg-[#F4F7FB] flex flex-col transition-transform duration-300 ease-in-out z-30 ${activeMenu === 'form_reimburse' ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="px-6 pt-12 pb-6 bg-white shadow-sm flex items-center justify-between z-10">
              <button onClick={() => setActiveMenu('pengajuan')} className="p-2 bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200 active:scale-95"><ChevronLeft size={20}/></button>
              <h1 className="text-lg font-bold text-slate-800">Reimbursement</h1>
              <div className="w-9"></div>
            </div>

            <main className="flex-1 overflow-y-auto px-5 py-6 pb-24 custom-scrollbar">
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-5">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Kategori Biaya</label>
                  <select value={reimburseForm.category} onChange={e => setReimburseForm({...reimburseForm, category: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-[#0a195c]">
                    <option value="Transportasi">Transportasi / Bensin</option>
                    <option value="Konsumsi">Konsumsi / Makan</option>
                    <option value="Medis">Kesehatan / Medis</option>
                    <option value="Lainnya">Lain-lain (Operasional)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Nominal (Rp)</label>
                  <input type="number" placeholder="Contoh: 150000" value={reimburseForm.amount} onChange={e => setReimburseForm({...reimburseForm, amount: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-[#0a195c]"/>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center justify-between">
                    Foto Struk / Nota <span className="text-rose-500 font-bold">*Wajib</span>
                  </label>
                  <input type="file" ref={reimburseFileInputRef} className="hidden" accept="image/*,.pdf" onChange={(e) => setReimburseForm({...reimburseForm, receipt: e.target.files[0]})} />
                  {!reimburseForm.receipt ? (
                    <button onClick={() => reimburseFileInputRef.current.click()} className="w-full py-4 border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 rounded-xl text-blue-600 font-bold text-xs flex flex-col items-center gap-2 active:scale-95 transition-transform">
                      <Upload size={24}/> Ambil Foto Struk Asli
                    </button>
                  ) : (
                    <div className="flex items-center justify-between w-full p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <div className="flex items-center gap-2 overflow-hidden"><CheckCircle2 size={18} className="text-emerald-500 shrink-0"/><span className="text-xs font-bold text-emerald-700 truncate">{reimburseForm.receipt.name}</span></div>
                      <button onClick={() => setReimburseForm({...reimburseForm, receipt: null})} className="text-rose-500 p-1.5 bg-white rounded-lg border border-rose-100 shadow-sm active:scale-95"><X size={14}/></button>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Keterangan Biaya</label>
                  <textarea rows="3" placeholder="Contoh: Beli bensin saat patroli ke area B..." value={reimburseForm.description} onChange={e => setReimburseForm({...reimburseForm, description: e.target.value})} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:border-[#0a195c] resize-none"></textarea>
                </div>
                <button onClick={handleReimburseSubmit} disabled={isSubmittingReimburse} className="w-full bg-[#0a195c] text-white py-3.5 rounded-xl font-bold text-sm hover:bg-blue-900 active:scale-95 transition-transform flex items-center justify-center gap-2 disabled:opacity-50">
                  {isSubmittingReimburse ? <RefreshCw size={18} className="animate-spin"/> : <CreditCard size={18}/>}
                  {isSubmittingReimburse ? 'Memproses Data...' : 'Kirim Reimbursement'}
                </button>
              </div>
            </main>
          </div>

          {/* ========================================== */}
          {/* === VIEW 2: SETTINGS === */}
          {/* ========================================== */}
          <div className={`absolute inset-0 bg-[#F4F7FB] flex flex-col transition-transform duration-300 ease-in-out z-20 ${activeMenu === 'settings' ? 'translate-x-0' : 'translate-x-full'}`}>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/png, image/jpeg, image/jpg" onChange={handleAvatarUpload} />
            <div className="px-6 pt-12 pb-6 bg-white shadow-sm flex items-center">
              <h1 className="text-xl font-bold text-slate-800 flex-1 text-center">Pengaturan Profil</h1>
            </div>
            <main className="flex-1 overflow-y-auto px-6 py-8 pb-24">
              <div className="flex flex-col items-center mb-8">
                <div className="relative mb-4">
                  {renderUserAvatar("w-28 h-28 text-3xl shadow-md rounded-[2rem]")}
                  <button onClick={() => fileInputRef.current.click()} disabled={uploadingAvatar} className="absolute -bottom-2 -right-2 bg-[#0a195c] p-2.5 rounded-full text-white shadow-lg border-2 border-white active:scale-95 transition-transform">
                    {uploadingAvatar ? <Clock size={18} className="animate-spin" /> : <Camera size={18} />}
                  </button>
                </div>
                <h2 className="text-xl font-bold text-slate-800">{currentUser.name}</h2>
                <p className="text-sm text-slate-500 font-medium mt-1">{currentUser.division || 'Operasional'}</p>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <button onClick={() => fileInputRef.current.click()} className="w-full flex items-center justify-between p-4 border-b border-slate-100 active:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><ImageIcon size={20} /></div>
                    <span className="font-semibold text-slate-700 text-sm">Ganti Foto Profil</span>
                  </div>
                  <ChevronRight size={20} className="text-slate-400" />
                </button>
                <button onClick={handleLogout} className="w-full flex items-center justify-between p-4 active:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-50 text-red-600 rounded-lg"><LogOut size={20} /></div>
                    <span className="font-semibold text-red-600 text-sm">Keluar (Logout)</span>
                  </div>
                  <ChevronRight size={20} className="text-slate-400" />
                </button>
              </div>
            </main>
          </div>

          {/* ========================================== */}
          {/* === VIEW 3: RINGKASAN ABSENSI === */}
          {/* ========================================== */}
          <div className={`absolute inset-0 bg-[#F4F7FB] flex flex-col transition-transform duration-300 ease-in-out z-20 ${activeMenu === 'ringkasan' ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="px-6 pt-12 pb-6 bg-white shadow-sm flex items-center justify-between z-10">
              <button onClick={() => setActiveMenu('home')} className="p-2 bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200"><ChevronLeft size={20}/></button>
              <h1 className="text-lg font-bold text-slate-800">Ringkasan Absensi</h1>
              <div className="w-9"></div> 
            </div>
            <main className="flex-1 overflow-y-auto px-5 py-6 pb-24 space-y-3 custom-scrollbar">
              {attendanceHistory.map(att => (
                <div key={att.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden transition-all">
                  <button onClick={() => setExpandedAbsen(expandedAbsen === att.id ? null : att.id)} className="w-full p-4 flex justify-between items-center bg-white hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="bg-emerald-100 p-2 rounded-xl text-emerald-600"><Calendar size={20}/></div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-slate-800">{att.date}</p>
                        <p className="text-[10px] text-slate-500 font-medium">Klik untuk detail</p>
                      </div>
                    </div>
                    <ChevronRight size={20} className={`text-slate-400 transition-transform ${expandedAbsen === att.id ? 'rotate-90' : ''}`} />
                  </button>

                  {expandedAbsen === att.id && (
                    <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-4">
                      <div className="flex gap-3 items-start">
                        <div className="w-1/2 bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-center">
                          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block mb-1">Masuk</span>
                          <span className="text-lg font-black text-slate-800 block mb-2">{att.check_in_time ? att.check_in_time.substring(0,5) : '--:--'}</span>
                          {att.photo_url ? (
                            <img src={att.photo_url} alt="In" className="w-full h-24 object-cover rounded-lg mb-2 border border-slate-200" />
                          ) : (
                            <div className="w-full h-24 bg-slate-100 rounded-lg mb-2 flex items-center justify-center text-[10px] font-bold text-slate-400">No Photo</div>
                          )}
                          <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(att.location_gps)}`} target="_blank" rel="noreferrer" className="w-full flex items-center justify-center gap-1 bg-blue-50 text-blue-600 py-1.5 rounded-md text-[10px] font-bold hover:bg-blue-100 transition-colors">
                            <MapPin size={12}/> Cek Maps
                          </a>
                        </div>
                        <div className="w-1/2 bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-center">
                          <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest block mb-1">Keluar</span>
                          <span className="text-lg font-black text-slate-800 block mb-2">{att.check_out_time ? att.check_out_time.substring(0,5) : '--:--'}</span>
                          {att.photo_out_url ? (
                            <img src={att.photo_out_url} alt="Out" className="w-full h-24 object-cover rounded-lg mb-2 border border-slate-200" />
                          ) : (
                            <div className="w-full h-24 bg-slate-100 rounded-lg mb-2 flex items-center justify-center text-[10px] font-bold text-slate-400">No Photo</div>
                          )}
                          <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(att.location_gps)}`} target="_blank" rel="noreferrer" className="w-full flex items-center justify-center gap-1 bg-rose-50 text-rose-600 py-1.5 rounded-md text-[10px] font-bold hover:bg-rose-100 transition-colors">
                            <MapPin size={12}/> Cek Maps
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {attendanceHistory.length === 0 && <div className="text-center py-10 text-slate-400 font-bold">Belum ada riwayat absensi.</div>}
            </main>
          </div>

          {/* ========================================== */}
          {/* === VIEW 4: LAPORAN === */}
          {/* ========================================== */}
          <div className={`absolute inset-0 bg-[#F4F7FB] flex flex-col transition-transform duration-300 ease-in-out z-20 ${activeMenu === 'laporan' ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="px-6 pt-12 pb-6 bg-white shadow-sm flex items-center justify-between z-10">
              <button onClick={() => { setActiveMenu('home'); setPatrolLocStatus(null); setPatrolPhotos([]); setIsRegulerFormOpen(false); setRegulerPhotos([]); setRegulerDesc(''); }} className="p-2 bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200 active:scale-95 transition-transform"><ChevronLeft size={20}/></button>
              <h1 className="text-lg font-bold text-slate-800">Laporan {laporanTab === 'patroli' ? 'Patroli' : 'Reguler'}</h1>
              <div className="w-9"></div>
            </div>

            <main className="flex-1 overflow-y-auto px-5 py-6 pb-32 space-y-5 custom-scrollbar">
              {laporanTab === 'patroli' && (
                <div className="space-y-5">
                  <div className="bg-white p-5 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-3 relative z-10"><MapPin size={28}/></div>
                    <h3 className="font-black text-slate-800 mb-1 relative z-10">Validasi Titik Patroli</h3>
                    <p className="text-[10px] text-slate-500 mb-5 px-4 font-medium relative z-10">Sistem akan mencocokkan koordinat Anda dengan data area konfigurasi.</p>

                    {!patrolLocStatus && (
                      <button onClick={checkPatrolLocation} className="w-full bg-[#0a195c] text-white py-3.5 rounded-2xl font-bold text-sm hover:bg-blue-900 shadow-lg shadow-blue-900/20 active:scale-95 transition-all">Cek Lokasi Saya</button>
                    )}
                    {patrolLocStatus === 'locating' && (
                      <div className="w-full bg-slate-100 text-slate-500 py-3.5 rounded-2xl font-bold text-sm flex justify-center items-center gap-2"><RefreshCw size={16} className="animate-spin"/> Memindai Satelit...</div>
                    )}
                    {patrolLocStatus === 'invalid' && (
                      <div className="animate-in zoom-in duration-200">
                        <div className="w-full bg-rose-50 border border-rose-100 text-rose-600 py-3.5 rounded-2xl font-bold text-sm mb-2">Di Luar Area Patroli!</div>
                        <button onClick={checkPatrolLocation} className="text-xs text-slate-500 hover:text-slate-700 underline font-semibold">Coba Scan Ulang</button>
                      </div>
                    )}
                    {patrolLocStatus === 'valid' && (
                      <div className="w-full bg-emerald-50 border border-emerald-200 text-emerald-700 py-3 rounded-2xl font-bold text-sm flex flex-col items-center animate-in zoom-in duration-200">
                        <span className="flex items-center gap-1"><CheckCircle2 size={16}/> Terverifikasi</span>
                        <span className="text-[10px] text-emerald-600 font-medium mt-0.5">{patrolLocName}</span>
                      </div>
                    )}
                  </div>

                  {!patrolLocStatus && (
                    <div className="mt-2 space-y-4 animate-in fade-in duration-300 pb-10">
                      <h3 className="font-bold text-slate-800 text-sm px-1 border-b border-slate-200 pb-2">Riwayat Patroli (7 Hari Terakhir)</h3>
                      {(() => {
                        const sevenDaysAgo = new Date();
                        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                        sevenDaysAgo.setHours(0,0,0,0);
                        const recentPatrols = reportHistory.filter(r => r.report_type === 'patroli').filter(r => new Date(r.created_at) >= sevenDaysAgo);
                        const grouped = recentPatrols.reduce((acc, report) => {
                          const dateStr = new Date(report.created_at).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
                          if (!acc[dateStr]) acc[dateStr] = [];
                          acc[dateStr].push(report);
                          return acc;
                        }, {});
                        const dates = Object.keys(grouped);

                        if (dates.length === 0) {
                          return (
                            <div className="text-center py-10 bg-white rounded-3xl border border-slate-100 border-dashed shadow-sm">
                              <FileText size={32} className="mx-auto text-slate-300 mb-2"/>
                              <p className="text-[11px] text-slate-400 font-bold">Belum ada riwayat patroli dalam 7 hari terakhir.</p>
                            </div>
                          );
                        }

                        return dates.map(dateStr => (
                          <div key={dateStr} className="bg-white rounded-2xl shadow-[0_4px_15px_rgb(0,0,0,0.03)] border border-slate-100 overflow-hidden transition-all mb-4">
                            <button onClick={() => setExpandedPatrolDate(expandedPatrolDate === dateStr ? null : dateStr)} className="w-full p-4 flex justify-between items-center bg-white hover:bg-slate-50 transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="bg-blue-50 p-2 rounded-xl text-blue-600"><Calendar size={18}/></div>
                                <span className="text-xs font-bold text-slate-800">{dateStr}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-[10px] font-bold text-white bg-emerald-500 px-2 py-0.5 rounded-full">{grouped[dateStr].length} Laporan</span>
                                <ChevronRight size={18} className={`text-slate-400 transition-transform duration-300 ${expandedPatrolDate === dateStr ? 'rotate-90' : ''}`} />
                              </div>
                            </button>

                            {expandedPatrolDate === dateStr && (
                              <div className="p-4 bg-slate-50/80 border-t border-slate-100 space-y-4">
                                {grouped[dateStr].map(report => {
                                  let parsedDesc = { notes: '', photos: [] };
                                  try { parsedDesc = JSON.parse(report.description); } catch(e) {}
                                  const timeStr = new Date(report.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

                                  return (
                                    <div key={report.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                                      <div className="flex justify-between items-start mb-3 border-b border-slate-100 pb-2">
                                        <div>
                                          <h4 className="text-xs font-bold text-[#0a195c] mb-0.5">{report.title}</h4>
                                          <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1"><Clock size={10}/> {timeStr} WIB</p>
                                        </div>
                                      </div>
                                      {parsedDesc.notes && (
                                        <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-100/50 mb-4 relative">
                                          <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest block mb-1">Kesimpulan Situasi</span>
                                          <p className="text-[11px] text-slate-700 font-medium leading-relaxed">{parsedDesc.notes}</p>
                                        </div>
                                      )}
                                      {parsedDesc.photos && parsedDesc.photos.length > 0 && (
                                        <div className="grid grid-cols-1 gap-3">
                                          {parsedDesc.photos.map((p, i) => (
                                            <div key={i} className="flex gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100 items-start">
                                              <img src={p.url} alt="patrol" className="w-16 h-16 object-cover rounded-lg border border-slate-200 shadow-sm shrink-0" />
                                              <div className="flex-1 min-w-0">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Lampiran {i+1}</p>
                                                <p className="text-[11px] text-slate-700 font-medium break-words leading-snug">{p.desc ? p.desc : <span className="italic text-slate-400">Tidak ada keterangan gambar.</span>}</p>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        ));
                      })()}
                    </div>
                  )}

                  {patrolLocStatus === 'valid' && (
                    <div className="bg-white p-5 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 animate-in slide-in-from-bottom-4 duration-300">
                      <h3 className="font-bold text-slate-800 text-sm mb-4 border-b border-slate-100 pb-2">Dokumentasi & Keterangan</h3>
                      <div className="space-y-3 mb-4">
                        {patrolPhotos.map((photo, idx) => (
                          <div key={idx} className="flex gap-3 items-start bg-slate-50 p-3 rounded-2xl border border-slate-200 animate-in fade-in">
                            <img src={photo.base64} alt={`Preview ${idx}`} className="w-20 h-20 object-cover rounded-xl shadow-sm border border-white" />
                            <textarea 
                              placeholder="Keterangan foto (opsional)..."
                              value={photo.desc}
                              onChange={(e) => {
                                const newPhotos = [...patrolPhotos];
                                newPhotos[idx].desc = e.target.value;
                                setPatrolPhotos(newPhotos);
                              }}
                              className="flex-1 h-20 p-2.5 text-[11px] border border-slate-200 rounded-xl outline-none focus:border-[#0a195c] focus:ring-2 focus:ring-[#0a195c]/20 resize-none bg-white font-medium custom-scrollbar transition-all"
                            />
                            <button onClick={() => setPatrolPhotos(patrolPhotos.filter((_, i) => i !== idx))} className="text-slate-400 hover:text-rose-500 p-1 bg-white rounded-lg border border-slate-200 shadow-sm active:scale-95"><X size={16}/></button>
                          </div>
                        ))}
                      </div>

                      <button onClick={() => startPatrolCamera('environment')} className="flex flex-col items-center justify-center w-full py-4 border-2 border-dashed border-blue-200 bg-blue-50/50 rounded-2xl text-[#0a195c] font-bold text-xs cursor-pointer hover:bg-blue-50 transition-colors mb-6 active:scale-95">
                        <Camera size={20} className="mb-1"/> {patrolPhotos.length > 0 ? 'Tambah Foto Laporan (Kamera)' : 'Mulai Foto Laporan (Kamera)'}
                      </button>

                      <div className="mb-4">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Kolom keterangan</label>
                        <textarea 
                          placeholder="Tuliskan lengkap situasi atau kondisi patroli di sini..."
                          value={patrolDesc}
                          onChange={(e) => setPatrolDesc(e.target.value)}
                          className="w-full h-24 p-3.5 text-xs border border-slate-200 rounded-2xl outline-none focus:border-[#0a195c] focus:ring-4 focus:ring-[#0a195c]/10 resize-none bg-slate-50 focus:bg-white font-medium custom-scrollbar transition-all"
                        />
                      </div>

                      <button onClick={handlePatrolSubmit} disabled={isSubmittingReport} className="w-full bg-emerald-500 text-white py-3.5 rounded-2xl font-bold text-sm shadow-[0_8px_20px_rgba(16,185,129,0.3)] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                        {isSubmittingReport ? <RefreshCw size={18} className="animate-spin"/> : <CheckCircle2 size={18}/>}
                        {isSubmittingReport ? 'Mengunggah Data...' : 'Kirim Laporan Patroli'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {laporanTab === 'reguler' && (
                <div className="space-y-5">
                  {!isRegulerFormOpen ? (
                    <div className="animate-in fade-in duration-300">
                      <button onClick={() => setIsRegulerFormOpen(true)} className="w-full bg-[#0a195c] text-white py-4 rounded-3xl font-bold text-sm hover:bg-blue-900 shadow-lg shadow-blue-900/20 active:scale-95 transition-all flex items-center justify-center gap-2 mb-6">
                        <Plus size={20}/> Mulai Laporan Reguler
                      </button>

                      <h3 className="font-bold text-slate-800 text-sm px-1 border-b border-slate-200 pb-2 mb-4">Riwayat Reguler (7 Hari Terakhir)</h3>
                      {(() => {
                        const sevenDaysAgo = new Date();
                        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                        sevenDaysAgo.setHours(0,0,0,0);
                        const recentRegulers = reportHistory.filter(r => r.report_type === 'reguler').filter(r => new Date(r.created_at) >= sevenDaysAgo);
                        const grouped = recentRegulers.reduce((acc, report) => {
                          const dateStr = new Date(report.created_at).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
                          if (!acc[dateStr]) acc[dateStr] = [];
                          acc[dateStr].push(report);
                          return acc;
                        }, {});
                        const dates = Object.keys(grouped);

                        if (dates.length === 0) {
                          return (
                            <div className="text-center py-10 bg-white rounded-3xl border border-slate-100 border-dashed shadow-sm">
                              <FileText size={32} className="mx-auto text-slate-300 mb-2"/>
                              <p className="text-[11px] text-slate-400 font-bold">Belum ada riwayat laporan reguler.</p>
                            </div>
                          );
                        }

                        return dates.map(dateStr => (
                          <div key={dateStr} className="bg-white rounded-2xl shadow-[0_4px_15px_rgb(0,0,0,0.03)] border border-slate-100 overflow-hidden transition-all mb-4">
                            <button onClick={() => setExpandedRegulerDate(expandedRegulerDate === dateStr ? null : dateStr)} className="w-full p-4 flex justify-between items-center bg-white hover:bg-slate-50 transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="bg-blue-50 p-2 rounded-xl text-blue-600"><Calendar size={18}/></div>
                                <span className="text-xs font-bold text-slate-800">{dateStr}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-[10px] font-bold text-white bg-emerald-500 px-2 py-0.5 rounded-full">{grouped[dateStr].length} Laporan</span>
                                <ChevronRight size={18} className={`text-slate-400 transition-transform duration-300 ${expandedRegulerDate === dateStr ? 'rotate-90' : ''}`} />
                              </div>
                            </button>
                            {expandedRegulerDate === dateStr && (
                              <div className="p-4 bg-slate-50/80 border-t border-slate-100 space-y-4">
                                {grouped[dateStr].map(report => {
                                  let parsedDesc = { notes: '', photos: [] };
                                  try { parsedDesc = JSON.parse(report.description); } catch(e) {}
                                  const timeStr = new Date(report.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                                  return (
                                    <div key={report.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                                      <div className="flex justify-between items-start mb-3 border-b border-slate-100 pb-2">
                                        <div>
                                          <h4 className="text-xs font-bold text-[#0a195c] mb-0.5">{report.title}</h4>
                                          <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1"><Clock size={10}/> {timeStr} WIB</p>
                                        </div>
                                      </div>
                                      {parsedDesc.notes && (
                                        <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-100/50 mb-4 relative">
                                          <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest block mb-1">Kesimpulan Situasi</span>
                                          <p className="text-[11px] text-slate-700 font-medium leading-relaxed">{parsedDesc.notes}</p>
                                        </div>
                                      )}
                                      {parsedDesc.photos && parsedDesc.photos.length > 0 && (
                                        <div className="grid grid-cols-1 gap-3">
                                          {parsedDesc.photos.map((p, i) => (
                                            <div key={i} className="flex gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100 items-start">
                                              <img src={p.url} alt="reguler" className="w-16 h-16 object-cover rounded-lg border border-slate-200 shadow-sm shrink-0" />
                                              <div className="flex-1 min-w-0">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Lampiran {i+1}</p>
                                                <p className="text-[11px] text-slate-700 font-medium break-words leading-snug">{p.desc ? p.desc : <span className="italic text-slate-400">Tidak ada keterangan gambar.</span>}</p>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        ));
                      })()}
                    </div>
                  ) : (
                    <div className="bg-white p-5 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 animate-in slide-in-from-bottom-4 duration-300">
                      <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                        <h3 className="font-bold text-slate-800 text-sm">Form Laporan Reguler</h3>
                        <button onClick={() => setIsRegulerFormOpen(false)} className="text-slate-400 hover:text-rose-500 p-1.5 bg-slate-50 rounded-lg active:scale-95"><X size={16}/></button>
                      </div>

                      <div className="space-y-3 mb-4">
                        {regulerPhotos.map((photo, idx) => (
                          <div key={idx} className="flex gap-3 items-start bg-slate-50 p-3 rounded-2xl border border-slate-200 animate-in fade-in">
                            <img src={photo.base64} alt={`Preview ${idx}`} className="w-20 h-20 object-cover rounded-xl shadow-sm border border-white" />
                            <textarea 
                              placeholder="Keterangan foto (opsional)..."
                              value={photo.desc}
                              onChange={(e) => {
                                const newPhotos = [...regulerPhotos];
                                newPhotos[idx].desc = e.target.value;
                                setRegulerPhotos(newPhotos);
                              }}
                              className="flex-1 h-20 p-2.5 text-[11px] border border-slate-200 rounded-xl outline-none focus:border-[#0a195c] focus:ring-2 focus:ring-[#0a195c]/20 resize-none bg-white font-medium custom-scrollbar transition-all"
                            />
                            <button onClick={() => setRegulerPhotos(regulerPhotos.filter((_, i) => i !== idx))} className="text-slate-400 hover:text-rose-500 p-1 bg-white rounded-lg border border-slate-200 shadow-sm active:scale-95"><X size={16}/></button>
                          </div>
                        ))}
                      </div>

                      <button onClick={() => startPatrolCamera('environment')} className="flex flex-col items-center justify-center w-full py-4 border-2 border-dashed border-blue-200 bg-blue-50/50 rounded-2xl text-[#0a195c] font-bold text-xs cursor-pointer hover:bg-blue-50 transition-colors mb-6 active:scale-95">
                        <Camera size={20} className="mb-1"/> {regulerPhotos.length > 0 ? 'Tambah Foto (Kamera)' : 'Ambil Foto Laporan (Kamera)'}
                      </button>

                      <div className="mb-4">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Keterangan Laporan</label>
                        <textarea 
                          placeholder="Tuliskan keterangan laporan reguler di sini..."
                          value={regulerDesc}
                          onChange={(e) => setRegulerDesc(e.target.value)}
                          className="w-full h-24 p-3.5 text-xs border border-slate-200 rounded-2xl outline-none focus:border-[#0a195c] focus:ring-4 focus:ring-[#0a195c]/10 resize-none bg-slate-50 focus:bg-white font-medium custom-scrollbar transition-all"
                        />
                      </div>

                      <button onClick={handleRegulerSubmit} disabled={isSubmittingReport} className="w-full bg-[#0a195c] text-white py-3.5 rounded-2xl font-bold text-sm shadow-lg active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                        {isSubmittingReport ? <RefreshCw size={18} className="animate-spin"/> : <CheckCircle2 size={18}/>}
                        {isSubmittingReport ? 'Mengunggah Data...' : 'Kirim Laporan Reguler'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </main>
          </div>
        </div>

        {/* ========================================== */}
          {/* === VIEW 5: SLIP GAJI === */}
          {/* ========================================== */}
          <div className={`absolute inset-0 bg-[#F4F7FB] flex flex-col transition-transform duration-300 ease-in-out z-30 ${activeMenu === 'slip' ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="px-6 pt-12 pb-6 bg-white shadow-sm flex items-center justify-between z-10">
              <button onClick={() => { setActiveMenu('home'); setSelectedPayslip(null); }} className="p-2 bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200 active:scale-95"><ChevronLeft size={20}/></button>
              <h1 className="text-lg font-bold text-slate-800">Slip Gaji</h1>
              <div className="w-9"></div>
            </div>
            <main className="flex-1 overflow-y-auto px-5 py-6 pb-24 space-y-4 custom-scrollbar">
               {payrolls.length === 0 ? (
                 <div className="text-center py-10 bg-white rounded-3xl border border-slate-100 border-dashed shadow-sm">
                   <CreditCard size={32} className="mx-auto text-slate-300 mb-2"/>
                   <p className="text-[11px] text-slate-400 font-bold">Belum ada data slip gaji.</p>
                 </div>
               ) : (
                 payrolls.map(pay => (
                   <div key={pay.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                     <div className="flex justify-between items-center mb-3 pb-3 border-b border-slate-100">
                       <div>
                         <h3 className="font-bold text-[#0a195c]">Periode: {pay.period}</h3>
                         <p className="text-[10px] text-slate-500 font-medium">Status: LUNAS</p>
                       </div>
                       <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><CreditCard size={20} /></div>
                     </div>
                     <div className="mb-4">
                       <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Total Diterima (THP)</p>
                       <p className="text-xl font-black text-emerald-600">{formatRupiah(pay.net_salary)}</p>
                     </div>
                     <button onClick={() => setSelectedPayslip(pay.id === selectedPayslip ? null : pay.id)} className="w-full py-2.5 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-100 transition-colors">
                       {selectedPayslip === pay.id ? 'Tutup Rincian' : 'Lihat Rincian Lengkap'}
                     </button>
                     
                     {selectedPayslip === pay.id && (
                       <div className="mt-4 pt-4 border-t border-dashed border-slate-200 animate-in fade-in zoom-in duration-300">
                          {/* DESAIN PAYSLIP MIRIP CLIENT ADMIN */}
                          {/* DESAIN PAYSLIP MIRIP CLIENT ADMIN */}
                          <div id={`payslip-mobile-${pay.id}`} className="border border-[#cbd5e1] p-4 rounded-xl bg-[#ffffff] text-[#0f172a] relative">
                             {/* HEADER SURAT */}
                             <div className="flex justify-between items-start border-b-2 border-[#1e293b] pb-3 mb-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 bg-[#1e293b] text-[#ffffff] rounded flex items-center justify-center font-black text-xs">
                                    {appConfig.short}
                                  </div>
                                  <div>
                                    <h2 className="text-sm font-black text-[#0f172a] uppercase tracking-widest leading-tight">{appConfig.name}</h2>
                                    <p className="text-[8px] text-[#475569] font-medium">Slip Gaji Karyawan</p>
                                  </div>
                                </div>
                             </div>

                             {/* INFO KARYAWAN */}
                             <table className="w-full text-[9px] mb-4 border-collapse border border-[#1e293b]">
                                <tbody>
                                   <tr>
                                      <td className="bg-[#f1f5f9] font-bold p-1.5 w-1/3 border border-[#1e293b]">Nama Lengkap</td>
                                      <td className="p-1.5 border border-[#1e293b] font-bold">{currentUser.name}</td>
                                   </tr>
                                   <tr>
                                      <td className="bg-[#f1f5f9] font-bold p-1.5 border border-[#1e293b]">NIK / Divisi</td>
                                      <td className="p-1.5 border border-[#1e293b]">{currentUser.nik} / {currentUser.division}</td>
                                   </tr>
                                   <tr>
                                      <td className="bg-[#f1f5f9] font-bold p-1.5 border border-[#1e293b]">Periode Gaji</td>
                                      <td className="p-1.5 border border-[#1e293b] font-black">{pay.period}</td>
                                   </tr>
                                   <tr>
                                      <td className="bg-[#f1f5f9] font-bold p-1.5 border border-[#1e293b]">Kehadiran</td>
                                      <td className="p-1.5 border border-[#1e293b]">{pay.total_work_days} Hari Masuk</td>
                                   </tr>
                                </tbody>
                             </table>

                             {/* EARNINGS */}
                             <table className="w-full text-[9px] mb-3 border-collapse border border-[#1e293b]">
                                <thead className="bg-[#1e293b] text-[#ffffff]">
                                   <tr>
                                      <th className="p-1.5 text-left border-r border-[#334155]">PENGHASILAN</th>
                                      <th className="p-1.5 text-right">NOMINAL</th>
                                   </tr>
                                </thead>
                                <tbody>
                                   <tr>
                                      <td className="p-1.5 border border-[#1e293b] font-semibold">Gaji Pokok</td>
                                      <td className="p-1.5 border border-[#1e293b] text-right">{formatRupiah(pay.basic_salary)}</td>
                                   </tr>
                                   {(pay.additions || []).map((add, i) => (
                                   <tr key={i}>
                                      <td className="p-1.5 border border-[#1e293b] font-semibold">{add.name}</td>
                                      <td className="p-1.5 border border-[#1e293b] text-right">{formatRupiah(add.amount)}</td>
                                   </tr>
                                   ))}
                                   <tr className="bg-[#f1f5f9]">
                                      <td className="p-1.5 border border-[#1e293b] text-right font-black">Total Kotor</td>
                                      <td className="p-1.5 border border-[#1e293b] text-right font-black">{formatRupiah(pay.gross_salary)}</td>
                                   </tr>
                                </tbody>
                             </table>

                             {/* DEDUCTIONS */}
                             <table className="w-full text-[9px] mb-4 border-collapse border border-[#1e293b]">
                                <thead className="bg-[#1e293b] text-[#ffffff]">
                                   <tr>
                                      <th className="p-1.5 text-left border-r border-[#334155]">POTONGAN</th>
                                      <th className="p-1.5 text-right">NOMINAL</th>
                                   </tr>
                                </thead>
                                <tbody>
                                   <tr>
                                      <td className="p-1.5 border border-[#1e293b] font-semibold">PPh 21</td>
                                      <td className="p-1.5 border border-[#1e293b] text-right">{formatRupiah(pay.tax_pph21)}</td>
                                   </tr>
                                   {(pay.deductions || []).map((ded, i) => (
                                   <tr key={i}>
                                      <td className="p-1.5 border border-[#1e293b] font-semibold">{ded.name}</td>
                                      <td className="p-1.5 border border-[#1e293b] text-right">{formatRupiah(ded.amount)}</td>
                                   </tr>
                                   ))}
                                </tbody>
                             </table>

                             {/* TAKE HOME PAY */}
                             <table className="w-full border-collapse border border-[#0f172a] mb-4">
                                <tbody>
                                   <tr className="bg-[#0f172a] text-[#ffffff] font-black">
                                      <td className="p-2 text-left text-[10px]">TAKE HOME PAY</td>
                                      <td className="p-2 text-right text-sm">{formatRupiah(pay.net_salary)}</td>
                                   </tr>
                                </tbody>
                             </table>
                             
                             <p className="text-[7px] text-[#64748b] italic text-center">Dokumen ini sah dan diterbitkan otomatis oleh sistem.</p>
                          </div>

                          {/* PDF DOWNLOAD BUTTON MOBILE */}
                          <button 
                             onClick={() => {
                               const elementId = `payslip-mobile-${pay.id}`;
                               handleDownloadPDFMobile(elementId, `Payslip_${currentUser.name}_${pay.period}.pdf`);
                             }} 
                             className="w-full mt-3 bg-slate-800 hover:bg-slate-900 text-white py-3 rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-colors active:scale-95"
                          >
                            <Download size={14}/> Download PDF
                          </button>
                       </div>
                     )}
                   </div>
                 ))
               )}
            </main>
          </div>

          {/* ========================================== */}
          {/* === MODAL: KAMERA LAPORAN (PATROLI & REGULER) === */}
          {/* ========================================== */}
          {isPatrolCameraOpen && (
            <div className="absolute inset-0 bg-black z-50 flex flex-col">
              <div className="px-5 pt-10 pb-4 flex justify-between items-center text-white bg-gradient-to-b from-black/80 to-transparent absolute top-0 w-full z-10">
                 <button onClick={stopPatrolCamera} className="p-2 bg-white/20 rounded-full active:scale-95"><X size={20}/></button>
                 <span className="font-bold text-sm">Foto Dokumentasi</span>
                 <button onClick={() => startPatrolCamera(patrolFacingMode === 'environment' ? 'user' : 'environment')} className="p-2 bg-white/20 rounded-full active:scale-95"><RefreshCw size={20}/></button>
              </div>
              <div className="flex-1 relative flex items-center justify-center overflow-hidden">
                 <video ref={patrolVideoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
                 <canvas ref={patrolCanvasRef} className="hidden" />
              </div>
              <div className="pb-10 pt-6 px-8 flex justify-center bg-gradient-to-t from-black/80 to-transparent absolute bottom-0 w-full z-10">
                 <button onClick={capturePatrolPhoto} className="w-20 h-20 rounded-full border-4 border-white bg-white/30 active:scale-95 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.3)]"></button>
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* === BOTTOM NAVIGATION BAR (FIXED) === */}
          {/* ========================================== */}
          <div className="absolute bottom-0 w-full bg-white border-t border-slate-200 flex justify-around items-center py-3 px-2 z-50 rounded-t-3xl shadow-[0_-5px_20px_rgba(0,0,0,0.03)] pb-5">
            <button onClick={() => setActiveMenu('home')} className={`flex flex-col items-center p-2 transition-colors ${activeMenu === 'home' ? 'text-[#0a195c]' : 'text-slate-400'}`}>
              <Home size={24} className={activeMenu === 'home' ? 'drop-shadow-md' : ''}/>
              <span className="text-[10px] font-bold mt-1">Beranda</span>
            </button>
            
            <div className="relative -top-6">
              <button onClick={() => setActiveMenu('absen')} className="bg-[#0a195c] text-white p-4 rounded-full shadow-lg shadow-blue-900/30 flex items-center justify-center border-4 border-[#F4F7FB] active:scale-95 transition-transform">
                <Camera size={28} />
              </button>
            </div>

            <button onClick={() => setActiveMenu('settings')} className={`flex flex-col items-center p-2 transition-colors ${activeMenu === 'settings' ? 'text-[#0a195c]' : 'text-slate-400'}`}>
              <Settings size={24} className={activeMenu === 'settings' ? 'drop-shadow-md' : ''}/>
              <span className="text-[10px] font-bold mt-1">Profil</span>
            </button>
          </div>
        
        {/* ========================================== */}
        {/* === VIEW ABSENSI KAMERA (MODAL LAYAR PENUH) === */}
        {/* ========================================== */}
        <div className={`absolute inset-0 bg-[#0f172a] flex flex-col z-50 transition-transform duration-300 ${activeMenu === 'absen' ? 'translate-y-0' : 'translate-y-full'}`}>
          <div className="pt-10 pb-4 px-6 flex justify-between items-center text-white shrink-0">
            <button onClick={() => setActiveMenu('home')} className="p-2 bg-white/10 rounded-full active:scale-95"><X size={24} /></button>
            <h1 className="font-bold text-lg">{hasAbsenMasuk ? 'Absen Pulang' : 'Absen Masuk'}</h1>
            <div className="w-10"></div>
          </div>

          <div className="flex-1 relative bg-black mx-4 mb-4 rounded-[2rem] overflow-hidden border-2 border-white/10 flex items-center justify-center shadow-2xl">
            <canvas ref={canvasRef} className="hidden" />

            {!absenPhoto ? (
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
            ) : (
              <img src={absenPhoto} alt="Captured" className="w-full h-full object-cover scale-x-[-1]" />
            )}

            <div className="absolute top-4 left-4 right-4 bg-black/60 backdrop-blur-md text-white p-3 rounded-xl border border-white/10">
              <p className="text-[10px] text-slate-300 font-semibold flex items-center gap-1 mb-0.5"><MapPin size={12}/> Lokasi Terdeteksi:</p>
              <p className={`text-xs font-bold tracking-wide ${activeLocationName === 'Di Luar Radius Kantor' ? 'text-rose-400' : 'text-emerald-400'}`}>
                {isLocating ? 'Memindai satelit...' : activeLocationName}
              </p>
              {userLocation && <p className="text-[9px] text-slate-400 mt-1 font-mono">{userLocation.lat}, {userLocation.lng}</p>}
            </div>
            
            {!absenPhoto && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-56 h-72 border-2 border-dashed border-white/50 rounded-[3rem] opacity-70"></div>
              </div>
            )}
          </div>

          <div className="h-32 pb-8 shrink-0 flex items-center justify-center gap-12">
            {!absenPhoto ? (
              <button onClick={takePhoto} className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border-4 border-white active:scale-90 transition-transform">
                <div className="w-14 h-14 bg-white rounded-full"></div>
              </button>
            ) : (
              <>
                <button onClick={() => { setAbsenPhoto(null); startCamera(); }} disabled={isSubmitting} className="flex flex-col items-center gap-1.5 text-white/80 active:scale-95 transition-transform disabled:opacity-50">
                  <div className="p-3 bg-white/10 rounded-full"><RefreshCw size={24} /></div>
                  <span className="text-xs font-bold">Ulangi</span>
                </button>
                
                <button onClick={handleAbsenSubmit} disabled={isSubmitting} className="flex flex-col items-center gap-1.5 text-emerald-400 active:scale-95 transition-transform disabled:opacity-50">
                  <div className="p-3 bg-emerald-400/20 rounded-full border border-emerald-400/30">
                    {isSubmitting ? <Clock size={28} className="animate-spin text-emerald-400" /> : <CheckCircle2 size={28} />}
                  </div>
                  <span className="text-xs font-bold">{isSubmitting ? 'Mengirim...' : 'Kirim Absen'}</span>
                </button>
              </>
            )}
          </div>
        </div>

          {/* ========================================== */}
          {/* === MODAL: BUAT INSTRUKSI === */}
          {/* ========================================== */}
          {isInstructionModalOpen && (
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex flex-col justify-end">
              <div className="bg-white rounded-t-3xl pt-6 pb-24 px-6 flex flex-col max-h-[85vh] shadow-2xl animate-in slide-in-from-bottom-full duration-300">
                <div className="flex justify-between items-center mb-5">
                   <h2 className="font-bold text-lg text-slate-800">Buat Instruksi</h2>
                   <button onClick={() => setIsInstructionModalOpen(false)} className="p-2 bg-slate-100 rounded-full text-slate-500 active:scale-95"><X size={18}/></button>
                </div>
                
                <div className="overflow-y-auto space-y-4 custom-scrollbar">
                   <div>
                     <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Jenis Broadcast</label>
                     <select value={instForm.broadcast_type} onChange={(e) => setInstForm({...instForm, broadcast_type: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm font-bold outline-none focus:border-[#0a195c]">
                       <option value="Instruksi">Instruksi Lapangan</option>
                       <option value="Informasi">Informasi / Pengumuman</option>
                     </select>
                   </div>
                   <div>
                     <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Target Penerima</label>
                     <select value={instForm.target_type} onChange={(e) => setInstForm({...instForm, target_type: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm font-bold outline-none focus:border-[#0a195c]">
                       <option value="LOCATION">Seluruh Karyawan di Lokasi Saya</option>
                       <option value="INDIVIDUAL">Perorangan (Karyawan Tertentu)</option>
                     </select>
                   </div>
                   
                   {instForm.target_type === 'INDIVIDUAL' && (
                     <div>
                       <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Pilih Karyawan</label>
                       <select value={instForm.target_val} onChange={(e) => setInstForm({...instForm, target_val: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm font-bold outline-none focus:border-[#0a195c]">
                         <option value="">Pilih Karyawan...</option>
                         {colleagues.map(c => <option key={c.id} value={c.id}>{c.nama_lengkap}</option>)}
                       </select>
                     </div>
                   )}
                   
                   <div>
                     <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Isi Instruksi</label>
                     <textarea value={instForm.content} onChange={(e) => setInstForm({...instForm, content: e.target.value})} rows="4" className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-[#0a195c] resize-none"></textarea>
                   </div>
                   
                   <div>
                     <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Lampiran File (Opsional)</label>
                     <input type="file" onChange={(e) => setInstForm({...instForm, file: e.target.files[0]})} className="w-full text-xs file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#0a195c] file:text-white" />
                   </div>
                   
                   <button onClick={handleCreateInstruction} disabled={isSubmittingInst} className="w-full mt-2 bg-[#0a195c] text-white py-3.5 rounded-xl font-bold flex justify-center items-center gap-2">
                     {isSubmittingInst ? <RefreshCw size={18} className="animate-spin"/> : <CheckCircle2 size={18}/>}
                     Kirim Instruksi
                   </button>
                </div>
              </div>
            </div>
          )}

        {/* === VIEW: CUSTOM FORM DINAMIS (MOBILE RENDERER LENGKAP) === */}
        <div className={`absolute inset-0 bg-[#F4F7FB] flex flex-col transition-transform duration-300 ease-in-out z-30 ${activeMenu === 'custom_form_view' ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="px-6 pt-12 pb-6 bg-white shadow-sm flex items-center justify-between z-10">
            <button onClick={() => setActiveMenu('home')} className="p-2 bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200 active:scale-95"><ChevronLeft size={20}/></button>
            <h1 className="text-lg font-bold text-slate-800 truncate px-2">{activeCustomMenu?.menu_name}</h1>
            <div className="w-9"></div>
          </div>

          <main className="flex-1 overflow-y-auto px-5 py-6 pb-24 custom-scrollbar">
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-6">
              
              {activeCustomMenu?.fields.map((field, idx) => (
                <div key={field.id} className="border-b border-slate-100 pb-5 last:border-0 relative">
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2.5">
                    <span className="text-blue-500 mr-1">{idx + 1}.</span> {field.label}
                  </label>
                  
                  {/* TIPE 1: TEKS SINGKAT */}
                  {field.type === 'short_text' && (
                    <input type="text" placeholder="Ketik jawaban..." value={customFormData[field.id] || ''} onChange={e => setCustomFormData({...customFormData, [field.id]: e.target.value})} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-[#0a195c] transition-colors"/>
                  )}

                  {/* TIPE 2: TEKS PARAGRAF */}
                  {field.type === 'long_text' && (
                    <textarea rows="3" placeholder="Deskripsikan dengan lengkap..." value={customFormData[field.id] || ''} onChange={e => setCustomFormData({...customFormData, [field.id]: e.target.value})} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:border-[#0a195c] resize-none custom-scrollbar transition-colors"></textarea>
                  )}

                  {/* TIPE 3: ANGKA */}
                  {field.type === 'number' && (
                    <input type="number" placeholder="0" value={customFormData[field.id] || ''} onChange={e => setCustomFormData({...customFormData, [field.id]: e.target.value})} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-lg font-black text-slate-700 outline-none focus:border-[#0a195c] transition-colors"/>
                  )}

                  {/* TIPE 4: DROPDOWN PILIHAN */}
                  {field.type === 'dropdown' && (
                    <div className="relative">
                      <select value={customFormData[field.id] || ''} onChange={e => setCustomFormData({...customFormData, [field.id]: e.target.value})} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-[#0a195c] appearance-none cursor-pointer">
                        <option value="">-- Pilih Opsi --</option>
                        {field.options?.split(',').map((opt, i) => (
                          <option key={i} value={opt.trim()}>{opt.trim()}</option>
                        ))}
                      </select>
                      <ChevronRight size={16} className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none"/>
                    </div>
                  )}

                  {/* TIPE 5: CHECKBOX */}
                  {field.type === 'checkbox' && (
                    <label className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 cursor-pointer active:scale-[0.98] transition-transform">
                      <input type="checkbox" checked={customFormData[field.id] || false} onChange={e => setCustomFormData({...customFormData, [field.id]: e.target.checked})} className="w-6 h-6 rounded border-slate-300 text-[#0a195c] focus:ring-[#0a195c]"/>
                      <span className="text-sm font-bold text-slate-700">Ya, Tandai Selesai</span>
                    </label>
                  )}

                  {/* TIPE 6: TANGGAL & WAKTU */}
                  {field.type === 'datetime' && (
                    <input type="datetime-local" value={customFormData[field.id] || ''} onChange={e => setCustomFormData({...customFormData, [field.id]: e.target.value})} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-[#0a195c]"/>
                  )}

                  {/* TIPE 7: PELACAK GPS (SATELIT) */}
                  {field.type === 'gps' && (
                    <div className="flex flex-col gap-2">
                      <button onClick={() => {
                        if(navigator.geolocation) {
                          setCustomFormData({...customFormData, [field.id]: 'Mencari Lokasi...'});
                          navigator.geolocation.getCurrentPosition(
                            (pos) => setCustomFormData({...customFormData, [field.id]: `${pos.coords.latitude}, ${pos.coords.longitude}`}),
                            () => setCustomFormData({...customFormData, [field.id]: 'Gagal mendapat akses GPS'})
                          );
                        }
                      }} className="w-full bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform">
                        <MapPin size={18}/> Pin Titik Lokasi Saat Ini
                      </button>
                      {customFormData[field.id] && (
                        <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-600 text-center">
                          Koord: {customFormData[field.id]}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TIPE 8: MULTI-KAMERA */}
                  {field.type === 'camera' && (
                    <div className="flex flex-col items-center gap-2">
                      <input 
                        type="file" 
                        accept="image/jpeg,image/png,image/jpg" 
                        capture="environment" 
                        className="hidden" 
                        id={`cam-${field.id}`}
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if(file) {
                            const reader = new FileReader();
                            reader.onloadend = () => setCustomFormData({...customFormData, [field.id]: reader.result});
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      {!customFormData[field.id] ? (
                        <label 
                          htmlFor={`cam-${field.id}`} 
                          className="w-full py-5 border-2 border-dashed border-blue-200 bg-blue-50/50 hover:bg-blue-50 text-[#0a195c] rounded-2xl font-bold text-xs flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform cursor-pointer"
                        >
                          <Camera size={28} className="text-blue-400"/> Buka Kamera ({field.label})
                        </label>
                      ) : (
                        <div className="relative w-full aspect-[3/4] md:aspect-video rounded-2xl overflow-hidden border-4 border-slate-100 shadow-md">
                          <img src={customFormData[field.id]} alt="Preview" className="w-full h-full object-cover"/>
                          <button onClick={() => setCustomFormData({...customFormData, [field.id]: null})} className="absolute top-3 right-3 bg-rose-500/90 backdrop-blur-sm text-white p-2.5 rounded-full shadow-lg active:scale-90 transition-transform"><Trash2 size={16}/></button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TIPE 9: TANDA TANGAN DIGITAL (CANVAS) */}
                  {field.type === 'signature' && (
                    <div className="flex flex-col gap-2">
                      <div className="w-full h-40 bg-slate-50 border-2 border-slate-200 border-dashed rounded-2xl relative overflow-hidden">
                        {!customFormData[field.id] ? (
                          <>
                            <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
                              <span className="font-black text-2xl uppercase tracking-widest rotate-[-15deg]">Tanda Tangan</span>
                            </div>
                            {/* CANVAS PINTAR */}
                            <canvas 
                                className="absolute inset-0 w-full h-full touch-none cursor-crosshair"
                                onPointerDown={(e) => {
                                  const canvas = e.target; const ctx = canvas.getContext('2d');
                                  const rect = canvas.getBoundingClientRect();
                                  canvas.width = rect.width; canvas.height = rect.height; // Set resolusi tajam
                                  ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = 3; ctx.strokeStyle = '#0a195c';
                                  ctx.beginPath();
                                  ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
                                  canvas.isDrawing = true;
                                }}
                                onPointerMove={(e) => {
                                  const canvas = e.target;
                                  if (!canvas.isDrawing) return;
                                  const ctx = canvas.getContext('2d');
                                  const rect = canvas.getBoundingClientRect();
                                  ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
                                  ctx.stroke();
                                }}
                                onPointerUp={(e) => { e.target.isDrawing = false; }}
                                onPointerOut={(e) => { e.target.isDrawing = false; }}
                            ></canvas>
                          </>
                        ) : (
                          <img src={customFormData[field.id]} alt="Signature" className="w-full h-full object-contain bg-white"/>
                        )}
                      </div>
                      
                      <div className="flex gap-2 mt-1">
                        {!customFormData[field.id] ? (
                          <button onClick={(e) => {
                            // Logika untuk menyimpan canvas menjadi gambar Base64
                            const canvas = e.target.parentElement.previousSibling.querySelector('canvas');
                            if(canvas) setCustomFormData({...customFormData, [field.id]: canvas.toDataURL('image/png')});
                          }} className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 py-2.5 rounded-xl text-xs font-bold border border-indigo-200 transition-colors">Kunci TTD</button>
                        ) : (
                          <button onClick={() => setCustomFormData({...customFormData, [field.id]: null})} className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-600 py-2.5 rounded-xl text-xs font-bold border border-rose-200 transition-colors">Hapus & Ulangi TTD</button>
                        )}
                      </div>
                    </div>
                  )}

                </div>
              ))}

              <button onClick={async () => {
                // PROSES UPLOAD KE DATABASE
                const payload = {
                  client_id: currentUser.client_id,
                  employee_id: currentUser.id,
                  menu_id: activeCustomMenu.id,
                  report_data: customFormData
                };
                const { error } = await supabase.from('custom_reports').insert([payload]);
                if(!error) {
                  alert("Laporan Berhasil Disimpan ke Sistem!");
                  setActiveMenu('home');
                } else { alert("Gagal mengirim laporan: " + error.message); }
              }} className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold text-sm shadow-[0_8px_20px_rgba(16,185,129,0.3)] active:scale-95 transition-all flex items-center justify-center gap-2 mt-8">
                <CheckCircle2 size={20}/> Submit Laporan Lapangan
              </button>

            </div>
          </main>
        </div>
      </div>
    </div>
  );
}