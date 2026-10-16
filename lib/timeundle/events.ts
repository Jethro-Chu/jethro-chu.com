export type Category = "History" | "Inventions" | "Movies" | "Technology" | "Internet" | "Space";
export interface TimelineEvent {
  id: string;
  title: string;
  year: number;
  category: Category;
  fact: string;
  source: string;
}

// Frozen v1 bank, researched 2026-10-16. Never edit/reorder this bank in place:
// new content or corrections require a new version with a future UTC activation date.
const pixar = "https://www.pixar.com/our-story";
const nasa = "https://www.nasa.gov/specials/timeline/";
const nintendo = "https://www.nintendo.com/us/about/";
const cern = "https://home.cern/science/computing/the-birth-of-the-web/short-history-web/";
export const EVENTS_V1: readonly TimelineEvent[] = [
  { id: "declaration", title: "The US adopts the Declaration of Independence", year: 1776, category: "History", fact: "Congress adopted it on July 4. Most delegates signed the engrossed copy in August.", source: "https://www.archives.gov/milestone-documents/declaration-of-independence" },
  { id: "constitution", title: "The US Constitution is signed", year: 1787, category: "History", fact: "Delegates signed in Philadelphia after a convention called to revise the Articles of Confederation.", source: "https://www.archives.gov/milestone-documents/constitution" },
  { id: "morse", title: "Morse demonstrates the Washington–Baltimore telegraph line", year: 1844, category: "Inventions", fact: "The message was the biblical phrase ‘What hath God wrought?’", source: "https://www.loc.gov/item/mcc.019/" },
  { id: "railroad", title: "The first US transcontinental railroad is completed", year: 1869, category: "History", fact: "The final spike joined the railroads at Promontory Summit, Utah.", source: "https://www.nps.gov/articles/goldenspike.htm" },
  { id: "telephone", title: "Bell receives his telephone patent", year: 1876, category: "Inventions", fact: "The patent came on March 7, three days before his famous call to Thomas Watson.", source: "https://www.loc.gov/everyday-mysteries/categories/technology/item/who-is-credited-with-inventing-the-telephone/" },
  { id: "phonograph", title: "Edison receives his phonograph patent", year: 1878, category: "Inventions", fact: "The patent for his sound-recording machine was issued on February 19.", source: "https://www.loc.gov/collections/edison-company-motion-pictures-and-sound-recordings/articles-and-essays/history-of-edison-sound-recordings/history-of-the-cylinder-phonograph/" },
  { id: "liberty", title: "The Statue of Liberty is dedicated", year: 1886, category: "History", fact: "The dedication in New York Harbor took place on October 28.", source: "https://www.nps.gov/stli/learn/statue-of-liberty-facts.htm" },
  { id: "eiffel", title: "The Eiffel Tower welcomes its first visitors", year: 1889, category: "History", fact: "Almost 30,000 visitors climbed its stairs in the first week.", source: "https://www.toureiffel.paris/en/news/130-years/1889-2019-130-years-amazement" },
  { id: "nintendo-cards", title: "Nintendo begins making playing cards", year: 1889, category: "Technology", fact: "Its story started with handmade hanafuda cards in Kyoto, long before video games.", source: nintendo },
  { id: "wright", title: "The Wright brothers make their first powered flights", year: 1903, category: "Inventions", fact: "Orville’s first flight lasted 12 seconds and covered 120 feet.", source: "https://www.nps.gov/articles/wrightflyer.htm" },
  { id: "golden-gate", title: "The Golden Gate Bridge opens to pedestrians", year: 1937, category: "History", fact: "Pedestrians crossed on May 27. Vehicles followed the next day.", source: "https://www.goldengate.org/bridge/history-research/moments-events/key-dates/" },
  { id: "nasa", title: "NASA opens for business", year: 1958, category: "Space", fact: "The agency began operating on October 1, following legislation signed in July.", source: nasa },
  { id: "tiros", title: "TIROS 1, the first weather satellite, launches", year: 1960, category: "Space", fact: "It operated for 78 days, showing that cloud patterns could be monitored from orbit.", source: nasa },
  { id: "shepard", title: "Alan Shepard becomes the first American in space", year: 1961, category: "Space", fact: "His suborbital trip took just 15 minutes.", source: nasa },
  { id: "earthrise", title: "Apollo 8 photographs Earthrise", year: 1968, category: "Space", fact: "The crew captured Earth from lunar orbit on Christmas Eve.", source: nasa },
  { id: "moon", title: "Apollo 11 lands humans on the Moon", year: 1969, category: "Space", fact: "Armstrong and Aldrin explored the surface while Collins remained in lunar orbit.", source: "https://www.nasa.gov/mission/apollo-11/" },
  { id: "skylab", title: "Skylab launches", year: 1973, category: "Space", fact: "It was the United States’ first space station.", source: nasa },
  { id: "viking", title: "Viking 1 lands on Mars", year: 1976, category: "Space", fact: "The lander touched down on July 20, opening a new chapter in Mars exploration.", source: nasa },
  { id: "game-watch", title: "Nintendo starts selling Game & Watch", year: 1980, category: "Technology", fact: "The pocket-sized product line preceded the Game Boy.", source: nintendo },
  { id: "donkey-kong", title: "Donkey Kong arrives in arcades", year: 1981, category: "Technology", fact: "Nintendo’s coin-operated game became a major arcade hit.", source: nintendo },
  { id: "mac", title: "Apple launches the Macintosh in the US", year: 1984, category: "Technology", fact: "MacPaint and MacWrite came with the mouse-driven computer.", source: "https://www.computerhistory.org/timeline/1984/" },
  { id: "nes", title: "The NES launches in America", year: 1985, category: "Technology", fact: "Nintendo’s home console helped rebuild the American video game market.", source: nintendo },
  { id: "gameboy", title: "The original Game Boy launches", year: 1989, category: "Technology", fact: "Its portable format made Tetris a handheld phenomenon.", source: nintendo },
  { id: "web-proposal", title: "Tim Berners-Lee proposes the World Wide Web", year: 1989, category: "Internet", fact: "The original proposal aimed to connect information for scientists at CERN.", source: cern },
  { id: "hubble", title: "Hubble is deployed into orbit", year: 1990, category: "Space", fact: "A space shuttle crew deployed the telescope on April 25.", source: nasa },
  { id: "web-announcement", title: "The Web is announced on internet newsgroups", year: 1991, category: "Internet", fact: "Berners-Lee’s August announcement brought the project to an audience beyond CERN.", source: cern },
  { id: "snes", title: "The Super Nintendo launches in the US", year: 1991, category: "Technology", fact: "Nintendo’s next home system moved from 8-bit to 16-bit hardware.", source: nintendo },
  { id: "free-web", title: "CERN makes Web software freely available", year: 1993, category: "Internet", fact: "The April 30 release let anyone use and develop the technology without royalties.", source: cern },
  { id: "toy-story", title: "Toy Story opens in US theaters", year: 1995, category: "Movies", fact: "It was the first fully computer-animated feature film.", source: pixar },
  { id: "n64", title: "The Nintendo 64 launches in the US", year: 1996, category: "Technology", fact: "Super Mario 64 launched alongside it on September 29.", source: nintendo },
  { id: "google", title: "Google incorporates as a company", year: 1998, category: "Internet", fact: "The incorporation date is September 4, even though its birthday has been celebrated on other dates.", source: "https://blog.google/company-news/inside-google/company-announcements/marking-20ish-years-google/" },
  { id: "bugs-life", title: "A Bug’s Life opens in US theaters", year: 1998, category: "Movies", fact: "Its theatrical companion was the short Geri’s Game.", source: pixar },
  { id: "toy-story-2", title: "Toy Story 2 opens in US theaters", year: 1999, category: "Movies", fact: "The sequel was accompanied by a rerelease of the short Luxo Jr.", source: pixar },
  { id: "wikipedia", title: "Wikipedia launches", year: 2001, category: "Internet", fact: "The encyclopedia went online on January 15 with a vision of freely shared knowledge.", source: "https://wikimediafoundation.org/news/2016/01/14/wikipedia-15-foundation-endowment/" },
  { id: "monsters", title: "Monsters, Inc. opens in US theaters", year: 2001, category: "Movies", fact: "The film arrived on November 2 with the short For the Birds.", source: pixar },
  { id: "nemo", title: "Finding Nemo opens in US theaters", year: 2003, category: "Movies", fact: "Its theatrical release included a remastered version of Knick Knack.", source: pixar },
  { id: "gmail", title: "Gmail launches its public preview", year: 2004, category: "Internet", fact: "Its April Fool’s Day announcement really did offer a gigabyte of email storage.", source: "https://googlepress.blogspot.com/2004/04/google-gets-message-launches-gmail.html" },
  { id: "youtube", title: "YouTube’s first video is uploaded", year: 2005, category: "Internet", fact: "Me at the Zoo introduced the site with a brief visit to the elephants.", source: "https://blog.youtube/news-and-events/youtube-to-z-happybirthdayyoutube/" },
  { id: "wii", title: "Nintendo launches the Wii", year: 2006, category: "Technology", fact: "Wireless motion controllers brought a different kind of play to the living room.", source: nintendo },
  { id: "iphone", title: "Steve Jobs introduces the iPhone", year: 2007, category: "Technology", fact: "At Macworld, Jobs presented a phone, an iPod and an internet device in one.", source: "https://www.apple.com/newsroom/2017/01/iphone-at-ten-the-revolution-continues/" },
  { id: "wall-e", title: "WALL·E opens in US theaters", year: 2008, category: "Movies", fact: "The robot’s feature debut was paired with the short Presto.", source: pixar },
  { id: "up", title: "Up opens in US theaters", year: 2009, category: "Movies", fact: "Earlier that month, it became the first animated feature to open the Cannes Film Festival.", source: pixar },
  { id: "instagram", title: "Instagram launches", year: 2010, category: "Internet", fact: "The photo-sharing app began on October 6.", source: "https://about.fb.com/ja/news/2020/10/birthday/" },
  { id: "brave", title: "Brave opens in US theaters", year: 2012, category: "Movies", fact: "It was Pixar’s first feature animated with its Presto animation system.", source: pixar },
  { id: "inside-out", title: "Inside Out opens in US theaters", year: 2015, category: "Movies", fact: "Its theatrical companion, LAVA, told a musical story about a volcano.", source: pixar },
  { id: "switch", title: "Nintendo launches the Switch", year: 2017, category: "Technology", fact: "Breath of the Wild was among the system’s launch games.", source: nintendo },
];
