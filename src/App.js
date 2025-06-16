import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from 'firebase/auth';
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc, 
    updateDoc, 
    collection, 
    addDoc, 
    query, 
    where, 
    onSnapshot, 
    serverTimestamp, 
    getDocs, 
    deleteDoc 
} from 'firebase/firestore';

// --- Konfigurasi Firebase ---
const firebaseConfig = {
    apiKey: "AIzaSyA9A33X1VjW5VveGN2DBVJV7-8yjR77NyY",
    authDomain: "advanta-report.firebaseapp.com",
    projectId: "advanta-report",
    storageBucket: "advanta-report.appspot.com",
    messagingSenderId: "1049506934296",
    appId: "1:1049506934296:web:b4656d2be9456a1bc21d6d",
    measurementId: "G-ETGNNL41R5"
};

// --- Inisialisasi Firebase ---
let app, auth, db, isFirebaseInitialized = false;
try {
    if (getApps().length === 0) {
        app = initializeApp(firebaseConfig);
    } else {
        app = getApps()[0];
    }
    auth = getAuth(app);
    db = getFirestore(app);
    isFirebaseInitialized = true;
    console.log("Firebase initialized successfully.");
} catch (error) {
    console.error("Kesalahan Inisialisasi Firebase:", error);
}

// --- Konstanta Aplikasi ---
const appId = "advanta-report";

// --- Komponen & Fungsi Bantuan ---
const resizeImage = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 800;
            const scaleSize = MAX_WIDTH / img.width;
            canvas.width = MAX_WIDTH;
            canvas.height = img.height * scaleSize;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
            resolve(dataUrl);
        };
        img.onerror = reject;
    };
    reader.onerror = reject;
});

