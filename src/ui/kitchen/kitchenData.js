// kitchen/kitchenData.js — Noonie's Kitchen data: ingredient catalog (sold at
// Pika's Organic Market), basic recipes, one signature dish per touring city,
// per-destination cuisine pools (used to generate city-recipe ingredient
// lists), paw-bots, skill books (for Darcy's bookshelf), and order customers.
//
// Like every catalog, names here are English; locales translate under stable
// keys ("ing.<key>", "recipe.<key>", "book.<key>" — see doc/languages.md).
// City dish names are shown in English in every locale for now (fallback).

/** Ingredient categories, in Market tab order. Each: {key, emoji, label}. */
export const INGREDIENT_CATS = [
  { key: "veggie", emoji: "🥬", label: "Veggies" },
  { key: "meat", emoji: "🍖", label: "Meat" },
  { key: "seafood", emoji: "🦐", label: "Seafood" },
  { key: "staple", emoji: "🍚", label: "Staples" },
  { key: "dairy", emoji: "🥚", label: "Dairy & Eggs" },
  { key: "sauce", emoji: "🫙", label: "Sauces" },
  { key: "spice", emoji: "🌿", label: "Spices & Extras" },
];

/** Every ingredient: {key, emoji, name, cat, price} (coins each). */
export const INGREDIENTS = [
  { key: "tomato", emoji: "🍅", name: "Tomato", cat: "veggie", price: 5 },
  { key: "onion", emoji: "🧅", name: "Onion", cat: "veggie", price: 4 },
  { key: "garlic", emoji: "🧄", name: "Garlic", cat: "veggie", price: 4 },
  { key: "potato", emoji: "🥔", name: "Potato", cat: "veggie", price: 5 },
  { key: "carrot", emoji: "🥕", name: "Carrot", cat: "veggie", price: 4 },
  { key: "cabbage", emoji: "🥬", name: "Cabbage", cat: "veggie", price: 6 },
  { key: "mushroom", emoji: "🍄", name: "Mushroom", cat: "veggie", price: 8 },
  { key: "chili", emoji: "🌶️", name: "Chili", cat: "veggie", price: 6 },
  { key: "avocado", emoji: "🥑", name: "Avocado", cat: "veggie", price: 10 },
  { key: "cucumber", emoji: "🥒", name: "Cucumber", cat: "veggie", price: 5 },
  { key: "chicken", emoji: "🍗", name: "Chicken", cat: "meat", price: 14 },
  { key: "beef", emoji: "🥩", name: "Beef", cat: "meat", price: 18 },
  { key: "pork", emoji: "🍖", name: "Pork", cat: "meat", price: 15 },
  { key: "lamb", emoji: "🐏", name: "Lamb", cat: "meat", price: 20 },
  { key: "duck", emoji: "🦆", name: "Duck", cat: "meat", price: 22 },
  { key: "bacon", emoji: "🥓", name: "Bacon", cat: "meat", price: 12 },
  { key: "fish", emoji: "🐟", name: "White Fish", cat: "seafood", price: 16 },
  { key: "salmon", emoji: "🐠", name: "Salmon", cat: "seafood", price: 22 },
  { key: "shrimp", emoji: "🦐", name: "Shrimp", cat: "seafood", price: 18 },
  { key: "squid", emoji: "🦑", name: "Squid", cat: "seafood", price: 15 },
  { key: "crab", emoji: "🦀", name: "Crab", cat: "seafood", price: 25 },
  { key: "mussels", emoji: "🦪", name: "Mussels", cat: "seafood", price: 14 },
  { key: "rice", emoji: "🍚", name: "Rice", cat: "staple", price: 6 },
  { key: "noodles", emoji: "🍜", name: "Noodles", cat: "staple", price: 8 },
  { key: "pasta", emoji: "🍝", name: "Pasta", cat: "staple", price: 8 },
  { key: "flour", emoji: "🌾", name: "Flour", cat: "staple", price: 5 },
  { key: "bread", emoji: "🍞", name: "Bread", cat: "staple", price: 7 },
  { key: "corn", emoji: "🌽", name: "Corn", cat: "staple", price: 5 },
  { key: "beans", emoji: "🫘", name: "Beans", cat: "staple", price: 6 },
  { key: "egg", emoji: "🥚", name: "Egg", cat: "dairy", price: 4 },
  { key: "milk", emoji: "🥛", name: "Milk", cat: "dairy", price: 5 },
  { key: "butter", emoji: "🧈", name: "Butter", cat: "dairy", price: 8 },
  { key: "cheese", emoji: "🧀", name: "Cheese", cat: "dairy", price: 10 },
  { key: "cream", emoji: "🍨", name: "Cream", cat: "dairy", price: 9 },
  { key: "soy", emoji: "🫙", name: "Soy Sauce", cat: "sauce", price: 7 },
  { key: "tomsauce", emoji: "🥫", name: "Tomato Sauce", cat: "sauce", price: 7 },
  { key: "oliveoil", emoji: "🫒", name: "Olive Oil", cat: "sauce", price: 10 },
  { key: "curry", emoji: "🍛", name: "Curry Paste", cat: "sauce", price: 12 },
  { key: "honey", emoji: "🍯", name: "Honey", cat: "sauce", price: 9 },
  { key: "salt", emoji: "🧂", name: "Salt & Pepper", cat: "spice", price: 3 },
  { key: "basil", emoji: "🌿", name: "Fresh Herbs", cat: "spice", price: 6 },
  { key: "cinnamon", emoji: "🪵", name: "Cinnamon", cat: "spice", price: 7 },
  { key: "sugar", emoji: "🍬", name: "Sugar", cat: "spice", price: 4 },
  { key: "lemon", emoji: "🍋", name: "Lemon", cat: "spice", price: 5 },
  { key: "coconut", emoji: "🥥", name: "Coconut", cat: "spice", price: 9 },
  { key: "chocolate", emoji: "🍫", name: "Chocolate", cat: "spice", price: 11 },
  { key: "tea", emoji: "🍵", name: "Tea Leaves", cat: "spice", price: 8 },
];

