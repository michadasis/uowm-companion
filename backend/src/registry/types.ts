export type CityId = 'kozani' | 'florina' | 'kastoria' | 'ptolemaida' | 'grevena';

export type SchoolId =
  | 'engineering'
  | 'economics'
  | 'fine-arts'
  | 'agriculture'
  | 'social-sciences'
  | 'health'
  | 'sciences';

export interface LocalisedText {
  el: string;
  en: string;
}

export interface City {
  id: CityId;
  name: LocalisedText;
}

export interface School {
  id: SchoolId;
  name: LocalisedText;
  /** The city the school is seated in. Its departments can be elsewhere. */
  seat: CityId;
}

/**
 * Posts read through the WordPress REST API, limited to the categories the
 * department uses for student announcements. Listing categories also keeps
 * the feed in Greek on bilingual sites, where translations live in
 * categories of their own.
 */
export interface WordPressRestSource {
  adapter: 'wordpress-rest';
  /** The site's REST root, as advertised by its `api.w.org` link. */
  apiRoot: string;
  categories: number[];
}

/**
 * Posts scraped from a category archive page. Only for sites that refuse
 * anonymous REST requests, since their robots.txt also rules out the feeds.
 * The archive gives the list of post links; the title, date & body are read
 * from each post's own page, whose markup is far more uniform than an
 * archive theme's.
 */
export interface HtmlListingSource {
  adapter: 'html-listing';
  listingUrl: string;
  /** The path prefix a post permalink has on this site, e.g. "/nea/". */
  postPathPrefix: string;
}

export type AnnouncementsSource = WordPressRestSource | HtmlListingSource;

/**
 * Where a department keeps its current exam schedule or timetable.
 *
 * - `document-page`: a standing page that lists the documents. `pick` says
 *   which link is the current one.
 * - `menu-link`: the site menu links to the current document, or to a page
 *   that holds it. The target changes every semester, so it is found again
 *   by the start of its label, ignoring case and accents.
 * - `embedded-sheet`: a standing page that embeds a Google Sheet; the sheet
 *   is read as a spreadsheet export.
 * - `wordpress-posts`: each new schedule is published as a post, its document
 *   attached. The posts are found by category, by a search, or both, & the
 *   newest one whose title names the right kind of schedule is taken.
 */
export type ScheduleSource =
  | { adapter: 'document-page'; pageUrl: string; pick: 'first-link' | 'newest-upload' }
  | { adapter: 'menu-link'; pageUrl: string; label: string }
  | { adapter: 'embedded-sheet'; pageUrl: string }
  | { adapter: 'wordpress-posts'; apiRoot: string; category?: number; search?: string }
  /** A site's post listing, read for the newest post titled as the schedule. */
  | { adapter: 'listing-posts'; listingUrl: string };

export interface PageSource {
  adapter: 'html-page';
  url: string;
}

export interface DepartmentSources {
  announcements: AnnouncementsSource;
  exams?: ScheduleSource;
  timetable?: ScheduleSource;
  staff?: PageSource[];
  secretariat?: PageSource;
}

export type SourceKind = keyof DepartmentSources;

export interface Department {
  /** The department's subdomain on uowm.gr, which is stable and unique. */
  id: string;
  name: LocalisedText;
  /** The name without "Τμήμα" or "Department of", for lists. */
  shortName: LocalisedText;
  /** Abbreviations students use, so that search finds "ΤΗΜΜΥ". */
  aliases: string[];
  school: SchoolId;
  city: CityId;
  website: string;
  sources: DepartmentSources;
}

export interface UniversitySources {
  announcements: AnnouncementsSource;
}
