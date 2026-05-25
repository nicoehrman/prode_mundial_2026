-- ============================================================
-- PARTIDOS MUNDIAL 2026 — Todos los partidos
-- Tiempos en UTC (ET + 4h). Verificar horarios exactos en FIFA.com
-- ============================================================

-- Primero limpiamos para poder re-ejecutar el seed
TRUNCATE public.partidos RESTART IDENTITY CASCADE;

-- ── RANKING FIFA (aproximado Mayo 2026, a mayor nro = mejor ranking) ──
-- España:1830, Argentina:1760, Francia:1740, Inglaterra:1710, Brasil:1690
-- Portugal:1660, Países Bajos:1620, Bélgica:1590, Alemania:1570
-- Uruguay:1550, Marruecos:1530, Japón:1510, EEUU:1490, México:1480
-- Croacia:1460, Colombia:1455, Suiza:1445, Ecuador:1420, Australia:1400
-- Noruega:1395, Senegal:1385, Corea del Sur:1370, Irán:1355, Turquía:1340
-- Suecia:1335, Costa de Marfil:1325, Ghana:1315, Arabia Saudita:1305
-- Argelia:1290, Austria:1275, Egipto:1265, Escocia:1255, Sudáfrica:1250
-- Chequia:1240, Bosnia y Herz.:1215, RD Congo:1200, Uzbekistán:1195
-- Cabo Verde:1185, Túnez:1180, Canadá:1155, Paraguay:1130, Iraq:1120
-- Qatar:1100, Jordania:1090, Nueva Zelanda:1060, Haití:1005, Curazao:970

INSERT INTO public.partidos
  (match_number, fase, grupo, equipo_local, equipo_visitante, estadio, ciudad, kickoff_utc, ranking_fifa_local, ranking_fifa_visitante)
VALUES
-- ══════════════ GRUPO A ══════════════
(1,  'grupos', 'A', 'México',        'Sudáfrica',     'Estadio Azteca',         'Ciudad de México', '2026-06-11T19:00:00Z', 1480, 1250),
(2,  'grupos', 'A', 'Corea del Sur', 'Chequia',        'Estadio Akron',           'Guadalajara',      '2026-06-12T02:00:00Z', 1370, 1240),
(3,  'grupos', 'A', 'Chequia',       'Sudáfrica',      'Mercedes-Benz Stadium',   'Atlanta',          '2026-06-18T16:00:00Z', 1240, 1250),
(4,  'grupos', 'A', 'México',        'Corea del Sur',  'Estadio Akron',           'Guadalajara',      '2026-06-19T01:00:00Z', 1480, 1370),
(5,  'grupos', 'A', 'Chequia',       'México',          'Estadio Azteca',          'Ciudad de México', '2026-06-25T01:00:00Z', 1240, 1480),
(6,  'grupos', 'A', 'Sudáfrica',     'Corea del Sur',  'Estadio BBVA',            'Monterrey',        '2026-06-25T01:00:00Z', 1250, 1370),

-- ══════════════ GRUPO B ══════════════
(7,  'grupos', 'B', 'Canadá',        'Bosnia y Herz.', 'BMO Field',               'Toronto',          '2026-06-12T19:00:00Z', 1155, 1215),
(8,  'grupos', 'B', 'Qatar',         'Suiza',           'Levi''s Stadium',          'Santa Clara',      '2026-06-13T19:00:00Z', 1100, 1445),
(9,  'grupos', 'B', 'Suiza',         'Bosnia y Herz.', 'SoFi Stadium',            'Inglewood',        '2026-06-18T19:00:00Z', 1445, 1215),
(10, 'grupos', 'B', 'Canadá',        'Qatar',           'BC Place',                'Vancouver',        '2026-06-18T22:00:00Z', 1155, 1100),
(11, 'grupos', 'B', 'Suiza',         'Canadá',          'BC Place',                'Vancouver',        '2026-06-24T19:00:00Z', 1445, 1155),
(12, 'grupos', 'B', 'Bosnia y Herz.','Qatar',            'Lumen Field',             'Seattle',          '2026-06-24T19:00:00Z', 1215, 1100),

