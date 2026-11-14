import { z } from 'zod';

const localisedText = z.object({ el: z.string(), en: z.string() });

// Ids are plain strings on purpose. If the university adds a city or a
// school, an app that is already installed should show it, not reject the
// whole response because of an enum it was built with.
const city = z.object({ id: z.string(), name: localisedText });

const school = z.object({ id: z.string(), name: localisedText, seat: z.string() });

const department = z.object({
  id: z.string(),
  name: localisedText,
  shortName: localisedText,
  aliases: z.array(z.string()),
  school: z.string(),
  city: z.string(),
  website: z.string(),
  features: z.array(z.string()),
});

export const directorySchema = z.object({
  cities: z.array(city),
  schools: z.array(school),
  departments: z.array(department).min(1),
});

export type LocalisedText = z.infer<typeof localisedText>;
export type City = z.infer<typeof city>;
export type School = z.infer<typeof school>;
export type Department = z.infer<typeof department>;
export type Directory = z.infer<typeof directorySchema>;
