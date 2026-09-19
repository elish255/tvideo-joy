# Tvideo Site Fix

Nitengenezee hii site yangu https://tvideo.site/ usibadilishe chochote button zote ziwe zinafanya kazi , video ziwe Zina play kama picha inavoonesha

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://tvideo-joy.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/703e772c-6b90-4190-a7d8-7e8735218fb4).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Tvideo account & admin flow

- Registration saves users to `data/tvideo-db.json` (passwords are hashed).
- Login creates a secure HttpOnly session cookie.
- Activation fee is **TSh 16,000** via **LIPA NAMBA 251161660**, business **ASSERT BRIDGE**.
- First `NIMELIPIA` click shows `FANYA MALIPO KISHA JARIBU TENA`; second click asks for the payer phone and sends a verification request to admin.
- Admin can approve/reject payment requests and activate/deactivate users at `/admin`.
- Set `TVIDEO_ADMIN_USERNAME` and `TVIDEO_ADMIN_PASSWORD` from `.env.example` before running the app.

> The included file database is suitable for a Node server with persistent disk. For serverless production hosting, migrate the same tables/API to PostgreSQL/Supabase before launch.
