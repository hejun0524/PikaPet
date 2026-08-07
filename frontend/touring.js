// Shared touring data + helpers, loaded as a plain <script> by the stats
// window (which runs trips on the activity clock) and the hub window
// (Touring page UI + Pika's trading post).
//
// A tour package visits 1-5 uniformly-random cities of one destination
// (30 game-minutes and a fixed price per city). Care meters are frozen for
// the whole trip. On completion the trip is logged in the journal, visited
// cities light up on the map, and the pet brings home one souvenir per city.

const TOUR_MINUTES_PER_CITY = 30;
const TOUR_PRICE_PER_CITY = 70;
const TOUR_MAX_CITIES = 5;

// Pika buys souvenirs at a generous markup; her want-list refreshes daily.
const SOUVENIR_SELL_PRICE = 200;
const PIKA_WANTS_COUNT = 10;

// Pika also sells travel tickets (store refreshes every 3 hours), at
// randomized prices: flight (pick your exact city) > train (pick the
// country, random city) >> a 1-city random package (💰70). Team tickets and
// league passes are the sports equivalents, at a premium.
const PIKA_FLIGHT_OFFERS = 4;
const PIKA_TRAIN_OFFERS = 3;
const PIKA_TEAM_OFFERS = 2;
const FLIGHT_PRICE_BASE = 280;
const FLIGHT_PRICE_VAR = 120; // final: 280-400
const TRAIN_PRICE_BASE = 170;
const TRAIN_PRICE_VAR = 80; // final: 170-250
const TEAM_TICKET_PRICE_BASE = 380;
const TEAM_TICKET_PRICE_VAR = 120; // final: 380-500
const LEAGUE_PASS_PRICE_BASE = 250;
const LEAGUE_PASS_PRICE_VAR = 80; // final: 250-330

// Below this health the pet is sick: no school, no work, no traveling.
const SICK_BELOW = 80;