/** Everyday recipes every kitchen knows from day one. */
export const BASIC_RECIPES = [
  { key: "basic-omelette", emoji: "🍳", name: "Fluffy Omelette", ingredients: { egg: 2, cheese: 1, butter: 1 } },
  { key: "basic-friedrice", emoji: "🍚", name: "Fried Rice", ingredients: { rice: 1, egg: 1, onion: 1, soy: 1 } },
  { key: "basic-salad", emoji: "🥗", name: "Garden Salad", ingredients: { cucumber: 1, tomato: 1, oliveoil: 1 } },
  { key: "basic-pancakes", emoji: "🥞", name: "Pancakes", ingredients: { flour: 1, egg: 1, milk: 1, sugar: 1 } },
  { key: "basic-grilledfish", emoji: "🐟", name: "Grilled Fish", ingredients: { fish: 1, lemon: 1, salt: 1 } },
  { key: "basic-soup", emoji: "🥣", name: "Veggie Soup", ingredients: { potato: 1, carrot: 1, onion: 1, garlic: 1 } },
  { key: "basic-spaghetti", emoji: "🍝", name: "Spaghetti", ingredients: { pasta: 1, tomsauce: 1, garlic: 1, basil: 1 } },
  { key: "basic-burger", emoji: "🍔", name: "Cheeseburger", ingredients: { bread: 1, beef: 1, cheese: 1, tomato: 1 } },
];

/**
 * One signature dish per touring city (keys must match touringData city
 * names exactly). The pet can bring the recipe home from a trip; Pika also
 * sells a few scrolls per store refresh.
 */
