import { useState, useEffect, useRef } from 'react';
import { 
  Camera, Menu, X, CheckSquare, Wallet, Settings, 
  Users, Bell, Search, FileText, 
  ShieldAlert, Clock, ArrowUpRight, ArrowDownRight,
  ChevronLeft, ChevronRight, UserCircle, LogOut,
  UserPlus, Database, QrCode, Download, CheckCircle2, 
  Trash2, MapPin, LayoutDashboard, Receipt, CreditCard, 
  TrendingUp, TrendingDown, Activity, BarChart3, Building, MessageSquare, Plus, Send, FolderTree, RefreshCw,
  ClipboardCheck, Check, XCircle, History, Upload, UserX, Shield, Key, Briefcase, KeyRound, CalendarClock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase'; 
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// TAMBAHKAN STRUKTUR DEFAULT PERMISSION DI BAWAH IMPORT:

const defaultRolePermissions = {
  hris: { view: false, create: false, edit: false, delete: false, export: false },
  shift: { view: false, create: false, edit: false, delete: false, export: false },
  task: { view: false, create: false, edit: false, delete: false },
  approval: { view: false, approve: false },
  laporan: { view: false, export: false },
  finance: { view: false, create: false, edit: false, delete: false, export: false },
  settings: { view: false, edit: false },
  broadcast: { view: false, create: false, delete: false },
  mobile: { absen: true, laporan: true, pengajuan: true, task: false, slip: true },
  form_builder: { view: false, create: false, edit: false, delete: false }
};

const menuModules = [
  { id: 'hris', label: 'HRIS & Database', actions: ['view', 'create', 'edit', 'delete'] },
  { id: 'shift', label: 'Manajemen Jadwal Shift', actions: ['view', 'create', 'edit', 'delete', 'export'] },
  { id: 'broadcast', label: 'Informasi & Instruksi', actions: ['view', 'create', 'delete'] },
  { id: 'mobile', label: 'Menu Aplikasi Mobile', actions: ['absen', 'laporan', 'pengajuan', 'task', 'slip'] },
  { id: 'task', label: 'Task Management', actions: ['view', 'create', 'edit', 'delete'] },
  { id: 'approval', label: 'Pusat Approval', actions: ['view', 'approve'] },
  { id: 'laporan', label: 'Laporan & Arsip', actions: ['view', 'export'] },
  { id: 'finance', label: 'Finance & Reimburse', actions: ['view', 'create', 'edit', 'delete'] },
  { id: 'form_builder', label: 'Form Builder Laporan', actions: ['view', 'create', 'edit', 'delete'] },
  { id: 'settings', label: 'Pengaturan Sistem', actions: ['view', 'edit'] }
];

export default function ClientAdmin() {

  // === PENGATURAN TOLERANSI KETERLAMBATAN ===
  const TOLERANSI_TELAT_MENIT = 10; // Admin bisa mengubah angka ini kapan saja

  // Fungsi pintar penghitung keterlambatan
  const hitungKeterlambatan = (jamAbsen, jamShift) => {
    if (!jamAbsen || !jamShift || jamShift === 'OFF') return 0;
    
    // Pecah format "08:00" menjadi jam dan menit
    const [absenJam, absenMenit] = jamAbsen.split(':').map(Number);
    const [shiftJam, shiftMenit] = jamShift.split(':').map(Number);
    
    const totalMenitAbsen = (absenJam * 60) + absenMenit;
    const totalMenitShift = (shiftJam * 60) + shiftMenit;
    
    const selisihMenit = totalMenitAbsen - totalMenitShift;
    
    // Jika selisih lebih besar dari toleransi, berarti TELAT
    if (selisihMenit > TOLERANSI_TELAT_MENIT) {
      return selisihMenit;
    }
    return 0; // Tepat waktu
  };

  const [activeMenu, setActiveMenu] = useState('hris');
  const [activeTaskLevel, setActiveTaskLevel] = useState('Level 1');
  
  const [hrisTab, setHrisTab] = useState('absensi');
  const [hrisOverviewCabang, setHrisOverviewCabang] = useState('Semua');
  const [financeTab, setFinanceTab] = useState('cashflow');

  // ==========================================
  // STATE & FUNGSI FINANCE (CASHFLOW & INVOICE)
  // ==========================================
  
  // STATE CASHFLOW
  const [cashflowPeriod, setCashflowPeriod] = useState(new Date().toISOString().substring(0, 7));
  const [isCashflowModalOpen, setIsCashflowModalOpen] = useState(false);
  const [cashflowForm, setCashflowForm] = useState({ id: null, type: 'INCOME', category: 'Operasional', amount: '', date: new Date().toISOString().split('T')[0], description: '', reference_number: '' });

  // STATE INVOICE
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({
    id: null, invoice_number: `INV-${Date.now().toString().slice(-6)}`, client_name: '', 
    date: new Date().toISOString().split('T')[0], due_date: '', 
    items: [{ desc: '', qty: 1, price: 0 }], 
    tax_rate: 11, discount: 0, status: 'UNPAID', notes: ''
  });

  // FUNGSI CRUD CASHFLOW
  const handleSaveCashflow = async (e) => {
    e.preventDefault();
    const payload = {
      client_id: currentUser.client_id,
      type: cashflowForm.type,
      category: cashflowForm.category,
      amount: Number(cashflowForm.amount),
      date: cashflowForm.date,
      description: cashflowForm.description,
      reference_number: cashflowForm.reference_number
    };

    if (cashflowForm.id) {
      const { error } = await supabase.from('cashflows').update(payload).eq('id', cashflowForm.id);
      if (!error) { alert("Data Arus Kas diperbarui!"); setIsCashflowModalOpen(false); fetchAllData(); }
      else alert("Error: " + error.message);
    } else {
      const { error } = await supabase.from('cashflows').insert([payload]);
      if (!error) { alert("Data Arus Kas berhasil dicatat!"); setIsCashflowModalOpen(false); fetchAllData(); }
      else alert("Error: " + error.message);
    }
  };

  const handleDeleteCashflow = async (id) => {
    if (!window.confirm("Hapus catatan transaksi ini secara permanen? Arus kas akan dihitung ulang.")) return;
    const { error } = await supabase.from('cashflows').delete().eq('id', id);
    if (!error) fetchAllData();
  };

  // FUNGSI LOGIKA & CRUD INVOICE
  const handleAddInvoiceItem = () => setInvoiceForm(prev => ({ ...prev, items: [...prev.items, { desc: '', qty: 1, price: 0 }] }));
  const handleRemoveInvoiceItem = (index) => setInvoiceForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
  const handleUpdateInvoiceItem = (index, field, value) => {
    const newItems = [...invoiceForm.items];
    newItems[index][field] = value;
    setInvoiceForm(prev => ({ ...prev, items: newItems }));
  };

  const handleSaveInvoice = async (e) => {
    e.preventDefault();
    if (invoiceForm.items.length === 0) return alert("Tambahkan minimal 1 item tagihan!");
    
    const subtotal = invoiceForm.items.reduce((sum, item) => sum + (Number(item.qty) * Number(item.price)), 0);
    const tax_amount = (subtotal * Number(invoiceForm.tax_rate)) / 100;
    const total = subtotal + tax_amount - Number(invoiceForm.discount);

    const payload = {
      client_id: currentUser.client_id,
      invoice_number: invoiceForm.invoice_number,
      client_name: invoiceForm.client_name,
      date: invoiceForm.date,
      due_date: invoiceForm.due_date,
      items: JSON.stringify(invoiceForm.items),
      subtotal, tax_rate: invoiceForm.tax_rate, tax_amount, discount: invoiceForm.discount, total,
      status: invoiceForm.status, notes: invoiceForm.notes
    };

    if (invoiceForm.id) {
      const { error } = await supabase.from('invoices').update(payload).eq('id', invoiceForm.id);
      if (!error) { alert("Invoice diperbarui!"); setIsInvoiceModalOpen(false); fetchAllData(); }
    } else {
      const { error } = await supabase.from('invoices').insert([payload]);
      if (!error) { alert("Invoice diterbitkan!"); setIsInvoiceModalOpen(false); fetchAllData(); }
    }
  };

  const handleUpdateInvoiceStatus = async (id, newStatus, totalAmount, clientName) => {
    if (newStatus === 'PAID') {
      if(window.confirm(`Tandai Lunas dan otomatis catat Rp ${totalAmount} ke Arus Kas Pemasukan?`)) {
         await supabase.from('cashflows').insert([{
            client_id: currentUser.client_id, type: 'INCOME', category: 'Pembayaran Invoice',
            amount: totalAmount, date: new Date().toISOString().split('T')[0],
            description: `Pembayaran Lunas untuk klien: ${clientName}`
         }]);
      }
    }
    const { error } = await supabase.from('invoices').update({ status: newStatus }).eq('id', id);
    if (!error) fetchAllData();
  };

  const [laporanTab, setLaporanTab] = useState('patroli');
  const [settingTab, setSettingTab] = useState('gps_rules');
  const [rekrutmenSubTab, setRekrutmenSubTab] = useState('PENDING');

  // STATE MANAJEMEN SHIFT
  const [shifts, setShifts] = useState([]);
  const [filterShiftBulan, setFilterShiftBulan] = useState(new Date().toISOString().substring(0, 7));
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [shiftForm, setShiftForm] = useState({ 
    id: null, 
    employee_id: '', 
    start_date: '', 
    end_date: '', 
    shift_type: 'Pagi', 
    time_in: '08:00', 
    time_out: '17:00',
    is_bko: false // Penanda apakah ini shift bantuan (BKO)
  });
  const importShiftRef = useRef(null);

  // State & Ref untuk fitur ambil foto langsung dari kamera
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // STATE UNTUK DATABASE KARYAWAN
  const [searchDbQuery, setSearchDbQuery] = useState('');
  const [filterDbJabatan, setFilterDbJabatan] = useState('Semua');
  const [filterDbDivisi, setFilterDbDivisi] = useState('Semua');
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [expandedLocations, setExpandedLocations] = useState({});
  const [massActionTarget, setMassActionTarget] = useState('');

  // STATE UNTUK PUSAT APPROVAL
  const [approvalTab, setApprovalTab] = useState('pengajuan'); 
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [reimbursements, setReimbursements] = useState([]);

  // REF UNTUK IMPORT EXCEL MASSAL
  const importEmpRef = useRef(null);
  const importCandRef = useRef(null);

  // STATE FILTER UNTUK TAB LAPORAN & APPROVAL
  const [filterCutiName, setFilterCutiName] = useState('');
  const [filterCutiStatus, setFilterCutiStatus] = useState('Semua');
  const [filterCutiDate, setFilterCutiDate] = useState('');
  
  const [filterRmName, setFilterRmName] = useState('');
  const [filterRmStatus, setFilterRmStatus] = useState('Semua');
  const [filterRmDate, setFilterRmDate] = useState('');
  
  const [filterKoreksiName, setFilterKoreksiName] = useState('');
  const [filterKoreksiStatus, setFilterKoreksiStatus] = useState('Semua');
  const [filterKoreksiDate, setFilterKoreksiDate] = useState('');

  const [isExporting, setIsExporting] = useState(false);

  // KEYWORD_PROFILE_REFI: State untuk modal Profil
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // FUNGSI: DIRECT DOWNLOAD PDF (Inject Library Otomatis)
  const handleDownloadPDF = (elementId, fileName) => {
    const element = document.getElementById(elementId);
    if (!element) return alert("Elemen dokumen tidak ditemukan!");

    const generate = () => {
      const opt = {
        margin:       [10, 10, 10, 10],
        filename:     fileName,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: false },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      // Tambahkan catch error agar tidak stuck
      window.html2pdf().set(opt).from(element).save().catch(err => {
         alert("Gagal memproses PDF: " + err.message);
      });
    };

    if (typeof window.html2pdf === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.onload = generate;
      // Beri notifikasi jika library gagal dimuat (internet/adblock)
      script.onerror = () => alert("Gagal memuat sistem PDF. Pastikan internet Anda stabil dan matikan AdBlocker sementara.");
      document.head.appendChild(script);
    } else {
      generate();
    }
  };

  const [profileForm, setProfileForm] = useState({ password: '', file: null, avatar_url: '', avatar_path: '' });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // STATE UNTUK AB
  const navigate = useNavigate();
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [selectedEmployeeAccess, setSelectedEmployeeAccess] = useState(null);
  const [editPermissions, setEditPermissions] = useState({ patroli: false, reguler: false, cuti: false, koreksi: false, reimburse: false, bebas_gps: false });
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isProfilePopupOpen, setIsProfilePopupOpen] = useState(false);
  const popupRef = useRef(null);
  const importAbsenRef = useRef(null);

  const [currentUser, setCurrentUser] = useState({ id: '', name: 'Loading...', role: '', division: '', avatar: '' });

  const [attendanceCorrections, setAttendanceCorrections] = useState([]);
  const [isMassEditMode, setIsMassEditMode] = useState(false);
  const [editableAttendances, setEditableAttendances] = useState({});

  // STATE DETAIL & EDIT KARYAWAN
  const [isEmpDetailOpen, setIsEmpDetailOpen] = useState(false);
  const [empDetailMode, setEmpDetailMode] = useState('view'); // 'view' atau 'edit'
  const [empForm, setEmpForm] = useState(null);

  // STATE KHUSUS MANAJEMEN ROLE
  const [companyRoles, setCompanyRoles] = useState([]);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [roleForm, setRoleForm] = useState({ id: null, name: '', description: '', permissions: JSON.parse(JSON.stringify(defaultRolePermissions)) });

  // STATE DATA UTAMA
  const [candidates, setCandidates] = useState([]); 
  const [employees, setEmployees] = useState([]); 
  const [cashflows, setCashflows] = useState([]);
  
  // STATE DATA ABSENSI
  const [attendances, setAttendances] = useState([]);
  const [filterNama, setFilterNama] = useState('');
  const [filterLokasi, setFilterLokasi] = useState('');
  const [filterTanggal, setFilterTanggal] = useState('');
  const [isAbsenModalOpen, setIsAbsenModalOpen] = useState(false);
  const [absenForm, setAbsenForm] = useState({ id: null, employee_id: '', date: '', check_in_time: '', check_out_time: '', location_gps: '', photo_url: '', status: 'HADIR' });

  // STATE INFORMASI & INSTRUKSI
  const [instructions, setInstructions] = useState([]);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [broadcastForm, setBroadcastForm] = useState({ broadcast_type: 'Instruksi', target_type: 'ALL', target_val: '', content: '', file: null });
  const [isSubmittingBroadcast, setIsSubmittingBroadcast] = useState(false);

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

  const [filterCustomName, setFilterCustomName] = useState('');
  const [filterCustomDate, setFilterCustomDate] = useState('');
  const [filterCustomMenu, setFilterCustomMenu] = useState('Semua');

  // 1. UPDATE useEffect (Penarikan Data Lebih Cepat)
  useEffect(() => {
    const session = localStorage.getItem('vest_user_session');
    if (!session) {
      navigate('/'); 
      return;
    }
    const parsedSession = JSON.parse(session);
    const safeName = parsedSession.name || 'User'; 
    const initials = safeName.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
    
    setCurrentUser({ 
      ...parsedSession, 
      avatar: initials, 
      avatar_url: parsedSession.avatar_url, 
      avatar_path: parsedSession.avatar_path, 
      client_id: null 
    });

    // CRITICAL: Panggil fungsi langsung menggunakan data dari session (Mencegah ID Kosong)
    fetchAllData(parsedSession.id, parsedSession.role);
  }, [navigate]);

  // 2. UPDATE fetchAllData (Menggunakan Smart Detector & Isolasi Multi-Tenant)
  const fetchAllData = async (userId, sessionRole) => {
    try {
      const targetId = userId || currentUser.id;
      if (!targetId) return;

      let myProfile = null;
      const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId);
      
      if (isValidUUID) {
        const { data } = await supabase.from('employees').select('id, client_id, role, clients(name, status, features, logo_url)').eq('id', targetId).single();
        myProfile = data;
      } else {
        const { data } = await supabase.from('employees').select('id, client_id, role, clients(name, status, features, logo_url)').eq('nik_karyawan', targetId).single();
        myProfile = data;
      }

      if (!myProfile) return; // Hentikan jika profil tidak ditemukan

      // PROTEKSI SAAS: TENDANG KELUAR JIKA PERUSAHAAN DI-SUSPEND
      if (myProfile.clients && myProfile.clients.status === 'SUSPENDED') {
         alert("Layanan SaaS untuk Perusahaan Anda sedang ditangguhkan (SUSPENDED). Akses dibekukan sementara. Silakan hubungi Provider.");
         localStorage.removeItem('vest_user_session');
         navigate('/');
         return; // Hentikan semua proses penarikan data
      }

      const myClientId = myProfile.client_id;
      const myRole = myProfile.role;
      const isSuper = myRole === 'Super Admin' || myRole === 'Developer';

      // Tambahkan ? setelah myProfile agar tidak error jika data sempat kosong
      const clientFeatures = myProfile?.clients?.features || {};
      setCurrentUser(prev => ({ ...prev, id: myProfile?.id, client_id: myClientId, role: myRole, features: clientFeatures }));
      // --- PERBAIKAN: Set Nama & Inisial Perusahaan Secara Otomatis ---
      if (myProfile?.clients?.name) {
        const companyName = myProfile.clients.name;
        const shortName = companyName
          .replace(/^(PT|CV|UD|Tbk)\.?\s+/i, '')
          .split(' ')
          .map(word => word[0])
          .join('')
          .toUpperCase()
          .substring(0, 3) || "ADM";

        setAppConfig(prev => ({
          ...prev,
          name: companyName,
          short: shortName,
          logo_url: myProfile.clients.logo_url || null // <-- BARIS INI MENYELAMATKAN LOGO SAAT REFRESH
        }));
      }

      // =================================================================
      // ALAT PENARIK DATA (WAJIB DIBUAT SEBELUM MENARIK DATA APAPUN)
      // =================================================================
      const buildQuery = (tableName, selectQuery = '*') => {
        let q = supabase.from(tableName).select(selectQuery);
        if (!isSuper && myClientId) q = q.eq('client_id', myClientId);
        return q;
      };

      const fetchUserData = async (userId, parsedSession) => {
      try {
        // PERBAIKAN: Tambahkan 'logo_url' ke dalam select relasi clients
        const { data, error } = await supabase.from('employees')
          .select('client_id, nama_lengkap, role, bidang_jasa, permissions, avatar_url, sisa_cuti, lokasi_penempatan, clients(name, status, logo_url)')
          .eq('nik_karyawan', parsedSession.nik).single(); 

        if (error) throw error;
        
        if (data) {
          if (data.clients && data.clients.status === 'SUSPENDED') {
            alert("Akses Perusahaan dibekukan oleh Pusat. Silakan hubungi HRD Anda.");
            localStorage.removeItem('vest_user_session');
            navigate('/');
            return;
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

          // --- TAMBAHAN PERBAIKAN: Set Nama & Inisial Perusahaan Secara Otomatis ---
          if (data.clients) {
            const companyName = data.clients.name || "Perusahaan";
            // Rumus otomatis membuang kata PT/CV/UD lalu mengambil huruf depan tiap kata untuk inisial
            const shortName = companyName
              .replace(/^(PT|CV|UD|Tbk)\.?\s+/i, '')
              .split(' ')
              .map(word => word[0])
              .join('')
              .toUpperCase()
              .substring(0, 3) || "KM";

            setAppConfig(prev => ({
              ...prev,
              name: companyName,
              short: shortName,
              logo_url: data.clients.logo_url || null
            }));
          }
          
        }
      } catch (err) {
        console.error("Gagal menarik data profil:", err);
      }
    };

      // =================================================================
      // PROSES PENARIKAN DATA
      // =================================================================
      const { data: empData } = await buildQuery('employees', '*, clients(name)').order('created_at', { ascending: false });
      if (empData) setEmployees(empData);

      const { data: attData } = await buildQuery('attendances', '*, employees!inner(nama_lengkap, role, nik_karyawan, bidang_jasa)').order('date', { ascending: false });
      if (attData) setAttendances(attData);

      const { data: repData } = await buildQuery('field_reports', '*, employees(nama_lengkap)').order('created_at', { ascending: false });
      if (repData) setFieldReports(repData);

      const { data: leaveData } = await buildQuery('leave_requests', '*, employees(nama_lengkap)').order('created_at', { ascending: false });
      if (leaveData) setLeaveRequests(leaveData);

      const { data: rmData } = await buildQuery('reimbursements', '*, employees(nama_lengkap)').order('created_at', { ascending: false });
      if (rmData) setReimbursements(rmData);

      const { data: acData } = await buildQuery('attendance_corrections', '*, employees(nama_lengkap)').order('created_at', { ascending: false });
      if (acData) setAttendanceCorrections(acData);

      const { data: taskData } = await buildQuery('tasks', '*, task_comments(*)').order('created_at', { ascending: false });
      if (taskData) {
        setTasks(taskData.map(t => ({
          ...t, dueDate: t.due_date, assignedTo: t.assigned_to || [], assignedBy: t.assigned_by,
          comments: (t.task_comments || []).map(c => ({ id: c.id, userId: c.user_id, text: c.text, timestamp: new Date(c.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) }))
        })));
      }

      const { data: cfData } = await buildQuery('cashflows').order('created_at', { ascending: false });
      if (cfData) setCashflows(cfData);
      
      const { data: pyData } = await buildQuery('payrolls').order('created_at', { ascending: false });
      if (pyData) setPayrolls(pyData);
      
      const { data: invData } = await buildQuery('invoices').order('created_at', { ascending: false });
      if (invData) setInvoices(invData);

      const { data: roleData } = await buildQuery('company_roles').order('name', { ascending: true });
      if (roleData) setCompanyRoles(roleData);

      const { data: cmData } = await buildQuery('custom_menus').order('created_at', { ascending: false });
      if (cmData) setCustomMenus(cmData);

      // PERBAIKAN 1: Isolasi Nama Klien agar tidak bocor ke klien/perusahaan lain
      let qClients = supabase.from('clients').select('*').order('name', { ascending: true });
      if (!isSuper && myClientId) qClients = qClients.eq('id', myClientId);
      const { data: clientDataRes } = await qClients;
      if (clientDataRes) setClientsList(clientDataRes); 
      
      const { data: locData } = await buildQuery('office_locations');
      if (locData) setOfficeLocations(locData);
      
      const { data: instData } = await buildQuery('instructions', '*, employees!sender_id(nama_lengkap, posisi_jabatan)').order('created_at', { ascending: false });
      if (instData) setInstructions(instData);

      // PERBAIKAN 2: Penarikan Data Recruitment / Pelamar dengan Isolasi Ketat
      const { data: candData } = await buildQuery('candidates').order('created_at', { ascending: false });
      if (candData) setCandidates(candData);

    } catch (error) {
      console.error("Gagal menarik data:", error);
    }
  };

 const [customMenus, setCustomMenus] = useState([]);
  
  // 👇 TAMBAHKAN KODE INI 👇
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [draggedItemIndex, setDraggedItemIndex] = useState(null);
  const [builderForm, setBuilderForm] = useState({ 
    id: null, menu_name: '', icon_name: 'FileText', fields: [] 
  });

  const handleAddBuilderField = (type) => {
    const newField = { 
      id: Date.now().toString(), 
      type: type, 
      label: type === 'camera' ? 'Foto Dokumentasi' : 'Pertanyaan Baru',
      options: '' 
    };
    setBuilderForm(prev => ({ ...prev, fields: [...prev.fields, newField] }));
  };

  const handleDragStart = (index) => setDraggedItemIndex(index);
  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = (index) => {
    if (draggedItemIndex === null) return;
    const newFields = [...builderForm.fields];
    const draggedItem = newFields[draggedItemIndex];
    newFields.splice(draggedItemIndex, 1);
    newFields.splice(index, 0, draggedItem);
    setBuilderForm({...builderForm, fields: newFields});
    setDraggedItemIndex(null);
  };

  const handleSaveCustomMenu = async (e) => {
    e.preventDefault();
    if(!builderForm.menu_name || builderForm.fields.length === 0) {
       return alert("Nama menu dan minimal 1 komponen wajib diisi!");
    }
    const payload = {
      client_id: currentUser.client_id,
      menu_name: builderForm.menu_name,
      icon_name: builderForm.icon_name,
      fields: builderForm.fields
    };

    const { error } = await supabase.from('custom_menus').insert([payload]);
    if (!error) {
      alert("Menu Custom Berhasil Dibuat!");
      setIsBuilderOpen(false);
      setBuilderForm({ id: null, menu_name: '', icon_name: 'FileText', fields: [] });
      fetchAllData(); // Refresh data setelah simpan
    } else {
      alert("Error: " + error.message);
    }
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (popupRef.current && !popupRef.current.contains(event.target)) setIsProfilePopupOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ==========================================
  // FUNGSI INFORMASI & INSTRUKSI
  // ==========================================
  const handleCreateBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastForm.content) return alert("Isi instruksi tidak boleh kosong!");
    setIsSubmittingBroadcast(true);

    try {
      let fileUrl = null;
      let filePath = null;

      if (broadcastForm.file) {
        const file = broadcastForm.file;
        const fileExt = file.name.split('.').pop();
        filePath = `${currentUser.client_id}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('instruction_files').upload(filePath, file);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('instruction_files').getPublicUrl(filePath);
        fileUrl = data.publicUrl;
      }

      const payload = {
        client_id: currentUser.client_id,
        sender_id: currentUser.id,
        broadcast_type: broadcastForm.broadcast_type,
        target_type: broadcastForm.target_type,
        target_val: broadcastForm.target_type === 'ALL' ? 'Semua' : broadcastForm.target_val,
        content: broadcastForm.content,
        attachment_url: fileUrl,
        attachment_path: filePath
      };

      const { error } = await supabase.from('instructions').insert([payload]);
      if (error) throw error;
      alert("Instruksi berhasil disebarkan!");
      setIsBroadcastModalOpen(false);
      setBroadcastForm({ target_type: 'ALL', target_val: '', content: '', file: null });
      fetchAllData();
    } catch (err) {
      alert("Gagal mengirim instruksi: " + err.message);
    } finally {
      setIsSubmittingBroadcast(false);
    }
  };

  const handleDeleteBroadcast = async (id, filePath) => {
    if (!window.confirm("Hapus instruksi ini? Lampiran file juga akan terhapus permanen dari server.")) return;
    
    // 1. Hapus File dari Storage (Jika Ada)
    if (filePath) {
      await supabase.storage.from('instruction_files').remove([filePath]);
    }
    // 2. Hapus Data dari Database
    const { error } = await supabase.from('instructions').delete().eq('id', id);
    if (!error) { alert("Instruksi terhapus!"); fetchAllData(); }
  };

  // ==========================================
  // FUNGSI IMPORT & EXPORT EXCEL MASSAL (SUPER LENGKAP)
  // ==========================================
  
  // 1. EXPORT KARYAWAN (FULL DATA)
  const exportEmployeesExcel = () => {
    const dataToExport = employees.map(e => {
      // Buka JSON personal_data
      const pd = typeof e.personal_data === 'string' ? JSON.parse(e.personal_data || '{}') : (e.personal_data || {});
      return {
        NIK_Sistem: e.nik_karyawan,
        Nama_Lengkap: e.nama_lengkap,
        Divisi: e.bidang_jasa,
        Jabatan: e.posisi_jabatan,
        Penempatan: e.lokasi_penempatan,
        Role_Aplikasi: e.role,
        Status_Pegawai: e.status_pegawai,
        Status_Kontrak: pd.status_kontrak || 'PKWT',
        NIK_KTP: pd.nik_ktp || '',
        Kewarganegaraan: pd.kewarganegaraan || '',
        Jenis_Kelamin: pd.jenis_kelamin || '',
        Tempat_Lahir: pd.tempat_lahir || '',
        Tanggal_Lahir: pd.tanggal_lahir || '',
        Agama: pd.agama || '',
        Status_Pernikahan: pd.status_pernikahan || '',
        Golongan_Darah: pd.golongan_darah || '',
        No_HP_Aktif: e.no_hp || pd.no_hp || '',
        No_Telp_Rumah: pd.no_telp || '',
        Alamat_Domisili: pd.alamat_domisili || '',
        Alamat_KTP: pd.alamat_lengkap || '',
        Tinggi_Badan_cm: pd.tinggi_badan || '',
        Berat_Badan_kg: pd.berat_badan || '',
        Ukuran_Baju: pd.ukuran_baju || '',
        Ukuran_Celana: pd.ukuran_celana || '',
        Ukuran_Sepatu: pd.ukuran_sepatu || '',
        Bertato: pd.bertato || '',
        Berkacamata: pd.berkacamata || '',
        Takut_Tinggi: pd.takut_tinggi || '',
        Patah_Tulang: pd.patah_tulang || '',
        Riwayat_Operasi: pd.riwayat_operasi || '',
        Detail_Operasi: pd.detail_operasi || '',
        Sakit_Serius: pd.sakit_serius || '',
        Detail_Sakit: pd.detail_sakit || '',
        Bahasa_Indonesia: pd.bahasa_indonesia || '',
        Bahasa_Inggris: pd.bahasa_inggris || '',
        Bisa_Berenang: pd.bisa_berenang || '',
        Bisa_Beladiri: pd.bisa_beladiri || '',
        Detail_Beladiri: pd.detail_beladiri || '',
        Keterampilan_Lain: pd.keterampilan_lain || '',
        Kontak_Darurat_Nama: pd.kontak_darurat_nama || '',
        Kontak_Darurat_Hub: pd.kontak_darurat_hub || '',
        Kontak_Darurat_Telp: pd.kontak_darurat_telp || '',
        Riwayat_Kerja_Lalu: pd.riwayat_kerja || '',
        Gaji_Terakhir: pd.gaji_terakhir || '',
        Alasan_Keluar: pd.alasan_keluar || '',
        Gaji_Diharapkan: pd.gaji_diharapkan || ''
      };
    });
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Database Karyawan LENGKAP");
    XLSX.writeFile(wb, `Backup_Karyawan_${new Date().getTime()}.xlsx`);
  };

  // 2. IMPORT KARYAWAN (SMART UPDATE DENGAN DATA PENUH)
  const handleImportEmployeesExcel = (e) => {
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws);

      if(!window.confirm(`Sistem akan mengupdate ${data.length} baris data (semua parameter). Lanjutkan?`)) return;

      let success = 0, errors = 0;
      for(let row of data) {
         if(!row.NIK_Sistem || !row.Nama_Lengkap) continue;
         const existing = employees.find(emp => emp.nik_karyawan === String(row.NIK_Sistem));
         
         const payload = {
            client_id: currentUser.client_id,
            nik_karyawan: String(row.NIK_Sistem),
            nama_lengkap: row.Nama_Lengkap,
            bidang_jasa: row.Divisi || '',
            posisi_jabatan: row.Jabatan || '',
            lokasi_penempatan: row.Penempatan || 'Belum Ditentukan',
            role: row.Role_Aplikasi || 'Staff Lapangan',
            status_pegawai: row.Status_Pegawai || 'AKTIF',
            no_hp: String(row.No_HP_Aktif || ''),
            personal_data: {
                status_kontrak: row.Status_Kontrak, nik_ktp: row.NIK_KTP, kewarganegaraan: row.Kewarganegaraan,
                jenis_kelamin: row.Jenis_Kelamin, tempat_lahir: row.Tempat_Lahir, tanggal_lahir: row.Tanggal_Lahir,
                agama: row.Agama, status_pernikahan: row.Status_Pernikahan, golongan_darah: row.Golongan_Darah,
                no_hp: String(row.No_HP_Aktif || ''), no_telp: String(row.No_Telp_Rumah || ''),
                alamat_domisili: row.Alamat_Domisili, alamat_lengkap: row.Alamat_KTP,
                tinggi_badan: row.Tinggi_Badan_cm, berat_badan: row.Berat_Badan_kg, ukuran_baju: row.Ukuran_Baju,
                ukuran_celana: row.Ukuran_Celana, ukuran_sepatu: row.Ukuran_Sepatu, bertato: row.Bertato,
                berkacamata: row.Berkacamata, takut_tinggi: row.Takut_Tinggi, patah_tulang: row.Patah_Tulang,
                riwayat_operasi: row.Riwayat_Operasi, detail_operasi: row.Detail_Operasi, sakit_serius: row.Sakit_Serius,
                detail_sakit: row.Detail_Sakit, bahasa_indonesia: row.Bahasa_Indonesia, bahasa_inggris: row.Bahasa_Inggris,
                bisa_berenang: row.Bisa_Berenang, bisa_beladiri: row.Bisa_Beladiri, detail_beladiri: row.Detail_Beladiri,
                keterampilan_lain: row.Keterampilan_Lain, kontak_darurat_nama: row.Kontak_Darurat_Nama,
                kontak_darurat_hub: row.Kontak_Darurat_Hub, kontak_darurat_telp: row.Kontak_Darurat_Telp,
                riwayat_kerja: row.Riwayat_Kerja_Lalu, gaji_terakhir: row.Gaji_Terakhir, alasan_keluar: row.Alasan_Keluar,
                gaji_diharapkan: row.Gaji_Diharapkan
            }
         };

         if(existing) {
            // Amankan attachment URL lama agar tidak terhapus
            const existingPD = typeof existing.personal_data === 'string' ? JSON.parse(existing.personal_data||'{}') : (existing.personal_data||{});
            payload.personal_data = { ...existingPD, ...payload.personal_data };
            const {error} = await supabase.from('employees').update(payload).eq('id', existing.id);
            if(!error) success++; else errors++;
         } else {
            payload.password = 'password123';
            payload.has_mobile_access = true;
            payload.has_task_access = true;
            const {error} = await supabase.from('employees').insert([payload]);
            if(!error) success++; else errors++;
         }
      }
      alert(`Sinkronisasi Excel Selesai!\n✅ Berhasil: ${success}\n❌ Gagal: ${errors}`);
      fetchAllData();
      if(importEmpRef.current) importEmpRef.current.value = '';
    };
    reader.readAsBinaryString(file);
  };

  // 3. EXPORT PELAMAR (REKRUTMEN) FULL DATA
  const exportCandidatesExcel = () => {
    const dataToExport = candidates.map(c => {
      const pd = typeof c.personal_data === 'string' ? JSON.parse(c.personal_data || '{}') : (c.personal_data || {});
      return {
        Tanggal_Lamar: new Date(c.created_at).toLocaleDateString('id-ID'),
        Status_Pelamar: c.status,
        NIK_KTP: c.nik_karyawan,
        Nama_Pelamar: c.nama_lengkap,
        Divisi_Dilamar: c.bidang_jasa,
        Posisi_Dilamar: c.posisi_jabatan,
        Kewarganegaraan: pd.kewarganegaraan || '',
        Jenis_Kelamin: pd.jenis_kelamin || '',
        Tempat_Lahir: pd.tempat_lahir || '',
        Tanggal_Lahir: pd.tanggal_lahir || '',
        Agama: pd.agama || '',
        Status_Pernikahan: pd.status_pernikahan || '',
        Golongan_Darah: pd.golongan_darah || '',
        No_HP_Aktif: c.no_hp || pd.no_hp || '',
        No_Telp_Rumah: pd.no_telp || '',
        Alamat_Domisili: pd.alamat_domisili || '',
        Alamat_KTP: pd.alamat_lengkap || '',
        Tinggi_Badan_cm: pd.tinggi_badan || '',
        Berat_Badan_kg: pd.berat_badan || '',
        Ukuran_Baju: pd.ukuran_baju || '',
        Ukuran_Celana: pd.ukuran_celana || '',
        Ukuran_Sepatu: pd.ukuran_sepatu || '',
        Bertato: pd.bertato || '',
        Berkacamata: pd.berkacamata || '',
        Takut_Tinggi: pd.takut_tinggi || '',
        Patah_Tulang: pd.patah_tulang || '',
        Riwayat_Operasi: pd.riwayat_operasi || '',
        Detail_Operasi: pd.detail_operasi || '',
        Sakit_Serius: pd.sakit_serius || '',
        Detail_Sakit: pd.detail_sakit || '',
        Bahasa_Indonesia: pd.bahasa_indonesia || '',
        Bahasa_Inggris: pd.bahasa_inggris || '',
        Bisa_Berenang: pd.bisa_berenang || '',
        Bisa_Beladiri: pd.bisa_beladiri || '',
        Detail_Beladiri: pd.detail_beladiri || '',
        Keterampilan_Lain: pd.keterampilan_lain || '',
        Kontak_Darurat_Nama: pd.kontak_darurat_nama || '',
        Kontak_Darurat_Hub: pd.kontak_darurat_hub || '',
        Kontak_Darurat_Telp: pd.kontak_darurat_telp || '',
        Riwayat_Kerja_Lalu: pd.riwayat_kerja || '',
        Gaji_Terakhir: pd.gaji_terakhir || '',
        Alasan_Keluar: pd.alasan_keluar || '',
        Gaji_Diharapkan: pd.gaji_diharapkan || ''
      };
    });
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Pelamar Lengkap");
    XLSX.writeFile(wb, `Data_Pelamar_${new Date().getTime()}.xlsx`);
  };

  // 4. IMPORT PELAMAR MASSAL (SUPER LENGKAP)
  const handleImportCandidatesExcel = (e) => {
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws);
      
      if(!window.confirm(`Proses ${data.length} pelamar offline beserta seluruh data riwayat hidupnya?`)) return;
      
      let success = 0, errors = 0;
      for(let row of data) {
         if(!row.NIK_KTP || !row.Nama_Pelamar) continue;
         
         const payload = {
            client_id: currentUser.client_id, 
            nik_karyawan: String(row.NIK_KTP), 
            nama_lengkap: row.Nama_Pelamar,
            bidang_jasa: row.Divisi_Dilamar || '', 
            posisi_jabatan: row.Posisi_Dilamar || '',
            no_hp: String(row.No_HP_Aktif || ''), 
            status: row.Status_Pelamar || 'PENDING',
            personal_data: {
                nik_ktp: row.NIK_KTP, kewarganegaraan: row.Kewarganegaraan, jenis_kelamin: row.Jenis_Kelamin, 
                tempat_lahir: row.Tempat_Lahir, tanggal_lahir: row.Tanggal_Lahir, agama: row.Agama, 
                status_pernikahan: row.Status_Pernikahan, golongan_darah: row.Golongan_Darah,
                no_hp: String(row.No_HP_Aktif || ''), no_telp: String(row.No_Telp_Rumah || ''),
                alamat_domisili: row.Alamat_Domisili, alamat_lengkap: row.Alamat_KTP,
                tinggi_badan: row.Tinggi_Badan_cm, berat_badan: row.Berat_Badan_kg, ukuran_baju: row.Ukuran_Baju,
                ukuran_celana: row.Ukuran_Celana, ukuran_sepatu: row.Ukuran_Sepatu, bertato: row.Bertato,
                berkacamata: row.Berkacamata, takut_tinggi: row.Takut_Tinggi, patah_tulang: row.Patah_Tulang,
                riwayat_operasi: row.Riwayat_Operasi, detail_operasi: row.Detail_Operasi, sakit_serius: row.Sakit_Serius,
                detail_sakit: row.Detail_Sakit, bahasa_indonesia: row.Bahasa_Indonesia, bahasa_inggris: row.Bahasa_Inggris,
                bisa_berenang: row.Bisa_Berenang, bisa_beladiri: row.Bisa_Beladiri, detail_beladiri: row.Detail_Beladiri,
                keterampilan_lain: row.Keterampilan_Lain, kontak_darurat_nama: row.Kontak_Darurat_Nama,
                kontak_darurat_hub: row.Kontak_Darurat_Hub, kontak_darurat_telp: row.Kontak_Darurat_Telp,
                riwayat_kerja: row.Riwayat_Kerja_Lalu, gaji_terakhir: row.Gaji_Terakhir, alasan_keluar: row.Alasan_Keluar,
                gaji_diharapkan: row.Gaji_Diharapkan
            }
         };
         
         const {error} = await supabase.from('candidates').insert([payload]);
         if(!error) success++; else errors++;
      }
      alert(`Selesai!\n✅ Berhasil Masuk: ${success}\n❌ Gagal/Duplikat NIK: ${errors}`);
      fetchAllData();
      if(importCandRef.current) importCandRef.current.value = '';
    };
    reader.readAsBinaryString(file);
  };

  // ==========================================
  // FUNGSI EXCEL MANAJEMEN SHIFT
  // ==========================================
  const downloadTemplateShift = () => {
    const templateData = [
      { "NIK_KARYAWAN": "DEV-000", "TANGGAL(YYYY-MM-DD)": "2026-07-15", "TIPE_SHIFT": "Pagi", "JAM_MASUK(HH:MM)": "08:00", "JAM_KELUAR(HH:MM)": "17:00" },
      { "NIK_KARYAWAN": "DEV-000", "TANGGAL(YYYY-MM-DD)": "2026-07-16", "TIPE_SHIFT": "Malam", "JAM_MASUK(HH:MM)": "22:00", "JAM_KELUAR(HH:MM)": "07:00" },
      { "NIK_KARYAWAN": "ADM-001", "TANGGAL(YYYY-MM-DD)": "2026-07-15", "TIPE_SHIFT": "Libur", "JAM_MASUK(HH:MM)": "OFF", "JAM_KELUAR(HH:MM)": "OFF" }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template Jadwal Shift");
    XLSX.writeFile(wb, "Template_Massal_Shift.xlsx");
  };

  const handleSaveShift = async (e) => {
    e.preventDefault();
    if(!shiftForm.employee_id || !shiftForm.start_date) return alert("Pilih pegawai dan tanggal mulai!");

    // Konversi string tanggal ke format yang aman dari zona waktu
    const startParts = shiftForm.start_date.split('-');
    let currentDate = new Date(startParts[0], startParts[1] - 1, startParts[2]);
    
    const endParts = shiftForm.end_date ? shiftForm.end_date.split('-') : startParts;
    let endDate = new Date(endParts[0], endParts[1] - 1, endParts[2]);

    if (endDate < currentDate) return alert("Tanggal Selesai tidak boleh lebih kecil dari Tanggal Mulai!");

    const payloads = [];
    
    // Looping dari tanggal mulai sampai tanggal selesai
    while (currentDate <= endDate) {
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;

      // Sisipkan "(BKO)" pada Tipe Shift jika dicentang
      const finalShiftType = shiftForm.is_bko ? `${shiftForm.shift_type} (BKO)` : shiftForm.shift_type;

      payloads.push({
        id: shiftForm.id ? shiftForm.id : undefined, // Bawa ID jika sedang mode EDIT 1 hari
        client_id: currentUser.client_id,
        employee_id: shiftForm.employee_id,
        date: dateString,
        shift_type: finalShiftType,
        time_in: shiftForm.time_in ? shiftForm.time_in + (shiftForm.time_in.length === 5 ? ':00' : '') : null,
        time_out: shiftForm.time_out ? shiftForm.time_out + (shiftForm.time_out.length === 5 ? ':00' : '') : null
      });

      // Tambah 1 hari
      currentDate.setDate(currentDate.getDate() + 1);
    }

    if (shiftForm.id && payloads.length === 1) {
      // MODE EDIT (Update 1 Data Saja)
      const { error } = await supabase.from('employee_shifts').update(payloads[0]).eq('id', shiftForm.id);
      if (!error) { alert('Jadwal diperbarui!'); setIsShiftModalOpen(false); fetchAllData(); }
      else alert('Gagal update: ' + error.message);
    } else {
      // MODE CREATE MASSAL (Bisa 1 hari atau banyak hari)
      const insertPayloads = payloads.map(p => { const {id, ...rest} = p; return rest; }); // Buang undefined id
      const { error } = await supabase.from('employee_shifts').upsert(insertPayloads, { onConflict: 'employee_id, date' });
      if (!error) { alert(`Berhasil menyimpan ${insertPayloads.length} jadwal!`); setIsShiftModalOpen(false); fetchAllData(); }
      else alert('Gagal menambah jadwal: ' + error.message);
    }
  };

  const handleImportShift = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const bstr = event.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws, { defval: "", raw: false });

      if (data.length === 0) return alert("Data kosong.");
      if (!window.confirm(`Proses sinkronisasi ${data.length} jadwal shift? (Sistem otomatis mendeteksi shift baru / update shift lama)`)) return;

      let successCount = 0; let errorCount = 0;
      const { data: empData } = await supabase.from('employees').select('id, nik_karyawan').eq('client_id', currentUser.client_id);
      
      for (const row of data) {
        const nik = String(row["NIK_KARYAWAN"]).trim();
        const date = String(row["TANGGAL(YYYY-MM-DD)"]).trim();
        const type = String(row["TIPE_SHIFT"]).trim();
        let timeIn = String(row["JAM_MASUK(HH:MM)"]).trim();
        let timeOut = String(row["JAM_KELUAR(HH:MM)"]).trim();

        timeIn = timeIn && timeIn !== "OFF" ? (timeIn.length <= 5 ? `${timeIn}:00` : timeIn) : null;
        timeOut = timeOut && timeOut !== "OFF" ? (timeOut.length <= 5 ? `${timeOut}:00` : timeOut) : null;

        const employee = empData?.find(emp => emp.nik_karyawan === nik);
        if (employee && date) {
          const payload = {
            client_id: currentUser.client_id, employee_id: employee.id, date: date, shift_type: type, time_in: timeIn, time_out: timeOut
          };
          const { error } = await supabase.from('employee_shifts').upsert([payload], { onConflict: 'employee_id, date' });
          if (!error) successCount++; else errorCount++;
        } else {
          errorCount++;
        }
      }
      alert(`Import Shift Selesai!\n✅ Berhasil: ${successCount}\n❌ Dilewati (NIK Salah): ${errorCount}`);
      fetchAllData();
      if(importShiftRef.current) importShiftRef.current.value = ''; 
    };
    reader.readAsBinaryString(file);
  };

  const exportShiftExcel = () => {
    const filtered = shifts.filter(s => s.date.startsWith(filterShiftBulan));
    if (filtered.length === 0) return alert("Data jadwal kosong di bulan ini.");
    const dataToExport = filtered.map(s => ({
      NIK: s.employees?.nik_karyawan,
      Nama_Pegawai: s.employees?.nama_lengkap,
      Tanggal: s.date,
      Tipe_Shift: s.shift_type,
      Jam_Masuk: s.time_in ? s.time_in.substring(0,5) : 'OFF',
      Jam_Keluar: s.time_out ? s.time_out.substring(0,5) : 'OFF'
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Jadwal Shift");
    XLSX.writeFile(wb, `Jadwal_Shift_${filterShiftBulan}.xlsx`);
  };

  // 2. EXPORT LAPORAN LAPANGAN (EXCELJS - WITH REAL IMAGES & KOORDINAT)
  const exportLaporanExcel = async () => {
    const filteredReports = fieldReports.filter(r => {
      const matchType = filterReportType === 'Semua' || r.report_type === filterReportType;
      const matchName = (r.employees?.nama_lengkap || '').toLowerCase().includes(filterReportName.toLowerCase());
      const matchDate = filterReportDate === '' || (r.created_at || '').startsWith(filterReportDate);
      return (r.report_type === 'patroli' || r.report_type === 'reguler') && matchType && matchName && matchDate;
    });

    if (filteredReports.length === 0) return alert("Tidak ada data laporan untuk diekspor.");

    setIsExporting(true);

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Laporan Lapangan');

      worksheet.columns = [
        { header: 'Waktu Laporan', key: 'time', width: 20 },
        { header: 'Nama Pelapor', key: 'name', width: 25 },
        { header: 'Tipe', key: 'type', width: 15 },
        { header: 'Nama Lokasi (Geo-Fence)', key: 'locName', width: 30 },
        { header: 'Koordinat (Lat, Lng)', key: 'coord', width: 25 },
        { header: 'Judul Laporan', key: 'title', width: 30 },
        { header: 'Keterangan / Catatan', key: 'notes', width: 50 },
        { header: 'Foto 1', key: 'photo1', width: 15 },
        { header: 'Foto 2', key: 'photo2', width: 15 },
        { header: 'Foto 3', key: 'photo3', width: 15 }
      ];

      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

      for (let i = 0; i < filteredReports.length; i++) {
         const r = filteredReports[i];
         
         let notesText = r.description;
         let photosArr = [];
         
         if (r.photo_url) photosArr.push(r.photo_url);

         try {
           const parsed = JSON.parse(r.description);
           if (parsed.notes) notesText = parsed.notes;
           if (parsed.photos && Array.isArray(parsed.photos)) {
              photosArr = parsed.photos.map(p => p.url);
           }
         } catch (e) {}

         const locName = r.location_name || r.location_gps || 'Luar Area / Bebas'; 
         const coord = (r.latitude && r.longitude) ? `${r.latitude}, ${r.longitude}` : 'Tidak Tercatat';

         const row = worksheet.addRow({
           time: new Date(r.created_at).toLocaleString('id-ID'),
           name: r.employees?.nama_lengkap || 'Unknown',
           type: r.report_type.toUpperCase(),
           locName: locName,
           coord: coord,
           title: r.title,
           notes: notesText
         });

         row.height = 80; 
         row.alignment = { vertical: 'middle', wrapText: true };

         for(let p = 0; p < Math.min(photosArr.length, 3); p++) {
           const imgUrl = photosArr[p];
           if(imgUrl) {
             const base64Img = await getCompressedBase64Image(imgUrl);
             if(base64Img) {
               const imageId = workbook.addImage({ base64: base64Img, extension: 'jpeg' });
               worksheet.addImage(imageId, {
                  tl: { col: 7 + p, row: row.number - 1 },
                  ext: { width: 70, height: 70 },
                  editAs: 'oneCell'
               });
             }
           }
         }
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `Laporan_${filterReportType === 'Semua' ? 'Patroli_Reguler' : filterReportType}_${new Date().getTime()}.xlsx`);
      
    } catch (err) {
      alert("Terjadi kesalahan saat mengekspor laporan: " + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  // EXPORT LAPORAN CUSTOM (DINAMIS)
  const exportCustomLaporanExcel = async () => {
    const filteredReports = fieldReports.filter(r => {
      const isCustom = r.report_type !== 'patroli' && r.report_type !== 'reguler';
      const matchName = (r.employees?.nama_lengkap || '').toLowerCase().includes(filterCustomName.toLowerCase());
      const matchDate = filterCustomDate === '' || (r.created_at || '').startsWith(filterCustomDate);
      const matchMenu = filterCustomMenu === 'Semua' || r.report_type === filterCustomMenu;
      return isCustom && matchName && matchDate && matchMenu;
    });

    if (filteredReports.length === 0) return alert("Tidak ada data laporan custom untuk diekspor.");

    setIsExporting(true);

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Laporan Custom');

      worksheet.columns = [
        { header: 'Waktu Laporan', key: 'time', width: 20 },
        { header: 'Nama Pelapor', key: 'name', width: 25 },
        { header: 'Menu Custom', key: 'type', width: 25 },
        { header: 'Lokasi (Geo-Fence)', key: 'locName', width: 30 },
        { header: 'Koordinat', key: 'coord', width: 25 },
        { header: 'Judul Laporan', key: 'title', width: 30 },
        { header: 'Isi Data Form', key: 'notes', width: 60 },
        { header: 'Foto 1', key: 'photo1', width: 15 },
        { header: 'Foto 2', key: 'photo2', width: 15 }
      ];

      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

      for (let i = 0; i < filteredReports.length; i++) {
         const r = filteredReports[i];
         let notesText = r.description;
         let photosArr = [];
         
         if (r.photo_url) photosArr.push(r.photo_url);

         try {
           const parsed = JSON.parse(r.description);
           if (parsed.notes) notesText = parsed.notes;
           if (parsed.photos && Array.isArray(parsed.photos)) photosArr = parsed.photos.map(p => p.url);
         } catch (e) {}

         const locName = r.location_name || r.location_gps || 'Luar Area / Bebas'; 
         const coord = (r.latitude && r.longitude) ? `${r.latitude}, ${r.longitude}` : 'Tidak Tercatat';

         const row = worksheet.addRow({
           time: new Date(r.created_at).toLocaleString('id-ID'),
           name: r.employees?.nama_lengkap || 'Unknown',
           type: r.report_type.toUpperCase(),
           locName: locName,
           coord: coord,
           title: r.title,
           notes: notesText
         });

         row.height = 80; 
         row.alignment = { vertical: 'middle', wrapText: true };

         for(let p = 0; p < Math.min(photosArr.length, 2); p++) {
           const imgUrl = photosArr[p];
           if(imgUrl) {
             const base64Img = await getCompressedBase64Image(imgUrl);
             if(base64Img) {
               const imageId = workbook.addImage({ base64: base64Img, extension: 'jpeg' });
               worksheet.addImage(imageId, {
                  tl: { col: 6 + p, row: row.number - 1 },
                  ext: { width: 70, height: 70 },
                  editAs: 'oneCell'
               });
             }
           }
         }
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `Laporan_Custom_${filterCustomMenu === 'Semua' ? 'All' : filterCustomMenu}_${new Date().getTime()}.xlsx`);
      
    } catch (err) {
      alert("Terjadi kesalahan saat mengekspor laporan: " + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  // 3. EXPORT CUTI & IZIN
  const exportCutiExcel = () => {
    const filtered = leaveRequests.filter(r => {
      const matchName = (r.employees?.nama_lengkap || '').toLowerCase().includes(filterCutiName.toLowerCase());
      const matchStatus = filterCutiStatus === 'Semua' || r.status === filterCutiStatus;
      const matchDate = filterCutiDate === '' || r.created_at.startsWith(filterCutiDate);
      return matchName && matchStatus && matchDate;
    });
    if (filtered.length === 0) return alert("Data kosong.");
    const dataToExport = filtered.map(r => ({
      Tgl_Pengajuan: new Date(r.created_at).toLocaleDateString('id-ID'),
      Nama_Pegawai: r.employees?.nama_lengkap || 'Unknown',
      Jenis_Izin: r.request_type,
      Kategori: r.category,
      Tgl_Mulai: r.start_date,
      Tgl_Selesai: r.end_date,
      Alasan: r.reason,
      Status: r.status,
      Catatan_HRD: r.admin_note || '-',
      Link_Surat_Dokumen: r.attachment_url || '-'
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rekap Cuti Izin");
    XLSX.writeFile(wb, `Rekap_Cuti_Izin_${new Date().getTime()}.xlsx`);
  };

  // 4. EXPORT REIMBURSEMENT
  const exportReimburseExcel = () => {
    const filtered = reimbursements.filter(r => {
      const matchName = (r.employees?.nama_lengkap || '').toLowerCase().includes(filterRmName.toLowerCase());
      const matchStatus = filterRmStatus === 'Semua' || r.status === filterRmStatus;
      const matchDate = filterRmDate === '' || r.created_at.startsWith(filterRmDate);
      return matchName && matchStatus && matchDate;
    });
    if (filtered.length === 0) return alert("Data kosong.");
    const dataToExport = filtered.map(r => ({
      Tgl_Pengajuan: new Date(r.created_at).toLocaleDateString('id-ID'),
      Nama_Pegawai: r.employees?.nama_lengkap || 'Unknown',
      Kategori_Biaya: r.category,
      Nominal: r.amount,
      Keterangan: r.description,
      Status_Pencairan: r.status,
      Catatan_Finance: r.admin_note || '-',
      Link_Foto_Struk: r.receipt_url || '-'
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rekap Reimburse");
    XLSX.writeFile(wb, `Rekap_Reimburse_${new Date().getTime()}.xlsx`);
  };

  // 5. EXPORT KOREKSI ABSEN
  const exportKoreksiExcel = () => {
    const filtered = attendanceCorrections.filter(r => {
      const matchName = (r.employees?.nama_lengkap || '').toLowerCase().includes(filterKoreksiName.toLowerCase());
      const matchStatus = filterKoreksiStatus === 'Semua' || r.status === filterKoreksiStatus;
      const matchDate = filterKoreksiDate === '' || r.created_at.startsWith(filterKoreksiDate) || r.date === filterKoreksiDate;
      return matchName && matchStatus && matchDate;
    });
    if (filtered.length === 0) return alert("Data kosong.");
    const dataToExport = filtered.map(r => ({
      Tgl_Pengajuan: new Date(r.created_at).toLocaleDateString('id-ID'),
      Nama_Pegawai: r.employees?.nama_lengkap || 'Unknown',
      Tgl_Absen_Dikomplain: r.date,
      Tipe_Koreksi: r.correction_type,
      Usulan_Jam_Masuk: r.time_in || '-',
      Usulan_Jam_Keluar: r.time_out || '-',
      Alasan_Koreksi: r.reason,
      Status_Persetujuan: r.status,
      Catatan_HRD: r.admin_note || '-'
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rekap Koreksi Absen");
    XLSX.writeFile(wb, `Rekap_Koreksi_Absen_${new Date().getTime()}.xlsx`);
  };

  // ==========================================
  // FUNGSI PENGECIL FOTO (AUTO-COMPRESS)
  // ==========================================
  const getCompressedBase64Image = async (imageUrl) => {
    if (!imageUrl || !imageUrl.startsWith('http')) return null;
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
           const img = new Image();
           img.crossOrigin = 'Anonymous'; 
           img.onload = () => {
             const canvas = document.createElement('canvas');
             const MAX_SIZE = 60;
             const scale = Math.min(MAX_SIZE / img.width, MAX_SIZE / img.height);
             canvas.width = img.width * scale;
             canvas.height = img.height * scale;
             
             const ctx = canvas.getContext('2d');
             ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
             resolve(canvas.toDataURL('image/jpeg', 0.5)); 
           };
           img.onerror = () => resolve(null); 
           img.src = reader.result;
        };
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      return null;
    }
  };

  // ==========================================
  // 1. EXPORT ABSENSI (EXCELJS - WITH REAL IMAGES)
  // ==========================================
  const exportAbsensiExcel = async () => {
    const filteredData = attendances.filter(a => {
      const matchNama = (a.employees?.nama_lengkap || '').toLowerCase().includes(filterNama.toLowerCase());
      const matchLokasi = (a.location_gps || '').toLowerCase().includes(filterLokasi.toLowerCase());
      const matchTanggal = filterTanggal === '' || a.date === filterTanggal;
      return matchNama && matchLokasi && matchTanggal;
    });

    if (filteredData.length === 0) return alert("Tidak ada data absensi untuk diekspor.");

    setIsExporting(true);

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Laporan Absensi');

      worksheet.columns = [
        { header: 'Tanggal', key: 'date', width: 15 },
        { header: 'Nama Pegawai', key: 'name', width: 25 },
        { header: 'Divisi', key: 'div', width: 20 },
        { header: 'Lokasi', key: 'loc', width: 30 },
        { header: 'Jam Masuk', key: 'in', width: 12 },
        { header: 'Jam Keluar', key: 'out', width: 12 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Foto IN', key: 'photoIn', width: 12 }, 
        { header: 'Foto OUT', key: 'photoOut', width: 12 } 
      ];

      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

      for (let i = 0; i < filteredData.length; i++) {
         const a = filteredData[i];
         const row = worksheet.addRow({
           date: a.date,
           name: a.employees?.nama_lengkap || 'Unknown',
           div: a.employees?.bidang_jasa || '-',
           loc: a.location_gps,
           in: a.check_in_time || '-',
           out: a.check_out_time || '-',
           status: a.status
         });
         
         row.height = 50; 
         row.alignment = { vertical: 'middle' };
         
         if (a.photo_url) {
            const base64In = await getCompressedBase64Image(a.photo_url);
            if (base64In) {
               const imageIdIn = workbook.addImage({ base64: base64In, extension: 'jpeg' });
               worksheet.addImage(imageIdIn, { tl: { col: 7, row: row.number - 1 }, ext: { width: 45, height: 45 }, editAs: 'oneCell' });
            }
         }
         
         if (a.photo_out_url) {
            const base64Out = await getCompressedBase64Image(a.photo_out_url);
            if (base64Out) {
               const imageIdOut = workbook.addImage({ base64: base64Out, extension: 'jpeg' });
               worksheet.addImage(imageIdOut, { tl: { col: 8, row: row.number - 1 }, ext: { width: 45, height: 45 }, editAs: 'oneCell' });
            }
         }
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `Laporan_Absen_${filterLokasi || 'Semua_Cabang'}_${new Date().getTime()}.xlsx`);
      
    } catch (err) {
      alert("Terjadi kesalahan saat memproses gambar: " + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  // ==========================================
  // FUNGSI PAYROLL (SMART ENTERPRISE) - EXCEL & MANUAL
  // ==========================================
  
  const [payrollPeriod, setPayrollPeriod] = useState(new Date().toISOString().substring(0, 7)); 
  const importPayrollRef = useRef(null);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [isPayrollModalOpen, setIsPayrollModalOpen] = useState(false);
  const [payrollForm, setPayrollForm] = useState({ employee_id: '', basic_salary: 0, additions: [], deductions: [] });
  
  // TARIF POTONGAN (GLOBAL) - Diatur di halaman depan untuk Excel & Manual
  const [penaltyRates, setPenaltyRates] = useState({ latePerMinute: 0, absencePerDay: 0 });

  // 1. PENGHITUNG CERDAS (Absensi & Telat)
  const calculateWorkStats = (employeeId, periodYYYYMM) => {
    const empAtts = attendances.filter(a => a.employee_id === employeeId && a.date.startsWith(periodYYYYMM) && a.check_in_time);
    const empShifts = shifts.filter(s => s.employee_id === employeeId && s.date.startsWith(periodYYYYMM) && s.shift_type !== 'Libur');

    let totalHours = 0;
    let totalLateMinutes = 0;

    empAtts.forEach(a => {
      const shift = empShifts.find(s => s.date === a.date);
      if (shift && shift.time_in && a.check_in_time) {
        const [sH, sM] = shift.time_in.split(':').map(Number);
        const [aH, aM] = a.check_in_time.split(':').map(Number);
        let lateMins = ((aH * 60) + aM) - ((sH * 60) + sM);
        if (lateMins > 10) totalLateMinutes += lateMins; 
      }
      if (a.check_in_time && a.check_out_time) {
        const [inH, inM] = a.check_in_time.split(':').map(Number);
        const [outH, outM] = a.check_out_time.split(':').map(Number);
        let daily = (outH + outM / 60) - (inH + inM / 60);
        if (daily > 4) daily -= 1; 
        if (daily > 0) totalHours += daily;
      }
    });

    const targetHariKerja = empShifts.length > 0 ? empShifts.length : 22; 
    const totalMangkir = Math.max(0, targetHariKerja - empAtts.length);
    return { totalDays: empAtts.length, totalHours: Math.round(totalHours), totalLateMinutes, totalMangkir, targetHariKerja };
  };

  const calculatePPh21 = (brutoBulanan, statusPTKP) => {
    // Sistem PPh 21 Enterprise (Simulasi Standar PKP / UU HPP)
    let ptkp = 54000000; // Default TK/0 (Tidak Kawin, 0 Tanggungan)
    if (statusPTKP) {
      const ptkpMap = {
        'TK/0': 54000000, 'TK/1': 58500000, 'TK/2': 63000000, 'TK/3': 67500000,
        'K/0': 58500000, 'K/1': 63000000, 'K/2': 67500000, 'K/3': 72000000
      };
      ptkp = ptkpMap[statusPTKP.toUpperCase()] || 54000000;
    }

    const brutoTahunan = brutoBulanan * 12;
    // Biaya jabatan 5% dari bruto (Maksimal 6jt/tahun atau 500rb/bulan)
    const biayaJabatanTahunan = Math.min(brutoTahunan * 0.05, 6000000); 
    const penghasilanNettoTahunan = brutoTahunan - biayaJabatanTahunan;
    const pkp = Math.max(0, penghasilanNettoTahunan - ptkp);

    if (pkp <= 0) return 0; // Tidak kena pajak jika di bawah PTKP

    // Tarif Progresif
    let pph21Tahunan = 0;
    let sisaPkp = pkp;

    if (sisaPkp > 0) { const lap1 = Math.min(sisaPkp, 60000000); pph21Tahunan += lap1 * 0.05; sisaPkp -= lap1; }
    if (sisaPkp > 0) { const lap2 = Math.min(sisaPkp, 190000000); pph21Tahunan += lap2 * 0.15; sisaPkp -= lap2; }
    if (sisaPkp > 0) { const lap3 = Math.min(sisaPkp, 250000000); pph21Tahunan += lap3 * 0.25; sisaPkp -= lap3; }
    if (sisaPkp > 0) { const lap4 = Math.min(sisaPkp, 4500000000); pph21Tahunan += lap4 * 0.30; sisaPkp -= lap4; }
    if (sisaPkp > 0) { pph21Tahunan += sisaPkp * 0.35; }

    return Math.round(pph21Tahunan / 12);
  };

  // 2. EXPORT TEMPLATE EXCEL CERDAS
  const downloadTemplatePayroll = () => {
    const activeEmps = employees.filter(e => e.status_pegawai !== 'NONAKTIF');
    const templateData = activeEmps.map(emp => {
      const stats = calculateWorkStats(emp.id, payrollPeriod);
      const pd = typeof emp.personal_data === 'string' ? JSON.parse(emp.personal_data || '{}') : (emp.personal_data || {});
      const gapok = Number(pd.gaji_terakhir?.replace(/[^0-9]/g, '')) || 0; 
      
      let row = { "NIK": emp.nik_karyawan, "Nama_Pegawai": emp.nama_lengkap, "Gaji_Pokok": gapok };

      if (stats.totalLateMinutes > 0 && penaltyRates.latePerMinute > 0) {
        row[`[-] Denda Telat (${stats.totalLateMinutes} Mnt)`] = stats.totalLateMinutes * penaltyRates.latePerMinute;
      }
      if (stats.totalMangkir > 0 && penaltyRates.absencePerDay > 0) {
        row[`[-] Potongan Mangkir (${stats.totalMangkir} Hari)`] = stats.totalMangkir * penaltyRates.absencePerDay;
      }
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template_Payroll");
    alert("Template berhasil dibuat!\n\nJika ada Tarif Potongan yang Anda set, sistem telah otomatis menghitung dan memasukkannya ke Excel.");
    XLSX.writeFile(wb, `Payroll_${payrollPeriod}.xlsx`);
  };

  const handleImportPayroll = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const bstr = event.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws);

      if (!window.confirm(`Proses & Hitung Payroll massal untuk ${data.length} karyawan?`)) return;

      let successData = [];
      let uniqueLocations = new Set(); // Kumpulkan lokasi/cabang mana saja yang di-import

      for (const row of data) {
        const nik = String(row["NIK"]).trim();
        const employee = employees.find(emp => emp.nik_karyawan === nik);
        
        if (employee) {
          const stats = calculateWorkStats(employee.id, payrollPeriod);
          let basicSalary = Number(row["Gaji_Pokok"]) || 0;
          let additions = []; let deductions = [];
          let totalAdditions = 0; let totalDeductions = 0;

          Object.keys(row).forEach(key => {
            const value = Number(row[key]) || 0;
            if (key.startsWith('[+]')) {
              additions.push({ name: key.replace('[+]', '').trim(), amount: value });
              totalAdditions += value;
            } else if (key.startsWith('[-]')) {
              deductions.push({ name: key.replace('[-]', '').trim(), amount: value });
              totalDeductions += value;
            }
          });

          const pd = typeof employee.personal_data === 'string' ? JSON.parse(employee.personal_data || '{}') : (employee.personal_data || {});
          const statusPTKP = pd.status_pernikahan || 'TK/0';

          const grossSalary = basicSalary + totalAdditions;
          const pph21 = calculatePPh21(grossSalary, statusPTKP);
          const netSalary = grossSalary - totalDeductions - pph21;

          successData.push({
            client_id: currentUser.client_id, employee_id: employee.id, 
            period: payrollPeriod, period_month: payrollPeriod,
            basic_salary: basicSalary, total_work_days: stats.totalDays, total_work_hours: stats.totalHours,
            additions: additions, deductions: deductions,
            gross_salary: grossSalary, tax_pph21: pph21, net_salary: netSalary, status: 'LUNAS'
          });

          uniqueLocations.add(employee.lokasi_penempatan); // Simpan nama cabangnya
        }
      }

      if (successData.length > 0) {
        // Hapus data lama yang seperiode agar tidak dobel, lalu insert
        await supabase.from('payrolls').delete().eq('client_id', currentUser.client_id).eq('period', payrollPeriod);
        const { error } = await supabase.from('payrolls').insert(successData);
        
        if (!error) { 
           // Panggil Konsolidator Kas untuk SETIAP cabang yang terdeteksi
           for (const lokasi of uniqueLocations) {
              await syncPayrollToCashflow(payrollPeriod, lokasi);
           }
           alert(`Luar Biasa! ${successData.length} data Gaji diproses & Arus Kas masing-masing cabang otomatis dikonsolidasi.`);
           fetchAllData(); 
        } else {
           alert("Database Error: " + error.message);
        }
      }
      if(importPayrollRef.current) importPayrollRef.current.value = '';
    };
    reader.readAsBinaryString(file);
  };

  // 4. MANUAL INPUT (SINGLE)
  const handleSelectEmployeeForPayroll = (empId) => {
    const employee = employees.find(e => e.id === empId);
    if (!employee) return setPayrollForm({ employee_id: '', basic_salary: 0, additions: [], deductions: [] });

    const pd = typeof employee.personal_data === 'string' ? JSON.parse(employee.personal_data || '{}') : (employee.personal_data || {});
    const gapok = Number(pd.gaji_terakhir?.replace(/[^0-9]/g, '')) || 0; 
    const stats = calculateWorkStats(employee.id, payrollPeriod);
    let autoAdditions = [], autoDeductions = [];

    // Auto-potongan keterlambatan & mangkir
    if (stats.totalLateMinutes > 0 && penaltyRates.latePerMinute > 0) {
      autoDeductions.push({ name: `Denda Telat (${stats.totalLateMinutes} Mnt)`, amount: stats.totalLateMinutes * penaltyRates.latePerMinute });
    }
    if (stats.totalMangkir > 0 && penaltyRates.absencePerDay > 0) {
      autoDeductions.push({ name: `Potongan Mangkir (${stats.totalMangkir} Hari)`, amount: stats.totalMangkir * penaltyRates.absencePerDay });
    }

    // ENTERPRISE FITUR: Auto-hitung Potongan BPJS Karyawan
    if (gapok > 0) {
      const bpjsKesehatan = Math.min(gapok * 0.01, 120000); // 1% (Maksimal batas upah 12jt)
      const bpjsKetenagakerjaan = gapok * 0.03; // 2% JHT + 1% JP
      autoDeductions.push({ name: 'BPJS Kesehatan (1%)', amount: bpjsKesehatan });
      autoDeductions.push({ name: 'BPJS Ketenagakerjaan (3%)', amount: bpjsKetenagakerjaan });
    }

    setPayrollForm({ employee_id: empId, basic_salary: gapok, additions: autoAdditions, deductions: autoDeductions });
  };

  const handleAddPayrollComponent = (type) => setPayrollForm(prev => ({ ...prev, [type]: [...prev[type], { name: '', amount: 0 }] }));
  const handleRemovePayrollComponent = (type, index) => setPayrollForm(prev => ({ ...prev, [type]: prev[type].filter((_, i) => i !== index) }));
  const handleUpdatePayrollComponent = (type, index, field, value) => {
    const updated = [...payrollForm[type]];
    updated[index][field] = value;
    setPayrollForm(prev => ({ ...prev, [type]: updated }));
  };

  // ==========================================
  // FITUR ENTERPRISE: KONSOLIDASI ARUS KAS GAJI
  // ==========================================
  const syncPayrollToCashflow = async (period, lokasiPenempatan) => {
    try {
      // 1. Ambil semua karyawan di lokasi/klien ini
      const { data: emps } = await supabase.from('employees')
        .select('id').eq('lokasi_penempatan', lokasiPenempatan).eq('client_id', currentUser.client_id);
      
      if (!emps || emps.length === 0) return;
      const empIds = emps.map(e => e.id);

      // 2. Ambil semua data gaji mereka di bulan tersebut
      const { data: pays } = await supabase.from('payrolls')
        .select('net_salary').eq('period', period).in('employee_id', empIds);

      // 3. Jumlahkan total seluruh Gaji Bersih
      const totalNet = pays ? pays.reduce((sum, p) => sum + p.net_salary, 0) : 0;

      // 4. Buat Kode Referensi Unik per Lokasi & Periode (Agar tidak dobel/ter-replace)
      const safeLokasi = (lokasiPenempatan || 'Pusat').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      const refNumber = `PAYROLL-${safeLokasi}-${period}`;

      if (totalNet === 0) {
         // Jika total 0 (mungkin datanya dihapus semua), hapus jurnal kas
         await supabase.from('cashflows').delete().eq('reference_number', refNumber).eq('client_id', currentUser.client_id);
         return;
      }

      // 5. Cek apakah Jurnal Kas untuk Cabang & Bulan ini sudah pernah dibuat
      const { data: existingCf } = await supabase.from('cashflows')
        .select('id').eq('reference_number', refNumber).eq('client_id', currentUser.client_id).maybeSingle();

      const cfPayload = {
        client_id: currentUser.client_id,
        type: 'EXPENSE',
        category: `Gaji Karyawan (${lokasiPenempatan || 'Pusat'})`,
        amount: totalNet,
        date: new Date().toISOString().split('T')[0],
        transaction_date: new Date().toISOString().split('T')[0],
        description: `Total Gaji periode ${period} untuk ${pays.length} karyawan di ${lokasiPenempatan || 'Pusat'}`,
        reference_number: refNumber
      };

      // 6. REPLACE (Update) jika sudah ada, atau INSERT jika baru
      if (existingCf) {
         await supabase.from('cashflows').update(cfPayload).eq('id', existingCf.id);
      } else {
         await supabase.from('cashflows').insert([cfPayload]);
      }
    } catch (err) {
      console.error("Gagal sinkronisasi arus kas:", err);
    }
  };

  const handleSaveManualPayroll = async (e) => {
    e.preventDefault();
    if (!payrollForm.employee_id) return alert("Pilih karyawan!");
    
    try {
      const employee = employees.find(emp => emp.id === payrollForm.employee_id);
      if (!employee) return alert("Error: Data karyawan tidak ditemukan!");
      const stats = calculateWorkStats(employee.id, payrollPeriod);

      const pd = typeof employee.personal_data === 'string' ? JSON.parse(employee.personal_data || '{}') : (employee.personal_data || {});
      const statusPTKP = pd.status_pernikahan || 'TK/0';

      const totalAdditions = payrollForm.additions.reduce((sum, item) => sum + Number(item.amount || 0), 0);
      const totalDeductions = payrollForm.deductions.reduce((sum, item) => sum + Number(item.amount || 0), 0);
      const basicSalary = Number(payrollForm.basic_salary || 0);
      const grossSalary = basicSalary + totalAdditions;
      const pph21 = calculatePPh21(grossSalary, statusPTKP); 
      const netSalary = grossSalary - totalDeductions - pph21;

      const payload = {
        client_id: currentUser.client_id, 
        employee_id: employee.id, 
        period: payrollPeriod, period_month: payrollPeriod,
        basic_salary: basicSalary, total_work_days: stats.totalDays, total_work_hours: stats.totalHours,
        additions: payrollForm.additions.filter(a => a.name.trim() !== ''), 
        deductions: payrollForm.deductions.filter(d => d.name.trim() !== ''),
        gross_salary: grossSalary, tax_pph21: pph21, net_salary: netSalary, status: 'LUNAS'
      };

      // 1. Simpan ke database Payroll
      await supabase.from('payrolls').delete().eq('employee_id', employee.id).eq('period', payrollPeriod);
      const { error: payrollError } = await supabase.from('payrolls').insert([payload]);
      
      if (payrollError) throw new Error("Gagal menyimpan ke tabel Payroll: " + payrollError.message);

      // 2. Panggil fungsi Konsolidator Kas yang baru dibuat!
      await syncPayrollToCashflow(payrollPeriod, employee.lokasi_penempatan);

      alert(`Berhasil! Gaji ${employee.nama_lengkap} tersimpan. Saldo Arus Kas untuk divisi/cabang terkait telah dihitung ulang secara otomatis.`);
      setIsPayrollModalOpen(false); 
      fetchAllData(); 

    } catch (err) {
      alert("Terjadi Kesalahan Sistem: " + err.message);
    }
  };

  // ==========================================
  // FUNGSI CEK HAK AKSES (RBAC PROTECTOR)
  // ==========================================
  const hasPermission = (moduleId, action) => {
    // 1. BLOKIR DARI SUPER ADMIN (Gunakan tanda tanya / optional chaining agar aman dari null)
    if (currentUser?.features?.[moduleId] === false) {
      return false;
    }

    // 2. Jalur Tol (Bypass) HANYA untuk role sistem utama
    const superRoles = ['Admin Perusahaan', 'Super Admin', 'Developer'];
    const currentRole = currentUser?.role ? currentUser.role.trim() : '';

    if (superRoles.includes(currentRole)) return true;

    // 3. Cari profil role user di database
    const userRole = companyRoles?.find(r => r.id === currentRole || r.name === currentRole);
    if (!userRole) return false; 
    
    // 4. Cek matriks izin (checkbox dari menu Konfigurasi Role)
    const perms = typeof userRole.permissions === 'string' ? JSON.parse(userRole.permissions) : userRole.permissions;
    return perms?.[moduleId]?.[action] === true;
  };

  // KALKULATOR OVERVIEW & ARUS KAS
  const globalIncome = cashflows.filter(c => c.type === 'INCOME').reduce((sum, c) => sum + Number(c.amount), 0);
  const globalExpense = cashflows.filter(c => c.type === 'EXPENSE').reduce((sum, c) => sum + Number(c.amount), 0);
  const globalBalance = globalIncome - globalExpense;

  const currentMonthCashflows = cashflows.filter(c => c.date.startsWith(cashflowPeriod));
  const monthIncome = currentMonthCashflows.filter(c => c.type === 'INCOME').reduce((sum, c) => sum + Number(c.amount), 0);
  const monthExpense = currentMonthCashflows.filter(c => c.type === 'EXPENSE').reduce((sum, c) => sum + Number(c.amount), 0);

  const [appConfig, setAppConfig] = useState({
    name: "Loading Perusahaan...",
    short: "..",
    color: "bg-blue-600",
    text: "text-blue-600",
    light: "bg-blue-50"
  });

  // STATE LOGO PERUSAHAAN
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const companyLogoRef = useRef(null);

  const handleUploadCompanyLogo = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!window.confirm("Ganti logo perusahaan? Logo ini akan tampil di seluruh aplikasi.")) return;
    setIsUploadingLogo(true);
    
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${currentUser.client_id}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from('company_logos').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('company_logos').getPublicUrl(filePath);
      const publicUrl = data.publicUrl;

      const { error: updateError } = await supabase.from('clients').update({ logo_url: publicUrl }).eq('id', currentUser.client_id);
      if (updateError) throw updateError;

      setAppConfig(prev => ({ ...prev, logo_url: publicUrl }));
      alert("Logo Perusahaan Berhasil Diperbarui!");
    } catch (err) {
      alert("Gagal mengupload logo: " + err.message);
    } finally {
      setIsUploadingLogo(false);
      if (companyLogoRef.current) companyLogoRef.current.value = '';
    }
  };

  // --- TAMBAHAN PERBAIKAN: Fungsi Format Rupiah ---
  const formatRupiah = (number) => {
    if (number === undefined || number === null) return "Rp 0";
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(number);
  };

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
      assigned_by: currentUser.id,
      client_id: currentUser.client_id 
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

  // FUNGSI UPDATE STATUS REIMBURSEMENT
  const handleUpdateReimburseStatus = async (id, newStatus) => {
    let note = '';
    if (newStatus === 'REJECTED') {
      note = window.prompt("Masukkan alasan penolakan pencairan (Wajib):");
      if (!note) return alert("Alasan penolakan tidak boleh kosong!");
    } else {
      note = window.prompt("Catatan persetujuan Finance (Opsional):");
    }

    const { error } = await supabase.from('reimbursements').update({ status: newStatus, admin_note: note }).eq('id', id);
    if (!error) {
      alert(`Reimbursement berhasil ${newStatus === 'APPROVED' ? 'Disetujui' : 'Ditolak'}!`);
      fetchAllData(); 
    } else {
      alert("Gagal memproses data: " + error.message);
    }
  };

  // FUNGSI UPDATE STATUS APPROVAL & POTONG SALDO CUTI
  const handleUpdateLeaveStatus = async (id, newStatus) => {
    const reqTarget = leaveRequests.find(r => r.id === id);
    let note = '';
    
    if (newStatus === 'REJECTED') {
      note = window.prompt("Masukkan alasan penolakan (Wajib):");
      if (!note) return alert("Alasan penolakan tidak boleh kosong!");
    } else {
      note = window.prompt("Catatan persetujuan (Opsional, kosongkan jika tidak ada):");
    }

    if (newStatus === 'APPROVED' && reqTarget.request_type === 'CUTI') {
      const start = new Date(reqTarget.start_date);
      const end = new Date(reqTarget.end_date);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      const { data: empData } = await supabase.from('employees').select('sisa_cuti').eq('id', reqTarget.employee_id).single();
      const currentSisa = empData?.sisa_cuti || 0;

      if (currentSisa < diffDays) {
        const proceed = window.confirm(`Peringatan: Saldo cuti karyawan (${currentSisa} hari) tidak cukup untuk pengajuan ini (${diffDays} hari). Tetap setujui?`);
        if (!proceed) return;
      }

      await supabase.from('employees').update({ sisa_cuti: currentSisa - diffDays }).eq('id', reqTarget.employee_id);
    }

    const { error } = await supabase.from('leave_requests').update({ status: newStatus, admin_note: note }).eq('id', id);
    if (!error) {
      alert(`Pengajuan berhasil ${newStatus === 'APPROVED' ? 'Disetujui' : 'Ditolak'}!`);
      fetchAllData();
    } else {
      alert("Gagal memproses data: " + error.message);
    }
  };

  // 1. FUNGSI UPDATE STATUS KOREKSI ABSEN & UPDATE DATABASE UTAMA
  const handleUpdateCorrectionStatus = async (id, newStatus) => {
    let note = '';
    if (newStatus === 'REJECTED') {
      note = window.prompt("Masukkan alasan penolakan (Wajib):");
      if (!note) return alert("Alasan penolakan tidak boleh kosong!");
    } else { note = window.prompt("Catatan persetujuan (Opsional):"); }

    const reqTarget = attendanceCorrections.find(r => r.id === id);

    // JIKA DISETUJUI, OTOMATIS UPDATE ATAU BUAT DATA ABSENSI BARU
    if (newStatus === 'APPROVED') {
      const { data: existingAtt } = await supabase.from('attendances')
        .select('id').eq('employee_id', reqTarget.employee_id).eq('date', reqTarget.date).single();

      let updatePayload = {};
      if (reqTarget.correction_type === 'IN' || reqTarget.correction_type === 'BOTH') updatePayload.check_in_time = reqTarget.time_in;
      if (reqTarget.correction_type === 'OUT' || reqTarget.correction_type === 'BOTH') updatePayload.check_out_time = reqTarget.time_out;

      if (existingAtt) {
        await supabase.from('attendances').update(updatePayload).eq('id', existingAtt.id);
      } else {
        await supabase.from('attendances').insert([{
          client_id: currentUser.client_id, employee_id: reqTarget.employee_id, date: reqTarget.date, ...updatePayload,
          status: 'HADIR', location_gps: 'Koreksi Manual', photo_url: 'https://ui-avatars.com/api/?name=Manual'
        }]);
      }
    }

    const { error } = await supabase.from('attendance_corrections').update({ status: newStatus, admin_note: note }).eq('id', id);
    if (!error) { alert("Status koreksi absen berhasil diproses!"); fetchAllData(); } 
    else alert("Gagal memproses data: " + error.message);
  };

  // ==========================================
  // FUNGSI MANAJEMEN PELAMAR & BANK DATA
  // ==========================================
  const handleUpdateCandidateStatus = async (id, newStatus) => {
    const statusText = newStatus === 'BANK_DATA' ? 'Bank Data' : 'Daftar Pelamar Baru';
    if (!window.confirm(`Pindahkan pelamar ini ke ${statusText}?`)) return;
    
    const { error } = await supabase.from('candidates').update({ status: newStatus }).eq('id', id);
    if (!error) {
      alert(`Berhasil dipindahkan ke ${statusText}!`);
      fetchAllData();
    } else {
      alert('Gagal memproses data: ' + error.message);
    }
  };

  const handleAcceptToEmployee = async (cand) => {
    if (!window.confirm(`Angkat ${cand.nama_lengkap} menjadi Karyawan Inti? Seluruh berkas dan datanya akan dipindah ke Database Karyawan.`)) return;
    
    // HRD harus menetapkan NIK Sistem saat mengangkat karyawan
    const nik = window.prompt("Masukkan NIK Sistem untuk karyawan ini:", cand.nik_karyawan || "");
    if (!nik) return alert("Proses dibatalkan. NIK Sistem wajib diisi.");

    // Buat Payload untuk masuk ke tabel Employees
    const payload = {
       client_id: cand.client_id,
       nik_karyawan: nik,
       nama_lengkap: cand.nama_lengkap,
       password: 'password123', // Password default (bisa diganti karyawan nanti)
       role: 'Staff Lapangan', // Role bawaan, HRD bisa edit nanti
       bidang_jasa: cand.bidang_jasa,
       posisi_jabatan: cand.posisi_jabatan,
       lokasi_penempatan: 'Belum Ditentukan',
       status_pegawai: 'AKTIF',
       has_mobile_access: true,
       has_task_access: true,
       personal_data: cand.personal_data // TRANSFER SELURUH DATA & FOTO KE TABEL KARYAWAN!
    };

    const { error } = await supabase.from('employees').insert([payload]);
    
    if (!error) {
       // Jika sukses masuk ke tabel karyawan, ubah status di tabel rekrutmen jadi ACCEPTED
       await supabase.from('candidates').update({ status: 'ACCEPTED' }).eq('id', cand.id);
       alert("Luar Biasa! Pelamar resmi menjadi Karyawan Inti.");
       fetchAllData();
    } else {
       alert("Gagal memproses karyawan: " + error.message);
    }
  };

  // 2. FUNGSI HANDLE FITUR EDIT MASSAL
  const handleToggleMassEdit = () => {
    if (isMassEditMode) {
      setIsMassEditMode(false); setEditableAttendances({});
    } else {
      const initialData = {};
      attendances.forEach(a => {
        initialData[a.id] = { in: a.check_in_time ? a.check_in_time.substring(0,5) : '', out: a.check_out_time ? a.check_out_time.substring(0,5) : '' };
      });
      setEditableAttendances(initialData); setIsMassEditMode(true);
    }
  };

  const handleSaveMassEdit = async () => {
    if(!window.confirm("Simpan semua perubahan jam absen ini ke database?")) return;
    let updates = [];
    for (const att of attendances) {
      const edit = editableAttendances[att.id];
      if (edit) {
        const origIn = att.check_in_time ? att.check_in_time.substring(0,5) : '';
        const origOut = att.check_out_time ? att.check_out_time.substring(0,5) : '';
        if (edit.in !== origIn || edit.out !== origOut) {
          updates.push( supabase.from('attendances').update({
            check_in_time: edit.in ? edit.in + ':00' : null, check_out_time: edit.out ? edit.out + ':00' : null
          }).eq('id', att.id) );
        }
      }
    }
    if (updates.length > 0) {
      await Promise.all(updates);
      alert(`${updates.length} data absensi berhasil diperbarui!`); fetchAllData();
    } else { alert("Tidak ada perubahan jam yang terdeteksi."); }
    setIsMassEditMode(false);
  };

  // FUNGSI UNTUK DATABASE KARYAWAN (MASS ACTION)
  const handleSelectAllInLocation = (isChecked, locEmployees) => {
    if (isChecked) {
      const newIds = locEmployees.map(e => e.id).filter(id => !selectedEmployees.includes(id));
      setSelectedEmployees(prev => [...prev, ...newIds]);
    } else {
      const idsToRemove = locEmployees.map(e => e.id);
      setSelectedEmployees(prev => prev.filter(id => !idsToRemove.includes(id)));
    }
  };

  const handleSelectEmployee = (id) => {
    setSelectedEmployees(prev => prev.includes(id) ? prev.filter(empId => empId !== id) : [...prev, id]);
  };

  const handleMassAction = async (actionType) => {
    if (selectedEmployees.length === 0) return alert("Pilih minimal 1 karyawan!");
    
    if (actionType === 'delete') {
      if(window.confirm(`PERINGATAN: Yakin menghapus ${selectedEmployees.length} karyawan? Data akan hilang permanen.`)) {
        const {error} = await supabase.from('employees').delete().in('id', selectedEmployees);
        if(!error) { alert("Berhasil dihapus!"); setSelectedEmployees([]); fetchAllData(); }
        else alert("Gagal menghapus: " + error.message);
      }
    } else if (actionType === 'deactivate') {
      if(window.confirm(`Yakin menonaktifkan ${selectedEmployees.length} karyawan? Akses aplikasi mereka akan dicabut.`)) {
        const {error} = await supabase.from('employees').update({
          status_pegawai: 'NONAKTIF',
          has_mobile_access: false,
          has_task_access: false
        }).in('id', selectedEmployees);
        if(!error) { alert("Berhasil dinonaktifkan!"); setSelectedEmployees([]); fetchAllData(); }
        else alert("Gagal menonaktifkan: " + error.message);
      }
    } else if (actionType === 'move') {
      if(!massActionTarget) return alert("Pilih lokasi penempatan tujuan terlebih dahulu!");
      if(window.confirm(`Pindahkan ${selectedEmployees.length} karyawan ke lokasi: ${massActionTarget}?`)) {
        const {error} = await supabase.from('employees').update({
          lokasi_penempatan: massActionTarget
        }).in('id', selectedEmployees);
        if(!error) { alert("Berhasil dipindahkan!"); setSelectedEmployees([]); setMassActionTarget(''); fetchAllData(); }
        else alert("Gagal memindahkan: " + error.message);
      }
    }
  };

  // FUNGSI UPDATE DATA KARYAWAN INDIVIDU
  const handleSaveEmployeeDetail = async (e) => {
    e.preventDefault();
    if (!window.confirm("Simpan perubahan data karyawan ini?")) return;

    // Memisahkan data utama dan data personal (JSON)
    const { 
      id, nik_karyawan, nama_lengkap, bidang_jasa, posisi_jabatan, 
      lokasi_penempatan, status_pegawai, role, personal_data 
    } = empForm;

    const payload = {
      nik_karyawan, nama_lengkap, bidang_jasa, posisi_jabatan,
      lokasi_penempatan, status_pegawai, role, personal_data
    };

    const { error } = await supabase.from('employees').update(payload).eq('id', id);
    if (!error) {
      alert("Data karyawan berhasil diperbarui!");
      fetchAllData();
      setEmpDetailMode('view'); // Kembalikan ke mode lihat
    } else {
      alert("Gagal menyimpan data: " + error.message);
    }
  };

  const toggleLocationAccordion = (loc) => {
    setExpandedLocations(prev => ({...prev, [loc]: !prev[loc]}));
  };

  // KEYWORD_CAMERA_REFI: Fungsi untuk mengaktifkan kamera stream
  const startCamera = async () => {
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user", width: 400, height: 400 } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert("Tidak dapat mengakses kamera: " + err.message);
      setIsCameraActive(false);
    }
  };

  // KEYWORD_CAMERA_REFI: Fungsi untuk mematikan stream kamera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // KEYWORD_CAMERA_REFI: Fungsi mengambil gambar dari video stream dan menjadikannya File Object
  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      // Set ukuran canvas mengikuti resolusi video asli
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      
      const ctx = canvas.getContext('2d');
      // Balik gambar jika ingin efek cermin (opsional)
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      
      // Ubah canvas menjadi blob, lalu bungkus menjadi File Object agar bisa diupload ke Supabase
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `capture_${Date.now()}.jpeg`, { type: 'image/jpeg' });
          setProfileForm(prev => ({ ...prev, file: file }));
          stopCamera(); // Matikan kamera setelah foto berhasil diambil
        }
      }, 'image/jpeg', 0.85); // Kualitas kompresi 85%
    }
  };

  // KEYWORD_PROFILE_REFI: Fungsi update profil (Foto & Password)
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      let newAvatarUrl = profileForm.avatar_url;
      let newAvatarPath = profileForm.avatar_path;

      // 1. Jika user memilih file foto baru
      if (profileForm.file) {
        const file = profileForm.file;
        const fileExt = file.name.split('.').pop();
        const filePath = `avatars/${currentUser.id}_${Date.now()}.${fileExt}`;

        // Hapus foto lama dari storage Supabase agar tidak numpuk (replace)
        if (profileForm.avatar_path) {
          await supabase.storage.from('avatars').remove([profileForm.avatar_path]);
        }

        // Upload foto baru ke bucket 'avatars'
        const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
        if (uploadError) throw uploadError;

        // Ambil Public URL dari Supabase
        const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
        newAvatarUrl = data.publicUrl;
        newAvatarPath = filePath;
      }

      // 2. Siapkan payload data yang akan diupdate
      const payload = {};
      if (profileForm.password && profileForm.password.trim() !== '') {
        payload.password = profileForm.password;
      }

      // Ambil personal_data lama agar datanya tidak hilang tertimpa
      const { data: empData } = await supabase.from('employees').select('personal_data').eq('id', currentUser.id).single();
      const existingPD = typeof empData?.personal_data === 'string' ? JSON.parse(empData.personal_data || '{}') : (empData?.personal_data || {});
      
      // Sisipkan data foto ke dalam JSON personal_data
      payload.personal_data = { ...existingPD, avatar_url: newAvatarUrl, avatar_path: newAvatarPath };

      // 3. Update database tabel employees
      const { error } = await supabase.from('employees').update(payload).eq('id', currentUser.id);
      if (error) throw error;

      // 4. Update Sesi Lokal agar foto di header langsung berubah tanpa harus refresh
      const session = JSON.parse(localStorage.getItem('vest_user_session') || '{}');
      session.avatar_url = newAvatarUrl;
      session.avatar_path = newAvatarPath;
      localStorage.setItem('vest_user_session', JSON.stringify(session));
      
      setCurrentUser(prev => ({ ...prev, avatar_url: newAvatarUrl, avatar_path: newAvatarPath }));
      setIsProfileModalOpen(false);
      alert("Profil Anda berhasil diperbarui!");

    } catch (err) {
      alert("Gagal update profil: " + err.message);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('vest_user_session');
    navigate('/');
  };

  // FUNGSI SIMPAN ROLE & PERMISSIONS
  const handleSaveRole = async (e) => {
    e.preventDefault();
    const payload = { 
      name: roleForm.name, 
      description: roleForm.description, 
      permissions: roleForm.permissions,
      client_id: currentUser.client_id
    };

    if (roleForm.id) {
      const { error } = await supabase.from('company_roles').update(payload).eq('id', roleForm.id);
      if (!error) { alert("Role berhasil diperbarui!"); setIsRoleModalOpen(false); fetchAllData(); }
      else alert("Gagal update: " + error.message);
    } else {
      const { error } = await supabase.from('company_roles').insert([payload]);
      if (!error) { alert("Role baru berhasil dibuat!"); setIsRoleModalOpen(false); fetchAllData(); }
      else alert("Gagal membuat role: " + error.message);
    }
  };

  const handleCheckboxChange = (moduleId, action) => {
    setRoleForm(prev => {
      // JURUS DEEP COPY 100% AMAN: Cetak ulang memori dari nol agar React sadar
      const clonedPerms = JSON.parse(JSON.stringify(prev.permissions || {}));
      
      if (!clonedPerms[moduleId]) {
        clonedPerms[moduleId] = {};
      }
      
      const isCurrentlyChecked = clonedPerms[moduleId][action];
      clonedPerms[moduleId][action] = !isCurrentlyChecked;

      // AUTO-LOGIC: Jika 'Lihat' (View) dimatikan, semua akses lain ikut mati
      if (action === 'view' && isCurrentlyChecked === true) {
        Object.keys(clonedPerms[moduleId]).forEach(key => {
          clonedPerms[moduleId][key] = false;
        });
      }
      
      // AUTO-LOGIC: Jika akses lain (Buat/Ubah/Hapus) dihidupkan, 'Lihat' otomatis hidup
      if (action !== 'view' && isCurrentlyChecked === false) {
        clonedPerms[moduleId].view = true;
      }

      return { ...prev, permissions: clonedPerms };
    });
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
      if (!error) {
        alert("Cabang berhasil dihapus!");
        setIsClientModalOpen(false);
        fetchAllData();
      } else {
        alert("Gagal hapus klien. Pastikan titik lokasi di dalamnya sudah dihapus lebih dulu.");
      }
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

  // ==========================================
  // FUNGSI DOWNLOAD TEMPLATE & IMPORT ABSEN (EXCEL VERSION)
  // ==========================================

  // 1. FUNGSI DOWNLOAD TEMPLATE EXCEL
  const downloadTemplateAbsen = () => {
    const templateData = [
      {
        "NIK_KARYAWAN": "DEV-000",
        "TANGGAL(YYYY-MM-DD)": "2026-07-06",
        "JAM_MASUK(HH:MM)": "08:00",
        "JAM_KELUAR(HH:MM)": "17:00"
      },
      {
        "NIK_KARYAWAN": "ADM-001",
        "TANGGAL(YYYY-MM-DD)": "2026-07-06",
        "JAM_MASUK(HH:MM)": "07:50",
        "JAM_KELUAR(HH:MM)": "17:10"
      }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template Edit Absensi");
    XLSX.writeFile(wb, "Template_Massal_Absensi.xlsx");
  };

  // 2. FUNGSI BACA DAN IMPORT DATA EXCEL (SMART UPSERT)
  const handleImportAbsen = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const bstr = event.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      
      // { raw: false } penting agar format jam (08:00) dan tanggal terbaca sebagai teks, bukan angka desimal Excel
      const data = XLSX.utils.sheet_to_json(ws, { defval: "", raw: false });

      if (data.length === 0) return alert("File Excel kosong atau format salah.");
      if (!window.confirm(`Sistem mendeteksi ${data.length} baris data absensi. Lanjutkan proses import?`)) return;

      let successCount = 0;
      let errorCount = 0;

      // Tarik master data karyawan untuk mencocokkan NIK ke employee_id
      const { data: empData } = await supabase.from('employees').select('id, nik_karyawan').eq('client_id', currentUser.client_id);
      if (!empData) return alert("Gagal menarik data master karyawan.");

      for (const row of data) {
        const nik = String(row["NIK_KARYAWAN"]).trim();
        const date = String(row["TANGGAL(YYYY-MM-DD)"]).trim();
        // Bersihkan data waktu, kalau cuma "8:00" jadikan "08:00:00" untuk database
        let timeIn = String(row["JAM_MASUK(HH:MM)"]).trim();
        let timeOut = String(row["JAM_KELUAR(HH:MM)"]).trim();
        
        timeIn = timeIn && timeIn !== "undefined" ? (timeIn.length <= 5 ? `${timeIn}:00` : timeIn) : null;
        timeOut = timeOut && timeOut !== "undefined" ? (timeOut.length <= 5 ? `${timeOut}:00` : timeOut) : null;

        const employee = empData.find(emp => emp.nik_karyawan === nik);
        
        if (employee && date && date !== "undefined") {
          // Cek apakah data absen di tanggal itu sudah ada di database
          const { data: existingAtt } = await supabase.from('attendances')
            .select('id').eq('employee_id', employee.id).eq('date', date).maybeSingle();

          let updatePayload = {};
          if (timeIn) updatePayload.check_in_time = timeIn;
          if (timeOut) updatePayload.check_out_time = timeOut;

          if (existingAtt) {
            // UPDATE: Jika sudah ada
            const { error } = await supabase.from('attendances').update(updatePayload).eq('id', existingAtt.id);
            if (!error) successCount++; else errorCount++;
          } else {
            // INSERT: Jika belum ada sama sekali
            const { error } = await supabase.from('attendances').insert([{
              employee_id: employee.id,
              client_id: currentUser.client_id,
              date: date,
              ...updatePayload,
              status: 'HADIR',
              location_gps: 'Import Massal Sistem',
              photo_url: 'https://ui-avatars.com/api/?name=Import+Data'
            }]);
            if (!error) successCount++; else errorCount++;
          }
        } else {
          errorCount++; // Karyawan tidak ketemu atau format tanggal salah
        }
      }

      alert(`Proses Import Selesai!\n✅ Berhasil: ${successCount} data\n❌ Gagal/Dilewati: ${errorCount} data (Pastikan NIK & Tanggal valid)`);
      fetchAllData(); 
      if(importAbsenRef.current) importAbsenRef.current.value = ''; 
    };
    
    reader.readAsBinaryString(file); 
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
            <div className={`w-10 h-10 ${appConfig.color} rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-blue-600/20 shrink-0 overflow-hidden`}>
              {/* Jika ada logo, tampilkan. Jika tidak, tampilkan singkatan nama */}
              {appConfig.logo_url ? (
                <img src={appConfig.logo_url} alt="Logo" className="w-full h-full object-cover bg-white" />
              ) : (
                appConfig.short
              )}
            </div>
            {isSidebarExpanded && (
              <div className="overflow-hidden whitespace-nowrap fade-in">
                <h1 className="font-bold text-slate-800 leading-tight">{appConfig.name}</h1>
                <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                  Admin Portal 
                  {/* IDENTITAS VANDA TECH DI SAMPING NAMA APLIKASI */}
                  <span className="text-[8px] bg-blue-600 text-white px-1.5 py-0.5 rounded font-black tracking-widest shadow-sm">VANDA TECH</span>
                </p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 mt-2 overflow-y-auto overflow-x-hidden custom-scrollbar">
          {isSidebarExpanded && <p className="px-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Main Menu</p>}
          
          {[
            { id: 'hris', icon: Users, label: 'HRIS Dashboard' },
            { id: 'shift', icon: CalendarClock, label: 'Manajemen Shift' },
            { id: 'task', icon: CheckSquare, label: 'Task Management' },
            { id: 'approval', icon: ClipboardCheck, label: 'Pusat Approval' },
            { id: 'laporan', icon: FileText, label: 'Laporan & Pengajuan' },
            { id: 'finance', icon: Wallet, label: 'Finance Dashboard' },
            { id: 'broadcast', icon: MessageSquare, label: 'Informasi & Instruksi' }
          ]
          .filter(item => hasPermission(item.id, 'view'))
          .map((item) => (
            <button key={item.id} 
              onClick={() => {setActiveMenu(item.id); setSelectedTask(null);}}
              className={`flex items-center w-full rounded-xl font-medium text-sm transition-all overflow-hidden whitespace-nowrap
                ${activeMenu === item.id ? `${appConfig.light} ${appConfig.text}` : 'text-slate-600 hover:bg-slate-50'}
                ${isSidebarExpanded ? 'gap-3 px-4 py-3.5' : 'justify-center p-3.5'}
              `}>
              <item.icon size={20} className={`shrink-0 ${activeMenu === item.id ? appConfig.text : 'text-slate-400'}`} />
              {isSidebarExpanded && <span>{item.label}</span>}
            </button>
          ))}

          {/* PROTEKSI: Sembunyikan Pengaturan jika tidak ada hak */}
          {hasPermission('settings', 'view') && (
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
          )}
        </nav>
      </aside>

      {/* KONTEN UTAMA */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        
        <header className="hidden md:flex items-center justify-between px-8 py-4 bg-white border-b border-slate-200 z-10 shrink-0">
          
          <div></div>
          
          <div className="flex items-center gap-4 relative" ref={popupRef}>
            {/*
            <button className="relative p-2.5 text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border border-white"></span>
            </button>
            */}

            <button onClick={() => setIsProfilePopupOpen(!isProfilePopupOpen)} className="flex items-center gap-3 pl-4 border-l border-slate-200 hover:opacity-80 transition-opacity">
              
              {/* KEYWORD_PROFILE_REFI: Tampilan Avatar Bulat di Header Kanan Atas */}
              <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 border border-blue-200 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                {currentUser.avatar_url ? (
                  <img src={currentUser.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  currentUser.avatar || 'U'
                )}
              </div>
              
              <div className="text-left hidden lg:block">
                <p className="text-sm font-bold text-slate-800 leading-tight truncate max-w-[150px]">{currentUser.name}</p>
                <p className="text-[10px] text-slate-500 font-medium">{currentUser.role || 'No Role'}</p>
              </div>
            </button>

            {isProfilePopupOpen && (
              <div className="absolute top-14 right-0 w-56 bg-white border border-slate-100 rounded-2xl shadow-xl py-2 fade-in z-50">
                <div className="px-4 py-3 border-b border-slate-100 mb-2">
                  <p className="text-sm font-bold text-slate-800 truncate">{currentUser.name}</p>
                  <p className="text-xs text-slate-500">{appConfig.name}</p>
                </div>
                
                {/* KEYWORD_PROFILE_REFI: Action klik pada menu Profil Saya untuk memanggil form */}
                <button 
                  onClick={() => {
                    setIsProfilePopupOpen(false);
                    const session = JSON.parse(localStorage.getItem('vest_user_session') || '{}');
                    setProfileForm({ password: '', file: null, avatar_url: session.avatar_url || '', avatar_path: session.avatar_path || '' });
                    setIsProfileModalOpen(true);
                  }} 
                  className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-3">
                  <UserCircle size={18} className="text-slate-400"/> Profil Saya
                </button>
                
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
            {/*
            <button className="relative p-2 bg-white/20 rounded-full backdrop-blur-sm">
              <Bell size={20} className="text-white" />
              <span className="absolute top-1.5 right-2 w-2 h-2 bg-rose-500 rounded-full border border-blue-600"></span>
            </button>
            */}
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
                  <div className="flex items-center gap-2">
                    {/* DROPDOWN FILTER CABANG */}
                    <select value={hrisOverviewCabang} onChange={e => setHrisOverviewCabang(e.target.value)} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-[#0a195c] outline-none shadow-sm cursor-pointer transition-colors focus:border-blue-500">
                      <option value="Semua">Semua Cabang (Global)</option>
                      {/* Mengambil daftar cabang otomatis dari data pegawai yang ada */}
                      {[...new Set(employees.map(e => e.lokasi_penempatan).filter(Boolean))].map(loc => <option key={loc} value={loc}>{loc}</option>)}
                    </select>
                    <span className="px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-lg text-xs font-black text-blue-700 flex items-center gap-2 shadow-sm shrink-0">
                      <Clock size={14}/> 
                      {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                {(() => {
                  const todayStr = new Date().toISOString().split('T')[0];
                  
                  // 1. Filter Karyawan Berdasarkan Cabang yang dipilih (Hanya yang masih Aktif)
                  const baseEmployees = employees.filter(e => e.status_pegawai !== 'NONAKTIF');
                  const targetEmployees = hrisOverviewCabang === 'Semua' 
                    ? baseEmployees 
                    : baseEmployees.filter(e => e.lokasi_penempatan === hrisOverviewCabang);

                  // Kumpulkan ID pegawai yang masuk dalam filter untuk pencocokan absensi & cuti
                  const targetEmpIds = targetEmployees.map(e => e.id);

                  // 2. Hitung Hadir Hari Ini (Hanya dari cabang yang terpilih)
                  const countHadir = attendances.filter(a => a.date === todayStr && targetEmpIds.includes(a.employee_id)).length;
                  
                  // 3. Hitung Cuti / Izin (Status APPROVED dan tanggal hari ini masuk di rentangnya)
                  const countCuti = leaveRequests.filter(r => 
                    r.status === 'APPROVED' && 
                    r.start_date <= todayStr && 
                    r.end_date >= todayStr && 
                    targetEmpIds.includes(r.employee_id)
                  ).length;

                  // 4. Hitung Belum / Tidak Absen (Rumus: Total - Hadir - Cuti)
                  const countTidakAbsen = targetEmployees.length - countHadir - countCuti;

                  return (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                      <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group hover:border-blue-300 transition-colors">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500"><Users size={56}/></div>
                        <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase">Total Karyawan Aktif</p>
                        <h3 className="text-2xl md:text-4xl font-black text-slate-800 mt-1 md:mt-2">{targetEmployees.length}</h3>
                        <p className="text-[10px] md:text-xs text-blue-600 font-medium mt-1">Di cabang terpilih</p>
                      </div>
                      
                      <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group hover:border-emerald-300 transition-colors">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500"><CheckCircle2 size={56} className="text-emerald-500"/></div>
                        <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase">Hadir Hari Ini</p>
                        <h3 className="text-2xl md:text-4xl font-black text-emerald-600 mt-1 md:mt-2">{countHadir}</h3>
                        <p className="text-[10px] md:text-xs text-emerald-600 font-medium mt-1">Telah Check-In</p>
                      </div>
                      
                      <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group hover:border-rose-300 transition-colors">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500"><XCircle size={56} className="text-rose-500"/></div>
                        <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase">Tidak / Belum Absen</p>
                        {/* Math.max(0) untuk mencegah nilai minus jika ada anomali data */}
                        <h3 className="text-2xl md:text-4xl font-black text-rose-600 mt-1 md:mt-2">{Math.max(0, countTidakAbsen)}</h3>
                        <p className="text-[10px] md:text-xs text-rose-500 font-medium mt-1">Mangkir atau Libur</p>
                      </div>
                      
                      <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group hover:border-amber-300 transition-colors">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500"><FileText size={56} className="text-amber-500"/></div>
                        <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase">Sedang Cuti / Izin</p>
                        <h3 className="text-2xl md:text-4xl font-black text-amber-500 mt-1 md:mt-2">{countCuti}</h3>
                        <p className="text-[10px] md:text-xs text-amber-600 font-medium mt-1">Berhalangan resmi</p>
                      </div>
                    </div>
                  );
                })()}

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
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
                      <div className="flex flex-col md:flex-row gap-3 flex-1 w-full">
                        <div className="relative flex-1">
                          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input type="text" placeholder="Cari Nama Pegawai..." value={filterNama} onChange={e => setFilterNama(e.target.value)} className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-400"/>
                        </div>
                        {/* Filter Cabang/Lokasi */}
                        <select value={filterLokasi} onChange={e => setFilterLokasi(e.target.value)} className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-400 font-semibold text-slate-600">
                           <option value="">Semua Lokasi/Cabang</option>
                           {[...new Set(officeLocations.map(l => l.name))].map(loc => <option key={loc} value={loc}>{loc}</option>)}
                        </select>
                        <input type="date" value={filterTanggal} onChange={e => setFilterTanggal(e.target.value)} className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-400 text-slate-500"/>
                      </div>

                      <div className="flex flex-wrap gap-2 shrink-0 w-full md:w-auto">
                        {hasPermission('hris', 'export') && (
                          <>
                            <button onClick={exportAbsensiExcel} className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-colors shadow-sm flex items-center gap-2 justify-center flex-1 md:flex-none">
                              <Download size={14}/> Rekap Excel
                            </button>
                            <button onClick={downloadTemplateAbsen} className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors shadow-sm flex items-center justify-center">Template Excel</button>
                          </>
                        )}
                        {hasPermission('hris', 'create') && (
                          <>
                            <input type="file" accept=".xlsx, .xls" ref={importAbsenRef} onChange={handleImportAbsen} className="hidden" />
                            <button onClick={() => importAbsenRef.current.click()} className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors shadow-sm flex items-center gap-1 justify-center"><Upload size={14}/> Import Absen</button>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                          <tr><th className="px-6 py-4">Tanggal</th><th className="px-6 py-4">Pegawai</th><th className="px-6 py-4">Lokasi & Foto</th><th className="px-6 py-4">Jadwal & Realisasi (IN/OUT)</th><th className="px-6 py-4 text-center">Aksi</th></tr>
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
                                {/* PERBAIKAN FATAL CRASH: Penutup })() di bawah sudah dikoreksi */}
                                {(() => {
                                  const jadwalShift = shifts.find(s => s.employee_id === att.employee_id && s.date === att.date);
                                  const menitTelat = hitungKeterlambatan(att.check_in_time, jadwalShift?.time_in);

                                  return !isMassEditMode ? (
                                    <>
                                      {jadwalShift && jadwalShift.shift_type !== 'Libur' ? (
                                        <div className="mb-2 pb-1 border-b border-slate-100 border-dashed">
                                          <span className="text-[9px] font-black text-slate-400 uppercase">Jadwal Wajib:</span>
                                          <span className="text-xs font-bold text-slate-600 ml-1">{jadwalShift.time_in?.substring(0,5)} - {jadwalShift.time_out?.substring(0,5)}</span>
                                        </div>
                                      ) : (
                                        <div className="mb-2 pb-1 border-b border-slate-100 border-dashed">
                                          <span className="text-[9px] font-black text-slate-400 uppercase">Tanpa Jadwal Shift</span>
                                        </div>
                                      )}

                                      <div className="flex items-center gap-2">
                                        <span className="font-black text-emerald-600 block">IN: {att.check_in_time ? att.check_in_time.substring(0,5) : '--:--'}</span>
                                        {menitTelat > 0 && (
                                          <span className="bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded text-[9px] font-black animate-pulse">TELAT {menitTelat} MNT</span>
                                        )}
                                      </div>
                                      <span className="font-black text-slate-500 block mt-0.5">OUT: {att.check_out_time ? att.check_out_time.substring(0,5) : '--:--'}</span>
                                    </>
                                  ) : (
                                    <div className="flex flex-col gap-1.5 w-24">
                                      <div className="flex items-center gap-1"><span className="text-[10px] font-bold text-emerald-600 w-6">IN:</span> <input type="time" value={editableAttendances[att.id]?.in || ''} onChange={e => setEditableAttendances(prev => ({...prev, [att.id]: {...prev[att.id], in: e.target.value}}))} className="border border-slate-300 rounded px-1.5 py-1 text-xs outline-none focus:border-blue-500 w-full" /></div>
                                      <div className="flex items-center gap-1"><span className="text-[10px] font-bold text-slate-500 w-6">OUT:</span> <input type="time" value={editableAttendances[att.id]?.out || ''} onChange={e => setEditableAttendances(prev => ({...prev, [att.id]: {...prev[att.id], out: e.target.value}}))} className="border border-slate-300 rounded px-1.5 py-1 text-xs outline-none focus:border-blue-500 w-full" /></div>
                                    </div>
                                  );
                                })()} 
                                {/* ^^^ INI PENUTUP YANG BENAR ^^^ */}
                              </td>
                              <td className="px-6 py-4 text-center align-middle">
                                <div className="flex justify-center gap-2">
                                  {hasPermission('hris', 'delete') ? (
                                    <button onClick={() => handleDeleteAbsen(att.id)} className="p-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors"><Trash2 size={16}/></button>
                                  ) : (
                                    <span className="text-[10px] text-slate-400 italic">No Access</span>
                                  )}
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
                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(window.location.origin + '/recruitment?cid=' + currentUser.client_id)}`} alt="QR Form" className="w-32 h-32" />
                      </div>
                    </div>

                    {/* TAB NAVIGASI REKRUTMEN & TOMBOL EXCEL */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                       <div className="flex gap-3">
                         <button onClick={() => setRekrutmenSubTab('PENDING')} className={`px-5 py-2.5 text-xs font-bold rounded-xl border transition-all ${rekrutmenSubTab === 'PENDING' ? 'bg-amber-50 border-amber-200 text-amber-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                            Pelamar Baru ({candidates.filter(c => c.status === 'PENDING').length})
                         </button>
                         <button onClick={() => setRekrutmenSubTab('BANK_DATA')} className={`px-5 py-2.5 text-xs font-bold rounded-xl border transition-all ${rekrutmenSubTab === 'BANK_DATA' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                            Bank Data ({candidates.filter(c => c.status === 'BANK_DATA').length})
                         </button>
                       </div>
                       
                       {/* TOMBOL EXCEL REKRUTMEN TERPROTEKSI */}
                       <div className="flex gap-2">
                          {hasPermission('hris', 'export') && (
                            <button onClick={exportCandidatesExcel} className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-2 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1"><Download size={14}/> Export Data Pelamar</button>
                          )}
                          
                          {hasPermission('hris', 'create') && (
                            <>
                              <input type="file" accept=".xlsx, .xls" ref={importCandRef} onChange={handleImportCandidatesExcel} className="hidden" />
                              <button onClick={() => importCandRef.current.click()} className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-2 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1"><Upload size={14}/> Import Massal (Offline)</button>
                            </>
                          )}
                       </div>
                    </div>

                    {/* TABEL PELAMAR */}
                    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                      <div className={`p-4 md:p-5 border-b border-slate-100 flex justify-between items-center ${rekrutmenSubTab === 'PENDING' ? 'bg-amber-50/30' : 'bg-indigo-50/30'}`}>
                        <h3 className={`font-bold text-sm md:text-base flex items-center gap-2 ${rekrutmenSubTab === 'PENDING' ? 'text-amber-900' : 'text-indigo-900'}`}>
                           {rekrutmenSubTab === 'PENDING' ? <><UserPlus size={18} className="text-amber-500"/> Daftar Pelamar Baru</> : <><FolderTree size={18} className="text-indigo-500"/> Arsip Bank Data</>}
                        </h3>
                      </div>
                      
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                            <tr><th className="px-6 py-4">Nama Pelamar</th><th className="px-6 py-4">Posisi & Divisi</th><th className="px-6 py-4">Kontak</th><th className="px-6 py-4 text-center">Tindakan HRD</th></tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-sm">
                            {candidates.filter(c => c.status === rekrutmenSubTab).map(cand => (
                              <tr key={cand.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4">
                                  <span className="font-bold text-slate-800 block">{cand.nama_lengkap}</span>
                                  <span className="text-[10px] font-black text-slate-400 tracking-wider">NIK: {cand.nik_karyawan}</span>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="font-bold text-slate-700 text-xs block">{cand.posisi_jabatan}</span>
                                  <span className="text-[10px] text-slate-500 font-semibold">{cand.bidang_jasa}</span>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="text-xs font-bold text-slate-600 block">{cand.no_hp}</span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <div className="flex justify-center gap-2">
                                    {rekrutmenSubTab === 'PENDING' ? (
                                      <>
                                        <button onClick={() => handleUpdateCandidateStatus(cand.id, 'BANK_DATA')} className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-xs font-bold transition-colors">Ke Bank Data</button>
                                        <button onClick={() => handleAcceptToEmployee(cand)} className="px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-colors">Angkat Karyawan</button>
                                      </>
                                    ) : (
                                      <>
                                        <button onClick={() => handleUpdateCandidateStatus(cand.id, 'PENDING')} className="px-3 py-1.5 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg text-xs font-bold transition-colors">Kembalikan</button>
                                        <button onClick={() => handleAcceptToEmployee(cand)} className="px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-colors">Angkat Karyawan</button>
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                            {candidates.filter(c => c.status === rekrutmenSubTab).length === 0 && (
                              <tr><td colSpan="4" className="text-center py-8 text-slate-400 font-bold bg-slate-50/50">Tidak ada pelamar di kategori ini.</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
                
                {hrisTab === 'database' && (
                  <div className="space-y-4 fade-in">
                    
                    {/* BARIS FILTER PENCARIAN */}
                    {/* BARIS FILTER PENCARIAN & TOMBOL EXCEL */}
                    <div className="bg-white p-4 border border-slate-100 rounded-2xl shadow-sm flex flex-col md:flex-row gap-3 justify-between">
                      <div className="flex gap-2 flex-1">
                        <div className="relative flex-1 max-w-xs">
                          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input type="text" placeholder="Cari Karyawan..." value={searchDbQuery} onChange={e => setSearchDbQuery(e.target.value)} className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#0a195c]"/>
                        </div>
                        <select value={filterDbDivisi} onChange={e => setFilterDbDivisi(e.target.value)} className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#0a195c] font-semibold text-slate-600 hidden md:block">
                          <option value="Semua">Semua Divisi</option>
                          {[...new Set(employees.map(e => e.bidang_jasa).filter(Boolean))].map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>

                      {/* TOMBOL EXCEL (Export / Import) */}
                      <div className="flex gap-2 shrink-0">
                        {hasPermission('hris', 'export') && (
                          <button onClick={exportEmployeesExcel} className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"><Download size={14}/> Export XLSX</button>
                        )}
                        {hasPermission('hris', 'edit') && (
                          <>
                            <input type="file" accept=".xlsx, .xls" ref={importEmpRef} onChange={handleImportEmployeesExcel} className="hidden" />
                            <button onClick={() => importEmpRef.current.click()} className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 px-3 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"><Upload size={14}/> Import / Update Data</button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* BARIS MASS ACTION (MUNCUL OTOMATIS JIKA ADA CHECKBOX YANG DIPILIH) */}
                    {selectedEmployees.length > 0 && (
                      <div className="bg-[#0a195c] p-3 rounded-2xl shadow-lg flex flex-col md:flex-row justify-between items-center gap-4 animate-in slide-in-from-top-2">
                        <div className="flex items-center gap-3 px-2">
                          <div className="bg-blue-500/30 text-blue-100 px-3 py-1 rounded-lg font-black text-sm">{selectedEmployees.length} Pegawai</div>
                          <span className="text-white text-xs font-medium">Siap diproses</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {hasPermission('hris', 'edit') && (
                            <>
                              <select value={massActionTarget} onChange={e => setMassActionTarget(e.target.value)} className="px-3 py-2 bg-white/10 border border-white/20 text-white rounded-lg text-xs outline-none focus:bg-white focus:text-slate-800 transition-colors">
                                <option value="" className="text-slate-800">-- Pindah ke Penempatan Baru --</option>
                                {[...new Set(employees.map(e => e.lokasi_penempatan).filter(Boolean))].map(l => <option key={l} value={l} className="text-slate-800">{l}</option>)}
                              </select>
                              <button onClick={() => handleMassAction('move')} className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"><ArrowUpRight size={14}/> Eksekusi Pindah</button>
                              <div className="w-px h-6 bg-white/20 mx-1"></div>
                              <button onClick={() => handleMassAction('deactivate')} className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"><UserX size={14}/> Nonaktifkan</button>
                            </>
                          )}
                          
                          {hasPermission('hris', 'delete') && (
                            <button onClick={() => handleMassAction('delete')} className="bg-rose-500 hover:bg-rose-600 text-white px-3 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"><Trash2 size={14}/> Hapus</button>
                          )}
                          
                          {(!hasPermission('hris', 'edit') && !hasPermission('hris', 'delete')) && (
                            <span className="text-white/60 text-xs italic">Anda hanya memiliki akses View (Lihat).</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* DAFTAR KARYAWAN (DIKELOMPOKKAN BERDASARKAN PENEMPATAN) */}
                    <div className="space-y-3 pb-10">
                      {(() => {
                        // 1. Jalankan fungsi filter
                        const filteredDbEmployees = employees.filter(e => {
                          const matchQuery = (e.nama_lengkap || '').toLowerCase().includes(searchDbQuery.toLowerCase()) || (e.nik_karyawan || '').toLowerCase().includes(searchDbQuery.toLowerCase());
                          const matchJabatan = filterDbJabatan === 'Semua' || e.posisi_jabatan === filterDbJabatan;
                          const matchDivisi = filterDbDivisi === 'Semua' || e.bidang_jasa === filterDbDivisi;
                          return matchQuery && matchJabatan && matchDivisi;
                        });

                        // 2. Kelompokkan berdasarkan Lokasi Penempatan
                        const groupedEmployees = filteredDbEmployees.reduce((acc, emp) => {
                          const loc = emp.lokasi_penempatan || 'Belum Ada Penempatan';
                          if (!acc[loc]) acc[loc] = [];
                          acc[loc].push(emp);
                          return acc;
                        }, {});

                        if (Object.keys(groupedEmployees).length === 0) return <div className="text-center py-10 bg-white rounded-2xl border border-slate-100 text-slate-400 font-bold">Tidak ada data karyawan yang cocok dengan filter.</div>;

                        // 3. Render folder per lokasi
                        return Object.keys(groupedEmployees).map(loc => {
                          const locEmployees = groupedEmployees[loc];
                          const isAllSelected = locEmployees.length > 0 && locEmployees.every(e => selectedEmployees.includes(e.id));
                          const isExpanded = expandedLocations[loc] !== false; // Bawaan: Terbuka

                          return (
                            <div key={loc} className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden transition-all">
                              <div onClick={() => toggleLocationAccordion(loc)} className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between cursor-pointer hover:bg-blue-50/50 transition-colors">
                                <h3 className="font-black text-slate-700 text-sm flex items-center gap-2 uppercase tracking-wide">
                                  <FolderTree size={18} className="text-blue-500"/> Penempatan: {loc} 
                                  <span className="ml-2 bg-blue-100 text-blue-600 px-2.5 py-0.5 rounded-md text-[10px] font-black">{locEmployees.length} Pegawai</span>
                                </h3>
                                <ChevronRight size={18} className={`text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} />
                              </div>
                              
                              {isExpanded && (
                                <div className="overflow-x-auto">
                                  <table className="w-full text-left">
                                    <thead className="bg-white border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                      <tr>
                                        <th className="px-6 py-4 w-10 text-center"><input type="checkbox" checked={isAllSelected} onChange={(e) => handleSelectAllInLocation(e.target.checked, locEmployees)} className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"/></th>
                                        <th className="px-6 py-4">NIK & Nama Pegawai</th>
                                        <th className="px-6 py-4">Divisi & Jabatan</th>
                                        <th className="px-6 py-4">Status & Akses</th>
                                        <th className="px-6 py-4 text-center">Aksi Individu</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-sm">
                                      {locEmployees.map(e => (
                                        <tr key={e.id} className={`hover:bg-slate-50 transition-colors ${selectedEmployees.includes(e.id) ? 'bg-blue-50/30' : ''}`}>
                                          <td className="px-6 py-4 text-center"><input type="checkbox" checked={selectedEmployees.includes(e.id)} onChange={() => handleSelectEmployee(e.id)} className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"/></td>
                                          <td className="px-6 py-4">
                                            <span className="text-[10px] font-black text-slate-400 block mb-0.5 tracking-wider">{e.nik_karyawan || 'NO-NIK'}</span>
                                            <span className="font-bold text-slate-800 block">{e.nama_lengkap}</span>
                                          </td>
                                          <td className="px-6 py-4">
                                            <span className="font-bold text-slate-700 block text-xs">{e.bidang_jasa || '-'}</span>
                                            <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded inline-block mt-1">{e.posisi_jabatan || '-'}</span>
                                          </td>
                                          <td className="px-6 py-4">
                                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border inline-block mb-1 ${e.status_pegawai === 'NONAKTIF' ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>{e.status_pegawai || 'AKTIF'}</span>
                                            <div className="flex gap-1">
                                              {e.has_mobile_access && <span title="Memiliki Akses Mobile App" className="w-5 h-5 bg-blue-100 text-blue-600 rounded flex items-center justify-center"><CheckCircle2 size={12}/></span>}
                                            </div>
                                          </td>
                                          <td className="px-6 py-4 text-center">
                                            <button onClick={() => {
                                                // Siapkan data, pastikan personal_data tidak null
                                                setEmpForm({
                                                  ...e, 
                                                  personal_data: typeof e.personal_data === 'string' ? JSON.parse(e.personal_data) : (e.personal_data || {})
                                                });
                                                setEmpDetailMode('view');
                                                setIsEmpDetailOpen(true);
                                            }} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 rounded-lg text-xs font-bold transition-all shadow-sm">Detail / Edit</button>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* PUSAT APPROVAL (BARU) */}
            {activeMenu === 'approval' && (
              <div className="space-y-6 fade-in">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Pusat Approval</h2>
                    <p className="text-slate-500 text-sm mt-1">Review dan setujui pengajuan karyawan secara terpusat.</p>
                  </div>
                </div>

                {/* TABS APPROVAL */}
                <div className="flex overflow-x-auto hide-scrollbar p-1.5 bg-slate-200/50 rounded-xl w-full">
                  <button onClick={() => setApprovalTab('pengajuan')} className={`flex-1 min-w-[150px] py-2.5 px-4 whitespace-nowrap text-sm font-semibold rounded-lg transition-all flex justify-center items-center gap-2 ${approvalTab === 'pengajuan' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}>
                    <FileText size={16}/> Izin & Cuti
                    {leaveRequests.filter(r => r.status === 'PENDING').length > 0 && (
                      <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{leaveRequests.filter(r => r.status === 'PENDING').length}</span>
                    )}
                  </button>
                  <button onClick={() => setApprovalTab('finance')} className={`flex-1 min-w-[150px] py-2.5 px-4 whitespace-nowrap text-sm font-semibold rounded-lg transition-all flex justify-center items-center gap-2 ${approvalTab === 'finance' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}>
                    <Wallet size={16}/> Finance & Reimburse
                    {reimbursements.filter(r => r.status === 'PENDING').length > 0 && (
                      <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{reimbursements.filter(r => r.status === 'PENDING').length}</span>
                    )}
                  </button>
                  <button onClick={() => setApprovalTab('koreksi')} className={`flex-1 min-w-[150px] py-2.5 px-4 whitespace-nowrap text-sm font-semibold rounded-lg transition-all flex justify-center items-center gap-2 ${approvalTab === 'koreksi' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}>
                    <Clock size={16}/> Koreksi Absen
                    {attendanceCorrections.filter(r => r.status === 'PENDING').length > 0 && (
                      <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{attendanceCorrections.filter(r => r.status === 'PENDING').length}</span>
                    )}
                  </button>
                </div>

                {/* TAB PENGAJUAN IZIN & CUTI */}
                {approvalTab === 'pengajuan' && (
                  <div className="space-y-6">
                    {/* BAGIAN 1: MENUNGGU APPROVAL (PENDING) */}
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                      <div className="p-4 bg-amber-50/50 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="font-bold text-amber-900 text-sm flex items-center gap-2"><Clock size={16} className="text-amber-500"/> Butuh Persetujuan (Pending)</h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                            <tr><th className="px-6 py-4">Tgl Pengajuan</th><th className="px-6 py-4">Karyawan</th><th className="px-6 py-4">Detail Pengajuan</th><th className="px-6 py-4 text-center">Aksi</th></tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-sm">
                            {leaveRequests.filter(r => r.status === 'PENDING').map(req => (
                              <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 font-bold text-slate-600">{new Date(req.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                <td className="px-6 py-4 font-bold text-slate-800">{req.employees?.nama_lengkap || 'Unknown'}</td>
                                <td className="px-6 py-4">
                                  <div className="flex flex-col gap-1">
                                    <span className={`text-[10px] font-black w-max px-2 py-0.5 rounded uppercase ${req.request_type === 'CUTI' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                      {req.request_type} - {req.category}
                                    </span>
                                    <span className="font-bold text-slate-700 text-xs">Mulai: {req.start_date} s/d {req.end_date}</span>
                                    <span className="text-xs text-slate-500 mt-1 line-clamp-2">"{req.reason}"</span>
                                    {req.attachment_url && <a href={req.attachment_url} target="_blank" rel="noreferrer" className="text-[10px] text-blue-500 hover:underline font-bold mt-1 inline-block">Lihat Lampiran</a>}
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  {hasPermission('approval', 'approve') ? (
                                    <div className="flex justify-center gap-2">
                                      {/* Biarkan isi tombol ACC/Tolak bawaannya di sini */}
                                      <button onClick={() => handleUpdateLeaveStatus(req.id, 'APPROVED')} className="flex items-center gap-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 px-3 py-2 rounded-lg text-xs font-bold transition-colors border border-emerald-100"><Check size={14}/> Setujui</button>
                                      <button onClick={() => handleUpdateLeaveStatus(req.id, 'REJECTED')} className="flex items-center gap-1 bg-rose-50 text-rose-600 hover:bg-rose-100 px-3 py-2 rounded-lg text-xs font-bold transition-colors border border-rose-100"><XCircle size={14}/> Tolak</button>
                                    </div>
                                  ) : (
                                    <span className="text-[10px] text-slate-400 italic">Hanya Lihat</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                            {leaveRequests.filter(r => r.status === 'PENDING').length === 0 && (
                              <tr><td colSpan="4" className="text-center py-8 text-slate-400 font-bold bg-slate-50/50">Yey! Tidak ada pengajuan yang mengantri.</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB FINANCE & REIMBURSE */}
                {approvalTab === 'finance' && (
                  <div className="space-y-6">
                    {/* BAGIAN 1: PENDING REIMBURSE */}
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                      <div className="p-4 bg-blue-50/50 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="font-bold text-blue-900 text-sm flex items-center gap-2"><CreditCard size={16} className="text-blue-500"/> Pencairan Menunggu Approval</h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                            <tr><th className="px-6 py-4">Tgl Nota</th><th className="px-6 py-4">Karyawan</th><th className="px-6 py-4">Rincian Biaya</th><th className="px-6 py-4 text-center">Aksi</th></tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-sm">
                            {reimbursements.filter(r => r.status === 'PENDING').map(req => (
                              <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 font-bold text-slate-600">{new Date(req.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                <td className="px-6 py-4 font-bold text-slate-800">{req.employees?.nama_lengkap || 'Unknown'}</td>
                                <td className="px-6 py-4">
                                  <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-black w-max px-2 py-0.5 rounded uppercase bg-indigo-100 text-indigo-700">{req.category}</span>
                                    <span className="font-black text-slate-800 text-sm">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(req.amount)}</span>
                                    <span className="text-xs text-slate-500 line-clamp-2">"{req.description}"</span>
                                    {req.receipt_url && <a href={req.receipt_url} target="_blank" rel="noreferrer" className="text-[10px] text-blue-500 hover:underline font-bold mt-1 inline-flex items-center gap-1"><ArrowUpRight size={12}/> Cek Struk Asli</a>}
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <div className="flex justify-center gap-2">
                                    <button onClick={() => handleUpdateReimburseStatus(req.id, 'APPROVED')} className="flex items-center gap-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 px-3 py-2 rounded-lg text-xs font-bold transition-colors border border-emerald-100"><Check size={14}/> Cairkan</button>
                                    <button onClick={() => handleUpdateReimburseStatus(req.id, 'REJECTED')} className="flex items-center gap-1 bg-rose-50 text-rose-600 hover:bg-rose-100 px-3 py-2 rounded-lg text-xs font-bold transition-colors border border-rose-100"><XCircle size={14}/> Tolak</button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                            {reimbursements.filter(r => r.status === 'PENDING').length === 0 && (
                              <tr><td colSpan="4" className="text-center py-8 text-slate-400 font-bold bg-slate-50/50">Tidak ada pengajuan reimbursement.</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB KOREKSI ABSEN */}
                {approvalTab === 'koreksi' && (
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-4 bg-amber-50/50 border-b border-slate-100 flex items-center justify-between"><h3 className="font-bold text-amber-900 text-sm flex items-center gap-2"><Clock size={16} className="text-amber-500"/> Permintaan Perbaikan Absen (Pending)</h3></div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                          <tr><th className="px-6 py-4">Tgl Absen</th><th className="px-6 py-4">Karyawan</th><th className="px-6 py-4">Usulan Jam</th><th className="px-6 py-4">Alasan</th><th className="px-6 py-4 text-center">Aksi</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                          {attendanceCorrections.filter(r => r.status === 'PENDING').map(req => (
                            <tr key={req.id} className="hover:bg-slate-50">
                              <td className="px-6 py-4 font-bold text-slate-600">{new Date(req.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                              <td className="px-6 py-4 font-bold text-slate-800">{req.employees?.nama_lengkap || 'Unknown'}</td>
                              <td className="px-6 py-4">
                                {req.correction_type === 'OUT' ? <span className="text-rose-600 font-bold block text-xs">OUT Baru: {req.time_out?.substring(0,5)}</span> :
                                 req.correction_type === 'IN' ? <span className="text-emerald-600 font-bold block text-xs">IN Baru: {req.time_in?.substring(0,5)}</span> :
                                 <span className="text-blue-600 font-bold block text-xs">IN: {req.time_in?.substring(0,5)} | OUT: {req.time_out?.substring(0,5)}</span>}
                              </td>
                              <td className="px-6 py-4 text-xs font-medium text-slate-600">"{req.reason}"</td>
                              <td className="px-6 py-4 text-center">
                                <div className="flex justify-center gap-2">
                                  <button onClick={() => handleUpdateCorrectionStatus(req.id, 'APPROVED')} className="flex items-center gap-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 px-3 py-2 rounded-lg text-xs font-bold border border-emerald-100"><Check size={14}/> ACC</button>
                                  <button onClick={() => handleUpdateCorrectionStatus(req.id, 'REJECTED')} className="flex items-center gap-1 bg-rose-50 text-rose-600 hover:bg-rose-100 px-3 py-2 rounded-lg text-xs font-bold border border-rose-100"><XCircle size={14}/> Tolak</button>
                                </div>
                              </td>
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
                
                {/* 1. HEADER TITLE */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Finance & Accounting</h2>
                    <p className="text-slate-500 text-sm mt-1">Kelola arus kas, penggajian, dan tagihan invoice perusahaan secara terintegrasi.</p>
                  </div>
                </div>

                {/* 2. DYNAMIC OVERVIEW DENGAN DATA REAL DATABASE (SEKARANG PERMANEN DI ATAS NAV BAR) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in duration-300">
                  <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-lg flex flex-col justify-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 blur-2xl rounded-full -translate-y-1/2 translate-x-1/2"></div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">Saldo Kas Aktif (Global)</span>
                    <h3 className="text-3xl font-black text-emerald-400">{formatRupiah(globalBalance)}</h3>
                    <p className="text-[9px] text-slate-400 mt-3 border-t border-slate-800 pt-2 leading-relaxed">Total Akumulasi Seluruh Pemasukan dikurangi Pengeluaran.</p>
                  </div>
                  
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-center relative overflow-hidden">
                    <div className="absolute right-6 opacity-10"><TrendingUp size={48} className="text-blue-500"/></div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">Pemasukan (Bulan Ini)</span>
                    <h3 className="text-2xl font-black text-slate-800">{formatRupiah(monthIncome)}</h3>
                    <p className="text-[9px] text-slate-500 mt-3 border-t border-slate-100 pt-2 leading-relaxed">Total arus kas masuk (INCOME) pada periode bulan terpilih.</p>
                  </div>
                  
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-center relative overflow-hidden">
                    <div className="absolute right-6 opacity-10"><TrendingDown size={48} className="text-rose-500"/></div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">Pengeluaran (Bulan Ini)</span>
                    <h3 className="text-2xl font-black text-slate-800">{formatRupiah(monthExpense)}</h3>
                    <p className="text-[9px] text-slate-500 mt-3 border-t border-slate-100 pt-2 leading-relaxed">Total biaya operasional & penggajian (EXPENSE) pada bulan terpilih.</p>
                  </div>
                </div>

                {/* 3. NAV BAR TAB FINANCE (Disesuaikan Menjadi 3 Kontrol Utama) */}
                <div className="flex overflow-x-auto hide-scrollbar p-1.5 bg-slate-200/50 rounded-xl w-full">
                  {[
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

                {/* 4. ISI KONTEN SUB-MODUL FINANCE */}
                {financeTab === 'cashflow' && (
                  <div className="space-y-6 fade-in">
                    <div className="bg-white p-4 border border-slate-200 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                      <div className="flex items-center gap-3 w-full md:w-auto">
                        <span className="text-sm font-bold text-slate-500">Bulan Laporan:</span>
                        <input type="month" value={cashflowPeriod} onChange={e => setCashflowPeriod(e.target.value)} className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-[#0a195c] outline-none focus:border-blue-500 flex-1 md:flex-none" />
                      </div>
                      <div className="flex flex-wrap gap-2 w-full md:w-auto">
                        {/* TOMBOL PDF BARU */}
                        {hasPermission('finance', 'export') && (
                          <button onClick={() => handleDownloadPDF('cashflow-pdf-report', `Laporan_Kas_${appConfig.name}_${cashflowPeriod}.pdf`)} className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 w-full md:w-auto">
                            <Download size={14}/> Cetak PDF Laporan
                          </button>
                        )}
                        {hasPermission('finance', 'create') && (
                          <>
                            <button onClick={() => { setCashflowForm({ id: null, type: 'INCOME', category: 'Pendapatan', amount: '', date: new Date().toISOString().split('T')[0], description: '', reference_number: '' }); setIsCashflowModalOpen(true); }} className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-4 py-2 rounded-xl text-xs font-bold transition-all border border-emerald-200 flex-1 md:flex-none flex items-center justify-center gap-2"><Plus size={14}/> Catat Pemasukan</button>
                            <button onClick={() => { setShiftForm({ id: null, employee_id: '', date: '', shift_type: 'Pagi', time_in: '08:00', time_out: '17:00' }); setCashflowForm({ id: null, type: 'EXPENSE', category: 'Operasional', amount: '', date: new Date().toISOString().split('T')[0], description: '', reference_number: '' }); setIsCashflowModalOpen(true); }} className="bg-rose-50 hover:bg-rose-100 text-rose-700 px-4 py-2 rounded-xl text-xs font-bold transition-all border border-rose-200 flex-1 md:flex-none flex items-center justify-center gap-2"><Plus size={14}/> Catat Pengeluaran</button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                            <tr><th className="px-6 py-4">Tgl & Ref</th><th className="px-6 py-4">Kategori & Keterangan</th><th className="px-6 py-4">Tipe Transaksi</th><th className="px-6 py-4">Nominal</th><th className="px-6 py-4 text-center">Aksi</th></tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-sm">
                            {currentMonthCashflows.map(cf => (
                              <tr key={cf.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4">
                                  <span className="font-bold text-slate-700 block">{cf.date}</span>
                                  <span className="text-[10px] font-medium text-slate-400">Ref: {cf.reference_number || '-'}</span>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="font-bold text-slate-800 block text-xs">{cf.category}</span>
                                  <span className="text-[11px] text-slate-500">{cf.description}</span>
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${cf.type === 'INCOME' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>{cf.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran'}</span>
                                </td>
                                <td className="px-6 py-4 font-black text-slate-700">{formatRupiah(cf.amount)}</td>
                                <td className="px-6 py-4 text-center">
                                  <div className="flex justify-center gap-2">
                                    {hasPermission('finance', 'edit') && <button onClick={() => { setCashflowForm(cf); setIsCashflowModalOpen(true); }} className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"><FileText size={14}/></button>}
                                    {hasPermission('finance', 'delete') && <button onClick={() => handleDeleteCashflow(cf.id)} className="p-1.5 bg-rose-50 text-rose-600 rounded hover:bg-rose-100"><Trash2 size={14}/></button>}
                                  </div>
                                </td>
                              </tr>
                            ))}
                            {currentMonthCashflows.length === 0 && <tr><td colSpan="5" className="text-center py-10 text-slate-400 font-bold bg-slate-50/50">Tidak ada riwayat transaksi pada periode ini.</td></tr>}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {financeTab === 'payroll' && (
                  <div className="space-y-6 fade-in">
                    <div className="bg-rose-50/50 border border-rose-100 p-4 rounded-2xl shadow-sm">
                      <p className="text-[10px] font-black text-rose-800 uppercase tracking-widest mb-3 flex items-center gap-2"><Clock size={14}/> Pengaturan Tarif Potongan Kehadiran (Opsional)</p>
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                          <label className="block text-[10px] font-bold text-rose-600 mb-1">Potongan Telat per Menit (Rp)</label>
                          <input type="number" placeholder="Cth: 1000" value={penaltyRates.latePerMinute || ''} onChange={e => setPenaltyRates(p => ({...p, latePerMinute: Number(e.target.value)}))} className="w-full px-3 py-2 border border-rose-200 rounded-lg focus:border-rose-400 text-xs font-bold bg-white text-rose-900"/>
                        </div>
                        <div className="flex-1">
                          <label className="block text-[10px] font-bold text-rose-600 mb-1">Potongan Mangkir per Hari (Rp)</label>
                          <input type="number" placeholder="Cth: 100000" value={penaltyRates.absencePerDay || ''} onChange={e => setPenaltyRates(p => ({...p, absencePerDay: Number(e.target.value)}))} className="w-full px-3 py-2 border border-rose-200 rounded-lg focus:border-rose-400 text-xs font-bold bg-white text-rose-900"/>
                        </div>
                        <div className="flex-1 flex items-end">
                           <p className="text-[9px] text-rose-500 italic pb-2">*Tarif ini akan otomatis dimasukkan saat Anda mengunduh Template Excel maupun Input Manual.</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-4 border border-slate-200 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                      <div className="flex items-center gap-3 w-full md:w-auto">
                        <span className="text-sm font-bold text-slate-500">Periode Gaji:</span>
                        <input type="month" value={payrollPeriod} onChange={e => setPayrollPeriod(e.target.value)} className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-emerald-700 outline-none focus:border-emerald-500 flex-1 md:flex-none" />
                      </div>

                      <div className="flex flex-wrap gap-2 w-full md:w-auto">
                        {hasPermission('finance', 'export') && (
                          <button onClick={downloadTemplatePayroll} className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 flex-1 md:flex-none justify-center">
                             Unduh Template Excel
                          </button>
                        )}
                        {hasPermission('finance', 'create') && (
                          <>
                            <input type="file" accept=".xlsx, .xls" ref={importPayrollRef} onChange={handleImportPayroll} className="hidden" />
                            <button onClick={() => importPayrollRef.click()} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 flex-1 md:flex-none justify-center">
                               <RefreshCw size={14}/> Import Data Excel
                            </button>
                            <button onClick={() => {
                              setPayrollForm({ employee_id: '', basic_salary: 0, additions: [], deductions: [] });
                              setIsPayrollModalOpen(true);
                            }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 flex-1 md:flex-none justify-center">
                              <Plus size={14}/> Buat Manual
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                            <tr>
                              <th className="px-6 py-4">Karyawan & Integrasi HRIS</th>
                              <th className="px-6 py-4">Pendapatan Bruto</th>
                              <th className="px-6 py-4">PPh 21 & Potongan</th>
                              <th className="px-6 py-4">Gaji Bersih (Netto)</th>
                              <th className="px-6 py-4 text-center">Status / Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-sm">
                            {payrolls.filter(p => p.period === payrollPeriod).map(pay => {
                              const emp = employees.find(e => e.id === pay.employee_id);
                              return (
                              <tr key={pay.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4">
                                  <span className="font-bold text-slate-800 block">{emp?.nama_lengkap || 'Unknown'}</span>
                                  <span className="text-[10px] font-semibold text-slate-500 block">NIK: {emp?.nik_karyawan}</span>
                                  <div className="flex gap-2 mt-1">
                                    <span className="text-[9px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-black border border-blue-100">{pay.total_work_days} Hari Masuk</span>
                                    <span className="text-[9px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-black border border-blue-100">{pay.total_work_hours} Jam Kerja</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="font-bold text-slate-700">{formatRupiah(pay.gross_salary)}</span>
                                  <span className="block text-[10px] text-slate-500 mt-1">(Gaji Pokok + {pay.additions?.length || 0} Komponen)</span>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="font-bold text-rose-600 block flex items-center gap-1">
                                    Pajak: {formatRupiah(pay.tax_pph21)}
                                  </span>
                                  <span className="block text-[10px] text-slate-500 mt-1">Lainnya: {formatRupiah(pay.deductions?.reduce((sum, item) => sum + item.amount, 0))}</span>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="font-black text-emerald-600 text-base bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                                    {formatRupiah(pay.net_salary)}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <button onClick={() => setSelectedPayslip({ ...pay, employee: emp })} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 mx-auto">
                                    <FileText size={14}/> Payslip
                                  </button>
                                </td>
                              </tr>
                            )})}
                            {payrolls.filter(p => p.period === payrollPeriod).length === 0 && (
                              <tr><td colSpan="5" className="text-center py-10 text-slate-400 font-bold bg-slate-50/50">Belum ada perhitungan gaji untuk periode ini.<br/><span className="text-xs font-normal">Silakan Unduh Template lalu Import Data untuk menghitung.</span></td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {financeTab === 'invoice' && (
                  <div className="space-y-6 fade-in">
                    <div className="flex justify-between items-center bg-white p-4 border border-slate-200 rounded-2xl shadow-sm">
                      <div>
                        <h3 className="font-bold text-slate-800 text-sm">Manajemen Piutang & Tagihan</h3>
                        <p className="text-[10px] text-slate-500">Buat, lacak, dan konversi invoice langsung ke pendapatan kas.</p>
                      </div>
                      {hasPermission('finance', 'create') && (
                        <button onClick={() => {
                          setInvoiceForm({ id: null, invoice_number: `INV-${Date.now().toString().slice(-6)}`, client_name: '', date: new Date().toISOString().split('T')[0], due_date: '', items: [{ desc: '', qty: 1, price: 0 }], tax_rate: 11, discount: 0, status: 'UNPAID', notes: '' });
                          setIsInvoiceModalOpen(true);
                        }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2"><Plus size={14}/> Buat Invoice</button>
                      )}
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                            <tr><th className="px-6 py-4">No. Invoice & Klien</th><th className="px-6 py-4">Timeline</th><th className="px-6 py-4">Total Tagihan</th><th className="px-6 py-4">Status Pembayaran</th><th className="px-6 py-4 text-center">Aksi</th></tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-sm">
                            {invoices.map(inv => (
                              <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4">
                                  <span className="font-black text-slate-800 block">{inv.invoice_number}</span>
                                  <span className="text-xs font-bold text-slate-500">{inv.client_name}</span>
                                </td>
                                <td className="px-6 py-4 text-xs font-medium text-slate-600">
                                  <span className="block mb-1">Diterbitkan: {inv.date}</span>
                                  <span className="block text-rose-600 font-bold">Jatuh Tempo: {inv.due_date}</span>
                                </td>
                                <td className="px-6 py-4 font-black text-slate-800">{formatRupiah(inv.total)}</td>
                                <td className="px-6 py-4">
                                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${inv.status === 'PAID' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : inv.status === 'UNPAID' ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>{inv.status}</span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  {hasPermission('finance', 'edit') && inv.status !== 'PAID' && (
                                    <div className="flex justify-center gap-2">
                                      <button onClick={() => {
                                        setInvoiceForm({ ...inv, items: typeof inv.items === 'string' ? JSON.parse(inv.items) : inv.items });
                                        setIsInvoiceModalOpen(true);
                                      }} className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100">Edit</button>
                                      <button onClick={() => handleUpdateInvoiceStatus(inv.id, 'PAID', inv.total, inv.client_name)} className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold hover:bg-emerald-100">Lunas</button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            ))}
                            {invoices.length === 0 && <tr><td colSpan="5" className="text-center py-10 text-slate-400 font-bold bg-slate-50/50">Belum ada tagihan terdaftar.</td></tr>}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* MANAJEMEN SHIFT & JADWAL */}
            {activeMenu === 'shift' && (
              <div className="flex flex-col h-full fade-in">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 shrink-0">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Manajemen Jadwal Shift</h2>
                    <p className="text-slate-500 text-sm mt-1">Atur jadwal kerja Karyawan, Satpam, atau Buruh (Mendukung lintas hari).</p>
                  </div>
                  <div className="flex gap-2">
                    {hasPermission('shift', 'create') && (
                      <>
                        <input type="file" accept=".xlsx, .xls" ref={importShiftRef} onChange={handleImportShift} className="hidden" />
                        <button onClick={() => { setShiftForm({ id: null, employee_id: '', start_date: '', end_date: '', shift_type: 'Pagi', time_in: '08:00', time_out: '17:00', is_bko: false }); setIsShiftModalOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2"><Plus size={14}/> Tambah Manual</button>
                        <button onClick={() => importShiftRef.current.click()} className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2"><Upload size={14}/> Import Jadwal (Excel)</button>
                      </>
                    )}
                    {hasPermission('shift', 'export') && (
                      <>
                        <button onClick={downloadTemplateShift} className="bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors">Unduh Template</button>
                        <button onClick={exportShiftExcel} className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-2"><Download size={14}/> Export Bulan Ini</button>
                      </>
                    )}
                  </div>
                </div>

                <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden flex flex-col flex-1 min-h-[400px]">
                  <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                     <h3 className="font-bold text-slate-700 text-sm">Daftar Jadwal</h3>
                     <input type="month" value={filterShiftBulan} onChange={e => setFilterShiftBulan(e.target.value)} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-[#0a195c] outline-none" />
                  </div>
                  <div className="overflow-y-auto custom-scrollbar flex-1">
                    <table className="w-full text-left">
                      <thead className="bg-white border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider sticky top-0 z-10">
                        <tr><th className="px-6 py-4">Tanggal</th><th className="px-6 py-4">Nama & NIK</th><th className="px-6 py-4">Shift</th><th className="px-6 py-4">Jadwal Wajib (IN - OUT)</th><th className="px-6 py-4 text-center">Aksi</th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {shifts.filter(s => s.date.startsWith(filterShiftBulan)).map(shift => (
                          <tr key={shift.id} className="hover:bg-slate-50">
                            <td className="px-6 py-4 font-bold text-slate-600">{new Date(shift.date).toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'short' })}</td>
                            <td className="px-6 py-4">
                              <span className="font-bold text-slate-800 block">{shift.employees?.nama_lengkap}</span>
                              <span className="text-[10px] text-slate-400 font-semibold">{shift.employees?.nik_karyawan}</span>
                            </td>
                            <td className="px-6 py-4"><span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-md border ${shift.shift_type === 'Libur' ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-indigo-50 text-indigo-600 border-indigo-200'}`}>{shift.shift_type}</span></td>
                            <td className="px-6 py-4 font-black text-slate-700">{shift.time_in ? shift.time_in.substring(0,5) : 'OFF'} <span className="text-slate-400 mx-1">-</span> {shift.time_out ? shift.time_out.substring(0,5) : 'OFF'}</td>
                            <td className="px-6 py-4 text-center">
                               {hasPermission('shift', 'edit') && (
                                  <button onClick={() => { setShiftForm({ id: shift.id, employee_id: shift.employee_id, start_date: shift.date, end_date: '', shift_type: shift.shift_type.replace(' (BKO)', ''), time_in: shift.time_in ? shift.time_in.substring(0,5) : '', time_out: shift.time_out ? shift.time_out.substring(0,5) : '', is_bko: shift.shift_type.includes('(BKO)') }); setIsShiftModalOpen(true); }} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 mr-2"><FileText size={16}/></button>
                               )}
                               {hasPermission('shift', 'delete') && (
                                  <button onClick={async () => { if(window.confirm('Hapus jadwal ini?')) { await supabase.from('employee_shifts').delete().eq('id', shift.id); fetchAllData(); } }} className="p-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100"><Trash2 size={16}/></button>
                               )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {shifts.filter(s => s.date.startsWith(filterShiftBulan)).length === 0 && <div className="text-center py-10 text-slate-400 font-bold">Belum ada jadwal yang di-import untuk bulan ini.</div>}
                  </div>
                </div>
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
                  {hasPermission('task', 'create') && (
                    <button onClick={() => setIsTaskModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2">
                      <Plus size={16}/> Buat Tugas Baru
                    </button>
                  )}
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

            {/* INFORMASI & INSTRUKSI */}
            {activeMenu === 'broadcast' && (
              <div className="flex flex-col h-full fade-in">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 shrink-0">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Informasi & Instruksi</h2>
                    <p className="text-slate-500 text-sm mt-1">Sebarkan pengumuman atau instruksi kerja (Target: Global, Cabang, atau Individu).</p>
                  </div>
                  {hasPermission('broadcast', 'create') && (
                    <button onClick={() => setIsBroadcastModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2">
                      <Plus size={16}/> Buat Instruksi Baru
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-10">
                  {instructions.map(inst => (
                    <div key={inst.id} className="bg-white p-5 rounded-[1.5rem] border border-slate-200 shadow-sm flex flex-col h-full relative">
                      {hasPermission('broadcast', 'delete') && (
                        <button onClick={() => handleDeleteBroadcast(inst.id, inst.attachment_path)} className="absolute top-4 right-4 text-slate-400 hover:text-rose-500 p-1.5 bg-slate-50 rounded-lg"><Trash2 size={16}/></button>
                      )}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold">{inst.employees?.nama_lengkap.substring(0,2).toUpperCase()}</div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{inst.employees?.nama_lengkap}</p>
                          <p className="text-[10px] text-slate-500 font-medium">{inst.employees?.posisi_jabatan} • {new Date(inst.created_at).toLocaleString('id-ID')}</p>
                        </div>
                      </div>
                      <div className="mb-3 flex gap-2">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase shadow-sm ${inst.broadcast_type === 'Informasi' ? 'bg-indigo-100 text-indigo-700' : 'bg-rose-100 text-rose-700'}`}>
                          {inst.broadcast_type || 'Instruksi'}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase shadow-sm ${inst.target_type === 'ALL' ? 'bg-blue-100 text-blue-700' : inst.target_type === 'LOCATION' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          Target: {inst.target_type === 'ALL' ? 'Semua Pegawai' : inst.target_type === 'LOCATION' ? `Cabang: ${inst.target_val}` : 'Perorangan'}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap flex-1">{inst.content}</p>
                      
                      {inst.attachment_url && (
                        <div className="mt-4 pt-3 border-t border-slate-100">
                          <a href={inst.attachment_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-slate-50 text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 px-3 py-2 rounded-lg text-xs font-bold transition-colors">
                            <FileText size={14}/> Lihat Lampiran File
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                  {instructions.length === 0 && <div className="col-span-2 p-10 text-center text-slate-400 font-bold">Belum ada pengumuman/instruksi.</div>}
                </div>

                {/* MODAL CREATE BROADCAST */}
                {isBroadcastModalOpen && (
                  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[80] flex justify-center items-center p-4">
                    <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in duration-300">
                      <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <h3 className="font-black text-lg text-slate-800">Buat Instruksi Baru</h3>
                        <button onClick={() => setIsBroadcastModalOpen(false)} className="p-2 bg-slate-200 text-slate-600 rounded-full hover:bg-slate-300"><X size={16}/></button>
                      </div>
                      <form onSubmit={handleCreateBroadcast} className="p-6 space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1.5">Jenis Pesan</label>
                          <select value={broadcastForm.broadcast_type} onChange={e => setBroadcastForm({...broadcastForm, broadcast_type: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-500">
                            <option value="Instruksi">Instruksi Kerja (Tugas/Perintah)</option>
                            <option value="Informasi">Informasi (Pengumuman Biasa)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1.5">Pilih Target Penerima</label>
                          <select value={broadcastForm.target_type} onChange={e => setBroadcastForm({...broadcastForm, target_type: e.target.value, target_val: ''})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-500">
                            <option value="ALL">Semua Karyawan (Global)</option>
                            <option value="LOCATION">Khusus Cabang / Lokasi Penempatan</option>
                            <option value="INDIVIDUAL">Khusus Perorangan (Individu)</option>
                          </select>
                        </div>
                        
                        {broadcastForm.target_type === 'LOCATION' && (
                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1.5">Pilih Cabang / Lokasi</label>
                            <select required value={broadcastForm.target_val} onChange={e => setBroadcastForm({...broadcastForm, target_val: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-500">
                              <option value="">-- Pilih Lokasi --</option>
                              {[...new Set(employees.map(e => e.lokasi_penempatan).filter(Boolean))].map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                          </div>
                        )}

                        {broadcastForm.target_type === 'INDIVIDUAL' && (
                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1.5">Pilih Karyawan</label>
                            <select required value={broadcastForm.target_val} onChange={e => setBroadcastForm({...broadcastForm, target_val: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-500">
                              <option value="">-- Pilih Karyawan --</option>
                              {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.nama_lengkap} ({emp.posisi_jabatan})</option>)}
                            </select>
                          </div>
                        )}

                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1.5">Isi Instruksi / Pengumuman</label>
                          <textarea required rows="4" value={broadcastForm.content} onChange={e => setBroadcastForm({...broadcastForm, content: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-500 resize-none"></textarea>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1.5">Lampiran (Opsional - PDF/Word/Excel/Foto)</label>
                          <input type="file" onChange={e => setBroadcastForm({...broadcastForm, file: e.target.files[0]})} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
                        </div>

                        <button type="submit" disabled={isSubmittingBroadcast} className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md disabled:opacity-50">
                          {isSubmittingBroadcast ? 'Mengirim...' : 'Kirim Instruksi'}
                        </button>
                      </form>
                    </div>
                  </div>
                )}
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
                      { id: 'laporan_custom', label: 'Laporan Menu Custom' }, // <-- BARIS BARU INI
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
                        
                        {/* ========================================================= */}
                        {/* 1. KONTEN TAB: LAPORAN LAPANGAN (PATROLI & REGULER) */}
                        {/* ========================================================= */}
                        {laporanTab === 'laporan_lapangan' && (
                          <>
                            <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
                              <div className="flex flex-col md:flex-row gap-2 flex-1 w-full">
                                <div className="relative flex-1">
                                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                  <input type="text" placeholder="Cari Nama Pelapor..." value={filterReportName} onChange={e => setFilterReportName(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-[#0a195c] transition-colors"/>
                                </div>
                                <input type="date" value={filterReportDate} onChange={e => setFilterReportDate(e.target.value)} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-[#0a195c] text-slate-500 transition-colors"/>
                                <select value={filterReportType} onChange={e => setFilterReportType(e.target.value)} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-[#0a195c] font-bold text-slate-600 transition-colors">
                                  <option value="Semua">Semua Tipe Laporan</option>
                                  <option value="patroli">Khusus Patroli</option>
                                  <option value="reguler">Khusus Reguler</option>
                                </select>
                              </div>
                              {/* TOMBOL EXPORT LAPORAN TERPROTEKSI */}
                              {hasPermission('laporan', 'export') && (
                                <button 
                                  onClick={exportLaporanExcel} 
                                  disabled={isExporting} 
                                  className={`px-4 py-2 rounded-lg text-xs font-bold border flex items-center gap-2 shrink-0 w-full md:w-auto justify-center transition-colors ${isExporting ? 'bg-emerald-200 text-emerald-800 border-emerald-300 cursor-wait' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200'}`}
                                >
                                  <Download size={14}/> {isExporting ? 'Menyisipkan Foto Laporan...' : 'Rekap Laporan (Excel)'}
                                </button>
                              )}
                            </div>
                            
                            <table className="w-full text-left">
                              <thead className="bg-white border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                <tr><th className="px-6 py-4 w-40">Tanggal Masuk</th><th className="px-6 py-4 w-56">Pelapor (Mobile App)</th><th className="px-6 py-4">Judul & Keterangan Laporan</th><th className="px-6 py-4 text-center w-24">Detail</th></tr>
                              </thead>
                              
                              {(() => {
                                const filteredReports = fieldReports.filter(r => {
                                  const matchTab = r.report_type === 'patroli' || r.report_type === 'reguler';
                                  const matchType = filterReportType === 'Semua' || r.report_type === filterReportType;
                                  const matchName = (r.employees?.nama_lengkap || '').toLowerCase().includes(filterReportName.toLowerCase());
                                  const matchTitle = (r.title || '').toLowerCase().includes(filterReportTitle.toLowerCase());
                                  const matchDate = filterReportDate === '' || r.created_at.startsWith(filterReportDate);
                                  return matchTab && matchType && matchName && matchTitle && matchDate;
                                });

                                if (filteredReports.length === 0) {
                                  return <tbody><tr><td colSpan="4" className="text-center py-12 text-slate-400 font-bold"><FileText size={32} className="mx-auto text-slate-200 mb-3"/>Tidak ada laporan yang cocok dengan filter.</td></tr></tbody>;
                                }

                                return filteredReports.map(report => {
                                  let parsedDesc = null;
                                  try { parsedDesc = JSON.parse(report.description); } catch (e) {}
                                  const isExpanded = expandedReportId === report.id;

                                  return (
                                    <tbody key={report.id} className="divide-y divide-slate-100 border-b border-slate-100 last:border-0">
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
                                          <span className="font-black text-blue-700 text-base flex items-center gap-2"><ShieldAlert size={18} className="text-blue-500"/> {report.title}</span>
                                        </td>
                                        <td className="px-6 py-4 align-middle text-center">
                                          <button className={`p-2 rounded-full transition-all ${isExpanded ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 hover:bg-slate-200 text-slate-500'}`}>
                                              <ChevronRight size={18} className={`transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} />
                                          </button>
                                        </td>
                                      </tr>
                                      
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
                                                          <p className="text-[11px] text-slate-700 font-medium leading-snug">{p.desc || <span className="italic text-slate-400">Tidak ada keterangan lampiran.</span>}</p>
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
                          </>
                          )}
                          {/* ========================================================= */}
                          {/* 1B. KONTEN TAB: LAPORAN MENU CUSTOM (DINAMIS)               */}
                          {/* ========================================================= */}
                          {laporanTab === 'laporan_custom' && (
                            <div className="animate-in fade-in">
                              <div className="p-4 border-b border-slate-100 bg-indigo-50/30 flex flex-col md:flex-row justify-between items-center gap-4">
                                <div className="flex flex-col md:flex-row gap-2 flex-1 w-full">
                                  <div className="relative flex-1">
                                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input type="text" placeholder="Cari Nama Karyawan..." value={filterCustomName} onChange={e => setFilterCustomName(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 transition-colors"/>
                                  </div>
                                  <input type="date" value={filterCustomDate} onChange={e => setFilterCustomDate(e.target.value)} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none text-slate-500 focus:border-indigo-500 transition-colors"/>
                                  <select value={filterCustomMenu} onChange={e => setFilterCustomMenu(e.target.value)} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none font-bold text-slate-600 focus:border-indigo-500 transition-colors">
                                    <option value="Semua">Semua Jenis Laporan / Menu</option>
                                    {customMenus.map(menu => (
                                      <option key={menu.id} value={menu.menu_name}>{menu.menu_name}</option>
                                    ))}
                                  </select>
                                </div>
                                {hasPermission('laporan', 'export') && (
                                  <button 
                                    onClick={exportCustomLaporanExcel} 
                                    disabled={isExporting} 
                                    className={`px-4 py-2 rounded-lg text-xs font-bold border flex items-center gap-2 shrink-0 w-full md:w-auto justify-center transition-colors ${isExporting ? 'bg-indigo-200 text-indigo-800 border-indigo-300 cursor-wait' : 'bg-indigo-600 text-white hover:bg-indigo-700 border-indigo-700'}`}
                                  >
                                    <Download size={14}/> {isExporting ? 'Proses Excel...' : 'Rekap Custom (Excel)'}
                                  </button>
                                )}
                              </div>
                              
                              <table className="w-full text-left">
                                <thead className="bg-white border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                  <tr><th className="px-6 py-4 w-40">Tanggal Masuk</th><th className="px-6 py-4 w-56">Pelapor</th><th className="px-6 py-4">Menu & Data Laporan Khusus</th><th className="px-6 py-4 text-center w-24">Detail</th></tr>
                                </thead>
                                
                                {(() => {
                                  const filteredCustomReports = fieldReports.filter(r => {
                                    const isCustom = r.report_type !== 'patroli' && r.report_type !== 'reguler';
                                    const matchName = (r.employees?.nama_lengkap || '').toLowerCase().includes(filterCustomName.toLowerCase());
                                    const matchDate = filterCustomDate === '' || r.created_at.startsWith(filterCustomDate);
                                    const matchMenu = filterCustomMenu === 'Semua' || r.report_type === filterCustomMenu;
                                    return isCustom && matchName && matchDate && matchMenu;
                                  });

                                  if (filteredCustomReports.length === 0) {
                                    return <tbody><tr><td colSpan="4" className="text-center py-12 text-slate-400 font-bold"><FileText size={32} className="mx-auto text-slate-200 mb-3"/>Tidak ada laporan custom yang cocok.</td></tr></tbody>;
                                  }

                                  return filteredCustomReports.map(report => {
                                    let parsedDesc = null;
                                    try { parsedDesc = JSON.parse(report.description); } catch (e) {}
                                    const isExpanded = expandedReportId === report.id;

                                    return (
                                      <tbody key={report.id} className="divide-y divide-slate-100 border-b border-slate-100 last:border-0">
                                        <tr onClick={() => setExpandedReportId(isExpanded ? null : report.id)} className={`hover:bg-slate-50 cursor-pointer transition-colors ${isExpanded ? 'bg-indigo-50/20' : ''}`}>
                                          <td className="px-6 py-4 align-top">
                                            <span className="font-bold text-slate-700 block">{new Date(report.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                            <span className="text-[10px] text-slate-500 font-bold mt-1.5 bg-slate-100 px-2.5 py-1 rounded-md inline-flex items-center gap-1"><Clock size={10}/> {new Date(report.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</span>
                                          </td>
                                          <td className="px-6 py-4 align-top font-bold text-slate-800">
                                            <div className="flex items-center gap-3">
                                              <div className="w-9 h-9 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-black shadow-inner shrink-0">
                                                {report.employees?.nama_lengkap ? report.employees.nama_lengkap.substring(0,2).toUpperCase() : '??'}
                                              </div>
                                              <span>{report.employees?.nama_lengkap || 'Unknown'}</span>
                                            </div>
                                          </td>
                                          <td className="px-6 py-4 align-middle">
                                            <span className="text-[10px] font-black uppercase tracking-widest bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md mb-1.5 inline-block">{report.report_type}</span>
                                            <span className="font-black text-slate-700 text-sm block">{report.title}</span>
                                          </td>
                                          <td className="px-6 py-4 align-middle text-center">
                                            <button className={`p-2 rounded-full transition-all ${isExpanded ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 hover:bg-slate-200 text-slate-500'}`}>
                                                <ChevronRight size={18} className={`transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} />
                                            </button>
                                          </td>
                                        </tr>
                                        
                                        {isExpanded && (
                                          <tr className="bg-slate-50/30">
                                            <td></td>
                                            <td colSpan="3" className="px-6 py-6 pb-10 border-l-2 border-indigo-300">
                                              {parsedDesc ? (
                                                <div className="space-y-5 max-w-4xl animate-in slide-in-from-top-4 fade-in duration-300">
                                                  {/* Rendering Struktur Laporan Dinamis */}
                                                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                                                    <h4 className="text-xs font-black text-indigo-800 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">Rincian Data Pengisian Form</h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                      {Object.entries(parsedDesc).map(([key, value]) => {
                                                        if(key === 'photos' || key === 'notes') return null; // Foto dihandle terpisah
                                                        return (
                                                          <div key={key} className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide block mb-1">{key}</span>
                                                            <span className="text-sm font-bold text-slate-800 break-words">{typeof value === 'boolean' ? (value ? 'Ya / Terpilih' : 'Tidak') : value.toString()}</span>
                                                          </div>
                                                        )
                                                      })}
                                                      {parsedDesc.notes && (
                                                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 md:col-span-2">
                                                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide block mb-1">Catatan Kesimpulan</span>
                                                          <span className="text-sm font-medium text-slate-700">{parsedDesc.notes}</span>
                                                        </div>
                                                      )}
                                                    </div>
                                                  </div>

                                                  {/* Rendering Foto Laporan Khusus */}
                                                  {parsedDesc.photos && parsedDesc.photos.length > 0 && (
                                                    <div className="flex flex-wrap gap-4">
                                                      {parsedDesc.photos.map((p, i) => (
                                                        <div key={i} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col w-56 group">
                                                          <div className="relative h-44 bg-slate-100 overflow-hidden">
                                                            <img src={p.url} alt="Lampiran Khusus" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                            <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-3">
                                                              <a href={p.url} target="_blank" rel="noreferrer" className="text-xs font-bold text-white flex items-center gap-1 hover:underline"><ArrowUpRight size={14}/> Full Resolusi</a>
                                                            </div>
                                                          </div>
                                                        </div>
                                                      ))}
                                                    </div>
                                                  )}
                                                </div>
                                              ) : (
                                                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm inline-block max-w-xl animate-in slide-in-from-top-4 fade-in">
                                                  <span className="text-sm text-slate-600 font-medium">{report.description}</span>
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
                          )}

                        {/* ========================================================= */}
                        {/* 2. KONTEN TAB: ARSIP PENGAJUAN CUTI & IZIN */}
                        {/* ========================================================= */}
                        {laporanTab === 'cuti' && (
                          <div className="overflow-x-auto animate-in fade-in">
                            <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
                              <div className="flex flex-col md:flex-row gap-2 flex-1 w-full">
                                 <input type="text" placeholder="Cari Karyawan..." value={filterCutiName} onChange={e => setFilterCutiName(e.target.value)} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400 flex-1" />
                                 <input type="date" value={filterCutiDate} onChange={e => setFilterCutiDate(e.target.value)} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none text-slate-500 flex-1 md:max-w-[200px]" />
                                 <select value={filterCutiStatus} onChange={e => setFilterCutiStatus(e.target.value)} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none font-bold text-slate-600 flex-1 md:max-w-[180px]">
                                   <option value="Semua">Semua Status</option><option value="PENDING">Menunggu</option><option value="APPROVED">Disetujui</option><option value="REJECTED">Ditolak</option>
                                 </select>
                              </div>
                              {/* Ganti tombolnya menjadi: */}
                              {hasPermission('laporan', 'export') && (
                                <button onClick={exportCutiExcel} className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-4 py-2 rounded-lg text-xs font-bold border border-emerald-200 flex items-center gap-2 shrink-0 w-full md:w-auto justify-center"><Download size={14}/> Export Excel</button>
                              )}
                            </div>
                            <table className="w-full text-left">
                              <thead className="bg-white border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                <tr><th className="px-6 py-4">Tgl Dibuat</th><th className="px-6 py-4">Karyawan</th><th className="px-6 py-4">Detail Pengajuan</th><th className="px-6 py-4">Status & Catatan</th></tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 text-sm">
                                {leaveRequests.map(req => (
                                  <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-slate-500">{new Date(req.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                    <td className="px-6 py-4 font-bold text-slate-800">{req.employees?.nama_lengkap || 'Unknown'}</td>
                                    <td className="px-6 py-4">
                                      <span className="font-bold text-slate-700 text-xs block">{req.request_type} - {req.category}</span>
                                      <span className="text-[10px] text-slate-500 font-semibold">{req.start_date} s/d {req.end_date}</span>
                                      {req.attachment_url && <a href={req.attachment_url} target="_blank" rel="noreferrer" className="text-[10px] text-blue-500 hover:underline font-bold mt-1 block">Lihat Lampiran</a>}
                                    </td>
                                    <td className="px-6 py-4">
                                      <span className={`text-[10px] font-black w-max px-2.5 py-1 rounded-md uppercase border ${req.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : req.status === 'REJECTED' ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                                        {req.status === 'PENDING' ? 'Menunggu' : req.status === 'APPROVED' ? 'Disetujui' : 'Ditolak'}
                                      </span>
                                      {req.admin_note && <span className="block mt-1.5 text-[11px] font-semibold text-slate-500 italic">"{req.admin_note}"</span>}
                                    </td>
                                  </tr>
                                ))}
                                {leaveRequests.length === 0 && <tr><td colSpan="4" className="text-center py-8 text-slate-400 font-bold bg-slate-50/50">Belum ada data arsip izin & cuti.</td></tr>}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* ========================================================= */}
                        {/* 3. KONTEN TAB: ARSIP REIMBURSEMENT */}
                        {/* ========================================================= */}
                        {laporanTab === 'reimburse' && (
                          <div className="overflow-x-auto animate-in fade-in">
                            <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
                              <div className="flex flex-col md:flex-row gap-2 flex-1 w-full">
                                 <input type="text" placeholder="Cari Karyawan..." value={filterRmName} onChange={e => setFilterRmName(e.target.value)} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400 flex-1" />
                                 <input type="date" value={filterRmDate} onChange={e => setFilterRmDate(e.target.value)} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none text-slate-500 flex-1 md:max-w-[200px]" />
                                 <select value={filterRmStatus} onChange={e => setFilterRmStatus(e.target.value)} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none font-bold text-slate-600 flex-1 md:max-w-[180px]">
                                   <option value="Semua">Semua Status</option><option value="PENDING">Menunggu</option><option value="APPROVED">Dicairkan</option><option value="REJECTED">Ditolak</option>
                                 </select>
                              </div>
                              {/* Ganti tombolnya menjadi: */}
                              {hasPermission('laporan', 'export') && (
                                <button onClick={exportReimburseExcel} className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-4 py-2 rounded-lg text-xs font-bold border border-emerald-200 flex items-center gap-2 shrink-0 w-full md:w-auto justify-center"><Download size={14}/> Rekap Excel</button>
                              )}
                            </div>
                            <table className="w-full text-left">
                              <thead className="bg-white border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                <tr><th className="px-6 py-4">Tgl Nota/Dibuat</th><th className="px-6 py-4">Karyawan</th><th className="px-6 py-4">Kategori & Biaya</th><th className="px-6 py-4">Status & Catatan</th></tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 text-sm">
                                {reimbursements.map(req => (
                                  <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-slate-500">{new Date(req.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                    <td className="px-6 py-4 font-bold text-slate-800">{req.employees?.nama_lengkap || 'Unknown'}</td>
                                    <td className="px-6 py-4">
                                      <span className="font-black text-slate-800 text-sm block">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(req.amount)}</span>
                                      <span className="text-[10px] text-slate-500 font-semibold">{req.category}</span>
                                      {req.receipt_url && <a href={req.receipt_url} target="_blank" rel="noreferrer" className="text-[10px] text-blue-500 hover:underline font-bold mt-1 block">Lihat Struk</a>}
                                    </td>
                                    <td className="px-6 py-4">
                                      <span className={`text-[10px] font-black w-max px-2.5 py-1 rounded-md uppercase border ${req.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : req.status === 'REJECTED' ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                                        {req.status === 'PENDING' ? 'Menunggu' : req.status === 'APPROVED' ? 'Dicairkan' : 'Ditolak'}
                                      </span>
                                      {req.admin_note && <span className="block mt-1.5 text-[11px] font-semibold text-slate-500 italic">"{req.admin_note}"</span>}
                                    </td>
                                  </tr>
                                ))}
                                {reimbursements.length === 0 && <tr><td colSpan="4" className="text-center py-8 text-slate-400 font-bold bg-slate-50/50">Belum ada data arsip pencairan.</td></tr>}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* ========================================================= */}
                        {/* 4. KONTEN TAB: ARSIP KOREKSI ABSEN */}
                        {/* ========================================================= */}
                        {laporanTab === 'koreksi' && (
                          <div className="overflow-x-auto animate-in fade-in">
                            <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
                              <div className="flex gap-2 flex-1 w-full">
                                 <input type="text" placeholder="Cari Karyawan..." value={filterKoreksiName} onChange={e => setFilterKoreksiName(e.target.value)} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400 flex-1" />
                                 <select value={filterKoreksiStatus} onChange={e => setFilterKoreksiStatus(e.target.value)} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none font-bold text-slate-600">
                                   <option value="Semua">Semua Status</option><option value="PENDING">Menunggu</option><option value="APPROVED">Disetujui</option><option value="REJECTED">Ditolak</option>
                                 </select>
                              </div>
                              {/* Ganti tombolnya menjadi: */}
                              {hasPermission('laporan', 'export') && (
                                <button onClick={exportKoreksiExcel} className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-4 py-2 rounded-lg text-xs font-bold border border-emerald-200 flex items-center gap-2 shrink-0 w-full md:w-auto justify-center"><Download size={14}/> Rekap History (Excel)</button>
                              )}
                            </div>
                            <table className="w-full text-left">
                              <thead className="bg-white border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                <tr><th className="px-6 py-4">Tgl Pengajuan</th><th className="px-6 py-4">Karyawan</th><th className="px-6 py-4">Detail Perbaikan</th><th className="px-6 py-4">Status & Catatan</th></tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 text-sm">
                                {attendanceCorrections.map(req => (
                                  <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-slate-500">{new Date(req.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                    <td className="px-6 py-4 font-bold text-slate-800">{req.employees?.nama_lengkap || 'Unknown'}</td>
                                    <td className="px-6 py-4">
                                      <span className="font-bold text-slate-700 text-xs block">Tgl Absen: {new Date(req.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                      {req.correction_type === 'OUT' ? <span className="text-rose-600 font-semibold block text-[10px] mt-0.5">Usulan OUT: {req.time_out?.substring(0,5)}</span> :
                                       req.correction_type === 'IN' ? <span className="text-emerald-600 font-semibold block text-[10px] mt-0.5">Usulan IN: {req.time_in?.substring(0,5)}</span> :
                                       <span className="text-blue-600 font-semibold block text-[10px] mt-0.5">Usulan IN: {req.time_in?.substring(0,5)} | OUT: {req.time_out?.substring(0,5)}</span>}
                                      <span className="text-[10px] text-slate-500 mt-1 block line-clamp-2">Alasan: "{req.reason}"</span>
                                    </td>
                                    <td className="px-6 py-4">
                                      <span className={`text-[10px] font-black w-max px-2.5 py-1 rounded-md uppercase border ${req.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : req.status === 'REJECTED' ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                                        {req.status === 'PENDING' ? 'Menunggu' : req.status === 'APPROVED' ? 'Disetujui' : 'Ditolak'}
                                      </span>
                                      {req.admin_note && <span className="block mt-1.5 text-[11px] font-semibold text-slate-500 italic">"{req.admin_note}"</span>}
                                    </td>
                                  </tr>
                                ))}
                                {attendanceCorrections.length === 0 && <tr><td colSpan="4" className="text-center py-8 text-slate-400 font-bold bg-slate-50/50">Belum ada data arsip perbaikan absen.</td></tr>}
                              </tbody>
                            </table>
                          </div>
                        )}
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

                {/* === KOTAK UPLOAD LOGO PERUSAHAAN === */}
                <div className="flex flex-col md:flex-row justify-between items-center bg-white p-5 rounded-2xl border border-slate-200 shadow-sm gap-4">
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className={`w-14 h-14 ${appConfig.color} rounded-xl flex items-center justify-center text-white font-bold shadow-inner overflow-hidden shrink-0 border border-slate-100`}>
                       {appConfig.logo_url ? <img src={appConfig.logo_url} alt="Logo" className="w-full h-full object-cover bg-white" /> : appConfig.short}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-base">{appConfig.name}</h3>
                      <p className="text-xs text-slate-500">Logo ini akan tampil di Login Page dan Dashboard Admin.</p>
                    </div>
                  </div>
                  {hasPermission('settings', 'edit') && (
                    <div className="shrink-0 w-full md:w-auto">
                       <input type="file" accept="image/png, image/jpeg" ref={companyLogoRef} onChange={handleUploadCompanyLogo} className="hidden" />
                       <button onClick={() => companyLogoRef.current.click()} disabled={isUploadingLogo} className="w-full md:w-auto bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border border-slate-200">
                         {isUploadingLogo ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />} 
                         {isUploadingLogo ? 'Mengunggah...' : 'Ganti Logo Perusahaan'}
                       </button>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 border-b border-slate-200 pb-px">
                   <button onClick={() => setSettingTab('roles')} className={`px-5 py-3 text-sm font-bold border-b-2 transition-colors ${settingTab === 'roles' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>Manajemen Jabatan (Role)</button>
                   <button onClick={() => setSettingTab('user_access')} className={`px-5 py-3 text-sm font-bold border-b-2 transition-colors ${settingTab === 'user_access' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>Akses Per Pegawai</button>
                   <button onClick={() => setSettingTab('gps_rules')} className={`px-5 py-3 text-sm font-bold border-b-2 transition-colors ${settingTab === 'gps_rules' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>Aturan GPS & Absensi</button>
                   {hasPermission('form_builder', 'view') && (
                    <button onClick={() => setSettingTab('form_builder')} className={`px-5 py-3 text-sm font-bold border-b-2 transition-colors ${settingTab === 'form_builder' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>Form Builder</button>
                  )}
                </div>

                {settingTab === 'user_access' && (
                  <div className="space-y-4">

                    {/* PANEL PERMINTAAN RESET PASSWORD */}
                    {employees.filter(e => e.reset_requested).length > 0 && (
                      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 shadow-sm animate-pulse-slow">
                        <div className="flex items-center gap-2 border-b border-amber-200/60 pb-3 mb-4">
                           <KeyRound size={20} className="text-amber-600"/>
                           <h3 className="font-black text-amber-900 text-sm">Permintaan Reset Password ({employees.filter(e => e.reset_requested).length})</h3>
                        </div>
                        <div className="space-y-3">
                          {employees.filter(e => e.reset_requested).map(emp => (
                            <div key={emp.id} className="bg-white p-3 rounded-xl border border-amber-100 flex justify-between items-center">
                              <div>
                                <p className="font-bold text-slate-800 text-sm">{emp.nama_lengkap}</p>
                                <p className="text-[10px] text-slate-500 font-semibold">NIK: {emp.nik_karyawan}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-[10px] uppercase font-black text-amber-500 mb-0.5">Berikan PIN ini ke Karyawan:</p>
                                <span className="bg-amber-100 text-amber-800 px-4 py-1.5 rounded-lg text-lg font-black tracking-widest border border-amber-200 inline-block">{emp.reset_key}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* --- BANNER RESET CUTI TAHUNAN --- */}
                    <div className="flex flex-col md:flex-row justify-between items-center bg-blue-50 p-4 rounded-2xl border border-blue-100 shadow-sm gap-4">
                      <div>
                        <h3 className="font-bold text-blue-900 flex items-center gap-2">Reset Kuota Cuti Tahunan</h3>
                        <p className="text-xs text-blue-700 mt-1">Kembalikan sisa cuti semua karyawan aktif ke saldo awal (12 Hari). Gunakan ini setiap awal tahun.</p>
                      </div>
                      {hasPermission('settings', 'edit') && (
                      <button 
                        onClick={async () => {
                          if(window.confirm("PERINGATAN SANGAT PENTING: Apakah Anda yakin ingin mereset seluruh saldo cuti karyawan menjadi 12 hari? Tindakan ini tidak bisa dibatalkan!")) {
                            const { error } = await supabase.from('employees').update({ sisa_cuti: 12 }).not('id', 'is', null);
                            if(!error) { 
                              alert("Yey! Saldo cuti seluruh karyawan berhasil direset menjadi 12 hari."); 
                              fetchAllData(); 
                            } else { 
                              alert("Gagal mereset saldo: " + error.message); 
                            }
                          }
                          setEditPermissions({ ...perms, patroli: !!perms.patroli, reguler: !!perms.reguler, cuti: !!perms.cuti, koreksi: !!perms.koreksi, reimburse: !!perms.reimburse, bebas_gps: !!perms.bebas_gps, mobile: perms.mobile || {} });
                          setIsAccessModalOpen(true);
                        }}   
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2 shrink-0"
                      >
                        <RefreshCw size={16}/> Reset Semua Cuti
                      </button>
                      )}
                    </div>

                    {/* --- TABEL AKSES PEGAWAI BAWAAN --- */}
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
                                {hasPermission('settings', 'edit') && (
                                 <button onClick={() => { 
                                   setSelectedEmployeeAccess(emp); 
                                   const perms = typeof emp.permissions === 'string' ? JSON.parse(emp.permissions) : (emp.permissions || {});
                                   setEditPermissions({ patroli: !!perms.patroli, reguler: !!perms.reguler, cuti: !!perms.cuti, koreksi: !!perms.koreksi, reimburse: !!perms.reimburse, bebas_gps: !!perms.bebas_gps, mobile: perms.mobile || {} });
                                   setIsAccessModalOpen(true); 
                                 }} className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors">Atur Akses</button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                  </div> 
                )}

                {/* MANAJEMEN ROLE & OTORITAS (RBAC) */}
                {settingTab === 'roles' && (
                  <div className="space-y-6 fade-in">
                    <div className="flex justify-between items-center bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                      <div>
                        <h3 className="font-bold text-indigo-900 flex items-center gap-2"><Shield size={18}/> Role Based Access Control (RBAC)</h3>
                        <p className="text-xs text-indigo-700 mt-1">Buat jabatan kustom dan tentukan hak akses (CRUD) untuk masing-masing modul di Dasbor Admin.</p>
                      </div>
                      {hasPermission('settings', 'edit') && (
                      <button onClick={() => { setRoleForm({ id: null, name: '', description: '', permissions: JSON.parse(JSON.stringify(defaultRolePermissions)) }); setIsRoleModalOpen(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-2 shrink-0">
                        <Plus size={16}/> Buat Role Baru
                      </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Kartu Default: Admin Perusahaan */}
                      <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-5 rounded-2xl shadow-lg border border-slate-700 flex flex-col h-full relative overflow-hidden">
                         <Shield size={60} className="absolute -bottom-4 -right-4 text-white/5 rotate-12"/>
                         <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1">System Default</span>
                         <h4 className="text-lg font-bold text-white mb-2">Admin Perusahaan</h4>
                         <p className="text-xs text-slate-400 font-medium mb-4 flex-1">Memiliki akses penuh (Super User) ke semua modul, fitur, dan konfigurasi perusahaan klien.</p>
                         <button disabled className="w-full py-2.5 bg-white/10 text-white/50 rounded-xl text-xs font-bold cursor-not-allowed">Akses Tidak Bisa Diubah</button>
                      </div>

                      {/* Render Custom Roles */}
                      {companyRoles.map(role => (
                        <div key={role.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full hover:border-indigo-300 transition-colors">
                           <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1 flex items-center gap-1"><Key size={12}/> Custom Role</span>
                           <h4 className="text-lg font-bold text-slate-800 mb-2">{role.name}</h4>
                           <p className="text-xs text-slate-500 font-medium mb-4 flex-1 line-clamp-3">{role.description || 'Tidak ada deskripsi.'}</p>
                           {hasPermission('settings', 'edit') && (
                            <div className="flex gap-2 mt-auto">
                             <button onClick={() => { 
                               const existingPerms = typeof role.permissions === 'string' ? JSON.parse(role.permissions) : (role.permissions || {});
                               const mergedPerms = JSON.parse(JSON.stringify(defaultRolePermissions));
                               Object.keys(existingPerms).forEach(k => { mergedPerms[k] = { ...mergedPerms[k], ...existingPerms[k] }; });
                               setRoleForm({ id: role.id, name: role.name, description: role.description, permissions: mergedPerms }); 
                               setIsRoleModalOpen(true); 
                             }} className="flex-1 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-xs font-bold border border-indigo-100 transition-colors">Edit Akses</button>
                             <button onClick={async () => { if(window.confirm("Hapus role ini?")) { await supabase.from('company_roles').delete().eq('id', role.id); fetchAllData(); } }} className="px-3 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl border border-rose-100 transition-colors"><Trash2 size={16}/></button>
                            </div>
                           )}
                        </div>
                      ))}
                    </div>
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
                      {hasPermission('settings', 'edit') && (
                        <button onClick={() => { setClientForm({ id: null, name: '', status: 'ACTIVE' }); setIsClientModalOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-2 shrink-0">
                          <Plus size={16}/> Tambah Cabang Klien
                        </button>
                      )}
                    </div>
    
                    {/* Render Setiap Klien/Cabang menjadi Tabel Tersendiri */}
                    {clientsList.map(client => (
                      <div key={client.id} className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
                        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <h3 className="font-black text-slate-700 text-base flex items-center gap-2">
                            <Building size={16} className="text-slate-400"/> {client.name}
                          </h3>
                          {hasPermission('settings', 'edit') && (
                            <div className="flex gap-2">
                               <button onClick={() => { setClientForm({ id: client.id, name: client.name, status: client.status }); setIsClientModalOpen(true); }} className="text-slate-500 hover:text-blue-600 text-xs font-bold bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">Edit Cabang</button>
                               <button onClick={() => { setLocationForm({ id: null, client_id: client.id, name: '', latitude: '', longitude: '', radius: 50 }); setIsLocationModalOpen(true); }} className="bg-slate-800 hover:bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm flex items-center gap-1">
                                 <Plus size={14}/> Tambah Titik di Sini
                               </button>
                            </div>
                          )}
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
                                    {hasPermission('settings', 'edit') ? (
                                    <div className="flex justify-center gap-2">
                                      <button onClick={() => { setLocationForm(loc); setIsLocationModalOpen(true); }} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"><FileText size={16}/></button>
                                      <button onClick={() => handleDeleteLocation(loc.id)} className="p-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100"><Trash2 size={16}/></button>
                                    </div>
                                    ) : (
                                      <span className="text-[10px] font-bold text-slate-400 italic">Tidak ada akses</span>
                                    )}
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
                {/* ========================================== */}
                 {/* === MENU UTAMA: FORM BUILDER DINAMIS === */}
                {/* ========================================== */}
                {settingTab === 'form_builder' && hasPermission('form_builder', 'view') && (
                  <div className="space-y-6 fade-in p-2 md:p-6 pb-24">
                    
                    {/* HEADER SECTION */}
                    <div className="flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                      <div>
                        <h3 className="font-bold text-lg text-[#0a195c]">Menu Dinamis Mobile App</h3>
                        <p className="text-xs text-slate-500 mt-1">Kelola dan buat template laporan lapangan baru untuk karyawan.</p>
                      </div>
                      
                      {/* TOMBOL CREATE */}
                      {hasPermission('form_builder', 'create') && (
                        <button 
                          onClick={() => setIsBuilderOpen(true)} 
                          className="bg-[#0a195c] text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-blue-900 active:scale-95 transition-all shadow-md shrink-0"
                        >
                          <Plus size={18}/> Buat Menu Baru
                        </button>
                      )}
                    </div>

                    {/* LIST DAFTAR MENU CUSTOM YANG SUDAH DIBUAT */}
                    <div className="space-y-3">
                      <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Daftar Menu Tersedia</h4>
                      
                      {customMenus && customMenus.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                          {customMenus.map(menu => (
                            <div key={menu.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center hover:border-blue-400 transition-colors group">
                              <div className="flex items-center gap-3.5">
                                <div className="p-2.5 bg-blue-50/80 text-[#0a195c] rounded-xl border border-blue-100">
                                  <FileText size={20} />
                                </div>
                                <div>
                                  <h4 className="font-bold text-sm text-slate-800">{menu.menu_name}</h4>
                                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">{menu.fields?.length || 0} Komponen Form</p>
                                </div>
                              </div>
                              
                              {/* TOMBOL HAPUS */}
                              {hasPermission('form_builder', 'delete') && (
                                <button 
                                  onClick={async () => {
                                    if(window.confirm(`Yakin ingin menghapus menu "${menu.menu_name}"?`)) {
                                      const { error } = await supabase.from('custom_menus').delete().eq('id', menu.id);
                                      if(!error) {
                                        alert("Menu berhasil dihapus!");
                                        setCustomMenus(customMenus.filter(m => m.id !== menu.id));
                                      } else {
                                        alert("Gagal menghapus: " + error.message);
                                      }
                                    }
                                  }}
                                  className="p-2 text-rose-500 bg-rose-50 rounded-lg hover:bg-rose-500 hover:text-white transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100"
                                  title="Hapus Menu"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-white p-10 rounded-2xl border-2 border-slate-200 border-dashed text-center flex flex-col items-center justify-center">
                          <FolderTree size={48} className="text-slate-300 mb-3"/>
                          <p className="text-sm font-bold text-slate-600">Belum ada Menu Laporan Dinamis.</p>
                          <p className="text-xs text-slate-400 mt-1">Klik tombol "Buat Menu Baru" di atas untuk mulai membuat.</p>
                        </div>
                      )}
                    </div>
                    
                    {/* MODAL BUILDER DRAG AND DROP */}
                    {isBuilderOpen && hasPermission('form_builder', 'create') && (
                      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                        <div className="bg-white w-full max-w-3xl rounded-[2rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
                          
                          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div>
                              <h2 className="font-black text-lg text-[#0a195c]">Pembuat Form Laporan</h2>
                              <p className="text-xs text-slate-500 font-medium">Susun form dengan cara Drag & Drop.</p>
                            </div>
                            <button onClick={() => setIsBuilderOpen(false)} className="p-2 bg-slate-200 text-slate-600 rounded-full hover:bg-slate-300 transition-colors"><X size={16}/></button>
                          </div>
                          
                          <div className="flex-1 overflow-y-auto p-6 bg-white space-y-6 custom-scrollbar">
                            {/* PENGATURAN NAMA MENU */}
                            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                              <label className="text-[10px] font-black text-blue-800 uppercase tracking-widest block mb-2">Judul Menu Laporan Baru</label>
                              <input type="text" placeholder="Cth: Laporan Inspeksi Toilet..." value={builderForm.menu_name} onChange={e => setBuilderForm({...builderForm, menu_name: e.target.value})} className="w-full p-3.5 border border-blue-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none font-bold text-sm shadow-sm transition-all"/>
                            </div>

                            {/* TOMBOL KOMPONEN LENGKAP */}
                            <div>
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Pilih Komponen Form:</label>
                              <div className="flex flex-wrap gap-2">
                                <button onClick={() => handleAddBuilderField('short_text')} className="bg-slate-50 hover:bg-slate-100 text-slate-700 px-3 py-2 rounded-lg text-xs font-bold border border-slate-200 transition-colors">+ Teks Singkat</button>
                                <button onClick={() => handleAddBuilderField('long_text')} className="bg-slate-50 hover:bg-slate-100 text-slate-700 px-3 py-2 rounded-lg text-xs font-bold border border-slate-200 transition-colors">+ Paragraf</button>
                                <button onClick={() => handleAddBuilderField('number')} className="bg-slate-50 hover:bg-slate-100 text-slate-700 px-3 py-2 rounded-lg text-xs font-bold border border-slate-200 transition-colors">+ Angka</button>
                                <button onClick={() => handleAddBuilderField('dropdown')} className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-lg text-xs font-bold border border-blue-200 transition-colors">+ Dropdown</button>
                                <button onClick={() => handleAddBuilderField('checkbox')} className="bg-slate-50 hover:bg-slate-100 text-slate-700 px-3 py-2 rounded-lg text-xs font-bold border border-slate-200 transition-colors">+ Checkbox</button>
                                <button onClick={() => handleAddBuilderField('camera')} className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-2 rounded-lg text-xs font-bold border border-emerald-200 transition-colors">+ Kamera Foto</button>
                                <button onClick={() => handleAddBuilderField('datetime')} className="bg-slate-50 hover:bg-slate-100 text-slate-700 px-3 py-2 rounded-lg text-xs font-bold border border-slate-200 transition-colors">+ Tanggal/Jam</button>
                                <button onClick={() => handleAddBuilderField('gps')} className="bg-amber-50 hover:bg-amber-100 text-amber-700 px-3 py-2 rounded-lg text-xs font-bold border border-amber-200 transition-colors">+ GPS</button>
                                <button onClick={() => handleAddBuilderField('signature')} className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-2 rounded-lg text-xs font-bold border border-indigo-200 transition-colors">+ Tanda Tangan</button>
                              </div>
                            </div>

                            {/* AREA DRAG AND DROP SUSUNAN FORM */}
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 border-dashed min-h-[220px]">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Susunan Form (Tahan icon garis tiga dan geser ke atas/bawah)</label>
                              
                              <div className="space-y-3">
                                {builderForm.fields.map((field, index) => (
                                  <div 
                                    key={field.id} 
                                    draggable 
                                    onDragStart={() => handleDragStart(index)}
                                    onDragOver={handleDragOver}
                                    onDrop={() => handleDrop(index)}
                                    className="flex flex-col md:flex-row gap-3 items-start md:items-center bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm cursor-grab active:cursor-grabbing hover:border-blue-400 transition-colors"
                                  >
                                    <div className="text-slate-300 px-1 cursor-grab active:cursor-grabbing">
                                      <Menu size={20}/>
                                    </div>
                                    <div className="flex-1 w-full space-y-2">
                                      <div className="flex justify-between items-center">
                                        <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-wider">{field.type.replace('_', ' ')}</span>
                                      </div>
                                      
                                      <input type="text" placeholder="Tuliskan judul/label pertanyaan di sini..." value={field.label} onChange={(e) => {
                                        const newFields = [...builderForm.fields];
                                        newFields[index].label = e.target.value;
                                        setBuilderForm({...builderForm, fields: newFields});
                                      }} className="w-full bg-transparent border-b-2 border-slate-100 focus:border-[#0a195c] outline-none font-bold text-sm text-slate-800 pb-1.5 transition-colors" />

                                      {field.type === 'dropdown' && (
                                        <input type="text" placeholder="Masukkan pilihan (pisahkan koma), Cth: Baik, Rusak, Perlu Servis" value={field.options} onChange={(e) => {
                                          const newFields = [...builderForm.fields];
                                          newFields[index].options = e.target.value;
                                          setBuilderForm({...builderForm, fields: newFields});
                                        }} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs outline-none focus:border-blue-400 mt-2 font-medium" />
                                      )}
                                    </div>
                                    
                                    <button onClick={() => {
                                      const newFields = builderForm.fields.filter((_, i) => i !== index);
                                      setBuilderForm({...builderForm, fields: newFields});
                                    }} className="text-rose-500 p-2.5 bg-rose-50 rounded-xl hover:bg-rose-500 hover:text-white transition-colors shrink-0"><Trash2 size={16}/></button>
                                  </div>
                                ))}
                                {builderForm.fields.length === 0 && (
                                  <div className="flex flex-col items-center justify-center py-10 opacity-50">
                                    <FileText size={48} className="text-slate-300 mb-2"/>
                                    <p className="text-sm font-bold text-slate-500">Form laporan masih kosong.</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* FOOTER MODAL */}
                          <div className="p-5 border-t border-slate-100 bg-slate-50 flex gap-3 justify-end items-center rounded-b-[2rem]">
                            <button onClick={() => setIsBuilderOpen(false)} className="px-5 py-3 text-slate-500 font-bold hover:bg-slate-200 rounded-xl text-sm transition-colors">Batal</button>
                            <button onClick={handleSaveCustomMenu} className="px-6 py-3 bg-[#0a195c] hover:bg-blue-900 text-white rounded-xl font-bold text-sm shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2">
                              <CheckCircle2 size={18}/> Simpan & Aktifkan
                            </button>
                          </div>

                        </div>
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
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 mb-3">Akses Menu dashboard admin</h4>
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

                    {customMenus.map(menu => (
                      <label key={`dash_${menu.id}`} className="flex items-center justify-between p-3 border border-slate-100 bg-slate-50 hover:bg-blue-50 rounded-xl cursor-pointer transition-colors">
                        <span className="text-sm font-bold text-slate-700 truncate mr-2" title={`Akses Data: ${menu.menu_name}`}>Laporan: {menu.menu_name}</span>
                        <input type="checkbox" checked={editPermissions[`view_custom_${menu.id}`] || false} onChange={(e) => setEditPermissions({...editPermissions, [`view_custom_${menu.id}`]: e.target.checked})} className="w-5 h-5 text-blue-600 rounded-md border-slate-300 shrink-0" />
                      </label>
                    ))}
                  </div>
                </div>

                {/* Otoritas Menu Mobile App (Override Perorangan) */}
                <div>
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 mb-3">Override Menu Mobile App</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {/* GABUNGKAN ARRAY MENU BAWAAN DAN MENU CUSTOM */}
                    {['absen', 'laporan', 'pengajuan', 'task', 'slip', ...customMenus.map(m => `custom_${m.id}`)]
                            .filter(menu => menu !== 'task' || currentUser?.features?.task !== false) 
                            .map(menu => {
                      let isChecked = false;
                      if (editPermissions?.mobile && editPermissions.mobile[menu] !== undefined) {
                         isChecked = editPermissions.mobile[menu];
                      } else {
                         const role = selectedEmployeeAccess?.role;
                         const roleData = companyRoles.find(r => r.name === role);
                         if (roleData) {
                           const perms = typeof roleData.permissions === 'string' ? JSON.parse(roleData.permissions) : roleData.permissions;
                           isChecked = perms?.mobile?.[menu] || false;
                         }
                      }

                      // Penamaan Label Dinamis
                      let labelText = `Menu ${menu}`;
                      if (menu.startsWith('custom_')) {
                        const mObj = customMenus.find(m => `custom_${m.id}` === menu);
                        labelText = mObj ? mObj.menu_name : 'Custom Menu';
                      }

                      return (
                      <label key={menu} className="flex items-center gap-2 p-2.5 border border-slate-100 bg-slate-50 hover:bg-blue-50 rounded-xl cursor-pointer transition-colors">
                        <input type="checkbox" checked={isChecked} onChange={(e) => setEditPermissions({...editPermissions, mobile: {...(editPermissions.mobile || {}), [menu]: e.target.checked}})} className="w-4 h-4 text-blue-600 rounded border-slate-300 shrink-0" />
                        <span className="text-xs font-bold text-slate-700 capitalize truncate" title={labelText}>{labelText}</span>
                      </label>
                    )})}
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

        {/* MODAL DETAIL & EDIT KARYAWAN (HRIS RECORD) */}
        {isEmpDetailOpen && empForm && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[90] flex justify-center items-center p-4">
            <div className="bg-slate-50 w-full max-w-5xl max-h-[90vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in duration-300 relative border border-slate-200">
              
              {/* Header ala Screenshot */}
              <div className="px-8 py-5 border-b border-slate-200 flex justify-between items-center bg-white shrink-0">
                <div>
                  <h3 className="font-black text-xl text-slate-800 uppercase tracking-tight">HRIS RECORD: {empForm.nama_lengkap}</h3>
                  <p className="text-xs font-bold text-blue-600 mt-1 flex items-center gap-1.5"><Briefcase size={14}/> {empForm.bidang_jasa || 'Divisi Tidak Ada'} • NIK: {empForm.nik_karyawan || 'BELUM ADA NIK'}</p>
                </div>
                <div className="flex items-center gap-3">
                  {empDetailMode === 'view' && hasPermission('hris', 'edit') && (
                    <button onClick={() => setEmpDetailMode('edit')} className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl font-bold text-xs flex items-center gap-2 transition-colors border border-blue-100"><FileText size={14}/> Edit Data Lengkap</button>
                  )}
                  {empDetailMode === 'edit' && (
                    <button onClick={() => setEmpDetailMode('view')} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs transition-colors">Batal Edit</button>
                  )}
                  <button type="button" onClick={() => setIsEmpDetailOpen(false)} className="p-2 bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200"><X size={18}/></button>
                </div>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSaveEmployeeDetail} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-6 md:p-8 overflow-y-auto flex-1 custom-scrollbar space-y-6">
                  
                  {/* KARTU 0: DATA KEPEGAWAIAN (HRIS) UTAMA */}
                  <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-blue-100 flex flex-col md:flex-row gap-6 justify-between">
                    <div>
                      <h4 className="font-black text-blue-800 text-sm flex items-center gap-2"><Database size={16}/> DATA KEPEGAWAIAN</h4>
                      <p className="text-[10px] text-slate-500 mt-1">Informasi utama untuk akses sistem dan presensi.</p>
                    </div>
                    {empDetailMode === 'view' ? (
                      <div className="flex flex-wrap gap-4">
                        <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl min-w-[120px]">
                           <p className="text-[9px] font-black text-slate-400 uppercase">Jabatan / Role</p>
                           <p className="font-bold text-slate-800 text-sm mt-1">{empForm.posisi_jabatan || '-'}</p>
                           <p className="text-[10px] text-blue-500 font-semibold">{empForm.role || 'No Role'}</p>
                        </div>
                        <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl min-w-[120px]">
                           <p className="text-[9px] font-black text-indigo-600 uppercase">Status Kontrak</p>
                           <p className="font-bold text-indigo-700 text-sm mt-1">{empForm.personal_data.status_kontrak || 'PKWT'}</p>
                        </div>
                        <div className={`p-3 rounded-xl min-w-[120px] border ${empForm.status_pegawai === 'NONAKTIF' ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100'}`}>
                           <p className={`text-[9px] font-black uppercase ${empForm.status_pegawai === 'NONAKTIF' ? 'text-rose-600' : 'text-emerald-600'}`}>Status Pegawai</p>
                           <p className={`font-bold text-sm mt-1 ${empForm.status_pegawai === 'NONAKTIF' ? 'text-rose-700' : 'text-emerald-700'}`}>{empForm.status_pegawai || 'AKTIF'}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 flex-1 max-w-4xl">
                         <div><label className="block text-[10px] font-bold text-slate-500 mb-1">NIK Sistem</label><input type="text" value={empForm.nik_karyawan || ''} onChange={e => setEmpForm({...empForm, nik_karyawan: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg text-xs font-bold bg-slate-50"/></div>
                         <div><label className="block text-[10px] font-bold text-slate-500 mb-1">Nama Tampilan</label><input type="text" value={empForm.nama_lengkap || ''} onChange={e => setEmpForm({...empForm, nama_lengkap: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg text-xs font-bold bg-slate-50"/></div>
                         <div><label className="block text-[10px] font-bold text-slate-500 mb-1">Nama Jabatan</label><input type="text" value={empForm.posisi_jabatan || ''} onChange={e => setEmpForm({...empForm, posisi_jabatan: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg text-xs font-bold bg-slate-50"/></div>
                         <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">Role Aplikasi</label>
                            <select value={empForm.role || ''} onChange={e => setEmpForm({...empForm, role: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg text-xs font-bold bg-slate-50">
                               <option value="">-- Tanpa Akses --</option>
                               {companyRoles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                            </select>
                         </div>
                         <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">Status Kontrak</label>
                            <select value={empForm.personal_data.status_kontrak || 'PKWT'} onChange={e => setEmpForm({...empForm, personal_data: {...empForm.personal_data, status_kontrak: e.target.value}})} className="w-full p-2 border border-indigo-200 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700">
                               <option value="PKWT">PKWT (Kontrak)</option><option value="PKWTT">PKWTT (Tetap)</option><option value="Harian">Harian Lepas</option><option value="Freelance">Freelance</option>
                            </select>
                         </div>

                         {/* TOMBOL NON-AKTIFKAN KARYAWAN (CABUT AKSES) */}
                         <div className="col-span-2 lg:col-span-5 pt-3 border-t border-slate-100 mt-2 flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200/50">
                            <div>
                               <p className="text-xs font-bold text-slate-800">Manajemen Akses Karyawan</p>
                               <p className="text-[10px] text-slate-500">Cabut akses mobile app dan sistem jika karyawan sudah resign/keluar.</p>
                            </div>
                            {empForm.status_pegawai !== 'NONAKTIF' ? (
                               <button type="button" onClick={() => {
                                 if(window.confirm('Yakin ingin menonaktifkan karyawan ini? Akses aplikasinya akan langsung terblokir.')){
                                   setEmpForm({...empForm, status_pegawai: 'NONAKTIF', has_mobile_access: false, has_task_access: false});
                                 }
                               }} className="bg-rose-50 text-rose-600 px-4 py-2 rounded-xl text-xs font-bold border border-rose-200 hover:bg-rose-100 flex items-center gap-1.5"><UserX size={14}/> Non-Aktifkan Karyawan</button>
                            ) : (
                               <button type="button" onClick={() => {
                                 setEmpForm({...empForm, status_pegawai: 'AKTIF', has_mobile_access: true, has_task_access: true});
                               }} className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-xs font-bold border border-emerald-200 hover:bg-emerald-100 flex items-center gap-1.5"><CheckCircle2 size={14}/> Aktifkan Kembali</button>
                            )}
                         </div>
                      </div>
                    )}
                  </div>

                  {/* GRID KARTU DETAIL */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* KOLOM KIRI */}
                    <div className="space-y-6">
                      
                      {/* KARTU 1: IDENTITAS PRIBADI */}
                      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h4 className="font-black text-slate-800 text-sm mb-4">1. IDENTITAS PRIBADI</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                             <span className="text-xs text-slate-500">NIK KTP</span>
                             {empDetailMode === 'view' ? <span className="text-xs font-bold text-slate-800">{empForm.personal_data.nik_ktp || '-'}</span> : <input type="number" value={empForm.personal_data.nik_ktp || ''} onChange={e => setEmpForm({...empForm, personal_data: {...empForm.personal_data, nik_ktp: e.target.value}})} className="border border-slate-200 rounded px-2 py-1 text-xs text-right"/>}
                          </div>
                          <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                             <span className="text-xs text-slate-500">Kewarganegaraan</span>
                             {empDetailMode === 'view' ? <span className="text-xs font-bold text-slate-800">{empForm.personal_data.kewarganegaraan || 'WNI'}</span> : <input type="text" value={empForm.personal_data.kewarganegaraan || ''} onChange={e => setEmpForm({...empForm, personal_data: {...empForm.personal_data, kewarganegaraan: e.target.value}})} className="border border-slate-200 rounded px-2 py-1 text-xs text-right"/>}
                          </div>
                          <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                             <span className="text-xs text-slate-500">Tempat, Tanggal Lahir</span>
                             {empDetailMode === 'view' ? <span className="text-xs font-bold text-slate-800">{empForm.personal_data.tempat_lahir || '-'}, {empForm.personal_data.tanggal_lahir || '-'}</span> : <div className="flex gap-1"><input type="text" placeholder="Kota" value={empForm.personal_data.tempat_lahir || ''} onChange={e => setEmpForm({...empForm, personal_data: {...empForm.personal_data, tempat_lahir: e.target.value}})} className="border border-slate-200 rounded px-2 py-1 text-xs w-20"/><input type="date" value={empForm.personal_data.tanggal_lahir || ''} onChange={e => setEmpForm({...empForm, personal_data: {...empForm.personal_data, tanggal_lahir: e.target.value}})} className="border border-slate-200 rounded px-2 py-1 text-xs"/></div>}
                          </div>
                          <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                             <span className="text-xs text-slate-500">Agama / Gol. Darah</span>
                             <span className="text-xs font-bold text-slate-800">{empForm.personal_data.agama || '-'} / {empForm.personal_data.golongan_darah || '-'}</span>
                          </div>
                          <div className="pt-2">
                             <span className="text-[10px] font-bold text-slate-400 block mb-1">Alamat Lengkap (KTP & Domisili)</span>
                             {empDetailMode === 'view' ? <p className="text-xs font-semibold text-slate-700 leading-relaxed">{empForm.personal_data.alamat_lengkap || '-'}</p> : <textarea value={empForm.personal_data.alamat_lengkap || ''} onChange={e => setEmpForm({...empForm, personal_data: {...empForm.personal_data, alamat_lengkap: e.target.value}})} className="w-full border border-slate-200 rounded-lg p-2 text-xs" rows="2"></textarea>}
                          </div>
                        </div>
                      </div>

                      {/* KARTU 2: KELUARGA & DARURAT */}
                      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h4 className="font-black text-slate-800 text-sm mb-4">2. KELUARGA & DARURAT</h4>
                        <div className="bg-indigo-50/50 rounded-xl p-4 flex justify-between items-center mb-4 border border-indigo-100">
                          <span className="text-xs font-bold text-indigo-900">Status Pernikahan (PTKP):</span>
                          {empDetailMode === 'view' ? <span className="bg-indigo-600 text-white px-3 py-1 rounded text-xs font-bold">{empForm.personal_data.status_pernikahan || 'TK/0'}</span> : <input type="text" value={empForm.personal_data.status_pernikahan || ''} onChange={e => setEmpForm({...empForm, personal_data: {...empForm.personal_data, status_pernikahan: e.target.value}})} className="border border-slate-200 rounded px-2 py-1 text-xs w-16 text-center"/>}
                        </div>
                        <div className="border border-rose-200 bg-rose-50/30 rounded-xl p-4 relative overflow-hidden">
                           <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-400"></div>
                           <p className="text-[10px] font-black text-rose-500 uppercase flex items-center gap-1 mb-2"><ShieldAlert size={12}/> Kontak Darurat (Emergency)</p>
                           {empDetailMode === 'view' ? (
                             <>
                               <p className="font-bold text-slate-800 text-sm">{empForm.personal_data.kontak_darurat_nama || '-'}</p>
                               <p className="text-xs font-medium text-slate-500">{empForm.personal_data.kontak_darurat_hub || '-'} • Telp: <span className="text-rose-600 font-bold">{empForm.personal_data.kontak_darurat_telp || '-'}</span></p>
                             </>
                           ) : (
                             <div className="space-y-2">
                               <input type="text" placeholder="Nama Darurat" value={empForm.personal_data.kontak_darurat_nama || ''} onChange={e => setEmpForm({...empForm, personal_data: {...empForm.personal_data, kontak_darurat_nama: e.target.value}})} className="w-full border border-slate-200 rounded p-1.5 text-xs"/>
                               <div className="flex gap-2"><input type="text" placeholder="Hubungan" value={empForm.personal_data.kontak_darurat_hub || ''} onChange={e => setEmpForm({...empForm, personal_data: {...empForm.personal_data, kontak_darurat_hub: e.target.value}})} className="w-1/2 border border-slate-200 rounded p-1.5 text-xs"/><input type="text" placeholder="No Telp" value={empForm.personal_data.kontak_darurat_telp || ''} onChange={e => setEmpForm({...empForm, personal_data: {...empForm.personal_data, kontak_darurat_telp: e.target.value}})} className="w-1/2 border border-slate-200 rounded p-1.5 text-xs"/></div>
                             </div>
                           )}
                        </div>
                      </div>

                    </div>

                    {/* KOLOM KANAN */}
                    <div className="space-y-6">
                      
                      {/* KARTU 4: FISIK & MEDIS */}
                      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h4 className="font-black text-slate-800 text-sm mb-4">4. FISIK & MEDIS</h4>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase">Tinggi</p>
                            {empDetailMode === 'view' ? <p className="font-black text-slate-800 text-lg">{empForm.personal_data.tinggi_badan || '0'} <span className="text-xs font-medium text-slate-400">cm</span></p> : <input type="number" value={empForm.personal_data.tinggi_badan || ''} onChange={e => setEmpForm({...empForm, personal_data: {...empForm.personal_data, tinggi_badan: e.target.value}})} className="w-16 border border-slate-200 rounded text-center text-sm p-1"/>}
                          </div>
                          <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase">Berat</p>
                            {empDetailMode === 'view' ? <p className="font-black text-slate-800 text-lg">{empForm.personal_data.berat_badan || '0'} <span className="text-xs font-medium text-slate-400">kg</span></p> : <input type="number" value={empForm.personal_data.berat_badan || ''} onChange={e => setEmpForm({...empForm, personal_data: {...empForm.personal_data, berat_badan: e.target.value}})} className="w-16 border border-slate-200 rounded text-center text-sm p-1"/>}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs mb-4">
                          <div className="flex justify-between border-b border-slate-50 pb-1"><span className="text-slate-500">Bertato</span><strong className="text-slate-800">{empForm.personal_data.bertato || 'Tidak'}</strong></div>
                          <div className="flex justify-between border-b border-slate-50 pb-1"><span className="text-slate-500">Berkacamata</span><strong className="text-slate-800">{empForm.personal_data.berkacamata || 'Tidak'}</strong></div>
                          <div className="flex justify-between"><span className="text-slate-500">Takut Tinggi</span><strong className="text-slate-800">{empForm.personal_data.takut_tinggi || 'Tidak'}</strong></div>
                          <div className="flex justify-between"><span className="text-slate-500">Patah Tulang</span><strong className="text-slate-800">{empForm.personal_data.patah_tulang || 'Tidak'}</strong></div>
                        </div>

                        <div className="bg-amber-50/40 rounded-xl p-3 text-xs mb-4 border border-amber-100/50">
                          <p className="mb-1"><span className="text-slate-500">Riwayat Operasi:</span> <strong className="text-amber-900">{empForm.personal_data.riwayat_operasi === 'Ya' ? empForm.personal_data.detail_operasi : 'Tidak Ada'}</strong></p>
                          <p><span className="text-slate-500">Sakit 1 thn terakhir:</span> <strong className="text-amber-900">{empForm.personal_data.sakit_serius === 'Ya' ? empForm.personal_data.detail_sakit : 'Tidak Ada'}</strong></p>
                        </div>

                        <div className="bg-slate-800 text-white rounded-xl p-3 flex justify-between items-center text-xs font-medium shadow-inner">
                          <span className="text-slate-400 font-bold uppercase tracking-wider">Seragam:</span>
                          <span>Baju: <strong className="text-yellow-400">{empForm.personal_data.ukuran_baju || '-'}</strong></span>
                          <span>Celana: <strong className="text-yellow-400">{empForm.personal_data.ukuran_celana || '-'}</strong></span>
                          <span>Sepatu: <strong className="text-yellow-400">{empForm.personal_data.ukuran_sepatu || '-'}</strong></span>
                        </div>
                      </div>

                      {/* KARTU 5: PELATIHAN & KARIR */}
                      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-400"></div>
                        <h4 className="font-black text-slate-800 text-sm mb-4">5. KOMPETENSI & KARIR</h4>
                        <div className="flex gap-2 mb-4">
                           <span className="px-2.5 py-1 rounded border border-emerald-200 bg-emerald-50 text-emerald-700 text-[10px] font-bold">Berenang: {empForm.personal_data.bisa_berenang || 'Tidak'}</span>
                           <span className="px-2.5 py-1 rounded border border-emerald-200 bg-emerald-50 text-emerald-700 text-[10px] font-bold">Beladiri: {empForm.personal_data.bisa_beladiri || 'Tidak'}</span>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                          <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-2">Riwayat Pekerjaan Sebelumnya</p>
                          {empDetailMode === 'view' ? (
                            <>
                              <p className="text-xs font-semibold text-slate-600 leading-relaxed mb-3">{empForm.personal_data.riwayat_kerja || '-'}</p>
                              <div className="grid grid-cols-2 gap-4 text-[10px]">
                                <div><span className="text-slate-400 block">Gaji Terakhir</span><strong className="text-slate-700">{empForm.personal_data.gaji_terakhir || '-'}</strong></div>
                                <div><span className="text-slate-400 block">Gaji Harapan</span><strong className="text-slate-700">{empForm.personal_data.gaji_diharapkan || '-'}</strong></div>
                                <div className="col-span-2"><span className="text-slate-400 block">Alasan Keluar</span><strong className="text-slate-700">{empForm.personal_data.alasan_keluar || '-'}</strong></div>
                              </div>
                            </>
                          ) : (
                            <textarea value={empForm.personal_data.riwayat_kerja || ''} onChange={e => setEmpForm({...empForm, personal_data: {...empForm.personal_data, riwayat_kerja: e.target.value}})} className="w-full border border-slate-200 rounded p-2 text-xs" rows="3"></textarea>
                          )}
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

                {/* Footer Save Area */}
                {empDetailMode === 'edit' && (
                  <div className="p-5 border-t border-slate-200 bg-white flex justify-end shrink-0">
                    <button type="submit" className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-600/20 flex items-center gap-2 transition-transform hover:-translate-y-0.5"><Check size={18}/> Simpan Perubahan Data</button>
                  </div>
                )}
              </form>
            </div>
          </div>
        )}

        {/* MODAL MANAJEMEN ROLE & HAK AKSES */}
        {isRoleModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[90] flex justify-center items-center p-4">
            <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in duration-300">
              <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                <h3 className="font-black text-lg text-slate-800 flex items-center gap-2"><Shield size={20} className="text-indigo-600"/> {roleForm.id ? 'Edit Akses Jabatan' : 'Buat Jabatan Baru'}</h3>
                <button type="button" onClick={() => setIsRoleModalOpen(false)} className="p-2 bg-slate-200 text-slate-600 rounded-full hover:bg-slate-300"><X size={16}/></button>
              </div>
              <form onSubmit={handleSaveRole} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-6 space-y-6 overflow-y-auto bg-white flex-1 custom-scrollbar">
                  
                  {/* Nama Role */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Nama Jabatan / Role</label>
                      <input required type="text" placeholder="Cth: Finance Manager" value={roleForm.name} onChange={e => setRoleForm({...roleForm, name: e.target.value})} className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-500 text-sm outline-none font-bold bg-slate-50 focus:bg-white transition-all"/>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Deskripsi Singkat</label>
                      <input type="text" placeholder="Cth: Mengelola approval keuangan..." value={roleForm.description} onChange={e => setRoleForm({...roleForm, description: e.target.value})} className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-500 text-sm outline-none font-bold bg-slate-50 focus:bg-white transition-all"/>
                    </div>
                  </div>

                  {/* Matriks Hak Akses */}
                  <div>
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b border-slate-200 pb-2 mb-4">Matriks Hak Akses Dashboard Admin</h4>
                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm mb-6">
                      <table className="w-full text-left bg-white">
                        <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                          <tr>
                            <th className="px-4 py-3 border-r border-slate-200">Modul Aplikasi</th>
                            <th className="px-4 py-3 text-center">Lihat</th>
                            <th className="px-4 py-3 text-center">Buat</th>
                            <th className="px-4 py-3 text-center">Ubah/ACC</th>
                            <th className="px-4 py-3 text-center">Hapus</th>
                            <th className="px-4 py-3 text-center">Export</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm font-semibold text-slate-700">
                          {menuModules
                            .filter(m => m.id !== 'mobile')
                            .filter(m => currentUser?.features?.[m.id] !== false) // <-- Proteksi Super Admin
                            .map(module => (
                            <tr key={module.id} className="hover:bg-indigo-50/30 transition-colors">
                              <td className="px-4 py-3 border-r border-slate-100 bg-slate-50/50">{module.label}</td>
                              
                              {/* KOLOM LIHAT (VIEW) */}
                              <td className="px-4 py-3 text-center">
                                {module.actions.includes('view') ? <input type="checkbox" checked={roleForm.permissions[module.id]?.view || false} onChange={() => handleCheckboxChange(module.id, 'view')} className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"/> : <span className="text-slate-300">-</span>}
                              </td>
                              
                              {/* KOLOM BUAT (CREATE) */}
                              <td className="px-4 py-3 text-center">
                                {module.actions.includes('create') ? <input type="checkbox" checked={roleForm.permissions[module.id]?.create || false} onChange={() => handleCheckboxChange(module.id, 'create')} className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"/> : <span className="text-slate-300">-</span>}
                              </td>
                              
                              {/* KOLOM UBAH & SETUJUI (EDIT/APPROVE) */}
                              <td className="px-4 py-3 text-center">
                                {module.actions.includes('edit') ? (
                                  <input type="checkbox" checked={roleForm.permissions[module.id]?.edit || false} onChange={() => handleCheckboxChange(module.id, 'edit')} className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"/>
                                ) : module.actions.includes('approve') ? (
                                  <input type="checkbox" checked={roleForm.permissions[module.id]?.approve || false} onChange={() => handleCheckboxChange(module.id, 'approve')} className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"/>
                                ) : <span className="text-slate-300">-</span>}
                              </td>
                              
                              {/* KOLOM HAPUS (DELETE) */}
                              <td className="px-4 py-3 text-center">
                                {module.actions.includes('delete') ? <input type="checkbox" checked={roleForm.permissions[module.id]?.delete || false} onChange={() => handleCheckboxChange(module.id, 'delete')} className="w-4 h-4 rounded border-slate-300 text-rose-500 focus:ring-rose-500 cursor-pointer"/> : <span className="text-slate-300">-</span>}
                              </td>

                              {/* KOLOM EXPORT */}
                              <td className="px-4 py-3 text-center">
                                {module.actions.includes('export') ? <input type="checkbox" checked={roleForm.permissions[module.id]?.export || false} onChange={() => handleCheckboxChange(module.id, 'export')} className="w-4 h-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500 cursor-pointer"/> : <span className="text-slate-300">-</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* AKSES MENU APLIKASI MOBILE (BAWAAN ROLE) */}
                      <div className="mt-6">
                        <h4 className="text-xs font-black text-slate-800 uppercase mb-3">Akses Menu Aplikasi Mobile (Bawaan Role)</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {/* GABUNGKAN ARRAY MENU BAWAAN DAN MENU CUSTOM */}
                          {['absen', 'laporan', 'pengajuan', 'task', 'slip', ...customMenus.map(m => `custom_${m.id}`)]
                          .filter(menu => menu !== 'task' || currentUser?.features?.task !== false) 
                          .map(menu => {
                            const isChecked = roleForm?.permissions?.mobile?.[menu] === true;
                            
                            // Penamaan Label Dinamis
                            let labelText = `Menu ${menu}`;
                            if (menu.startsWith('custom_')) {
                              const mObj = customMenus.find(m => `custom_${m.id}` === menu);
                              labelText = mObj ? mObj.menu_name : 'Custom Menu';
                            }
                            
                            return (
                            <label key={menu} className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-2.5 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                              <input 
                                type="checkbox" 
                                checked={isChecked}
                                onChange={(e) => {
                                  const newStatus = e.target.checked;
                                  setRoleForm(prev => {
                                    const clonedPerms = JSON.parse(JSON.stringify(prev.permissions || {}));
                                    if (!clonedPerms.mobile) clonedPerms.mobile = {};
                                    clonedPerms.mobile[menu] = newStatus;
                                    return { ...prev, permissions: clonedPerms };
                                  });
                                }}
                                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 shrink-0"
                              />
                              <span className="text-xs font-bold text-slate-700 capitalize truncate" title={labelText}>{labelText}</span>
                            </label>
                          )})}
                        </div>
                      </div>
                    </div>
                  </div>

                <div className="p-5 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
                  <button type="button" onClick={() => setIsRoleModalOpen(false)} className="px-5 py-3 text-slate-500 hover:bg-slate-200 rounded-xl font-bold text-sm transition-colors">Batal</button>
                  <button type="submit" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/20">Simpan Hak Akses</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL TAMBAH/EDIT SHIFT MANUAL */}
        {isShiftModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[90] flex justify-center items-center p-4">
            <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in duration-300">
              <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-black text-lg text-slate-800 flex items-center gap-2"><CalendarClock size={20} className="text-blue-600"/> {shiftForm.id ? 'Edit Shift' : 'Tambah Shift Manual'}</h3>
                <button type="button" onClick={() => setIsShiftModalOpen(false)} className="p-2 bg-slate-200 text-slate-600 rounded-full hover:bg-slate-300"><X size={16}/></button>
              </div>
              <form onSubmit={handleSaveShift} className="flex flex-col">
                <div className="p-6 space-y-4 overflow-y-auto bg-white max-h-[70vh] custom-scrollbar">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Pilih Karyawan</label>
                    <select required disabled={!!shiftForm.id} value={shiftForm.employee_id} onChange={e => setShiftForm({...shiftForm, employee_id: e.target.value})} className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 text-sm outline-none font-bold bg-slate-50">
                       <option value="">-- Pilih Pegawai --</option>
                       {/* FILTER PINTAR: Sembunyikan Developer, Super Admin, dan Pegawai Nonaktif */}
                       {employees
                        .filter(emp => emp.role !== 'Developer' && emp.role !== 'Super Admin' && emp.status_pegawai !== 'NONAKTIF')
                        .map(emp => (
                          <option key={emp.id} value={emp.id}>{emp.nama_lengkap} ({emp.nik_karyawan})</option>
                        ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Mulai Tgl</label>
                      <input required disabled={!!shiftForm.id} type="date" value={shiftForm.start_date} onChange={e => setShiftForm({...shiftForm, start_date: e.target.value})} className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 text-sm outline-none font-bold bg-slate-50"/>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Sampai Tgl (Opsional)</label>
                      <input disabled={!!shiftForm.id} type="date" value={shiftForm.end_date} onChange={e => setShiftForm({...shiftForm, end_date: e.target.value})} className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 text-sm outline-none font-bold bg-slate-50 placeholder-slate-400" title="Kosongkan jika hanya untuk 1 hari" />
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl space-y-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Tipe Shift</label>
                      <input required type="text" placeholder="Cth: Pagi / Malam / Reguler" value={shiftForm.shift_type} onChange={e => setShiftForm({...shiftForm, shift_type: e.target.value})} className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:border-blue-500 text-sm outline-none font-bold bg-white"/>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Jam Masuk</label>
                        <input type="time" value={shiftForm.time_in} onChange={e => setShiftForm({...shiftForm, time_in: e.target.value})} className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:border-blue-500 text-sm outline-none font-bold bg-white"/>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Jam Keluar</label>
                        <input type="time" value={shiftForm.time_out} onChange={e => setShiftForm({...shiftForm, time_out: e.target.value})} className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:border-blue-500 text-sm outline-none font-bold bg-white"/>
                      </div>
                    </div>
                  </div>

                  <label className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl cursor-pointer hover:bg-amber-100 transition-colors">
                    <input type="checkbox" checked={shiftForm.is_bko} onChange={e => setShiftForm({...shiftForm, is_bko: e.target.checked})} className="w-5 h-5 text-amber-600 rounded border-amber-300 focus:ring-amber-500"/>
                    <div className="flex-1">
                       <span className="text-xs font-bold text-amber-900 block">Status BKO / Pengganti</span>
                       <span className="text-[10px] font-medium text-amber-700">Tandai shift ini sebagai bantuan personil (BKO).</span>
                    </div>
                  </label>

                  <p className="text-[10px] text-slate-400 italic mt-1">*Kosongkan jam masuk/keluar jika Tipe Shift adalah Libur/Off.</p>
                </div>
                <div className="p-5 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsShiftModalOpen(false)} className="px-5 py-3 text-slate-500 hover:bg-slate-200 rounded-xl font-bold text-sm transition-colors">Batal</button>
                  <button type="submit" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-600/20">Simpan Shift</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* KEYWORD_PROFILE_REFI: Modal UI Edit Profil (Foto & Password) */}
        {isProfileModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex justify-center items-center p-4">
            <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
              
              {/* Header Banner - Modern Gradient */}
              <div className="relative h-32 bg-gradient-to-r from-blue-600 to-indigo-700 flex justify-between items-start px-6 py-5 shrink-0">
                <h3 className="font-black text-lg text-white flex items-center gap-2 drop-shadow-md">
                  <UserCircle size={20} className="text-blue-200"/> Pengaturan Akun
                </h3>
                <button type="button" onClick={() => { stopCamera(); setIsProfileModalOpen(false); }} className="p-2 bg-black/20 text-white rounded-full hover:bg-black/40 backdrop-blur-sm transition-all shadow-sm">
                  <X size={16}/>
                </button>
              </div>

              <form onSubmit={handleSaveProfile} className="flex flex-col relative px-6 pb-6 pt-0">
                
                {/* Avatar Section - Menimpa Header (Overlapping Style) */}
                <div className="flex flex-col items-center -mt-16 mb-6 relative z-10">
                  <div className="w-32 h-32 rounded-full bg-white border-4 border-white shadow-xl flex items-center justify-center overflow-hidden">
                    {isCameraActive ? (
                      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover transform -scale-x-100"></video>
                    ) : profileForm.file ? (
                      <img src={URL.createObjectURL(profileForm.file)} alt="Preview" className="w-full h-full object-cover" />
                    ) : profileForm.avatar_url ? (
                      <img src={profileForm.avatar_url} alt="Current" className="w-full h-full object-cover" />
                    ) : (
                      <UserCircle size={60} className="text-slate-300" />
                    )}
                  </div>

                  {/* Tombol Kontrol Kamera & Galeri Modern (Pill Style) */}
                  <div className="mt-5 w-full">
                    {isCameraActive ? (
                      <div className="flex gap-3 justify-center animate-in slide-in-from-bottom-2 fade-in">
                        <button type="button" onClick={capturePhoto} className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full text-sm font-bold shadow-lg shadow-emerald-500/30 transition-all flex items-center gap-2">
                          <Camera size={16}/> Jepret Foto
                        </button>
                        <button type="button" onClick={stopCamera} className="px-6 py-2.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-full text-sm font-bold transition-all">
                          Batal
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-center">
                        <div className="inline-flex bg-slate-50 p-1.5 rounded-full border border-slate-100 shadow-sm">
                          <button type="button" onClick={startCamera} className="px-5 py-2 hover:bg-white text-slate-600 hover:text-blue-600 hover:shadow-sm rounded-full text-xs font-bold transition-all flex items-center gap-2">
                            <Camera size={14}/> Live Kamera
                          </button>
                          <label className="px-5 py-2 hover:bg-white text-slate-600 hover:text-blue-600 hover:shadow-sm rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-2">
                            <Upload size={14}/> Pilih Galeri
                            <input type="file" accept="image/*" onChange={e => { stopCamera(); setProfileForm({...profileForm, file: e.target.files[0]}); }} className="hidden" />
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Password Section - Soft Card Design */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 mb-8 shadow-inner">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Key size={12} className="text-slate-400"/> Keamanan Akun
                  </label>
                  <input type="password" placeholder="Ketik password baru jika ingin diubah..." value={profileForm.password} onChange={e => setProfileForm({...profileForm, password: e.target.value})} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-sm outline-none font-bold text-slate-700 transition-all placeholder:font-medium placeholder:text-slate-400"/>
                  <p className="text-[10px] text-slate-400 font-medium leading-relaxed pt-1">
                    Biarkan kolom di atas kosong jika Anda tidak berencana mengganti kata sandi.
                  </p>
                </div>

                {/* Footer Buttons */}
                <div className="flex gap-3">
                  <button type="button" onClick={() => { stopCamera(); setIsProfileModalOpen(false); }} className="flex-1 py-3.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl font-bold text-sm transition-colors">
                    Kembali
                  </button>
                  <button type="submit" disabled={isUpdatingProfile} className="flex-[2] py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-600/30 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                    {isUpdatingProfile ? <RefreshCw size={18} className="animate-spin"/> : <Check size={18}/>} 
                    {isUpdatingProfile ? 'Memproses...' : 'Simpan Perubahan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* KEYWORD_PAYROLL_MANUAL: Modal Form Input Payroll Manual */}
        {isPayrollModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex justify-center items-center p-4">
            <div className="bg-slate-50 w-full max-w-3xl max-h-[90vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in duration-300 border border-slate-200">
              
              <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center bg-white shrink-0">
                <div>
                  <h3 className="font-black text-lg text-slate-800 flex items-center gap-2"><Wallet size={20} className="text-blue-600"/> Input Payroll Manual</h3>
                  <p className="text-xs font-bold text-slate-500 mt-1">Periode: <span className="text-blue-600">{payrollPeriod}</span></p>
                </div>
                <button type="button" onClick={() => setIsPayrollModalOpen(false)} className="p-2 bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200"><X size={16}/></button>
              </div>

              <form onSubmit={handleSaveManualPayroll} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-6 md:p-8 overflow-y-auto bg-white flex-1 custom-scrollbar space-y-6">
                  
                  {/* Pilihan Pegawai & Gaji Pokok */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Pilih Karyawan</label>
                      <select required value={payrollForm.employee_id} onChange={e => handleSelectEmployeeForPayroll(e.target.value)} className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 text-sm outline-none font-bold bg-slate-50 focus:bg-white transition-all">
                         <option value="">-- Silakan Pilih Pegawai --</option>
                         {employees.filter(e => e.status_pegawai !== 'NONAKTIF').map(emp => (
                           <option key={emp.id} value={emp.id}>{emp.nama_lengkap} ({emp.nik_karyawan})</option>
                         ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Gaji Pokok (Basic Salary)</label>
                      <input required type="number" placeholder="Cth: 5000000" value={payrollForm.basic_salary} onChange={e => setPayrollForm({...payrollForm, basic_salary: e.target.value})} className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 text-sm outline-none font-bold bg-slate-50 focus:bg-white transition-all"/>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                    
                    {/* BAGIAN PENAMBAHAN (TUNJANGAN) */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                        <h4 className="text-xs font-black text-emerald-800 uppercase tracking-widest">Penambahan [+]</h4>
                        <button type="button" onClick={() => handleAddPayrollComponent('additions')} className="text-[10px] bg-emerald-600 text-white px-2 py-1 rounded font-bold hover:bg-emerald-700 flex items-center gap-1"><Plus size={12}/> Tambah</button>
                      </div>
                      
                      {payrollForm.additions.map((item, index) => (
                        <div key={index} className="flex gap-2 items-center animate-in fade-in">
                          <input type="text" placeholder="Nama Komponen" value={item.name} onChange={e => handleUpdatePayrollComponent('additions', index, 'name', e.target.value)} className="w-1/2 px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:border-emerald-500"/>
                          <input type="number" placeholder="Nominal" value={item.amount} onChange={e => handleUpdatePayrollComponent('additions', index, 'amount', e.target.value)} className="w-1/2 px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:border-emerald-500"/>
                          <button type="button" onClick={() => handleRemovePayrollComponent('additions', index)} className="p-2 bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-100"><X size={14}/></button>
                        </div>
                      ))}
                      {payrollForm.additions.length === 0 && <p className="text-[10px] text-slate-400 italic text-center">Tidak ada komponen penambahan.</p>}
                    </div>

                    {/* BAGIAN PENGURANGAN (POTONGAN) */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center bg-rose-50 p-3 rounded-xl border border-rose-100">
                        <h4 className="text-xs font-black text-rose-800 uppercase tracking-widest">Potongan [-]</h4>
                        <button type="button" onClick={() => handleAddPayrollComponent('deductions')} className="text-[10px] bg-rose-600 text-white px-2 py-1 rounded font-bold hover:bg-rose-700 flex items-center gap-1"><Plus size={12}/> Tambah</button>
                      </div>
                      
                      {payrollForm.deductions.map((item, index) => (
                        <div key={index} className="flex gap-2 items-center animate-in fade-in">
                          <input type="text" placeholder="Nama Komponen" value={item.name} onChange={e => handleUpdatePayrollComponent('deductions', index, 'name', e.target.value)} className="w-1/2 px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:border-rose-500"/>
                          <input type="number" placeholder="Nominal" value={item.amount} onChange={e => handleUpdatePayrollComponent('deductions', index, 'amount', e.target.value)} className="w-1/2 px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:border-rose-500"/>
                          <button type="button" onClick={() => handleRemovePayrollComponent('deductions', index)} className="p-2 bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-100"><X size={14}/></button>
                        </div>
                      ))}
                      {payrollForm.deductions.length === 0 && <p className="text-[10px] text-slate-400 italic text-center">Tidak ada komponen potongan.</p>}
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-6">
                    <p className="text-[10px] font-bold text-amber-800 italic">
                      *Catatan: Sistem akan secara otomatis menghitung Pajak PPh 21, Total Kehadiran, dan Jam Kerja aktual dari HRIS saat tombol "Proses & Simpan" ditekan.
                    </p>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="p-5 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 shrink-0">
                  <button type="button" onClick={() => setIsPayrollModalOpen(false)} className="px-5 py-3 text-slate-600 hover:bg-slate-200 rounded-xl font-bold text-sm transition-colors">Batal</button>
                  <button type="submit" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-600/20 flex items-center gap-2">
                    <Check size={16}/> Proses & Simpan Gaji
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL INPUT CASHFLOW */}
        {isCashflowModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[90] flex justify-center items-center p-4">
            <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in duration-300">
              <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-black text-lg text-slate-800">Form Arus Kas</h3>
                <button type="button" onClick={() => setIsCashflowModalOpen(false)} className="p-2 bg-slate-200 text-slate-600 rounded-full hover:bg-slate-300"><X size={16}/></button>
              </div>
              <form onSubmit={handleSaveCashflow} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Tipe</label>
                    <select value={cashflowForm.type} onChange={e => setCashflowForm({...cashflowForm, type: e.target.value})} className={`w-full p-3 border-2 border-slate-200 rounded-xl text-sm font-bold outline-none ${cashflowForm.type === 'INCOME' ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'}`}>
                      <option value="INCOME">Pemasukan [+]</option><option value="EXPENSE">Pengeluaran [-]</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Tanggal</label>
                    <input required type="date" value={cashflowForm.date} onChange={e => setCashflowForm({...cashflowForm, date: e.target.value})} className="w-full p-3 border-2 border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-500 bg-slate-50"/>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Kategori Jurnal</label>
                  <input required type="text" placeholder="Cth: Biaya Listrik / Retensi Klien" value={cashflowForm.category} onChange={e => setCashflowForm({...cashflowForm, category: e.target.value})} className="w-full p-3 border-2 border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-500 bg-slate-50"/>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Nominal (Rp)</label>
                  <input required type="number" min="0" value={cashflowForm.amount} onChange={e => setCashflowForm({...cashflowForm, amount: e.target.value})} className="w-full p-3 border-2 border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-500 bg-slate-50"/>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Keterangan / Notes</label>
                  <textarea rows="2" value={cashflowForm.description} onChange={e => setCashflowForm({...cashflowForm, description: e.target.value})} className="w-full p-3 border-2 border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-500 bg-slate-50 resize-none"></textarea>
                </div>
                <button type="submit" className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-md transition-all">Simpan Transaksi</button>
              </form>
            </div>
          </div>
        )}

        {/* MODAL INPUT INVOICE */}
        {isInvoiceModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[90] flex justify-center items-center p-4">
            <div className="bg-slate-50 w-full max-w-4xl max-h-[90vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in duration-300">
              <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center bg-white shrink-0">
                <h3 className="font-black text-lg text-slate-800 flex items-center gap-2"><Receipt size={20} className="text-blue-600"/> Pembuatan Tagihan (Invoice)</h3>
                <button type="button" onClick={() => setIsInvoiceModalOpen(false)} className="p-2 bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200"><X size={16}/></button>
              </div>
              <form onSubmit={handleSaveInvoice} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-6 md:p-8 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
                  
                  {/* Data Klien & Tanggal */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-3">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Tujuan / Nama Klien</label>
                      <input required type="text" placeholder="PT Contoh Perusahaan Tbk." value={invoiceForm.client_name} onChange={e => setInvoiceForm({...invoiceForm, client_name: e.target.value})} className="w-full p-3 border border-slate-200 rounded-lg text-sm font-bold bg-slate-50 outline-none focus:border-blue-500"/>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Nomor Dokumen</label>
                      <input required type="text" value={invoiceForm.invoice_number} onChange={e => setInvoiceForm({...invoiceForm, invoice_number: e.target.value})} className="w-full p-3 border border-slate-200 rounded-lg text-sm font-bold bg-slate-50 outline-none focus:border-blue-500"/>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Tanggal Terbit</label>
                      <input required type="date" value={invoiceForm.date} onChange={e => setInvoiceForm({...invoiceForm, date: e.target.value})} className="w-full p-3 border border-slate-200 rounded-lg text-sm font-bold bg-slate-50 outline-none focus:border-blue-500"/>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Jatuh Tempo</label>
                      <input required type="date" value={invoiceForm.due_date} onChange={e => setInvoiceForm({...invoiceForm, due_date: e.target.value})} className="w-full p-3 border border-slate-200 rounded-lg text-sm font-bold bg-slate-50 outline-none focus:border-blue-500"/>
                    </div>
                  </div>

                  {/* Rincian Item Tagihan */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <h4 className="text-xs font-black text-slate-700 uppercase">Rincian Item Jasa/Produk</h4>
                      <button type="button" onClick={handleAddInvoiceItem} className="text-[10px] bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg font-bold hover:bg-blue-100 flex items-center gap-1"><Plus size={12}/> Item Baru</button>
                    </div>
                    {invoiceForm.items.map((item, index) => (
                      <div key={index} className="flex flex-col md:flex-row gap-3 items-end animate-in fade-in pb-3 border-b border-slate-50 last:border-0">
                        <div className="flex-1 w-full"><input required type="text" placeholder="Deskripsi Jasa / Barang" value={item.desc} onChange={e => handleUpdateInvoiceItem(index, 'desc', e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500"/></div>
                        <div className="w-full md:w-24"><input required type="number" min="1" placeholder="Qty" value={item.qty} onChange={e => handleUpdateInvoiceItem(index, 'qty', e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-lg text-xs text-center outline-none focus:border-blue-500"/></div>
                        <div className="w-full md:w-40"><input required type="number" min="0" placeholder="Harga Satuan" value={item.price} onChange={e => handleUpdateInvoiceItem(index, 'price', e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500"/></div>
                        <div className="w-full md:w-auto mt-2 md:mt-0"><button type="button" onClick={() => handleRemoveInvoiceItem(index)} className="p-2.5 bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-100 w-full md:w-auto flex justify-center"><X size={14}/></button></div>
                      </div>
                    ))}
                  </div>

                  {/* Pajak, Diskon & Catatan Tambahan */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div><textarea placeholder="Syarat & Ketentuan / Catatan Bank..." value={invoiceForm.notes} onChange={e => setInvoiceForm({...invoiceForm, notes: e.target.value})} className="w-full h-full min-h-[100px] p-4 bg-white border border-slate-200 rounded-2xl text-xs font-medium outline-none focus:border-blue-500 resize-none"></textarea></div>
                    <div className="bg-slate-100 p-5 rounded-2xl border border-slate-200 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-500">Tarif Pajak PPN (%)</span>
                        <input type="number" value={invoiceForm.tax_rate} onChange={e => setInvoiceForm({...invoiceForm, tax_rate: e.target.value})} className="w-20 p-2 border border-slate-200 rounded-lg text-xs text-right outline-none font-bold"/>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-500">Potongan Diskon (Rp)</span>
                        <input type="number" value={invoiceForm.discount} onChange={e => setInvoiceForm({...invoiceForm, discount: e.target.value})} className="w-32 p-2 border border-slate-200 rounded-lg text-xs text-right outline-none font-bold"/>
                      </div>
                    </div>
                  </div>

                </div>
                <div className="p-5 border-t border-slate-200 bg-white flex justify-end gap-3 shrink-0">
                  <button type="button" onClick={() => setIsInvoiceModalOpen(false)} className="px-5 py-3 text-slate-600 hover:bg-slate-100 rounded-xl font-bold text-sm transition-colors">Batal</button>
                  <button type="submit" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md transition-all">Terbitkan Invoice</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* MODAL SLIP GAJI (POP-UP) */}
        {/* ========================================== */}
        {selectedPayslip && (
          <div className="fixed inset-0 z-[99] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-[#f8fafc] w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
              
              {/* HEADER MODAL & TOMBOL CLOSE */}
              <div className="flex justify-between items-center p-5 border-b border-slate-200 bg-white">
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                  <Receipt size={20} className="text-blue-600"/> Rincian Slip Gaji
                </h3>
                <button onClick={() => setSelectedPayslip(null)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors">
                  <X size={20}/>
                </button>
              </div>

              {/* KONTEN KERTAS PAYSLIP (BISA DI-SCROLL) */}
              <div className="flex-1 overflow-y-auto p-8 bg-slate-100 custom-scrollbar">
                <div className="max-w-xl mx-auto shadow-[0_10px_40px_rgba(0,0,0,0.1)]">
                  
                  {/* --- AREA YANG AKAN DI-PRINT PDF (HEX COLOR FIX) --- */}
                  <div id={`payslip-${selectedPayslip.id}`} className="border border-[#cbd5e1] p-8 rounded-xl bg-[#ffffff] text-[#0f172a] relative">
                     
                     {/* HEADER SURAT */}
                     <div className="flex justify-between items-start border-b-2 border-[#1e293b] pb-4 mb-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#1e293b] text-[#ffffff] rounded-lg flex items-center justify-center font-black text-sm">
                            {appConfig.short}
                          </div>
                          <div>
                            <h2 className="text-base font-black text-[#0f172a] uppercase tracking-widest leading-tight">{appConfig.name}</h2>
                            <p className="text-[10px] text-[#475569] font-medium mt-0.5">Slip Gaji Karyawan</p>
                          </div>
                        </div>
                     </div>

                     {/* INFO KARYAWAN */}
                     <table className="w-full text-xs mb-6 border-collapse border border-[#1e293b]">
                        <tbody>
                           <tr>
                              <td className="bg-[#f1f5f9] font-bold p-2.5 w-1/3 border border-[#1e293b]">Nama Lengkap</td>
                              <td className="p-2.5 border border-[#1e293b] font-bold">{selectedPayslip.employee?.nama_lengkap}</td>
                           </tr>
                           <tr>
                              <td className="bg-[#f1f5f9] font-bold p-2.5 border border-[#1e293b]">NIK / Divisi</td>
                              <td className="p-2.5 border border-[#1e293b]">{selectedPayslip.employee?.nik_karyawan} / {selectedPayslip.employee?.bidang_jasa}</td>
                           </tr>
                           <tr>
                              <td className="bg-[#f1f5f9] font-bold p-2.5 border border-[#1e293b]">Periode Gaji</td>
                              <td className="p-2.5 border border-[#1e293b] font-black">{selectedPayslip.period}</td>
                           </tr>
                           <tr>
                              <td className="bg-[#f1f5f9] font-bold p-2.5 border border-[#1e293b]">Kehadiran</td>
                              <td className="p-2.5 border border-[#1e293b]">{selectedPayslip.total_work_days} Hari Masuk</td>
                           </tr>
                        </tbody>
                     </table>

                     {/* PENGHASILAN (EARNINGS) */}
                     <table className="w-full text-xs mb-5 border-collapse border border-[#1e293b]">
                        <thead className="bg-[#1e293b] text-[#ffffff]">
                           <tr>
                              <th className="p-2.5 text-left border-r border-[#334155]">PENGHASILAN</th>
                              <th className="p-2.5 text-right">NOMINAL</th>
                           </tr>
                        </thead>
                        <tbody>
                           <tr>
                              <td className="p-2.5 border border-[#1e293b] font-semibold">Gaji Pokok</td>
                              <td className="p-2.5 border border-[#1e293b] text-right">{formatRupiah(selectedPayslip.basic_salary)}</td>
                           </tr>
                           {(selectedPayslip.additions || []).map((add, i) => (
                           <tr key={i}>
                              <td className="p-2.5 border border-[#1e293b] font-semibold">{add.name}</td>
                              <td className="p-2.5 border border-[#1e293b] text-right">{formatRupiah(add.amount)}</td>
                           </tr>
                           ))}
                           <tr className="bg-[#f1f5f9]">
                              <td className="p-2.5 border border-[#1e293b] text-right font-black">Total Kotor</td>
                              <td className="p-2.5 border border-[#1e293b] text-right font-black">{formatRupiah(selectedPayslip.gross_salary)}</td>
                           </tr>
                        </tbody>
                     </table>

                     {/* POTONGAN (DEDUCTIONS) */}
                     <table className="w-full text-xs mb-6 border-collapse border border-[#1e293b]">
                        <thead className="bg-[#1e293b] text-[#ffffff]">
                           <tr>
                              <th className="p-2.5 text-left border-r border-[#334155]">POTONGAN</th>
                              <th className="p-2.5 text-right">NOMINAL</th>
                           </tr>
                        </thead>
                        <tbody>
                           <tr>
                              <td className="p-2.5 border border-[#1e293b] font-semibold">PPh 21</td>
                              <td className="p-2.5 border border-[#1e293b] text-right">{formatRupiah(selectedPayslip.tax_pph21)}</td>
                           </tr>
                           {(selectedPayslip.deductions || []).map((ded, i) => (
                           <tr key={i}>
                              <td className="p-2.5 border border-[#1e293b] font-semibold">{ded.name}</td>
                              <td className="p-2.5 border border-[#1e293b] text-right">{formatRupiah(ded.amount)}</td>
                           </tr>
                           ))}
                        </tbody>
                     </table>

                     {/* TAKE HOME PAY */}
                     <table className="w-full border-collapse border border-[#0f172a] mb-6">
                        <tbody>
                           <tr className="bg-[#0f172a] text-[#ffffff] font-black">
                              <td className="p-4 text-left text-sm">TAKE HOME PAY</td>
                              <td className="p-4 text-right text-lg">{formatRupiah(selectedPayslip.net_salary)}</td>
                           </tr>
                        </tbody>
                     </table>
                     
                     <p className="text-[9px] text-[#64748b] italic text-center">
                        Dokumen ini sah dan diterbitkan otomatis oleh sistem pada {new Date().toLocaleDateString('id-ID')}.
                     </p>
                  </div>
                  {/* --- AKHIR AREA PRINT PDF --- */}
                  
                </div>
              </div>

              {/* FOOTER MODAL & TOMBOL DOWNLOAD */}
              <div className="p-5 border-t border-slate-200 bg-white flex justify-end gap-4">
                 <button onClick={() => setSelectedPayslip(null)} className="px-6 py-3 text-slate-500 hover:bg-slate-100 rounded-xl font-bold text-sm transition-colors">
                   Tutup
                 </button>
                 <button 
                   onClick={() => handleDownloadPDF(`payslip-${selectedPayslip.id}`, `Payslip_${selectedPayslip.employee?.nama_lengkap}_${selectedPayslip.period}.pdf`)} 
                   className="px-6 py-3 bg-[#0a195c] hover:bg-blue-900 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-900/30 flex items-center gap-2 transition-all active:scale-95"
                 >
                   <Download size={18}/> Download PDF
                 </button>
              </div>

            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TEMPLATE PDF ARUS KAS (DISEMBUNYIKAN TAPI TETAP DI-RENDER) */}
        {/* ========================================== */}
        {/* Perbaikan: Tetap di pojok kiri atas agar tidak error, tapi dibuat transparan & tidak bisa diklik */}
        <div className="fixed top-0 left-0 -z-50 opacity-0 pointer-events-none">
           
           {/* Perbaikan: Menggunakan w-[190mm] agar pas persis dengan kertas A4 (210mm) dikurangi margin kiri-kanan 10mm */}
           <div id="cashflow-pdf-report" className="bg-[#ffffff] text-[#1e293b] font-sans w-[190mm] p-8 box-border relative">
              
              {/* WATERMARK PERUSAHAAN */}
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none overflow-hidden">
                {appConfig.logo_url ? (
                    <img src={appConfig.logo_url} crossOrigin="anonymous" className="w-[120mm] object-contain grayscale" alt="watermark" />
                ) : (
                    <span className="text-[150px] font-black">{appConfig.short}</span>
                )}
              </div>

              {/* HEADER SURAT */}
              <div className="flex justify-between items-start border-b-4 border-[#0f172a] pb-6 mb-6 relative z-10 w-full">
                 <div className="flex items-center gap-4 max-w-[70%]">
                    {/* LOGO DARI DATABASE */}
                    <div className="w-16 h-16 bg-[#ffffff] text-[#0f172a] rounded-xl flex items-center justify-center font-black text-3xl shrink-0 overflow-hidden border border-[#e2e8f0] shadow-sm">
                      {appConfig.logo_url ? (
                        <img src={appConfig.logo_url} crossOrigin="anonymous" alt="Logo" className="w-full h-full object-contain p-1" />
                      ) : (
                        appConfig.short
                      )}
                    </div>
                    <div className="flex flex-col justify-center">
                       <h1 className="text-xl font-black uppercase tracking-widest text-[#0f172a] leading-tight mb-1 truncate">{appConfig.name}</h1>
                       <p className="text-xs font-semibold text-[#64748b] m-0">Laporan Konsolidasi Arus Kas Perusahaan</p>
                    </div>
                 </div>
                 <div className="text-right shrink-0 max-w-[30%]">
                    <p className="text-[9px] font-black text-[#94a3b8] uppercase tracking-widest mb-1">Periode Laporan</p>
                    <p className="text-lg font-black text-[#2563eb] border-2 border-[#2563eb] px-3 py-1 rounded-lg inline-block bg-[#eff6ff]">{cashflowPeriod}</p>
                 </div>
              </div>

              {/* KOTAK RINGKASAN */}
              <div className="flex gap-4 mb-6 relative z-10 w-full box-border">
                 <div className="flex-1 border border-[#e2e8f0] p-4 rounded-xl bg-[#f8fafc] w-[33%] overflow-hidden">
                    <p className="text-[9px] font-black text-[#64748b] uppercase tracking-wider mb-2">Total Pemasukan</p>
                    <p className="text-lg font-black text-[#059669] truncate">{formatRupiah(monthIncome)}</p>
                 </div>
                 <div className="flex-1 border border-[#e2e8f0] p-4 rounded-xl bg-[#f8fafc] w-[33%] overflow-hidden">
                    <p className="text-[9px] font-black text-[#64748b] uppercase tracking-wider mb-2">Total Pengeluaran</p>
                    <p className="text-lg font-black text-[#e11d48] truncate">{formatRupiah(monthExpense)}</p>
                 </div>
                 <div className="flex-1 border border-[#0f172a] p-4 rounded-xl bg-[#0f172a] text-white shadow-lg w-[33%] overflow-hidden">
                    <p className="text-[9px] font-black text-[#94a3b8] uppercase tracking-wider mb-2">Saldo Berjalan</p>
                    <p className="text-lg font-black text-[#ffffff] truncate">{formatRupiah(monthIncome - monthExpense)}</p>
                 </div>
              </div>

              {/* TABEL DATA ARUS KAS */}
              <div className="relative z-10 w-full box-border">
                 <table className="w-full text-left border-collapse border border-[#cbd5e1] mb-6 table-fixed">
                    <thead className="bg-[#f1f5f9] text-[9px] font-black text-[#334155] uppercase tracking-wider">
                       <tr>
                          <th className="p-2 border border-[#cbd5e1] w-[18%]">Tanggal</th>
                          <th className="p-2 border border-[#cbd5e1] w-[42%]">Kategori & Keterangan</th>
                          <th className="p-2 border border-[#cbd5e1] w-[15%] text-center">Jenis</th>
                          <th className="p-2 border border-[#cbd5e1] w-[25%] text-right">Nominal</th>
                       </tr>
                    </thead>
                    <tbody className="text-[11px] font-medium text-[#1e293b]">
                       {currentMonthCashflows.map(cf => (
                          <tr key={cf.id} className="even:bg-[#f8fafc]">
                             <td className="p-2 border border-[#cbd5e1] whitespace-nowrap">{cf.date}</td>
                             <td className="p-2 border border-[#cbd5e1] break-words">
                                <span className="font-bold block text-[#0f172a] mb-0.5">{cf.category}</span>
                                <span className="text-[9px] text-[#64748b] leading-tight block">{cf.description}</span>
                             </td>
                             <td className="p-2 border border-[#cbd5e1] text-center">
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase inline-block ${cf.type === 'INCOME' ? 'bg-[#d1fae5] text-[#059669]' : 'bg-[#ffe4e6] text-[#e11d48]'}`}>
                                   {cf.type === 'INCOME' ? 'Masuk' : 'Keluar'}
                                </span>
                             </td>
                             <td className="p-2 border border-[#cbd5e1] text-right font-black whitespace-nowrap">
                                {formatRupiah(cf.amount)}
                             </td>
                          </tr>
                       ))}
                       {currentMonthCashflows.length === 0 && (
                          <tr><td colSpan="4" className="text-center py-6 text-[#94a3b8] font-semibold">Tidak ada transaksi tercatat pada periode ini.</td></tr>
                       )}
                    </tbody>
                 </table>
              </div>

              {/* KOLOM TANDA TANGAN */}
              <div className="mt-8 flex justify-end relative z-10 w-full">
                 <div className="text-center w-[45mm]">
                    <p className="text-[10px] text-[#64748b] mb-12">Dibuat & Disetujui Oleh,</p>
                    <div className="border-b border-[#cbd5e1] mb-1 pb-1">
                       <p className="text-xs font-bold text-[#0f172a] truncate">{currentUser.name}</p>
                    </div>
                    <p className="text-[8px] text-[#94a3b8] uppercase tracking-widest truncate">{currentUser.role || 'Admin Perusahaan'}</p>
                 </div>
              </div>

           </div>
        </div>
      </main>

      {/* MOBILE BOTTOM NAVIGATION (PROTECTED) */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white border-t border-slate-200 flex justify-around items-center px-2 py-3 pb-6 z-40 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
        {hasPermission('hris', 'view') && (
          <button onClick={() => setActiveMenu('hris')} className={`flex flex-col items-center gap-1.5 w-16 transition-colors ${activeMenu === 'hris' ? appConfig.text : 'text-slate-400'}`}>
            <div className={`p-1.5 rounded-xl ${activeMenu === 'hris' ? appConfig.light : 'bg-transparent'}`}><Users size={22} className={activeMenu === 'hris' ? `fill-blue-100 ${appConfig.text}` : ''} /></div>
            <span className={`text-[10px] font-bold ${activeMenu === 'hris' ? appConfig.text : 'font-medium'}`}>HRIS</span>
          </button>
        )}
        {hasPermission('task', 'view') && (
          <button onClick={() => setActiveMenu('task')} className={`flex flex-col items-center gap-1.5 w-16 transition-colors ${activeMenu === 'task' ? appConfig.text : 'text-slate-400'}`}>
            <div className={`p-1.5 rounded-xl ${activeMenu === 'task' ? appConfig.light : 'bg-transparent'}`}><CheckSquare size={22} className={activeMenu === 'task' ? `fill-blue-100 ${appConfig.text}` : ''} /></div>
            <span className={`text-[10px] font-bold ${activeMenu === 'task' ? appConfig.text : 'font-medium'}`}>Task</span>
          </button>
        )}
        {hasPermission('finance', 'view') && (
          <button onClick={() => setActiveMenu('finance')} className={`flex flex-col items-center gap-1.5 w-16 transition-colors ${activeMenu === 'finance' ? appConfig.text : 'text-slate-400'}`}>
            <div className={`p-1.5 rounded-xl ${activeMenu === 'finance' ? appConfig.light : 'bg-transparent'}`}><Wallet size={22} className={activeMenu === 'finance' ? `fill-blue-100 ${appConfig.text}` : ''} /></div>
            <span className={`text-[10px] font-bold ${activeMenu === 'finance' ? appConfig.text : 'font-medium'}`}>Finance</span>
          </button>
        )}
        {hasPermission('settings', 'view') && (
          <button onClick={() => setActiveMenu('settings')} className={`flex flex-col items-center gap-1.5 w-16 transition-colors ${activeMenu === 'settings' ? appConfig.text : 'text-slate-400'}`}>
            <div className={`p-1.5 rounded-xl ${activeMenu === 'settings' ? appConfig.light : 'bg-transparent'}`}><Settings size={22} className={activeMenu === 'settings' ? `fill-blue-100 ${appConfig.text}` : ''} /></div>
            <span className={`text-[10px] font-bold ${activeMenu === 'settings' ? appConfig.text : 'font-medium'}`}>Sistem</span>
          </button>
        )}
      </nav>
    </div>
  );
}