-- ══════════════ GRUPO C ══════════════
(13, 'grupos', 'C', 'Brasil',        'Marruecos',       'MetLife Stadium',         'East Rutherford',  '2026-06-13T22:00:00Z', 1690, 1530),
(14, 'grupos', 'C', 'Haití',         'Escocia',         'Gillette Stadium',        'Foxborough',       '2026-06-14T01:00:00Z', 1005, 1255),
(15, 'grupos', 'C', 'Escocia',       'Marruecos',       'Gillette Stadium',        'Foxborough',       '2026-06-19T22:00:00Z', 1255, 1530),
(16, 'grupos', 'C', 'Brasil',        'Haití',           'Lincoln Financial Field', 'Philadelphia',     '2026-06-20T00:30:00Z', 1690, 1005),
(17, 'grupos', 'C', 'Escocia',       'Brasil',          'Hard Rock Stadium',       'Miami',            '2026-06-24T22:00:00Z', 1255, 1690),
(18, 'grupos', 'C', 'Marruecos',     'Haití',           'Mercedes-Benz Stadium',   'Atlanta',          '2026-06-24T22:00:00Z', 1530, 1005),

-- ══════════════ GRUPO D ══════════════
(19, 'grupos', 'D', 'Estados Unidos','Paraguay',        'SoFi Stadium',            'Inglewood',        '2026-06-13T01:00:00Z', 1490, 1130),
(20, 'grupos', 'D', 'Australia',     'Turquía',         'BC Place',                'Vancouver',        '2026-06-14T04:00:00Z', 1400, 1340),
(21, 'grupos', 'D', 'Estados Unidos','Australia',       'Lumen Field',             'Seattle',          '2026-06-19T19:00:00Z', 1490, 1400),
(22, 'grupos', 'D', 'Turquía',       'Paraguay',        'Levi''s Stadium',          'Santa Clara',      '2026-06-20T03:00:00Z', 1340, 1130),
(23, 'grupos', 'D', 'Turquía',       'Estados Unidos', 'SoFi Stadium',            'Inglewood',        '2026-06-26T02:00:00Z', 1340, 1490),
(24, 'grupos', 'D', 'Paraguay',      'Australia',       'Levi''s Stadium',          'Santa Clara',      '2026-06-26T02:00:00Z', 1130, 1400),

-- ══════════════ GRUPO E ══════════════
(25, 'grupos', 'E', 'Alemania',      'Curazao',         'NRG Stadium',             'Houston',          '2026-06-14T17:00:00Z', 1570,  970),
(26, 'grupos', 'E', 'Costa de Marfil','Ecuador',        'Lincoln Financial Field', 'Philadelphia',     '2026-06-14T23:00:00Z', 1325, 1420),
(27, 'grupos', 'E', 'Alemania',      'Costa de Marfil','BMO Field',               'Toronto',          '2026-06-20T20:00:00Z', 1570, 1325),
(28, 'grupos', 'E', 'Ecuador',       'Curazao',         'Arrowhead Stadium',       'Kansas City',      '2026-06-21T00:00:00Z', 1420,  970),
(29, 'grupos', 'E', 'Curazao',       'Costa de Marfil','Lincoln Financial Field', 'Philadelphia',     '2026-06-25T20:00:00Z',  970, 1325),
(30, 'grupos', 'E', 'Ecuador',       'Alemania',        'MetLife Stadium',         'East Rutherford',  '2026-06-25T20:00:00Z', 1420, 1570),

-- ══════════════ GRUPO F ══════════════
(31, 'grupos', 'F', 'Países Bajos',  'Japón',           'AT&T Stadium',            'Arlington',        '2026-06-14T20:00:00Z', 1620, 1510),
(32, 'grupos', 'F', 'Suecia',        'Túnez',           'Estadio BBVA',            'Monterrey',        '2026-06-15T02:00:00Z', 1335, 1180),
(33, 'grupos', 'F', 'Países Bajos',  'Suecia',          'NRG Stadium',             'Houston',          '2026-06-20T17:00:00Z', 1620, 1335),
(34, 'grupos', 'F', 'Túnez',         'Japón',           'Estadio BBVA',            'Monterrey',        '2026-06-21T04:00:00Z', 1180, 1510),
(35, 'grupos', 'F', 'Japón',         'Suecia',          'AT&T Stadium',            'Arlington',        '2026-06-25T23:00:00Z', 1510, 1335),
(36, 'grupos', 'F', 'Túnez',         'Países Bajos',   'Arrowhead Stadium',       'Kansas City',      '2026-06-25T23:00:00Z', 1180, 1620),

