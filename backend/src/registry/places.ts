import type { City, School } from './types.js';

export const cities: readonly City[] = [
  { id: 'kozani', name: { el: 'Κοζάνη', en: 'Kozani' } },
  { id: 'florina', name: { el: 'Φλώρινα', en: 'Florina' } },
  { id: 'kastoria', name: { el: 'Καστοριά', en: 'Kastoria' } },
  { id: 'ptolemaida', name: { el: 'Πτολεμαΐδα', en: 'Ptolemaida' } },
  { id: 'grevena', name: { el: 'Γρεβενά', en: 'Grevena' } },
];

export const schools: readonly School[] = [
  {
    id: 'engineering',
    name: { el: 'Πολυτεχνική Σχολή', en: 'School of Engineering' },
    seat: 'kozani',
  },
  {
    id: 'economics',
    name: { el: 'Σχολή Οικονομικών Επιστημών', en: 'School of Economic Sciences' },
    seat: 'kozani',
  },
  {
    id: 'social-sciences',
    name: {
      el: 'Σχολή Κοινωνικών και Ανθρωπιστικών Επιστημών',
      en: 'School of Social Sciences and Humanities',
    },
    seat: 'florina',
  },
  {
    id: 'sciences',
    name: { el: 'Σχολή Θετικών Επιστημών', en: 'School of Science' },
    seat: 'kastoria',
  },
  {
    id: 'health',
    name: { el: 'Σχολή Επιστημών Υγείας', en: 'School of Health Sciences' },
    seat: 'ptolemaida',
  },
  {
    id: 'fine-arts',
    name: { el: 'Σχολή Καλών Τεχνών', en: 'School of Fine Arts' },
    seat: 'florina',
  },
  {
    id: 'agriculture',
    name: { el: 'Σχολή Γεωπονικών Επιστημών', en: 'School of Agriculture' },
    seat: 'florina',
  },
];
