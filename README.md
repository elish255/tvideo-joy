# Tvideo Site Fix — Supabase + Vercel

Tvideo flow iliyowekwa kwenye project hii:

- Video ikimalizika, user anaona reward popup.
- Jisajili/Fungua Account inaenda kwenye registration flow.
- Registration ina-save user kwenye **Supabase PostgreSQL**.
- Password inahifadhiwa ikiwa hashed; haijahifadhiwi plain text.
- Login inatumia Username + Password.
- User mpya anaelekezwa kwenye Activation Payment page.
- Activation fee: **TSh 16,000**.
- **LIPA NAMBA: 251161660**.
- **Jina la Biashara: ASSERT BRIDGE**.
- `NIMELIPIA` mara ya kwanza: **FANYA MALIPO KISHA JARIBU TENA**.
- Mara ya pili user anaweka namba ya simu aliyolipia na kutuma payment verification request.
- Admin anaona payment requests, anaweza **Approve/Reject**, na approval ina-activate user.
- Admin anaweza pia **Activate/Deactivate** accounts moja kwa moja.
- Sessions na payment requests pia zinahifadhiwa Supabase, hivyo data haipotei kwenye Vercel serverless deployments.

## Supabase setup

1. Fungua Supabase project yako.
2. Nenda **SQL Editor**.
3. Run file `supabase-schema.sql` yote.
4. Nenda **Project Settings → API** na chukua:
   - Project URL
   - `service_role` key

## Vercel Environment Variables

Weka hizi kwenye Vercel project → Settings → Environment Variables:

```text
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
TVIDEO_ADMIN_USERNAME=your_admin_username
TVIDEO_ADMIN_PASSWORD=your_strong_admin_password
```

**Muhimu:** usiweke `SUPABASE_SERVICE_ROLE_KEY` ikiwa na prefix `VITE_`, na usiiweke kwenye frontend code. Hii key inatumika server-side tu.

Baada ya kuweka variables, fanya **Redeploy** kwenye Vercel.

## Local development

```sh
npm install
npm run dev
```
