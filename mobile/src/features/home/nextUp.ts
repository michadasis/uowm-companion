import { nextExam } from '@/features/schedules/nextExam';
import type { ClassSession, Exam } from '@/features/schedules/schema';
import { groupOf, nextClass, PDE_GROUP } from '@/features/schedules/timetable';
import type { UpcomingClass } from '@/features/schedules/timetable';
import { filterByCourses, selectedCourseKeys } from '@/features/universis/match';
import type { StudentCourse } from '@/features/universis/types';

export type NextUp =
  | { kind: 'class'; upcoming: UpcomingClass }
  | { kind: 'exam'; exam: Exam }
  /** Nothing to show; `personalised` says whether the app knows whose schedule this is. */
  | { kind: 'none'; personalised: boolean };

export interface NextUpInput {
  classes: ClassSession[];
  exams: Exam[];
  /** The student's Universis courses, when linked. */
  courses?: StudentCourse[];
  /** The semester picked in the timetable, when one is. */
  semester: string | null;
  now?: Date;
}

// An exam that started a while ago is over; it should not hold the card.
const examGraceMinutes = 180;

/**
 * The letters of a semester label. The documents disagree on the tick after
 * the letter — "Γ΄", "Γ'" & "Γ’" all mean the third semester — & an exam shared
 * by two semesters lists both, as "Ε’, Ζ’".
 */
function semesterLetters(label: string): string[] {
  return label
    .split(',')
    .map((part) => /[Α-Ω]+/u.exec(part.trim())?.[0])
    .filter((letters): letters is string => letters !== undefined);
}

// "Mine", for a linked student, is the current declaration; should that be
// empty (between declaration periods, say) it is whatever is still owed.
function personalKeys(courses: StudentCourse[]): Set<string> | null {
  const registered = selectedCourseKeys(courses, 'registered');
  if (registered && registered.size > 0) return registered;
  return selectedCourseKeys(courses, 'owed');
}

function minutesUntilExam(exam: Exam, now: Date): number | null {
  if (!exam.date) return null;
  const start = new Date(`${exam.date}T${exam.startTime ?? '00:00'}:00`);
  if (Number.isNaN(start.getTime())) return null;
  return (start.getTime() - now.getTime()) / 60_000;
}

/**
 * What the Home screen's "next up" card should show: the student's next class
 * or exam, whichever comes first. It only answers for a schedule it can call
 * the student's own — narrowed by their Universis courses, or failing that by
 * the semester they picked. Without either, the next class in a whole
 * department's timetable would be somebody else's, so it shows none.
 */
export function pickNextUp({ classes, exams, courses, semester, now = new Date() }: NextUpInput): NextUp {
  const keys = courses ? personalKeys(courses) : null;
  if (!keys && !semester) return { kind: 'none', personalised: false };

  const pde = semester === PDE_GROUP;
  const wanted = semester && !pde ? semesterLetters(semester)[0] : undefined;
  const myClasses = keys
    ? filterByCourses(classes, keys)
    : classes.filter((session) => groupOf(session) === semester);
  const myExams = keys
    ? filterByCourses(exams, keys)
    : exams.filter((exam) =>
        pde
          ? exam.track === 'pde'
          : wanted !== undefined &&
            exam.semester !== undefined &&
            semesterLetters(exam.semester).includes(wanted),
      );

  const upcoming = nextClass(myClasses, now);
  const exam = nextExam(myExams, now);
  const examMinutes = exam ? minutesUntilExam(exam, now) : null;
  const examIsAhead = exam !== undefined && examMinutes !== null && examMinutes > -examGraceMinutes;

  if (examIsAhead && (!upcoming || examMinutes <= upcoming.minutesUntil)) {
    return { kind: 'exam', exam };
  }
  if (upcoming) return { kind: 'class', upcoming };
  return { kind: 'none', personalised: true };
}
