# 🗺️ SadarEdu Backend API (PostgreSQL + PostGIS)

Sistem Informasi Geografis (SIG) & *Spatial Decision Support System* (SDSS) untuk pemetaan, analisis prioritas, dan simulasi intervensi pembangunan fasilitas pendidikan.

---

## 📌 Teknologi & Stack Utama

*   **Runtime**: Node.js (v18+)
*   **Framework**: Express.js
*   **Database**: PostgreSQL (v15+) dengan Ekstensi Spasial **PostGIS (v3.x)**
*   **Database Driver**: `pg` (node-postgres connection pool)
*   **Spatial Library**: `@turf/turf` & PostGIS EWKB/GeoJSON Functions
*   **Autentikasi**: JSON Web Token (JWT) & Password Hashing (`bcryptjs`)
*   **Keamanan & Middleware**: `cors`, `helmet`, `morgan`

---

## 🗄️ Struktur Database (13 Tabel ERD)

Database menggunakan nama default **`SadarEdu`** dengan 13 tabel utama yang terbagi dalam 5 modul:

1.  **Modul User & Pengaturan**:
    *   `role`: Master peran (`Umum`, `Stakeholder`, `Operator`)
    *   `user_account`: Data akun & autentikasi pengguna
    *   `dataset_metadata`: Catatan riwayat & metadata file spatial yang diunggah
2.  **Modul Master Spasial (PostGIS)**:
    *   `wilayah`: Batas hirarki wilayah (`MultiPolygon`, SRID 4326) + GiST Index
    *   `sekolah`: Titik lokasi sekolah (`Point`, SRID 4326) + GiST Index
3.  **Modul Demografi & Statistik**:
    *   `kependudukan`: Data jumlah penduduk & usia anak sekolah per wilayah
    *   `statistik_pendidikan`: Data siswa, guru, rombel, & ruang kelas per sekolah
4.  **Modul Indikator & Skor Prioritas**:
    *   `indikator`: Master variabel penilaian (bobot, arah pengaruh)
    *   `nilai_indikator`: Nilai mentah & normalisasi indikator per wilayah
    *   `priority_score`: Hasil kalkulasi total skor prioritas & ranking kebutuhan
5.  **Modul Perencanaan & Simulasi Spasial**:
    *   `candidate_area`: Polygon calon lokasi pengembangan (`Polygon`, SRID 4326)
    *   `scenario_intervensi`: Parameter skenario kebijakan (JSONB)
    *   `hasil_simulasi`: Hasil komparasi skor sebelum & sesudah simulasi (JSONB)

---

## 🚀 Panduan Setup & Instalasi Lokal

### 1. Prasyarat
*   **Node.js** v18 atau lebih baru.
*   **PostgreSQL** (v15/v16) dengan **PostGIS Extension** terinstal.
*   Aplikasi GUI PostgreSQL seperti **pgAdmin 4**.

