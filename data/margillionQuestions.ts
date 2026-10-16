export type Question = {
  id: string; prompt: string; answer: number; unit: string;
  category: string; difficulty: 1 | 2 | 3; fact: string; source?: string;
};

// Frozen v1 bank. Change the bank version before changing answers or IDs.
const earth = "https://science.nasa.gov/earth/facts/";
const nba = "https://official.nba.com/rule-no-1-court-dimensions-equipment/";
const nist = "https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b9";
const hand = "https://www.ncbi.nlm.nih.gov/books/NBK547684/";
const q = (id: string, category: string, difficulty: 1 | 2 | 3, prompt: string, answer: number, unit: string, fact: string, source?: string): Question => ({ id, category, difficulty, prompt, answer, unit, fact, source });
export const BANK_VERSION = 1;
export const questions: readonly Question[] = [
  q("tokyo", "Geography", 2, "Tokyo’s latitude, in degrees north?", 35.7, "° north", "Tokyo sits roughly 36 degrees north of the equator.", "https://www.gsi.go.jp/ENGLISH/page_e30030.html"),
  q("london-paris", "Geography", 2, "London to Paris, as the crow flies?", 214, "miles", "City centre to city centre, the straight-line trip is about 214 miles.", "https://mapgo.io/distance-between/london-to-paris"),
  q("denver", "Geography", 1, "The elevation behind Denver’s ‘Mile High’ nickname?", 5280, "feet", "One mile is 5,280 feet, marked on the Colorado State Capitol steps.", "https://www.denver.org/about-denver/denver-resources/denver-glance/"),
  q("africa", "Geography", 1, "African countries that are UN members?", 54, "countries", "The UN’s African Group contains 54 member countries.", "https://ask.un.org/faq/22882"),
  q("ocean", "Geography", 1, "Earth’s surface covered by ocean?", 71, "%", "Ocean covers about seven tenths of our planet.", earth),
  q("titanic", "Cinema", 2, "Running time of Titanic (1997), including credits?", 194, "minutes", "The original film runs 3 hours and 14 minutes.", "https://ir.paramount.com/news-releases/news-release-details/experience-james-camerons-epic-masterpiece-never-when-titanic"),
  q("piano", "Culture", 1, "Keys on a standard grand piano?", 88, "keys", "A standard keyboard spans 88 notes.", "https://www.yamaha.com/en/musical_instrument_guide/piano/"),
  q("hoop", "Sport", 1, "Height of an NBA rim above the floor?", 120, "inches", "Ten feet of air sits beneath the rim.", nba),
  q("playstation", "Culture", 1, "Japan’s original PlayStation launch year: last two digits?", 94, "year · last 2 digits", "The first PlayStation launched in Japan in December 1994.", "https://www.playstation.com/en-us/playstation-history/1994-ps-one/"),
  q("breaking-bad", "Television", 2, "Episodes in the complete Breaking Bad series?", 62, "episodes", "Walter White’s story unfolds across 62 episodes.", "https://thebeneluxspehub.sonypictures.com/sites/benelux/files/2023-02/Emmys%20Benelux.pdf"),
  q("hand", "Anatomy", 1, "Bones in one adult hand, including the wrist?", 27, "bones", "Eight wrist bones, five palm bones and fourteen finger bones add up to 27.", hand),
  q("everest-boil", "Science", 3, "Water’s approximate boiling point at Everest’s summit?", 70, "°C", "Thin air lowers the boiling point to roughly 70°C; weather changes it.", "https://www.metlink.org/experiment_topic/air-pressure/"),
  q("sound", "Physics", 3, "Speed of sound in dry air at about 20°C?", 767, "mph", "At room temperature, sound travels about 343 metres each second.", "https://www.jpl.nasa.gov/news/what-sounds-captured-by-nasas-perseverance-rover-reveal-about-mars/"),
  q("elephant", "Science", 2, "Average African elephant pregnancy?", 22, "months", "An elephant calf spends nearly two years developing before birth.", "https://sandiegozoowildlifealliance.org/story-hub/2018/08/14/baby-elephant-born-world-elephant-day"),
  q("nitrogen", "Science", 1, "Nitrogen’s share of Earth’s dry atmosphere, approximately?", 78, "%", "Nitrogen makes up about 78% of the air near sea level.", earth),
  q("gold", "Engineering", 3, "Weight of a standard Fort Knox gold bar, approximately?", 27.5, "pounds", "A standard bar weighs roughly 400 troy ounces.", "https://www.usmint.gov/about/tours-and-locations/fort-knox"),
  q("boeing", "Engineering", 3, "Boeing 747-400 wingspan, to the nearest foot?", 211, "feet", "Its wing tips are about 211 feet 5 inches apart.", "https://www.boeing.com/content/dam/boeing/v2/airports/acaps/747-400_Rev_F.pdf"),
  q("bigmac", "Everyday", 2, "Calories listed for a US Big Mac (October 2026)?", 580, "kcal", "The US menu lists 580 calories; recipes and regional menus differ.", "https://www.mcdonalds.com/us/en-us/product/big-mac.html"),
  q("golf", "Sport", 3, "Dimples on the 2024 Vice Pro Plus golf ball?", 336, "dimples", "This model has 336 dimples; golf rules do not set one universal count.", "https://www.usga.org/conforminggolfball/gball_list.pdf"),
  q("court", "Sport", 2, "Length of an NBA court, baseline to baseline?", 94, "feet", "The regulation playing rectangle measures 94 by 50 feet.", nba),
  q("court-width", "Sport", 1, "Width of an NBA court?", 50, "feet", "The court is 50 feet across between its sidelines.", nba),
  q("marathon", "Sport", 2, "Official marathon distance?", 42.195, "km", "A marathon stretches 42.195 kilometres from start to finish.", "https://worldathletics.org/disciplines/relays/marathon"),
  q("liberty", "Engineering", 3, "Statue of Liberty, ground to torch tip, nearest foot?", 305, "feet", "The statue and pedestal together rise 305 feet and 1 inch.", "https://www.nps.gov/stli/learn/statue-of-liberty-facts.htm"),
  q("bridge", "Engineering", 3, "Golden Gate Bridge’s main span between its two towers?", 4200, "feet", "The suspended centre span stretches 4,200 feet.", "https://www.goldengate.org/bridge/history-research/statistics-data/design-construction-stats/"),
  q("canyon", "Geography", 3, "Grand Canyon’s length along the Colorado River?", 277, "miles", "The canyon runs from Lees Ferry to the Grand Wash Cliffs.", "https://www.nps.gov/grca/planyourvisit/directions.htm"),
  q("oxygen", "Science", 1, "Oxygen’s approximate share of Earth’s dry atmosphere?", 21, "%", "Oxygen accounts for about one fifth of the air.", earth),
  q("earth-diameter", "Geography", 3, "Earth’s diameter at the equator, approximately?", 12756, "km", "Earth is slightly wider at its equator than through its poles.", earth),
  q("sunlight", "Science", 2, "Sunlight’s journey to Earth, approximately?", 8, "minutes", "Light takes about eight minutes to cross from the Sun to Earth.", earth),
  q("mars-radius", "Science", 3, "Average radius of Mars, approximately?", 3390, "km", "Mars has roughly half Earth’s radius.", "https://science.nasa.gov/resource/solar-system-sizes/"),
  q("jupiter-radius", "Science", 3, "Average radius of Jupiter, approximately?", 69911, "km", "Jupiter’s mean radius is about eleven times Earth’s.", "https://science.nasa.gov/resource/solar-system-sizes/"),
  q("carpals", "Anatomy", 2, "Carpal bones in one adult wrist?", 8, "bones", "The eight carpals form two rows at the base of the hand.", hand),
  q("phalanges", "Anatomy", 2, "Finger bones in one hand, including the thumb?", 14, "bones", "Four fingers have three each; the thumb has two.", hand),
  q("inch", "Everyday", 1, "Centimetres in one inch?", 2.54, "cm", "An international inch is exactly 2.54 centimetres.", nist),
  q("gallon", "Everyday", 2, "Litres in one US liquid gallon, approximately?", 3.785, "litres", "A US liquid gallon holds about 3.785 litres.", nist),
  q("mile", "Everyday", 2, "Metres in one international mile, approximately?", 1609.344, "metres", "A mile contains 1,760 yards.", nist),
  q("foot", "Everyday", 1, "Centimetres in one international foot?", 30.48, "cm", "Twelve inches make exactly 30.48 centimetres.", nist),
  q("pizza", "Everyday math", 1, "How much more area does a 16-inch pizza have than a 12-inch pizza?", 77.8, "% more", "Area follows diameter squared: (16² ÷ 12² − 1) × 100 ≈ 77.8%."),
  q("coffee", "Everyday math", 1, "A $4.50 coffee every day for a 365-day year costs?", 1642.5, "dollars", "Multiply $4.50 by 365: small daily spending adds up."),
  q("tip", "Everyday math", 1, "An $86 bill plus a 20% tip: total?", 103.2, "dollars", "The tip is $17.20, bringing the total to $103.20."),
  q("drive", "Everyday math", 2, "At a steady 65 mph, time to travel 150 miles?", 138.5, "minutes", "150 ÷ 65 × 60 gives about 138.5 minutes."),
  q("tank", "Engineering", 2, "Water in a rectangular 60 × 30 × 40 cm tank, filled to the brim?", 72, "litres", "72,000 cubic centimetres hold 72 litres."),
  q("battery", "Engineering", 2, "A 60 Wh battery powering a constant 8 W device lasts?", 7.5, "hours", "Under ideal conditions, watt-hours divided by watts gives hours."),
  q("pixels", "Engineering", 3, "Pixels in a 1920 × 1080 image, in millions?", 2.0736, "million pixels", "Multiply width by height: 2,073,600 pixels."),
  q("savings", "Everyday math", 3, "A $1,000 balance growing 5% yearly for 10 years, no deposits?", 1628.9, "dollars", "Compounding gives $1,000 × 1.05¹⁰ ≈ $1,628.90."),
  q("wheel", "Engineering", 3, "Distance a 70 cm diameter wheel travels in 100 full turns?", 219.9, "metres", "Circumference is π × diameter; 100 turns cover about 219.9 metres."),
];
