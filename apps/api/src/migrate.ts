import { Client } from 'pg';

const MIGRATION_STATEMENTS: string[] = [
  `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`,
  `CREATE TABLE IF NOT EXISTS wilayas (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    name_fr VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100),
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7)
);`,
  `CREATE TABLE IF NOT EXISTS dairas (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    name_fr VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100),
    wilaya_code VARCHAR(10) REFERENCES wilayas(code) ON DELETE CASCADE
);`,
  `CREATE TABLE IF NOT EXISTS communes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    name_fr VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100),
    daira_code VARCHAR(10) REFERENCES dairas(code) ON DELETE CASCADE,
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7)
);`,
  `CREATE TABLE IF NOT EXISTS osm_health_facilities (
    id SERIAL PRIMARY KEY,
    osm_id BIGINT UNIQUE,
    category VARCHAR(20) NOT NULL, -- pharmacy | doctors | clinic | dentist | hospital
    name VARCHAR(255),
    name_ar VARCHAR(255),
    addr_city VARCHAR(255),
    wilaya_id INTEGER,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    specialty VARCHAR(255) -- pour category='doctors' : cardiologie, gynecologie, generaliste...
);`,
  `CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50),
    phone VARCHAR(20),
    roles TEXT[] DEFAULT ARRAY['donor']::TEXT[],
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    email_verified BOOLEAN DEFAULT false,
    email_verification_token VARCHAR(255),
    email_verification_expires TIMESTAMP,
    phone_verified BOOLEAN DEFAULT false,
    phone_otp_code VARCHAR(10),
    phone_otp_expires TIMESTAMP,
    account_status VARCHAR(30) DEFAULT 'pending_verification', -- pending_verification | active | suspended
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);`,
  `CREATE TABLE IF NOT EXISTS donors (
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
    donation_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);`,
  `CREATE TABLE IF NOT EXISTS recipients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    wilaya_id INTEGER,
    commune_id INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);`,
  `CREATE TABLE IF NOT EXISTS donation_requests (
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
    -- pending -> accepted -> donation_declared -> confirmed (ou refused / cancelled)
    status VARCHAR(20) DEFAULT 'pending',
    donor_id UUID REFERENCES users(id),
    donated_at TIMESTAMP,
    confirmed_at TIMESTAMP,
    is_verified BOOLEAN DEFAULT false,
    verified_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);`,
  `CREATE TABLE IF NOT EXISTS matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID REFERENCES donation_requests(id) ON DELETE CASCADE,
    donor_id UUID REFERENCES donors(id) ON DELETE CASCADE,
    score DECIMAL(5, 2),
    distance_km DECIMAL(10, 2),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);`,
  `CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);`,
  `CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id),
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);`,
  `CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    body TEXT,
    type VARCHAR(50),
    is_read BOOLEAN DEFAULT false,
    data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);`,
  `CREATE TABLE IF NOT EXISTS hospitals (
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
);`,
  `CREATE TABLE IF NOT EXISTS clinics (
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
);`,
  `CREATE TABLE IF NOT EXISTS transfusion_centers (
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
);`,
  `CREATE TABLE IF NOT EXISTS pharmacies (
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
);`,
  `CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    organizer_id UUID REFERENCES users(id),
    organizer_type VARCHAR(50),
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    hours_label VARCHAR(100),
    wilaya_id INTEGER,
    commune_id INTEGER,
    location TEXT,
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    donation_types TEXT[],
    blood_types_needed TEXT[],
    description TEXT,
    practical_info TEXT,
    image_url TEXT,
    contact_phone VARCHAR(20),
    contact_name VARCHAR(100),
    action_label VARCHAR(50) DEFAULT 'Prendre rendez-vous',
    display_order INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'draft', -- draft | active | inactive | ended
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);`,
  `CREATE TABLE IF NOT EXISTS badge_tiers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    threshold INTEGER NOT NULL UNIQUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);`,
  `CREATE TABLE IF NOT EXISTS associations (
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
);`,
  `CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID REFERENCES users(id),
    reported_user_id UUID REFERENCES users(id),
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    reviewed_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);`,
  `CREATE TABLE IF NOT EXISTS blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    blocker_id UUID REFERENCES users(id),
    blocked_user_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(blocker_id, blocked_user_id)
);`,
  `CREATE TABLE IF NOT EXISTS verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    document_type VARCHAR(50),
    document_url TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);`,
  `CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT NOW()
);`,
  `CREATE TABLE IF NOT EXISTS consents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    consent_type VARCHAR(50) NOT NULL,
    granted BOOLEAN DEFAULT true,
    granted_at TIMESTAMP DEFAULT NOW(),
    revoked_at TIMESTAMP
);`,
  `CREATE TABLE IF NOT EXISTS app_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT,
    description TEXT,
    updated_at TIMESTAMP DEFAULT NOW()
);`,
  `DO $$
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
END $$;`,
  `DO $$
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
END $$;`,
  `DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'campaigns' AND column_name = 'status'
    ) THEN
        UPDATE campaigns SET status = 'active' WHERE status = 'scheduled';
    END IF;
END $$;`,
  `ALTER TABLE wilayas ADD COLUMN IF NOT EXISTS code VARCHAR(10);`,
  `ALTER TABLE wilayas ADD COLUMN IF NOT EXISTS name_fr VARCHAR(100);`,
  `ALTER TABLE wilayas ADD COLUMN IF NOT EXISTS name_ar VARCHAR(100);`,
  `ALTER TABLE wilayas ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 7);`,
  `ALTER TABLE wilayas ADD COLUMN IF NOT EXISTS longitude DECIMAL(10, 7);`,
  `ALTER TABLE dairas ADD COLUMN IF NOT EXISTS code VARCHAR(10);`,
  `ALTER TABLE dairas ADD COLUMN IF NOT EXISTS name_fr VARCHAR(100);`,
  `ALTER TABLE dairas ADD COLUMN IF NOT EXISTS name_ar VARCHAR(100);`,
  `ALTER TABLE dairas ADD COLUMN IF NOT EXISTS wilaya_code VARCHAR(10);`,
  `ALTER TABLE communes ADD COLUMN IF NOT EXISTS code VARCHAR(10);`,
  `ALTER TABLE communes ADD COLUMN IF NOT EXISTS name_fr VARCHAR(100);`,
  `ALTER TABLE communes ADD COLUMN IF NOT EXISTS name_ar VARCHAR(100);`,
  `ALTER TABLE communes ADD COLUMN IF NOT EXISTS daira_code VARCHAR(10);`,
  `ALTER TABLE communes ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 7);`,
  `ALTER TABLE communes ADD COLUMN IF NOT EXISTS longitude DECIMAL(10, 7);`,
  `ALTER TABLE osm_health_facilities ADD COLUMN IF NOT EXISTS osm_id BIGINT;`,
  `ALTER TABLE osm_health_facilities ADD COLUMN IF NOT EXISTS category VARCHAR(20);`,
  `ALTER TABLE osm_health_facilities ADD COLUMN IF NOT EXISTS name VARCHAR(255);`,
  `ALTER TABLE osm_health_facilities ADD COLUMN IF NOT EXISTS name_ar VARCHAR(255);`,
  `ALTER TABLE osm_health_facilities ADD COLUMN IF NOT EXISTS addr_city VARCHAR(255);`,
  `ALTER TABLE osm_health_facilities ADD COLUMN IF NOT EXISTS wilaya_id INTEGER;`,
  `ALTER TABLE osm_health_facilities ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 7);`,
  `ALTER TABLE osm_health_facilities ADD COLUMN IF NOT EXISTS longitude DECIMAL(10, 7);`,
  `ALTER TABLE osm_health_facilities ADD COLUMN IF NOT EXISTS specialty VARCHAR(255);`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255);`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255);`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(50);`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR(50);`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS roles TEXT[] DEFAULT ARRAY['donor']::TEXT[];`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(255);`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_expires TIMESTAMP;`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_otp_code VARCHAR(10);`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_otp_expires TIMESTAMP;`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS account_status VARCHAR(30) DEFAULT 'pending_verification';`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();`,
  `ALTER TABLE donors ADD COLUMN IF NOT EXISTS user_id UUID;`,
  `ALTER TABLE donors ADD COLUMN IF NOT EXISTS blood_type VARCHAR(5);`,
  `ALTER TABLE donors ADD COLUMN IF NOT EXISTS donation_types TEXT[];`,
  `ALTER TABLE donors ADD COLUMN IF NOT EXISTS wilaya_id INTEGER;`,
  `ALTER TABLE donors ADD COLUMN IF NOT EXISTS daira_id INTEGER;`,
  `ALTER TABLE donors ADD COLUMN IF NOT EXISTS commune_id INTEGER;`,
  `ALTER TABLE donors ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 7);`,
  `ALTER TABLE donors ADD COLUMN IF NOT EXISTS longitude DECIMAL(10, 7);`,
  `ALTER TABLE donors ADD COLUMN IF NOT EXISTS availability_status VARCHAR(10) DEFAULT 'green';`,
  `ALTER TABLE donors ADD COLUMN IF NOT EXISTS last_donation_date DATE;`,
  `ALTER TABLE donors ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;`,
  `ALTER TABLE donors ADD COLUMN IF NOT EXISTS certified BOOLEAN DEFAULT false;`,
  `ALTER TABLE donors ADD COLUMN IF NOT EXISTS has_donated_before BOOLEAN DEFAULT false;`,
  `ALTER TABLE donors ADD COLUMN IF NOT EXISTS donation_count INTEGER DEFAULT 0;`,
  `ALTER TABLE donors ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();`,
  `ALTER TABLE donors ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();`,
  `ALTER TABLE recipients ADD COLUMN IF NOT EXISTS user_id UUID;`,
  `ALTER TABLE recipients ADD COLUMN IF NOT EXISTS wilaya_id INTEGER;`,
  `ALTER TABLE recipients ADD COLUMN IF NOT EXISTS commune_id INTEGER;`,
  `ALTER TABLE recipients ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();`,
  `ALTER TABLE donation_requests ADD COLUMN IF NOT EXISTS requester_id UUID;`,
  `ALTER TABLE donation_requests ADD COLUMN IF NOT EXISTS blood_type VARCHAR(5);`,
  `ALTER TABLE donation_requests ADD COLUMN IF NOT EXISTS donation_type VARCHAR(20);`,
  `ALTER TABLE donation_requests ADD COLUMN IF NOT EXISTS wilaya_id INTEGER;`,
  `ALTER TABLE donation_requests ADD COLUMN IF NOT EXISTS commune_id INTEGER;`,
  `ALTER TABLE donation_requests ADD COLUMN IF NOT EXISTS hospital_name VARCHAR(255);`,
  `ALTER TABLE donation_requests ADD COLUMN IF NOT EXISTS service VARCHAR(100);`,
  `ALTER TABLE donation_requests ADD COLUMN IF NOT EXISTS urgency_level VARCHAR(20) DEFAULT 'normal';`,
  `ALTER TABLE donation_requests ADD COLUMN IF NOT EXISTS needed_date DATE;`,
  `ALTER TABLE donation_requests ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(20);`,
  `ALTER TABLE donation_requests ADD COLUMN IF NOT EXISTS additional_info TEXT;`,
  `ALTER TABLE donation_requests ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';`,
  `ALTER TABLE donation_requests ADD COLUMN IF NOT EXISTS donor_id UUID;`,
  `ALTER TABLE donation_requests ADD COLUMN IF NOT EXISTS donated_at TIMESTAMP;`,
  `ALTER TABLE donation_requests ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP;`,
  `ALTER TABLE donation_requests ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;`,
  `ALTER TABLE donation_requests ADD COLUMN IF NOT EXISTS verified_by UUID;`,
  `ALTER TABLE donation_requests ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();`,
  `ALTER TABLE donation_requests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();`,
  `ALTER TABLE matches ADD COLUMN IF NOT EXISTS request_id UUID;`,
  `ALTER TABLE matches ADD COLUMN IF NOT EXISTS donor_id UUID;`,
  `ALTER TABLE matches ADD COLUMN IF NOT EXISTS score DECIMAL(5, 2);`,
  `ALTER TABLE matches ADD COLUMN IF NOT EXISTS distance_km DECIMAL(10, 2);`,
  `ALTER TABLE matches ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';`,
  `ALTER TABLE matches ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();`,
  `ALTER TABLE conversations ADD COLUMN IF NOT EXISTS match_id UUID;`,
  `ALTER TABLE conversations ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();`,
  `ALTER TABLE conversations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();`,
  `ALTER TABLE messages ADD COLUMN IF NOT EXISTS conversation_id UUID;`,
  `ALTER TABLE messages ADD COLUMN IF NOT EXISTS sender_id UUID;`,
  `ALTER TABLE messages ADD COLUMN IF NOT EXISTS content TEXT;`,
  `ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;`,
  `ALTER TABLE messages ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();`,
  `ALTER TABLE notifications ADD COLUMN IF NOT EXISTS user_id UUID;`,
  `ALTER TABLE notifications ADD COLUMN IF NOT EXISTS sender_id UUID;`,
  `ALTER TABLE notifications ADD COLUMN IF NOT EXISTS title VARCHAR(255);`,
  `ALTER TABLE notifications ADD COLUMN IF NOT EXISTS body TEXT;`,
  `ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type VARCHAR(50);`,
  `ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;`,
  `ALTER TABLE notifications ADD COLUMN IF NOT EXISTS data JSONB;`,
  `ALTER TABLE notifications ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();`,
  `ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS name_fr VARCHAR(255);`,
  `ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS name_ar VARCHAR(255);`,
  `ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS type VARCHAR(50);`,
  `ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS wilaya_id INTEGER;`,
  `ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS daira_id INTEGER;`,
  `ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS commune_id INTEGER;`,
  `ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS address TEXT;`,
  `ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 7);`,
  `ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS longitude DECIMAL(10, 7);`,
  `ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS phone VARCHAR(20);`,
  `ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS phone_emergency VARCHAR(20);`,
  `ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS email VARCHAR(255);`,
  `ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS website VARCHAR(255);`,
  `ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS opening_hours TEXT;`,
  `ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS services TEXT[];`,
  `ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS blood_services BOOLEAN DEFAULT false;`,
  `ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS source VARCHAR(255);`,
  `ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS source_url TEXT;`,
  `ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;`,
  `ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP;`,
  `ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();`,
  `ALTER TABLE clinics ADD COLUMN IF NOT EXISTS name_fr VARCHAR(255);`,
  `ALTER TABLE clinics ADD COLUMN IF NOT EXISTS name_ar VARCHAR(255);`,
  `ALTER TABLE clinics ADD COLUMN IF NOT EXISTS wilaya_id INTEGER;`,
  `ALTER TABLE clinics ADD COLUMN IF NOT EXISTS daira_id INTEGER;`,
  `ALTER TABLE clinics ADD COLUMN IF NOT EXISTS commune_id INTEGER;`,
  `ALTER TABLE clinics ADD COLUMN IF NOT EXISTS address TEXT;`,
  `ALTER TABLE clinics ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 7);`,
  `ALTER TABLE clinics ADD COLUMN IF NOT EXISTS longitude DECIMAL(10, 7);`,
  `ALTER TABLE clinics ADD COLUMN IF NOT EXISTS phone VARCHAR(20);`,
  `ALTER TABLE clinics ADD COLUMN IF NOT EXISTS services TEXT[];`,
  `ALTER TABLE clinics ADD COLUMN IF NOT EXISTS source VARCHAR(255);`,
  `ALTER TABLE clinics ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;`,
  `ALTER TABLE clinics ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();`,
  `ALTER TABLE transfusion_centers ADD COLUMN IF NOT EXISTS name_fr VARCHAR(255);`,
  `ALTER TABLE transfusion_centers ADD COLUMN IF NOT EXISTS name_ar VARCHAR(255);`,
  `ALTER TABLE transfusion_centers ADD COLUMN IF NOT EXISTS wilaya_id INTEGER;`,
  `ALTER TABLE transfusion_centers ADD COLUMN IF NOT EXISTS daira_id INTEGER;`,
  `ALTER TABLE transfusion_centers ADD COLUMN IF NOT EXISTS commune_id INTEGER;`,
  `ALTER TABLE transfusion_centers ADD COLUMN IF NOT EXISTS address TEXT;`,
  `ALTER TABLE transfusion_centers ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 7);`,
  `ALTER TABLE transfusion_centers ADD COLUMN IF NOT EXISTS longitude DECIMAL(10, 7);`,
  `ALTER TABLE transfusion_centers ADD COLUMN IF NOT EXISTS phone VARCHAR(20);`,
  `ALTER TABLE transfusion_centers ADD COLUMN IF NOT EXISTS opening_hours TEXT;`,
  `ALTER TABLE transfusion_centers ADD COLUMN IF NOT EXISTS accepted_donation_types TEXT[];`,
  `ALTER TABLE transfusion_centers ADD COLUMN IF NOT EXISTS source VARCHAR(255);`,
  `ALTER TABLE transfusion_centers ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;`,
  `ALTER TABLE transfusion_centers ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();`,
  `ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS name_fr VARCHAR(255);`,
  `ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS name_ar VARCHAR(255);`,
  `ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS wilaya_id INTEGER;`,
  `ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS commune_id INTEGER;`,
  `ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS address TEXT;`,
  `ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 7);`,
  `ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS longitude DECIMAL(10, 7);`,
  `ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS phone VARCHAR(20);`,
  `ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS opening_hours TEXT;`,
  `ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS is_on_duty BOOLEAN DEFAULT false;`,
  `ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();`,
  `ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS name VARCHAR(255);`,
  `ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS organizer_id UUID;`,
  `ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS organizer_type VARCHAR(50);`,
  `ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS start_date TIMESTAMP;`,
  `ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS end_date TIMESTAMP;`,
  `ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS hours_label VARCHAR(100);`,
  `ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS wilaya_id INTEGER;`,
  `ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS commune_id INTEGER;`,
  `ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS location TEXT;`,
  `ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 7);`,
  `ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS longitude DECIMAL(10, 7);`,
  `ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS donation_types TEXT[];`,
  `ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS blood_types_needed TEXT[];`,
  `ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS description TEXT;`,
  `ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS practical_info TEXT;`,
  `ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS image_url TEXT;`,
  `ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(20);`,
  `ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS contact_name VARCHAR(100);`,
  `ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS action_label VARCHAR(50) DEFAULT 'Prendre rendez-vous';`,
  `ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;`,
  `ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'draft';`,
  `ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS published_at TIMESTAMP;`,
  `ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();`,
  `ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();`,
  `ALTER TABLE badge_tiers ADD COLUMN IF NOT EXISTS name VARCHAR(50);`,
  `ALTER TABLE badge_tiers ADD COLUMN IF NOT EXISTS threshold INTEGER;`,
  `ALTER TABLE badge_tiers ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;`,
  `ALTER TABLE badge_tiers ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();`,
  `ALTER TABLE associations ADD COLUMN IF NOT EXISTS name VARCHAR(255);`,
  `ALTER TABLE associations ADD COLUMN IF NOT EXISTS name_ar VARCHAR(255);`,
  `ALTER TABLE associations ADD COLUMN IF NOT EXISTS admin_user_id UUID;`,
  `ALTER TABLE associations ADD COLUMN IF NOT EXISTS wilaya_id INTEGER;`,
  `ALTER TABLE associations ADD COLUMN IF NOT EXISTS address TEXT;`,
  `ALTER TABLE associations ADD COLUMN IF NOT EXISTS phone VARCHAR(20);`,
  `ALTER TABLE associations ADD COLUMN IF NOT EXISTS email VARCHAR(255);`,
  `ALTER TABLE associations ADD COLUMN IF NOT EXISTS description TEXT;`,
  `ALTER TABLE associations ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;`,
  `ALTER TABLE associations ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();`,
  `ALTER TABLE reports ADD COLUMN IF NOT EXISTS reporter_id UUID;`,
  `ALTER TABLE reports ADD COLUMN IF NOT EXISTS reported_user_id UUID;`,
  `ALTER TABLE reports ADD COLUMN IF NOT EXISTS reason TEXT;`,
  `ALTER TABLE reports ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';`,
  `ALTER TABLE reports ADD COLUMN IF NOT EXISTS reviewed_by UUID;`,
  `ALTER TABLE reports ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();`,
  `ALTER TABLE blocks ADD COLUMN IF NOT EXISTS blocker_id UUID;`,
  `ALTER TABLE blocks ADD COLUMN IF NOT EXISTS blocked_user_id UUID;`,
  `ALTER TABLE blocks ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();`,
  `ALTER TABLE verifications ADD COLUMN IF NOT EXISTS user_id UUID;`,
  `ALTER TABLE verifications ADD COLUMN IF NOT EXISTS document_type VARCHAR(50);`,
  `ALTER TABLE verifications ADD COLUMN IF NOT EXISTS document_url TEXT;`,
  `ALTER TABLE verifications ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';`,
  `ALTER TABLE verifications ADD COLUMN IF NOT EXISTS reviewed_by UUID;`,
  `ALTER TABLE verifications ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP;`,
  `ALTER TABLE verifications ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();`,
  `ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_id UUID;`,
  `ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS action VARCHAR(100);`,
  `ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS entity_type VARCHAR(50);`,
  `ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS entity_id UUID;`,
  `ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS details JSONB;`,
  `ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45);`,
  `ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();`,
  `ALTER TABLE consents ADD COLUMN IF NOT EXISTS user_id UUID;`,
  `ALTER TABLE consents ADD COLUMN IF NOT EXISTS consent_type VARCHAR(50);`,
  `ALTER TABLE consents ADD COLUMN IF NOT EXISTS granted BOOLEAN DEFAULT true;`,
  `ALTER TABLE consents ADD COLUMN IF NOT EXISTS granted_at TIMESTAMP DEFAULT NOW();`,
  `ALTER TABLE consents ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMP;`,
  `ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS value TEXT;`,
  `ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS description TEXT;`,
  `ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();`,
  `CREATE UNIQUE INDEX IF NOT EXISTS ux_notifications_active_request ON notifications (sender_id, user_id) WHERE type = 'request' AND (data->>'accepted') IS NULL AND sender_id IS NOT NULL;`,
  `INSERT INTO badge_tiers (name, threshold, display_order) VALUES
  ('Premier don', 1, 1),
  ('Donneur engage', 3, 2),
  ('Donneur regulier', 5, 3),
  ('Donneur exemplaire', 10, 4),
  ('Ambassadeur', 20, 5)
ON CONFLICT (threshold) DO NOTHING;`,
];

