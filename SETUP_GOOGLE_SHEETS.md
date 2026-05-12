# Panduan Setup Google Sheets untuk QRIS Payment

Agar sistem dapat menyimpan data tanpa server (serverless), Anda perlu membuat Google Apps Script sebagai jembatan.

### 1. Persiapan Google Sheet
1. Buka [Google Sheets](https://sheets.new).
2. Beri nama file (misal: `Data QRIS Payment`).
3. Buat header di baris pertama (Kolom A - E):
   - `Timestamp`
   - `Latitude`
   - `Longitude`
   - `IP Address`
   - `User Agent`

### 2. Membuat Google Apps Script
1. Di Google Sheets, klik menu **Extensions** > **Apps Script**.
2. Hapus semua kode yang ada di editor, lalu masukkan kode berikut:

```javascript
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    
    sheet.appendRow([
      data.timestamp || new Date().toISOString(),
      data.lat,
      data.lng,
      data.ip,
      data.userAgent
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({ "result": "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ "result": "error", "error": err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

3. Klik ikon simpan (disk) dan beri nama proyek (misal: `QRIS Backend`).

### 3. Deploy sebagai Web App
1. Klik tombol **Deploy** > **New deployment**.
2. Pilih type: **Web app**.
3. Isi deskripsi (bebas).
4. **Execute as**: Me (`your-email@gmail.com`).
5. **Who has access**: **Anyone** (Ini penting agar frontend bisa mengirim data tanpa login).
6. Klik **Deploy**.
7. Salin **Web App URL** yang muncul (berakhir dengan `/exec`).

### 4. Update Frontend
1. Buka file `src/App.tsx`.
2. Cari variabel `GOOGLE_SCRIPT_URL`.
3. Tempel URL yang Anda salin tadi di sana.

### 5. Bersihkan VPS
Karena sekarang sudah full frontend (Vite), Anda tidak perlu menjalankan `node server.js` lagi. Cukup build dan deploy folder `dist` ke hosting statis atau gunakan server statis pilihan Anda.
Jangan lupa hapus file `server.js` dan `locations.db` secara manual untuk keamanan.