const calculateAge = (tanamDate) => {
    if (!tanamDate) return '-';
    const startDate = new Date(tanamDate);
    const today = new Date();
    startDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffTime = Math.abs(today - startDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const calculatePercentage = (actual, target) => {
    if (!target || target === 0) return 0;
    if (actual >= target) return 100;
    return Math.round((actual / target) * 100);
};

const Icon = ({ name, className = '' }) => {
    const icons = {
        user: (<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></>),
        users: (<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>),
        megaphone: (<><path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></>),
        sun: (<><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></>),
        briefcase: (<><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></>),
        'log-out': (<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></>),
        'plus-circle': (<><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></>),
        'book-open': (<><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></>),
        calendar: (<><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></>),
        'map-pin': (<><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></>),
        target: (<><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></>),
        'bar-chart': (<><line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line></>),
        edit: (<><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></>),
        activity: (<><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></>),
        history: (<><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></>),
        trash: (<><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></>),
        check: (<polyline points="20 6 9 17 4 12"></polyline>),
        x: (<><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></>),
        loader: (<><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></>),
        inbox: (<><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path></>)
    };
    return (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>{icons[name]}</svg>);
};

const LoadingSpinner = () => (<div className="min-h-screen flex items-center justify-center bg-gray-100"><Icon name="loader" className="animate-spin text-green-600 h-12 w-12" /></div>);

const Modal = ({ children, onClose }) => (<div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4" onClick={onClose}><div className="relative" onClick={(e) => e.stopPropagation()}>{children}</div></div>);

const ConfirmationModal = ({ onConfirm, onCancel, message }) => (<Modal onClose={onCancel}><div className="bg-white p-8 rounded-lg text-center max-w-sm shadow-xl"><p className="mb-6">{message}</p><div className="flex gap-4"><button onClick={onCancel} className="w-full bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors">Batal</button><button onClick={onConfirm} className="w-full bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors">Hapus</button></div></div></Modal>);

function LoginPage({ navigateTo, onLogin, setErrorMessage, errorMessage }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        setIsLoading(true);
        try { await onLogin(email.trim(), password); } catch (error) { setErrorMessage('Email atau password salah.'); } finally { setIsLoading(false); }
    };
    return (<div className="min-h-screen flex items-center justify-center bg-gray-100 p-4"><div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-8"><div className="text-center mb-8"><img src="https://www.advanta.com/assets/images/logo-dark.png" alt="Advanta Logo" className="mx-auto h-12 mb-4" /><h2 className="text-2xl font-bold text-gray-800">Laporan Demplot</h2><p className="text-gray-500">Silakan masuk untuk melanjutkan</p></div><form onSubmit={handleSubmit}>{errorMessage && <p className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-center">{errorMessage}</p>}<div className="mb-4"><label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">Email</label><input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" required /></div><div className="mb-6"><label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">Password</label><input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" required /></div><button type="submit" disabled={isLoading} className="w-full bg-green-700 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-800 disabled:bg-green-400 flex items-center justify-center transition-colors">{isLoading && <Icon name="loader" className="animate-spin mr-2"/>} Masuk</button></form><p className="text-center text-gray-500 text-sm mt-6">Belum punya akun? <button onClick={() => navigateTo('register')} className="font-bold text-green-600 hover:text-green-700 hover:underline">Daftar di sini</button></p></div></div>);
}

function RegisterPage({ navigateTo, onRegister, setErrorMessage, errorMessage }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [workArea, setWorkArea] = useState('');
    const [role, setRole] = useState('BS');
    const [profilePhoto, setProfilePhoto] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password.length < 6) { setErrorMessage("Password harus minimal 6 karakter."); return; }
        setErrorMessage('');
        setIsLoading(true);
        try { await onRegister(email.trim(), password, name, workArea, role, profilePhoto); } catch (error) { setErrorMessage(error.message); } finally { setIsLoading(false); }
    };
    return (<div className="min-h-screen flex items-center justify-center bg-gray-100 p-4"><div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-8"><h2 className="text-2xl font-bold text-center text-gray-800 mb-8">Buat Akun Baru</h2><form onSubmit={handleSubmit} className="space-y-4">{errorMessage && <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm text-center">{errorMessage}</div>}<input type="text" placeholder="Nama Lengkap" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" required /><input type="text" placeholder="Area Kerja" value={workArea} onChange={(e) => setWorkArea(e.target.value)} className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" required /><input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" required /><input type="password" placeholder="Password (min. 6 karakter)" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" required /><select value={role} onChange={(e) => setRole(e.target.value)} className="w-full px-4 py-3 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500" required><option value="BS">BS (Business Solutions)</option><option value="Agronomis">Agronomis</option></select><div><label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="photo">Foto Profil (Opsional)</label><input id="photo" type="file" accept="image/*" onChange={(e) => setProfilePhoto(e.target.files[0])} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-green-50 file:text-green-700 hover:file:bg-green-100"/></div><button type="submit" disabled={isLoading} className="w-full bg-green-700 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-800 disabled:bg-green-400 flex items-center justify-center transition-colors">{isLoading && <Icon name="loader" className="animate-spin mr-2"/>} Daftar</button></form><p className="text-center text-gray-500 text-sm mt-6">Sudah punya akun? <button onClick={() => navigateTo('login')} className="font-bold text-green-600 hover:text-green-700 hover:underline">Masuk</button></p></div></div>);
}

function EditProfilePage({ userProfile, navigateTo, setAppModalMessage }) {
    const [name, setName] = useState(userProfile.name);
    const [workArea, setWorkArea] = useState(userProfile.workArea);
    const [profilePhoto, setProfilePhoto] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const updates = { name, workArea };
            if (profilePhoto) { updates.photoURL = await resizeImage(profilePhoto); }
            const userDocRef = doc(db, `artifacts/${appId}/users/${userProfile.uid}`);
            await updateDoc(userDocRef, updates);
            if (userProfile.role === 'BS') {
                const publicBsDocRef = doc(db, `artifacts/${appId}/public/data/bs_users`, userProfile.uid);
                await setDoc(publicBsDocRef, { name, workArea }, { merge: true });
            }
            setAppModalMessage("Profil berhasil diperbarui!");
            navigateTo('dashboard');
        } catch (error) {
            console.error("Gagal memperbarui profil:", error);
            setAppModalMessage("Gagal memperbarui profil.");
        } finally { setIsLoading(false); }
    };
    return (<div className="p-4 md:p-8 max-w-2xl mx-auto"><div className="bg-white p-8 rounded-xl shadow-lg"><h2 className="text-2xl font-bold text-gray-800 mb-6">Edit Profil</h2><form onSubmit={handleSubmit} className="space-y-4"><input type="text" placeholder="Nama Lengkap" value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border rounded-lg" required /><input type="text" placeholder="Area Kerja" value={workArea} onChange={e => setWorkArea(e.target.value)} className="w-full px-3 py-2 border rounded-lg" required /><div><label className="block text-gray-700 text-sm font-bold mb-2">Ganti Foto Profil (Opsional)</label><input type="file" accept="image/*" onChange={e => setProfilePhoto(e.target.files[0])} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-green-50 file:text-green-700 hover:file:bg-green-100"/></div><div className="flex gap-4 pt-4"><button type="button" onClick={() => navigateTo('dashboard')} className="w-full bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300">Batal</button><button type="submit" disabled={isLoading} className="w-full bg-green-700 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-800 disabled:bg-green-400 flex items-center justify-center">{isLoading && <Icon name="loader" className="animate-spin mr-2"/>} Simpan</button></div></form></div></div>);
}

function DemplotForm({ userProfile, setAppModalMessage }) {
    const [varietas, setVarietas] = useState('');
    const [tanggalTanam, setTanggalTanam] = useState('');
    const [lokasi, setLokasi] = useState('');
    const [keterangan, setKeterangan] = useState('');
    const [photo, setPhoto] = useState(null);
    const [pemilikLahan, setPemilikLahan] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const varietasOptions = ["Madu 59 F1", "Anara 81 F1", "Reva F1", "Lilac F1", "Nona 23 F1", "Beijing F1", "Deby 23 F1", "Gogor F1", "Lavanta F1", "Herra 22"];
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!photo) { setAppModalMessage("Harap unggah foto."); return; }
        if (!varietas) { setAppModalMessage("Harap pilih varietas."); return; }
        setIsLoading(true);
        try {
            const photoDataUrl = await resizeImage(photo);
            await addDoc(collection(db, `artifacts/${appId}/public/data/demplots`), { type: 'DEMPLOT', creatorId: userProfile.uid, creatorName: userProfile.name, varietas, tanggalTanam, lokasi, keterangan, photoURL: photoDataUrl, pemilikLahan, createdAt: serverTimestamp() });
            setAppModalMessage("Laporan Demplot berhasil dikirim!");
            setVarietas(''); setTanggalTanam(''); setLokasi(''); setKeterangan(''); setPhoto(null); setPemilikLahan('');
            if (document.getElementById('demplot-photo-upload')) { document.getElementById('demplot-photo-upload').value = ""; }
        } catch (error) { setAppModalMessage(`Gagal mengirim laporan.`); } finally { setIsLoading(false); }
    };
    return (<div className="bg-white p-6 rounded-lg shadow-md"><h3 className="text-xl font-bold text-gray-800 mb-4">Laporan Demplot</h3><form onSubmit={handleSubmit} className="space-y-4"><input type="text" placeholder="Nama Pemilik Lahan" value={pemilikLahan} onChange={e => setPemilikLahan(e.target.value)} className="w-full px-3 py-2 border rounded-lg" required /><div><label className="text-sm text-gray-600">Varietas</label><select value={varietas} onChange={e => setVarietas(e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-white" required><option value="" disabled>-- Pilih Varietas --</option>{varietasOptions.map(option => <option key={option} value={option}>{option}</option>)}</select></div><div><label className="text-sm text-gray-600">Tanggal Tanam</label><input type="date" value={tanggalTanam} onChange={e => setTanggalTanam(e.target.value)} className="w-full px-3 py-2 border rounded-lg" required /></div><input type="text" placeholder="Lokasi (Desa, Kecamatan, Kabupaten)" value={lokasi} onChange={e => setLokasi(e.target.value)} className="w-full px-3 py-2 border rounded-lg" required /><textarea placeholder="Keterangan (opsional)" value={keterangan} onChange={e => setKeterangan(e.target.value)} className="w-full px-3 py-2 border rounded-lg h-24"></textarea><div><label className="block text-sm font-bold text-gray-700 mb-1">Unggah Foto</label><input id="demplot-photo-upload" type="file" accept="image/*" onChange={e => setPhoto(e.target.files[0])} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-green-50 file:text-green-700 hover:file:bg-green-100" required /></div><button type="submit" disabled={isLoading} className="w-full bg-green-700 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-800 disabled:bg-green-400 flex items-center justify-center text-base">{isLoading && <Icon name="loader" className="animate-spin mr-2"/>} Kirim Laporan</button></form></div>);
}

function KegiatanForm({ userProfile, setAppModalMessage }) {
    const [selectedKegiatan, setSelectedKegiatan] = useState(null);
    const [tanggalKegiatan, setTanggalKegiatan] = useState(new Date().toISOString().slice(0, 10));
    const [lokasi, setLokasi] = useState('');
    const [keterangan, setKeterangan] = useState('');
    const [photo, setPhoto] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const activityTypes = [{ id: 'FM', label: 'FM', icon: 'users' }, { id: 'ODP', label: 'ODP (One Day Promo)', icon: 'megaphone' }, { id: 'STUDY BANDING', label: 'Study Banding / FT', icon: 'book-open' }, { id: 'FFD', label: 'FFD', icon: 'sun' }];
    const resetForm = useCallback(() => {
        setTanggalKegiatan(new Date().toISOString().slice(0, 10));
        setLokasi('');
        setKeterangan('');
        setPhoto(null);
        if (document.getElementById('kegiatan-photo-upload')) { document.getElementById('kegiatan-photo-upload').value = ""; }
    }, []);
    const handleSelectActivity = (activityId) => { setSelectedKegiatan(activityId); resetForm(); };
    const handleBackToSelection = () => { setSelectedKegiatan(null); };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedKegiatan || !photo) return;
        setIsLoading(true);
        try {
            const photoDataUrl = await resizeImage(photo);
            await addDoc(collection(db, `artifacts/${appId}/public/data/activities`), { type: 'KEGIATAN', creatorId: userProfile.uid, creatorName: userProfile.name, tanggalKegiatan, kegiatan: selectedKegiatan, lokasi, keterangan, photoURL: photoDataUrl, status: 'pending', createdAt: serverTimestamp() });
            setAppModalMessage("Laporan Kegiatan berhasil dikirim!");
            handleBackToSelection();
        } catch (error) { console.error("Gagal mengirim laporan kegiatan:", error); setAppModalMessage(`Gagal mengirim laporan.`); } finally { setIsLoading(false); }
    };
    if (!selectedKegiatan) { return (<div className="bg-white p-6 rounded-lg shadow-md"><h3 className="text-xl font-bold text-gray-800 mb-4 text-center">Pilih Jenis Laporan Kegiatan</h3><div className="grid grid-cols-2 gap-4">{activityTypes.map((type) => (<button key={type.id} type="button" onClick={() => handleSelectActivity(type.id)} className="p-4 border-2 rounded-lg flex flex-col items-center justify-center text-center transition-all duration-200 h-32 bg-white border-gray-200 hover:border-green-500 hover:bg-green-50 hover:shadow-lg text-blue-900"><Icon name={type.icon} className="h-10 w-10 mb-2" /><span className="font-semibold text-sm">{type.label}</span></button>))}</div></div>); }
    const activityDetails = activityTypes.find(a => a.id === selectedKegiatan);
    return (<div className="bg-white p-6 rounded-lg shadow-md"><div className="flex items-center gap-3 mb-4 border-b pb-3"><Icon name={activityDetails.icon} className="h-8 w-8 text-green-700" /><h3 className="text-xl font-bold text-gray-800">Laporan {activityDetails.label}</h3></div><form onSubmit={handleSubmit} className="space-y-4"><div><label className="text-sm text-gray-600">Tanggal Kegiatan</label><input type="date" value={tanggalKegiatan} onChange={e => setTanggalKegiatan(e.target.value)} className="w-full px-3 py-2 border rounded-lg" required /></div><input type="text" placeholder="Lokasi" value={lokasi} onChange={e => setLokasi(e.target.value)} className="w-full px-3 py-2 border rounded-lg" required /><textarea placeholder="Keterangan" value={keterangan} onChange={e => setKeterangan(e.target.value)} className="w-full px-3 py-2 border rounded-lg h-24"></textarea><div><label className="block text-sm font-bold text-gray-700 mb-1">Unggah Foto</label><input id="kegiatan-photo-upload" type="file" accept="image/*" onChange={e => setPhoto(e.target.files[0])} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-green-50 file:text-green-700 hover:file:bg-green-100" required /></div><div className="flex gap-4 pt-2"><button type="button" onClick={handleBackToSelection} className="w-full bg-gray-200 text-gray-800 font-bold py-3 rounded-lg hover:bg-gray-300">Kembali</button><button type="submit" disabled={isLoading} className="w-full bg-green-700 text-white font-bold py-3 rounded-lg hover:bg-green-800 disabled:bg-green-400 flex items-center justify-center text-base">{isLoading && <Icon name="loader" className="animate-spin mr-2"/>} Kirim</button></div></form></div>);
}

function TargetForm({ setAppModalMessage }) {
    const [users, setUsers] = useState([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(true);
    const [fetchError, setFetchError] = useState(null);
    const [selectedUser, setSelectedUser] = useState('');
    const [month, setMonth] = useState(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`);
    const [fm, setFm] = useState(3);
    const [odp, setOdp] = useState(1);
    const [study, setStudy] = useState(2);
    const [ffd, setFfd] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    useEffect(() => {
        setIsLoadingUsers(true);
        setFetchError(null);
        const q = query(collection(db, `artifacts/${appId}/public/data/bs_users`));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            if (querySnapshot.empty) { setFetchError("Tidak ada pengguna BS yang ditemukan."); } else {
                const bsUsers = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                bsUsers.sort((a, b) => a.name.localeCompare(b.name));
                setUsers(bsUsers);
            }
            setIsLoadingUsers(false);
        }, (error) => { console.error("Gagal mengambil data BS:", error); setFetchError("Gagal mengambil daftar BS."); setIsLoadingUsers(false); });
        return () => unsubscribe();
    }, []);
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedUser) { setAppModalMessage("Silakan pilih BS terlebih dahulu."); return; }
        setIsSubmitting(true);
        try {
            const targetId = `${selectedUser}-${month}`;
            const selectedUserName = users.find(u => u.id === selectedUser)?.name || 'Nama Tidak Diketahui';
            await setDoc(doc(db, `artifacts/${appId}/public/data/targets`, targetId), { userId: selectedUser, name: selectedUserName, month, fm: Number(fm), odp: Number(odp), study: Number(study), ffd: Number(ffd) });
            setAppModalMessage(`Target untuk ${selectedUserName} (${month}) berhasil disimpan.`);
        } catch (error) { console.error("Error saving target:", error); setAppModalMessage(`Gagal menyimpan target.`); } finally { setIsSubmitting(false); }
    };
    return (<div className="bg-white p-6 rounded-lg shadow-md"><h3 className="text-xl font-bold text-gray-800 mb-4">Set Target Bulanan BS</h3><form onSubmit={handleSubmit} className="space-y-4"><div><label className="block text-sm font-bold text-gray-700 mb-1">Pilih BS</label><select value={selectedUser} onChange={e => setSelectedUser(e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-white" required disabled={isLoadingUsers || !!fetchError}><option value="" disabled>{isLoadingUsers ? "Memuat daftar BS..." : (fetchError || "-- Pilih Nama BS --")}</option>{!isLoadingUsers && !fetchError && users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.workArea})</option>)}</select>{fetchError && <p className="text-red-500 text-xs mt-1">{fetchError}</p>}</div><div><label className="block text-sm font-bold text-gray-700 mb-1">Pilih Bulan & Tahun</label><input type="month" value={month} onChange={e => setMonth(e.target.value)} className="w-full px-3 py-2 border rounded-lg" required /></div><div><label className="block text-sm font-bold text-gray-700 mb-1">Target FM</label><input type="number" value={fm} onChange={e => setFm(e.target.value)} className="w-full px-3 py-2 border rounded-lg" required /></div><div><label className="block text-sm font-bold text-gray-700 mb-1">Target ODP</label><input type="number" value={odp} onChange={e => setOdp(e.target.value)} className="w-full px-3 py-2 border rounded-lg" required /></div><div><label className="block text-sm font-bold text-gray-700 mb-1">Target STUDY BANDING/FT</label><input type="number" value={study} onChange={e => setStudy(e.target.value)} className="w-full px-3 py-2 border rounded-lg" required /></div><div><label className="block text-sm font-bold text-gray-700 mb-1">Target FFD (per 3 bulan)</label><input type="number" value={ffd} onChange={e => setFfd(e.target.value)} className="w-full px-3 py-2 border rounded-lg" required /></div><button type="submit" disabled={isSubmitting || isLoadingUsers || !!fetchError} className="w-full bg-green-700 text-white font-bold py-2 rounded-lg hover:bg-green-800 disabled:bg-green-400 flex items-center justify-center">{isSubmitting && <Icon name="loader" className="animate-spin mr-2"/>} Simpan Target</button></form></div>);
}

function DashboardBS({ userProfile, onLogout, setAppModalMessage, navigateTo, openImageModal }) {
    const [page, setPage] = useState('kegiatan');
    const navItems = [{ id: 'kegiatan', label: 'Lap. Kegiatan', icon: 'activity' }, { id: 'demplot', label: 'Lap. Demplot', icon: 'plus-circle' }, { id: 'rekap_demplot', label: 'Rekap Demplot', icon: 'book-open' }, { id: 'target', label: 'Target Saya', icon: 'target' }, { id: 'riwayat', label: 'Riwayat', icon: 'history' }, { id: 'edit-profile', label: 'Edit Profil', icon: 'edit', action: () => navigateTo('edit-profile') }];
    return (<div className="min-h-screen bg-gray-50"><header className="bg-blue-900 shadow-lg p-4 flex justify-between items-center text-white"><div className="flex items-center gap-3"><img src={userProfile.photoURL || `https://placehold.co/40x40/EBF4EC/1a202c?text=${userProfile.name.charAt(0)}`} alt="Profile" className="h-10 w-10 rounded-full object-cover border-2 border-green-400"/><div><h1 className="text-xl font-bold">{userProfile.name}</h1><p className="text-sm text-blue-200">{userProfile.workArea}</p></div></div><button onClick={onLogout} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm flex items-center gap-2 transition-colors"><Icon name="log-out" className="h-4 w-4"/>Keluar</button></header><main className="p-4 md:p-6"><div className="mb-6 border-b border-gray-200"><nav className="flex space-x-1 sm:space-x-4 overflow-x-auto pb-2">{navItems.map(item => (<button key={item.id} onClick={() => item.action ? item.action() : setPage(item.id)} className={`py-2 px-3 sm:px-4 font-semibold whitespace-nowrap ${page === item.id ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500 hover:text-green-700'}`}><Icon name={item.icon} className="inline-block h-5 w-5 mr-1" />{item.label}</button>))}</nav></div><div className="max-w-2xl mx-auto">{page === 'kegiatan' && <div className="space-y-8"><KegiatanForm userProfile={userProfile} setAppModalMessage={setAppModalMessage} /><TargetSummaryCard userId={userProfile.uid} /></div>}{page === 'demplot' && <DemplotForm userProfile={userProfile} setAppModalMessage={setAppModalMessage} />}{page === 'rekap_demplot' && <MyDemplotRekap userId={userProfile.uid} />}{page === 'target' && <MyTargetProgress userId={userProfile.uid} />}{page === 'riwayat' && <MyReportHistory userId={userProfile.uid} openImageModal={openImageModal} setAppModalMessage={setAppModalMessage}/>}</div></main></div>);
}

function DashboardAgronomist({ userProfile, onLogout, setAppModalMessage, navigateTo, openImageModal }) {
    const [page, setPage] = useState('demplot');
    const [demplotView, setDemplotView] = useState('detail');
    const [demplotToDelete, setDemplotToDelete] = useState(null);
    const navItems = [{ id: 'demplot', label: 'Rekap Demplot', icon: 'book-open' }, { id: 'approval', label: 'Persetujuan', icon: 'inbox' }, { id: 'target', label: 'Set Target', icon: 'target' }, { id: 'rekap', label: 'Rekap Target', icon: 'bar-chart' }, { id: 'edit-profile', label: 'Edit Profil', icon: 'edit', action: () => navigateTo('edit-profile') }];
    const requestDeleteDemplot = (demplotId) => { setDemplotToDelete(demplotId); };
    const executeDeleteDemplot = async () => {
        if (!demplotToDelete) return;
        try {
            await deleteDoc(doc(db, `artifacts/${appId}/public/data/demplots`, demplotToDelete));
            setAppModalMessage("Laporan Demplot berhasil dihapus.");
        } catch (error) { console.error("Error deleting demplot:", error); setAppModalMessage("Gagal menghapus laporan demplot."); } finally { setDemplotToDelete(null); }
    };
    return (<div className="min-h-screen bg-gray-50"><header className="bg-blue-900 shadow-lg p-4 flex justify-between items-center text-white"><div className="flex items-center gap-3"><img src={userProfile.photoURL || `https://placehold.co/40x40/EBF4EC/1a202c?text=${userProfile.name.charAt(0)}`} alt="Profile" className="h-10 w-10 rounded-full object-cover border-2 border-green-400"/><div><h1 className="text-xl font-bold">{userProfile.name}</h1><p className="text-sm text-blue-200">{userProfile.workArea}</p></div></div><button onClick={onLogout} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm flex items-center gap-2 transition-colors"><Icon name="log-out" className="h-4 w-4"/>Keluar</button></header><main className="p-4 md:p-6"><div className="mb-6 border-b border-gray-200"><nav className="flex space-x-1 sm:space-x-4 overflow-x-auto pb-2">{navItems.map(item => (<button key={item.id} onClick={() => item.action ? item.action() : setPage(item.id)} className={`py-2 px-3 sm:px-4 font-semibold whitespace-nowrap ${page === item.id ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500 hover:text-green-700'}`}><Icon name={item.icon} className="inline-block h-5 w-5 mr-1" />{item.label}</button>))}</nav></div><div className="max-w-4xl mx-auto">{page === 'demplot' && (<div><div className="flex justify-center mb-4 rounded-lg p-1 bg-gray-200 w-max mx-auto"><button onClick={() => setDemplotView('detail')} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${demplotView === 'detail' ? 'bg-white text-green-700 shadow' : 'text-gray-600'}`}>Tampilan Detail</button><button onClick={() => setDemplotView('table')} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${demplotView === 'table' ? 'bg-white text-green-700 shadow' : 'text-gray-600'}`}>Tampilan Tabel</button></div>{demplotView === 'detail' ? <DemplotDetailView openImageModal={openImageModal} onDelete={requestDeleteDemplot} /> : <DemplotTableView onDelete={requestDeleteDemplot} />}</div>)}{page === 'approval' && <ApprovalList openImageModal={openImageModal} setAppModalMessage={setAppModalMessage} />}{page === 'target' && <TargetForm setAppModalMessage={setAppModalMessage} />}{page === 'rekap' && <TargetRekap />}</div></main>{demplotToDelete && (<ConfirmationModal message="Apakah Anda yakin ingin menghapus laporan demplot ini secara permanen?" onConfirm={executeDeleteDemplot} onCancel={() => setDemplotToDelete(null)} />)}</div>);
}

function DemplotDetailView({ openImageModal, onDelete }) {
    const [demplots, setDemplots] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        const q = query(collection(db, `artifacts/${appId}/public/data/demplots`));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const fetchedDemplots = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            fetchedDemplots.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
            setDemplots(fetchedDemplots);
            setIsLoading(false);
        }, (error) => { console.error("Error fetching demplots: ", error); setIsLoading(false); });
        return () => unsubscribe();
    }, []);
    if (isLoading) return <LoadingSpinner />;
    return (<div>{demplots.length > 0 ? (<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">{demplots.map(d => (<div key={d.id} className="group relative shadow-lg rounded-lg overflow-hidden"><button onClick={(e) => { e.stopPropagation(); onDelete(d.id); }} className="absolute top-1.5 right-1.5 bg-red-600 text-white p-1 rounded-full hover:bg-red-800 transition-all z-10 opacity-0 group-hover:opacity-100 focus:opacity-100" aria-label="Hapus Laporan"><Icon name="trash" className="w-4 h-4" /></button><div onClick={() => openImageModal(d.photoURL)} className="cursor-pointer"><img src={d.photoURL} alt={d.varietas} className="w-full h-32 object-cover transition-transform duration-300 group-hover:scale-110"/><div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent text-white"><p className="font-bold truncate">{d.varietas}</p><p className="text-xs truncate">{d.creatorName}</p></div></div></div>))}</div>) : (<p className="text-center text-gray-500 mt-8">Belum ada laporan demplot.</p>)}</div>);
}

function DemplotTableView({ onDelete }) {
    const [demplots, setDemplots] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        const q = query(collection(db, `artifacts/${appId}/public/data/demplots`));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const fetchedDemplots = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            fetchedDemplots.sort((a, b) => (a.creatorName || '').localeCompare(b.creatorName || ''));
            setDemplots(fetchedDemplots);
            setIsLoading(false);
        }, (error) => { console.error("Error fetching demplots for table: ", error); setIsLoading(false); });
        return () => unsubscribe();
    }, []);
    if (isLoading) return <LoadingSpinner />;
    return (<div className="bg-white p-4 sm:p-6 rounded-lg shadow-md"><div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead className="text-xs text-gray-700 uppercase bg-gray-100"><tr><th scope="col" className="px-4 py-3">Nama BS</th><th scope="col" className="px-4 py-3">Nama Petani</th><th scope="col" className="px-4 py-3">Varietas</th><th scope="col" className="px-4 py-3 text-center">Umur (Hari)</th><th scope="col" className="px-4 py-3 text-center">Aksi</th></tr></thead><tbody>{demplots.length > 0 ? demplots.map(item => (<tr key={item.id} className="border-b hover:bg-green-50"><th scope="row" className="px-4 py-4 font-medium text-gray-900 whitespace-nowrap">{item.creatorName}</th><td className="px-4 py-4">{item.pemilikLahan}</td><td className="px-4 py-4">{item.varietas}</td><td className="px-4 py-4 text-center">{calculateAge(item.tanggalTanam)}</td><td className="px-4 py-4 text-center"><button onClick={() => onDelete(item.id)} className="p-2 text-red-500 hover:bg-red-100 rounded-full" aria-label="Hapus Laporan"><Icon name="trash" className="w-5 h-5" /></button></td></tr>)) : (<tr><td colSpan="5" className="text-center py-4">Tidak ada data demplot.</td></tr>)}</tbody></table></div></div>);
}

function MyDemplotRekap({ userId }) {
    const [demplots, setDemplots] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        if (!userId) { setIsLoading(false); return; }
        const q = query(collection(db, `artifacts/${appId}/public/data/demplots`), where("creatorId", "==", userId));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const fetchedDemplots = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            fetchedDemplots.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
            setDemplots(fetchedDemplots);
            setIsLoading(false);
        }, (error) => { console.error("Error fetching my demplots: ", error); setIsLoading(false); });
        return () => unsubscribe();
    }, [userId]);
    if (isLoading) return <LoadingSpinner />;
    return (<div className="bg-white p-4 sm:p-6 rounded-lg shadow-md"><h3 className="text-xl font-bold text-gray-800 mb-4">Rekap Laporan Demplot Saya</h3><div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead className="text-xs text-gray-700 uppercase bg-gray-100"><tr><th scope="col" className="px-4 py-3">Nama Petani</th><th scope="col" className="px-4 py-3">Lokasi</th><th scope="col" className="px-4 py-3">Varietas</th><th scope="col" className="px-4 py-3 text-center">Umur (Hari)</th></tr></thead><tbody>{demplots.length > 0 ? demplots.map(item => (<tr key={item.id} className="border-b hover:bg-green-50"><th scope="row" className="px-4 py-4 font-medium text-gray-900 whitespace-nowrap">{item.pemilikLahan}</th><td className="px-4 py-4">{item.lokasi}</td><td className="px-4 py-4">{item.varietas}</td><td className="px-4 py-4 text-center">{calculateAge(item.tanggalTanam)}</td></tr>)) : (<tr><td colSpan="4" className="text-center py-4">Anda belum membuat laporan demplot.</td></tr>)}</tbody></table></div></div>);
}

function TargetSummaryCard({ userId }) {
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const month = useMemo(() => `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`, []);
    useEffect(() => {
        if (!userId) { setIsLoading(false); return; }
        const targetId = `${userId}-${month}`;
        const targetRef = doc(db, `artifacts/${appId}/public/data/targets`, targetId);
        const unsubscribe = onSnapshot(targetRef, async (targetSnap) => {
            if (!targetSnap.exists()) { setData(null); setIsLoading(false); return; }
            const targets = targetSnap.data();
            try {
                const activitiesQuery = query(collection(db, `artifacts/${appId}/public/data/activities`), where("creatorId", "==", userId), where("status", "==", "approved"));
                const activitiesSnap = await getDocs(activitiesQuery);
                const year = month.split('-')[0];
                const monthNum = month.split('-')[1];
                const startDate = new Date(year, monthNum - 1, 1);
                const endDate = new Date(year, monthNum, 0, 23, 59, 59);
                const relevantActivities = activitiesSnap.docs.map(d => d.data()).filter(act => {
                    if (!act.createdAt?.toDate) return false;
                    const activityDate = act.createdAt.toDate();
                    return activityDate >= startDate && activityDate <= endDate;
                });
                const achievements = { FM: relevantActivities.filter(a => a.kegiatan === 'FM').length, ODP: relevantActivities.filter(a => a.kegiatan === 'ODP').length, STUDY: relevantActivities.filter(a => a.kegiatan === 'STUDY BANDING').length, FFD: relevantActivities.filter(a => a.kegiatan === 'FFD').length, };
                setData({ targets, achievements });
            } catch (e) { console.error("Error fetching activities for summary:", e); setData({ targets, achievements: null }); } finally { setIsLoading(false); }
        }, (error) => { console.error("Error fetching target for summary:", error); setIsLoading(false); });
        return () => unsubscribe();
    }, [userId, month]);
    if (isLoading) return <div className="bg-white p-6 rounded-lg shadow-md text-center"><p>Memuat target...</p></div>;
    if (!data) return null;
    const { targets, achievements } = data;
    if (!achievements) return <div className="bg-white p-6 rounded-lg shadow-md text-center"><p className="text-red-500">Gagal memuat data pencapaian.</p></div>;
    const totalAchievement = Object.values(achievements).reduce((sum, val) => sum + val, 0);
    const totalTarget = (targets.fm || 0) + (targets.odp || 0) + (targets.study || 0) + (targets.ffd || 0);
    const totalPercentage = calculatePercentage(totalAchievement, totalTarget);
    return (<div className="bg-white p-6 rounded-lg shadow-md"><h3 className="text-xl font-bold text-gray-800 mb-2">Ringkasan Target Bulan Ini</h3><p className="text-sm text-gray-500 mb-4">Progres total pencapaian Anda.</p><div><div className="flex justify-between mb-1"><span className="text-base font-medium text-blue-900">Total Pencapaian</span><span className="text-sm font-medium text-blue-900">{totalAchievement} / {totalTarget}</span></div><div className="w-full bg-gray-200 rounded-full h-4"><div className="bg-green-600 h-4 rounded-full text-xs font-medium text-white text-center p-0.5 leading-none" style={{ width: `${totalPercentage}%`}}>{totalPercentage > 10 && `${totalPercentage}%`}</div></div></div></div>);
}

function MyTargetProgress({ userId }) {
    const [month, setMonth] = useState(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`);
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        if (!userId || !month) { setIsLoading(false); return; }
        setIsLoading(true);
        setError(null);
        const targetId = `${userId}-${month}`;
        const targetRef = doc(db, `artifacts/${appId}/public/data/targets`, targetId);
        const unsubscribe = onSnapshot(targetRef, async (targetSnap) => {
            if (!targetSnap.exists()) { setData(null); setIsLoading(false); return; }
            const targets = targetSnap.data();
            try {
                const activitiesQuery = query(collection(db, `artifacts/${appId}/public/data/activities`), where("creatorId", "==", userId), where("status", "==", "approved"));
                const activitiesSnap = await getDocs(activitiesQuery);
                const year = month.split('-')[0];
                const monthNum = month.split('-')[1];
                const startDate = new Date(year, monthNum - 1, 1);
                const endDate = new Date(year, monthNum, 0, 23, 59, 59);
                const relevantActivities = activitiesSnap.docs.map(doc => doc.data()).filter(act => {
                    if (!act.createdAt?.toDate) return false;
                    const activityDate = act.createdAt.toDate();
                    return activityDate >= startDate && activityDate <= endDate;
                });
                const achievements = { FM: relevantActivities.filter(a => a.kegiatan === 'FM').length, ODP: relevantActivities.filter(a => a.kegiatan === 'ODP').length, STUDY: relevantActivities.filter(a => a.kegiatan === 'STUDY BANDING').length, FFD: relevantActivities.filter(a => a.kegiatan === 'FFD').length, };
                setData({ targets, achievements });
            } catch (e) { console.error("Error fetching activities for progress:", e); setError("Gagal memuat data kegiatan."); setData({ targets, achievements: null }); } finally { setIsLoading(false); }
        }, (err) => { console.error("Error listening to target document:", err); setError("Gagal memuat data target."); setIsLoading(false); setData(null); });
        return () => unsubscribe();
    }, [userId, month]);
    const renderContent = () => {
        if (isLoading) return <LoadingSpinner />;
        if (error) return <p className="text-center text-red-500 mt-8">{error}</p>;
        if (!data) return <p className="text-center text-gray-500 mt-8">Target untuk bulan yang dipilih belum ditetapkan.</p>;
        const { targets, achievements } = data;
        if (!achievements) return <p className="text-center text-red-500 mt-8">Gagal memuat pencapaian kegiatan.</p>;
        const progressItems = [{ key: 'fm', label: 'FM', achievementKey: 'FM' }, { key: 'odp', label: 'ODP', achievementKey: 'ODP' }, { key: 'study', label: 'STUDY BANDING/FT', achievementKey: 'STUDY' }, { key: 'ffd', label: 'FFD', achievementKey: 'FFD' }];
        const totalAchievement = Object.values(achievements).reduce((sum, val) => sum + val, 0);
        const totalTarget = (targets.fm || 0) + (targets.odp || 0) + (targets.study || 0) + (targets.ffd || 0);
        const totalPercentage = calculatePercentage(totalAchievement, totalTarget);
        return (<div className="space-y-3"><div><div className="flex justify-between mb-1"><span className="text-base font-medium text-blue-900">Total Pencapaian</span><span className="text-sm font-medium text-blue-900">{totalPercentage}%</span></div><div className="w-full bg-gray-200 rounded-full h-4"><div className="bg-green-600 h-4 rounded-full" style={{ width: `${totalPercentage}%` }}></div></div></div><hr />{progressItems.map(({ key, label, achievementKey }) => {
            const achievement = achievements[achievementKey] || 0;
            const target = targets[key] || 0;
            const percentage = calculatePercentage(achievement, target);
            return (<div key={key}><div className="flex justify-between mb-1"><span className="text-base font-medium text-gray-700">{label}</span><span className="text-sm font-medium text-gray-700">{achievement} / {target}</span></div><div className="w-full bg-gray-200 rounded-full h-2.5"><div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${percentage}%` }}></div></div></div>);
        })}</div>);
    };
    return (<div className="bg-white p-6 rounded-lg shadow-md space-y-4"><div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4"><h3 className="text-xl font-bold text-gray-800">Target & Pencapaian</h3><input type="month" value={month} onChange={e => setMonth(e.target.value)} className="px-3 py-2 border rounded-lg w-full sm:w-auto" /></div>{renderContent()}</div>);
}

function MyReportHistory({ userId, openImageModal, setAppModalMessage }) {
    const [reports, setReports] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showConfirm, setShowConfirm] = useState(null);
    const getStatusBadge = (status) => {
        switch (status) {
            case 'approved': return <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-green-100 text-green-800">Disetujui</span>;
            case 'rejected': return <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-red-100 text-red-800">Ditolak</span>;
            default: return <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-yellow-100 text-yellow-800">Menunggu</span>;
        }
    };
    const fetchReports = useCallback(async () => {
        if (!userId) { setIsLoading(false); return; }
        setIsLoading(true);
        try {
            const demplotsQuery = query(collection(db, `artifacts/${appId}/public/data/demplots`), where("creatorId", "==", userId));
            const activitiesQuery = query(collection(db, `artifacts/${appId}/public/data/activities`), where("creatorId", "==", userId));
            const [demplotsSnap, activitiesSnap] = await Promise.all([getDocs(demplotsQuery), getDocs(activitiesQuery)]);
            const combined = [...demplotsSnap.docs.map(d => ({id: d.id, collection: 'demplots', ...d.data()})), ...activitiesSnap.docs.map(d => ({id: d.id, collection: 'activities', ...d.data()}))];
            combined.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
            setReports(combined);
        } catch (e) { console.error("Error fetching reports:", e); setAppModalMessage("Gagal memuat riwayat laporan."); } finally { setIsLoading(false); }
    }, [userId, setAppModalMessage]);
    useEffect(() => { fetchReports(); }, [fetchReports]);
    const handleDelete = async () => {
        if (!showConfirm) return;
        setIsLoading(true);
        try {
            await deleteDoc(doc(db, `artifacts/${appId}/public/data/${showConfirm.collection}`, showConfirm.id));
            setAppModalMessage("Laporan berhasil dihapus.");
            await fetchReports();
        } catch (e) { setAppModalMessage("Gagal menghapus laporan."); } finally { setShowConfirm(null); setIsLoading(false); }
    };
    if (isLoading) return <LoadingSpinner />;
    return (<div className="space-y-4">{reports.length > 0 ? reports.map(r => (<div key={r.id} className="bg-white p-4 rounded-lg shadow-sm border flex flex-col gap-3"><div className="flex gap-4 items-start"><img src={r.photoURL} alt="Foto Laporan" className="w-20 h-20 object-cover rounded-md cursor-pointer" onClick={() => openImageModal(r.photoURL)} /><div className="flex-1"><div className="flex justify-between items-start"><div><p className={`font-bold text-md ${r.type === 'DEMPLOT' ? 'text-green-700' : 'text-blue-700'}`}>{r.type === 'DEMPLOT' ? r.varietas : r.kegiatan}</p><p className="text-sm text-gray-600"><Icon name="map-pin" className="inline-block h-4 w-4 mr-1" />{r.lokasi}</p><p className="text-xs text-gray-500 mt-1">Tanggal: {r.type === 'DEMPLOT' ? r.tanggalTanam : r.tanggalKegiatan}</p></div>{r.type === 'KEGIATAN' && getStatusBadge(r.status)}</div></div><button onClick={() => setShowConfirm({id: r.id, collection: r.collection})} className="p-2 text-red-500 hover:bg-red-100 rounded-full self-start"><Icon name="trash" className="w-5 h-5"/></button></div>{r.status === 'rejected' && (<div className="bg-red-50 p-3 rounded-lg border border-red-200"><p className="text-sm font-bold text-red-800">Alasan Penolakan:</p><p className="text-sm text-red-700">{r.rejectionReason || 'Tidak ada alasan diberikan.'}</p></div>)}</div>)) : <p className="text-center text-gray-500 mt-8">Anda belum memiliki riwayat laporan.</p>}{showConfirm && <ConfirmationModal onConfirm={handleDelete} onCancel={() => setShowConfirm(null)} message="Apakah Anda yakin ingin menghapus laporan ini secara permanen?" />}</div>);
}

function ApprovalList({ openImageModal, setAppModalMessage }) {
    const [activities, setActivities] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [rejectionNotes, setRejectionNotes] = useState({});
    useEffect(() => {
        const q = query(collection(db, `artifacts/${appId}/public/data/activities`), where("status", "==", "pending"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const fetchedActivities = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            fetchedActivities.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
            setActivities(fetchedActivities);
            setIsLoading(false);
        }, (error) => { console.error("Error fetching approvals: ", error); setIsLoading(false); });
        return () => unsubscribe();
    }, []);
    const handleNoteChange = (id, value) => { setRejectionNotes(prev => ({ ...prev, [id]: value })); };
    const handleApproval = async (id, newStatus) => {
        try {
            const dataToUpdate = { status: newStatus };
            if (newStatus === 'rejected') {
                if(!rejectionNotes[id]){ setAppModalMessage('Harap isi alasan penolakan.'); return; }
                dataToUpdate.rejectionReason = rejectionNotes[id] || '';
            }
            await updateDoc(doc(db, `artifacts/${appId}/public/data/activities`, id), dataToUpdate);
            setAppModalMessage(`Laporan berhasil di-${newStatus}.`);
        } catch (e) { setAppModalMessage('Gagal memperbarui status laporan.'); }
    };
    if (isLoading) return <LoadingSpinner />;
    return (<div className="space-y-4">{activities.length > 0 ? activities.map(act => (<div key={act.id} className="bg-white p-4 rounded-lg shadow-sm border space-y-3"><div className="flex gap-4"><img src={act.photoURL} alt="Foto Kegiatan" className="w-24 h-24 object-cover rounded-md cursor-pointer" onClick={() => openImageModal(act.photoURL)}/><div className="flex-1"><span className="text-xs font-semibold uppercase text-blue-800 bg-blue-100 px-2 py-1 rounded-full">{act.kegiatan}</span><p className="text-sm font-semibold mt-2">{act.creatorName}</p><p className="text-sm text-gray-600">{act.lokasi}</p><p className="text-xs text-gray-500">{act.tanggalKegiatan}</p>{act.keterangan && <p className="text-xs text-gray-500 mt-1"><b>Keterangan BS:</b> {act.keterangan}</p>}</div></div><div><textarea placeholder="Tulis alasan penolakan di sini..." value={rejectionNotes[act.id] || ''} onChange={(e) => handleNoteChange(act.id, e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" rows="2"></textarea></div><div className="flex gap-2 pt-2 border-t"><button onClick={() => handleApproval(act.id, 'rejected')} className="flex-1 bg-red-100 text-red-700 font-semibold py-2 px-3 rounded-md text-sm hover:bg-red-200 flex items-center justify-center gap-1"><Icon name="x" className="w-4 h-4"/> Tolak</button><button onClick={() => handleApproval(act.id, 'approved')} className="flex-1 bg-green-100 text-green-700 font-semibold py-2 px-3 rounded-md text-sm hover:bg-green-200 flex items-center justify-center gap-1"><Icon name="check" className="w-4 h-4"/> Setujui</button></div></div>)) : <p className="text-center text-gray-500 mt-8">Tidak ada laporan kegiatan yang menunggu persetujuan.</p>}</div>);
}

function TargetRekap() {
    const [month, setMonth] = useState(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`);
    const [rekapData, setRekapData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const targetsQuery = query(collection(db, `artifacts/${appId}/public/data/targets`), where("month", "==", month));
                const targetsSnap = await getDocs(targetsQuery);
                const targets = targetsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                if (targets.length === 0) { setRekapData([]); setIsLoading(false); return; }
                const finalRekapPromises = targets.map(async (target) => {
                    const activitiesQuery = query(collection(db, `artifacts/${appId}/public/data/activities`), where("creatorId", "==", target.userId), where("status", "==", "approved"));
                    const activitiesSnap = await getDocs(activitiesQuery);
                    const year = month.split('-')[0];
                    const monthNum = month.split('-')[1];
                    const startDate = new Date(year, monthNum - 1, 1);
                    const endDate = new Date(year, monthNum, 0, 23, 59, 59);
                    const userActivities = activitiesSnap.docs.map(doc => doc.data()).filter(act => {
                        if (!act.createdAt?.toDate) return false;
                        const activityDate = act.createdAt.toDate();
                        return activityDate >= startDate && activityDate <= endDate;
                    }).map(act => act.kegiatan);
                    const achievements = { FM: userActivities.filter(a => a === 'FM').length, ODP: userActivities.filter(a => a === 'ODP').length, STUDY: userActivities.filter(a => a === 'STUDY BANDING').length, FFD: userActivities.filter(a => a === 'FFD').length, };
                    const totalAchievement = achievements.FM + achievements.ODP + achievements.STUDY + achievements.FFD;
                    const totalTarget = (target.fm || 0) + (target.odp || 0) + (target.study || 0) + (target.ffd || 0);
                    return { user: { id: target.userId, name: target.name || 'Nama Tidak Ditemukan' }, targets: { fm: target.fm, odp: target.odp, study: target.study, ffd: target.ffd }, achievements, percentage: calculatePercentage(totalAchievement, totalTarget) };
                });
                const finalRekap = await Promise.all(finalRekapPromises);
                finalRekap.sort((a,b) => (a.user.name || '').localeCompare(b.user.name || ''));
                setRekapData(finalRekap);
            } catch (error) { console.error("Error fetching rekap data:", error); } finally { setIsLoading(false); }
        };
        fetchData();
    }, [month]);
    return (<div className="bg-white p-6 rounded-lg shadow-md"><div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold text-gray-800">Rekap Pencapaian Target</h3><input type="month" value={month} onChange={e => setMonth(e.target.value)} className="px-3 py-1 border rounded-lg" /></div>{isLoading ? <LoadingSpinner /> : (<div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead className="text-xs text-gray-700 uppercase bg-gray-100"><tr><th scope="col" className="px-4 py-3">Nama BS</th><th scope="col" className="px-4 py-3 text-center">FM</th><th scope="col" className="px-4 py-3 text-center">ODP</th><th scope="col" className="px-4 py-3 text-center">STUDY</th><th scope="col" className="px-4 py-3 text-center">FFD</th><th scope="col" className="px-4 py-3 text-center">Pencapaian</th></tr></thead><tbody>{rekapData.length > 0 ? rekapData.map(item => (<tr key={item.user.id} className="border-b hover:bg-green-50"><th scope="row" className="px-4 py-4 font-medium text-gray-900 whitespace-nowrap">{item.user.name}</th><td className="px-4 py-4 text-center">{item.achievements.FM}/{item.targets.fm}</td><td className="px-4 py-4 text-center">{item.achievements.ODP}/{item.targets.odp}</td><td className="px-4 py-4 text-center">{item.achievements.STUDY}/{item.targets.study}</td><td className="px-4 py-4 text-center">{item.achievements.FFD}/{item.targets.ffd}</td><td className="px-4 py-4 text-center"><div className="w-full bg-gray-200 rounded-full h-4"><div className="bg-green-600 h-4 rounded-full" style={{ width: `${item.percentage}%` }}></div></div><span className="text-xs font-semibold">{item.percentage}%</span></td></tr>)) : (<tr><td colSpan="6" className="text-center py-4">Tidak ada data target untuk bulan ini.</td></tr>)}</tbody></table></div>)}</div>);
}

export default function App() {
    const [page, setPage] = useState('loading');
    const [userProfile, setUserProfile] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [appModalMessage, setAppModalMessage] = useState('');
    const [imageInModal, setImageInModal] = useState(null);
    useEffect(() => {
        if (!isFirebaseInitialized) return;
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const userDocRef = doc(db, `artifacts/${appId}/users/${user.uid}`);
                const docSnap = await getDoc(userDocRef);
                if (docSnap.exists()) { setUserProfile({ uid: user.uid, ...docSnap.data() }); setPage('dashboard'); } else { await signOut(auth); }
            } else { setUserProfile(null); setPage('login'); }
            setErrorMessage('');
        });
        return () => unsubscribe();
    }, []);
    const navigateTo = (targetPage) => { setErrorMessage(''); setPage(targetPage); };
    const handleLogout = () => signOut(auth);
    const handleRegister = async (email, password, name, workArea, role, profilePhoto) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password).catch(err => {
            if (err.code === 'auth/email-already-in-use') throw new Error('Email ini sudah terdaftar.');
            throw new Error('Gagal membuat akun.');
        });
        const user = userCredential.user;
        let photoURL = '';
        if (profilePhoto) { photoURL = await resizeImage(profilePhoto).catch(() => { throw new Error('Gagal memproses foto.') }); }
        const userDocData = { name, email, workArea, role, photoURL, createdAt: serverTimestamp() };
        await setDoc(doc(db, `artifacts/${appId}/users/${user.uid}`), userDocData).catch(() => {throw new Error('Gagal menyimpan profil.')});
        if (role === 'BS') { await setDoc(doc(db, `artifacts/${appId}/public/data/bs_users`, user.uid), { name: name, workArea: workArea, }).catch((error) => console.warn("Gagal menambahkan BS ke daftar publik:", error)); }
    };
    const renderPage = () => {
        if (!isFirebaseInitialized) return (<div className="min-h-screen flex items-center justify-center p-4"><div className="bg-red-100 p-4 rounded-lg"><p className="font-bold">Gagal terhubung ke server.</p></div></div>);
        if (page === 'loading') return <LoadingSpinner />;
        switch (page) {
            case 'login': return <LoginPage navigateTo={navigateTo} onLogin={(e, p) => signInWithEmailAndPassword(auth, e, p)} setErrorMessage={setErrorMessage} errorMessage={errorMessage} />;
            case 'register': return <RegisterPage navigateTo={navigateTo} onRegister={handleRegister} setErrorMessage={setErrorMessage} errorMessage={errorMessage} />;
            case 'edit-profile': return userProfile ? <EditProfilePage userProfile={userProfile} navigateTo={navigateTo} setAppModalMessage={setAppModalMessage} /> : <LoadingSpinner/>;
            case 'dashboard':
                if (userProfile?.role === 'BS') { return <DashboardBS userProfile={userProfile} onLogout={handleLogout} setAppModalMessage={setAppModalMessage} navigateTo={navigateTo} openImageModal={setImageInModal}/>; }
                if (userProfile?.role === 'Agronomis') { return <DashboardAgronomist userProfile={userProfile} onLogout={handleLogout} setAppModalMessage={setAppModalMessage} navigateTo={navigateTo} openImageModal={setImageInModal} />; }
                return <LoadingSpinner />;
            default: return <LoginPage navigateTo={navigateTo} onLogin={(e, p) => signInWithEmailAndPassword(auth, e, p)} setErrorMessage={setErrorMessage} errorMessage={errorMessage} />;
        }
    };
    return (<>{renderPage()}{appModalMessage && <Modal onClose={() => setAppModalMessage('')}><div className="bg-white p-8 rounded-lg text-center shadow-xl"><p>{appModalMessage}</p></div></Modal>}{imageInModal && <Modal onClose={() => setImageInModal(null)}><img src={imageInModal} alt="Tampilan diperbesar" className="max-w-full max-h-[80vh] rounded-lg"/></Modal>}</>);
}