const EXPECTED_COLUMNS: Record<string, string[]> = {
  "wilayas": [
    "id",
    "code",
    "name_fr",
    "name_ar",
    "latitude",
    "longitude"
  ],
  "dairas": [
    "id",
    "code",
    "name_fr",
    "name_ar",
    "wilaya_code"
  ],
  "communes": [
    "id",
    "code",
    "name_fr",
    "name_ar",
    "daira_code",
    "latitude",
    "longitude"
  ],
  "osm_health_facilities": [
    "id",
    "osm_id",
    "category",
    "name",
    "name_ar",
    "addr_city",
    "wilaya_id",
    "latitude",
    "longitude",
    "specialty"
  ],
  "users": [
    "id",
    "email",
    "password",
    "first_name",
    "last_name",
    "phone",
    "roles",
    "is_active",
    "is_verified",
    "email_verified",
    "email_verification_token",
    "email_verification_expires",
    "phone_verified",
    "phone_otp_code",
    "phone_otp_expires",
    "account_status",
    "created_at",
    "updated_at"
  ],
  "donors": [
    "id",
    "user_id",
    "blood_type",
    "donation_types",
    "wilaya_id",
    "daira_id",
    "commune_id",
    "latitude",
    "longitude",
    "availability_status",
    "last_donation_date",
    "is_verified",
    "certified",
    "has_donated_before",
    "donation_count",
    "created_at",
    "updated_at"
  ],
  "recipients": [
    "id",
    "user_id",
    "wilaya_id",
    "commune_id",
    "created_at"
  ],
  "donation_requests": [
    "id",
    "requester_id",
    "blood_type",
    "donation_type",
    "wilaya_id",
    "commune_id",
    "hospital_name",
    "service",
    "urgency_level",
    "needed_date",
    "contact_phone",
    "additional_info",
    "status",
    "donor_id",
    "donated_at",
    "confirmed_at",
    "is_verified",
    "verified_by",
    "created_at",
    "updated_at"
  ],
  "matches": [
    "id",
    "request_id",
    "donor_id",
    "score",
    "distance_km",
    "status",
    "created_at"
  ],
  "conversations": [
    "id",
    "match_id",
    "created_at",
    "updated_at"
  ],
  "messages": [
    "id",
    "conversation_id",
    "sender_id",
    "content",
    "is_read",
    "created_at"
  ],
  "notifications": [
    "id",
    "user_id",
    "sender_id",
    "title",
    "body",
    "type",
    "is_read",
    "data",
    "created_at"
  ],
  "hospitals": [
    "id",
    "name_fr",
    "name_ar",
    "type",
    "wilaya_id",
    "daira_id",
    "commune_id",
    "address",
    "latitude",
    "longitude",
    "phone",
    "phone_emergency",
    "email",
    "website",
    "opening_hours",
    "services",
    "blood_services",
    "source",
    "source_url",
    "verified",
    "verified_at",
    "created_at"
  ],
  "clinics": [
    "id",
    "name_fr",
    "name_ar",
    "wilaya_id",
    "daira_id",
    "commune_id",
    "address",
    "latitude",
    "longitude",
    "phone",
    "services",
    "source",
    "verified",
    "created_at"
  ],
  "transfusion_centers": [
    "id",
    "name_fr",
    "name_ar",
    "wilaya_id",
    "daira_id",
    "commune_id",
    "address",
    "latitude",
    "longitude",
    "phone",
    "opening_hours",
    "accepted_donation_types",
    "source",
    "verified",
    "created_at"
  ],
  "pharmacies": [
    "id",
    "name_fr",
    "name_ar",
    "wilaya_id",
    "commune_id",
    "address",
    "latitude",
    "longitude",
    "phone",
    "opening_hours",
    "is_on_duty",
    "created_at"
  ],
  "campaigns": [
    "id",
    "name",
    "organizer_id",
    "organizer_type",
    "start_date",
    "end_date",
    "hours_label",
    "wilaya_id",
    "commune_id",
    "location",
    "latitude",
    "longitude",
    "donation_types",
    "blood_types_needed",
    "description",
    "practical_info",
    "image_url",
    "contact_phone",
    "contact_name",
    "action_label",
    "display_order",
    "status",
    "published_at",
    "created_at",
    "updated_at"
  ],
  "badge_tiers": [
    "id",
    "name",
    "threshold",
    "display_order",
    "created_at"
  ],
  "associations": [
    "id",
    "name",
    "name_ar",
    "admin_user_id",
    "wilaya_id",
    "address",
    "phone",
    "email",
    "description",
    "is_verified",
    "created_at"
  ],
  "reports": [
    "id",
    "reporter_id",
    "reported_user_id",
    "reason",
    "status",
    "reviewed_by",
    "created_at"
  ],
  "blocks": [
    "id",
    "blocker_id",
    "blocked_user_id",
    "created_at"
  ],
  "verifications": [
    "id",
    "user_id",
    "document_type",
    "document_url",
    "status",
    "reviewed_by",
    "reviewed_at",
    "created_at"
  ],
  "audit_logs": [
    "id",
    "user_id",
    "action",
    "entity_type",
    "entity_id",
    "details",
    "ip_address",
    "created_at"
  ],
  "consents": [
    "id",
    "user_id",
    "consent_type",
    "granted",
    "granted_at",
    "revoked_at"
  ],
  "app_settings": [
    "key",
    "value",
    "description",
    "updated_at"
  ]
};

