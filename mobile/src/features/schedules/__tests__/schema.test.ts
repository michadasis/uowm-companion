import { scheduleResponseSchema } from '../schema';

const base = {
  dept: 'cs',
  kind: 'exams',
  available: true,
  document: { url: 'https://cs.uowm.gr/e.docx', label: 'Εξετάσεις', format: 'docx' },
  exams: [],
  classes: [],
  original: [{ type: 'paragraph', content: [{ text: 'Κείμενο' }] }],
};

describe('scheduleResponseSchema', () => {
  it('parses a schedule with a document & an Original view', () => {
    expect(scheduleResponseSchema.parse(base)).toMatchObject({ dept: 'cs', available: true });
  });

  it('parses a department that publishes no schedule', () => {
    const none = { ...base, available: false, document: null, original: [] };
    expect(scheduleResponseSchema.parse(none).document).toBeNull();
  });

  it('keeps the structured exam fields it is given', () => {
    const withExam = {
      ...base,
      exams: [{ course: 'Αλγόριθμοι', date: '2026-01-20', startTime: '09:00', room: 'Α2' }],
    };
    expect(scheduleResponseSchema.parse(withExam).exams[0]).toEqual({
      course: 'Αλγόριθμοι',
      date: '2026-01-20',
      startTime: '09:00',
      room: 'Α2',
    });
  });

  it('rejects a document format the app cannot handle', () => {
    const bad = { ...base, document: { ...base.document, format: 'zip' } };
    expect(scheduleResponseSchema.safeParse(bad).success).toBe(false);
  });
});
