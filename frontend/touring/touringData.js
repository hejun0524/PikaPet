// touring/touringData.js — the touring system's data: pricing constants,
// world destinations, sports leagues, and the derived city/team lists.
//
// A tour package visits 1-5 uniformly-random cities of one destination
// (30 game-minutes and a fixed price per city). Care meters are frozen for
// the whole trip. On completion the trip is logged in the journal, visited
// cities light up on the map, and the pet brings home one souvenir per city.

/** Game-minutes spent per city/stop of any tour. */
export const TOUR_MINUTES_PER_CITY = 30;

/** Coins per city of a world tour package. */
export const TOUR_PRICE_PER_CITY = 70;

/** Largest tour package (cities/stops per trip). */
export const TOUR_MAX_CITIES = 5;

/** Coins Pika pays per souvenir (a generous markup over package prices). */
export const SOUVENIR_SELL_PRICE = 200;

/** How many souvenirs Pika's want-list holds per refresh. */
export const PIKA_WANTS_COUNT = 10;

// Pika also sells travel tickets (store refreshes every 3 hours), at
// randomized prices: flight (pick your exact city) > train (pick the
// country, random city) >> a 1-city random package (💰70). Team tickets and
// league passes are the sports equivalents, at a premium.

/** Flight-ticket offers per store refresh. */
export const PIKA_FLIGHT_OFFERS = 4;
/** Train-ticket offers per store refresh. */
export const PIKA_TRAIN_OFFERS = 3;
/** Team-ticket offers per store refresh. */
export const PIKA_TEAM_OFFERS = 2;
/** Flight ticket price: base + random 0..VAR (final 280-400). */
export const FLIGHT_PRICE_BASE = 280;
export const FLIGHT_PRICE_VAR = 120;
/** Train ticket price: base + random 0..VAR (final 170-250). */
export const TRAIN_PRICE_BASE = 170;
export const TRAIN_PRICE_VAR = 80;
/** Team ticket price: base + random 0..VAR (final 380-500). */
export const TEAM_TICKET_PRICE_BASE = 380;
export const TEAM_TICKET_PRICE_VAR = 120;
/** League pass price: base + random 0..VAR (final 250-330). */
export const LEAGUE_PASS_PRICE_BASE = 250;
export const LEAGUE_PASS_PRICE_VAR = 80;

/** Below this health the pet is sick: no school, no work, no traveling. */
export const SICK_BELOW = 80;

/**
 * World destinations. Each: `{ key, label, emoji, cities }`.
 * Visiting every city of a destination earns its Explorer achievement.
 */
