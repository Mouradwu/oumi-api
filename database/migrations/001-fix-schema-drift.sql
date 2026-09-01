-- ============================================================================
-- Migration 001 : reconcilie une base OUMI deja deployee (schema quel qu'il
-- soit) avec le schema corrige de reference (schema-complete.sql).
--
-- IMPORTANT : ce fichier est fourni pour lecture/reference et pour une
-- execution manuelle eventuelle. En production, c'est apps/api/src/migrate.ts
-- (genere a partir des memes instructions) qui s'execute reellement, en
-- executant chaque instruction ci-dessous INDEPENDAMMENT (pas de BEGIN/COMMIT
-- global) afin qu'une erreur isolee sur une instruction ne fasse pas annuler
-- les autres. Si vous executez ce fichier manuellement via psql, faites de
-- meme (n'enveloppez pas tout dans une seule transaction), ou passez
-- -v ON_ERROR_STOP=0 pour continuer malgre les erreurs individuelles.
--
-- Toutes les tables sont creees en IF NOT EXISTS (rien n'est ecrase).
-- Toutes les colonnes sont ajoutees en ADD COLUMN IF NOT EXISTS, en version
-- nullable et SANS contrainte de cle etrangere inline (une FK ajoutee ainsi
-- pourrait echouer si la table referencee a derive - ex. un id historique
-- en INTEGER au lieu d'UUID - et ferait echouer l'ajout de colonne avec).
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS wilayas (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    name_fr VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100),
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7)
);

CREATE TABLE IF NOT EXISTS dairas (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    name_fr VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100),
    wilaya_code VARCHAR(10) REFERENCES wilayas(code) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS communes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    name_fr VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100),
    daira_code VARCHAR(10) REFERENCES dairas(code) ON DELETE CASCADE,
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7)
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50),
    phone VARCHAR(20),
    roles TEXT[] DEFAULT ARRAY['donor']::TEXT[],
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS donors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    blood_type VARCHAR(5) NOT NULL,
    donation_types TEXT[],
    wilaya_id INTEGER,
    daira_id INTEGER,
    commune_id INTEGER,
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    availability_status VARCHAR(10) DEFAULT 'green',
    last_donation_date DATE,
    is_verified BOOLEAN DEFAULT false,
    certified BOOLEAN DEFAULT false,
    has_donated_before BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recipients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    wilaya_id INTEGER,
    commune_id INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS donation_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_id UUID REFERENCES users(id),
    blood_type VARCHAR(5) NOT NULL,
    donation_type VARCHAR(20) NOT NULL,
    wilaya_id INTEGER NOT NULL,
    commune_id INTEGER,
    hospital_name VARCHAR(255),
    service VARCHAR(100),
    urgency_level VARCHAR(20) DEFAULT 'normal',
    needed_date DATE,
    contact_phone VARCHAR(20),
    additional_info TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    is_verified BOOLEAN DEFAULT false,
    verified_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID REFERENCES donation_requests(id) ON DELETE CASCADE,
    donor_id UUID REFERENCES donors(id) ON DELETE CASCADE,
    score DECIMAL(5, 2),
    distance_km DECIMAL(10, 2),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id),
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    body TEXT,
    type VARCHAR(50),
    is_read BOOLEAN DEFAULT false,
    data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hospitals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_fr VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255),
    type VARCHAR(50),
    wilaya_id INTEGER,
    daira_id INTEGER,
    commune_id INTEGER,
    address TEXT,
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    phone VARCHAR(20),
    phone_emergency VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    opening_hours TEXT,
    services TEXT[],
    blood_services BOOLEAN DEFAULT false,
    source VARCHAR(255),
    source_url TEXT,
    verified BOOLEAN DEFAULT false,
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clinics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_fr VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255),
    wilaya_id INTEGER,
    daira_id INTEGER,
    commune_id INTEGER,
    address TEXT,
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    phone VARCHAR(20),
    services TEXT[],
    source VARCHAR(255),
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transfusion_centers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_fr VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255),
    wilaya_id INTEGER,
    daira_id INTEGER,
    commune_id INTEGER,
    address TEXT,
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    phone VARCHAR(20),
    opening_hours TEXT,
    accepted_donation_types TEXT[],
    source VARCHAR(255),
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pharmacies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_fr VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255),
    wilaya_id INTEGER,
    commune_id INTEGER,
    address TEXT,
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    phone VARCHAR(20),
    opening_hours TEXT,
    is_on_duty BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    organizer_id UUID REFERENCES users(id),
    organizer_type VARCHAR(50),
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    wilaya_id INTEGER,
    commune_id INTEGER,
    location TEXT,
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    donation_types TEXT[],
    description TEXT,
    contact_phone VARCHAR(20),
    status VARCHAR(20) DEFAULT 'scheduled',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS associations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255),
    admin_user_id UUID REFERENCES users(id),
    wilaya_id INTEGER,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    description TEXT,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID REFERENCES users(id),
    reported_user_id UUID REFERENCES users(id),
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    reviewed_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    blocker_id UUID REFERENCES users(id),
    blocked_user_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(blocker_id, blocked_user_id)
);