export const CITY_DISHES = {
  // USA
  "New York": "New York Cheesecake", "Los Angeles": "Street Tacos", "Chicago": "Deep-Dish Pizza",
  "San Francisco": "Clam Chowder Bread Bowl", "Seattle": "Coffee-Rubbed Salmon", "Boston": "Lobster Roll",
  "Miami": "Cuban Sandwich", "Las Vegas": "Shrimp Cocktail", "Washington DC": "Half-Smoke Hot Dog",
  "New Orleans": "Gumbo", "Houston": "BBQ Brisket", "Denver": "Denver Omelette", "San Diego": "Fish Tacos",
  "Philadelphia": "Philly Cheesesteak", "Austin": "Breakfast Tacos", "Portland": "Artisan Doughnut",
  "Nashville": "Hot Chicken", "Honolulu": "Poke Bowl", "Orlando": "Citrus Sundae", "Atlanta": "Peach Cobbler",
  "Dallas": "Chili con Carne", "Phoenix": "Sonoran Hot Dog", "Detroit": "Detroit-Style Pizza",
  "Minneapolis": "Juicy Lucy Burger", "San Antonio": "Puffy Tacos",
  // China
  "Beijing": "Peking Duck", "Shanghai": "Xiaolongbao", "Guangzhou": "Shrimp Dumplings",
  "Shenzhen": "Claypot Rice", "Chengdu": "Mapo Tofu", "Xi'an": "Biang Biang Noodles",
  "Hangzhou": "West Lake Fish", "Suzhou": "Sweet & Sour Mandarin Fish", "Nanjing": "Salted Duck",
  "Chongqing": "Spicy Hot Pot", "Wuhan": "Hot Dry Noodles", "Qingdao": "Grilled Squid",
  "Xiamen": "Oyster Omelette", "Kunming": "Crossing-the-Bridge Noodles", "Guilin": "Guilin Rice Noodles",
  "Lhasa": "Butter Tea", "Harbin": "Sweet & Sour Pork", "Sanya": "Coconut Rice", "Dali": "Fried Cheese Skewer",
  "Lijiang": "Baba Flatbread", "Hong Kong": "Egg Tarts", "Macau": "Pork Chop Bun",
  "Taipei": "Beef Noodle Soup", "Tianjin": "Steamed Pork Buns", "Changsha": "Crispy Stinky Tofu",
  // UK
  "London": "Fish and Chips", "Edinburgh": "Shortbread", "Manchester": "Full English Breakfast",
  "Liverpool": "Scouse Stew", "Oxford": "Afternoon Tea Scones", "Cambridge": "Chelsea Bun",
  "Bath": "Sally Lunn Bun", "York": "Yorkshire Pudding",
  // France
  "Paris": "Croissant", "Lyon": "Coq au Vin", "Marseille": "Bouillabaisse", "Nice": "Salade Niçoise",
  "Bordeaux": "Canelé", "Strasbourg": "Tarte Flambée", "Toulouse": "Cassoulet", "Cannes": "Ratatouille",
  // Germany
  "Berlin": "Currywurst", "Munich": "Bavarian Pretzel", "Hamburg": "Fischbrötchen",
  "Frankfurt": "Frankfurter Sausage", "Cologne": "Sauerbraten", "Dresden": "Stollen",
  "Heidelberg": "Käsespätzle", "Stuttgart": "Maultaschen",
  // Italy
  "Rome": "Carbonara", "Venice": "Squid-Ink Risotto", "Florence": "Florentine Steak",
  "Milan": "Saffron Risotto", "Naples": "Margherita Pizza", "Turin": "Gianduja Chocolate",
  "Pisa": "Cecina Pancake", "Verona": "Tortellini",
  // Japan
  "Tokyo": "Sushi Platter", "Kyoto": "Matcha Parfait", "Osaka": "Takoyaki", "Sapporo": "Miso Ramen",
  "Nara": "Mochi", "Hiroshima": "Okonomiyaki", "Fukuoka": "Tonkotsu Ramen", "Nagoya": "Miso Katsu",
  // Russia
  "Moscow": "Borscht", "Saint Petersburg": "Beef Stroganoff", "Kazan": "Chak-Chak",
  "Sochi": "Shashlik", "Vladivostok": "King Crab", "Novosibirsk": "Pelmeni",
  // Canada
  "Toronto": "Peameal Bacon Sandwich", "Vancouver": "BC Salmon Bowl", "Montreal": "Poutine",
  "Calgary": "Alberta Steak", "Ottawa": "BeaverTail Pastry", "Quebec City": "Maple Taffy",
  // Australia
  "Sydney": "Meat Pie", "Melbourne": "Avocado Toast", "Brisbane": "Grilled Barramundi",
  "Perth": "Chilli Mussels", "Adelaide": "Pie Floater", "Gold Coast": "Pavlova",
  // New Zealand
  "Auckland": "Hangi Feast", "Wellington": "Flat White & Scone", "Christchurch": "Whitebait Fritters",
  "Queenstown": "Venison Burger",
  // Mexico
  "Mexico City": "Tacos al Pastor", "Cancun": "Ceviche", "Guadalajara": "Birria",
  "Monterrey": "Grilled Cabrito", "Tulum": "Cochinita Pibil",
  // Brazil
  "Rio de Janeiro": "Feijoada", "Sao Paulo": "Pão de Queijo", "Brasilia": "Picanha BBQ",
  "Salvador": "Moqueca", "Manaus": "Tacacá Soup",
  // Egypt
  "Cairo": "Koshari", "Alexandria": "Grilled Sardines", "Luxor": "Ful Medames",
  "Aswan": "Molokhia", "Giza": "Falafel",
  // Turkey
  "Istanbul": "Doner Kebab", "Ankara": "Manti Dumplings", "Antalya": "Grilled Sea Bass",
  "Izmir": "Kumru Sandwich", "Cappadocia": "Pottery Kebab",
  // Spain
  "Madrid": "Churros con Chocolate", "Barcelona": "Tapas Platter", "Seville": "Gazpacho",
  "Valencia": "Paella", "Granada": "Tortilla Española", "Bilbao": "Pintxos",
  // Greece
  "Athens": "Moussaka", "Santorini": "Tomato Fritters", "Thessaloniki": "Bougatsa",
  "Mykonos": "Greek Salad", "Crete": "Dakos",
  // Nigeria
  "Lagos": "Jollof Rice", "Abuja": "Suya Skewers", "Kano": "Tuwo Shinkafa",
  "Ibadan": "Amala & Ewedu", "Port Harcourt": "Pepper Soup",
  // Benin
  "Cotonou": "Grilled Tilapia", "Porto-Novo": "Akassa", "Ouidah": "Peanut Stew", "Abomey": "Amiwo",
  // India
  "Delhi": "Butter Chicken", "Mumbai": "Vada Pav", "Bangalore": "Masala Dosa", "Chennai": "Idli Sambar",
  "Kolkata": "Rasgulla", "Hyderabad": "Biryani", "Jaipur": "Dal Baati", "Agra": "Petha Sweets",
  "Goa": "Goan Fish Curry", "Varanasi": "Lassi",
  // Pakistan
  "Karachi": "Nihari", "Lahore": "Chicken Karahi", "Islamabad": "Seekh Kebab", "Peshawar": "Chapli Kebab",
  // Saudi Arabia
  "Riyadh": "Kabsa", "Jeddah": "Mutabbaq", "Mecca": "Dates & Arabic Coffee", "Medina": "Harees",
  // Jordan
  "Amman": "Mansaf", "Petra": "Maqluba", "Aqaba": "Sayadieh Fish Rice",
  // UAE
  "Dubai": "Shawarma", "Abu Dhabi": "Luqaimat", "Sharjah": "Machboos",
  // South Africa
  "Cape Town": "Bobotie", "Johannesburg": "Braai Platter", "Durban": "Bunny Chow", "Pretoria": "Boerewors",
  // Kenya
  "Nairobi": "Nyama Choma", "Mombasa": "Swahili Fish Curry", "Kisumu": "Fried Tilapia",
  // South Korea
  "Seoul": "Kimchi Stew", "Busan": "Fish Cake Soup", "Incheon": "Jjajangmyeon",
  "Jeju": "Black Pork BBQ", "Daegu": "Spicy Rib Stew",
};

