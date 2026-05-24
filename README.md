# ⚽ Prode Mundial 2026

App de pronósticos del Mundial FIFA 2026 para grupos de amigos.

**Stack:** Next.js 14 · Supabase · Tailwind CSS · Vercel

---

## 🚀 Deploy en 15 minutos

### 1. Crear proyecto en Supabase

1. Ir a [supabase.com](https://supabase.com) → **New Project**
2. Elegir región más cercana (US East para menor latencia con los servidores)
3. Guardar la contraseña del proyecto

### 2. Configurar la base de datos

En el **SQL Editor** de Supabase, ejecutar **en este orden**:

```sql
-- Primero: schema completo
-- Copiar y pegar contenido de /supabase/schema.sql

-- Segundo: seed con los 104 partidos
-- Copiar y pegar contenido de /supabase/seed-partidos.sql
```

Después, configurar el email del admin (reemplazar con el tuyo):
```sql
ALTER DATABASE postgres SET "app.admin_email" = 'tu@email.com';
```

**Activar confirmación de email (opcional pero recomendado):**
- Ir a Authentication → Email Templates
- Puedes desactivar "Confirm email" si querés que el registro sea inmediato

### 3. Variables de entorno

Copiar `.env.example` → `.env.local`:

```bash
cp .env.example .env.local
```

Completar con tus valores:

```env
# Supabase → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# football-data.org → gratis en https://www.football-data.org/
FOOTBALL_DATA_API_KEY=abc123...

# Tu email (para ser admin automáticamente)
ADMIN_EMAIL=tu@email.com
```

### 4. Instalar y correr en local

```bash
npm install
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

**Primer registro:** registrarte con el email que pusiste en `ADMIN_EMAIL`. 
Vas a tener acceso automático al panel `/admin`.

### 5. Deploy en Vercel

```bash
# Opción A: desde GitHub
# 1. Subir el proyecto a un repo de GitHub
# 2. Ir a vercel.com → Import Project → seleccionar repo
# 3. Agregar las variables de entorno en Vercel dashboard

# Opción B: desde CLI
npm i -g vercel
vercel --prod
```

En Vercel → Settings → Environment Variables, agregar las mismas 5 variables del `.env.local`.

---

## 📱 Flujo de uso

### Pre-torneo (antes del 11 de junio)
1. Compartís el link con tus amigos
2. Cada uno se registra y completa sus pronósticos de **todos** los partidos de grupos
3. Cada uno elige su **campeón** y **goleador del torneo**
4. Confirmás el pago en el panel Admin → Participantes

### Durante el torneo
- Los partidos se **bloquean automáticamente 5 minutos antes** del pitazo
- Entrás a Admin → Resultados y cargás el score final de cada partido
- *(Opcional)* Presionás "Sincronizar" para intentar carga automática desde la API
- La tabla se actualiza en tiempo real

### Fases eliminatorias
1. En Admin → Resultados, seleccionás la fase (ej: "Ronda de 32")
2. Actualizás los nombres de los equipos en los partidos de esa fase
3. Presionás **"Bloquear fase"** — todos quedan sin poder editar sus pronósticos
4. Los participantes cargan sus pronósticos para esa fase

---

## 🏆 Sistema de puntuación

| Situación | Puntos |
|-----------|--------|
| Adivinar L/E/V (ganador o empate) | **1 pt** |
| + Diferencia de goles exacta (si hay ganador) | **+1 pt** |
| + Resultado exacto | **+1 pt** |
| + Resultado exacto con 5+ goles en total | **+1 pt** |
| + Bonus upset (equipo inferior >300 pts FIFA gana y lo pronosticaste) | **+1 pt** |
| Goleador del torneo acertado | **+5 pts** |
| Campeón: Francia / España / Argentina | **+4 pts** |
| Campeón: Brasil / Inglaterra / Portugal / Alemania | **+8 pts** |
| Campeón: Uruguay / Colombia / Bélgica / Países Bajos / EEUU | **+12 pts** |
| Campeón: Resto de equipos | **+24 pts** |

**Desempate** (en orden):
1. Acierto de campeón
2. Mayor cantidad de exactos con 5+ goles
3. Mayor cantidad de exactos
4. Mayor cantidad de diferencias exactas
5. Mayor cantidad de ganadores/empates
6. Orden alfabético

---

## 🔧 Panel de Admin

Ir a `/admin` (solo para el email registrado como admin):

- **Cargar resultados**: ingresar el score de cada partido uno a uno
- **Sincronizar (API)**: intenta obtener resultados automáticamente de football-data.org
- **Gestionar participantes**: confirmar pagos, editar montos
- **Bloquear fase**: antes de cada ronda eliminatoria

---

## 📝 Notas técnicas

### Por qué Supabase
- Auth + DB en un servicio, free tier generoso (500MB, 50k usuarios)
- Row Level Security: la DB misma rechaza writes no autorizados
- Las policies impiden que un usuario modifique pronósticos bloqueados, incluso si manipula el frontend

### Por qué Vercel
- Deploy automático desde GitHub
- Free tier más que suficiente para 40 usuarios simultáneos
- CDN global, latencias bajas desde Argentina

### Seguridad del locking
El bloqueo se verifica **en la base de datos** mediante la función `partido_bloqueado()`. 
El frontend puede ser manipulado, pero la RLS policy en la tabla `pronosticos` llama 
a esta función y rechaza el INSERT/UPDATE si el partido está bloqueado.

### football-data.org
- Free tier: 10 requests/minuto
- Para usar durante el Mundial, registrarse en [football-data.org](https://www.football-data.org/)
- El ID de la competición del Mundial 2026 puede ser `WC` o un número — verificar en la API
- Si la API no tiene el Mundial, cargar resultados manualmente desde Admin → Resultados

---

## 🗂️ Estructura del proyecto

```
app/
├── page.tsx                    # Login
├── (auth)/registro/            # Registro
├── (app)/
│   ├── dashboard/              # Tabla de posiciones
│   ├── pronosticos/            # Mis pronósticos
│   ├── partidos/               # Todos los partidos
│   └── pozo/                   # Estado del pozo
└── admin/
    ├── page.tsx                # Panel admin
    ├── resultados/             # Cargar resultados
    └── participantes/          # Gestionar pagos

lib/
├── scoring.ts                  # Motor de puntaje
├── types.ts                    # Tipos TypeScript
└── supabase/                   # Clientes Supabase

supabase/
├── schema.sql                  # Schema + RLS + triggers
└── seed-partidos.sql           # Los 104 partidos
```

---

Hecho con ❤️ para el Mundial 2026. 
Cualquier duda: revisar los comentarios en el código.
