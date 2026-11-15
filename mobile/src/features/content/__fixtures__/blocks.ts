import type { Block } from '../schema';

/** One of every block type, as the backend would send it. */
export const sampleBlocks: Block[] = [
  { type: 'heading', level: 2, content: [{ text: 'Πρόγραμμα εξετάσεων' }] },
  {
    type: 'paragraph',
    content: [
      { text: 'Η δήλωση είναι ' },
      { text: 'υποχρεωτική', bold: true },
      { text: ' και λήγει την Παρασκευή. Δείτε ' },
      { text: 'τον οδηγό', href: 'https://cs.uowm.gr/odigos/' },
      { text: '.' },
    ],
  },
  { type: 'list', ordered: false, items: [[{ text: 'Πρώτο' }], [{ text: 'Δεύτερο' }]] },
  { type: 'list', ordered: true, items: [[{ text: 'Βήμα ένα' }], [{ text: 'Βήμα δύο' }]] },
  { type: 'quote', content: [{ text: 'Μια σημαντική σημείωση.' }] },
  {
    type: 'table',
    header: [[{ text: 'Μάθημα' }], [{ text: 'Αίθουσα' }], [{ text: 'Ώρα' }]],
    rows: [
      [[{ text: 'Αλγόριθμοι' }], [{ text: 'Α2' }], [{ text: '09:00' }]],
      [[{ text: 'Βάσεις' }], [{ text: 'Β1' }], [{ text: '12:00' }]],
    ],
  },
  { type: 'image', src: 'https://cs.uowm.gr/img/poster.jpg', alt: 'Αφίσα' },
  { type: 'divider' },
  {
    type: 'attachment',
    name: 'Πρόγραμμα Εξετάσεων',
    href: 'https://cs.uowm.gr/files/exams.pdf',
    format: 'pdf',
  },
];
