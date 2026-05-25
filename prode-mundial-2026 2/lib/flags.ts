// Banderas emoji para todos los equipos del Mundial 2026
export const BANDERAS: Record<string, string> = {
  'México': '🇲🇽',
  'Sudáfrica': '🇿🇦',
  'Corea del Sur': '🇰🇷',
  'Chequia': '🇨🇿',
  'Canadá': '🇨🇦',
  'Bosnia y Herz.': '🇧🇦',
  'Qatar': '🇶🇦',
  'Suiza': '🇨🇭',
  'Brasil': '🇧🇷',
  'Marruecos': '🇲🇦',
  'Haití': '🇭🇹',
  'Escocia': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  'Estados Unidos': '🇺🇸',
  'Paraguay': '🇵🇾',
  'Australia': '🇦🇺',
  'Turquía': '🇹🇷',
  'Alemania': '🇩🇪',
  'Curazao': '🇨🇼',
  'Costa de Marfil': '🇨🇮',
  'Ecuador': '🇪🇨',
  'Países Bajos': '🇳🇱',
  'Japón': '🇯🇵',
  'Suecia': '🇸🇪',
  'Túnez': '🇹🇳',
  'Bélgica': '🇧🇪',
  'Egipto': '🇪🇬',
  'Irán': '🇮🇷',
  'Nueva Zelanda': '🇳🇿',
  'España': '🇪🇸',
  'Cabo Verde': '🇨🇻',
  'Arabia Saudita': '🇸🇦',
  'Uruguay': '🇺🇾',
  'Francia': '🇫🇷',
  'Senegal': '🇸🇳',
  'Iraq': '🇮🇶',
  'Noruega': '🇳🇴',
  'Argentina': '🇦🇷',
  'Argelia': '🇩🇿',
  'Austria': '🇦🇹',
  'Jordania': '🇯🇴',
  'Portugal': '🇵🇹',
  'RD Congo': '🇨🇩',
  'Uzbekistán': '🇺🇿',
  'Colombia': '🇨🇴',
  'Inglaterra': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  'Croacia': '🇭🇷',
  'Ghana': '🇬🇭',
  'Panamá': '🇵🇦',
}

export function bandera(equipo: string): string {
  return BANDERAS[equipo] ?? '🏳️'
}

// Top ~60 jugadores para el desplegable de goleador
export const TOP_JUGADORES = [
  // Argentina
  'Lionel Messi', 'Lautaro Martínez', 'Julián Álvarez', 'Ángel Di María',
  'Rodrigo De Paul', 'Alexis Mac Allister',
  // Francia
  'Kylian Mbappé', 'Antoine Griezmann', 'Ousmane Dembélé', 'Marcus Thuram',
  // España
  'Lamine Yamal', 'Pedri', 'Álvaro Morata', 'Nico Williams', 'Dani Olmo',
  'Fermín López',
  // Brasil
  'Vinicius Jr.', 'Rodrygo', 'Raphinha', 'Endrick', 'Lucas Paquetá',
  // Inglaterra
  'Jude Bellingham', 'Harry Kane', 'Bukayo Saka', 'Phil Foden', 'Cole Palmer',
  // Portugal
  'Cristiano Ronaldo', 'Bruno Fernandes', 'Bernardo Silva', 'Rafael Leão',
  'Diogo Jota',
  // Alemania
  'Florian Wirtz', 'Kai Havertz', 'Leroy Sané', 'Jamal Musiala',
  'Thomas Müller',
  // Países Bajos
  'Cody Gakpo', 'Memphis Depay', 'Xavi Simons', 'Donyell Malen',
  // Bélgica
  'Kevin De Bruyne', 'Romelu Lukaku', 'Leandro Trossard',
  // Uruguay
  'Darwin Núñez', 'Federico Valverde', 'Luis Suárez', 'Rodrigo Bentancur',
  // Colombia
  'James Rodríguez', 'Luis Díaz', 'Falcao',
  // Noruega
  'Erling Haaland',
  // Marruecos
  'Achraf Hakimi', 'Hakim Ziyech', 'Youssef En-Nesyri',
  // Japón
  'Takumi Minamino', 'Daichi Kamada',
  // México
  'Hirving Lozano', 'Raúl Jiménez',
  // Otros
  'Mohamed Salah', 'Son Heung-min', 'Aleksandar Mitrović',
]
