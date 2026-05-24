-- ============================================================
-- PRODE MUNDIAL 2026 — Schema Supabase
-- Ejecutar en el SQL Editor de tu proyecto Supabase
-- ============================================================

-- ── EXTENSIONES ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── TABLA: perfiles de usuario ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.perfiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre        TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  is_admin      BOOLEAN DEFAULT FALSE,
  pago          BOOLEAN DEFAULT FALSE,
  monto_pagado  NUMERIC(10,2) DEFAULT 0,
  fecha_pago    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── TABLA: partidos ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.partidos (
  id                    SERIAL PRIMARY KEY,
  match_number          INT NOT NULL,
  fase                  TEXT NOT NULL CHECK (fase IN ('grupos','32avos','16avos','cuartos','semis','3er_4to','final')),
  grupo                 TEXT,   -- 'A'..'L', NULL para eliminatorias
  equipo_local          TEXT NOT NULL,
  equipo_visitante      TEXT NOT NULL,
  estadio               TEXT,
  ciudad                TEXT,
  kickoff_utc           TIMESTAMPTZ NOT NULL,
  -- Para grupos: se bloquea 5 min antes de cada partido
  -- Para eliminatorias: se bloquea cuando el admin activa la fase
  bloqueo_manual        TIMESTAMPTZ,  -- NULL = bloqueo automático (kickoff - 5min)
  goles_local           INT,   -- NULL hasta que se cargue el resultado
  goles_visitante       INT,
  resultado_cargado     BOOLEAN DEFAULT FALSE,
  ranking_fifa_local    INT NOT NULL DEFAULT 1000,
  ranking_fifa_visitante INT NOT NULL DEFAULT 1000,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ── TABLA: pronósticos de partidos ───────────────────────────
CREATE TABLE IF NOT EXISTS public.pronosticos (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
  partido_id    INT NOT NULL REFERENCES public.partidos(id) ON DELETE CASCADE,
  goles_local   INT NOT NULL CHECK (goles_local >= 0 AND goles_local <= 20),
  goles_visitante INT NOT NULL CHECK (goles_visitante >= 0 AND goles_visitante <= 20),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, partido_id)
);