export const DESTINATIONS = [
  { key: "usa", label: "USA", emoji: "🇺🇸", cities: ["New York", "Los Angeles", "Chicago", "San Francisco", "Seattle", "Boston", "Miami", "Las Vegas", "Washington DC", "New Orleans", "Houston", "Denver", "San Diego", "Philadelphia", "Austin", "Portland", "Nashville", "Honolulu", "Orlando", "Atlanta", "Dallas", "Phoenix", "Detroit", "Minneapolis", "San Antonio"] },
  { key: "china", label: "China", emoji: "🇨🇳", cities: ["Beijing", "Shanghai", "Guangzhou", "Shenzhen", "Chengdu", "Xi'an", "Hangzhou", "Suzhou", "Nanjing", "Chongqing", "Wuhan", "Qingdao", "Xiamen", "Kunming", "Guilin", "Lhasa", "Harbin", "Sanya", "Dali", "Lijiang", "Hong Kong", "Macau", "Taipei", "Tianjin", "Changsha"] },
  { key: "uk", label: "UK", emoji: "🇬🇧", cities: ["London", "Edinburgh", "Manchester", "Liverpool", "Oxford", "Cambridge", "Bath", "York"] },
  { key: "france", label: "France", emoji: "🇫🇷", cities: ["Paris", "Lyon", "Marseille", "Nice", "Bordeaux", "Strasbourg", "Toulouse", "Cannes"] },
  { key: "germany", label: "Germany", emoji: "🇩🇪", cities: ["Berlin", "Munich", "Hamburg", "Frankfurt", "Cologne", "Dresden", "Heidelberg", "Stuttgart"] },
  { key: "italy", label: "Italy", emoji: "🇮🇹", cities: ["Rome", "Venice", "Florence", "Milan", "Naples", "Turin", "Pisa", "Verona"] },
  { key: "japan", label: "Japan", emoji: "🇯🇵", cities: ["Tokyo", "Kyoto", "Osaka", "Sapporo", "Nara", "Hiroshima", "Fukuoka", "Nagoya"] },
  { key: "russia", label: "Russia", emoji: "🇷🇺", cities: ["Moscow", "Saint Petersburg", "Kazan", "Sochi", "Vladivostok", "Novosibirsk"] },
  { key: "canada", label: "Canada", emoji: "🇨🇦", cities: ["Toronto", "Vancouver", "Montreal", "Calgary", "Ottawa", "Quebec City"] },
  { key: "australia", label: "Australia", emoji: "🇦🇺", cities: ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Gold Coast"] },
  { key: "newzealand", label: "New Zealand", emoji: "🇳🇿", cities: ["Auckland", "Wellington", "Christchurch", "Queenstown"] },
  { key: "mexico", label: "Mexico", emoji: "🇲🇽", cities: ["Mexico City", "Cancun", "Guadalajara", "Monterrey", "Tulum"] },
  { key: "brazil", label: "Brazil", emoji: "🇧🇷", cities: ["Rio de Janeiro", "Sao Paulo", "Brasilia", "Salvador", "Manaus"] },
  { key: "egypt", label: "Egypt", emoji: "🇪🇬", cities: ["Cairo", "Alexandria", "Luxor", "Aswan", "Giza"] },
  { key: "turkey", label: "Turkey", emoji: "🇹🇷", cities: ["Istanbul", "Ankara", "Antalya", "Izmir", "Cappadocia"] },
  { key: "spain", label: "Spain", emoji: "🇪🇸", cities: ["Madrid", "Barcelona", "Seville", "Valencia", "Granada", "Bilbao"] },
  { key: "greece", label: "Greece", emoji: "🇬🇷", cities: ["Athens", "Santorini", "Thessaloniki", "Mykonos", "Crete"] },
  { key: "nigeria", label: "Nigeria", emoji: "🇳🇬", cities: ["Lagos", "Abuja", "Kano", "Ibadan", "Port Harcourt"] },
  { key: "benin", label: "Benin", emoji: "🇧🇯", cities: ["Cotonou", "Porto-Novo", "Ouidah", "Abomey"] },
  { key: "india", label: "India", emoji: "🇮🇳", cities: ["Delhi", "Mumbai", "Bangalore", "Chennai", "Kolkata", "Hyderabad", "Jaipur", "Agra", "Goa", "Varanasi"] },
  { key: "pakistan", label: "Pakistan", emoji: "🇵🇰", cities: ["Karachi", "Lahore", "Islamabad", "Peshawar"] },
  { key: "saudi", label: "Saudi Arabia", emoji: "🇸🇦", cities: ["Riyadh", "Jeddah", "Mecca", "Medina"] },
  { key: "jordan", label: "Jordan", emoji: "🇯🇴", cities: ["Amman", "Petra", "Aqaba"] },
  { key: "uae", label: "UAE", emoji: "🇦🇪", cities: ["Dubai", "Abu Dhabi", "Sharjah"] },
  { key: "southafrica", label: "South Africa", emoji: "🇿🇦", cities: ["Cape Town", "Johannesburg", "Durban", "Pretoria"] },
  { key: "kenya", label: "Kenya", emoji: "🇰🇪", cities: ["Nairobi", "Mombasa", "Kisumu"] },
  { key: "southkorea", label: "South Korea", emoji: "🇰🇷", cities: ["Seoul", "Busan", "Incheon", "Jeju", "Daegu"] },
];

/** Coins per stop of a sports tour (premium over city touring). */
export const SPORT_PRICE_PER_VENUE = 150;

/**
 * Sports leagues. Same shape as DESTINATIONS — `cities` holds team names —
 * so both flow through the same visit-tracking code.
 */
export const SPORT_LEAGUES = [
  { key: "nba", label: "NBA", emoji: "🏀", cities: ["Atlanta Hawks", "Boston Celtics", "Brooklyn Nets", "Charlotte Hornets", "Chicago Bulls", "Cleveland Cavaliers", "Dallas Mavericks", "Denver Nuggets", "Detroit Pistons", "Golden State Warriors", "Houston Rockets", "Indiana Pacers", "LA Clippers", "Los Angeles Lakers", "Memphis Grizzlies", "Miami Heat", "Milwaukee Bucks", "Minnesota Timberwolves", "New Orleans Pelicans", "New York Knicks", "Oklahoma City Thunder", "Orlando Magic", "Philadelphia 76ers", "Phoenix Suns", "Portland Trail Blazers", "Sacramento Kings", "San Antonio Spurs", "Toronto Raptors", "Utah Jazz", "Washington Wizards"] },
  { key: "wnba", label: "WNBA", emoji: "⛹️‍♀️", cities: ["Atlanta Dream", "Chicago Sky", "Connecticut Sun", "Dallas Wings", "Golden State Valkyries", "Indiana Fever", "Las Vegas Aces", "Los Angeles Sparks", "Minnesota Lynx", "New York Liberty", "Phoenix Mercury", "Seattle Storm", "Washington Mystics"] },
  { key: "nfl", label: "NFL", emoji: "🏈", cities: ["Arizona Cardinals", "Atlanta Falcons", "Baltimore Ravens", "Buffalo Bills", "Carolina Panthers", "Chicago Bears", "Cincinnati Bengals", "Cleveland Browns", "Dallas Cowboys", "Denver Broncos", "Detroit Lions", "Green Bay Packers", "Houston Texans", "Indianapolis Colts", "Jacksonville Jaguars", "Kansas City Chiefs", "Las Vegas Raiders", "Los Angeles Chargers", "Los Angeles Rams", "Miami Dolphins", "Minnesota Vikings", "New England Patriots", "New Orleans Saints", "New York Giants", "New York Jets", "Philadelphia Eagles", "Pittsburgh Steelers", "San Francisco 49ers", "Seattle Seahawks", "Tampa Bay Buccaneers", "Tennessee Titans", "Washington Commanders"] },
  { key: "mlb", label: "MLB", emoji: "⚾", cities: ["Arizona Diamondbacks", "Atlanta Braves", "Baltimore Orioles", "Boston Red Sox", "Chicago Cubs", "Chicago White Sox", "Cincinnati Reds", "Cleveland Guardians", "Colorado Rockies", "Detroit Tigers", "Houston Astros", "Kansas City Royals", "Los Angeles Angels", "Los Angeles Dodgers", "Miami Marlins", "Milwaukee Brewers", "Minnesota Twins", "New York Mets", "New York Yankees", "Oakland Athletics", "Philadelphia Phillies", "Pittsburgh Pirates", "San Diego Padres", "San Francisco Giants", "Seattle Mariners", "St. Louis Cardinals", "Tampa Bay Rays", "Texas Rangers", "Toronto Blue Jays", "Washington Nationals"] },
  { key: "cba", label: "CBA", emoji: "🐉", cities: ["Beijing Ducks", "Beijing Royal Fighters", "Fujian Sturgeons", "Guangdong Southern Tigers", "Guangzhou Loong Lions", "Jiangsu Dragons", "Jilin Northeast Tigers", "Liaoning Flying Leopards", "Nanjing Monkey Kings", "Ningbo Rockets", "Qingdao Eagles", "Shandong Heroes", "Shanghai Sharks", "Shanxi Loongs", "Shenzhen Leopards", "Sichuan Blue Whales", "Tianjin Pioneers", "Xinjiang Flying Tigers", "Zhejiang Golden Bulls", "Zhejiang Lions"] },
];

/** Every place that tracks visits: countries + sports leagues. */
export const ALL_PLACES = [...DESTINATIONS, ...SPORT_LEAGUES];

/** Every city of every destination (flat). */
export const ALL_CITIES = DESTINATIONS.flatMap((d) => d.cities);

/** Every team of every league (flat). */
export const ALL_TEAMS = SPORT_LEAGUES.flatMap((l) => l.cities);
