export const BANDERAS: Record<string, string> = {
  'México': '🇲🇽', 'Sudáfrica': '🇿🇦', 'Corea del Sur': '🇰🇷', 'Chequia': '🇨🇿',
  'Canadá': '🇨🇦', 'Bosnia y Herz.': '🇧🇦', 'Qatar': '🇶🇦', 'Suiza': '🇨🇭',
  'Brasil': '🇧🇷', 'Marruecos': '🇲🇦', 'Haití': '🇭🇹', 'Escocia': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  'Estados Unidos': '🇺🇸', 'Paraguay': '🇵🇾', 'Australia': '🇦🇺', 'Turquía': '🇹🇷',
  'Alemania': '🇩🇪', 'Curazao': '🇨🇼', 'Costa de Marfil': '🇨🇮', 'Ecuador': '🇪🇨',
  'Países Bajos': '🇳🇱', 'Japón': '🇯🇵', 'Suecia': '🇸🇪', 'Túnez': '🇹🇳',
  'Bélgica': '🇧🇪', 'Egipto': '🇪🇬', 'Irán': '🇮🇷', 'Nueva Zelanda': '🇳🇿',
  'España': '🇪🇸', 'Cabo Verde': '🇨🇻', 'Arabia Saudita': '🇸🇦', 'Uruguay': '🇺🇾',
  'Francia': '🇫🇷', 'Senegal': '🇸🇳', 'Iraq': '🇮🇶', 'Noruega': '🇳🇴',
  'Argentina': '🇦🇷', 'Argelia': '🇩🇿', 'Austria': '🇦🇹', 'Jordania': '🇯🇴',
  'Portugal': '🇵🇹', 'RD Congo': '🇨🇩', 'Uzbekistán': '🇺🇿', 'Colombia': '🇨🇴',
  'Inglaterra': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Croacia': '🇭🇷', 'Ghana': '🇬🇭', 'Panamá': '🇵🇦',
}

export function bandera(equipo: string): string {
  return BANDERAS[equipo] ?? '🏳️'
}

export const TOP_JUGADORES = [
  'Lionel Messi', 'Lautaro Martínez', 'Julián Álvarez', 'Ángel Di María',
  'Rodrigo De Paul', 'Alexis Mac Allister',
  'Kylian Mbappé', 'Antoine Griezmann', 'Ousmane Dembélé', 'Marcus Thuram',
  'Lamine Yamal', 'Pedri', 'Álvaro Morata', 'Nico Williams', 'Dani Olmo',
  'Vinicius Jr.', 'Rodrygo', 'Raphinha', 'Endrick', 'Lucas Paquetá',
  'Jude Bellingham', 'Harry Kane', 'Bukayo Saka', 'Phil Foden', 'Cole Palmer',
  'Cristiano Ronaldo', 'Bruno Fernandes', 'Bernardo Silva', 'Rafael Leão',
  'Florian Wirtz', 'Kai Havertz', 'Leroy Sané', 'Jamal Musiala',
  'Cody Gakpo', 'Memphis Depay', 'Xavi Simons',
  'Kevin De Bruyne', 'Romelu Lukaku',
  'Darwin Núñez', 'Federico Valverde', 'Luis Suárez',
  'James Rodríguez', 'Luis Díaz',
  'Erling Haaland',
  'Achraf Hakimi', 'Youssef En-Nesyri',
  'Mohamed Salah', 'Son Heung-min',
  'Hirving Lozano', 'Raúl Jiménez',
]
