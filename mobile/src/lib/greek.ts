const acuteAfterGreekLetter = /([Ͱ-Ͽ]̈?)́/g;
const combiningMarks = /[̀-ͯ]/g;

/**
 * Upper-cases text the way Greek is typeset: capitals drop the accent but
 * keep the diaeresis, so "Ανακοινώσεις" becomes "ΑΝΑΚΟΙΝΩΣΕΙΣ" and "Πρωΐ"
 * becomes "ΠΡΩΪ". `textTransform: 'uppercase'` keeps the accent on Android,
 * which reads as a typo to a Greek speaker.
 */
export function toUpperCase(text: string): string {
  return text.normalize('NFD').replace(acuteAfterGreekLetter, '$1').normalize('NFC').toUpperCase();
}

/**
 * Reduces text to a form two spellings of the same word share: lower case,
 * no accents and no final sigma. Meant for comparing, never for display.
 */
export function fold(text: string): string {
  return text
    .normalize('NFD')
    .replace(combiningMarks, '')
    .toLowerCase()
    .replace(/ς/g, 'σ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Ticks a semester's letter is written with: the tonos sign, an apostrophe or
// a typographic quote.
const numeralTicks = /(?<=[Α-Ω])['΄’ʹ]/gu;

/**
 * A Greek numeral as it is typeset: the letter & the keraia (ʹ, U+0374) right
 * against it. The tonos sign the data writes it with sets off with a gap in
 * most fonts — "Α ΄" — & reads as broken; this is for display only.
 */
export function displayNumeral(text: string): string {
  return text.replace(numeralTicks, 'ʹ');
}
