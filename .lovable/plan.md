
Goal: finish Step 2 in Supabase without touching code.

What “RPC” means:
- In your app, `place_bet` and `credit_win` are just PostgreSQL database functions.
- Supabase lets the frontend or edge functions call database functions; that is often called an “RPC”.
- So for Step 2, you are not clicking an “RPC” page. You are simply updating those functions in the SQL Editor.

Exactly what to click in Supabase:
1. Open your Supabase project.
2. In the left sidebar, click SQL Editor.
3. Click New query.
4. Paste the SQL below into the editor.
5. Click Run.
6. After it runs, go to Database → Functions and check that `place_bet` and `credit_win` are listed.

Paste this for Step 2:
```sql
DROP FUNCTION IF EXISTS public.place_bet(numeric);
DROP FUNCTION IF EXISTS public.credit_win(numeric);

CREATE OR REPLACE FUNCTION public.place_bet(bet_amount numeric, p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.user_balances
  SET balance = balance - bet_amount
  WHERE user_id = p_user_id
    AND balance >= bet_amount;

  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.credit_win(win_amount numeric, p_user_id uuid DEFAULT auth.uid())
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.user_balances
  SET balance = balance + win_amount
  WHERE user_id = p_user_id;
END;
$$;
```

What this does in plain English:
- `place_bet(...)` subtracts the bet from the right user’s balance.
- `credit_win(...)` adds winnings to the right user’s balance.
- `p_user_id` is needed because your secure server-side edge functions are the ones changing balances for a specific user.

What you should expect after clicking Run:
- The query should finish without a red error.
- You should then see both functions under Database → Functions.
- You do not need to wire them up manually anywhere else in Supabase.

Important correction for your next step:
- Step 3 is also done in SQL Editor.
- Because these functions now have 2 parameters, use the full function signatures when revoking access:
```sql
REVOKE EXECUTE ON FUNCTION public.credit_win(numeric, uuid) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.place_bet(numeric, uuid) FROM public, anon, authenticated;
```

Technical details:
- `SECURITY DEFINER` means the function runs with the function owner’s permissions.
- Your project already has edge functions that call these:
  - `start-game` calls `place_bet`
  - `resolve-game` calls `credit_win`
- After Step 2 and Step 3, the next Supabase section you’ll use is Edge Functions to deploy `start-game` and `resolve-game`.
