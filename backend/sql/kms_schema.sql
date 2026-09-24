-- ============================================================================
-- SKEMA DATABASE KNOWLEDGE MANAGEMENT SYSTEM (KMS) TOKO JAM TANGAN
-- Schema: toko_jam
-- Terdiri dari:
--   1. Master Data: knowledge_categories
--   2. Tabel Konten Ternormalisasi:
--      - knowledge_policies (SOP & Kebijakan)
--      - knowledge_faqs (Tanya Jawab Teknis Produk)
--      - knowledge_videos (Video Pelatihan Praktis)
--      - knowledge_case_studies (Studi Kasus Troubleshooting)
--      - knowledge_articles (Artikel & Wawasan Horologi)
--   3. Tabel Pendukung & Governance:
--      - knowledge_attachments (Multi-lampiran File Polimorfik)
--      - knowledge_bookmarks (Favorit Personel Polimorfik)
--      - knowledge_versions (Riwayat Revisi Universal dengan Snapshot JSONB)
--   4. View: knowledge_search_view (Pencarian Global Lintas Tipe)
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS toko_jam;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ----------------------------------------------------------------------------
-- 0. FUNCTION PEMBARUAN TIMESTAMP OTOMATIS (updated_at)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION toko_jam.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 1. TABEL: knowledge_categories
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS toko_jam.knowledge_categories (
    category_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama_kategori VARCHAR(100) NOT NULL UNIQUE,
    deskripsi     VARCHAR(255),
    urutan        INT DEFAULT 0,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 2. TABEL: knowledge_policies (SOP & Kebijakan Toko)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS toko_jam.knowledge_policies (
    policy_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id     UUID REFERENCES toko_jam.knowledge_categories(category_id) ON DELETE SET NULL,
    judul           VARCHAR(255) NOT NULL,
    ringkasan       TEXT NOT NULL,
    konten          TEXT NOT NULL,
    prioritas       INT NOT NULL DEFAULT 2 CHECK (prioritas IN (1, 2, 3)), -- 1=Wajib, 2=Anjuran, 3=Info
    nomor_versi     VARCHAR(20) NOT NULL DEFAULT 'v1.0',
    catatan_revisi  TEXT,
    tags            TEXT[],
    created_by      UUID REFERENCES toko_jam.personnel(personnel_id) ON DELETE SET NULL,
    is_published    BOOLEAN DEFAULT TRUE,
    view_count      INT DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kp_category ON toko_jam.knowledge_policies(category_id);
CREATE INDEX IF NOT EXISTS idx_kp_prioritas ON toko_jam.knowledge_policies(prioritas);
CREATE INDEX IF NOT EXISTS idx_kp_created_at ON toko_jam.knowledge_policies(created_at DESC);

DROP TRIGGER IF EXISTS trg_kp_updated_at ON toko_jam.knowledge_policies;
CREATE TRIGGER trg_kp_updated_at
BEFORE UPDATE ON toko_jam.knowledge_policies
FOR EACH ROW EXECUTE FUNCTION toko_jam.set_updated_at();

-- ----------------------------------------------------------------------------
-- 3. TABEL: knowledge_faqs (Tanya Jawab Teknis Produk)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS toko_jam.knowledge_faqs (
    faq_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id     UUID REFERENCES toko_jam.knowledge_categories(category_id) ON DELETE SET NULL,
    pertanyaan      TEXT NOT NULL,
    jawaban         TEXT NOT NULL,
    nomor_versi     VARCHAR(20) NOT NULL DEFAULT 'v1.0',
    catatan_revisi  TEXT,
    tags            TEXT[],
    created_by      UUID REFERENCES toko_jam.personnel(personnel_id) ON DELETE SET NULL,
    is_published    BOOLEAN DEFAULT TRUE,
    view_count      INT DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kf_category ON toko_jam.knowledge_faqs(category_id);
CREATE INDEX IF NOT EXISTS idx_kf_created_at ON toko_jam.knowledge_faqs(created_at DESC);

DROP TRIGGER IF EXISTS trg_kf_updated_at ON toko_jam.knowledge_faqs;
CREATE TRIGGER trg_kf_updated_at
BEFORE UPDATE ON toko_jam.knowledge_faqs
FOR EACH ROW EXECUTE FUNCTION toko_jam.set_updated_at();

-- ----------------------------------------------------------------------------
-- 4. TABEL: knowledge_videos (Video Pelatihan Praktis)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS toko_jam.knowledge_videos (
    video_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id     UUID REFERENCES toko_jam.knowledge_categories(category_id) ON DELETE SET NULL,
    judul           VARCHAR(255) NOT NULL,
    deskripsi       TEXT NOT NULL,
    video_url       VARCHAR(500) NOT NULL,
    durasi_menit    INT NOT NULL,
    thumbnail_url   VARCHAR(500),
    nomor_versi     VARCHAR(20) NOT NULL DEFAULT 'v1.0',
    catatan_revisi  TEXT,
    tags            TEXT[],
    created_by      UUID REFERENCES toko_jam.personnel(personnel_id) ON DELETE SET NULL,
    is_published    BOOLEAN DEFAULT TRUE,
    view_count      INT DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kv_category ON toko_jam.knowledge_videos(category_id);
CREATE INDEX IF NOT EXISTS idx_kv_created_at ON toko_jam.knowledge_videos(created_at DESC);

DROP TRIGGER IF EXISTS trg_kv_updated_at ON toko_jam.knowledge_videos;
CREATE TRIGGER trg_kv_updated_at
BEFORE UPDATE ON toko_jam.knowledge_videos
FOR EACH ROW EXECUTE FUNCTION toko_jam.set_updated_at();

-- ----------------------------------------------------------------------------
-- 5. TABEL: knowledge_case_studies (Studi Kasus Troubleshooting)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS toko_jam.knowledge_case_studies (
    case_study_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id     UUID REFERENCES toko_jam.knowledge_categories(category_id) ON DELETE SET NULL,
    judul           VARCHAR(255) NOT NULL,
    ringkasan       TEXT NOT NULL,
    kronologi       TEXT NOT NULL,
    analisis        TEXT NOT NULL,
    solusi          TEXT NOT NULL,
    pelajaran       TEXT NOT NULL,
    nomor_versi     VARCHAR(20) NOT NULL DEFAULT 'v1.0',
    catatan_revisi  TEXT,
    tags            TEXT[],
    created_by      UUID REFERENCES toko_jam.personnel(personnel_id) ON DELETE SET NULL,
    is_published    BOOLEAN DEFAULT TRUE,
    view_count      INT DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kcs_category ON toko_jam.knowledge_case_studies(category_id);
CREATE INDEX IF NOT EXISTS idx_kcs_created_at ON toko_jam.knowledge_case_studies(created_at DESC);

DROP TRIGGER IF EXISTS trg_kcs_updated_at ON toko_jam.knowledge_case_studies;
CREATE TRIGGER trg_kcs_updated_at
BEFORE UPDATE ON toko_jam.knowledge_case_studies
FOR EACH ROW EXECUTE FUNCTION toko_jam.set_updated_at();

-- ----------------------------------------------------------------------------
-- 6. TABEL: knowledge_articles (Artikel & Wawasan Horologi)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS toko_jam.knowledge_articles (
    article_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id     UUID REFERENCES toko_jam.knowledge_categories(category_id) ON DELETE SET NULL,
    judul           VARCHAR(255) NOT NULL,
    ringkasan       TEXT NOT NULL,
    konten          TEXT NOT NULL,
    nomor_versi     VARCHAR(20) NOT NULL DEFAULT 'v1.0',
    catatan_revisi  TEXT,
    tags            TEXT[],
    created_by      UUID REFERENCES toko_jam.personnel(personnel_id) ON DELETE SET NULL,
    is_published    BOOLEAN DEFAULT TRUE,
    view_count      INT DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ka_category ON toko_jam.knowledge_articles(category_id);
CREATE INDEX IF NOT EXISTS idx_ka_created_at ON toko_jam.knowledge_articles(created_at DESC);

DROP TRIGGER IF EXISTS trg_ka_updated_at ON toko_jam.knowledge_articles;
CREATE TRIGGER trg_ka_updated_at
BEFORE UPDATE ON toko_jam.knowledge_articles
FOR EACH ROW EXECUTE FUNCTION toko_jam.set_updated_at();

-- ----------------------------------------------------------------------------
-- 7. TABEL: knowledge_attachments (Multi-lampiran Polimorfik)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS toko_jam.knowledge_attachments (
    attachment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_table  VARCHAR(50) NOT NULL CHECK (source_table IN (
        'knowledge_policies', 'knowledge_faqs', 'knowledge_videos',
        'knowledge_case_studies', 'knowledge_articles'
    )),
    source_id     UUID NOT NULL,
    nama_file     VARCHAR(255) NOT NULL,
    file_url      VARCHAR(500) NOT NULL,
    tipe_file     VARCHAR(50) NOT NULL,
    ukuran_bytes  INT NOT NULL,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_katt_source ON toko_jam.knowledge_attachments(source_table, source_id);

-- ----------------------------------------------------------------------------
-- 8. TABEL: knowledge_bookmarks (Favorit Personel Polimorfik)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS toko_jam.knowledge_bookmarks (
    bookmark_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_table VARCHAR(50) NOT NULL CHECK (source_table IN (
        'knowledge_policies', 'knowledge_faqs', 'knowledge_videos',
        'knowledge_case_studies', 'knowledge_articles'
    )),
    source_id    UUID NOT NULL,
    personnel_id UUID NOT NULL REFERENCES toko_jam.personnel(personnel_id) ON DELETE CASCADE,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_knowledge_bookmark UNIQUE (source_table, source_id, personnel_id)
);

CREATE INDEX IF NOT EXISTS idx_kbm_personnel ON toko_jam.knowledge_bookmarks(personnel_id);
CREATE INDEX IF NOT EXISTS idx_kbm_source ON toko_jam.knowledge_bookmarks(source_table, source_id);

-- ----------------------------------------------------------------------------
-- 9. TABEL: knowledge_versions (Riwayat Revisi Universal dengan Snapshot JSONB)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS toko_jam.knowledge_versions (
    version_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_table      VARCHAR(50) NOT NULL CHECK (source_table IN (
        'knowledge_policies', 'knowledge_faqs', 'knowledge_videos',
        'knowledge_case_studies', 'knowledge_articles'
    )),
    source_id         UUID NOT NULL,
    nomor_versi       VARCHAR(20) NOT NULL,
    catatan_perubahan TEXT NOT NULL,
    snapshot_data     JSONB NOT NULL,
    diubah_oleh       UUID REFERENCES toko_jam.personnel(personnel_id) ON DELETE SET NULL,
    created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kv_lookup ON toko_jam.knowledge_versions(source_table, source_id, created_at DESC);

-- ----------------------------------------------------------------------------
-- 10. VIEW: knowledge_search_view (Pencarian Global Terpadu Lintas Tipe)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW toko_jam.knowledge_search_view AS

SELECT 
    policy_id AS item_id,
    'policy' AS tipe,
    category_id,
    judul,
    ringkasan AS pratinjau,
    nomor_versi,
    tags,
    created_by,
    is_published,
    view_count,
    created_at,
    updated_at
FROM toko_jam.knowledge_policies

UNION ALL

SELECT 
    faq_id AS item_id,
    'faq' AS tipe,
    category_id,
    pertanyaan AS judul,
    LEFT(jawaban, 220) AS pratinjau,
    nomor_versi,
    tags,
    created_by,
    is_published,
    view_count,
    created_at,
    updated_at
FROM toko_jam.knowledge_faqs

UNION ALL

SELECT 
    video_id AS item_id,
    'video' AS tipe,
    category_id,
    judul,
    deskripsi AS pratinjau,
    nomor_versi,
    tags,
    created_by,
    is_published,
    view_count,
    created_at,
    updated_at
FROM toko_jam.knowledge_videos

UNION ALL

SELECT 
    case_study_id AS item_id,
    'case_study' AS tipe,
    category_id,
    judul,
    ringkasan AS pratinjau,
    nomor_versi,
    tags,
    created_by,
    is_published,
    view_count,
    created_at,
    updated_at
FROM toko_jam.knowledge_case_studies

UNION ALL

SELECT 
    article_id AS item_id,
    'article' AS tipe,
    category_id,
    judul,
    ringkasan AS pratinjau,
    nomor_versi,
    tags,
    created_by,
    is_published,
    view_count,
    created_at,
    updated_at
FROM toko_jam.knowledge_articles;

-- ============================================================================
-- SEED DATA AWAL (KATEGORI & MATERI DASAR TOKO JAM TANGAN)
-- ============================================================================

-- 1. Kategori Toko Jam Tangan
INSERT INTO toko_jam.knowledge_categories (nama_kategori, deskripsi, urutan)
VALUES
    ('Water Resistance',      'Panduan ketahanan air, rating ATM/BAR, dan pengujian kedap air jam', 1),
    ('Movement & Kaliber',    'Karakteristik mesin otomatis, manual winding, quartz, dan solar',    2),
    ('Rantai & Strap',        'Panduan potong rantai, pin & collar, serta perawatan bahan tali',    3),
    ('Baterai & Daya',        'Penggantian baterai, pengisian tenaga surya, dan power reserve',     4),
    ('Garansi & Retur',       'Kebijakan garansi resmi pabrik, servis toko, dan kriteria klaim',    5),
    ('Komplikasi Jam',        'Fungsi chronograph, kalender, bezel diver, GMT, dan moonphase',      6),
    ('Material & Finishing',  'Karakteristik kaca sapphire crystal, ceramic bezel, dan stainless',  7),
    ('Keamanan & Display',    'Prosedur penanganan jam mewah di etalase dan brankas toko',          8),
    ('Identifikasi Keaslian', 'Pembedaan jam tangan original versus replika/KW/superclone',         9),
    ('Perawatan Umum',        'Pembersihan harian, penyimpanan aman, dan mitigasi magnetisasi',     10)
ON CONFLICT (nama_kategori) DO NOTHING;

-- 2. Seed SOP (knowledge_policies)
INSERT INTO toko_jam.knowledge_policies (
    category_id, judul, ringkasan, konten, prioritas, nomor_versi, catatan_revisi, tags
)
VALUES (
    (SELECT category_id FROM toko_jam.knowledge_categories WHERE nama_kategori = 'Keamanan & Display'),
    'SOP Penanganan dan Pengamanan Jam Tangan Mewah di Etalase',
    'Prosedur wajib bagi seluruh staf gerai dalam memegang, memajang, dan menyimpan jam tangan bernilai tinggi.',
    E'## 1. Tujuan\nMenjaga kondisi fisik jam tangan kelas atas bebas micro-scratch serta memastikan keamanan inventaris toko.\n\n## 2. Alat Wajib\n- Sarung tangan microfiber bersih.\n- Bantalan display beludru (*watch tray*).\n\n## 3. Langkah Operasional\n1. Staf dilarang memegang bodi/rantai jam dengan tangan telanjang saat melayani pembeli.\n2. Letakkan jam selalu di atas tray beludru, jangan langsung di atas kaca etalase.\n3. Maksimal mengeluarkan 2 unit jam tangan sekaligus di hadapan satu pelanggan.\n4. Kunci kembali pintu geser etalase sebelum memberikan jam ke tangan pelanggan.\n5. Saat tutup toko, seluruh jam display tengah wajib dipindahkan ke brankas utama.',
    1,
    'v1.0',
    'Penerbitan awal standar operasional gerai.',
    ARRAY['etalase', 'mewah', 'brankas', 'sarung_tangan', 'keamanan']
);

-- 3. Seed FAQ (knowledge_faqs)
INSERT INTO toko_jam.knowledge_faqs (
    category_id, pertanyaan, jawaban, nomor_versi, catatan_revisi, tags
)
VALUES (
    (SELECT category_id FROM toko_jam.knowledge_categories WHERE nama_kategori = 'Water Resistance'),
    'Apakah jam berlabel "Water Resistant 30M / 3 BAR" bisa dipakai untuk berenang?',
    E'**Sama sekali tidak boleh.**\n\nLabel 30M (3 BAR) merujuk pada uji tekanan statis pabrik, bukan kedalaman menyelam riil. Gerakan mengayuh tangan di dalam air menciptakan tekanan dinamis yang melampaui 3 BAR.\n\n### Panduan Rating:\n- **30M / 3 ATM**: Hanya tahan percikan hujan ringan dan cuci tangan.\n- **50M / 5 ATM**: Tahan guyuran mandi wastafel.\n- **100M / 10 ATM**: Aman untuk berenang di kolam renang permukaan.\n- **200M / 20 ATM**: Aman untuk diving rekreasi dan olahraga air.',
    'v1.0',
    'Penerbitan awal jawaban teknis water resistance.',
    ARRAY['water_resistance', '30m', '3atm', 'renang', 'edukasi']
);

-- 4. Seed Video (knowledge_videos)
INSERT INTO toko_jam.knowledge_videos (
    category_id, judul, deskripsi, video_url, durasi_menit, thumbnail_url, nomor_versi, catatan_revisi, tags
)
VALUES (
    (SELECT category_id FROM toko_jam.knowledge_categories WHERE nama_kategori = 'Rantai & Strap'),
    'Tutorial Potong Rantai Jam Tipe Pin & Collar (Seiko Presage & 5 Sports)',
    E'Panduan visual melepas dan memasang link rantai Seiko yang memakai sistem pipa collar mini.\n\n### Langkah Utama:\n1. Dorong pin searah tanda panah di sisi dalam link.\n2. Tahan dan simpan pipa collar yang keluar agar tidak hilang.\n3. Pasang kembali pin dari arah berlawanan panah.',
    'https://www.youtube.com/embed/dQw4w9WgXcQ',
    8,
    'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    'v1.0',
    'Video demonstrasi teknis servis rantai.',
    ARRAY['potong_rantai', 'seiko', 'pin_collar', 'servis']
);

-- 5. Seed Studi Kasus (knowledge_case_studies)
INSERT INTO toko_jam.knowledge_case_studies (
    category_id, judul, ringkasan, kronologi, analisis, solusi, pelajaran, nomor_versi, catatan_revisi, tags
)
VALUES (
    (SELECT category_id FROM toko_jam.knowledge_categories WHERE nama_kategori = 'Water Resistance'),
    'Kasus Jam Diver Orient Mako II Kemasukan Embun Pasca Ganti Baterai',
    'Analisis komplain jam diver 200M berembun tebal di balik kaca setelah servis penggantian baterai.',
    E'1. Pelanggan membawa Orient Mako II ganti baterai.\n2. Teknisi menutup case back tanpa melumasi O-ring gasket.\n3. Seminggu kemudian kaca jam berembun setelah dipakai berenang.',
    E'Pemeriksaan mikroskopis menemukan gasket karet terjepit dan terlipat di alur ulir karena tidak dilumasi silicone grease.',
    E'1. Membongkar mesin dan mengeringkan dial dengan heating lamp khusus 45°C.\n2. Memasang gasket baru yang dilumasi silicone grease 100%.\n3. Menutup case back dengan case closer wrench dan uji dry pressure test 6 BAR.',
    E'SOP Baru: Setiap ganti baterai jam WR ≥ 100M, WAJIB melumasi karet gasket dengan silikon dan melakukan uji kedap udara sebelum unit diserahkan ke pelanggan.',
    'v1.0',
    'Dokumentasi komplain servis cabang.',
    ARRAY['embun', 'gasket', 'diver', 'water_resistance', 'troubleshooting']
);

-- 6. Seed Artikel (knowledge_articles)
INSERT INTO toko_jam.knowledge_articles (
    category_id, judul, ringkasan, konten, nomor_versi, catatan_revisi, tags
)
VALUES (
    (SELECT category_id FROM toko_jam.knowledge_categories WHERE nama_kategori = 'Movement & Kaliber'),
    'Mengenal 4 Macam Mesin (Movement) Jam Tangan: Cara Kerja, Kelebihan, dan Perawatannya',
    'Panduan wawasan horologi mendalam bagi staf sales untuk memahami karakteristik teknis movement jam tangan.',
    E'## 1. Manual Hand-Winding\nJam mekanik murni tanpa rotor. Daya diisi dengan memutar crown 20-30 putaran setiap pagi.\n\n## 2. Automatic Mechanical\nMemiliki rotor pemberat yang berputar mengikuti gerakan tangan. Power reserve umumnya 40-80 jam. Peringatan: jangan menyetel tanggal antara jam 21.00 - 03.00 (danger zone).\n\n## 3. Quartz\nMenggunakan kristal kuarsa yang ditenagai baterai. Akurasi tinggi (±15 detik/bulan).\n\n## 4. Solar Powered\nSel fotovoltaik di bawah dial mengisi daya baterai sekunder. Bertahan 6 bulan dalam kegelapan total.',
    'v1.0',
    'Materi wawasan dasar horologi untuk staf baru.',
    ARRAY['movement', 'otomatis', 'quartz', 'solar', 'mesin_jam']
);
