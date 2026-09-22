# Rencana Peningkatan Kualitas Kode iLmi

## Status Dokumen

Revisi audit: 2026-09-20. Plan ini menggantikan daftar sebelumnya yang mencampur bug, dugaan, keputusan produk, dan preferensi refactor. Rincian bukti dan koreksi klaim lama tersedia di [CODE_QUALITY_AUDIT.md](CODE_QUALITY_AUDIT.md).

Tujuannya adalah correctness, perlindungan data, aksesibilitas, dan maintainability tanpa rewrite atau perubahan visual yang tidak disengaja. Perbaikan kode selesai; verifikasi browser manual oleh pemilik (2026-09-21) menyatakan perilaku tetap OK.

## Baseline Terverifikasi

| Pemeriksaan ulang                                      | Hasil                                                                                                 |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| `pnpm exec tsc --noEmit --incremental false`           | Lolos                                                                                                 |
| `pnpm lint`                                            | Lolos; `next lint` deprecated                                                                         |
| `pnpm test`                                            | 12 tes lolos, satu file tes filesystem                                                                |
| `pnpm build`                                           | Lolos pada Next.js 15.5.6                                                                             |
| Probe audit utilitas                                   | 9 pemeriksaan perilaku aktual lolos di Node dengan storage mock; bukan tes bahwa aplikasi sudah benar |
| Browser, kamera nyata, accessibility tree, LCP/CLS/INP | Belum diuji atau diukur dalam audit ini                                                               |

Working tree mengandung perubahan pengguna yang belum di-commit. Tidak perlu commit/stash atau tree bersih untuk mulai memperbaiki; yang diperlukan adalah mencatat keadaan yang diuji, menghindari perubahan bersamaan pada file yang sama, dan mengulang pemeriksaan setelah perubahan. Jangan commit, stash, atau membatalkan perubahan orang lain tanpa izin.

## Klasifikasi dan Prioritas

- **Reproduksi utilitas:** perilaku dijalankan menggunakan kode asli dengan input/storage simulasi. Ini bukan reproduksi browser.
- **Bukti statis:** jalur sumber mendukung cacat; dampak UI tetap harus diuji dengan skenario yang disebutkan.
- **Hardening:** kontrak/type safety dapat diperbaiki, tetapi belum ada jalur pengguna normal yang terbukti gagal.
- **Keputusan produk:** fitur demo, kebijakan state, atau perilaku yang perlu disepakati sebelum diubah.
- **Refactor opsional:** kerjakan jika ada manfaat konkret dalam pengujian, perubahan, atau penggunaan ulang.
- **P1:** perbaikan terjadwal untuk integritas data dan alur utama yang rusak. **P2:** hardening, pemeliharaan, dan peningkatan berisiko lebih rendah. Tidak ada dasar dalam audit ini untuk memberi seluruh tahap label P0 darurat.

Tradeoff hanya disebut disengaja bila didukung komentar atau perilaku yang jelas. Implementasi sederhana, bug kecil, atau konteks portofolio tidak otomatis membuktikan bahwa cacat memang diinginkan.

## Prinsip Pelaksanaan

- Perbaiki perilaku yang salah dengan perubahan terkecil; tambahkan tes bersama perbaikan.
- Bedakan data belum ada, kosong yang valid, rusak, dan gagal dibaca/disimpan.
- Pertahankan format/data lama ketika mengubah persistence yang sudah digunakan.
- Jangan samakan implementasi yang berbeda hanya karena bentuk kodenya mirip.
- Jangan memindahkan semua logic ke hook, membatasi panjang file, atau menambah layer demi label clean code.
- Pertahankan aturan UI tiap aplikasi, termasuk warna, cadence pembaruan, dan state preview/draft.
- Periksa cleanup berdasarkan kepemilikan resource dan maksud operasi, bukan menghapus semua callback secara mekanis.

## Tahap 0: Catat dan Reproduksi

**Sifat:** verifikasi, bukan perbaikan bug. **Dependensi:** tidak ada.

