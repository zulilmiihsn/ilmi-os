# San Francisco Font Files

Untuk menggunakan font San Francisco di Windows dan Android, Anda perlu mengekstrak font dari file .dmg dan mengonversinya ke format web.

## Cara Mengekstrak Font dari .dmg

### Di macOS:

1. Double-click file `.dmg` untuk mount disk image
2. Buka disk image yang ter-mount
3. Cari folder yang berisi font files (biasanya `.ttf` atau `.otf`)
4. Copy font files ke folder `public/fonts/` di project ini

### Di Windows (dengan software):

1. Install software seperti **7-Zip** atau **HFSExplorer**
2. Right-click file `.dmg` → Extract dengan 7-Zip
3. Atau gunakan **HFSExplorer** untuk membuka file .dmg
4. Cari folder yang berisi font files (`.ttf` atau `.otf`)
5. Copy font files ke folder `public/fonts/` di project ini

## Format File yang Diperlukan

Setelah mendapatkan font files (`.ttf` atau `.otf`), convert ke format web:

### Cara Convert ke WOFF2/WOFF:

#### Opsi 1: Online Converter (Termudah)

1. Gunakan [CloudConvert](https://cloudconvert.com/ttf-to-woff2) atau [Font Squirrel Webfont Generator](https://www.fontsquirrel.com/tools/webfont-generator)
2. Upload font files (.ttf atau .otf)
3. Download hasil konversi (.woff2 dan .woff)
4. Simpan ke folder `public/fonts/`

#### Opsi 2: Command Line (Jika punya Node.js)

```bash
# Install fonttools
pip install fonttools brotli

# Convert ke WOFF2
pyftsubset font.ttf --flavor=woff2 --output-file=font.woff2
```

#### Opsi 3: Menggunakan FontForge (Desktop App)

1. Download [FontForge](https://fontforge.org/)
2. Open font file → File → Generate Fonts
3. Pilih format WOFF dan WOFF2
4. Save ke folder `public/fonts/`

## Nama File yang Diperlukan

Setelah convert, rename file sesuai kebutuhan:

**SF Pro Display:**

- `SF-Pro-Display-Regular.woff2` dan `.woff`
- `SF-Pro-Display-Medium.woff2` dan `.woff`
- `SF-Pro-Display-Semibold.woff2` dan `.woff`
- `SF-Pro-Display-Bold.woff2` dan `.woff`

**SF Pro Text:**

- `SF-Pro-Text-Regular.woff2` dan `.woff`
- `SF-Pro-Text-Medium.woff2` dan `.woff`
- `SF-Pro-Text-Semibold.woff2` dan `.woff`

## Aktifkan Font di Project

Setelah font files ditambahkan ke folder `public/fonts/`:

1. Buka `app/globals.css`
2. Uncomment bagian `@font-face` (hapus `/*` dan `*/`)
3. Font San Francisco akan otomatis digunakan di Windows dan Android

## Alternatif: Menggunakan Inter Font

Jika Anda tidak memiliki font San Francisco, project ini sudah dikonfigurasi untuk menggunakan Inter font sebagai alternatif yang mirip dengan San Francisco dan tersedia secara open source.

## Tips

- Pastikan semua font files ada sebelum uncomment `@font-face`
- WOFF2 adalah format yang lebih modern dan lebih kecil ukurannya
- Simpan juga format WOFF sebagai fallback untuk browser lama
- Setelah menambahkan font files, restart development server