### 2. Langkah Setup Database
1. Buka **pgAdmin 4** atau `psql`.
2. Buat database baru bernama **`SadarEdu`**.
3. Jalankan file **[`schema.sql`](file:///c:/Users/USER/Documents/SIG%20DATA/SadarEdu-be/schema.sql)** di Query Tool untuk membuat seluruh tabel, constraint, extension PostGIS, dan indeks spasial GiST.
4. *(Opsional)* File **[`seed.sql`](file:///c:/Users/USER/Documents/SIG%20DATA/SadarEdu-be/seed.sql)** berisi seed data master `role` (akan di-seed otomatis oleh server jika belum ada).

### 3. Setup Projek Node.js
1. Clone repositori ini dan masuk ke direktori projek:
   ```bash
   cd SadarEdu-be
   ```
2. Install dependensi:
   ```bash
   cmd /c npm install
   ```
3. Konfigurasi variabel lingkungan di file **`.env`**:
   ```env
   PORT=5000
   NODE_ENV=development

   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=password_postgres_anda
   DB_NAME=SadarEdu

   JWT_SECRET=super_secret_sadaredu_jwt_key_2026
   JWT_EXPIRES_IN=1d
   ```
4. Jalankan server pengembangan (Development Mode):
   ```bash
   cmd /c npm run dev
   ```
   Server akan berjalan di `http://localhost:5000`.

---

## 📁 Struktur Folder Projek

```text
SadarEdu-be/
├── src/
│   ├── config/
│   │   ├── db.js               # PostgreSQL Pool connection & PostGIS setup
│   │   └── seedRoles.js        # Auto-seed data static role (Umum, Stakeholder, Operator)
│   ├── controllers/
│   │   ├── authController.js           # Register, Login, & Profile
│   │   ├── wilayahController.js        # MultiPolygon GeoJSON & Detail Wilayah
│   │   ├── sekolahController.js        # Point GeoJSON, Nearby Search, & Statistik
│   │   ├── indikatorController.js      # Master Indikator & Priority Score
│   │   ├── candidateAreaController.js  # Polygon GeoJSON Candidate Area
│   │   └── simulasiController.js       # Skenario Intervensi & Hasil Simulasi
│   ├── middleware/
│   │   ├── auth.js             # JWT Bearer Token validation
│   │   └── errorHandler.js     # Centralized API error handling
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── wilayahRoutes.js
│   │   ├── sekolahRoutes.js
│   │   ├── indikatorRoutes.js
│   │   ├── candidateAreaRoutes.js
│   │   ├── simulasiRoutes.js
│   │   └── index.js            # Router Aggregator (/api/v1)
│   ├── utils/
│   │   └── geoHelper.js        # Converter PostGIS query to GeoJSON FeatureCollection
│   └── app.js                  # Express Application Instance & Security Config
├── .env                        # Local Environment Config (Ignored in Git)
├── .env.example                # Template Environment Variables
├── schema.sql                  # Full Database DDL Schema (13 Tables + PostGIS)
├── seed.sql                    # Initial Master Data Seed SQL
├── package.json
└── server.js                   # Server Entry Point
```

---

## 🌐 Dokumentasi Endpoint REST API (`/api/v1`)

### 🔑 1. Autentikasi (`/api/v1/auth`)

| Method | Endpoint | Auth | Deskripsi |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/v1/auth/register` | ❌ | Mendaftarkan akun pengguna baru (`id_role`: 1=Umum, 2=Stakeholder, 3=Operator) |
| `POST` | `/api/v1/auth/login` | ❌ | Login pengguna & mendapatkan JWT Bearer Token |
| `GET` | `/api/v1/auth/profile` | ✅ | Mengambil detail profil user yang sedang login |

#### Contoh Request Body Register (`POST /api/v1/auth/register`):
```json
{
  "nama": "Operator Utama",
  "email": "operator@sadaredu.id",
  "password": "operatorpass123",
  "id_role": 3
}
```

---

### 🗺️ 2. Wilayah Spasial (`/api/v1/wilayah`)

| Method | Endpoint | Auth | Deskripsi |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/v1/wilayah/geojson` | ❌ | Mengambil seluruh data batas wilayah dalam format **GeoJSON MultiPolygon** |
| `GET` | `/api/v1/wilayah/:id` | ❌ | Mengambil detail 1 wilayah berdasarkan ID |
| `POST` | `/api/v1/wilayah` | ✅ | Menambahkan data wilayah spasial baru (`MultiPolygon` GeoJSON) |

---

### 🏫 3. Sekolah & Statistik (`/api/v1/sekolah`)

| Method | Endpoint | Auth | Deskripsi |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/v1/sekolah/geojson` | ❌ | Mengambil lokasi sekolah dalam format **GeoJSON Point** |
| `GET` | `/api/v1/sekolah/nearby` | ❌ | Pencarian sekolah terdekat berdasarkan koordinat (Pencarian Spasial Radius PostGIS `ST_DWithin`) |
| `POST` | `/api/v1/sekolah` | ✅ | Menambahkan titik lokasi sekolah baru (`latitude`, `longitude`) |
| `GET` | `/api/v1/sekolah/statistik` | ❌ | Mengambil data statistik pendidikan (siswa, guru, rombel, ruang kelas) |
| `POST` | `/api/v1/sekolah/statistik` | ✅ | Menambahkan record statistik pendidikan per sekolah & tahun |

---

### 📊 4. Indikator & Skor Prioritas (`/api/v1/indikator`)

| Method | Endpoint | Auth | Deskripsi |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/v1/indikator` | ❌ | Mengambil daftar variabel indikator penilaian |
| `POST` | `/api/v1/indikator` | ✅ | Menambahkan indikator baru (bobot, arah pengaruh) |
| `GET` | `/api/v1/indikator/priority-scores` | ❌ | Mengambil hasil kalkulasi skor prioritas wilayah & ranking |

---

### 📐 5. Area Kandidat Spasial (`/api/v1/candidate-areas`)

| Method | Endpoint | Auth | Deskripsi |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/v1/candidate-areas/geojson` | ❌ | Mengambil data polygon area calon lokasi baru dalam format **GeoJSON Polygon** |

---

### 🧪 6. Simulasi Intervensi (`/api/v1/simulasi`)

| Method | Endpoint | Auth | Deskripsi |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/v1/simulasi/scenarios` | ❌ | Mengambil daftar skenario intervensi yang pernah dibuat |
| `POST` | `/api/v1/simulasi/scenarios` | ✅ | Membuat skenario intervensi baru & menghitung hasil simulasi |

---