- [ ] Catat HEAD, working diff, versi dependency terpasang, dan hasil pemeriksaan pada keadaan kode yang sama.
- [ ] Ulangi baseline setelah perubahan aktif selesai; jangan mengerjakan ulang masalah yang sudah diperbaiki.
- [ ] Jadikan temuan statis UI sebagai skenario reproduksi desktop/mobile sebelum mengklaim gejalanya terjadi di browser.
- [ ] Catat data lama yang harus dipertahankan serta batas fitur demo yang belum diputuskan untuk diperluas.

**Selesai bila:** kondisi awal dan batas bukti jelas, tanpa mengganggu pekerjaan lain.

## Tahap 1: Type Safety Terarah

**Prioritas:** P2, hardening. **Area:** `utils/appComponents.tsx`, `components/Desktop/Window/useWindowDragResize.ts`, `utils/fileSystem.ts`.

- [x] Ganti `null as unknown as HTMLDivElement` dengan ref nullable yang benar. Type-check sudah lolos, tetapi assertion masih ada; jangan menandainya sebagai type safety yang tuntas.
- [x] Gunakan pemeriksaan own-property pada registry. `in` menerima nama turunan prototype, tetapi caller saat ini memakai registry aplikasi tetap; ini bukan bukti prototype pollution atau exploit dari input pengguna.
- [x] Pertahankan union yang mengecualikan placeholder dari map; masalah literal metadata lama sudah tidak ada.
- [ ] Tes helper registry untuk komponen valid, placeholder, unknown, `toString`, dan `constructor` setelah transform TSX test siap. Masih terblokir: Vitest gagal parsing `appComponents.tsx` (Unexpected JSX expression); butuh plugin/transform TSX atau ekstraksi helper murni.
- [x] Tentukan fallback mobile untuk placeholder: container mobile kini menampilkan layar Under Development seperti desktop. Perlu verifikasi browser.
- [x] Perbaiki return type resolver folder agar mengakui not-found, atau hapus export yang tidak digunakan setelah pemeriksaan pemanggil. Dipilih: return type jujur `string | null | undefined`; export dipertahankan dan dilindungi tes.

**Selesai bila:** kontrak tipe jujur, fallback yang dipilih diuji, dan type-check tetap lolos tanpa cast penutup masalah. Tahap ini bukan blocker untuk memperbaiki persistence.

## Tahap 2: Integritas Data

**Prioritas:** P1. **Dependensi:** baseline. **Area:** Notes, filesystem bersama, storage adapter, Files, Mail, Photos/Camera beserta pemanggilnya.

- [x] Terima dan simpan Notes kosong. Perbaiki kedua sisi: fallback `validNotes.length` dan autosave `notes.length`. Pertahankan hydration guard yang sudah ada; tidak ada bukti perlu boolean loading tambahan untuk load sinkron sekarang.
- [x] Terima filesystem `items: []`; jangan membuat ulang default setelah pengguna menghapus seluruh item.
- [x] Tangani perubahan key Notes dari `notes` ke `ilmi:notes:v1`. Diff menunjukkan tidak ada pembacaan/migrasi key lama. Pertahankan data sumber, termasuk array kosong, dan jangan menimpa destination yang sudah valid.
- [x] Lindungi akses getter `window.localStorage` di dalam penanganan error. `utils/storage.ts` sekarang mengaksesnya sebelum `try`; adapter yang disarankan plan lama belum aman sebagai standar universal.
- [x] Validasi struktur data di boundary, bukan hanya generic TypeScript atau JSON syntax. Notes/Mail perlu validasi koleksi dan field yang digunakan; filesystem perlu validasi item; Files perlu perlindungan read/parse dan shape; Photos sudah memeriksa array tetapi belum item URL; Camera perlu membedakan iterable dari array record valid.
- [x] Bedakan absent, invalid, dan unavailable; fallback tidak boleh otomatis menimpa satu-satunya salinan data invalid. Normalisasi tanggal Notes dengan pemeriksaan hasil konversi.
- [x] Kembalikan hasil save yang dapat diamati dan tampilkan status unsaved/gagal yang berguna. Perbaiki caller Finder, Terminal, Notes, dan Mail, termasuk `ComposeModal` yang menutup dirinya setelah `onSend`. Catatan: autosave Notes yang gagal hanya tercatat di console (belum ada indikator unsaved di UI Notes); banner/banner error sudah ada di Files, Mail, dan dialog Finder.
- [x] Tangani Files yang melempar error storage, bukan melabelinya silent-save. Camera sudah menampilkan error, tetapi semua error diberi pesan Storage full; bedakan parse/access/quota dan jangan menganggap thumbnail sebagai bukti sukses simpan.
- [x] Bila kuota foto perlu dibatasi, pilih kebijakan produk: tolak simpan dengan pemulihan yang jelas atau beri kontrol penghapusan. Dipilih: tolak dengan pesan spesifik per jenis error; tanpa eviction otomatis.

