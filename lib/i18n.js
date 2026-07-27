export const LANGS = [
  { code: 'ro', label: '🇷🇴 RO' },
  { code: 'hu', label: '🇭🇺 HU' },
  { code: 'en', label: '🇬🇧 EN' },
];

export const dict = {
  tagline: { ro: 'Întâlniri video, chat și conferințe. Gratuit.', hu: 'Videohívások, csevegés és konferenciák. Ingyen.', en: 'Video meetings, chat and conferences. Free.' },
  yourName: { ro: 'Numele tău', hu: 'A neved', en: 'Your name' },
  roomName: { ro: 'Numele sălii', hu: 'A terem neve', en: 'Room name' },
  exName: { ro: 'ex. Andrei', hu: 'pl. Anna', en: 'e.g. Alex' },
  exRoom: { ro: 'ex. sedinta-produs', hu: 'pl. megbeszeles', en: 'e.g. team-sync' },
  join: { ro: 'Intră în ședință', hu: 'Belépés a megbeszélésre', en: 'Join meeting' },
  newRoom: { ro: 'Generează o sală nouă', hu: 'Új terem létrehozása', en: 'Create a new room' },
  createHost: { ro: 'Creează ședință (ești gazdă)', hu: 'Megbeszélés létrehozása (te vagy a házigazda)', en: 'Create meeting (you are host)' },
  login: { ro: 'Conectează-te', hu: 'Bejelentkezés', en: 'Log in' },
  logout: { ro: 'Ieși', hu: 'Kilépés', en: 'Log out' },
  navSchedule: { ro: '📅 Programează o ședință', hu: '📅 Megbeszélés ütemezése', en: '📅 Schedule a meeting' },
  navMeetings: { ro: 'Ședințele mele', hu: 'Megbeszéléseim', en: 'My meetings' },
  navSlides: { ro: 'Prezentări', hu: 'Bemutatók', en: 'Presentations' },
  navContacts: { ro: 'Contacte', hu: 'Kapcsolatok', en: 'Contacts' },
  sameRoomNote: { ro: 'Oricine intră cu același nume de sală se vede și se aude în timp real.', hu: 'Aki ugyanazzal a teremnévvel lép be, valós időben látja és hallja egymást.', en: 'Anyone who joins with the same room name sees and hears each other in real time.' },
  acceptLegal: { ro: 'Prin intrarea în ședință accepți', hu: 'A belépéssel elfogadod a', en: 'By joining you accept the' },
  privacyPolicy: { ro: 'Politica de confidențialitate', hu: 'Adatvédelmi szabályzatot', en: 'Privacy Policy' },
  andTerms: { ro: 'și Termenii', hu: 'és a Feltételeket', en: 'and Terms' },

  connecting: { ro: 'Se conectează la', hu: 'Kapcsolódás ehhez:', en: 'Connecting to' },
  lobbyTitle: { ro: 'Ești în sala de așteptare', hu: 'A váróteremben vagy', en: 'You are in the waiting room' },
  lobbyText: { ro: 'Gazda te va lăsa să intri în curând…', hu: 'A házigazda hamarosan beenged…', en: 'The host will let you in shortly…' },

  noticeRec: { ro: 'Ședințele pot fi transcrise (subtitrare) sau înregistrate de gazdă. Prin participare confirmi că ai fost informat. Poți opri camera/microfonul oricând.', hu: 'A megbeszéléseket a házigazda átírathatja (felirat) vagy rögzítheti. A részvétellel megerősíted, hogy tájékoztattak. A kamerát/mikrofont bármikor kikapcsolhatod.', en: 'Meetings may be transcribed (captions) or recorded by the host. By taking part you confirm you have been informed. You can turn off your camera/mic anytime.' },
  understood: { ro: 'Am înțeles', hu: 'Értem', en: 'Got it' },

  cookieText: { ro: 'Folosim doar stocare strict necesară funcționării (sesiunea video și această preferință). Fără cookie-uri de publicitate.', hu: 'Csak a működéshez feltétlenül szükséges tárolást használjuk (videómenet és ez a beállítás). Nincs reklámsüti.', en: 'We use only storage strictly necessary for functioning (the video session and this preference). No advertising cookies.' },

  // Dock (instrumente în ședință)
  tools: { ro: 'Instrumente', hu: 'Eszközök', en: 'Tools' },
  tBackground: { ro: 'Fundal', hu: 'Háttér', en: 'Background' },
  tBoard: { ro: 'Tablă', hu: 'Tábla', en: 'Whiteboard' },
  tPresent: { ro: 'Prezintă', hu: 'Bemutató', en: 'Present' },
  tRooms: { ro: 'Camere', hu: 'Termek', en: 'Rooms' },
  tPoll: { ro: 'Sondaj', hu: 'Szavazás', en: 'Poll' },
  tQA: { ro: 'Q&A', hu: 'Q&A', en: 'Q&A' },
  tFiles: { ro: 'Fișiere', hu: 'Fájlok', en: 'Files' },
  tReactions: { ro: 'Reacții', hu: 'Reakciók', en: 'Reactions' },
  tRecord: { ro: 'Înreg.', hu: 'Felvétel', en: 'Record' },
  tCaptions: { ro: 'Subtitrare', hu: 'Felirat', en: 'Captions' },
  tHost: { ro: 'Gazdă', hu: 'Házigazda', en: 'Host' },
  tVideo: { ro: 'Video', hu: 'Videó', en: 'Video' },
};

export function translate(key, lang) {
  const e = dict[key];
  if (!e) return key;
  return e[lang] ?? e.ro ?? key;
}
