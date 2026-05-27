# Persian (Farsi) RTL Localization

Convert the entire HireFlow ATS into a Persian-language, right-to-left (RTL) app, with a proper Persian font and a full Persian usage guide in the repository. Functionality, data model, routes, and component structure stay exactly as they are — only language, direction, and typography change.

## 1. Global RTL + Persian font

- Set `<html lang="fa" dir="rtl">` in `index.html`.
- Update `<title>` and meta description to Persian.
- Add **Vazirmatn** (the de-facto modern Persian UI font) via Google Fonts in `index.html`.
- Update `tailwind.config.ts` to set Vazirmatn as the default `font-sans` family with Persian-friendly fallbacks (`Vazirmatn, "Segoe UI", Tahoma, sans-serif`).
- In `src/index.css`, force `body { direction: rtl; text-align: right; }` and tweak a few global utilities that assume LTR.
- Install `**tailwindcss-rtl**` plugin so existing `ml-*`, `mr-*`, `pl-*`, `pr-*`, `left-*`, `right-*`, `text-left`, `text-right` classes automatically mirror under RTL. This avoids rewriting hundreds of class names.

## 2. Number & date formatting

- Add a small helper `src/lib/fa.ts` with `toFaDigits(value)` to convert Western digits (0–9) to Persian digits (۰–۹), and a `formatFaDate(date)` helper using `Intl.DateTimeFormat('fa-IR')`.
- Use these in the most visible spots (dashboard metrics, tables, dates, currency). Underlying values in the DB stay numeric/ISO — only display changes.

## 3. Translate all user-facing text to Persian

Walk through every page and component and translate visible strings (headings, labels, buttons, placeholders, toasts, empty states, tooltips, validation messages, table headers, status badges, nav items). The list of areas:

- **Auth**: Login, Signup, password reset
- **Layout / nav**: `AppSidebar`, `DynamicBreadcrumb`, `AppLayout`, `NotificationCenter`
- **Dashboard**: stats cards, recent activity, tasks panel, next meeting, job listings table
- **Jobs**: list, detail, create/edit dialogs, share dialog, team manager, custom questions, view dialog
- **Candidates**: list, detail, form, edit/add dialogs, ratings, comments, skill match, resume viewer, status dropdown, manager assignment
- **Applications**: list, detail, form, actions (hire/reject/withdraw)
- **Pipeline**: board, add candidate, bulk reject
- **Interviews**: list, detail, form, scorecard, schedule/quick-schedule dialogs, decision, reject dialog
- **Offers**: list, detail, form, approval section, approval-requested dialog, expiration warning, timeline
- **Messaging**: composer, timeline
- **Tasks**: page, list, add/edit dialogs
- **Templates**: list, form
- **Careers (public)**: home, job detail, application form
- **Settings**: account, organization, branding, notifications, user management, invite/edit/delete dialogs
- **Team members** page
- **Shared**: confirm dialog, file upload, activity timeline
- **Toasts / errors**: text passed to `toast()` and `sonner`
- **Email notification HTML** in `src/lib/email-notifications.ts` (subjects + bodies)
- **NotFound** page

Strings inside backend Edge Functions (e.g. `send-email`, `share-job`) stay as-is by default since they're server-side — I'll translate only those that are user-visible (email subjects/bodies in `email-notifications.ts` and the `share-job` template).

Brand names ("HireFlow", "Lovable Cloud", "Supabase", "Google", "Resend") stay in English per convention.

## 4. Fix RTL-specific UI issues

After the plugin is in, a few things still need manual review:

- Icons that imply direction (chevrons, arrows in breadcrumbs, "next/back" buttons) — flip via `rtl:rotate-180` where needed.
- `Sidebar` collapse direction.
- Charts (Recharts) — keep axes LTR for numeric data but translate labels.
- Any hard-coded inline `style={{ marginLeft }}` — convert to logical equivalent.

## 5. Persian usage guide

Add a new top-level file `**README.fa.md**` (and link to it from `README.md`) containing, in Persian:

- معرفی پروژه (what HireFlow is)
- پیش‌نیازها و نصب (Node, bun, env vars from Lovable Cloud)
- اجرای پروژه به صورت محلی
- ساختار پوشه‌ها (overview of `src/`, `supabase/`)
- راهنمای استفاده از هر بخش: داشبورد، مشاغل، کاندیداها، درخواست‌ها، پایپ‌لاین، مصاحبه‌ها، پیشنهادها، پیام‌ها، وظایف، قالب‌ها، صفحه عمومی مشاغل، تنظیمات
- حساب دمو (`demo@hireflow.app`) و نحوه ریست داده‌ها
- نقش‌های کاربری (site_admin, job_admin, basic) و دسترسی‌ها
- یکپارچه‌سازی‌ها: Resend (ایمیل)، HelloSign (امضای الکترونیکی)
- استقرار (publish via Lovable)
- نکته در مورد RTL و فونت Vazirmatn

## Technical details

- New dep: `tailwindcss-rtl` (added to `tailwind.config.ts` plugins).
- Font: loaded via `<link>` in `index.html` from `fonts.googleapis.com` (Vazirmatn weights 300/400/500/600/700).
- No DB migrations, no edge function logic changes, no route changes, no auth changes.
- The Supabase-generated files (`client.ts`, `types.ts`, `.env`) are NOT touched.
- shadcn `ui/` primitives are mostly left alone — they have very little text. Only the few that contain English strings (e.g. pagination "Previous/Next" if used) get translated.

## Out of scope

- A language switcher / multi-language i18n layer. The app becomes Persian-only, per your request.
- Translating server logs, code comments, or developer-facing English in Edge Functions.
- Redesigning layout or color — only direction, font, and language change.

## Deliverables

- App renders fully in Persian, RTL, with Vazirmatn.
- All visible text translated.
- `README.fa.md` with a complete Persian usage guide, linked from `README.md`.

# Filling with mock data

- also fill the app fully with the persian exactly like real mock data