**Batas refactor:** Tidak wajib memigrasikan semua aplikasi ke `appStorage`. Zustand `persist` sudah memiliki default version 0. Adapter saat ini hanya menolak versi berbeda, bukan melakukan migrasi. Bump versi saja bukan solusi. Koordinasikan Camera/Photos jika format bersama berubah.

**Tes penerimaan:**

- [x] Hapus semua Notes/filesystem, buka ulang/reload, dan pastikan tetap kosong. Dilindungi unit test (`decodeNotes([])`, filesystem empty round-trip); reload browser manual belum dilakukan.
- [x] Uji data Notes lama, destination valid, destination invalid, dan write migrasi yang gagal; sumber tidak boleh hilang. Logika decode/migrasi diuji; alur hook penuh belum diuji karena butuh render React.
- [x] Uji getter/getItem/setItem yang melempar, quota penuh, malformed JSON, wrong shape, tanggal invalid, dan storage belum ada.
- [x] Pastikan UI/Terminal tidak melaporkan sukses durable ketika write gagal; draft tetap dapat dipulihkan. Finder menahan dialog + pesan error; Terminal mencetak error; Compose menahan draft + pesan error; Files/Mail menampilkan banner.

**Selesai bila:** kasus integritas data diperbaiki dan dilindungi tes. Penyatuan semua storage atau ID bukan syarat selesai.

## Tahap 3: Filesystem dan Fitur Demo

**Sifat:** keputusan produk, kemudian implementasi terpisah. **Dependensi:** Tahap 2 jika format persistence diubah.

Files secara eksplisit memakai mock: subfolder kosong dan count acak. Finder/Terminal memakai model lain. Ini bukan bukti bahwa semua aplikasi wajib berbagi filesystem atau bahwa mock adalah regresi.

- [x] Putuskan apakah Files tetap mock visual atau ditingkatkan menjadi browser hierarki. Diputuskan: jadikan browser hierarki beneran memakai model shared (pengguna menyetujui "mau ini works").
- [x] Jika hierarki disetujui, gunakan parent ID, operasi folder, dan count yang benar. Files kini memakai `createFolder/deleteItem/renameItem/getItemsInFolder/getItemCount` dari `utils/fileSystem.ts` dengan parent folder yang benar dan count nyata.
- [x] Inventarisasi `fileSystem` dan `ilmi_file_system`. Format size display string dipetakan best-effort ke bytes; timestamp dipakai ulang; parent selalu root karena data lama tidak menyimpan parent.
- [x] Pertahankan sumber sampai destination berhasil disimpan. Legacy key `fileSystem` hanya dihapus setelah merge tersimpan; payload korup di kedua sisi dibiarkan utuh.
- [ ] Untuk data yang memang sudah dibagi Finder/Terminal, uji refresh antar-view yang sedang terbuka. Native `storage` event tidak memberi notifikasi pada dokumen penulis; tambahkan notifikasi lokal minimal jika sinkronisasi live diharapkan.
- [x] Hapus helper lama hanya setelah caller dan kebutuhan migrasi ditangani. `Files/utils.ts` kini hanya berisi migrasi + `parseDisplaySize`; duplikat load/save/list/count dihapus.

**Tes bila fitur disetujui:** nested creation, parent/child navigation, count, rename/delete, reload, migrasi, dan sinkronisasi dua view. Migrasi teruji (7 tes); navigasi bersarang dan sinkronisasi live antar-view belum diuji.

## Tahap 4: Interaksi dan Lifecycle

**Prioritas:** P1 untuk alur rusak; P2 untuk akurasi waktu dan cleanup berisiko rendah. **Status:** bukti statis, bukan reproduksi browser.

