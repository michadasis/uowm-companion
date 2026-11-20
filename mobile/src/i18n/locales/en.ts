import type { Messages } from './el';

export const en: Messages = {
  app: {
    name: 'UoWM Companion',
    unofficial: 'Unofficial app. Not affiliated with the University of Western Macedonia.',
  },
  tabs: {
    home: 'Home',
    announcements: 'News',
    schedule: 'Schedule',
    menu: 'Menu',
    more: 'More',
  },
  welcome: {
    title: 'The whole university in one app',
    subtitle: 'For the students of the University of Western Macedonia.',
    announcements: {
      title: 'Announcements',
      body: 'From your department and the university, without digging through websites.',
    },
    schedule: {
      title: 'Exams and classes',
      body: 'Your schedule as a real calendar, not as a file.',
    },
    menu: {
      title: 'Restaurant',
      body: 'What is for breakfast, lunch and dinner today.',
    },
    calendar: {
      title: 'Holidays and exam periods',
      body: "From the academic calendar, with your city's own holidays.",
    },
    start: 'Get started',
    language: 'Language',
  },
  departmentPicker: {
    fromUniversis: 'Find my department from Universis',
    orPick: 'or pick it from the list',
    universisUnmatched: 'Universis did not say which department you are in. Pick it from the list.',
    title: 'Which department are you in?',
    subtitle: 'The app adapts to it. You can change it at any time in the settings.',
    settingsTitle: 'My department',
    searchPlaceholder: 'Search departments',
    clearSearch: 'Clear search',
    cities: 'City',
    allCities: 'All',
    continue: 'Continue',
    noResults: {
      title: 'No department found',
      message: 'Try another word or another city.',
      clear: 'Clear filters',
    },
  },
  home: {
    departmentLine: '{{name}}, {{city}}',
    departmentLineMale: '{{name}} student, {{city}}',
    departmentLineFemale: '{{name}} student, {{city}}',
    greeting: {
      morning: 'Good morning',
      afternoon: 'Good afternoon',
      evening: 'Good evening',
    },
    today: {
      holidayBadge: 'Holiday',
      localHoliday: 'Local holiday',
      noClasses: 'There are no classes today.',
      noClassesUntil: 'No classes today; they resume {{when}}.',
      resumes: 'Classes resume {{when}}.',
      christmas: 'Happy holidays!',
      easter: 'Happy Easter!',
      weekend: 'Have a good weekend!',
      weekendExams: 'A little rest between exams is well earned.',
      examsBadge: 'Exam period',
      resitsBadge: 'Resit exams',
      goodLuck: 'Good luck!',
      examsUntil: 'The exam period runs until {{date}}.',
      gapBadge: 'No classes',
      studyWeek: 'Study week',
      shortBreak: 'A short break',
      examsStart: 'Exams begin {{when}}.',
      termStarts: 'The term begins {{when}}.',
      holidayAhead: 'No classes {{when}}: {{name}}.',
      summer: 'Have a great summer!',
      offTitle: 'Time to rest',
    },
    nextUp: {
      title: 'Next up',
      empty: 'Your next class or exam will show up here.',
      personalise:
        'Pick a semester in the Timetable or connect Universis to see your next class here.',
      today: 'Today',
      tomorrow: 'Tomorrow',
      now: 'Now',
      exam: 'Exam',
    },
    menuToday: {
      title: 'At the restaurant today',
      all: 'Full menu',
      empty: "Today's menu will show up here.",
    },
    latest: {
      title: 'Latest announcements',
      all: 'See all',
      empty: "Your department's newest announcements will show up here.",
    },
  },
  calendar: {
    tomorrow: 'tomorrow',
    off: {
      exams: 'Exam period',
      break: 'No-classes week',
      term: 'Between terms',
    },
    noClassesThatDay: 'No classes are held that day.',
    holidays: {
      'national-day': 'National holiday',
      polytechnic: 'Polytechnic uprising anniversary',
      christmas: 'Christmas break',
      'three-hierarchs': 'Three Holy Hierarchs',
      carnival: 'Carnival Friday',
      'clean-monday': 'Clean Monday',
      easter: 'Easter break',
      'may-day': 'May Day',
      'whit-monday': 'Whit Monday',
      local: 'Local holiday',
    },
  },
  announcements: {
    title: 'Announcements',
    search: 'Search announcements',
    viewOnWebsite: 'View on website',
    titleOnly: 'The department posted only the title here. The details are on its website.',
    feeds: {
      department: 'Department',
      university: 'University',
    },
    empty: {
      title: 'No announcements yet',
      message: 'Announcements from your department and the university will show up here.',
    },
    noResults: {
      title: 'No announcements',
      message: 'Try another word.',
    },
    notFound: {
      title: 'Announcement not found',
      message: 'It may have been removed, or it has not loaded yet.',
    },
  },
  schedule: {
    title: 'Schedule',
    tabs: {
      exams: 'Exams',
      timetable: 'Timetable',
    },
    viewDocument: 'Open document',
    semester: 'Semester {{semester}}',
    otherExams: 'No date',
    original: {
      exams: 'Exam schedule',
      timetable: 'Timetable',
    },
    timetableView: {
      now: 'Now',
      next: 'Next',
      allSemesters: 'All',
      pde: 'Teaching cert.',
      noClasses: 'No classes on this day.',
      types: {
        lab: 'Lab',
        tutorial: 'Tutorial',
      },
    },
    unavailable: {
      exams: {
        title: 'No exam schedule',
        message: 'Your department does not publish an exam schedule we can show.',
      },
      timetable: {
        title: 'No timetable',
        message: 'Your department does not publish a timetable we can show.',
      },
    },
    notYet: {
      exams: {
        title: 'No exam schedule yet',
        message:
          "The last exam period is over and your department hasn't posted the next one yet. It will show here as soon as it does.",
      },
      timetable: {
        title: 'No timetable yet',
        message:
          "Your department hasn't posted this term's timetable yet. It will show here as soon as it does.",
      },
    },
    empty: {
      title: 'No schedule yet',
      message: "Your department's exam schedule and timetable will show up here.",
    },
  },
  universis: {
    findingDepartment: 'Finding your department…',
    grades: {
      title: 'Grades',
      average: 'Average',
      averageShort: 'Avg.',
      noAverage: 'No average yet',
      ects: 'ECTS',
      latest: 'Latest grades',
      all: 'See all',
      passed: 'Passed',
      updated: 'Updated {{time}}',
      semester: 'Semester {{letter}}',
      noSemester: 'No semester',
      none: 'No courses here.',
      error: 'Your grades could not be loaded from Universis.',
      connectTitle: 'Your grades, always with you',
      connectMessage:
        'Sign in to Universis once; your grades are saved on this device and open even without a connection.',
      show: {
        all: 'All',
        passed: 'Passed',
        owed: 'Owed',
      },
    },
    link: {
      title: 'Connect Universis',
      hint: 'Connect Universis so the schedule shows only your courses.',
      mine: 'My courses',
      cta: 'Connect',
    },
    filter: {
      label: 'Courses',
      all: 'All',
      owed: 'Owed',
      registered: 'Registered',
    },
    linked: 'Connected',
    loadingShort: 'Loading from Universis…',
    retryShort: 'Universis: retry',
    signOut: 'Disconnect',
    loading: 'Loading your courses from Universis…',
    error: 'Your courses could not be loaded from Universis. Showing the whole schedule.',
    expired: {
      title: 'Your Universis connection has expired',
      detail:
        'You are seeing your courses and grades as they were on {{time}}. Sign in again for the latest, such as new grades or a new declaration.',
      detailUndated:
        'You are seeing saved courses and grades. Sign in again for the latest, such as new grades or a new declaration.',
      cta: 'Sign in again',
    },
  },
  menu: {
    title: 'Menu',
    meals: {
      breakfast: 'Breakfast',
      lunch: 'Lunch',
      dinner: 'Dinner',
    },
    courses: {
      first: 'Starter',
      main: 'Main',
      extra: 'Sweet / Fruit',
    },
    breakfastCategories: {
      drinks: 'Drinks',
      spreads: 'Spreads',
      breads: 'Bread',
      staples: 'Staples',
    },
    today: 'Today',
    week: 'Week {{week}}',
    noMeal: 'No menu for this meal.',
    empty: {
      title: 'No menu yet',
      message: "The student restaurant's menu will show up here.",
    },
  },
  more: {
    title: 'More',
    studies: {
      section: 'Studies',
      universisLinked: 'Universis',
      universisLinkedHint: 'Linked. The schedule shows your courses.',
      gradesHint: 'From Universis, saved on your device',
    },
    department: {
      fromUniversis: 'From Universis',
      section: 'My department',
      change: 'Change department',
    },
    appearance: {
      section: 'Appearance',
      theme: 'Theme',
      themes: {
        system: 'Device',
        light: 'Light',
        dark: 'Dark',
      },
      language: 'Language',
    },
    about: {
      section: 'About',
      version: 'Version',
    },
    developer: {
      section: 'Development',
      designSystem: 'Design system',
      designSystemHint: 'Every interface element on one screen',
    },
  },
  states: {
    loading: 'Loading',
    offline: {
      title: 'You are offline',
      message: 'Connect to the internet to load this.',
      notice: 'Offline',
      lastUpdated: 'Last updated {{time}}',
    },
    error: {
      title: 'Something went wrong',
      message: 'This did not load. It is not your fault.',
      retry: 'Try again',
    },
  },
  common: {
    back: 'Back',
  },
  notFound: {
    title: 'This screen does not exist',
    action: 'Back to home',
  },
};
