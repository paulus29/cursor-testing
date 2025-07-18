# Risk Awareness Program 2025

Risk Awareness Program 2025 adalah permainan mencari pasangan angka pada grid (default **10x10**, bisa diubah ke ukuran lain) yang dimainkan oleh 2 pemain secara real-time melalui web. Game ini juga mendukung spectator (penonton) yang dapat menyaksikan jalannya pertandingan.

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

## Package yang Diperlukan
- [express](https://www.npmjs.com/package/express)
- [socket.io](https://www.npmjs.com/package/socket.io)

## Struktur Folder Baru

```
/workspace
│
├── public/
│   ├── index.html
│   ├── styles.css
│   └── script.js
│
├── src/
│   ├── controllers/
│   │   ├── gameController.js
│   │   └── timerController.js
│   ├── routes/
│   │   └── gameRoutes.js
│   ├── models/
│   └── utils/
│
├── server.js
├── package.json (jika ada)
└── README.md
```

## Cara Menjalankan

1. Install dependencies (jika belum):
   ```bash
   npm install express socket.io
   ```
2. Jalankan server:
   ```bash
   node server.js
   ```
3. Buka browser ke `http://localhost:3000`

---

Selamat bermain!