- [x] Tambahkan cancel/unmount cleanup drag untuk `activeId` dan nilai overflow sebelumnya. `onDragCancel` + guard unmount ditambahkan; nilai overflow sebelumnya dipulihkan; layout sementara disinkronkan ulang dari store. Perlu verifikasi browser (Escape + touch cancel).
- [x] Pisahkan aktivasi window dari drag. Aktivasi via `onMouseDownCapture` independen; drag tetap header-only. Perlu verifikasi browser (klik body/header/maximized + fokus keyboard).
- [x] Batasi maximize double-click ke area header non-interaktif; tombol kontrol menghentikan mousedown/double-click. Perlu verifikasi browser (double-click konten Finder vs header vs tombol).
- [x] Reproduksi minimize lalu restore lewat Show All. `isMinimizing` + `minimizeTarget` kini direset saat restore terdeteksi. Perlu verifikasi browser.
- [x] Lepas listener battery/network MenuBar dan cegah pemasangan sesudah unmount. Guard disposal di MenuBar dan StatusBar. Perlu verifikasi mount/unmount berulang.
- [x] Rapikan cancel/unmount pada opening timeout HomeScreen, focus timeout Spotlight, long-press Files/Clock, dan gesture animation yang masih tertinggal. Timeout close/minimize window sengaja dibiarkan selesai karena itu perintah pengguna pada store (keputusan tercatat, bukan kelalaian).
- [x] Reproduksi swipe Notification Center yang ditolak/dibatalkan. Snapback kini mempertahankan nilai inline final + `touchcancel` ditangani. Perlu verifikasi browser.
- [x] Batasi Camera ke satu countdown aktif (shutter berulang diabaikan selama countdown) dan bersihkan saat mode berubah/unmount.
- [x] Selaraskan UI/ref recorder pada `onstop`/error, termasuk stop otomatis setelah track berakhir. Final data tetap diekspor; butuh browser berkamera untuk verifikasi perilaku.
- [x] Tangani kegagalan constructor/start recorder dan stream yang sedang diganti (cek `MediaRecorder` + `isTypeSupported` + try/catch). Klaim `InvalidStateError` dihapus sesuai spesifikasi (no-op).
- [x] Gunakan elapsed timestamp untuk stopwatch dan deadline untuk countdown, dengan pause/resume terjaga. Perlu verifikasi background-throttling di browser.
- [ ] Putuskan state mana yang harus bertahan ketika lebar tablet melewati 1024 dan shell berganti. Keputusan produk, belum dikerjakan.

**Verifikasi:** drag end/cancel, restore window, Finder double-click dan kontrol window, rejected/cancelled swipe, async subscription selesai setelah unmount, repeated shutter, pergantian stream, background/pause/resume Clock, dan resize melintasi breakpoint.

**Hasil browser 2026-09-21 (Playwright + Edge 153 headless, 8 tes di `browser-tests/`):** boot desktop/mobile tanpa console error; klik body window tidak aktif memfokuskannya; double-click konten tidak maximize; minimize lalu Show All me-restore window yang terlihat; drag-cancel via Escape melepas scroll-lock dan launch kembali normal; Notification Center tertutup tidak menerima fokus keyboard; Finder membuat folder root. Belum terverifikasi: kamera/mic nyata, touch-fisik/swipe penolakan, background-throttling Clock, rotasi tablet, screen reader, dan penilaian visual manusia.

**Selesai bila:** skenario yang dikerjakan terbukti sebelum/sesudah di browser atau tes yang tepat; tidak ada klaim generik semua resource sudah aman.

## Tahap 5: Accessibility Terarah

**Prioritas:** P1 untuk alur utama; P2 untuk polish loading/reduced-motion.