/**
 * Per-destination ingredient pools — a city recipe's ingredient list is
 * generated from its country's pool (see cityRecipes.js). Keys must be
 * DESTINATIONS keys; values are INGREDIENTS keys.
 */
export const CUISINE_POOLS = {
  usa: ["beef", "bacon", "cheese", "bread", "potato", "tomato", "corn", "egg"],
  china: ["rice", "noodles", "pork", "duck", "soy", "chili", "garlic", "egg"],
  uk: ["fish", "potato", "flour", "butter", "egg", "milk", "beef", "tea"],
  france: ["butter", "flour", "cheese", "cream", "mushroom", "chicken", "egg", "oliveoil"],
  germany: ["pork", "potato", "flour", "cabbage", "butter", "onion", "bacon", "cheese"],
  italy: ["pasta", "tomsauce", "cheese", "oliveoil", "basil", "garlic", "flour", "cream"],
  japan: ["rice", "fish", "salmon", "soy", "egg", "noodles", "tea", "squid"],
  russia: ["beef", "potato", "cream", "onion", "flour", "cabbage", "egg", "butter"],
  canada: ["bacon", "potato", "cheese", "salmon", "flour", "honey", "butter", "beef"],
  australia: ["beef", "flour", "fish", "egg", "avocado", "mussels", "butter", "sugar"],
  newzealand: ["lamb", "fish", "potato", "cream", "flour", "egg", "milk", "honey"],
  mexico: ["corn", "chili", "tomato", "beans", "pork", "avocado", "lemon", "onion"],
  brazil: ["beans", "pork", "rice", "cheese", "beef", "coconut", "fish", "garlic"],
  egypt: ["rice", "beans", "tomato", "onion", "garlic", "fish", "flour", "lemon"],
  turkey: ["lamb", "flour", "tomato", "onion", "chili", "fish", "cucumber", "garlic"],
  spain: ["rice", "tomato", "oliveoil", "shrimp", "garlic", "potato", "egg", "chocolate"],
  greece: ["oliveoil", "tomato", "cheese", "cucumber", "lamb", "onion", "flour", "honey"],
  nigeria: ["rice", "tomato", "chili", "beef", "onion", "fish", "corn", "garlic"],
  benin: ["corn", "fish", "tomato", "chili", "onion", "beans", "rice", "garlic"],
  india: ["curry", "rice", "chicken", "flour", "milk", "chili", "beans", "sugar"],
  pakistan: ["lamb", "curry", "flour", "onion", "chili", "rice", "garlic", "beef"],
  saudi: ["rice", "lamb", "chicken", "cinnamon", "flour", "honey", "onion", "sugar"],
  jordan: ["lamb", "rice", "cream", "onion", "fish", "garlic", "cinnamon", "lemon"],
  uae: ["chicken", "rice", "flour", "honey", "cinnamon", "sugar", "lamb", "onion"],
  southafrica: ["beef", "curry", "bread", "egg", "onion", "corn", "lamb", "tomato"],
  kenya: ["beef", "fish", "corn", "tomato", "curry", "onion", "coconut", "chili"],
  southkorea: ["rice", "pork", "chili", "cabbage", "noodles", "fish", "soy", "garlic"],
};

