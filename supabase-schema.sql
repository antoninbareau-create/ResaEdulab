-- ============================================================
-- Edulab Equipment Reservation System — Database Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- Tables
-- ============================================================

CREATE TABLE equipment (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom           TEXT NOT NULL UNIQUE,
  equipement    TEXT NOT NULL,
  marque        TEXT,
  modele        TEXT,
  serial_number TEXT,
  purchase_date DATE,
  status        TEXT NOT NULL DEFAULT 'available'
                CHECK (status IN ('available', 'unavailable', 'maintenance')),
  image_url     TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT NOT NULL,
  full_name  TEXT,
  role       TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE reservations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  start_date TIMESTAMPTZ NOT NULL,
  end_date   TIMESTAMPTZ NOT NULL,
  status     TEXT NOT NULL DEFAULT 'active'
             CHECK (status IN ('active', 'returned', 'cancelled')),
  notes      TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE reservation_items (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE,
  equipment_id   UUID REFERENCES equipment(id),
  returned_at    TIMESTAMPTZ
);

-- ============================================================
-- Trigger: auto-create profile on signup
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_items ENABLE ROW LEVEL SECURITY;

-- Equipment: read by all authenticated, write by admin only
CREATE POLICY "Equipment readable by authenticated" ON equipment
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Equipment writable by admin" ON equipment
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Profiles: users see own row, admin sees all
CREATE POLICY "Users see own profile" ON profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users update own profile" ON profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid());

-- Reservations: users see own, admin sees all; users can insert own
CREATE POLICY "Users see own reservations" ON reservations
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users insert own reservations" ON reservations
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own reservations" ON reservations
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Reservation items: follow parent reservation permissions
CREATE POLICY "Reservation items follow reservation policy" ON reservation_items
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM reservations r
      WHERE r.id = reservation_id
        AND (r.user_id = auth.uid() OR
          EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
    )
  );

CREATE POLICY "Users insert reservation items" ON reservation_items
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM reservations r
      WHERE r.id = reservation_id AND r.user_id = auth.uid()
    )
  );