- [x] Nonaktifkan fokus/aksesibilitas Notification Center ketika tertutup via visibility tertunda (animasi dipertahankan). Perlu verifikasi tab-order di browser.
- [x] Reproduksi Desktop Control Center closed state. Panel kini memakai visibility/opacity/pointer-events + `aria-hidden` saat tertutup (custom class lama dibiarkan tak berfungsi). Perlu verifikasi visual.
- [x] Perbaiki brightness/volume slider dengan semantik/value/keyboard/fokus lengkap lokal per slider (tanpa shared component wajib). Orientasi vertikal dinyatakan. Perlu verifikasi keyboard + screen reader.
- [x] Gunakan tombol nyata untuk trigger StatusBar (native button + focus style + `aria-haspopup`).
- [x] Sediakan akses keyboard untuk desktop icon (role button + Enter/Space), resize window (tombol terlihat saat fokus + alternatif keyboard), home indicator (role button + Enter/Space menutup app), dan kartu notifikasi (role button + Enter/Space membuka app). Keyboard sensor drag dipertahankan.
- [x] Perbaiki label yang memang hilang dan fokus yang disembunyikan: traffic buttons, resize, Apple menu (`aria-label` + `aria-expanded`/`haspopup`), dan tombol tambah penerima compose (`aria-label`, ikon `aria-hidden`).
- [ ] Kelola initial focus, Escape, dan focus-return per workflow; belum dikerjakan (yang sudah ada dipertahankan: Spotlight/PhotoViewer Escape, dnd-kit sensor).
- [ ] Pilih semantik sesuai interaksi (menu/listbox/dialog semantik spesifik belum diubah; hanya yang rusak diperbaiki).
- [x] Tambahkan status bermakna pada BootScreen (`role=status`, SVG `aria-hidden`, `motion-safe` pulse, teks sr-only).

**Selesai bila:** alur yang dipilih dapat digunakan lewat keyboard dan tidak menjangkau kontrol tertutup; modalitas, fokus, dan transisi sesuai perilaku sebenarnya.

## Tahap 6: Quality Gates dan Styling

**Prioritas:** P1 untuk tes risiko dan style yang tidak bekerja; P2 untuk pengetatan tooling opsional.

- [x] Tambahkan script `typecheck` dan CI yang menjalankan type-check, lint, tes, build pada toolchain konsisten. Script `typecheck` dan `.github/workflows/ci.yml` (Node 22 + pnpm 9) sudah ditambahkan.
- [x] Migrasikan `next lint` ke ESLint CLI. Selesai via codemod + perbaikan manual: `eslint.config.mjs` (FlatCompat, parity aturan), ESLint 8→9, `.eslintrc.json` dihapus. Dua koreksi manual: impor subpath butuh ekstensi `.js` lalu diganti FlatCompat karena file bawaan Next masih format legacy; direktori `.next/` di-ignore agar CLI tidak melint hasil build. Hasil: `pnpm lint` nol warning.
- [ ] Tambahkan regression test pada risiko data dan interaksi. Pertahankan environment Node untuk utilitas/store; gunakan DOM environment per-file/project jika dibutuhkan, bukan migrasi global wajib.
- [ ] Siapkan transform TSX yang sesuai sebelum tes komponen/registry. Probe yang mengimpor `appComponents.tsx` gagal parsing JSX pada konfigurasi Vitest sekarang; sembilan probe non-TSX kemudian berhasil.
- [ ] Coverage reporting boleh dipakai untuk mencari bagian belum diuji. Jangan memasang persentase gate global tanpa alasan risiko yang jelas; assertion perilaku lebih penting daripada sekadar mengeksekusi baris.
- [x] Perbaiki integrasi Tailwind v4: token dipindah ke `@theme` CSS-first di `globals.css` (warna ios/macos, `font-sans` SF, skala `text-ios-*` HIG, radius) + `@custom-variant dark` untuk toggle `.dark`. Verifikasi: `.text-ios-blue` dan `--font-sans: SF Pro Display` ada di CSS build; screenshot Files biru dan count nyata. `tailwind.config.js` lama dibiarkan sebagai dokumentasi (tidak dibaca v4). Terverifikasi browser 2026-09-22: body `SF Pro Display` 17px, toggle `.dark` membalik varian `dark:` (sebelumnya mengikuti OS).
- [ ] Uji light/dark aplikasi terhadap preference OS yang berlawanan, Files/Clock custom colors, font-mono Terminal, dan safe-area pada tab bar.
- [ ] Konsolidasi tiga entry Tailwind hanya jika memberi manfaat jelas; jaga urutan/layer cascade. Tiga import di source bukan bukti tiga payload penuh terkirim.
- [x] Evaluasi universal font rule yang memutus inheritance Terminal. Aturan `* {font-family}` dihapus; `html,body` + `font-size: 17px` (body iOS) cukup via inheritance sehingga `font-mono` kembali bekerja. Universal cursor dan safe-area dibiarkan (specificity/semantik berbeda).
- [ ] Pertimbangkan `noUncheckedIndexedAccess` serta unused checks secara bertahap. `strict` sudah aktif. Nama opsi casing yang valid adalah `forceConsistentCasingInFileNames`; bukan `forceConsistentCasingInFile` dan default compiler terpasang sudah true.
- [ ] Pertahankan warning/error diagnostik produksi. Logger baru hanya diperlukan untuk kebijakan redaksi/pelaporan nyata; tidak wajib `removeConsole` yang menghapus bukti kegagalan.
- [ ] Pisahkan formatting dari perbaikan behavior. Perubahan `NodeJS.Timeout` ke tipe berbasis API adalah konsistensi type-only, bukan perbaikan runtime atau bukti dependency Node masuk bundle.

