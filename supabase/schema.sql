-- =========================================================================
-- ESQUEMA DE BASE DE DATOS SUPABASE: SISTEMA VETERINARIO CALIFORNIA (TIJUANA)
-- =========================================================================

-- 1. Tabla: Clientes / Dueños de Mascotas
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT,
  email TEXT,
  is_frequent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 2. Tabla: Mascotas y Pacientes
CREATE TABLE IF NOT EXISTS pets (
  id TEXT PRIMARY KEY,
  client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  species TEXT DEFAULT 'Canino',
  breed TEXT,
  gender TEXT,
  color TEXT,
  birth_date TEXT,
  weight TEXT,
  distinctive_marks TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 3. Tabla: Agenda y Citas Médicas (Máximo 2 citas por hora)
CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  pet_name TEXT NOT NULL,
  pet_id TEXT REFERENCES pets(id) ON DELETE SET NULL,
  phone TEXT NOT NULL,
  service TEXT NOT NULL,
  status TEXT DEFAULT 'Confirmada',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 4. Tabla: Jaulas de Hospitalización y Limpieza
CREATE TABLE IF NOT EXISTS cages (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  size TEXT NOT NULL,
  is_occupied BOOLEAN DEFAULT false,
  needs_cleaning BOOLEAN DEFAULT false,
  patient_type TEXT,
  patient_id TEXT,
  patient_name TEXT,
  reason TEXT,
  entry_date TEXT,
  discharge_date TEXT,
  vet_in_charge TEXT,
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 5. Tabla: Rescates Callejeros y Bitácora de Intervenciones
CREATE TABLE IF NOT EXISTS rescues (
  id TEXT PRIMARY KEY,
  rescue_code TEXT NOT NULL UNIQUE,
  rescue_date TEXT NOT NULL,
  location_found TEXT NOT NULL,
  physical_description TEXT NOT NULL,
  approx_age TEXT,
  gender TEXT,
  initial_condition TEXT,
  status TEXT DEFAULT 'En Tratamiento',
  interventions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 6. Tabla: Cirugías y Protocolos de Quirófano
CREATE TABLE IF NOT EXISTS surgeries (
  id TEXT PRIMARY KEY,
  pet_id TEXT,
  pet_name TEXT NOT NULL,
  client_id TEXT,
  owner_name TEXT NOT NULL,
  owner_phone TEXT,
  surgery_type TEXT NOT NULL,
  date TEXT NOT NULL,
  surgeon TEXT NOT NULL,
  anesthesia_protocol TEXT,
  pre_op_notes TEXT,
  procedure_description TEXT,
  post_op_care TEXT,
  status TEXT DEFAULT 'Programada',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 7. Tabla: Cartillas de Vacunación y Pasaporte Binacional
CREATE TABLE IF NOT EXISTS vaccinations (
  id TEXT PRIMARY KEY,
  pet_id TEXT NOT NULL,
  pet_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  vaccine_name TEXT NOT NULL,
  manufacturer TEXT,
  lot_number TEXT,
  applied_date TEXT NOT NULL,
  due_date TEXT,
  vet_name TEXT,
  license_number TEXT,
  notes TEXT,
  is_travel_valid BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- =========================================================================
-- HABILITAR ROW LEVEL SECURITY (RLS) Y POLÍTICAS DE ACCESO PÚBLICO (ANON)
-- =========================================================================
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE cages ENABLE ROW LEVEL SECURITY;
ALTER TABLE rescues ENABLE ROW LEVEL SECURITY;
ALTER TABLE surgeries ENABLE ROW LEVEL SECURITY;
ALTER TABLE vaccinations ENABLE ROW LEVEL SECURITY;

-- Políticas para lectura y escritura desde la aplicación web
DROP POLICY IF EXISTS "Public full access clients" ON clients;
CREATE POLICY "Public full access clients" ON clients FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access pets" ON pets;
CREATE POLICY "Public full access pets" ON pets FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access appointments" ON appointments;
CREATE POLICY "Public full access appointments" ON appointments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access cages" ON cages;
CREATE POLICY "Public full access cages" ON cages FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access rescues" ON rescues;
CREATE POLICY "Public full access rescues" ON rescues FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access surgeries" ON surgeries;
CREATE POLICY "Public full access surgeries" ON surgeries FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access vaccinations" ON vaccinations;
CREATE POLICY "Public full access vaccinations" ON vaccinations FOR ALL USING (true) WITH CHECK (true);

-- =========================================================================
-- DATOS INICIALES (SEMILLA) PARA VETERINARIA CALIFORNIA TIJUANA
-- =========================================================================
INSERT INTO clients (id, name, phone, address, email, is_frequent) VALUES
('cli-1', 'Alejandra Morales', '664-555-0192', 'Zona Río, Tijuana, B.C.', 'alejandra.m@gmail.com', true),
('cli-2', 'Roberto Gómez (Rescatista)', '664-777-8899', 'Playas de Tijuana, B.C.', 'roberto.rescates@gmail.com', true),
('cli-3', 'Karla Patricia Mendoza', '664-333-4411', 'Otay Constituyentes, Tijuana, B.C.', 'karla.mendoza@hotmail.com', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO pets (id, client_id, name, species, breed, gender, color, birth_date, weight, distinctive_marks) VALUES
('pet-1', 'cli-1', 'Rocky', 'Canino', 'Golden Retriever', 'Macho', 'Dorado', '2021-04-15', '31.5 kg', 'Cicatriz leve en oreja izquierda'),
('pet-2', 'cli-1', 'Luna', 'Canino', 'Poodle Mini', 'Hembra', 'Blanco', '2023-01-10', '4.2 kg', 'Mancha crema en la espalda'),
('pet-3', 'cli-2', 'Max', 'Canino', 'Mestizo Pastor', 'Macho', 'Negro con fuego', '2020-08-20', '24.0 kg', 'Cola corta de nacimiento'),
('pet-4', 'cli-2', 'Milo', 'Felino', 'Europeo Común', 'Macho', 'Atigrado gris', '2022-11-05', '4.8 kg', 'Ojos verdes intensos'),
('pet-5', 'cli-3', 'Canela', 'Canino', 'Chihuahua', 'Hembra', 'Café claro', '2022-03-12', '2.8 kg', 'Pecho blanco')
ON CONFLICT (id) DO NOTHING;

INSERT INTO cages (id, code, name, size, is_occupied, needs_cleaning, patient_type, patient_id, patient_name, reason, entry_date, discharge_date, vet_in_charge, notes) VALUES
('cage-1', 'J-01', 'Jaula Médica 01', 'Grande', true, false, 'Mascota Registrada', 'pet-1', 'Rocky (Golden Retriever)', 'Recuperación post-cirugía de ligamento', '2026-10-14 08:30', '2026-10-15 18:00', 'Dr. Mario Estrada', 'Mantener en reposo absoluto.'),
('cage-2', 'J-02', 'Jaula Médica 02', 'Grande', false, true, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Paciente dado de alta a las 11:00 am. Requiere desinfección con cuaternarios.'),
('cage-3', 'J-03', 'Jaula Médica 03', 'Mediana', true, false, 'Rescate Callejero', 'resc-1', 'Rescate #R-102 (Mestizo)', 'Estabilización por deshidratación severa y suero IV', '2026-10-13 16:45', '2026-10-16 12:00', 'Dra. Sofía Valenzuela', 'Canalizado con catéter 22G.'),
('cage-4', 'J-04', 'Jaula Médica 04', 'Mediana', false, false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Disponible e higienizada.'),
('cage-5', 'J-05', 'Jaula Aislada Felina', 'Pequeña', true, false, 'Mascota Registrada', 'pet-4', 'Milo (Gato Atigrado)', 'Observación post-sondaje uretral', '2026-10-14 09:15', '2026-10-14 20:00', 'Dr. Mario Estrada', 'Monitorear micción.'),
('cage-6', 'J-06', 'Jaula Aislada Infecciosos', 'Grande', false, false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Limpia con luz UV activa.')
ON CONFLICT (id) DO NOTHING;
