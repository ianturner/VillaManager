#!/usr/bin/env node
/**
 * Adds Italian translations to villa_janoula data.json.
 * Run from repo root: node scripts/translate-villa-janoula-it.js
 */
const fs = require("fs");
const path = require("path");

const dataPath = path.join(__dirname, "../data/properties/villa_janoula/data.json");
const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));

// English -> Italian map (from English value in data)
const itMap = {
  "Interior": "Interni",
  "Living Room": "Soggiorno",
  "Bedroom and laundry": "Camera da letto e bucato",
  "Entertainment": "Intrattenimento",
  "Kitchen and dining": "Cucina e sala da pranzo",
  "Outdoor": "Esterno",
  "Pool": "Piscina",
  "Desk": "Scrivania",
  "Towels": "Asciugamani",
  "Family": "Famiglia",
  "Kettle": "Bollitore",
  "Kitchen": "Cucina",
  "Gardens": "Giardini",
  "Beaches": "Spiagge",
  "Website": "Sito web",
  "Bikakis": "Bikakis",
  "General": "Generale",
  "Toaster": "Tostapane",
  "Bedrooms": "Camere da letto",
  "Facebook": "Facebook",
  "Bathroom": "Bagno",
  "Services": "Servizi",
  "Day trips": "Gite di un giorno",
  "Wikipedia": "Wikipedia",
  "Microwave": "Microonde",
  "Large BBQ": "Grande barbecue",
  "Spinalonga": "Spinalonga",
  "Hair dryer": "Asciugacapelli",
  "High chair": "Seggiolone",
  "Dishwasher": "Lavastoviglie",
  "Restaurants": "Ristoranti",
  "TripAdvisor": "TripAdvisor",
  "Home safety": "Sicurezza in casa",
  "Halogen hob": "Piano cottura alogeno",
  "Roof Terrace": "Terrazza sul tetto",
  "Supermarkets": "Supermercati",
  "Visit Klados": "Visita Klados",
  "Coffee maker": "Macchina per caffè",
  "Wine glasses": "Bicchieri da vino",
  "Dining table": "Tavolo da pranzo",
  "BBQ utensils": "Utensili per barbecue",
  "Beach towels": "Asciugamani da spiaggia",
  "Facebook Page": "Pagina Facebook",
  "Klados Winery": "Cantina Klados",
  "Melidoni Cave": "Grotta di Melidoni",
  "Laptop stands": "Supporti per laptop",
  "First aid kit": "Kit di pronto soccorso",
  "Front-Of-House": "Reception",
  "Morning Coffee": "Caffè del mattino",
  "Outdoor Dining": "Pranzo all'aperto",
  "Pool & Terrace": "Piscina e terrazza",
  "Avli, Rethymno": "Avli, Rethymno",
  "Changing table": "Fasciatoio",
  "Eye level oven": "Forno ad altezza occhi",
  "Fridge Freezer": "Frigorifero con freezer",
  "Cooking basics": "Base per cucinare",
  "Outdoor shower": "Doccia esterna",
  "In the Locality": "Nella zona",
  "Washing machine": "Lavatrice",
  "Clothes hangers": "Grucce",
  "External screen": "Monitor esterno",
  "Pool/beach toys": "Giochi per piscina/spiaggia",
  "Skepasti Taverna": "Taverna Skepasti",
  "Arkadi Monastery": "Monastero di Arkadi",
  "Air conditioning": "Aria condizionata",
  "Sandwich Toaster": "Tostapane per panini",
  "Cooking utensils": "Utensili da cucina",
  "O'Makis, Panormos": "O'Makis, Panormos",
  "Kapilio, Rethymno": "Kapilio, Rethymno",
  "Rethymno Old Town": "Centro storico di Rethymno",
  "Yes, this is real": "Sì, è vero",
  "Quality bed linen": "Biancheria da letto di qualità",
  "Kitchen and dining": "Cucina e sala da pranzo",
  "Dishes and cutlery": "Piatti e posate",
  "Baking sheets/pans": "Teglie e stampi",
  "Homemade olive oil": "Olio d'oliva fatto in casa",
  "Geronymos, Panormos": "Geronymos, Panormos",
  "Georgioupolis Beach": "Spiaggia di Georgioupolis",
  "Bali - Livadi Beach": "Bali - Spiaggia di Livadi",
  "Internet and office": "Internet e ufficio",
  "Ethernet connection": "Connessione Ethernet",
  "Heating and cooling": "Riscaldamento e raffrescamento",
  "Outdoor dining area": "Area pranzo all'aperto",
  "Akrogiali, Rethymnon": "Akrogiali, Rethymno",
  "Bali (Old Port) Beach": "Bali (Spiaggia del vecchio porto)",
  "Lemonokipos, Rethymno": "Lemonokipos, Rethymno",
  "Prima Plora, Rethymno": "Prima Plora, Rethymno",
  "The Palace of Knossos": "Il Palazzo di Cnosso",
  "Bath, with shower over": "Vasca con doccia soprastante",
  "GHD hair straighteners": "Piastra per capelli GHD",
  "Iron and ironing board": "Ferro e asse da stiro",
  "Blender/Smoothie Maker": "Frullatore per smoothie",
  "Parking and facilities": "Parcheggio e servizi",
  "Directions from Chania": "Indicazioni da Chania",
  "Bali - Karvostasi Beach": "Bali - Spiaggia di Karvostasi",
  "Bali - Varkotopos Beach": "Bali - Spiaggia di Varkotopos",
  "Corner - Roadside Gyros": "Angolo - Gyros da strada",
  "Long-term stays allowed": "Soggiorni lunghi consentiti",
  "Perfect for evening BBQs": "Perfetto per barbecue serali",
  "A \"skepasti\" style gyros": "Gyros in stile \"skepasti\"",
  "Tumble dryer (condenser)": "Asciugatrice a condensazione",
  "Outdoor lounge furniture": "Mobili per soggiorno esterno",
  "Luggage drop-off allowed": "Deposito bagagli consentito",
  "Wifi with range extenders": "WiFi con ripetitori",
  "Self check-in via lockbox": "Check-in autonomo con cassetta chiavi",
  "Directions from Heraklion": "Indicazioni da Heraklion",
  "Paraplous, Pigianos Kampos": "Paraplous, Pigianos Kampos",
  "DVD player and DVD library": "Lettore DVD e raccolta DVD",
  "Sun loungers and umbrellas": "Lettini e ombrelloni",
  "Books and reading materials": "Libri e materiale di lettura",
  "Private upstairs sun terrace": "Terrazza sole privata al piano superiore",
  "Xbox Games console and games": "Console Xbox e giochi",
  "Bluetooth keyboard and mouse": "Tastiera e mouse Bluetooth",
  "Private outdoor pool (32 m²)": "Piscina esterna privata (32 m²)",
  "Elafonisi, Southwest Crete": "Elafonisi, Creta sudoccidentale",
  "Elafonisi is stunning and safe": "Elafonisi è splendida e sicura",
  "Afternoon Shade, Evening Lounge": "Ombra pomeridiana, soggiorno serale",
  "Skepasti, Rethymno, Crete, Greece": "Skepasti, Rethymno, Creta, Grecia",
  "Property manager available nearby": "Responsabile di proprietà disponibile nelle vicinanze",
  "Private rear garden – fully fenced": "Giardino posteriore privato – completamente recintato",
  "Stunning 180 degree mountain views": "Vista mozzafiato a 180 gradi sulle montagne",
  "Detached villa with private entrance": "Villa indipendente con ingresso privato",
  "Extra pillows and blankets available": "Cuscini e coperte extra disponibili",
  "Extra cleaning by negotiation (paid)": "Pulizie extra su richiesta (a pagamento)",
  "Clothes drying racks and clothes line": "Stendibiancheria e corda per il bucato",
  "Driveway parking on premises – 3 spaces": "Parcheggio in vialetto – 3 posti",
  "Solar heated hot water with mains backup": "Acqua calda solare con backup dalla rete",
  "Room-darkening and secure exterior blinds": "Tende esterne oscuranti e sicure",
  "Clothes storage: wardrobe and chest of drawers in each bedroom": "Ripostiglio: armadio e comò in ogni camera",
  "LG Smart HDTV with apps including AppleTV, Amazon Prime Video, Netflix": "TV LG Smart HDTV con app tra cui Apple TV, Amazon Prime Video, Netflix",
  "Stay cool, watch those enjoying the pool": "Rimanete al fresco e guardate chi si gode la piscina",
  "Nothing tastes as good as food in the open air": "Niente è buono come mangiare all'aperto",
  "Crete has many many beaches, here are some you might enjoy.": "Creta ha tantissime spiagge; eccone alcune che potreste apprezzare.",
  "The monastery contains an ancient, but still working, chapel": "Il monastero contiene una cappella antica ma ancora in uso",
  "Arkadi offers natural beauty and a place for quiet contemplation": "Arkadi offre bellezza naturale e un luogo per la contemplazione",
  "Property manager available nearby": "Responsabile di proprietà disponibile nelle vicinanze",
  "Το Καπηλειό": "Το Καπηλειό",
  "Balos on CretanBeaches.com": "Balos su CretanBeaches.com",
  "Elafonisi on CretanBeaches.com": "Elafonisi su CretanBeaches.com",
  "Ministry of Culture Website": "Sito del Ministero della Cultura",
  "Taverna Geronymos - TripAdvisor": "Taverna Geronymos - TripAdvisor",
  "Mambo Sea Side Restaurant, Bali": "Ristorante Mambo Sea Side, Bali",
  "The view to Balos from Gramvousa": "La vista di Balos da Gramvousa",
  "Elafonisi is simply breathtaking": "Elafonisi è semplicemente mozzafiato",
  "Arkadi Fish Tavern, Georgioupolis": "Taverna di pesce Arkadi, Georgioupolis",
  "The crystal clear waters at Balos": "Le acque cristalline di Balos",
  "Zisi's Taverna, Missiria, Rethymno": "Taverna di Zisi, Missiria, Rethymno",
  "Balos has miles of beach to explore": "Balos ha chilometri di spiaggia da esplorare",
  "The outdoor table is shaded at lunch": "Il tavolo esterno è all'ombra a pranzo",
  "Indigo also has rooms on Booking.com": "Indigo ha anche camere su Booking.com",
  "Almyriki Restaurant, Stavros, Chania": "Ristorante Almyriki, Stavros, Chania",
  "There are 300 cats and kittens hiding here!": "Ci sono 300 gatti e gattini nascosti qui!",
  "\"The Island\" on GoodReads": "\"The Island\" su GoodReads",
  "The famous Venetian mansion doorway at Amnatos, adjoining the Meze Taverna": "Il famoso portone della villa veneziana ad Amnatos, accanto alla Taverna Meze",
  "On way from airport this place does amazing Gyros and it's open really late": "Sulla strada dall'aeroporto questo locale fa gyros fantastici ed è aperto fino a tardi",
  "It's not uncommon to find a goat perched on your car if you drive all the way th...": "Non è raro trovare una capra sulla vostra auto se percorrete tutta la strada...",
  "Listed from closest to the villa to furthest away. We've eaten in them all, reco...": "Elenco dal più vicino alla villa al più lontano. Li abbiamo provati tutti, consi...",
  "Right next to the marvellous bakery in Perama, this supermarket stocks a wide ra...": "Accanto alla splendida panetteria di Perama, questo supermercato ha una vasta scelta...",
  "The villa has a fully equipped kitchen, and there are a range of supermarkets an...": "La villa ha una cucina completamente attrezzata e ci sono vari supermercati e...",
  "Adjacent to the Old Port of Bali, this beach is slightly larger than Karavostasi...": "Adiacente al vecchio porto di Bali, questa spiaggia è leggermente più grande di Karavostasi...",
  "Ten minutes walk or two minutes drive into the village, Chara's offers the daily...": "A dieci minuti a piedi o due in auto dal villaggio, Chara's offre la spesa quotidian...",
  "Open from 8:00am until 10:00pm, Kalligiannis, on the edge of Roumeli, across the...": "Aperto dalle 8:00 alle 22:00, Kalligiannis, ai margini di Roumeli, dall'altra parte...",
  "Good food at reasonable prices on Rethymno's seafront, with an awesome sunset, a...": "Buon cibo a prezzi ragionevoli sul lungomare di Rethymno, con un tramonto magnifico...",
  "On the edge of a traditional Greek village, surrounded by olive groves and mount...": "Ai margini di un tradizionale villaggio greco, circondata da uliveti e montagne...",
  "Villa Janoula aims to create home-from-home comfort, with thoughtful touches throughout. The villa sleeps up to 6 adults in 3 bedrooms, but also offers a sofa bed in the living room.": "Villa Janoula offre il comfort di una casa lontano da casa, con tocchi premurosi ovunque. La villa può ospitare fino a 6 adulti in 3 camere da letto e dispone anche di un divano letto nel soggiorno.",
  "Relax the moment you walk through the door in a welcoming, comfortable living space. The living rom provides a large L-shaped sofa with a separate three-seater sofa.\n\nEntertainment is provided by an LG Smart TV with the usual apps - Netflix, Amazon Prime Video, Apple TV, YouTube and others downloadable from the LG app store. Remember to sign out of any apps before you leave.  \n\nWe also have a DVD player and an extensive DVD library, and a now-vintage original XBox and plenty of games. We have a wooden chess and backgammon board (backgammon, or \"tavlee\" is the Greek national sport!) and card games (with poker chips, if you're feeling competitive).\n\nThere are a range of books to read, on a take-one, leave-one basis: don't worry if you haven't finished a book by the end of your holiday, you can take it with you.\n\nThe wifi signal is reliable, and since Greek houses have to be built with lots of supporting steel, there are numerous wifi range extenders plugged in throughout the house, to help the signal.": "Rilassatevi nel momento in cui varcate la porta in un accogliente e comodo spazio living. Il soggiorno dispone di un grande divano a L e di un divano a tre posti separato.\n\nL'intrattenimento è assicurato da un TV LG Smart con le solite app: Netflix, Amazon Prime Video, Apple TV, YouTube e altre scaricabili dallo store LG. Ricordatevi di uscire da tutte le app prima di partire.\n\nC'è anche un lettore DVD e una vasta raccolta di DVD, oltre a una Xbox originale ormai vintage e molti giochi. Troverete una scacchiera e un tavoliere per il backgammon in legno (il backgammon, o \"tavlee\", è lo sport nazionale greco!) e giochi di carte (con fiches da poker, se vi sentite competitivi).\n\nC'è una scelta di libri da leggere, con la regola \"prendine uno, lasciane uno\": non preoccupatevi se non avete finito un libro alla fine della vacanza, potete portarlo con voi.\n\nIl segnale wifi è affidabile e, poiché le case greche devono essere costruite con molto acciaio di sostegno, in tutta la casa sono collegati numerosi ripetitori wifi per migliorare il segnale.",
};

function isLocalizedString(obj) {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return false;
  const keys = Object.keys(obj).sort().join(",");
  return keys === "de,el,en,fr,it";
}

function applyTranslations(obj) {
  if (!obj) return;
  if (Array.isArray(obj)) {
    obj.forEach(applyTranslations);
    return;
  }
  if (typeof obj === "object") {
    if (isLocalizedString(obj) && obj.en !== undefined) {
      const translated = itMap[obj.en];
      if (translated !== undefined) {
        obj.it = translated;
      }
    }
    Object.values(obj).forEach(applyTranslations);
  }
}

applyTranslations(data);
fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), "utf8");
console.log("Applied Italian translations to villa_janoula data.json");