**Selesai bila:** perubahan memiliki tes/gate relevan, style yang diperbaiki diverifikasi visual, dan tidak menambah aturan/config hanya untuk tampak ketat.

## Tahap 7: Clean Code Selektif

**Prioritas:** P2, opsional. **Dependensi:** behavior terkait stabil dan dilindungi tes.

- [x] Evaluasi seam yang konkret: `parseTerminalInput` dan selector Mail (`getMailboxCounts`/`filterDisplayEmails`) diekstrak sebagai fungsi murni + 5 tes. Ekstraksi ini sekaligus memperbaiki bug mutasi `sort()` in-place pada state emails. Tidak ada batas 200 baris atau hook wajib.
- [ ] Satukan semantic theme token yang benar-benar sama. Dilewati dengan sadar: perbedaan palette antar aplikasi dapat disengaja dan `useTheme()` bukan pengganti netral.
- [x] Bagikan aturan layout yang memang harus konsisten: `IOS_LAYOUT` (page 24/28, dock 100) dipakai HomeScreen, drag handlers, dan apps store.
- [ ] Helper subscription battery/network bersama. Dilewati: cadence tiap consumer terbukti berbeda; cleanup sudah diperbaiki per call-site.
- [x] Tes store melalui `getState`/`setState` tanpa mount (4 tes apps/windows/control-center).
- [x] Hapus action tidak terpakai `updateWindowPosition`/`updateWindowSize` (tidak ada caller; `updateWindow` sudah dipakai drag hook).
- [x] Ganti `navigator as any` dengan tipe API yang tersedia; snapshot BatteryInfo/NetworkInfo dipertahankan sebagai kontrak terpisah.
- [x] Reuse `generateId` pada output Terminal; ID persisted tidak ditulis ulang.
- [ ] Pindahkan fixture/mock besar. Dilewati: tidak ada manfaat pengujian/reuse yang konkret.
- [x] Perbarui komentar/dokumentasi yang overclaim (header adapter storage, komentar layout, komentar countdown).

**Selesai per refactor bila:** ada alasan perubahan yang dapat dijelaskan, behavior/visual tetap, tes lolos, dan tidak sekadar memindahkan kompleksitas ke file lain.

## Tahap 8: Investigasi Aset

**Prioritas:** P2, ukur dahulu. Tidak wajib mengganti font/image loader.

