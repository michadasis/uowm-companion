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
    start: 'Get started',
    language: 'Language',
  },
  departmentPicker: {
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
    greeting: {
      morning: 'Good morning',
      afternoon: 'Good afternoon',
      evening: 'Good evening',
    },
    nextUp: {
      title: 'Next up',
      empty: 'Your next class or exam will show up here.',
    },
    menuToday: {
      title: 'At the restaurant today',
      empty: "Today's menu will show up here.",
    },
    latest: {
      title: 'Latest announcements',
      empty: "Your department's newest announcements will show up here.",
    },
  },
  announcements: {
    title: 'Announcements',
    empty: {
      title: 'No announcements yet',
      message: 'Announcements from your department and the university will show up here.',
    },
  },
  schedule: {
    title: 'Schedule',
    empty: {
      title: 'No schedule yet',
      message: "Your department's exam schedule and timetable will show up here.",
    },
  },
  menu: {
    title: 'Menu',
    empty: {
      title: 'No menu yet',
      message: "The student restaurant's menu will show up here.",
    },
  },
  more: {
    title: 'More',
    department: {
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
