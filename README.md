# Number Matching Game Multiplayer

Game Number Matching Multiplayer adalah permainan mencari pasangan angka pada grid (default **10x10**, bisa diubah ke ukuran lain) yang dimainkan oleh 2 pemain secara real-time melalui web. Game ini juga mendukung spectator (penonton) yang dapat menyaksikan jalannya pertandingan.

## Fitur
- Grid angka acak (default 10x10, bisa diubah di kode)
- 2 pemain bermain secara bergantian
- Setiap giliran, pemain memilih 2 kotak untuk mencari pasangan angka
- Jika cocok, pasangan tetap terbuka dan pemain dapat giliran lagi
- Jika tidak cocok, giliran berpindah ke pemain berikutnya
- Timer 10 detik per giliran (otomatis lempar jika waktu habis)
- Nama pemain dan skor tampil besar
- Highlight kotak terpilih berbeda untuk masing-masing pemain
- Modal input nama saat join dan modal pengumuman pemenang
- Spectator dapat menonton jalannya game secara real-time

## Cara Menjalankan

### 1. Install Node.js
Pastikan Node.js sudah terinstall di komputer Anda.

### 2. Install Dependency
Buka terminal di folder project, jalankan:
```bash
npm install
```

### 3. Jalankan Server
```bash
node server.js
```
Server akan berjalan di `http://localhost:3000`

### 4. Mainkan Game
- Buka browser dan akses `http://localhost:3000`
- Masukkan nama Anda pada modal yang muncul
- Masukkan kode room (bebas, misal: `room1`) untuk membuat/join room
- Jika sudah ada 2 pemain, user berikutnya otomatis menjadi spectator
- Kedua pemain harus klik tombol **Start** untuk memulai game
- Mainkan secara bergantian, spectator dapat menonton secara real-time

### 5. Ubah Ukuran Grid
- Untuk mengubah ukuran grid, edit variabel `boardSize` di file `server.js` dan grid CSS di `styles.css`

## Catatan
- Untuk main di dua komputer berbeda, pastikan berada di jaringan yang sama dan akses dengan alamat IP server (misal: `http://192.168.1.10:3000`)
- Jika ingin mengubah ukuran grid, ubah `boardSize` di backend dan grid CSS sesuai keinginan.

---

Selamat bermain!