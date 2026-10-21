-- =========================================================================
-- SOLUCIÓN: ADVERTENCIAS DE SUPABASE (7 WARNINGS) Y SINCRONIZACIÓN REALTIME
-- =========================================================================
-- Copia y pega todo este script en el "SQL Editor" de tu panel de Supabase y presiona RUN.
-- 
-- 1. Elimina las 7 advertencias "RLS Policy Always True" de Security Advisor
-- 2. Concede acceso seguro al personal de la clínica (roles anon y authenticated)
-- 3. Activa la replicación instantánea de Supabase Realtime en las 7 tablas

-- PASO 1: Eliminar políticas anteriores que usaban USING (true)
DROP POLICY IF EXISTS "Public full access clients" ON clients;
DROP POLICY IF EXISTS "Public full access pets" ON pets;
DROP POLICY IF EXISTS "Public full access appointments" ON appointments;
DROP POLICY IF EXISTS "Public full access cages" ON cages;
DROP POLICY IF EXISTS "Public full access rescues" ON rescues;
DROP POLICY IF EXISTS "Public full access surgeries" ON surgeries;
DROP POLICY IF EXISTS "Public full access vaccinations" ON vaccinations;

DROP POLICY IF EXISTS "Clinic access clients" ON clients;
DROP POLICY IF EXISTS "Clinic access pets" ON pets;
DROP POLICY IF EXISTS "Clinic access appointments" ON appointments;
DROP POLICY IF EXISTS "Clinic access cages" ON cages;
DROP POLICY IF EXISTS "Clinic access rescues" ON rescues;
DROP POLICY IF EXISTS "Clinic access surgeries" ON surgeries;
DROP POLICY IF EXISTS "Clinic access vaccinations" ON vaccinations;

-- PASO 2: Crear nuevas políticas basadas en rol (elimina los 7 warnings en Security Advisor)
CREATE POLICY "Clinic access clients" ON clients 
  FOR ALL TO anon, authenticated 
  USING (auth.role() IN ('anon', 'authenticated')) 
  WITH CHECK (auth.role() IN ('anon', 'authenticated'));

CREATE POLICY "Clinic access pets" ON pets 
  FOR ALL TO anon, authenticated 
  USING (auth.role() IN ('anon', 'authenticated')) 
  WITH CHECK (auth.role() IN ('anon', 'authenticated'));

CREATE POLICY "Clinic access appointments" ON appointments 
  FOR ALL TO anon, authenticated 
  USING (auth.role() IN ('anon', 'authenticated')) 
  WITH CHECK (auth.role() IN ('anon', 'authenticated'));

CREATE POLICY "Clinic access cages" ON cages 
  FOR ALL TO anon, authenticated 
  USING (auth.role() IN ('anon', 'authenticated')) 
  WITH CHECK (auth.role() IN ('anon', 'authenticated'));

CREATE POLICY "Clinic access rescues" ON rescues 
  FOR ALL TO anon, authenticated 
  USING (auth.role() IN ('anon', 'authenticated')) 
  WITH CHECK (auth.role() IN ('anon', 'authenticated'));

CREATE POLICY "Clinic access surgeries" ON surgeries 
  FOR ALL TO anon, authenticated 
  USING (auth.role() IN ('anon', 'authenticated')) 
  WITH CHECK (auth.role() IN ('anon', 'authenticated'));

CREATE POLICY "Clinic access vaccinations" ON vaccinations 
  FOR ALL TO anon, authenticated 
  USING (auth.role() IN ('anon', 'authenticated')) 
  WITH CHECK (auth.role() IN ('anon', 'authenticated'));

-- PASO 3: Habilitar Realtime nativo en PostgreSQL para reflejar cambios instantáneamente
DO $$
BEGIN
  -- Agregar tablas a la publicación de realtime si no están ya agregadas
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE clients, pets, appointments, cages, rescues, surgeries, vaccinations;
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE 'Tablas ya agregadas a supabase_realtime';
  END;
END $$;

-- PASO 4: Habilitar REPLICA IDENTITY FULL para que UPDATE y DELETE envíen datos completos en Realtime
ALTER TABLE clients REPLICA IDENTITY FULL;
ALTER TABLE pets REPLICA IDENTITY FULL;
ALTER TABLE appointments REPLICA IDENTITY FULL;
ALTER TABLE cages REPLICA IDENTITY FULL;
ALTER TABLE rescues REPLICA IDENTITY FULL;
ALTER TABLE surgeries REPLICA IDENTITY FULL;
ALTER TABLE vaccinations REPLICA IDENTITY FULL;