-- ══════════════ GRUPO G ══════════════
(37, 'grupos', 'G', 'Bélgica',       'Egipto',          'Lumen Field',             'Seattle',          '2026-06-15T19:00:00Z', 1590, 1265),
(38, 'grupos', 'G', 'Irán',          'Nueva Zelanda',  'SoFi Stadium',            'Inglewood',        '2026-06-16T01:00:00Z', 1355, 1060),
(39, 'grupos', 'G', 'Bélgica',       'Irán',            'SoFi Stadium',            'Inglewood',        '2026-06-21T19:00:00Z', 1590, 1355),
(40, 'grupos', 'G', 'Nueva Zelanda', 'Egipto',          'BC Place',                'Vancouver',        '2026-06-22T01:00:00Z', 1060, 1265),
(41, 'grupos', 'G', 'Egipto',        'Irán',            'Lumen Field',             'Seattle',          '2026-06-27T03:00:00Z', 1265, 1355),
(42, 'grupos', 'G', 'Nueva Zelanda', 'Bélgica',         'BC Place',                'Vancouver',        '2026-06-27T03:00:00Z', 1060, 1590),

-- ══════════════ GRUPO H ══════════════
(43, 'grupos', 'H', 'España',        'Cabo Verde',      'Mercedes-Benz Stadium',   'Atlanta',          '2026-06-15T16:00:00Z', 1830, 1185),
(44, 'grupos', 'H', 'Arabia Saudita','Uruguay',         'Hard Rock Stadium',       'Miami',            '2026-06-15T22:00:00Z', 1305, 1550),
(45, 'grupos', 'H', 'España',        'Arabia Saudita', 'Mercedes-Benz Stadium',   'Atlanta',          '2026-06-21T16:00:00Z', 1830, 1305),
(46, 'grupos', 'H', 'Uruguay',       'Cabo Verde',      'Hard Rock Stadium',       'Miami',            '2026-06-21T22:00:00Z', 1550, 1185),
(47, 'grupos', 'H', 'Cabo Verde',    'Arabia Saudita', 'NRG Stadium',             'Houston',          '2026-06-27T00:00:00Z', 1185, 1305),
(48, 'grupos', 'H', 'Uruguay',       'España',          'Estadio Akron',           'Guadalajara',      '2026-06-27T00:00:00Z', 1550, 1830),

-- ══════════════ GRUPO I ══════════════
(49, 'grupos', 'I', 'Francia',       'Senegal',         'MetLife Stadium',         'East Rutherford',  '2026-06-16T19:00:00Z', 1740, 1385),
(50, 'grupos', 'I', 'Iraq',          'Noruega',         'Gillette Stadium',        'Foxborough',       '2026-06-16T22:00:00Z', 1120, 1395),
(51, 'grupos', 'I', 'Francia',       'Iraq',            'Lincoln Financial Field', 'Philadelphia',     '2026-06-22T21:00:00Z', 1740, 1120),
(52, 'grupos', 'I', 'Noruega',       'Senegal',         'MetLife Stadium',         'East Rutherford',  '2026-06-23T00:00:00Z', 1395, 1385),
(53, 'grupos', 'I', 'Noruega',       'Francia',         'Gillette Stadium',        'Foxborough',       '2026-06-26T19:00:00Z', 1395, 1740),
(54, 'grupos', 'I', 'Senegal',       'Iraq',            'BMO Field',               'Toronto',          '2026-06-26T19:00:00Z', 1385, 1120),

-- ══════════════ GRUPO J ══════════════
(55, 'grupos', 'J', 'Argentina',     'Argelia',         'Arrowhead Stadium',       'Kansas City',      '2026-06-17T01:00:00Z', 1760, 1290),
(56, 'grupos', 'J', 'Austria',       'Jordania',        'Levi''s Stadium',          'Santa Clara',      '2026-06-17T04:00:00Z', 1275, 1090),
(57, 'grupos', 'J', 'Argentina',     'Austria',         'AT&T Stadium',            'Arlington',        '2026-06-22T17:00:00Z', 1760, 1275),
(58, 'grupos', 'J', 'Jordania',      'Argelia',         'Levi''s Stadium',          'Santa Clara',      '2026-06-23T03:00:00Z', 1090, 1290),
(59, 'grupos', 'J', 'Jordania',      'Argentina',       'AT&T Stadium',            'Arlington',        '2026-06-28T02:00:00Z', 1090, 1760),
(60, 'grupos', 'J', 'Argelia',       'Austria',         'Arrowhead Stadium',       'Kansas City',      '2026-06-28T02:00:00Z', 1290, 1275),

