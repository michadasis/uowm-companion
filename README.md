# UoWM Companion

A native app for students of the University of Western Macedonia: announcements,
exam schedules, timetables and the student restaurant menu for all 22 departments,
in one place. It is a rebuild of the older [myCS](https://github.com/ieeesbkastoria/My-UoWM)
web app, which mostly links out to department websites; this app shows the content
itself, natively.

It is unofficial and not affiliated with the University of Western Macedonia.

## The one rule: everything is shown inside the app

Nothing opens as a file and nothing opens in a browser to be read. The backend turns
announcement HTML, web pages and the documents departments publish (DOCX, DOC, PDF,
XLSX) into a small typed block model, and the app renders it with its own native
components in its own typography. Exam schedules and timetables become real screens,
not documents.

The only things that leave the app are logins (in an in-app browser), phone calls,
emails, directions, the share sheet and an explicit "View on website" action.

## Layout

This is a monorepo with two packages:

- `mobile/` — the Expo app (React Native, TypeScript, Expo Router).
- `backend/` — the serverless API (Vercel functions, TypeScript). Only the backend
  ever talks to university sites; the app talks only to the backend, and falls back
  to what it bundles and what it has cached.

The app never scrapes or polls university sites. The backend fetches each source at
most every ten minutes, identifies itself with a User-Agent that names the app and
links this repo, respects robots.txt, and keeps each item's source URL as attribution.

## Status

Phase 1: the skeleton, the design system and the department registry.

- The design system, with a light and a dark theme tuned on their own, built from
  colour, type, spacing and motion tokens, with a loading, empty, offline and error
  state for every screen.
- Onboarding: pick your department, grouped by school and city, searchable in Greek
  and in Greeklish.
- The five tabs (Home, Announcements, Schedule, Menu, More), Greek and English, and
  the backend's `GET /api/departments`.

The feeds that fill the tabs come in later phases.

## Source coverage

Where each department publishes what, read off its own site. Every department is a
WordPress site: 20 serve announcements through the REST API, two through their
category archive page. Exam schedules and timetables have no common home, so a
feature is listed only where there is a dependable source for it.

Departments: 22 · announcements 22 · exam schedules 12 · timetables 16 · staff 22

| Department | City | Announcements | Exams | Timetable | Staff |
| --- | --- | :-: | :-: | :-: | :-: |
| Electrical and Computer Engineering | Kozani | yes | yes | yes | yes |
| Mechanical Engineering | Kozani | yes | - | yes | yes |
| Chemical Engineering | Kozani | yes | yes | yes | yes |
| Mineral Resources Engineering | Kozani | yes | - | yes | yes |
| Product and Systems Design Engineering | Kozani | yes | - | - | yes |
| International and European Economic Studies | Kozani | yes | - | - | yes |
| Management Science and Technology | Kozani | yes | - | - | yes |
| Accounting and Finance | Kozani | yes | yes | yes | yes |
| Regional and Cross-Border Development Studies | Kozani | yes | - | - | yes |
| Economics | Kastoria | yes | - | yes | yes |
| Business Administration | Grevena | yes | yes | yes | yes |
| Statistics | Grevena | yes | yes | yes | yes |
| Primary Education | Florina | yes | - | yes | yes |
| Early Childhood Education | Florina | yes | yes | yes | yes |
| Psychology | Florina | yes | yes | yes | yes |
| Communication and Digital Media | Kastoria | yes | yes | yes | yes |
| Mathematics | Kastoria | yes | yes | yes | yes |
| Informatics | Kastoria | yes | yes | yes | yes |
| Occupational Therapy | Ptolemaida | yes | yes | yes | yes |
| Midwifery | Ptolemaida | yes | - | - | yes |
| Fine and Applied Arts | Florina | yes | - | - | yes |
| Agriculture | Florina | yes | yes | yes | yes |

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
EXPO_PUBLIC_API_URL=http://<your-computer-ip>:3000 npx expo start --dev-client
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

## Credits

The first-year guides, FAQ and useful links reused in later phases come from
[My-UoWM](https://github.com/ieeesbkastoria/My-UoWM) by Open Source UoM, MIT licensed.
Their licence notice will be kept in `THIRD_PARTY_NOTICES.md` when that content is
included.
