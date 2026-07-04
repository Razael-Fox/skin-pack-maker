# Rencana Perubahan: Hapus Header, Skema Warna Baru, 3D Skin Preview & Perbaikan UI

## 1. Deskripsi Perubahan

- **Hapus Header**: Menghapus bagian header/banner atas di halaman utama (`src/app/page.tsx`) untuk memberikan tampilan workspace yang lebih bersih, minimalis, dan memaksimalkan ruang kerja vertikal.
- **Tema Ungu, Smoke White & Dark Gray**: Merombak skema warna website untuk menggunakan warna ungu sebagai aksen utama, disandingkan dengan _smoke white_ dan _dark gray_ berpenampilan kontras tinggi yang mendukung tema terang (light mode) dan gelap (dark mode).
- **Proyeksi Skin 3D Dinamis**: Mengganti preview proyeksi 2D Canvas saat ini menjadi model **3D Minecraft Skin** interaktif menggunakan Canvas (atau Three.js/CSS 3D jika dibutuhkan) yang secara dinamis menyesuaikan tipe geometri (Steve / model normal dengan lengan 4px vs Alex / model slim dengan lengan 3px).
- **Perbaikan Tombol di Card Skins**: Memperbaiki kontras dan visibilitas tombol aksi di dalam list skin (seperti tombol hapus `Trash2` yang menggunakan opacity rendah atau tersembunyi, serta tombol tambah skin) agar selalu terlihat jelas dan mudah diakses oleh pengguna tanpa harus menebak letaknya.
- **Sederhanakan Alur Tambah Skin**: Mengubah alur penambahan skin agar konsisten hanya melalui pengunggahan file PNG. Menghapus konsep "slot kosong" (empty slot). Setiap kali user mengunggah file PNG, otomatis menambah 1 data skin baru (+1) dengan metadata (nama, tipe geometri, tier) yang bisa diedit setelahnya.
- **Minimalisasi UI & Konten**: Menyederhanakan elemen antarmuka dengan membuang kartu panduan teknis yang tidak esensial (seperti bagian "Bedrock Skinpack Packaging Schema" di bagian bawah) atau menyembunyikannya agar pengguna tidak bingung (_cognitive overload_) dan bisa langsung fokus pada pembuatan skin pack.

## 2. Rencana Implementasi Warna (CSS Variables di globals.css)

- **Aksen Ungu**: Menggunakan variasi warna ungu modern (misalnya, `oklch` atau `hex` ungu macOS yang premium).
- **Smoke White**: Sebagai latar belakang terang / warna teks gelap.
- **Dark Gray**: Sebagai latar belakang gelap / warna teks terang.
- **Tema Terang & Gelap**: Menyesuaikan class Tailwind dan CSS Variables di `src/app/globals.css` agar mendukung transisi tema terang/gelap dengan halus.

## 3. Rencana Implementasi 3D Preview

- **3D Render Logic**: Membuat komponen rendering model 3D Minecraft Skin menggunakan WebGL/Three.js (atau canvas 2D dengan transformasi 3D/CSS) untuk memproyeksikan kubus kepala, tubuh, tangan, dan kaki.
- **Dynamic Geometry**: Memisahkan rendering model default lengan 4px (Steve) dan 3px (Alex) berdasarkan properti `geometry` skin yang dipilih.
- **Interaktivitas**: Mendukung fitur rotasi otomatis atau drag mouse untuk memutar model 3D agar seluruh bagian skin terlihat.

## 4. Langkah Eksekusi

1. **Hapus Header**:
   - Edit file `src/app/page.tsx` untuk menghapus blok JSX Banner Title.
2. **Skema Warna**:
   - Update `src/app/globals.css` dan integrasikan warna ungu, smoke white, dan dark gray.
3. **3D Skin Preview**:
   - Pasang library pembantu di `src/components/SkinPreviewCanvas.tsx` dan ubah renderer canvas menjadi proyeksi 3D dinamis (normal/slim).
4. **Perbaikan Tombol Card Skins**:
   - Edit `src/components/SkinList.tsx`.
   - Ubah kelas tombol `Trash2` dari `opacity-0 group-hover/skin:opacity-100` menjadi tombol dengan visibilitas konstan (misal: semi-transparan yang menjadi lebih terang saat di-hover) untuk aksesibilitas yang lebih baik.
5. **Alur Tambah Skin Konsisten**:
   - Edit `src/components/SkinList.tsx`: Hapus tombol "+" (tambah slot kosong). Sisakan tombol utama "ADD PNG" (untuk unggah file).
   - Edit `src/hooks/useSkinPack.ts`: Sesuaikan logika `addNewSkin(file)` agar mewajibkan parameter file PNG dan hilangkan opsi penambahan slot kosong. Inisialisasi awal list skin bisa disesuaikan agar tidak menyertakan _placeholder_ kosong jika tidak diperlukan (atau sesuaikan sesuai alur baru).
6. **Minimalisasi UI**:
   - Hapus komponen atau blok informasi "Bedrock Skinpack Packaging Schema" dari `src/app/page.tsx` agar tampilan menjadi super bersih dan intuitif.