-- ══════════════ GRUPO K ══════════════
(61, 'grupos', 'K', 'Portugal',      'RD Congo',        'NRG Stadium',             'Houston',          '2026-06-17T17:00:00Z', 1660, 1200),
(62, 'grupos', 'K', 'Uzbekistán',    'Colombia',        'Estadio Azteca',          'Ciudad de México', '2026-06-18T02:00:00Z', 1195, 1455),
(63, 'grupos', 'K', 'Portugal',      'Uzbekistán',      'NRG Stadium',             'Houston',          '2026-06-23T17:00:00Z', 1660, 1195),
(64, 'grupos', 'K', 'Colombia',      'RD Congo',        'Estadio Akron',           'Guadalajara',      '2026-06-24T02:00:00Z', 1455, 1200),
(65, 'grupos', 'K', 'Colombia',      'Portugal',        'Hard Rock Stadium',       'Miami',            '2026-06-27T23:30:00Z', 1455, 1660),
(66, 'grupos', 'K', 'RD Congo',      'Uzbekistán',      'Mercedes-Benz Stadium',   'Atlanta',          '2026-06-27T23:30:00Z', 1200, 1195),

-- ══════════════ GRUPO L ══════════════
(67, 'grupos', 'L', 'Inglaterra',    'Croacia',         'AT&T Stadium',            'Arlington',        '2026-06-17T20:00:00Z', 1710, 1460),
(68, 'grupos', 'L', 'Ghana',         'Panamá',          'BMO Field',               'Toronto',          '2026-06-17T23:00:00Z', 1315, 1280),
(69, 'grupos', 'L', 'Inglaterra',    'Ghana',           'Gillette Stadium',        'Foxborough',       '2026-06-23T20:00:00Z', 1710, 1315),
(70, 'grupos', 'L', 'Panamá',        'Croacia',         'BMO Field',               'Toronto',          '2026-06-23T23:00:00Z', 1280, 1460),
(71, 'grupos', 'L', 'Panamá',        'Inglaterra',      'MetLife Stadium',         'East Rutherford',  '2026-06-27T21:00:00Z', 1280, 1710),
(72, 'grupos', 'L', 'Croacia',       'Ghana',           'Lincoln Financial Field', 'Philadelphia',     '2026-06-27T21:00:00Z', 1460, 1315),

-- ══════════════ RONDA DE 32 ══════════════
-- Los equipos se completan cuando avance la fase de grupos.
-- El admin los actualiza en la app. Por ahora usamos etiquetas de posición.
(73,  '32avos', NULL, '2° Grupo A',  '2° Grupo B',  'SoFi Stadium',            'Inglewood',        '2026-06-28T19:00:00Z', 1000, 1000),
(74,  '32avos', NULL, '1° Grupo C',  '2° Grupo F',  'NRG Stadium',             'Houston',          '2026-06-29T17:00:00Z', 1000, 1000),
(75,  '32avos', NULL, '1° Grupo E',  'Mejor 3°',    'Gillette Stadium',        'Boston',           '2026-06-29T20:30:00Z', 1000, 1000),
(76,  '32avos', NULL, '1° Grupo F',  '2° Grupo C',  'Estadio BBVA',            'Monterrey',        '2026-06-30T01:00:00Z', 1000, 1000),
(77,  '32avos', NULL, '2° Grupo E',  '2° Grupo I',  'AT&T Stadium',            'Dallas',           '2026-06-30T17:00:00Z', 1000, 1000),
(78,  '32avos', NULL, '1° Grupo I',  'Mejor 3°',    'MetLife Stadium',         'East Rutherford',  '2026-06-30T21:00:00Z', 1000, 1000),
(79,  '32avos', NULL, '1° Grupo A',  'Mejor 3°',    'Estadio Azteca',          'Ciudad de México', '2026-07-01T01:00:00Z', 1000, 1000),
(80,  '32avos', NULL, '1° Grupo L',  'Mejor 3°',    'Mercedes-Benz Stadium',   'Atlanta',          '2026-07-01T16:00:00Z', 1000, 1000),
(81,  '32avos', NULL, '1° Grupo G',  'Mejor 3°',    'Lumen Field',             'Seattle',          '2026-07-01T20:00:00Z', 1000, 1000),
(82,  '32avos', NULL, '1° Grupo D',  'Mejor 3°',    'Levi''s Stadium',          'Santa Clara',      '2026-07-02T00:00:00Z', 1000, 1000),
(83,  '32avos', NULL, '1° Grupo H',  '2° Grupo J',  'SoFi Stadium',            'Inglewood',        '2026-07-02T19:00:00Z', 1000, 1000),
(84,  '32avos', NULL, '2° Grupo K',  '2° Grupo L',  'BMO Field',               'Toronto',          '2026-07-02T23:00:00Z', 1000, 1000),
(85,  '32avos', NULL, '1° Grupo B',  'Mejor 3°',    'BC Place',                'Vancouver',        '2026-07-03T03:00:00Z', 1000, 1000),
(86,  '32avos', NULL, '2° Grupo D',  '2° Grupo G',  'AT&T Stadium',            'Dallas',           '2026-07-03T18:00:00Z', 1000, 1000),
(87,  '32avos', NULL, '1° Grupo J',  '2° Grupo H',  'Hard Rock Stadium',       'Miami',            '2026-07-03T22:00:00Z', 1000, 1000),
(88,  '32avos', NULL, '1° Grupo K',  'Mejor 3°',    'Arrowhead Stadium',       'Kansas City',      '2026-07-04T01:30:00Z', 1000, 1000),

