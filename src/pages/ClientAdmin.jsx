import { useState, useEffect, useRef } from 'react';
import { 
  Camera, Menu, X, CheckSquare, Wallet, Settings, 
  Users, Bell, Search, FileText, 
  ShieldAlert, Clock, ArrowUpRight, ArrowDownRight,
  ChevronLeft, ChevronRight, UserCircle, LogOut,
  UserPlus, Database, QrCode, Download, CheckCircle2, 
  Trash2, MapPin, LayoutDashboard, Receipt, CreditCard, 
  TrendingUp, TrendingDown, Activity, BarChart3, Building, MessageSquare, Plus, Send, FolderTree, RefreshCw,
  ClipboardCheck, Check, XCircle, History, Upload, UserX, Shield, Key, Briefcase, KeyRound 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase'; 
import * as XLSX from 'xlsx';

// TAMBAHKAN STRUKTUR DEFAULT PERMISSION DI BAWAH IMPORT:

const defaultRolePermissions = {
  hris: { view: false, create: false, edit: false, delete: false },
  task: { view: false, create: false, edit: false, delete: false },
  approval: { view: false, approve: false },
  laporan: { view: false, export: false },
  finance: { view: false, create: false, edit: false, delete: false },
  settings: { view: false, edit: false }
};

const menuModules = [
  { id: 'hris', label: 'HRIS & Database', actions: ['view', 'create', 'edit', 'delete'] },
  { id: 'task', label: 'Task Management', actions: ['view', 'create', 'edit', 'delete'] },
  { id: 'approval', label: 'Pusat Approval', actions: ['view', 'approve'] },
  { id: 'laporan', label: 'Laporan & Arsip', actions: ['view', 'export'] },
  { id: 'finance', label: 'Finance & Reimburse', actions: ['view', 'create', 'edit', 'delete'] },
  { id: 'settings', label: 'Pengaturan Sistem', actions: ['view', 'edit'] }
];

export default function ClientAdmin() {
  const [activeMenu, setActiveMenu] = useState('hris');
  const [activeTaskLevel, setActiveTaskLevel] = useState('Level 1');
  
  const [hrisTab, setHrisTab] = useState('absensi'); 
  const [financeTab, setFinanceTab] = useState('overview');
  const [laporanTab, setLaporanTab] = useState('patroli');
  const [settingTab, setSettingTab] = useState('gps_rules');
  const [rekrutmenSubTab, setRekrutmenSubTab] = useState('PENDING');

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
    
    setCurrentUser({ ...parsedSession, avatar: initials, client_id: null });

    // CRITICAL: Panggil fungsi langsung menggunakan data dari session (Mencegah ID Kosong)
    fetchAllData(parsedSession.id, parsedSession.role);
  }, []);

  // 2. UPDATE fetchAllData (Menggunakan Smart Detector & Isolasi Multi-Tenant)
  const fetchAllData = async (userId, sessionRole) => {
    try {
      if (!userId) return;

      let myProfile = null;

      // SMART DETECTOR: Cek apakah login menggunakan UUID atau NIK
      const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
      
      if (isValidUUID) {
        const { data } = await supabase.from('employees').select('id, client_id, role').eq('id', userId).single();
        myProfile = data;
      } else {
        const { data } = await supabase.from('employees').select('id, client_id, role').eq('nik_karyawan', userId).single();
        myProfile = data;
      }

      if (!myProfile) {
        console.warn("Profil tidak ditemukan! Cek koneksi atau database.");
        return;
      }

      const myClientId = myProfile.client_id;
      const myRole = myProfile.role;
      
      // LOGIKA MULTI-TENANT: HANYA Super Admin/Developer yang bisa lihat semua data lintas perusahaan
      const isSuper = myRole === 'Super Admin' || myRole === 'Developer';

      setCurrentUser(prev => ({ ...prev, id: myProfile.id, client_id: myClientId, role: myRole }));

      const buildQuery = (tableName, selectQuery = '*') => {
        let q = supabase.from(tableName).select(selectQuery);
        // Jika Admin Perusahaan, KUNCI data HANYA untuk client_id perusahaannya
        if (!isSuper && myClientId) q = q.eq('client_id', myClientId);
        return q;
      };

      // 3. TARIK SEMUA DATA
      const { data: candData } = await buildQuery('candidates').order('created_at', { ascending: false });
      if (candData) setCandidates(candData);

      const { data: empData } = await buildQuery('employees').order('created_at', { ascending: false });
      if (empData) {
        const filteredEmp = empData.filter(e => e.role !== 'Super Admin' && e.role !== 'Developer');
        setEmployees(filteredEmp.map(e => ({ ...e, hasTaskAccess: e.has_task_access, hasMobileAccess: e.has_mobile_access })));
      }

      const { data: attData } = await buildQuery('attendances', '*, employees(nama_lengkap, lokasi_penempatan)').order('date', { ascending: false });
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

      const { data: clientDataRes } = await supabase.from('clients').select('*').order('name', { ascending: true });
      if (clientDataRes) setClientsList(clientDataRes); 
      
      const { data: locData } = await buildQuery('office_locations');
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

  // ==========================================
  // FUNGSI IMPORT & EXPORT EXCEL MASSAL (KARYAWAN & PELAMAR)
  // ==========================================
  
  // 1. EXPORT KARYAWAN
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
  // FUNGSI CEK HAK AKSES (RBAC PROTECTOR)
  // ==========================================
  const hasPermission = (moduleId, action) => {
    // 1. Jalur Tol (Bypass) HANYA untuk role sistem utama
    const superRoles = ['Admin Perusahaan', 'Super Admin', 'Developer'];
    const currentRole = currentUser.role ? currentUser.role.trim() : '';

    if (superRoles.includes(currentRole)) return true;

    // 2. Cari profil role user di database
    const userRole = companyRoles.find(r => r.id === currentRole || r.name === currentRole);
    if (!userRole) return false; // Default: Kunci akses jika tidak ada role
    
    // 3. Cek matriks izin (checkbox)
    const perms = typeof userRole.permissions === 'string' ? JSON.parse(userRole.permissions) : userRole.permissions;
    return perms?.[moduleId]?.[action] === true;
  };

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
          employee_id: reqTarget.employee_id, date: reqTarget.date, ...updatePayload,
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
      const newPerms = { ...prev.permissions };
      newPerms[moduleId][action] = !newPerms[moduleId][action];
      // Jika view dimatikan, matikan juga semua aksi lain di modul itu
      if (action === 'view' && !newPerms[moduleId].view) {
        Object.keys(newPerms[moduleId]).forEach(key => newPerms[moduleId][key] = false);
      }
      // Jika aksi lain dihidupkan, otomatis hidupkan view
      if (action !== 'view' && newPerms[moduleId][action]) {
        newPerms[moduleId].view = true;
      }
      return { ...prev, permissions: newPerms };
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

  // FUNGSI DOWNLOAD TEMPLATE EXCEL (CSV)
  const downloadTemplateAbsen = () => {
    // Format kolom disederhanakan: NIK, Tanggal, Jam Masuk, Jam Keluar
    const csvContent = "data:text/csv;charset=utf-8,NIK_KARYAWAN,TANGGAL(YYYY-MM-DD),JAM_MASUK(HH:MM),JAM_KELUAR(HH:MM)\n12345678,2026-07-06,08:00,17:00\n87654321,2026-07-06,07:50,17:10";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Template_Edit_Massal_Absensi.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // FUNGSI BACA DAN IMPORT DATA EXCEL (CSV)
  const handleImportAbsen = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      const rows = text.split('\n').filter(row => row.trim() !== ''); // Pisahkan per baris
      
      if (rows.length <= 1) return alert("File kosong atau format salah.");

      const dataRows = rows.slice(1); // Buang baris pertama (Header NIK, dll)
      let successCount = 0;
      let errorCount = 0;

      // 1. Tarik master data karyawan untuk mencocokkan NIK ke employee_id
      const { data: empData } = await supabase.from('employees').select('id, nik_karyawan');
      if (!empData) return alert("Gagal menarik data master karyawan dari server.");

      // 2. Looping data dari file CSV
      for (const row of dataRows) {
        const cols = row.split(','); // Pisahkan antar kolom dengan koma
        if (cols.length >= 4) {
          const nik = cols[0].trim();
          const date = cols[1].trim();
          const timeIn = cols[2].trim();
          const timeOut = cols[3].trim();

          const employee = empData.find(emp => emp.nik_karyawan === nik);
          
          if (employee && date) {
            // Cek apakah data absen di tanggal itu sudah ada di database
            const { data: existingAtt } = await supabase.from('attendances')
              .select('id').eq('employee_id', employee.id).eq('date', date).single();

            let updatePayload = {};
            if (timeIn) updatePayload.check_in_time = `${timeIn}:00`;
            if (timeOut) updatePayload.check_out_time = `${timeOut}:00`;

            if (existingAtt) {
              // Jika sudah ada: UPDATE jamnya
              const { error } = await supabase.from('attendances').update(updatePayload).eq('id', existingAtt.id);
              if (!error) successCount++; else errorCount++;
            } else {
              // Jika belum ada sama sekali: INSERT data absen baru
              const { error } = await supabase.from('attendances').insert([{
                employee_id: employee.id,
                client_id: currentUser.client_id,
                date: date,
                ...updatePayload,
                status: 'HADIR',
                location_gps: 'Import Massal Sistem',
                photo_url: 'https://ui-avatars.com/api/?name=Import+Data' // Placeholder foto
              }]);
              if (!error) successCount++; else errorCount++;
            }
          } else {
            errorCount++; // Karyawan tidak ketemu atau format tanggal kosong
          }
        }
      }

      alert(`Proses Import Selesai!\n✅ Berhasil: ${successCount} baris data\n❌ Gagal/Dilewati: ${errorCount} baris data (Pastikan NIK valid)`);
      fetchAllData(); // Refresh UI tabel
      if(importAbsenRef.current) importAbsenRef.current.value = ''; // Kosongkan file
    };
    
    reader.readAsText(file); // Mulai eksekusi baca file
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
            { id: 'task', icon: CheckSquare, label: 'Task Management' },
            { id: 'approval', icon: ClipboardCheck, label: 'Pusat Approval' },
            { id: 'laporan', icon: FileText, label: 'Laporan & Pengajuan' },
            { id: 'finance', icon: Wallet, label: 'Finance Dashboard' }
          ]
          .filter(item => hasPermission(item.id, 'view')) // PROTEKSI: Sembunyikan menu jika tidak ada hak 'View'
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
              <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 border border-blue-200 flex items-center justify-center font-bold text-xs shrink-0">{currentUser.avatar || 'U'}</div>
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
                        <button onClick={downloadTemplateAbsen} className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-2 rounded-lg text-xs font-bold transition-colors shadow-sm">
                          Download Template CSV
                        </button>
                        
                        {/* Input file yang disembunyikan */}
                        <input type="file" accept=".csv" ref={importAbsenRef} onChange={handleImportAbsen} className="hidden" />
                        
                        {/* Gembok Hak Akses CREATE (Import) */}
                        {hasPermission('hris', 'create') && (
                          <button onClick={() => importAbsenRef.current.click()} className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 px-3 py-2 rounded-lg text-xs font-bold transition-colors shadow-sm flex items-center gap-1">
                            <Upload size={14}/> Upload & Import Data
                          </button>
                        )}
                      </div>
                      
                      {/* Gembok Hak Akses EDIT (Edit Massal) */}
                      {hasPermission('hris', 'edit') && (
                        <button onClick={handleToggleMassEdit} className={`${isMassEditMode ? 'bg-amber-100 text-amber-700' : 'bg-amber-50 text-amber-600'} hover:bg-amber-100 px-3 py-2 rounded-lg text-xs font-bold transition-colors`}>{isMassEditMode ? 'Batal Edit' : 'Edit Massal Jam Absen'}</button>
                      )}
                      {isMassEditMode && <button onClick={handleSaveMassEdit} className="bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-bold shadow-md hover:bg-blue-700 transition-colors">Simpan Perubahan</button>}
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
                                {!isMassEditMode ? (
                                  <>
                                    <span className="font-black text-emerald-600 block">IN: {att.check_in_time ? att.check_in_time.substring(0,5) : '--:--'}</span>
                                    <span className="font-black text-slate-500 block mt-0.5">OUT: {att.check_out_time ? att.check_out_time.substring(0,5) : '--:--'}</span>
                                  </>
                                ) : (
                                  <div className="flex flex-col gap-1.5 w-24">
                                    <div className="flex items-center gap-1"><span className="text-[10px] font-bold text-emerald-600 w-6">IN:</span> <input type="time" value={editableAttendances[att.id]?.in || ''} onChange={e => setEditableAttendances(prev => ({...prev, [att.id]: {...prev[att.id], in: e.target.value}}))} className="border border-slate-300 rounded px-1.5 py-1 text-xs outline-none focus:border-blue-500 w-full" /></div>
                                    <div className="flex items-center gap-1"><span className="text-[10px] font-bold text-slate-500 w-6">OUT:</span> <input type="time" value={editableAttendances[att.id]?.out || ''} onChange={e => setEditableAttendances(prev => ({...prev, [att.id]: {...prev[att.id], out: e.target.value}}))} className="border border-slate-300 rounded px-1.5 py-1 text-xs outline-none focus:border-blue-500 w-full" /></div>
                                  </div>
                                )}
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
                       
                       {/* TOMBOL EXCEL REKRUTMEN */}
                       <div className="flex gap-2">
                          <button onClick={exportCandidatesExcel} className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-2 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1"><Download size={14}/> Export Data Pelamar</button>
                          
                          <input type="file" accept=".xlsx, .xls" ref={importCandRef} onChange={handleImportCandidatesExcel} className="hidden" />
                          <button onClick={() => importCandRef.current.click()} className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-2 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1"><Upload size={14}/> Import Massal (Offline)</button>
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
                            {candidates.filter(c => c.status === rekrutmenSubTab).map(c => (
                              <tr key={c.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4">
                                   <span className="font-bold text-slate-800 block">{c.nama_lengkap}</span>
                                   <span className="text-[10px] text-slate-400 font-semibold uppercase">NIK KTP: {c.nik_karyawan || '-'}</span>
                                </td>
                                <td className="px-6 py-4">
                                   <span className="block font-bold text-slate-700">{c.posisi_jabatan}</span>
                                   <span className="block text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded w-max mt-1 font-semibold">{c.bidang_jasa}</span>
                                </td>
                                <td className="px-6 py-4"><span className="text-xs font-bold text-slate-700">{c.no_hp || '-'}</span></td>
                                <td className="px-6 py-4 text-center">
                                  {hasPermission('hris', 'edit') ? (
                                    <div className="flex justify-center gap-2">
                                      {rekrutmenSubTab === 'PENDING' ? (
                                        <>
                                          <button onClick={() => handleUpdateCandidateStatus(c.id, 'BANK_DATA')} className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors border border-slate-200">Ke Bank Data</button>
                                          <button onClick={() => handleAcceptToEmployee(c)} className="bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors border border-emerald-200">Angkat Karyawan</button>
                                        </>
                                      ) : (
                                        <>
                                          <button onClick={() => handleUpdateCandidateStatus(c.id, 'PENDING')} className="bg-amber-50 text-amber-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-amber-100 transition-colors border border-amber-200">Batal / Kembalikan</button>
                                          <button onClick={() => handleAcceptToEmployee(c)} className="bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors border border-emerald-200">Angkat Karyawan</button>
                                        </>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-[10px] font-bold text-slate-400 italic">No Access</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                            {candidates.filter(c => c.status === rekrutmenSubTab).length === 0 && (
                               <tr><td colSpan="4" className="text-center py-8 text-slate-400 font-bold">Tidak ada data pelamar di kategori ini.</td></tr>
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
                        
                        {/* ========================================================= */}
                        {/* 1. KONTEN TAB: LAPORAN LAPANGAN (PATROLI & REGULER) */}
                        {/* ========================================================= */}
                        {laporanTab === 'laporan_lapangan' && (
                          <>
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
                        {/* 2. KONTEN TAB: ARSIP PENGAJUAN CUTI & IZIN */}
                        {/* ========================================================= */}
                        {laporanTab === 'cuti' && (
                          <div className="overflow-x-auto animate-in fade-in">
                            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                              <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2"><FileText size={16} className="text-slate-400"/> Arsip Seluruh Pengajuan Izin & Cuti</h3>
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
                            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                              <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2"><CreditCard size={16} className="text-slate-400"/> Arsip Seluruh Reimbursement</h3>
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
                            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                              <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2"><Clock size={16} className="text-slate-400"/> Arsip Seluruh Perbaikan Absen</h3>
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

                <div className="flex gap-2 border-b border-slate-200 pb-px">
                   <button onClick={() => setSettingTab('roles')} className={`px-5 py-3 text-sm font-bold border-b-2 transition-colors ${settingTab === 'roles' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>Manajemen Jabatan (Role)</button>
                   <button onClick={() => setSettingTab('user_access')} className={`px-5 py-3 text-sm font-bold border-b-2 transition-colors ${settingTab === 'user_access' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>Akses Per Pegawai</button>
                   <button onClick={() => setSettingTab('gps_rules')} className={`px-5 py-3 text-sm font-bold border-b-2 transition-colors ${settingTab === 'gps_rules' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>Aturan GPS & Absensi</button>
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
                                   setEditPermissions({ patroli: !!perms.patroli, reguler: !!perms.reguler, cuti: !!perms.cuti, koreksi: !!perms.koreksi, reimburse: !!perms.reimburse, bebas_gps: !!perms.bebas_gps });
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
                             <button onClick={() => { setRoleForm({ id: role.id, name: role.name, description: role.description, permissions: typeof role.permissions === 'string' ? JSON.parse(role.permissions) : role.permissions }); setIsRoleModalOpen(true); }} className="flex-1 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-xs font-bold border border-indigo-100 transition-colors">Edit Akses</button>
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
                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                      <table className="w-full text-left bg-white">
                        <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase">
                          <tr>
                            <th className="px-4 py-3 border-r border-slate-200">Modul Aplikasi</th>
                            <th className="px-4 py-3 text-center">Lihat (View)</th>
                            <th className="px-4 py-3 text-center">Buat (Create)</th>
                            <th className="px-4 py-3 text-center">Ubah (Edit/Approve)</th>
                            <th className="px-4 py-3 text-center">Hapus (Delete)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm font-semibold text-slate-700">
                          {menuModules.map(module => (
                            <tr key={module.id} className="hover:bg-indigo-50/30 transition-colors">
                              <td className="px-4 py-3 border-r border-slate-100 bg-slate-50/50">{module.label}</td>
                              
                              <td className="px-4 py-3 text-center">
                                {module.actions.includes('view') ? <input type="checkbox" checked={roleForm.permissions[module.id]?.view || false} onChange={() => handleCheckboxChange(module.id, 'view')} className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"/> : <span className="text-slate-300">-</span>}
                              </td>
                              <td className="px-4 py-3 text-center">
                                {module.actions.includes('create') ? <input type="checkbox" checked={roleForm.permissions[module.id]?.create || false} onChange={() => handleCheckboxChange(module.id, 'create')} className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"/> : <span className="text-slate-300">-</span>}
                              </td>
                              <td className="px-4 py-3 text-center">
                                {(module.actions.includes('edit') || module.actions.includes('approve') || module.actions.includes('export')) ? <input type="checkbox" checked={roleForm.permissions[module.id]?.edit || roleForm.permissions[module.id]?.approve || roleForm.permissions[module.id]?.export || false} onChange={() => handleCheckboxChange(module.id, module.actions.includes('edit') ? 'edit' : module.actions.includes('approve') ? 'approve' : 'export')} className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"/> : <span className="text-slate-300">-</span>}
                              </td>
                              <td className="px-4 py-3 text-center">
                                {module.actions.includes('delete') ? <input type="checkbox" checked={roleForm.permissions[module.id]?.delete || false} onChange={() => handleCheckboxChange(module.id, 'delete')} className="w-4 h-4 rounded border-slate-300 text-rose-500 focus:ring-rose-500 cursor-pointer"/> : <span className="text-slate-300">-</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
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