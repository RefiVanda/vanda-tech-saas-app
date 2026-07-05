import React, { useState, useEffect } from 'react';
import { Briefcase, User, GraduationCap, Activity, Award, ShieldAlert, HelpCircle, FileUp, Plus, Trash2, CheckCircle2, Search, ArrowLeft } from 'lucide-react';

const FormRekrutmen = () => {
  const [activeView, setActiveView] = useState('form'); 

  // =======================================================================
  // --- [STATE & FUNGSI CEK STATUS - TANPA SUPABASE] ---
  // =======================================================================
  const [nikCek, setNikCek] = useState('');
  const [hasilCek, setHasilCek] = useState(null);
  const [errorCek, setErrorCek] = useState('');
  const [isChecking, setIsChecking] = useState(false);

  const handleCekStatus = async (e) => {
    e.preventDefault();
    setErrorCek(''); 
    setHasilCek(null);
    setIsChecking(true);
    
    setTimeout(() => {
      if (nikCek === '1234567890123456') {
        setHasilCek({
          nama_lengkap: 'Budi Santoso (Data Dummy)',
          status: 'INTI',
          lokasi_penempatan: 'Head Office - Jakarta'
        });
      } else if (nikCek.length === 16) {
        setHasilCek({
          nama_lengkap: 'Pelamar Baru (Data Dummy)',
          status: 'PENDING',
          lokasi_penempatan: null
        });
      } else {
        setErrorCek('Data pelamar dengan NIK tersebut tidak ditemukan. (Masukkan 16 digit)');
      }
      setIsChecking(false);
    }, 1500);
  };
  // =======================================================================


  // =======================================================================
  // --- [STATE & FUNGSI FORM REKRUTMEN - TANPA SUPABASE] ---
  // =======================================================================
  const [formData, setFormData] = useState({
    bidang_jasa: 'Security (Satpam)', posisi_jabatan: '', alamat_domisili: '', nama_lengkap: '', nik_ktp: '', kewarganegaraan: 'WNI', jenis_kelamin: 'Laki-laki', 
    tempat_lahir: '', tanggal_lahir: '', agama: 'Islam', status_pernikahan: 'TK/0', golongan_darah: '-', no_hp: '', alamat_lengkap: '', no_telp: '',
    nama_pasangan: '', pasangan_ttl: '', pasangan_pekerjaan: '', detail_anak: '',
    kontak_darurat_nama: '', kontak_darurat_hub: '', kontak_darurat_telp: '',
    tinggi_badan: '', berat_badan: '', ukuran_baju: 'M', ukuran_celana: '', ukuran_sepatu: '',
    bertato: 'Tidak', berkacamata: 'Tidak', riwayat_operasi: 'Tidak', detail_operasi: '',
    patah_tulang: 'Tidak', sakit_serius: 'Tidak', detail_sakit: '',
    bahasa_indonesia: 'Baik', bahasa_inggris: 'Cukup',
    riwayat_kerja: '', gaji_terakhir: '', alasan_keluar: '', gaji_diharapkan: '', 
    bisa_berenang: 'Tidak', bisa_beladiri: 'Tidak', detail_beladiri: '',
    takut_tinggi: 'Tidak', detail_takut_tinggi: '', keterampilan_lain: '',
    info_lowongan: 'Iklan', kenalan_syntegra: 'Tidak', detail_kenalan: ''
  });

  const [pendidikanList, setPendidikanList] = useState([{ tingkat: 'SMA/SMK', institusi: '', jurusan: '', tahun_lulus: '', kota: '' }]);
  const [pelatihanList, setPelatihanList] = useState([{ jenis_sertifikasi: 'Gada Pratama', institusi: '', tahun: '', tingkat: '' }]);
  const [files, setFiles] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [masterPositions, setMasterPositions] = useState([]);
  const [masterDivisions, setMasterDivisions] = useState([]);

  useEffect(() => {
    const mockPositions = [
      { id: 1, name: 'Komandan Regu' },
      { id: 2, name: 'Anggota Satpam' },
      { id: 3, name: 'Staff Administrasi' },
      { id: 4, name: 'Cleaner' }
    ];
    const mockDivisions = ["Security (Satpam)", "Cleaning Service", "Parking Service", "Labour Supply (Tenaga Kerja)"];

    setMasterPositions(mockPositions);
    setMasterDivisions(mockDivisions);
    
    setFormData(prev => ({
      ...prev, 
      posisi_jabatan: mockPositions[0].name,
      bidang_jasa: mockDivisions[0]
    }));
  }, []);

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2097152) {
        alert(`Gagal! Ukuran file ${file.name} terlalu besar. Maksimal 2MB per file.`);
        e.target.value = null; 
        return;
      }
      setFiles({ ...files, [e.target.name]: file });
    }
  };

  const handlePendidikanChange = (index, field, value) => { const newList = [...pendidikanList]; newList[index][field] = value; setPendidikanList(newList); };
  const addPendidikan = () => setPendidikanList([...pendidikanList, { tingkat: 'S1', institusi: '', jurusan: '', tahun_lulus: '', kota: '' }]);
  const removePendidikan = (index) => setPendidikanList(pendidikanList.filter((_, i) => i !== index));

  const handlePelatihanChange = (index, field, value) => { const newList = [...pelatihanList]; newList[index][field] = value; setPelatihanList(newList); };
  const addPelatihan = () => setPelatihanList([...pelatihanList, { jenis_sertifikasi: '', institusi: '', tahun: '', tingkat: '' }]);
  const removePelatihan = (index) => setPelatihanList(pelatihanList.filter((_, i) => i !== index));

  const uploadFileDummy = async (file, pathName) => {
    if (!file) return null;
    return `https://dummy-storage.com/${pathName}_${file.name}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const ktpUrl = await uploadFileDummy(files.file_ktp, 'KTP'); 
      const kkUrl = await uploadFileDummy(files.file_kk, 'KK'); 
      
      const payload = {
        ...formData, 
        tinggi_badan: parseInt(formData.tinggi_badan), 
        berat_badan: parseInt(formData.berat_badan),
        berkas_ktp_url: ktpUrl, 
        berkas_kk_url: kkUrl,
        riwayat_pendidikan: JSON.stringify(pendidikanList), 
        riwayat_pelatihan: JSON.stringify(pelatihanList), 
        status: 'PENDING'
      };

      console.log("SIMULASI PENGIRIMAN DATA (PAYLOAD):", payload);
      alert("Simulasi Sukses: Lamaran berhasil dikirim dan disimulasikan tersimpan! (Cek console log)");
      window.location.reload(); 
    } catch (error) {
      alert("Terjadi kesalahan saat mengirim lamaran: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  // =======================================================================

  // --- REFINED TAIWIND CLASSES FOR BLUE THEME ---
  const inputClass = "w-full bg-white border border-slate-200 text-slate-800 text-sm rounded-xl focus:ring-4 focus:ring-blue-50 focus:border-blue-500 block p-3 transition-all duration-200 outline-none shadow-sm placeholder:text-slate-400";
  const labelClass = "block mb-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wider";
  const sectionCardClass = "bg-white rounded-3xl p-6 md:p-8 shadow-xl shadow-slate-100/50 border border-slate-100 space-y-6";
  const iconHeaderClass = "bg-blue-50 text-blue-600 p-2.5 rounded-xl border border-blue-100/50";

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 font-sans pb-16 selection:bg-blue-500 selection:text-white">
      <div className="max-w-4xl mx-auto">
        
        {/* --- PREMIUM BLUE HERO HEADER --- */}
        <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 rounded-3xl p-8 md:p-10 text-black shadow-2xl relative overflow-hidden mb-8">
          <div className="absolute top-[-50%] right-[-20%] w-96 h-96 bg-blue-500 opacity-20 blur-3xl rounded-full"></div>
          <div className="absolute bottom-[-30%] left-[-10%] w-80 h-80 bg-indigo-500 opacity-20 blur-3xl rounded-full"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md border border-white/10 shrink-0">
              <img className="w-16 h-16 object-contain" src="./Logo_apps.png" alt="Logo" onError={(e) => e.target.style.display='none'} />
            </div>
            
            <div className="flex-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-400/20 text-black rounded-full text-[10px] font-bold tracking-wider uppercase mb-3 border border-blue-400/30">
                <span className="w-1.5 h-1.5 bg-yellow-300 rounded-full animate-pulse"></span>
                Portal Karir Resmi
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2">
                {activeView === 'form' ? 'Formulir Pendaftaran Kerja' : 'Cek Status Seleksi'}
              </h1>
              <p className="text-blue-100/80 text-xs md:text-sm max-w-xl leading-relaxed">
                {activeView === 'form' 
                  ? 'Isi data profil Anda secara lengkap dan valid. Pastikan dokumen pendukung ter-upload dengan jelas.'
                  : 'Pantau perkembangan berkas Anda secara real-time menggunakan nomor identitas resmi.'}
              </p>
            </div>
            
            {activeView === 'form' ? (
              <button onClick={() => setActiveView('status')} className="bg-white text-blue-900 hover:bg-blue-50 px-5 py-3 rounded-xl font-bold text-xs shadow-lg transition-all hover:-translate-y-0.5 flex items-center gap-2 shrink-0 group">
                <Search size={14} className="group-hover:scale-110 transition-transform"/> Cek Status Lamaran
              </button>
            ) : (
              <button onClick={() => setActiveView('form')} className="bg-white/10 hover:bg-white/15 text-white backdrop-blur-md px-5 py-3 rounded-xl font-bold text-xs border border-white/10 transition-all hover:-translate-y-0.5 flex items-center gap-2 shrink-0">
                <ArrowLeft size={14}/> Kembali ke Formulir
              </button>
            )}
          </div>
        </div>
        
        {/* ========================================================= */}
        {/* --- VIEW CEK STATUS RENDER --- */}
        {/* ========================================================= */}
        {activeView === 'status' && (
          <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-100 border border-slate-100 max-w-xl mx-auto transition-all">
            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
               <div className={iconHeaderClass}>
                 <Search size={18}/>
               </div>
               <h2 className="font-bold text-base text-slate-800">Lacak Status Pelamar</h2>
            </div>
            <form onSubmit={handleCekStatus} className="mb-6">
              <label className={labelClass}>Nomor Induk Kependudukan (NIK)</label>
              <input 
                type="number" 
                placeholder="Contoh: 1234567890123456" 
                required 
                className={`${inputClass} mb-4 focus:ring-blue-500/10 focus:border-blue-500`} 
                value={nikCek}
                onChange={(e) => setNikCek(e.target.value)} 
              />
              <button type="submit" disabled={isChecking} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold text-sm transition-all shadow-md">
                {isChecking ? 'Mengecek Database...' : 'Periksa Sekarang'}
              </button>
            </form>

            {errorCek && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center text-xs font-medium border border-red-100">{errorCek}</div>}
            
            {hasilCek && (
              <div className="bg-slate-50 p-6 rounded-2xl text-center border border-slate-200/60 mt-4 shadow-inner">
                <p className="text-xs text-slate-400 mb-1 font-medium">Nama Pelamar ditemukan:</p>
                <p className="font-bold text-lg text-slate-800 mb-3">{hasilCek.nama_lengkap}</p>
                
                <div className="inline-block px-5 py-2 rounded-xl text-xs font-bold text-white mb-4 shadow-sm" 
                     style={{ backgroundColor: hasilCek.status === 'INTI' ? '#2563eb' : hasilCek.status === 'BANK_DATA' ? '#475569' : '#0ea5e9' }}>
                  {hasilCek.status === 'INTI' ? 'Lolos Kualifikasi (INTI)' : hasilCek.status === 'BANK_DATA' ? 'Masuk Bank Data' : 'Proses Seleksi / Pending'}
                </div>
                
                {hasilCek.status === 'INTI' && hasilCek.lokasi_penempatan && (
                  <div className="bg-white p-3 rounded-xl border border-slate-200 max-w-xs mx-auto shadow-sm">
                    <p className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Penempatan</p>
                    <p className="font-semibold text-sm text-slate-700">{hasilCek.lokasi_penempatan}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* --- VIEW FORM RENDER --- */}
        {/* ========================================================= */}
        {activeView === 'form' && (
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* -- 1. Posisi & Domisili -- */}
            <div className={sectionCardClass}>
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className={iconHeaderClass}><Briefcase size={18}/></div>
                <h2 className="font-bold text-base text-slate-800">1. Informasi Posisi & Domisili</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className={labelClass}>Bidang Jasa (Divisi)</label>
                  <select name="bidang_jasa" value={formData.bidang_jasa} onChange={handleInputChange} className={inputClass} required>
                    <option value="" disabled>-- Pilih Divisi --</option>
                    {masterDivisions.map((div, index) => (
                      <option key={index} value={div}>{div}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Posisi Jabatan Dilamar</label>
                  <select name="posisi_jabatan" value={formData.posisi_jabatan} onChange={handleInputChange} required className={inputClass}>
                    <option value="" disabled>-- Pilih Posisi --</option>
                    {masterPositions.map(pos => (
                      <option key={pos.id} value={pos.name}>{pos.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Alamat Lengkap Domisili</label>
                  <textarea name="alamat_domisili" placeholder="Kota, Kecamatan, Nama Jalan..." onChange={handleInputChange} required className={inputClass} rows="1"></textarea>
                </div>
              </div>
            </div>

            {/* -- 2. Data Diri Pribadi -- */}
            <div className={sectionCardClass}>
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className={iconHeaderClass}><User size={18}/></div>
                <h2 className="font-bold text-base text-slate-800">2. Identitas Diri Pelamar</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div><label className={labelClass}>Nama Lengkap (Sesuai KTP)</label><input type="text" name="nama_lengkap" placeholder="Masukkan nama..." onChange={handleInputChange} required className={inputClass} /></div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2"><label className={labelClass}>NIK KTP</label><input type="number" name="nik_ktp" placeholder="16 Digit" onChange={handleInputChange} required className={inputClass} /></div>
                  <div><label className={labelClass}>Warga Negara</label><input type="text" name="kewarganegaraan" value={formData.kewarganegaraan} onChange={handleInputChange} required className={inputClass} /></div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={labelClass}>Tempat Lahir</label><input type="text" name="tempat_lahir" placeholder="Kota Lahir" onChange={handleInputChange} required className={inputClass} /></div>
                  <div><label className={labelClass}>Tanggal Lahir</label><input type="date" name="tanggal_lahir" onChange={handleInputChange} required className={inputClass} /></div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={labelClass}>Jenis Kelamin</label><select name="jenis_kelamin" onChange={handleInputChange} className={inputClass}><option value="Laki-laki">Laki-laki</option><option value="Perempuan">Perempuan</option></select></div>
                  <div><label className={labelClass}>Golongan Darah</label><select name="golongan_darah" onChange={handleInputChange} className={inputClass}><option value="-">Tidak Tahu (-)</option><option value="A">A</option><option value="B">B</option><option value="AB">AB</option><option value="O">O</option></select></div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div><label className={labelClass}>Agama</label><select name="agama" onChange={handleInputChange} className={inputClass}><option value="Islam">Islam</option><option value="Kristen">Kristen</option><option value="Katolik">Katolik</option><option value="Hindu">Hindu</option><option value="Buddha">Buddha</option><option value="Konghucu">Konghucu</option></select></div>
                  <div>
                    <label className={labelClass}>Status Pernikahan (PTKP)</label>
                    <select name="status_pernikahan" onChange={handleInputChange} className={`${inputClass} font-semibold text-blue-600 bg-blue-50/40 border-blue-100`}>
                      <optgroup label="Tidak Kawin (TK)"><option value="TK/0">TK/0 (0 Tanggungan)</option><option value="TK/1">TK/1 (1 Tanggungan)</option><option value="TK/2">TK/2 (2 Tanggungan)</option><option value="TK/3">TK/3 (3 Tanggungan)</option></optgroup>
                      <optgroup label="Kawin (K)"><option value="K/0">K/0 (0 Tanggungan)</option><option value="K/1">K/1 (1 Tanggungan)</option><option value="K/2">K/2 (2 Tanggungan)</option><option value="K/3">K/3 (3 Tanggungan)</option></optgroup>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={labelClass}>WhatsApp Aktif</label><input type="number" name="no_hp" placeholder="08xxxxxxxx" onChange={handleInputChange} required className={inputClass} /></div>
                  <div><label className={labelClass}>No. Telp Rumah/Alt</label><input type="number" name="no_telp" placeholder="Opsional" onChange={handleInputChange} className={inputClass} /></div>
                </div>
              </div>

              <div>
                <label className={labelClass}>Alamat Sesuai KTP</label>
                <textarea name="alamat_lengkap" placeholder="Tuliskan alamat lengkap sesuai berkas KTP asli..." onChange={handleInputChange} required className={inputClass} rows="2"></textarea>
              </div>

              {formData.status_pernikahan !== 'TK/0' && (
                <div className="bg-slate-50 border border-slate-200/60 p-5 rounded-2xl space-y-4">
                  <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wide border-b border-slate-200 pb-2">Detail Tanggungan Keluarga</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {formData.status_pernikahan.startsWith('K/') && (
                      <>
                        <div><label className={labelClass}>Nama Pasangan</label><input type="text" name="nama_pasangan" onChange={handleInputChange} className={inputClass} /></div>
                        <div><label className={labelClass}>TTL Pasangan</label><input type="text" name="pasangan_ttl" onChange={handleInputChange} className={inputClass} /></div>
                        <div><label className={labelClass}>Pekerjaan Pasangan</label><input type="text" name="pasangan_pekerjaan" onChange={handleInputChange} className={inputClass} /></div>
                      </>
                    )}
                    {(!formData.status_pernikahan.endsWith('/0') || formData.status_pernikahan.startsWith('K/')) && (
                      <div className="md:col-span-3">
                        <label className={labelClass}>Data Anak / Tanggungan Lain</label>
                        <textarea name="detail_anak" placeholder="Format: Nama Lengkap - Hubungan Keluarga - TTL" onChange={handleInputChange} className={inputClass} rows="2"></textarea>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* -- 3. Pendidikan Formal -- */}
            <div className={sectionCardClass}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className={iconHeaderClass}><GraduationCap size={18}/></div>
                  <h2 className="font-bold text-base text-slate-800">3. Riwayat Pendidikan Formal</h2>
                </div>
                <button type="button" onClick={addPendidikan} className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 border border-blue-100"><Plus size={14}/> Tambah Baris</button>
              </div>
              
              <div className="space-y-3">
                {pendidikanList.map((item, index) => (
                  <div key={index} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 relative group/row">
                    {pendidikanList.length > 1 && (
                      <button type="button" onClick={() => removePendidikan(index)} className="absolute top-2 right-2 md:-top-2 md:-right-2 bg-red-50 text-red-600 hover:bg-red-100 p-1.5 rounded-full shadow-sm border border-red-200 md:opacity-0 group-hover/row:opacity-100 transition-all"><Trash2 size={12}/></button>
                    )}
                    <div className="md:col-span-2"><label className={labelClass}>Tingkat</label><select value={item.tingkat} onChange={(e) => handlePendidikanChange(index, 'tingkat', e.target.value)} className={inputClass}><option value="SMA/SMK">SMA/SMK</option><option value="D3">D3</option><option value="S1">S1</option></select></div>
                    <div className="md:col-span-4"><label className={labelClass}>Institusi/Sekolah</label><input type="text" value={item.institusi} onChange={(e) => handlePendidikanChange(index, 'institusi', e.target.value)} required className={inputClass} /></div>
                    <div className="md:col-span-3"><label className={labelClass}>Jurusan</label><input type="text" value={item.jurusan} onChange={(e) => handlePendidikanChange(index, 'jurusan', e.target.value)} className={inputClass} /></div>
                    <div className="md:col-span-1"><label className={labelClass}>Lulus</label><input type="number" value={item.tahun_lulus} onChange={(e) => handlePendidikanChange(index, 'tahun_lulus', e.target.value)} required className={inputClass} /></div>
                    <div className="md:col-span-2"><label className={labelClass}>Kota</label><input type="text" value={item.kota} onChange={(e) => handlePendidikanChange(index, 'kota', e.target.value)} required className={inputClass} /></div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                <div><label className={labelClass}>Kemampuan Bahasa Indonesia</label><select name="bahasa_indonesia" onChange={handleInputChange} className={inputClass}><option value="Baik">Baik / Aktif</option><option value="Cukup">Cukup</option><option value="Kurang">Kurang</option></select></div>
                <div><label className={labelClass}>Kemampuan Bahasa Inggris</label><select name="bahasa_inggris" onChange={handleInputChange} className={inputClass}><option value="Baik">Baik / Aktif</option><option value="Cukup">Cukup</option><option value="Kurang">Kurang</option></select></div>
              </div>
            </div>

            {/* -- 4. Kuesioner Fisik -- */}
            <div className={sectionCardClass}>
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className={iconHeaderClass}><Activity size={18}/></div>
                <h2 className="font-bold text-base text-slate-800">4. Kuesioner Fisik & Rekam Medis</h2>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                <div><label className={labelClass}>Tinggi Badan (cm)</label><input type="number" name="tinggi_badan" placeholder="cm" onChange={handleInputChange} required className={inputClass} /></div>
                <div><label className={labelClass}>Berat Badan (kg)</label><input type="number" name="berat_badan" placeholder="kg" onChange={handleInputChange} required className={inputClass} /></div>
                <div><label className={labelClass}>Ukuran Baju</label><select name="ukuran_baju" onChange={handleInputChange} className={inputClass}><option value="S">S</option><option value="M">M</option><option value="L">L</option><option value="XL">XL</option><option value="XXL">XXL</option></select></div>
                <div><label className={labelClass}>Ukuran Celana</label><input type="number" placeholder="No. Celana" name="ukuran_celana" onChange={handleInputChange} required className={inputClass} /></div>
                <div className="col-span-2 sm:col-span-1"><label className={labelClass}>Ukuran Sepatu</label><input type="number" placeholder="No. Sepatu" name="ukuran_sepatu" onChange={handleInputChange} required className={inputClass} /></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
                <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-semibold text-slate-700">Memiliki Tato anggota tubuh?</span>
                  <select name="bertato" onChange={handleInputChange} className="bg-slate-50 border-slate-200 rounded-lg text-xs p-1.5 focus:ring-blue-500 font-bold text-slate-800"><option value="Tidak">Tidak</option><option value="Ya">Ya</option></select>
                </div>
                <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-semibold text-slate-700">Menggunakan Kacamata?</span>
                  <select name="berkacamata" onChange={handleInputChange} className="bg-slate-50 border-slate-200 rounded-lg text-xs p-1.5 focus:ring-blue-500 font-bold text-slate-800"><option value="Tidak">Tidak</option><option value="Ya">Ya</option></select>
                </div>
                <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-semibold text-slate-700">Riwayat Patah Tulang?</span>
                  <select name="patah_tulang" onChange={handleInputChange} className="bg-slate-50 border-slate-200 rounded-lg text-xs p-1.5 focus:ring-blue-500 font-bold text-slate-800"><option value="Tidak">Tidak</option><option value="Ya">Ya</option></select>
                </div>
                
                <div className="flex flex-col bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-700">Pernah Menjalani Operasi?</span>
                    <select name="riwayat_operasi" onChange={handleInputChange} className="bg-slate-50 border-slate-200 rounded-lg text-xs p-1.5 focus:ring-blue-500 font-bold text-slate-800"><option value="Tidak">Tidak</option><option value="Ya">Ya</option></select>
                  </div>
                  {formData.riwayat_operasi === 'Ya' && <input type="text" name="detail_operasi" placeholder="Jelaskan jenis operasi & tahun..." onChange={handleInputChange} className="mt-2.5 bg-blue-50/50 border-blue-100 rounded-lg p-2.5 text-xs text-blue-700 outline-none w-full" />}
                </div>

                <div className="flex flex-col bg-white p-3 rounded-xl border border-slate-200 shadow-sm md:col-span-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-700">Pernah Sakit Serius dalam 1 Tahun Terakhir?</span>
                    <select name="sakit_serius" onChange={handleInputChange} className="bg-slate-50 border-slate-200 rounded-lg text-xs p-1.5 focus:ring-blue-500 font-bold text-slate-800"><option value="Tidak">Tidak</option><option value="Ya">Ya</option></select>
                  </div>
                  {formData.sakit_serius === 'Ya' && <input type="text" name="detail_sakit" placeholder="Sebutkan nama diagnosa penyakit..." onChange={handleInputChange} className="mt-2.5 bg-blue-50/50 border-blue-100 rounded-lg p-2.5 text-xs text-blue-700 outline-none w-full" />}
                </div>
              </div>
            </div>

            {/* -- 5. Sertifikasi & Pekerjaan -- */}
            <div className={sectionCardClass}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className={iconHeaderClass}><Award size={18}/></div>
                  <h2 className="font-bold text-base text-slate-800">5. Kualifikasi Kompetensi & Jam Kerja</h2>
                </div>
                <button type="button" onClick={addPelatihan} className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 border border-blue-100"><Plus size={14}/> Tambah Berkas</button>
              </div>

              <div className="space-y-3">
                {pelatihanList.map((item, index) => (
                  <div key={index} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 relative group/pelatihan">
                    {pelatihanList.length > 1 && (
                      <button type="button" onClick={() => removePelatihan(index)} className="absolute top-2 right-2 md:-top-2 md:-right-2 bg-red-50 text-red-600 hover:bg-red-100 p-1.5 rounded-full shadow-sm border border-red-200 md:opacity-0 group-hover/pelatihan:opacity-100 transition-all"><Trash2 size={12}/></button>
                    )}
                    <div className="md:col-span-4"><label className={labelClass}>Nama Kursus/Sertifikasi</label><input type="text" placeholder="Misal: Gada Pratama" value={item.jenis_sertifikasi} onChange={(e) => handlePelatihanChange(index, 'jenis_sertifikasi', e.target.value)} className={inputClass} /></div>
                    <div className="md:col-span-4"><label className={labelClass}>Lembaga Penerbit</label><input type="text" placeholder="Misal: Polda / Instansi" value={item.institusi} onChange={(e) => handlePelatihanChange(index, 'institusi', e.target.value)} className={inputClass} /></div>
                    <div className="md:col-span-2"><label className={labelClass}>Tahun</label><input type="number" value={item.tahun} onChange={(e) => handlePelatihanChange(index, 'tahun', e.target.value)} className={inputClass} /></div>
                    <div className="md:col-span-2"><label className={labelClass}>Kualifikasi</label><input type="text" placeholder="Dasar/Madya" value={item.tingkat} onChange={(e) => handlePelatihanChange(index, 'tingkat', e.target.value)} className={inputClass} /></div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Kemampuan Berenang</label>
                  <select name="bisa_berenang" onChange={handleInputChange} className={inputClass}><option value="Tidak">Tidak Menguasai</option><option value="Ya">Menguasai (Bisa)</option></select>
                </div>
                <div>
                  <label className={labelClass}>Kemampuan Seni Bela Diri</label>
                  <select name="bisa_beladiri" onChange={handleInputChange} className={inputClass}><option value="Tidak">Tidak Menguasai</option><option value="Ya">Menguasai (Bisa)</option></select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelClass}>Keterangan Bela Diri</label><input type="text" name="detail_beladiri" placeholder="Sebutkan sabuk/aliran silat..." onChange={handleInputChange} className={inputClass} /></div>
                <div><label className={labelClass}>Keterampilan Tambahan Lainnya</label><input type="text" name="keterampilan_lain" placeholder="Misal: SIM A, Teknisi, dll" onChange={handleInputChange} className={inputClass} /></div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-4">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide border-b border-slate-200 pb-2">Pengalaman Kerja Sebelumnya</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className={labelClass}>Rincian Pekerjaan Terakhir</label>
                      <textarea name="riwayat_kerja" placeholder="Nama Perusahaan - Jabatan - Durasi Bekerja" onChange={handleInputChange} rows="2" className={`${inputClass} bg-white`}></textarea>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className={labelClass}>Gaji Terakhir</label><input type="text" name="gaji_terakhir" placeholder="Rp" onChange={handleInputChange} className={`${inputClass} bg-white`} /></div>
                      <div><label className={labelClass}>Gaji Ekspektasi</label><input type="text" name="gaji_diharapkan" placeholder="Rp" onChange={handleInputChange} className={`${inputClass} bg-white`} /></div>
                    </div>
                    <div><label className={labelClass}>Alasan Berhenti Kerja</label><input type="text" name="alasan_keluar" placeholder="Alasan utama resign..." onChange={handleInputChange} className={`${inputClass} bg-white`} /></div>
                  </div>
                </div>
              </div>
            </div>

            {/* -- 6. Kontak Darurat & Info -- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className={sectionCardClass}>
                <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                  <div className={iconHeaderClass}><ShieldAlert size={18}/></div>
                  <h2 className="font-bold text-base text-slate-800">6. Kontak Darurat (Wajib)</h2>
                </div>
                <div className="space-y-3">
                  <div><label className={labelClass}>Nama Wali/Kerabat</label><input type="text" name="kontak_darurat_nama" placeholder="Keluarga/Kerabat terdekat" onChange={handleInputChange} required className={inputClass} /></div>
                  <div><label className={labelClass}>Status Hubungan</label><input type="text" name="kontak_darurat_hub" placeholder="Misal: Kakak, Orang Tua" onChange={handleInputChange} required className={inputClass} /></div>
                  <div><label className={labelClass}>Nomor Ponsel Kontak</label><input type="number" name="kontak_darurat_telp" placeholder="08xxxxxxxx" onChange={handleInputChange} required className={inputClass} /></div>
                </div>
              </div>

              <div className={sectionCardClass}>
                <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                  <div className={iconHeaderClass}><HelpCircle size={18}/></div>
                  <h2 className="font-bold text-base text-slate-800">7. Info Referensi</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className={labelClass}>Sumber Informasi Loker</label>
                    <select name="info_lowongan" onChange={handleInputChange} className={inputClass}>
                        <option value="Iklan">Iklan / Media Sosial</option><option value="Teman">Teman</option><option value="Keluarga">Keluarga</option><option value="Teman Kerja">Teman Kerja</option>
                    </select>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                    <label className={labelClass}>Apakah Memiliki Kenalan Internal?</label>
                    <select name="kenalan_syntegra" onChange={handleInputChange} className={`${inputClass} mb-2.5 font-semibold text-slate-700`}><option value="Tidak">Tidak Ada</option><option value="Ya">Ya, Ada</option></select>
                    {formData.kenalan_syntegra === 'Ya' && (
                      <input type="text" name="detail_kenalan" placeholder="Sebutkan Nama & Jabatan internal..." onChange={handleInputChange} className={inputClass} />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* -- 8. Unggah Dokumen -- */}
            <div className={sectionCardClass}>
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className={iconHeaderClass}><FileUp size={18}/></div>
                <div>
                  <h2 className="font-bold text-base text-slate-800">8. Unggah Berkas & Lampiran Dokumen</h2>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">Format valid berkas: JPG, PNG, atau PDF (Ukuran maksimal 2MB per file)</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: "Pas Foto Berwarna", name: "file_pas_foto", req: true }, { label: "KTP Asli", name: "file_ktp", req: true },
                  { label: "Kartu Keluarga", name: "file_kk", req: true }, { label: "Ijazah Terakhir", name: "file_ijazah", req: true },
                  { label: "Buku Rekening", name: "file_rek", req: true }, { label: "SKCK Aktif", name: "file_skck", req: true },
                ].map((item, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-200 p-3 rounded-xl transition-all hover:bg-slate-100/50">
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 truncate">
                      {item.label} {item.req && <span className="text-red-500">*</span>}
                    </label>
                    <input type="file" name={item.name} onChange={handleFileChange} required={item.req} 
                      className="block w-full text-[11px] text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100 cursor-pointer" 
                    />
                  </div>
                ))}

                {[
                  { label: "Surat Sehat", name: "file_surat_sehat", req: true }, { label: "Sertifikat Vaksin", name: "file_vaksin", req: true },
                  { label: "Surat Referensi Kerja", name: "file_referensi_kerja" }, { label: "CV / Surat Lamaran", name: "file_cv" },
                  { label: "Sertifikat Gada/Lainnya", name: "file_sertifikat" }, { label: "NPWP", name: "file_npwp" },
                  { label: "BPJS Ketenagakerjaan", name: "file_bpjs_tk" }, { label: "BPJS Kesehatan", name: "file_bpjs_kes" }, { label: "SIM (A/C)", name: "file_sim" }
                ].map((item, idx) => (
                  <div key={idx} className="bg-white border border-slate-200 border-dashed p-3 rounded-xl transition-all hover:bg-slate-50/50">
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 truncate">{item.label} <span className="font-normal text-[10px] italic text-slate-400">(Opsional)</span></label>
                    <input type="file" name={item.name} onChange={handleFileChange} 
                      className="block w-full text-[11px] text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-slate-100 file:text-slate-600 hover:file:bg-slate-200 cursor-pointer" 
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* -- Submit Button (NON STICKY) -- */}
            <div className="pt-4">
              <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5 mb-6 flex flex-col md:flex-row items-center gap-4">
                  <div className="bg-blue-100 text-blue-600 p-3 rounded-full shrink-0"><CheckCircle2 size={24}/></div>
                  <p className="text-xs text-blue-900/80 font-medium leading-relaxed text-center md:text-left">
                    "Dengan menekan tombol submit di bawah, saya menyatakan bersedia ditempatkan di unit kerja manapun sesuai kebutuhan operasional Perusahaan. Seluruh berkas yang diunggah dipastikan asli tanpa rekayasa."
                  </p>
              </div>
              
              <div className="mt-4 mb-6">
                <button 
                    type="submit" 
                    disabled={isSubmitting} 
                    className={`w-full block font-bold py-4 px-6 text-sm rounded-xl transition-all shadow-lg ${isSubmitting ? 'bg-slate-400 text-slate-200 shadow-none cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20 hover:-translate-y-0.5'}`}
                >
                  {isSubmitting ? 'SEDANG MENGUNGGAH BERKAS LAMARAN...' : 'KIRIM DATA LAMARAN PEKERJAAN'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default FormRekrutmen;