- [x] Ukur request/transfer aktual pada production (`next start`, Lighthouse 13 + Edge 153 headless, throttling simulasi, 2026-09-21). Sebelum optimasi — Desktop: skor 0.63–0.66, LCP 6.5–19s (fluktuatif), CLS ~0.0003, transfer ~3.8MB. Mobile: skor 0.93, LCP ~3.1s, CLS ~0.0003, transfer ~3.6MB. Top transfer saat itu: wallpaper JPG 787KB + belasan SVG 100–278KB + FA 155KB. Satu run sempat mengukur server dev yang nyangkut (TBT 1400ms, `main-app.js?v=` 1.7MB) — dibuang; script kini punya preflight yang menolak non-production build.
- [x] Sesudah optimasi (ikon raster→WebP 192px, wallpaper→WebP 1920w, maps bg→WebP; total −75%): Desktop transfer 966KB, skor 0.67, LCP ~6.6s, TBT ~32ms, CLS ~0.0003. Mobile transfer 763KB, skor 0.93, LCP ~3.0s, TBT ~55ms, CLS ~0.0003. Top transfer kini: FA solid+brands 271KB, 5 font SF ~365KB, wallpaper 25KB. Visual desktop/mobile dicek via screenshot: identik, tanpa regresi. Lighthouse + skrip ukur tersedia (`lighthouse` devDependency; skrip `lh-run` di luar repo). Belum dilakukan (butuh browser) — satu-satunya investigasi yang tersisa.
- [x] Inventarisasi statis selesai: hanya weight 300–700 yang dipakai (light 2, normal 5, medium 12, semibold 18, bold 11 hits; thin/extralight/extrabold/black nol + tanpa `fontWeight` inline). Blok `@font-face` 100/200/800/900 dan 4 file font (~534 KB) dihapus; tidak ada referensi tersisa. Ini dead code yang terbukti statis, bukan optimasi berbasis pengukuran.
- [x] Evaluasi lanjutan berbasis angka: PerformanceObserver pada Edge nyata (tanpa throttling lab) menunjukkan LCP = ikon desktop Calculator (IMG 0.9KB) pada ~420ms, didahului teks jam ~240ms; 7 font selesai dalam 40–112ms. Angka lab desktop ~6.6s adalah artefak throttling simulasi + varians, bukan bottleneck byte (transfer sudah 966KB). Tidak ada optimasi LCP lanjutan yang dibenarkan; CLS ~0 tetap bukan masalah.
- [x] Raster dalam SVG dicatat: `Gallery.svg`/`Maps.svg` membungkus PNG base64 256×256 — bypass optimizer tetap benar, ekstraksi/re-encode opsional dan belum dikerjakan.

**Selesai bila investigasi dipilih:** ada baseline dan hasil perbandingan yang reproducible; perubahan hanya diterima bila manfaatnya terbukti tanpa regresi visual/deploy.

## Urutan dan Definition of Done

1. Catat baseline dan lindungi data pengguna pada Tahap 2; hardening kecil Tahap 1 dapat dikerjakan independen.
2. Reproduksi/perbaiki alur utama Tahap 4-5 dan integrasi style Tahap 6.
3. Tambahkan regression test bersama tiap perbaikan, lalu CI/smoke test yang relevan.
4. Putuskan perluasan Files sebelum Tahap 3; jalankan refactor/aset hanya jika manfaatnya jelas.

- [ ] Type-check, lint, tes, dan production build lolos pada kondisi kode yang dicatat.
- [ ] Bug yang dipilih memiliki bukti sebelum/sesudah dan acceptance test yang relevan.
- [ ] Data lama/kosong tetap terjaga dan save gagal tidak dilaporkan sukses.
- [ ] Klaim perbaikan UI didukung pemeriksaan browser, termasuk keyboard bila relevan.
- [ ] Tidak ada perubahan desain, format data, atau scope produk yang tidak disengaja.
- [ ] Risiko belum teruji, fitur demo yang dipertahankan, serta pekerjaan opsional yang ditunda dicatat.

Tidak perlu menuntaskan seluruh refactor, fitur demo, atau optimasi aset untuk menutup bug yang sudah diperbaiki.

## Di Luar Cakupan

- Rewrite framework atau ganti Zustand tanpa kebutuhan konkret. Ukuran tim atau jumlah baris bukan aturan migrasi; tidak ada ambang universal 30 engineer.
- Memaksakan SOLID penuh/class hierarchy. SOLID tidak identik dengan class maupun fungsi murni; ambil prinsip yang relevan dengan coupling dan kontrak yang nyata.
- Backend/auth/cloud sync tanpa kebutuhan produk baru. Jika kelak diperlukan, pilih pendekatan data fetching sesuai kebutuhan; query library bukan otomatis wajib.
- Optimasi spekulatif, termasuk memakai ukuran file di disk sebagai pengecualian terhadap kebutuhan mengukur browser.
- Coverage KPI, logger wrapper, shared slider/theme/store, batas panjang file, atau schema migration massal hanya demi keseragaman.

Sumber resmi dan koreksi rinci: [CODE_QUALITY_AUDIT.md](CODE_QUALITY_AUDIT.md).