-- ══════════════ OCTAVOS DE FINAL (16avos) ══════════════
(89,  '16avos', NULL, 'G73',  'G74',  'NRG Stadium',             'Houston',          '2026-07-04T17:00:00Z', 1000, 1000),
(90,  '16avos', NULL, 'G75',  'G76',  'Lincoln Financial Field', 'Philadelphia',     '2026-07-04T21:00:00Z', 1000, 1000),
(91,  '16avos', NULL, 'G77',  'G78',  'MetLife Stadium',         'East Rutherford',  '2026-07-05T20:00:00Z', 1000, 1000),
(92,  '16avos', NULL, 'G79',  'G80',  'Estadio Azteca',          'Ciudad de México', '2026-07-06T00:00:00Z', 1000, 1000),
(93,  '16avos', NULL, 'G81',  'G82',  'AT&T Stadium',            'Dallas',           '2026-07-06T19:00:00Z', 1000, 1000),
(94,  '16avos', NULL, 'G83',  'G84',  'Lumen Field',             'Seattle',          '2026-07-07T00:00:00Z', 1000, 1000),
(95,  '16avos', NULL, 'G85',  'G86',  'Mercedes-Benz Stadium',   'Atlanta',          '2026-07-07T16:00:00Z', 1000, 1000),
(96,  '16avos', NULL, 'G87',  'G88',  'BC Place',                'Vancouver',        '2026-07-07T20:00:00Z', 1000, 1000),

-- ══════════════ CUARTOS DE FINAL ══════════════
(97,  'cuartos', NULL, 'G89',  'G90',  'Gillette Stadium',        'Boston',           '2026-07-09T20:00:00Z', 1000, 1000),
(98,  'cuartos', NULL, 'G91',  'G92',  'SoFi Stadium',            'Inglewood',        '2026-07-10T19:00:00Z', 1000, 1000),
(99,  'cuartos', NULL, 'G93',  'G94',  'Hard Rock Stadium',       'Miami',            '2026-07-11T21:00:00Z', 1000, 1000),
(100, 'cuartos', NULL, 'G95',  'G96',  'Arrowhead Stadium',       'Kansas City',      '2026-07-12T01:00:00Z', 1000, 1000),

-- ══════════════ SEMIFINALES ══════════════
(101, 'semis',   NULL, 'G97',  'G98',  'AT&T Stadium',            'Dallas',           '2026-07-14T19:00:00Z', 1000, 1000),
(102, 'semis',   NULL, 'G99',  'G100', 'Mercedes-Benz Stadium',   'Atlanta',          '2026-07-15T19:00:00Z', 1000, 1000),

-- ══════════════ TERCER Y CUARTO PUESTO ══════════════
(103, '3er_4to', NULL, 'Perdedor G101', 'Perdedor G102', 'Hard Rock Stadium',  'Miami',           '2026-07-18T21:00:00Z', 1000, 1000),

-- ══════════════ FINAL ══════════════
(104, 'final',   NULL, 'G101', 'G102', 'MetLife Stadium',        'East Rutherford',  '2026-07-19T19:00:00Z', 1000, 1000);
