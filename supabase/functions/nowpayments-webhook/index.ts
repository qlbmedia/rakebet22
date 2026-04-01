import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const toPositiveNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("Webhook received:", JSON.stringify(body));

    const {
      payment_id,
      parent_payment_id,
      payment_status,
      order_id,
      pay_address,
      actually_paid,
      actually_paid_at_fiat,
      pay_currency,
      price_amount,
      price_currency,
      outcome_amount,
      outcome_currency,
    } = body;

    if (!payment_id || !payment_status) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const creditableStatuses = ["finished", "partially_paid"];
    const normalizedPayCurrency = pay_currency?.toLowerCase?.() ?? null;

    const { data: existingDeposit } = await supabase
      .from("deposits")
      .select("user_id, status, pay_address, pay_currency")
      .eq("payment_id", String(payment_id))
      .maybeSingle();

    let deposit = existingDeposit;
    let depositOwner = existingDeposit;

    if (!deposit && parent_payment_id) {
      const { data: parentDeposit } = await supabase
        .from("deposits")
        .select("user_id, status, pay_address, pay_currency")
        .eq("payment_id", String(parent_payment_id))
        .maybeSingle();

      deposit = parentDeposit;
      depositOwner = parentDeposit;
    }

    if (!deposit && pay_address) {
      const { data: addressDeposits } = await supabase
        .from("deposits")
        .select("user_id, status, pay_address, pay_currency")
        .eq("pay_address", pay_address)
        .limit(1);

      deposit = addressDeposits?.[0] ?? null;
      depositOwner = addressDeposits?.[0] ?? null;
    }

    if (!deposit && order_id) {
      deposit = {
        user_id: order_id,
        status: null,
        pay_address: pay_address ?? null,
        pay_currency: normalizedPayCurrency,
      };
      depositOwner = deposit;
    }

    if (!depositOwner?.user_id) {
      console.error("Unable to resolve deposit owner", { payment_id, parent_payment_id, pay_address, order_id });
      throw new Error("Deposit owner could not be resolved");
    }

    if (!existingDeposit) {
      const { error: insertDepositError } = await supabase.from("deposits").insert({
        user_id: depositOwner.user_id,
        payment_id: String(payment_id),
        pay_address: pay_address ?? depositOwner.pay_address,
        pay_currency: normalizedPayCurrency ?? depositOwner.pay_currency,
        price_amount: Number(price_amount ?? 0),
        actually_paid: Number(actually_paid ?? 0),
        status: payment_status,
      });

      if (insertDepositError) {
        console.error("Insert deposit error:", insertDepositError);
        throw new Error("Failed to store deposit webhook event");
      }
    }

    const alreadyCredited =
      existingDeposit?.status === "finished" || existingDeposit?.status === "partially_paid";

    if (alreadyCredited) {
      console.log(`Deposit ${payment_id} already credited, skipping duplicate`, {
        payment_id,
        existing_status: existingDeposit?.status,
        pay_address,
        parent_payment_id,
      });
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (creditableStatuses.includes(payment_status)) {
      const userId = depositOwner.user_id;
      const normalizedPriceCurrency = price_currency?.toLowerCase?.() ?? null;
      const normalizedOutcomeCurrency = outcome_currency?.toLowerCase?.() ?? null;

      const creditAmount =
        toPositiveNumber(actually_paid_at_fiat) ??
        (normalizedOutcomeCurrency === "usd" ? toPositiveNumber(outcome_amount) : null) ??
        (normalizedPayCurrency === "usd" ? toPositiveNumber(actually_paid) : null) ??
        (payment_status === "finished" && normalizedPriceCurrency === "usd"
          ? toPositiveNumber(price_amount)
          : null);

      if (!creditAmount) {
        console.error("Unable to determine fiat credit amount", {
          payment_id,
          payment_status,
          actually_paid,
          actually_paid_at_fiat,
          pay_currency,
          price_amount,
          price_currency,
          outcome_amount,
          outcome_currency,
        });
        throw new Error("Unable to determine fiat credit amount for deposit");
      }

      console.log("Crediting deposit", {
        payment_id,
        user_id: userId,
        payment_status,
        credit_amount: creditAmount,
        actually_paid,
        actually_paid_at_fiat,
        pay_currency: normalizedPayCurrency,
        outcome_amount,
        outcome_currency: normalizedOutcomeCurrency,
      });

      const { data: existing, error: existingBalanceError } = await supabase
        .from("user_balances")
        .select("balance")
        .eq("user_id", userId)
        .maybeSingle();

      if (existingBalanceError) {
        console.error("Balance lookup error:", existingBalanceError);
        throw new Error("Failed to load user balance");
      }

      if (existing) {
        const { error: balanceError } = await supabase
          .from("user_balances")
          .update({ balance: existing.balance + creditAmount })
          .eq("user_id", userId);
        if (balanceError) {
          console.error("Balance update error:", balanceError);
          throw new Error("Failed to update user balance");
        }
      } else {
        const { error: balanceError } = await supabase
          .from("user_balances")
          .insert({ user_id: userId, balance: creditAmount });
        if (balanceError) {
          console.error("Balance insert error:", balanceError);
          throw new Error("Failed to create user balance");
        }
      }

      console.log(`Credited user ${userId} with $${creditAmount}`);
    }

    const { error: updateError } = await supabase
      .from("deposits")
      .update({
        status: payment_status,
        actually_paid: Number(actually_paid ?? 0),
        pay_address: pay_address ?? depositOwner.pay_address,
        pay_currency: normalizedPayCurrency ?? depositOwner.pay_currency,
      })
      .eq("payment_id", String(payment_id));

    if (updateError) {
      console.error("Update deposit error:", updateError);
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
