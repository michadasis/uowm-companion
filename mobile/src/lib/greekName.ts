// Common Greek first names as they are spelt, with their accents. Universis
// keeps names in capitals, which drop the accent — "ΙΩΑΝΝΗΣ" — & a greeting
// should not read "Καλησπέρα, Ιωαννη".
const names = [
  // men
  'Αδάμ',
  'Αθανάσιος',
  'Αλέξανδρος',
  'Αλέξιος',
  'Αναστάσιος',
  'Ανδρέας',
  'Άγγελος',
  'Αντώνιος',
  'Απόστολος',
  'Αριστείδης',
  'Αριστοτέλης',
  'Αχιλλέας',
  'Βασίλειος',
  'Βασίλης',
  'Γεράσιμος',
  'Γεώργιος',
  'Γιάννης',
  'Γιώργος',
  'Γρηγόριος',
  'Δημήτριος',
  'Δημήτρης',
  'Διονύσιος',
  'Ελευθέριος',
  'Εμμανουήλ',
  'Ευάγγελος',
  'Ευστάθιος',
  'Ζαχαρίας',
  'Ηλίας',
  'Ηρακλής',
  'Θανάσης',
  'Θεμιστοκλής',
  'Θεόδωρος',
  'Θεοφάνης',
  'Θωμάς',
  'Ιάσονας',
  'Ιωάννης',
  'Ιωσήφ',
  'Κλεάνθης',
  'Κοσμάς',
  'Κυριάκος',
  'Κωνσταντίνος',
  'Κώστας',
  'Λάμπρος',
  'Λάζαρος',
  'Λεωνίδας',
  'Λουκάς',
  'Μάριος',
  'Μάρκος',
  'Ματθαίος',
  'Μιλτιάδης',
  'Μιχαήλ',
  'Μιχάλης',
  'Νεκτάριος',
  'Νικόλαος',
  'Νίκος',
  'Νικηφόρος',
  'Οδυσσέας',
  'Ορέστης',
  'Παναγιώτης',
  'Πάνος',
  'Παντελής',
  'Παρασκευάς',
  'Παύλος',
  'Περικλής',
  'Πέτρος',
  'Πρόδρομος',
  'Ραφαήλ',
  'Σάββας',
  'Σεραφείμ',
  'Σπυρίδων',
  'Σπύρος',
  'Σταύρος',
  'Στέλιος',
  'Στέφανος',
  'Στυλιανός',
  'Σωκράτης',
  'Σωτήριος',
  'Τάσος',
  'Τιμόθεος',
  'Τριαντάφυλλος',
  'Φίλιππος',
  'Φώτιος',
  'Χαράλαμπος',
  'Χρήστος',
  'Χρίστος',
  'Χρύσανθος',
  // women
  'Αγγελική',
  'Αθανασία',
  'Αικατερίνη',
  'Αλεξάνδρα',
  'Αλίκη',
  'Αμαλία',
  'Αναστασία',
  'Άννα',
  'Αντωνία',
  'Αργυρώ',
  'Αρετή',
  'Αφροδίτη',
  'Βαρβάρα',
  'Βασιλική',
  'Γαρυφαλλιά',
  'Γεωργία',
  'Δανάη',
  'Δέσποινα',
  'Δήμητρα',
  'Διονυσία',
  'Ειρήνη',
  'Ελένη',
  'Ελευθερία',
  'Ελισάβετ',
  'Έλενα',
  'Εμμανουέλα',
  'Ευαγγελία',
  'Ευανθία',
  'Ευγενία',
  'Ευδοκία',
  'Ευτυχία',
  'Ζωή',
  'Ηλέκτρα',
  'Θεοδώρα',
  'Θεοπίστη',
  'Ιφιγένεια',
  'Ιωάννα',
  'Καλλιόπη',
  'Κατερίνα',
  'Κλεοπάτρα',
  'Κυριακή',
  'Κωνσταντίνα',
  'Λαμπρινή',
  'Λυδία',
  'Μαργαρίτα',
  'Μαρία',
  'Μαρίνα',
  'Ματίνα',
  'Μελίνα',
  'Μυρτώ',
  'Ναταλία',
  'Νεφέλη',
  'Νικολέτα',
  'Ξανθή',
  'Όλγα',
  'Ουρανία',
  'Πανωραία',
  'Παναγιώτα',
  'Παρασκευή',
  'Πηνελόπη',
  'Πολυξένη',
  'Ραφαέλα',
  'Ροδάνθη',
  'Σοφία',
  'Σταυρούλα',
  'Στέλλα',
  'Στυλιανή',
  'Σωτηρία',
  'Ταξιαρχούλα',
  'Υπατία',
  'Φανή',
  'Φωτεινή',
  'Χαρίκλεια',
  'Χαρά',
  'Χριστίνα',
  'Χρυσάνθη',
  'Χρυσούλα',
];

const fold = (text: string): string =>
  text.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/Σ\b/gu, 'Σ');

const byFolded = new Map(names.map((name) => [fold(name), name]));

/** Syllables, as vowels counted one by one but a diphthong (αι, ει, οι, ου, αυ, ευ) as one. */
function syllables(name: string): number {
  const bare = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/αι|ει|οι|ου|αυ|ευ/gu, 'α');
  return bare.match(/[αεηιουω]/gu)?.length ?? 0;
}

/**
 * A Greek name in the vocative, as a greeting addresses someone: "Ιωάννη",
 * "Γιώργο", "Αλέξανδρε", "Ανδρέα"; a woman's name & a foreign one stay as
 * they are.
 */
export function vocative(name: string): string {
  if (/ος$/u.test(name)) {
    // Two syllables keep -ο, longer names take -ε: Νίκο, Πέτρο; Αλέξανδρε.
    return name.replace(/ος$/u, syllables(name) <= 2 ? 'ο' : 'ε');
  }
  if (/[ηή]ς$/u.test(name)) return name.slice(0, -1);
  if (/[αά]ς$/u.test(name)) return name.slice(0, -1);
  if (/ούς$/u.test(name)) return name.slice(0, -1);
  return name;
}

/**
 * The name to greet a student by, from the given name Universis holds, or
 * null when it can't be written properly. A name in capitals is given its
 * accents from the list of Greek names; one not on it is used only if it is
 * written in Latin letters, since a Greek name without its accent would look
 * misspelt.
 */
export function greetingName(givenName: string | null | undefined): string | null {
  const first = givenName?.trim().split(/[\s-]+/u)[0];
  if (!first) return null;
  const greek = /[Α-Ωα-ωΆ-ώ]/u.test(first);
  if (!greek) return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();

  // Written with small letters, it already has its accents.
  if (first !== first.toUpperCase()) return vocative(first);
  const known = byFolded.get(fold(first));
  return known ? vocative(known) : null;
}
