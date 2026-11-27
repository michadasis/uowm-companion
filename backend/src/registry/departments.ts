import type {
  Department,
  ScheduleSource,
  UniversitySources,
  WordPressRestSource,
} from './types.js';

function site(id: string): string {
  return `https://${id}.uowm.gr`;
}

function wordpress(id: string, categories: number[]): WordPressRestSource {
  return { adapter: 'wordpress-rest', apiRoot: `${site(id)}/wp-json/`, categories };
}

/** A schedule posted to the department's WordPress, found by its title. */
function posts(id: string, search: string): ScheduleSource {
  return { adapter: 'wordpress-posts', apiRoot: `${site(id)}/wp-json/`, search };
}

/**
 * Every source below was read off the department's own site in November
 * 2026. A feature that is left out has no dependable location yet; it is not
 * a guess waiting to be confirmed.
 */
export const departments: readonly Department[] = [
  {
    id: 'ece',
    name: {
      el: 'Τμήμα Ηλεκτρολόγων Μηχανικών και Μηχανικών Υπολογιστών',
      en: 'Department of Electrical and Computer Engineering',
    },
    shortName: {
      el: 'Ηλεκτρολόγων Μηχανικών και Μηχανικών Υπολογιστών',
      en: 'Electrical and Computer Engineering',
    },
    aliases: ['ΤΗΜΜΥ'],
    school: 'engineering',
    city: 'kozani',
    website: site('ece'),
    sources: {
      announcements: wordpress('ece', [13]),
      exams: { adapter: 'wordpress-posts', apiRoot: `${site('ece')}/wp-json/`, category: 97 },
      timetable: {
        adapter: 'wordpress-posts',
        apiRoot: `${site('ece')}/wp-json/`,
        category: 89,
      },
    },
  },
  {
    id: 'mech',
    name: { el: 'Τμήμα Μηχανολόγων Μηχανικών', en: 'Department of Mechanical Engineering' },
    shortName: { el: 'Μηχανολόγων Μηχανικών', en: 'Mechanical Engineering' },
    aliases: [],
    school: 'engineering',
    city: 'kozani',
    website: site('mech'),
    sources: {
      announcements: wordpress('mech', [5, 7, 8]),
      exams: posts('mech', 'εξετ'),
      timetable: { adapter: 'menu-link', pageUrl: `${site('mech')}/`, label: 'Ωρολόγιο Πρόγραμμα' },
    },
  },
  {
    id: 'chemeng',
    name: { el: 'Τμήμα Χημικών Μηχανικών', en: 'Department of Chemical Engineering' },
    shortName: { el: 'Χημικών Μηχανικών', en: 'Chemical Engineering' },
    aliases: [],
    school: 'engineering',
    city: 'kozani',
    website: site('chemeng'),
    sources: {
      announcements: wordpress('chemeng', [35]),
      exams: {
        adapter: 'wordpress-posts',
        apiRoot: `${site('chemeng')}/wp-json/`,
        category: 63,
      },
      timetable: {
        adapter: 'wordpress-posts',
        apiRoot: `${site('chemeng')}/wp-json/`,
        category: 52,
      },
    },
  },
  {
    id: 'mre',
    name: {
      el: 'Τμήμα Μηχανικών Ορυκτών Πόρων',
      en: 'Department of Mineral Resources Engineering',
    },
    shortName: { el: 'Μηχανικών Ορυκτών Πόρων', en: 'Mineral Resources Engineering' },
    aliases: ['ΜΟΠ'],
    school: 'engineering',
    city: 'kozani',
    website: site('mre'),
    sources: {
      announcements: wordpress('mre', [54]),
      exams: posts('mre', 'εξετ'),
      timetable: { adapter: 'menu-link', pageUrl: `${site('mre')}/`, label: 'Ωρολόγιο Πρόγραμμα' },
    },
  },
  {
    id: 'ide',
    name: {
      el: 'Τμήμα Μηχανικών Σχεδίασης Προϊόντων και Συστημάτων',
      en: 'Department of Product and Systems Design Engineering',
    },
    shortName: {
      el: 'Μηχανικών Σχεδίασης Προϊόντων και Συστημάτων',
      en: 'Product and Systems Design Engineering',
    },
    aliases: [],
    school: 'engineering',
    city: 'kozani',
    website: site('ide'),
    sources: {
      announcements: wordpress('ide', [3]),
      timetable: posts('ide', 'ωρολόγιο'),
      exams: posts('ide', 'εξεταστικ'),
    },
  },
  {
    id: 'iees',
    name: {
      el: 'Τμήμα Διεθνών και Ευρωπαϊκών Οικονομικών Σπουδών',
      en: 'Department of International and European Economic Studies',
    },
    shortName: {
      el: 'Διεθνών και Ευρωπαϊκών Οικονομικών Σπουδών',
      en: 'International and European Economic Studies',
    },
    aliases: ['ΔΕΟΣ'],
    school: 'economics',
    city: 'kozani',
    website: site('iees'),
    sources: {
      announcements: wordpress('iees', [15]),
      timetable: posts('iees', 'ωρολόγιο'),
      exams: posts('iees', 'εξεταστικ'),
    },
  },
  {
    id: 'mst',
    name: {
      el: 'Τμήμα Διοικητικής Επιστήμης και Τεχνολογίας',
      en: 'Department of Management Science and Technology',
    },
    shortName: {
      el: 'Διοικητικής Επιστήμης και Τεχνολογίας',
      en: 'Management Science and Technology',
    },
    aliases: ['ΔΕΤ'],
    school: 'economics',
    city: 'kozani',
    website: site('mst'),
    sources: {
      announcements: {
        adapter: 'html-listing',
        // The department's plain /category/nea/ page lists only a handful of
        // pinned posts; this one is the full reverse-chronological feed.
        listingUrl: `${site('mst')}/epikairotita/anakoinoseis/`,
        postPathPrefix: '/nea/',
      },
      // Its WordPress API is closed. Exam schedules are posted among the
      // announcements (its "Εξετάσεις" category stopped in 2022); the current
      // timetable is linked from the menu, which the home page carries.
      exams: {
        adapter: 'listing-posts',
        listingUrl: `${site('mst')}/epikairotita/anakoinoseis/`,
        pages: 5,
      },
      timetable: { adapter: 'listing-posts', listingUrl: `${site('mst')}/` },
    },
  },
  {
    id: 'accfin',
    name: {
      el: 'Τμήμα Λογιστικής και Χρηματοοικονομικής',
      en: 'Department of Accounting and Finance',
    },
    shortName: { el: 'Λογιστικής και Χρηματοοικονομικής', en: 'Accounting and Finance' },
    aliases: [],
    school: 'economics',
    city: 'kozani',
    website: site('accfin'),
    sources: {
      announcements: wordpress('accfin', [35]),
      // The exam schedule goes out as an announcement; the category kept for
      // it has not been used since 2024.
      exams: {
        adapter: 'wordpress-posts',
        apiRoot: `${site('accfin')}/wp-json/`,
        category: 35,
        search: 'πρόγραμμα εξετ',
      },
      timetable: {
        adapter: 'menu-link',
        pageUrl: `${site('accfin')}/`,
        label: 'Πρόγραμμα Διδασκαλίας',
      },
    },
  },
  {
    id: 'rdcbs',
    name: {
      el: 'Τμήμα Περιφερειακής και Διασυνοριακής Ανάπτυξης',
      en: 'Department of Regional and Cross-Border Development Studies',
    },
    shortName: {
      el: 'Περιφερειακής και Διασυνοριακής Ανάπτυξης',
      en: 'Regional and Cross-Border Development Studies',
    },
    aliases: [],
    school: 'economics',
    city: 'kozani',
    website: site('rdcbs'),
    sources: {
      announcements: {
        adapter: 'html-listing',
        listingUrl: `${site('rdcbs')}/category/anakoinoseis/`,
        postPathPrefix: '/anakoinoseis/',
      },
      // Its WordPress API is closed; exam schedules are posted as announcements.
      exams: {
        adapter: 'listing-posts',
        listingUrl: `${site('rdcbs')}/category/anakoinoseis/`,
        pages: 5,
      },
      timetable: {
        adapter: 'listing-posts',
        listingUrl: `${site('rdcbs')}/category/anakoinoseis/`,
        pages: 5,
      },
    },
  },
  {
    id: 'econ',
    name: { el: 'Τμήμα Οικονομικών Επιστημών', en: 'Department of Economics' },
    shortName: { el: 'Οικονομικών Επιστημών', en: 'Economics' },
    aliases: [],
    school: 'economics',
    city: 'kastoria',
    website: site('econ'),
    sources: {
      announcements: wordpress('econ', [2]),
      exams: posts('econ', 'εξετ'),
      timetable: { adapter: 'menu-link', pageUrl: `${site('econ')}/`, label: 'Ωρολόγιο Πρόγραμμα' },
    },
  },
  {
    id: 'ba',
    name: {
      el: 'Τμήμα Οργάνωσης και Διοίκησης Επιχειρήσεων',
      en: 'Department of Business Administration',
    },
    shortName: { el: 'Οργάνωσης και Διοίκησης Επιχειρήσεων', en: 'Business Administration' },
    aliases: ['ΟΔΕ'],
    school: 'economics',
    city: 'grevena',
    website: site('ba'),
    sources: {
      announcements: wordpress('ba', [3]),
      exams: { adapter: 'wordpress-posts', apiRoot: `${site('ba')}/wp-json/`, category: 102 },
      // The menu still points at last term's; each new one is posted.
      timetable: {
        adapter: 'wordpress-posts',
        apiRoot: `${site('ba')}/wp-json/`,
        search: 'ωρολόγιο',
      },
    },
  },
  {
    id: 'stat',
    name: { el: 'Τμήμα Στατιστικής', en: 'Department of Statistics' },
    shortName: { el: 'Στατιστικής', en: 'Statistics' },
    aliases: [],
    school: 'economics',
    city: 'grevena',
    website: site('stat'),
    sources: {
      announcements: wordpress('stat', [9]),
      exams: { adapter: 'menu-link', pageUrl: `${site('stat')}/`, label: 'Πρόγραμμα Εξεταστικής' },
      timetable: { adapter: 'menu-link', pageUrl: `${site('stat')}/`, label: 'Ωρολόγιο Πρόγραμμα' },
    },
  },
  {
    id: 'eled',
    name: {
      el: 'Παιδαγωγικό Τμήμα Δημοτικής Εκπαίδευσης',
      en: 'Department of Primary Education',
    },
    shortName: { el: 'Παιδαγωγικό Δημοτικής Εκπαίδευσης', en: 'Primary Education' },
    aliases: ['ΠΤΔΕ'],
    school: 'social-sciences',
    city: 'florina',
    website: site('eled'),
    sources: {
      announcements: wordpress('eled', [13]),
      // Its exam schedules are uploaded & linked now & then, but never posted.
      exams: {
        adapter: 'wordpress-media',
        apiRoot: `${site('eled')}/wp-json/`,
        search: 'εξεταστικ',
      },
      timetable: { adapter: 'menu-link', pageUrl: `${site('eled')}/`, label: 'Ωρολόγιο Πρόγραμμα' },
    },
  },
  {
    id: 'nured',
    name: { el: 'Παιδαγωγικό Τμήμα Νηπιαγωγών', en: 'Department of Early Childhood Education' },
    shortName: { el: 'Παιδαγωγικό Νηπιαγωγών', en: 'Early Childhood Education' },
    aliases: ['ΠΤΝ'],
    school: 'social-sciences',
    city: 'florina',
    website: site('nured'),
    sources: {
      announcements: wordpress('nured', [23]),
      // No menu entry; the exam schedule goes out as an announcement.
      exams: {
        adapter: 'wordpress-posts',
        apiRoot: `${site('nured')}/wp-json/`,
        category: 23,
        search: 'εξεταστικής',
      },
      // The timetable page lists only regulations now; each term's is posted.
      timetable: {
        adapter: 'wordpress-posts',
        apiRoot: `${site('nured')}/wp-json/`,
        search: 'ωρολόγιο',
      },
    },
  },
  {
    id: 'psy',
    name: { el: 'Τμήμα Ψυχολογίας', en: 'Department of Psychology' },
    shortName: { el: 'Ψυχολογίας', en: 'Psychology' },
    aliases: [],
    school: 'social-sciences',
    city: 'florina',
    website: site('psy'),
    sources: {
      announcements: wordpress('psy', [1]),
      // The menu's link goes stale between sittings; each new schedule goes
      // out as an announcement.
      exams: {
        adapter: 'wordpress-posts',
        apiRoot: `${site('psy')}/wp-json/`,
        category: 1,
        search: 'εξεταστικής',
      },
      timetable: { adapter: 'menu-link', pageUrl: `${site('psy')}/`, label: 'Ωρολόγιο Πρόγραμμα' },
    },
  },
  {
    id: 'cdm',
    name: {
      el: 'Τμήμα Επικοινωνίας και Ψηφιακών Μέσων',
      en: 'Department of Communication and Digital Media',
    },
    shortName: { el: 'Επικοινωνίας και Ψηφιακών Μέσων', en: 'Communication and Digital Media' },
    aliases: [],
    school: 'social-sciences',
    city: 'kastoria',
    website: site('cdm'),
    sources: {
      announcements: wordpress('cdm', [123]),
      exams: { adapter: 'embedded-sheet', pageUrl: `${site('cdm')}/programma-exetastikis/` },
      timetable: { adapter: 'embedded-sheet', pageUrl: `${site('cdm')}/programma-mathimaton/` },
    },
  },
  {
    id: 'math',
    name: { el: 'Τμήμα Μαθηματικών', en: 'Department of Mathematics' },
    shortName: { el: 'Μαθηματικών', en: 'Mathematics' },
    aliases: [],
    school: 'sciences',
    city: 'kastoria',
    website: site('math'),
    sources: {
      announcements: wordpress('math', [3]),
      exams: {
        adapter: 'document-page',
        pageUrl: `${site('math')}/programma-exetastikis/`,
        pick: 'first-link',
      },
      timetable: {
        adapter: 'document-page',
        pageUrl: `${site('math')}/programma-mathimaton/`,
        // The exam rules are linked first; the term's timetable is the newest.
        pick: 'newest-upload',
      },
    },
  },
  {
    id: 'cs',
    name: { el: 'Τμήμα Πληροφορικής', en: 'Department of Informatics' },
    shortName: { el: 'Πληροφορικής', en: 'Informatics' },
    aliases: [],
    school: 'sciences',
    city: 'kastoria',
    website: site('cs'),
    // The site is no longer WordPress since late November 2026: posts come
    // from its feed, & both schedules are entries on the Studies page whose
    // links are swapped for each new one.
    sources: {
      announcements: { adapter: 'rss', feedUrl: `${site('cs')}/el/news/rss.xml` },
      exams: {
        adapter: 'menu-link',
        pageUrl: `${site('cs')}/el/studies/`,
        label: 'Πρόγραμμα εξεταστικής',
      },
      timetable: {
        adapter: 'menu-link',
        pageUrl: `${site('cs')}/el/studies/`,
        label: 'Ωρολόγιο πρόγραμμα',
      },
    },
  },
  {
    id: 'ot',
    name: { el: 'Τμήμα Εργοθεραπείας', en: 'Department of Occupational Therapy' },
    shortName: { el: 'Εργοθεραπείας', en: 'Occupational Therapy' },
    aliases: [],
    school: 'health',
    city: 'ptolemaida',
    website: site('ot'),
    sources: {
      announcements: wordpress('ot', [3]),
      exams: { adapter: 'menu-link', pageUrl: `${site('ot')}/`, label: 'Πρόγραμμα εξεταστικής' },
      timetable: { adapter: 'menu-link', pageUrl: `${site('ot')}/`, label: 'Ωρολόγιο Πρόγραμμα' },
    },
  },
  {
    id: 'mw',
    name: { el: 'Τμήμα Μαιευτικής', en: 'Department of Midwifery' },
    shortName: { el: 'Μαιευτικής', en: 'Midwifery' },
    aliases: [],
    school: 'health',
    city: 'ptolemaida',
    website: site('mw'),
    sources: {
      announcements: wordpress('mw', [52]),
      timetable: posts('mw', 'ωρολόγιο'),
      exams: posts('mw', 'εξεταστικ'),
    },
  },
  {
    id: 'eetf',
    name: {
      el: 'Τμήμα Εικαστικών και Εφαρμοσμένων Τεχνών',
      en: 'Department of Fine and Applied Arts',
    },
    shortName: { el: 'Εικαστικών και Εφαρμοσμένων Τεχνών', en: 'Fine and Applied Arts' },
    aliases: ['ΤΕΕΤ'],
    school: 'fine-arts',
    city: 'florina',
    website: site('eetf'),
    sources: {
      announcements: wordpress('eetf', [7]),
      timetable: posts('eetf', 'ωρολόγιο'),
      exams: posts('eetf', 'εξεταστικ'),
    },
  },
  {
    id: 'agro',
    name: { el: 'Τμήμα Γεωπονίας', en: 'Department of Agriculture' },
    shortName: { el: 'Γεωπονίας', en: 'Agriculture' },
    aliases: [],
    school: 'agriculture',
    city: 'florina',
    website: site('agro'),
    sources: {
      announcements: wordpress('agro', [1, 44]),
      exams: { adapter: 'menu-link', pageUrl: `${site('agro')}/`, label: 'Πρόγραμμα Εξεταστικής' },
      // The menu's page holds a 2023-24 timetable; each new one is posted.
      timetable: {
        adapter: 'wordpress-posts',
        apiRoot: `${site('agro')}/wp-json/`,
        search: 'ωρολόγιο',
      },
    },
  },
];

export const university: UniversitySources = {
  announcements: {
    adapter: 'wordpress-rest',
    apiRoot: 'https://www.uowm.gr/wp-json/',
    categories: [49],
  },
};