/** The ten paw-bot slots, in unlock order. First START_BOTS come free. */
export const BOT_NAMES = ["Chip", "Bolt", "Gizmo", "Sprocket", "Pixel", "Widget", "Beep", "Ratchet", "Dynamo", "Turbo"];

/** Paw-bots unlocked when the kitchen opens. */
export const START_BOTS = 2;

/** Total paw-bot slots. */
export const MAX_BOTS = 10;

/** Coins to unlock bot #3, #4, … #10 (index 0 = the 3rd bot). */
export const BOT_PRICES = [800, 2000, 4500, 8000, 15000, 25000, 40000, 60000];

/** Pets who phone in orders — one per animal FACE emoji. Each: {name,
 * emoji}. Names stay untranslated. */
export const CUSTOMERS = [
  { name: "Rex", emoji: "🐶" }, { name: "Whiskers", emoji: "🐱" }, { name: "Cheddar", emoji: "🐭" },
  { name: "Nibbles", emoji: "🐹" }, { name: "Clover", emoji: "🐰" }, { name: "Rusty", emoji: "🦊" },
  { name: "Bruno", emoji: "🐻" }, { name: "Bamboo", emoji: "🐼" }, { name: "Snowy", emoji: "🐻‍❄️" },
  { name: "Koko", emoji: "🐨" }, { name: "Stripe", emoji: "🐯" }, { name: "Leo", emoji: "🦁" },
  { name: "Moo", emoji: "🐮" }, { name: "Truffle", emoji: "🐷" }, { name: "Ribbit", emoji: "🐸" },
  { name: "Momo", emoji: "🐵" }, { name: "Luna", emoji: "🐺" }, { name: "Tusk", emoji: "🐗" },
  { name: "Star", emoji: "🐴" }, { name: "Sparkle", emoji: "🦄" },
];

/** Orders on the board per 3-hour refresh. */
export const ORDER_COUNT = 10;
/** Chance per visited city that the pet brings its recipe home. */
export const RECIPE_DROP_CHANCE = 0.2;
/** Chance per finished delivery that the bot finds a Training Manual. */
export const BOOK_DROP_CHANCE = 0.15;
/** Recipe scrolls in Pika's shop per store refresh. */
export const PIKA_RECIPE_OFFERS = 2;
/** Recipe scroll price: base + random 0..VAR. */
export const RECIPE_PRICE_BASE = 300;
export const RECIPE_PRICE_VAR = 200;
/** Game-minutes to cook a basic / city recipe, and to deliver an order. */
export const BASIC_COOK_MINUTES = 10;
export const CITY_COOK_MINUTES = 20;
export const DELIVER_MINUTES = 15;