CREATE TABLE IF NOT EXISTS verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    document_type VARCHAR(50),
    document_url TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS consents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    consent_type VARCHAR(50) NOT NULL,
    granted BOOLEAN DEFAULT true,
    granted_at TIMESTAMP DEFAULT NOW(),
    revoked_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS app_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT,
    description TEXT,
    updated_at TIMESTAMP DEFAULT NOW()
);

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'role'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'roles'
    ) THEN
        ALTER TABLE users ADD COLUMN roles TEXT[] DEFAULT ARRAY['donor']::TEXT[];
        UPDATE users SET roles = ARRAY[role]::TEXT[] WHERE role IS NOT NULL;
        ALTER TABLE users DROP COLUMN role;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'donation_requests' AND column_name = 'hospital_id'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'donation_requests' AND column_name = 'hospital_name'
    ) THEN
        ALTER TABLE donation_requests ADD COLUMN hospital_name VARCHAR(255);
        ALTER TABLE donation_requests DROP COLUMN hospital_id;
    END IF;
END $$;

ALTER TABLE wilayas ADD COLUMN IF NOT EXISTS code VARCHAR(10);

ALTER TABLE wilayas ADD COLUMN IF NOT EXISTS name_fr VARCHAR(100);

ALTER TABLE wilayas ADD COLUMN IF NOT EXISTS name_ar VARCHAR(100);

ALTER TABLE wilayas ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 7);

ALTER TABLE wilayas ADD COLUMN IF NOT EXISTS longitude DECIMAL(10, 7);

ALTER TABLE dairas ADD COLUMN IF NOT EXISTS code VARCHAR(10);

ALTER TABLE dairas ADD COLUMN IF NOT EXISTS name_fr VARCHAR(100);

ALTER TABLE dairas ADD COLUMN IF NOT EXISTS name_ar VARCHAR(100);

ALTER TABLE dairas ADD COLUMN IF NOT EXISTS wilaya_code VARCHAR(10);

ALTER TABLE communes ADD COLUMN IF NOT EXISTS code VARCHAR(10);

ALTER TABLE communes ADD COLUMN IF NOT EXISTS name_fr VARCHAR(100);

ALTER TABLE communes ADD COLUMN IF NOT EXISTS name_ar VARCHAR(100);

ALTER TABLE communes ADD COLUMN IF NOT EXISTS daira_code VARCHAR(10);

ALTER TABLE communes ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 7);

ALTER TABLE communes ADD COLUMN IF NOT EXISTS longitude DECIMAL(10, 7);

ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255);

ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255);

ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(50);

ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR(50);

ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

ALTER TABLE users ADD COLUMN IF NOT EXISTS roles TEXT[] DEFAULT ARRAY['donor']::TEXT[];

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

ALTER TABLE donors ADD COLUMN IF NOT EXISTS user_id UUID;

ALTER TABLE donors ADD COLUMN IF NOT EXISTS blood_type VARCHAR(5);

ALTER TABLE donors ADD COLUMN IF NOT EXISTS donation_types TEXT[];

ALTER TABLE donors ADD COLUMN IF NOT EXISTS wilaya_id INTEGER;

ALTER TABLE donors ADD COLUMN IF NOT EXISTS daira_id INTEGER;

ALTER TABLE donors ADD COLUMN IF NOT EXISTS commune_id INTEGER;

ALTER TABLE donors ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 7);

ALTER TABLE donors ADD COLUMN IF NOT EXISTS longitude DECIMAL(10, 7);

ALTER TABLE donors ADD COLUMN IF NOT EXISTS availability_status VARCHAR(10) DEFAULT 'green';

ALTER TABLE donors ADD COLUMN IF NOT EXISTS last_donation_date DATE;

ALTER TABLE donors ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

ALTER TABLE donors ADD COLUMN IF NOT EXISTS certified BOOLEAN DEFAULT false;

ALTER TABLE donors ADD COLUMN IF NOT EXISTS has_donated_before BOOLEAN DEFAULT false;

ALTER TABLE donors ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

ALTER TABLE donors ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

ALTER TABLE recipients ADD COLUMN IF NOT EXISTS user_id UUID;