const DESTINATIONS = [
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

// Sports touring works like city touring, but visits league teams at a
// premium price per stop.
const SPORT_PRICE_PER_VENUE = 150;

const SPORT_LEAGUES = [
  { key: "nba", label: "NBA", emoji: "🏀", cities: ["Atlanta Hawks", "Boston Celtics", "Brooklyn Nets", "Charlotte Hornets", "Chicago Bulls", "Cleveland Cavaliers", "Dallas Mavericks", "Denver Nuggets", "Detroit Pistons", "Golden State Warriors", "Houston Rockets", "Indiana Pacers", "LA Clippers", "Los Angeles Lakers", "Memphis Grizzlies", "Miami Heat", "Milwaukee Bucks", "Minnesota Timberwolves", "New Orleans Pelicans", "New York Knicks", "Oklahoma City Thunder", "Orlando Magic", "Philadelphia 76ers", "Phoenix Suns", "Portland Trail Blazers", "Sacramento Kings", "San Antonio Spurs", "Toronto Raptors", "Utah Jazz", "Washington Wizards"] },
  { key: "wnba", label: "WNBA", emoji: "⛹️‍♀️", cities: ["Atlanta Dream", "Chicago Sky", "Connecticut Sun", "Dallas Wings", "Golden State Valkyries", "Indiana Fever", "Las Vegas Aces", "Los Angeles Sparks", "Minnesota Lynx", "New York Liberty", "Phoenix Mercury", "Seattle Storm", "Washington Mystics"] },
  { key: "nfl", label: "NFL", emoji: "🏈", cities: ["Arizona Cardinals", "Atlanta Falcons", "Baltimore Ravens", "Buffalo Bills", "Carolina Panthers", "Chicago Bears", "Cincinnati Bengals", "Cleveland Browns", "Dallas Cowboys", "Denver Broncos", "Detroit Lions", "Green Bay Packers", "Houston Texans", "Indianapolis Colts", "Jacksonville Jaguars", "Kansas City Chiefs", "Las Vegas Raiders", "Los Angeles Chargers", "Los Angeles Rams", "Miami Dolphins", "Minnesota Vikings", "New England Patriots", "New Orleans Saints", "New York Giants", "New York Jets", "Philadelphia Eagles", "Pittsburgh Steelers", "San Francisco 49ers", "Seattle Seahawks", "Tampa Bay Buccaneers", "Tennessee Titans", "Washington Commanders"] },
  { key: "mlb", label: "MLB", emoji: "⚾", cities: ["Arizona Diamondbacks", "Atlanta Braves", "Baltimore Orioles", "Boston Red Sox", "Chicago Cubs", "Chicago White Sox", "Cincinnati Reds", "Cleveland Guardians", "Colorado Rockies", "Detroit Tigers", "Houston Astros", "Kansas City Royals", "Los Angeles Angels", "Los Angeles Dodgers", "Miami Marlins", "Milwaukee Brewers", "Minnesota Twins", "New York Mets", "New York Yankees", "Oakland Athletics", "Philadelphia Phillies", "Pittsburgh Pirates", "San Diego Padres", "San Francisco Giants", "Seattle Mariners", "St. Louis Cardinals", "Tampa Bay Rays", "Texas Rangers", "Toronto Blue Jays", "Washington Nationals"] },
  { key: "cba", label: "CBA", emoji: "🐉", cities: ["Beijing Ducks", "Beijing Royal Fighters", "Fujian Sturgeons", "Guangdong Southern Tigers", "Guangzhou Loong Lions", "Jiangsu Dragons", "Jilin Northeast Tigers", "Liaoning Flying Leopards", "Nanjing Monkey Kings", "Ningbo Rockets", "Qingdao Eagles", "Shandong Heroes", "Shanghai Sharks", "Shanxi Loongs", "Shenzhen Leopards", "Sichuan Blue Whales", "Tianjin Pioneers", "Xinjiang Flying Tigers", "Zhejiang Golden Bulls", "Zhejiang Lions"] },
];

// Every place that tracks visits: countries + sports leagues.
const ALL_PLACES = [...DESTINATIONS, ...SPORT_LEAGUES];

const ALL_CITIES = DESTINATIONS.flatMap((d) => d.cities);
const ALL_TEAMS = SPORT_LEAGUES.flatMap((l) => l.cities);

function isLeagueKey(key) {
  return SPORT_LEAGUES.some((l) => l.key === key);
}

function findDestination(key) {
  return DESTINATIONS.find((d) => d.key === key);
}

// Countries AND sports leagues (both track visited "cities").
function findPlace(key) {
  return ALL_PLACES.find((d) => d.key === key);
}

function tourKey(destKey, cityCount) {
  return `tour-${destKey}-${cityCount}`;
}

function cityDestination(city) {
  return ALL_PLACES.find((d) => d.cities.includes(city));
}

function flightKey(city) {
  return `flight:${city}`;
}

function trainKey(destKey) {
  return `train:${destKey}`;
}

// Tour "defs" are derived, matching the shape the activity engine expects
// (minutes, cost, drain) plus kind-specific fields. Three kinds:
//   package  tour-<dest>-<n>  paid in coins at start, n random cities
//   flight   flight:<city>    consumes a ticket, visits exactly that city
//   train    train:<dest>     consumes a ticket, visits 1 random city there
function findTour(key) {
  if (typeof key !== "string") return null;
  // Mystery packages roam the whole world — destination is a surprise, so
  // neither the name nor the status bar reveals a country.
  const anyPkg = /^tour-any-([1-5])$/.exec(key);
  if (anyPkg) {
    const cityCount = Number(anyPkg[1]);
    return {
      key,
      kind: "package",
      destKey: null,
      cityCount,
      emoji: "🌍",
      name: `Mystery Tour · ${cityCount} ${cityCount > 1 ? "cities" : "city"}`,
      minutes: cityCount * TOUR_MINUTES_PER_CITY,
      cost: cityCount * TOUR_PRICE_PER_CITY,
      drain: {},
    };
  }
  // Mystery sports tours: random teams across ALL leagues, premium price.
  const anySport = /^sport-any-([1-5])$/.exec(key);
  if (anySport) {
    const cityCount = Number(anySport[1]);
    return {
      key,
      kind: "sport",
      destKey: null,
      cityCount,
      emoji: "🏟️",
      name: `Mystery Sports Tour · ${cityCount} ${cityCount > 1 ? "stops" : "stop"}`,
      minutes: cityCount * TOUR_MINUTES_PER_CITY,
      cost: cityCount * SPORT_PRICE_PER_VENUE,
      drain: {},
    };
  }
  // League-scoped sports tours (legacy keys; may exist in old saves).
  const sport = /^sport-([a-z]+)-([1-5])$/.exec(key);
  if (sport) {
    const league = SPORT_LEAGUES.find((l) => l.key === sport[1]);
    if (!league) return null;
    const cityCount = Number(sport[2]);
    return {
      key,
      kind: "sport",
      destKey: league.key,
      cityCount,
      emoji: league.emoji,
      name: `${league.label} Tour · ${cityCount} ${cityCount > 1 ? "stops" : "stop"}`,
      minutes: cityCount * TOUR_MINUTES_PER_CITY,
      cost: cityCount * SPORT_PRICE_PER_VENUE,
      drain: {},
    };
  }
  // Country-scoped packages (legacy keys; may exist in old saves).
  const pkg = /^tour-([a-z]+)-([1-5])$/.exec(key);
  if (pkg) {
    const dest = findDestination(pkg[1]);
    if (!dest) return null;
    const cityCount = Number(pkg[2]);
    return {
      key,
      kind: "package",
      destKey: dest.key,
      cityCount,
      emoji: dest.emoji,
      name: `${dest.label} Tour · ${cityCount} ${cityCount > 1 ? "cities" : "city"}`,
      minutes: cityCount * TOUR_MINUTES_PER_CITY,
      cost: cityCount * TOUR_PRICE_PER_CITY,
      drain: {}, // care is maintained during the trip
    };
  }
  // Flight tickets go to one specific city — or one specific team.
  if (key.startsWith("flight:")) {
    const city = key.slice("flight:".length);
    const dest = cityDestination(city);
    if (!dest) return null;
    const league = isLeagueKey(dest.key);
    return {
      key,
      kind: "flight",
      ticket: true,
      city,
      destKey: dest.key,
      cityCount: 1,
      emoji: league ? "🎟️" : "✈️",
      name: league ? `Ticket to ${city}` : `Flight to ${city}`,
      minutes: TOUR_MINUTES_PER_CITY,
      cost: 0,
      drain: {},
    };
  }
  // Train tickets pick a random city of a country — or a league pass picks
  // a random team of that league.
  if (key.startsWith("train:")) {
    const place = findPlace(key.slice("train:".length));
    if (!place) return null;
    const league = isLeagueKey(place.key);
    return {
      key,
      kind: "train",
      ticket: true,
      destKey: place.key,
      cityCount: 1,
      emoji: league ? "🎟️" : "🚄",
      name: league ? `${place.label} League Pass` : `Train trip in ${place.label}`,
      minutes: TOUR_MINUTES_PER_CITY,
      cost: 0,
      drain: {},
    };
  }
  return null;
}

// The ticket key a Pika shop offer turns into when bought.
function ticketOfferKey(offer) {
  return offer.kind === "flight" ? flightKey(offer.city) : trainKey(offer.dest);
}

// n distinct uniformly-random picks from a list.
function pickRandomCities(cities, n) {
  const pool = [...cities];
  const picked = [];
  while (picked.length < n && pool.length) {
    picked.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  return picked;
}

function souvenirName(city) {
  return `Souvenir from ${city}`;
}
