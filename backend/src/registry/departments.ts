import type { Department, PageSource, UniversitySources, WordPressRestSource } from './types.js';

function site(id: string): string {
  return `https://${id}.uowm.gr`;
}

function wordpress(id: string, categories: number[]): WordPressRestSource {
  return { adapter: 'wordpress-rest', apiRoot: `${site(id)}/wp-json/`, categories };
}

function page(url: string): PageSource {
  return { adapter: 'html-page', url };
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
      exams: { adapter: 'wordpress-category', apiRoot: `${site('ece')}/wp-json/`, category: 97 },
      timetable: {
        adapter: 'wordpress-category',
        apiRoot: `${site('ece')}/wp-json/`,
        category: 89,
      },
      staff: [
        page(`${site('ece')}/μελη-δεπ/`),
        page(`${site('ece')}/εκτακτοι-διδασκοντεσ/`),
        page(`${site('ece')}/διοικητικο-προσωπικο/`),
      ],
      secretariat: page(`${site('ece')}/επικοινωνήστε-μαζί-μας/`),
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
      timetable: { adapter: 'menu-link', pageUrl: `${site('mech')}/`, label: 'Ωρολόγιο Πρόγραμμα' },
      staff: [
        page(`${site('mech')}/dep/`),
        page(`${site('mech')}/ektaktoi/`),
        page(`${site('mech')}/dioikitikoi/`),
      ],
      secretariat: page(`${site('mech')}/epikoinwnia/`),
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
        adapter: 'wordpress-category',
        apiRoot: `${site('chemeng')}/wp-json/`,
        category: 63,
      },
      timetable: {
        adapter: 'wordpress-category',
        apiRoot: `${site('chemeng')}/wp-json/`,
        category: 52,
      },
      staff: [
        page(`${site('chemeng')}/meli-dep/`),
        page(`${site('chemeng')}/edip/`),
        page(`${site('chemeng')}/etep/`),
      ],
      secretariat: page(`${site('chemeng')}/dioikitikoi-ypalliloi/`),
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
      timetable: { adapter: 'menu-link', pageUrl: `${site('mre')}/`, label: 'Ωρολόγιο Πρόγραμμα' },
      staff: [
        page(`${site('mre')}/to-tmima/prosopiko-2/prosopiko/`),
        page(`${site('mre')}/ektaktoi-didaskontes/`),
      ],
      secretariat: page(`${site('mre')}/to-tmima/prosopiko-2/grammateia-tmimatos/`),
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
      staff: [page(`${site('ide')}/prosopiko/`), page(`${site('ide')}/ektakto-prosopiko/`)],
      secretariat: page(`${site('ide')}/epikoinonia/`),
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
      staff: [
        page(`${site('iees')}/prosopiko/didaktiko/`),
        page(`${site('iees')}/prosopiko/dioikitiko/`),
      ],
      secretariat: page(`${site('iees')}/epikoinonia/`),
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
      announcements: { adapter: 'html-listing', listingUrl: `${site('mst')}/category/nea/` },
      staff: [
        page(`${site('mst')}/meli-dep/`),
        page(`${site('mst')}/ektakto-epistimoniko-prosopiko/`),
        page(`${site('mst')}/dioikitiko-prosopiko/`),
      ],
      secretariat: page(`${site('mst')}/epikoinonia/`),
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
      exams: {
        adapter: 'wordpress-category',
        apiRoot: `${site('accfin')}/wp-json/`,
        category: 131,
      },
      timetable: {
        adapter: 'menu-link',
        pageUrl: `${site('accfin')}/`,
        label: 'Πρόγραμμα Διδασκαλίας',
      },
      staff: [
        page(`${site('accfin')}/meli-d-e-p/`),
        page(`${site('accfin')}/dioikitiko-prosopiko/`),
      ],
      secretariat: page(`${site('accfin')}/contact/`),
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
      },
      staff: [page(`${site('rdcbs')}/?page_id=1093`)],
      secretariat: page(`${site('rdcbs')}/epikoinonia/`),
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
      timetable: { adapter: 'menu-link', pageUrl: `${site('econ')}/`, label: 'Ωρολόγιο Πρόγραμμα' },
      staff: [page(`${site('econ')}/anthopino-dynamiko/`)],
      secretariat: page(`${site('econ')}/epikoinonia/`),
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
      exams: { adapter: 'wordpress-category', apiRoot: `${site('ba')}/wp-json/`, category: 102 },
      timetable: { adapter: 'menu-link', pageUrl: `${site('ba')}/`, label: 'Ωρολόγιο Πρόγραμμα' },
      staff: [
        page(`${site('ba')}/προσωπικό/didaktiko-prosopiko/d-e-p/`),
        page(`${site('ba')}/προσωπικό/didaktiko-prosopiko/e-di-p/`),
        page(`${site('ba')}/προσωπικό/dioikhtiko/`),
      ],
      secretariat: page(`${site('ba')}/epikoinonia/`),
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
      staff: [
        page(`${site('stat')}/dep/`),
        page(`${site('stat')}/ektakto-epistimoniko-prosopiko/`),
        page(`${site('stat')}/dioikitiko-prosopiko/`),
      ],
      secretariat: page(`${site('stat')}/epikoinonia/`),
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
      timetable: { adapter: 'menu-link', pageUrl: `${site('eled')}/`, label: 'Ωρολόγιο Πρόγραμμα' },
      staff: [
        page(`${site('eled')}/prosopiko/didaktiko-erevnitiko-prosopiko-dep/`),
        page(`${site('eled')}/prosopiko/ergastiriako-didaktiko-prosopiko-e-di-p/`),
        page(`${site('eled')}/prosopiko/idiko-ekpedeftiko-prosopiko-e-e-p/`),
      ],
      secretariat: page(`${site('eled')}/prosopiko/diikitiko-prosopiko-grammatia/`),
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
      exams: {
        adapter: 'menu-link',
        pageUrl: `${site('nured')}/`,
        label: 'Πρόγραμμα Εξεταστικής',
      },
      timetable: {
        adapter: 'document-page',
        pageUrl: `${site('nured')}/orologio-programma-tmimatos/`,
        pick: 'first-link',
      },
      staff: [
        page(`${site('nured')}/didaktiko-erevnitiko-prosopiko-d-e-p/`),
        page(`${site('nured')}/edip/`),
        page(`${site('nured')}/ektakto-didaktiko-prosopiko/`),
      ],
      secretariat: page(`${site('nured')}/διοικητικό-προσωπικό-τμήματος/`),
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
      exams: { adapter: 'menu-link', pageUrl: `${site('psy')}/`, label: 'Πρόγραμμα εξεταστικής' },
      timetable: { adapter: 'menu-link', pageUrl: `${site('psy')}/`, label: 'Ωρολόγιο Πρόγραμμα' },
      staff: [
        page(`${site('psy')}/didaktiko-erevnitiko-prosopiko-d-e-p/`),
        page(`${site('psy')}/prosopiko/idiko-didaktiko-prosopiko-tmimatos-e-di-p/`),
        page(`${site('psy')}/prosopiko/ektakto-prosopiko/`),
      ],
      secretariat: page(`${site('psy')}/prosopiko/diikitiko-prosopiko/`),
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
      staff: [
        page(`${site('cdm')}/meli-dep/`),
        page(`${site('cdm')}/ektaktoi-didaskontes/`),
        page(`${site('cdm')}/dioikitiko-prosopiko/`),
      ],
      secretariat: page(`${site('cdm')}/contact/`),
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
        pick: 'first-link',
      },
      staff: [
        page(`${site('math')}/meli-dep-2/`),
        page(`${site('math')}/ektakto-didaktiko-prosopiko/`),
        page(`${site('math')}/dioikitiko-prosopiko/`),
      ],
      secretariat: page(`${site('math')}/epikoinonia/`),
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
    sources: {
      announcements: wordpress('cs', [39]),
      exams: {
        adapter: 'document-page',
        pageUrl: `${site('cs')}/archiki-selida/programma-spoudwn/programma-exetaseon/`,
        pick: 'first-link',
      },
      timetable: {
        adapter: 'document-page',
        pageUrl: `${site('cs')}/archiki-selida/orologio-programma-mathimaton/`,
        pick: 'newest-upload',
      },
      staff: [
        page(`${site('cs')}/archiki-selida/prosopiko/`),
        page(`${site('cs')}/dioikitiko-prosopiko/`),
      ],
      secretariat: page(`${site('cs')}/archiki-selida/contact/`),
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
      staff: [page(`${site('ot')}/meli-dep/`), page(`${site('ot')}/ektaktoi-didaskontes/`)],
      secretariat: page(`${site('ot')}/grammateia/`),
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
      staff: [
        page(`${site('mw')}/meli-dep/`),
        page(`${site('mw')}/didaskontes-a-y-407/`),
        page(`${site('mw')}/dioikitiko-prosopiko/`),
      ],
      secretariat: page(`${site('mw')}/grammateia/grammateia/`),
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
      staff: [
        page(`${site('eetf')}/prosopiko/didaktiko-erevnitiko-prosopiko-d-e-p/`),
        page(`${site('eetf')}/prosopiko/didaskontes-tou-p-d-40780/`),
        page(`${site('eetf')}/prosopiko/diikitiko-prosopiko/`),
      ],
      secretariat: page(`${site('eetf')}/tmima/grammatia/`),
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
      timetable: { adapter: 'menu-link', pageUrl: `${site('agro')}/`, label: 'Ωρολόγιο Πρόγραμμα' },
      staff: [
        page(`${site('agro')}/διδακτικό-ερευνητικό-προσωπικό/`),
        page(`${site('agro')}/εργαστηριακό-διδακτικό-προσωπικό/`),
        page(`${site('agro')}/διοικητικό-προσωπικό/`),
      ],
      secretariat: page(`${site('agro')}/επικοινωνία/`),
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