ALTER TABLE recipients ADD COLUMN IF NOT EXISTS wilaya_id INTEGER;

ALTER TABLE recipients ADD COLUMN IF NOT EXISTS commune_id INTEGER;

ALTER TABLE recipients ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

ALTER TABLE donation_requests ADD COLUMN IF NOT EXISTS requester_id UUID;

ALTER TABLE donation_requests ADD COLUMN IF NOT EXISTS blood_type VARCHAR(5);

ALTER TABLE donation_requests ADD COLUMN IF NOT EXISTS donation_type VARCHAR(20);

ALTER TABLE donation_requests ADD COLUMN IF NOT EXISTS wilaya_id INTEGER;

ALTER TABLE donation_requests ADD COLUMN IF NOT EXISTS commune_id INTEGER;

ALTER TABLE donation_requests ADD COLUMN IF NOT EXISTS hospital_name VARCHAR(255);

ALTER TABLE donation_requests ADD COLUMN IF NOT EXISTS service VARCHAR(100);

ALTER TABLE donation_requests ADD COLUMN IF NOT EXISTS urgency_level VARCHAR(20) DEFAULT 'normal';

ALTER TABLE donation_requests ADD COLUMN IF NOT EXISTS needed_date DATE;

ALTER TABLE donation_requests ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(20);

ALTER TABLE donation_requests ADD COLUMN IF NOT EXISTS additional_info TEXT;

ALTER TABLE donation_requests ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';

ALTER TABLE donation_requests ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

ALTER TABLE donation_requests ADD COLUMN IF NOT EXISTS verified_by UUID;

ALTER TABLE donation_requests ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

ALTER TABLE donation_requests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

ALTER TABLE matches ADD COLUMN IF NOT EXISTS request_id UUID;

ALTER TABLE matches ADD COLUMN IF NOT EXISTS donor_id UUID;

ALTER TABLE matches ADD COLUMN IF NOT EXISTS score DECIMAL(5, 2);

ALTER TABLE matches ADD COLUMN IF NOT EXISTS distance_km DECIMAL(10, 2);

ALTER TABLE matches ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';

ALTER TABLE matches ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

ALTER TABLE conversations ADD COLUMN IF NOT EXISTS match_id UUID;

ALTER TABLE conversations ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

ALTER TABLE conversations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

ALTER TABLE messages ADD COLUMN IF NOT EXISTS conversation_id UUID;

ALTER TABLE messages ADD COLUMN IF NOT EXISTS sender_id UUID;

ALTER TABLE messages ADD COLUMN IF NOT EXISTS content TEXT;

ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;

ALTER TABLE messages ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS user_id UUID;

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS title VARCHAR(255);

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS body TEXT;

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type VARCHAR(50);

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS data JSONB;

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS name_fr VARCHAR(255);

ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS name_ar VARCHAR(255);

ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS type VARCHAR(50);

ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS wilaya_id INTEGER;

ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS daira_id INTEGER;

ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS commune_id INTEGER;

ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS address TEXT;

ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 7);

ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS longitude DECIMAL(10, 7);

ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS phone_emergency VARCHAR(20);

ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS email VARCHAR(255);

ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS website VARCHAR(255);

ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS opening_hours TEXT;

ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS services TEXT[];

ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS blood_services BOOLEAN DEFAULT false;

ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS source VARCHAR(255);

ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS source_url TEXT;

ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;

ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP;

ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

ALTER TABLE clinics ADD COLUMN IF NOT EXISTS name_fr VARCHAR(255);

ALTER TABLE clinics ADD COLUMN IF NOT EXISTS name_ar VARCHAR(255);

ALTER TABLE clinics ADD COLUMN IF NOT EXISTS wilaya_id INTEGER;

ALTER TABLE clinics ADD COLUMN IF NOT EXISTS daira_id INTEGER;

ALTER TABLE clinics ADD COLUMN IF NOT EXISTS commune_id INTEGER;

ALTER TABLE clinics ADD COLUMN IF NOT EXISTS address TEXT;

ALTER TABLE clinics ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 7);

ALTER TABLE clinics ADD COLUMN IF NOT EXISTS longitude DECIMAL(10, 7);

ALTER TABLE clinics ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

ALTER TABLE clinics ADD COLUMN IF NOT EXISTS services TEXT[];

ALTER TABLE clinics ADD COLUMN IF NOT EXISTS source VARCHAR(255);

ALTER TABLE clinics ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;

ALTER TABLE clinics ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

ALTER TABLE transfusion_centers ADD COLUMN IF NOT EXISTS name_fr VARCHAR(255);

ALTER TABLE transfusion_centers ADD COLUMN IF NOT EXISTS name_ar VARCHAR(255);