async function migrate() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.log('DATABASE_URL absente : migration ignoree.');
    return;
  }

  const client = new Client({
    connectionString: databaseUrl,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    await client.connect();
  } catch (error) {
    console.error('Impossible de se connecter a la base pour la migration :', error.message);
    return;
  }

  let okCount = 0;
  let failCount = 0;
  for (const statement of MIGRATION_STATEMENTS) {
    try {
      await client.query(statement);
      okCount++;
    } catch (error) {
      failCount++;
      console.error(`Migration - instruction ignoree (${error.message}) : ${statement.slice(0, 80).replace(/\n/g, ' ')}...`);
    }
  }
  console.log(`Migration de schema terminee : ${okCount} instruction(s) appliquee(s), ${failCount} ignoree(s).`);

  let neutralized = 0;
  for (const table of Object.keys(EXPECTED_COLUMNS)) {
    try {
      const result = await client.query(
        `SELECT column_name FROM information_schema.columns
         WHERE table_name = $1 AND is_nullable = 'NO' AND column_default IS NULL`,
        [table],
      );
      const expected = new Set(EXPECTED_COLUMNS[table]);
      for (const row of result.rows) {
        const col = row.column_name;
        if (col === 'id' || col === 'key' || expected.has(col)) continue;
        try {
          await client.query(`ALTER TABLE ${table} ALTER COLUMN "${col}" DROP NOT NULL`);
          console.log(`Migration - colonne heritee neutralisee : ${table}."${col}" (n'appartient pas au schema actuel).`);
          neutralized++;
        } catch (err) {
          console.error(`Migration - impossible de neutraliser ${table}."${col}" : ${err.message}`);
        }
      }
    } catch (err) {
      console.error(`Migration - impossible d'inspecter la table ${table} : ${err.message}`);
    }
  }
  console.log(`Migration - ${neutralized} colonne(s) heritee(s) neutralisee(s).`);

  await client.end();
}

migrate();
