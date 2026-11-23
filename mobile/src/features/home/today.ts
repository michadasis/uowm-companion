import type { TFunction } from 'i18next';

import { holidayName } from '@/features/calendar/names';
import { addDays, dateOf, isoDay } from '@/features/calendar/status';
import type { DayStatus } from '@/features/calendar/status';

import { dayPart } from './greeting';

export type TodayTone = 'calm' | 'rest' | 'exams' | 'study';

/** What the top of the Home screen says about the day. */
export interface TodayMessage {
  /** A short tag above the title, for a day out of the ordinary. */
  badge?: string;
  tone: TodayTone;
  title: string;
  /** A sentence under the title; absent, the department's name goes there. */
  message?: string;
}

/**
 * A day as a sentence would put it after "on": "αύριο", "τη Δευτέρα 23
 * Νοεμβρίου", "on Monday 23 November".
 */
export function onDay(date: Date, now: Date, language: string, t: TFunction): string {
  if (isoDay(date) === isoDay(addDays(now, 1))) return t('calendar.tomorrow');
  const formatted = new Intl.DateTimeFormat(language, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date);
  if (language !== 'el') return `on ${formatted}`;
  // Greek keeps the article's final ν before a vowel or a hard consonant.
  const article =
    date.getDay() === 6 ? 'το' : /^[αεηιουωάέήίόύώκπτξψ]/iu.test(formatted) ? 'την' : 'τη';
  return `${article} ${formatted}`;
}

/** Whole days from today to a date: 1 for tomorrow. */
function daysUntil(date: Date, now: Date): number {
  const day = 24 * 60 * 60 * 1000;
  return Math.round((dateOf(isoDay(date)).getTime() - dateOf(isoDay(now)).getTime()) / day);
}

// "την Τρίτη…" opening a sentence.
const capitalise = (text: string, language: string): string =>
  text.charAt(0).toLocaleUpperCase(language) + text.slice(1);

/** A date written short, "5 Φεβρουαρίου" or "5 February". */
function shortDate(iso: string, language: string): string {
  return new Intl.DateTimeFormat(language, { day: 'numeric', month: 'long' }).format(dateOf(iso));
}

/**
 * Words for the day, from the academic calendar's view of it: warm on a
 * holiday or a weekend, encouraging in the exams, & on an ordinary teaching
 * day a plain greeting — with a word about a day off coming that week.
 */
export function todayMessage(
  status: DayStatus | null,
  now: Date,
  language: string,
  t: TFunction,
  /** The student's name in the vocative, to address them by. */
  name?: string | null,
): TodayMessage {
  const message = compose(status, now, language, t);
  if (!name) return message;
  // A greeting or a wish addresses the student; a holiday's name does not.
  const personal =
    message.title === t(`home.greeting.${dayPart(now)}`) || message.title.endsWith('!');
  if (!personal) return message;
  const title = message.title.endsWith('!')
    ? `${message.title.slice(0, -1)}, ${name}!`
    : `${message.title}, ${name}`;
  return { ...message, title };
}

function compose(
  status: DayStatus | null,
  now: Date,
  language: string,
  t: TFunction,
): TodayMessage {
  const greeting = t(`home.greeting.${dayPart(now)}`);
  const resumes = (date?: Date) =>
    date ? t('home.today.resumes', { when: onDay(date, now, language, t) }) : undefined;
  // Over a long break, how many days are left is the point: "in 10 days, on
  // Thursday 7 January". From the day before, "tomorrow" says it all.
  const counted = (key: 'resumes' | 'termStarts', date: Date) => {
    const days = daysUntil(date, now);
    const when = onDay(date, now, language, t);
    return days >= 2 ? t(`home.today.${key}In`, { days, when }) : t(`home.today.${key}`, { when });
  };

  if (!status) return { tone: 'calm', title: greeting };

  switch (status.kind) {
    case 'vacation': {
      const easter = status.holiday.key === 'easter';
      return {
        tone: 'rest',
        badge: holidayName(status.holiday, t),
        title: t(easter ? 'home.today.easter' : 'home.today.christmas'),
        message: status.resumes ? counted('resumes', status.resumes) : undefined,
      };
    }
    case 'holiday': {
      const local = status.holiday.key === 'local';
      return {
        tone: 'rest',
        badge: t('home.today.holidayBadge'),
        title: local ? t('home.today.localHoliday') : holidayName(status.holiday, t),
        message: status.resumes
          ? t('home.today.noClassesUntil', { when: onDay(status.resumes, now, language, t) })
          : t('home.today.noClasses'),
      };
    }
    case 'weekend':
      return {
        tone: 'rest',
        title: t('home.today.weekend'),
        message:
          status.during === 'exams' || status.during === 'resits'
            ? t('home.today.weekendExams')
            : resumes(status.resumes),
      };
    case 'exams':
      return {
        tone: 'exams',
        badge: t(
          status.period.kind === 'resits' ? 'home.today.resitsBadge' : 'home.today.examsBadge',
        ),
        title: t('home.today.goodLuck'),
        message: t('home.today.examsUntil', { date: shortDate(status.period.to, language) }),
      };
    case 'gap': {
      const exams = status.next?.kind === 'exams';
      return {
        tone: 'study',
        badge: t('home.today.gapBadge'),
        title: t(exams ? 'home.today.studyWeek' : 'home.today.shortBreak'),
        message: status.next
          ? t(exams ? 'home.today.examsStart' : 'home.today.termStarts', {
              when: onDay(dateOf(status.next.from), now, language, t),
            })
          : undefined,
      };
    }
    case 'teaching':
      return {
        tone: 'calm',
        title: greeting,
        message: status.aheadHoliday
          ? capitalise(
              t('home.today.holidayAhead', {
                when: onDay(status.aheadHoliday.date, now, language, t),
                name: holidayName(status.aheadHoliday.holiday, t),
              }),
              language,
            )
          : undefined,
      };
    case 'off': {
      const summer = now.getMonth() >= 5 && now.getMonth() <= 8;
      return {
        tone: 'rest',
        title: t(summer ? 'home.today.summer' : 'home.today.offTitle'),
        message:
          status.next?.kind === 'teaching'
            ? counted('termStarts', dateOf(status.next.from))
            : status.next
              ? t('home.today.examsStart', {
                  when: onDay(dateOf(status.next.from), now, language, t),
                })
              : undefined,
      };
    }
  }
}