-- ── TABLA: pronóstico campeón ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pronostico_campeon (
  user_id   UUID PRIMARY KEY REFERENCES public.perfiles(id) ON DELETE CASCADE,
  equipo    TEXT NOT NULL,
  bloqueado BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── TABLA: pronóstico goleador del torneo ────────────────────
CREATE TABLE IF NOT EXISTS public.pronostico_goleador (
  user_id   UUID PRIMARY KEY REFERENCES public.perfiles(id) ON DELETE CASCADE,
  jugador   TEXT NOT NULL,
  bloqueado BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── TABLA: resultados globales (goleador real, campeón real) ─
CREATE TABLE IF NOT EXISTS public.torneo_resultado (
  id              SERIAL PRIMARY KEY,
  campeon_real    TEXT,
  goleador_real   TEXT,
  goleador_definido BOOLEAN DEFAULT FALSE,
  campeon_definido  BOOLEAN DEFAULT FALSE,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Inicializar con 1 fila
INSERT INTO public.torneo_resultado (id) VALUES (1) ON CONFLICT DO NOTHING;

-- ── TABLA: pozo / caja del prode ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.pozo_config (
  id              SERIAL PRIMARY KEY,
  monto_inscripcion NUMERIC(10,2) DEFAULT 5000,  -- en pesos ARS
  total_recaudado NUMERIC(10,2) GENERATED ALWAYS AS (0) STORED, -- computed via trigger
  premio_1        TEXT DEFAULT '70%',
  premio_2        TEXT DEFAULT '30% - inscripción',
  premio_3        TEXT DEFAULT 'Devolución inscripción',
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO public.pozo_config (id) VALUES (1) ON CONFLICT DO NOTHING;

-- ── FUNCIÓN: actualizar updated_at automáticamente ───────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_pronosticos_updated_at
  BEFORE UPDATE ON public.pronosticos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── FUNCIÓN: crear perfil automáticamente al registrarse ─────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.perfiles (id, nombre, email, is_admin)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.email = current_setting('app.admin_email', TRUE)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── FUNCIÓN: verificar si un partido está bloqueado ──────────
CREATE OR REPLACE FUNCTION public.partido_bloqueado(p_id INT)
RETURNS BOOLEAN AS $$
DECLARE
  p RECORD;
BEGIN
  SELECT fase, kickoff_utc, bloqueo_manual INTO p
  FROM public.partidos WHERE id = p_id;

  IF p.bloqueo_manual IS NOT NULL THEN
    RETURN NOW() >= p.bloqueo_manual;
  END IF;

  -- Grupos: bloqueo automático 5 minutos antes del partido
  IF p.fase = 'grupos' THEN
    RETURN NOW() >= (p.kickoff_utc - INTERVAL '5 minutes');
  END IF;

  -- Eliminatorias: bloqueado si hay bloqueo_manual seteado
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql STABLE;

-- ── RLS: Row Level Security ──────────────────────────────────
ALTER TABLE public.perfiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partidos          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pronosticos       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pronostico_campeon ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pronostico_goleador ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.torneo_resultado  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pozo_config       ENABLE ROW LEVEL SECURITY;

-- perfiles: cada uno ve todos pero solo edita el propio
CREATE POLICY "perfiles_select_all"   ON public.perfiles FOR SELECT USING (TRUE);
CREATE POLICY "perfiles_update_own"   ON public.perfiles FOR UPDATE USING (auth.uid() = id);

-- partidos: todos pueden ver
CREATE POLICY "partidos_select_all"   ON public.partidos FOR SELECT USING (TRUE);
-- solo admin puede insertar/modificar
CREATE POLICY "partidos_admin_write"  ON public.partidos FOR ALL
  USING (EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND is_admin = TRUE));

-- pronosticos: cada uno ve TODOS los pronosticos (para comparar post-partido)
-- pero solo puede escribir los suyos Y solo si el partido no está bloqueado
CREATE POLICY "pronosticos_select_all" ON public.pronosticos FOR SELECT USING (TRUE);
CREATE POLICY "pronosticos_insert_own" ON public.pronosticos FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND NOT public.partido_bloqueado(partido_id)
  );
CREATE POLICY "pronosticos_update_own" ON public.pronosticos FOR UPDATE
  USING (
    auth.uid() = user_id
    AND NOT public.partido_bloqueado(partido_id)
  );

-- campeon y goleador: ver todos, editar propio (si no está bloqueado)
CREATE POLICY "campeon_select_all"   ON public.pronostico_campeon FOR SELECT USING (TRUE);
CREATE POLICY "campeon_insert_own"   ON public.pronostico_campeon FOR INSERT
  WITH CHECK (auth.uid() = user_id AND NOT (SELECT campeon_definido FROM public.torneo_resultado WHERE id = 1));
CREATE POLICY "campeon_update_own"   ON public.pronostico_campeon FOR UPDATE
  USING (auth.uid() = user_id AND NOT bloqueado);

CREATE POLICY "goleador_select_all"  ON public.pronostico_goleador FOR SELECT USING (TRUE);
CREATE POLICY "goleador_insert_own"  ON public.pronostico_goleador FOR INSERT
  WITH CHECK (auth.uid() = user_id AND NOT (SELECT goleador_definido FROM public.torneo_resultado WHERE id = 1));
CREATE POLICY "goleador_update_own"  ON public.pronostico_goleador FOR UPDATE
  USING (auth.uid() = user_id AND NOT bloqueado);

-- torneo resultado y pozo: todos pueden ver, solo admin escribe
CREATE POLICY "torneo_select_all"    ON public.torneo_resultado FOR SELECT USING (TRUE);
CREATE POLICY "torneo_admin_write"   ON public.torneo_resultado FOR ALL
  USING (EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND is_admin = TRUE));

CREATE POLICY "pozo_select_all"      ON public.pozo_config FOR SELECT USING (TRUE);
CREATE POLICY "pozo_admin_write"     ON public.pozo_config FOR ALL
  USING (EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND is_admin = TRUE));

-- ── ÍNDICES para performance ──────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_pronosticos_user_id   ON public.pronosticos(user_id);
CREATE INDEX IF NOT EXISTS idx_pronosticos_partido_id ON public.pronosticos(partido_id);
CREATE INDEX IF NOT EXISTS idx_partidos_fase         ON public.partidos(fase);
CREATE INDEX IF NOT EXISTS idx_partidos_kickoff      ON public.partidos(kickoff_utc);