ALTER TABLE transfusion_centers ADD COLUMN IF NOT EXISTS wilaya_id INTEGER;

ALTER TABLE transfusion_centers ADD COLUMN IF NOT EXISTS daira_id INTEGER;

ALTER TABLE transfusion_centers ADD COLUMN IF NOT EXISTS commune_id INTEGER;

ALTER TABLE transfusion_centers ADD COLUMN IF NOT EXISTS address TEXT;

ALTER TABLE transfusion_centers ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 7);

ALTER TABLE transfusion_centers ADD COLUMN IF NOT EXISTS longitude DECIMAL(10, 7);

ALTER TABLE transfusion_centers ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

ALTER TABLE transfusion_centers ADD COLUMN IF NOT EXISTS opening_hours TEXT;

ALTER TABLE transfusion_centers ADD COLUMN IF NOT EXISTS accepted_donation_types TEXT[];

ALTER TABLE transfusion_centers ADD COLUMN IF NOT EXISTS source VARCHAR(255);

ALTER TABLE transfusion_centers ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;

ALTER TABLE transfusion_centers ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS name_fr VARCHAR(255);

ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS name_ar VARCHAR(255);

ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS wilaya_id INTEGER;

ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS commune_id INTEGER;

ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS address TEXT;

ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 7);

ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS longitude DECIMAL(10, 7);

ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS opening_hours TEXT;

ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS is_on_duty BOOLEAN DEFAULT false;

ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS name VARCHAR(255);

ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS organizer_id UUID;

ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS organizer_type VARCHAR(50);

ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS start_date TIMESTAMP;

ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS end_date TIMESTAMP;

ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS wilaya_id INTEGER;

ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS commune_id INTEGER;

ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS location TEXT;

ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 7);

ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS longitude DECIMAL(10, 7);

ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS donation_types TEXT[];

ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(20);

ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'scheduled';

ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

ALTER TABLE associations ADD COLUMN IF NOT EXISTS name VARCHAR(255);

ALTER TABLE associations ADD COLUMN IF NOT EXISTS name_ar VARCHAR(255);

ALTER TABLE associations ADD COLUMN IF NOT EXISTS admin_user_id UUID;

ALTER TABLE associations ADD COLUMN IF NOT EXISTS wilaya_id INTEGER;

ALTER TABLE associations ADD COLUMN IF NOT EXISTS address TEXT;

ALTER TABLE associations ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

ALTER TABLE associations ADD COLUMN IF NOT EXISTS email VARCHAR(255);

ALTER TABLE associations ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE associations ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

ALTER TABLE associations ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

ALTER TABLE reports ADD COLUMN IF NOT EXISTS reporter_id UUID;

ALTER TABLE reports ADD COLUMN IF NOT EXISTS reported_user_id UUID;

ALTER TABLE reports ADD COLUMN IF NOT EXISTS reason TEXT;

ALTER TABLE reports ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';

ALTER TABLE reports ADD COLUMN IF NOT EXISTS reviewed_by UUID;

ALTER TABLE reports ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

ALTER TABLE blocks ADD COLUMN IF NOT EXISTS blocker_id UUID;

ALTER TABLE blocks ADD COLUMN IF NOT EXISTS blocked_user_id UUID;

ALTER TABLE blocks ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

ALTER TABLE verifications ADD COLUMN IF NOT EXISTS user_id UUID;

ALTER TABLE verifications ADD COLUMN IF NOT EXISTS document_type VARCHAR(50);

ALTER TABLE verifications ADD COLUMN IF NOT EXISTS document_url TEXT;

ALTER TABLE verifications ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';

ALTER TABLE verifications ADD COLUMN IF NOT EXISTS reviewed_by UUID;

ALTER TABLE verifications ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP;

ALTER TABLE verifications ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_id UUID;

ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS action VARCHAR(100);

ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS entity_type VARCHAR(50);

ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS entity_id UUID;

ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS details JSONB;

ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45);

ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

ALTER TABLE consents ADD COLUMN IF NOT EXISTS user_id UUID;

ALTER TABLE consents ADD COLUMN IF NOT EXISTS consent_type VARCHAR(50);

ALTER TABLE consents ADD COLUMN IF NOT EXISTS granted BOOLEAN DEFAULT true;

ALTER TABLE consents ADD COLUMN IF NOT EXISTS granted_at TIMESTAMP DEFAULT NOW();

ALTER TABLE consents ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMP;

ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS value TEXT;

ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Verification rapide apres migration :
--   SELECT column_name FROM information_schema.columns WHERE table_name = 'users';
--   SELECT column_name FROM information_schema.columns WHERE table_name = 'donors';
--   SELECT count(*) FROM wilayas;
