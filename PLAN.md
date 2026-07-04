# UI Overhaul Plan: Skin Pack Maker (Modern Glassmorphism & macOS Style)

## 1. Modularisasi Komponen

Pisahkan `src/app/page.tsx` yang saat ini monolotik (hampir 1000 baris) menjadi komponen yang lebih kecil dan terkelola:

- `components/PackSettings.tsx` - Form untuk nama dan versi pack.
- `components/SkinList.tsx` - Sidebar daftar skin.
- `components/SkinEditor.tsx` - Area utama untuk mengedit metadata skin yang dipilih.
- `components/SkinPreviewCanvas.tsx` - Komponen khusus untuk proyeksi 2D (dipisah ke filenya sendiri).
- `components/TextureUploadBox.tsx` - Area drag & drop file PNG.

## 2. Peningkatan Estetika (Modern macOS & Glassmorphism)

Menggantikan pedoman desain OreUI sebelumnya dengan gaya modern premium:

- **Solid Background & Glassmorphism**: Gunakan 1 warna solid murni untuk latar belakang (sementara), dengan komponen (kartu) semi-transparan (efek kaca/blur latar belakang).
- **Smooth Shadows**: Implementasikan bayangan lembut dan berlapis (soft drop shadows) untuk memberikan kedalaman layout.
- **Efek Tombol macOS**: Interaksi tombol bergaya macOS (animasi tekan halus, kontras yang pas, efek fokus inner shadow/ring).
- **Border Radius Presisi**: Gunakan kelengkungan sudut yang seimbang (sekitar `8px` - `12px` / `rounded-lg` atau `rounded-xl`), tidak terlalu tajam kotak, namun tidak sepenuhnya bulat.
- **Tipografi Premium**: Gunakan font modern (Inter/SF Pro) yang bersih dengan pembobotan font yang tepat untuk hierarki.

## 3. Peningkatan Interaksi & UX

- **Micro-animations**: Tambahkan transisi halus (`duration-200` atau `duration-300`) pada setiap tombol, input, dan item list saat di-hover.
- **State Feedback**: Berikan indikator visual yang jelas saat skin sedang dirender atau pack sedang diekspor (loading spinners modern atau skeleton loaders).
- **Drag & Drop yang Lebih Baik**: Perjelas state visual area upload saat file di-drag (border dashed berubah solid dan glow).

## 4. Manajemen State

- Pisahkan logika pack (nama, versi) dan logika koleksi skin menggunakan custom hooks (misalnya `useSkinPack`) agar UI hanya berfokus pada rendering.
- Pastikan pengelolaan `URL.createObjectURL` dan `revokeObjectURL` berada dalam lifecycle hook yang aman untuk mencegah memory leak.

## Langkah Eksekusi Berikutnya

1. Buat folder `src/components/`.
2. Pindahkan `SkinPreviewCanvas` dan `TextureUploadBox` ke komponen terpisah.
3. Buat custom hook `useSkinPack` untuk memindahkan logika state dari `page.tsx`.
4. Rombak ulang struktur grid dan flexbox di `page.tsx` menggunakan komponen-komponen baru dengan desain yang telah disempurnakan.
