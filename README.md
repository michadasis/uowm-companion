<div align="center">
  <img src="mobile/assets/brand/readme-icon.png" width="100" />
  <h1>UoWM Companion</h1>
  <p>Announcements, schedules, the restaurant menu and your grades, for every department of the University of Western Macedonia.</p>
</div>

A native app for students of the University of Western Macedonia that compiles announcements,
exam schedules, timetables, the student restaurant menu and student grades for all 22 departments,
in one place. It takes the idea of
[myCS](https://github.com/ieeesbkastoria/My-UoWM), the web app the IEEE Student
Branch of UoWM Kastoria built for the Informatics department alone, and extends it
to the whole university while showing the content natively rather than linking out
to department websites.

It is unofficial and not affiliated with the University of Western Macedonia and for now remains a hobby project.

## What it does

- **Home**: the day at a glance. A greeting by name, the next class or exam,
  the grades summary, today's menu and the two latest announcements. On a
  holiday, a break or a weekend it says so, from the academic calendar.
- **Announcements**: the department's and the university's, with their images,
  tables and attachments shown in the app, and a search.
- **Schedule**: the timetable and the exam schedule as real screens, by day,
  with the semester filters and, once Universis is linked, just the student's
  declared courses. Days off from the academic calendar are greyed out.
- **Restaurant**: breakfast, lunch and dinner for each day of the week.
- **Universis**: linking it brings in the grades (average, ECTS, the latest
  results) and the declared courses, and the student's name and department. On
  a first launch, signing in to Universis picks the department.

## Universis and privacy

Students sign in to Universis on the university's own pages, in an in-app
browser, with its single sign-on and two-factor step. The app never sees a
password: it keeps only the access token, in the device's keychain. What it
reads with that token (courses, grades, the given name, gender and department) stays on
the device and is cleared on signing out. None of it goes through the backend.

## The one rule, everything is shown inside the app

Nothing opens as a file and nothing opens in a browser to be read. The backend turns
announcement HTML, web pages and the documents departments publish (DOCX, DOC, PDF,
XLSX) into a small typed block model, and the app renders it with its own native
components in its own typography. Exam schedules and timetables become real screens,
not documents.

The only things that leave the app are logins (in an in-app browser), phone calls,
emails, directions, the share sheet and an explicit "View on website" action.

## Layout

This is a monorepo with two packages:

- `mobile/` - the Expo app (React Native, TypeScript, Expo Router).
- `backend/` - the serverless API (TypeScript). Only the backend
  talks to the university's websites; the app talks to the backend, and falls back
  to what it bundles and what it has cached. The one exception is Universis, which
  the app calls itself with the student's token, so their grades never pass
  through the backend.

The app never scrapes or polls university sites. The backend fetches each source at
most every ten minutes, identifies itself with a User-Agent that names the app and
links this repo, respects robots.txt, and keeps each item's source URL as attribution.
A few scheduled requests to `/api/warm` keep the CDN's copies fresh, so a student
rarely waits on a department's site.

The university sites mark their images as for their own pages only
(`Cross-Origin-Resource-Policy: same-site`), so `/api/image` passes an image on
from them, for `https` addresses on `uowm.gr` alone, and the CDN keeps a copy.

The academic calendar (teaching periods, exam periods, breaks and holidays) is
read from the Senate's decision, published as a PDF on the university's site.

## Source coverage

Where each department publishes what, read off its own site. Every department is a
WordPress site: 20 serve announcements through the REST API, two through their
category archive page. Exam schedules and timetables have no common home, so a
feature is listed only where there is a dependable source for it.

Departments: 22, announcements 22, exam schedules 22, timetables 22.

Timetables and exam schedules are read from whatever the department publishes:
a page, a PDF, a Word file (DOCX or the older DOC) or a spreadsheet. Tables are
rebuilt from the documents' text, including PDFs printed sideways and lists
spread over several pages, so they become screens rather than files. An exam
schedule from a sitting that has ended is not shown as if it were current, and
neither is a timetable from a past term: Regional and Cross-Border Development
has published none since spring 2024-25, so the app says there is none yet. A
few documents are laid out in ways no parser reads yet (Mechanical and Mineral
Resources Engineering's exam schedules); those are shown as written.

| Department | City | Announcements | Exams | Timetable |
| --- | --- | :-: | :-: | :-: |
| Electrical and Computer Engineering | Kozani | yes | yes | yes |
| Mechanical Engineering | Kozani | yes | yes | yes |
| Chemical Engineering | Kozani | yes | yes | yes |
| Mineral Resources Engineering | Kozani | yes | yes | yes |
| Product and Systems Design Engineering | Kozani | yes | yes | yes |
| International and European Economic Studies | Kozani | yes | yes | yes |
| Management Science and Technology | Kozani | yes | yes | yes |
| Accounting and Finance | Kozani | yes | yes | yes |
| Regional and Cross-Border Development Studies | Kozani | yes | yes | yes |
| Economics | Kastoria | yes | yes | yes |
| Business Administration | Grevena | yes | yes | yes |
| Statistics | Grevena | yes | yes | yes |
| Primary Education | Florina | yes | yes | yes |
| Early Childhood Education | Florina | yes | yes | yes |
| Psychology | Florina | yes | yes | yes |
| Communication and Digital Media | Kastoria | yes | yes | yes |
| Mathematics | Kastoria | yes | yes | yes |
| Informatics | Kastoria | yes | yes | yes |
| Occupational Therapy | Ptolemaida | yes | yes | yes |
| Midwifery | Ptolemaida | yes | yes | yes |
| Fine and Applied Arts | Florina | yes | yes | yes |
| Agriculture | Florina | yes | yes | yes |

## Running it locally

Both packages need Node 24 (Expo SDK 58 does not support Node 25). The repo pins it
in `.nvmrc`.

Backend:

```
cd backend
npm install
npm run dev        # serves the API on http://localhost:3000
```

App:

```
cd mobile
npm install
EXPO_PUBLIC_API_URL=http://localhost:3000 npx expo start
```

The app runs in a development build, not Expo Go, because it uses native modules.
Without `EXPO_PUBLIC_API_URL` set it still runs, on the department list it bundles.

## Tests

Each package has its own suite:

```
cd backend && npm run lint && npm run typecheck && npm test
cd mobile  && npm run lint && npm run typecheck && npm test
```

GitHub Actions runs both on every push and pull request.
