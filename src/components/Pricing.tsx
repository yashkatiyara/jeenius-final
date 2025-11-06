// src/routes/Pricing.tsx
import React, { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X, Crown, Zap, Bot, Calendar, TrendingUp, Star } from "lucide-react";
import { supabase } from "@/utils/supabaseClient";

type Plan = {
  id: string;
  name: string; // "pro"
  monthly_price: number;
  yearly_price: number;
  discount_percent: number | null;
  features: string[];
};

type Subscription = {
  plan_id: string | null;
  status: "active" | "trialing" | "canceled" | "past_due" | "inactive";
  current_period_end: string | null;
};

async function getUserId() {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

async function fetchProPlan(): Promise<Plan | null> {
  const { data, error } = await supabase
    .from("plans")
    .select("id, name, monthly_price, yearly_price, discount_percent, features")
    .eq("name", "pro")
    .single();
  if (error) return null;
  return data as Plan;
}

async function fetchSubscription(user_id: string): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("plan_id, status, current_period_end")
    .eq("user_id", user_id)
    .maybeSingle();
  if (error) return null;
  return (data ?? null) as Subscription | null;
}

const PricingPage: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");
  const [plan, setPlan] = useState<Plan | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  const isPro =
    subscription?.status === "active" || subscription?.status === "trialing";

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const [p, uid] = await Promise.all([fetchProPlan(), getUserId()]);
        if (!mounted) return;
        setPlan(p);
        if (uid) {
          const sub = await fetchSubscription(uid);
          if (!mounted) return;
          setSubscription(sub);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const price = useMemo(() => {
    if (!plan) return { num: 0, suffix: "" };
    const num = billingCycle === "yearly" ? plan.yearly_price : plan.monthly_price;
    const suffix = billingCycle === "yearly" ? "/year" : "/month";
    return { num, suffix };
  }, [plan, billingCycle]);

  const handleCheckout = async () => {
    // Track intent
    try {
      // @ts-ignore
      window?.conversionManager?.trackPricingCTA?.({ billingCycle });
    } catch {}

    // Create order via Edge Function (Razorpay) & open checkout
    const userId = await getUserId();
    const { data, error } = await supabase.functions.invoke("create_razorpay_order", {
      body: {
        plan_id: plan?.id,
        billing_cycle: billingCycle, // 'monthly' | 'yearly'
        user_id: userId,
      },
    });

    if (error || !data?.order) {
      alert("Payment init failed. Please try again.");
      return;
    }

    // @ts-ignore: Razorpay script must be included (see note below)
    const rzp = new window.Razorpay({
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: data.order.amount,
      currency: data.order.currency,
      name: "JEEnius",
      description: `${plan?.name?.toUpperCase()} – ${billingCycle}`,
      order_id: data.order.id,
      handler: async (response: any) => {
        // verify via edge function
        const verify = await supabase.functions.invoke("verify_razorpay_payment", {
          body: { razorpay_response: response, plan_id: plan?.id, billing_cycle: billingCycle },
        });
        if (verify.error) {
          alert("Payment verification failed.");
          return;
        }
        // success → reload subscription state
        const uid = await getUserId();
        if (uid) {
          const sub = await fetchSubscription(uid);
          setSubscription(sub);
        }
      },
      theme: { color: "#16a34a" },
      modal: {
        ondismiss: () => {
          // @ts-ignore
          window?.conversionManager?.trackCheckoutDismiss?.();
        },
      },
      prefill: {}, // optional: name/email/phone from profile
    });

    rzp.open();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50">
      <Header />
      <div className="pt-20 pb-16 px-3 sm:px-6">
        {/* HERO */}
        <section className="text-center mb-8">
          <h1 className="text-3xl sm:text-5xl font-bold text-gray-900 leading-tight">
            Choose Your Path to <span className="text-green-600">JEE Success 🎯</span>
          </h1>
          <p className="text-gray-600 text-sm sm:text-lg max-w-2xl mx-auto mt-2">
            Start free, upgrade anytime — zero pressure, all progress.
          </p>

          {/* Billing Toggle */}
          <div className="mt-5 inline-flex p-1 bg-white rounded-xl border shadow-sm">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-4 py-2 text-sm sm:text-base rounded-lg font-semibold transition ${
                billingCycle === "monthly"
                  ? "bg-green-600 text-white shadow"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`relative px-4 py-2 text-sm sm:text-base rounded-lg font-semibold transition ${
                billingCycle === "yearly"
                  ? "bg-green-600 text-white shadow"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              Yearly
              <span className="hidden sm:inline-block absolute -top-2 -right-2 bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded-full">
                Save {plan?.discount_percent ?? 15}%
              </span>
            </button>
          </div>
        </section>

        {/* CARDS */}
        <section className="grid md:grid-cols-2 gap-5 max-w-5xl mx-auto">
          {/* STARTER */}
          <Card className="border-2 hover:shadow-xl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-gray-900">Starter</CardTitle>
              <p className="text-gray-600 mt-1">Free forever</p>
            </CardHeader>
            <CardContent className="text-sm sm:text-base">
              <ul className="space-y-3 mb-5">
                <li><Check className="inline w-5 h-5 text-green-600 mr-2" />25 questions/day</li>
                <li><Check className="inline w-5 h-5 text-green-600 mr-2" />150 questions/month</li>
                <li><Check className="inline w-5 h-5 text-green-600 mr-2" />2 mock tests/month</li>
                <li className="text-gray-400">
                  <X className="inline w-5 h-5 mr-2" />
                  Jeenie AI, Study Planner, Advanced analytics
                </li>
              </ul>
              <Button className="w-full bg-white border border-green-600 text-green-600 py-3 font-semibold">
                Continue Free
              </Button>
            </CardContent>
          </Card>

          {/* PRO */}
          <Card className="border-2 border-green-600 shadow-2xl relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-1 rounded-full text-xs font-bold shadow-md">
                MOST POPULAR
              </span>
            </div>
            <CardHeader className="text-center bg-gradient-to-br from-green-50 to-emerald-50">
              <CardTitle className="text-2xl font-bold text-gray-900">Pro</CardTitle>
              <div className="mt-2">
                {loading ? (
                  <span className="text-green-700 font-semibold">—</span>
                ) : (
                  <p className="text-green-700 font-semibold text-xl">
                    ₹{price.num}
                    <span className="text-sm text-gray-600"> {price.suffix}</span>
                  </p>
                )}
                {billingCycle === "yearly" && (
                  <p className="text-xs text-green-600 mt-1">
                    Save {plan?.discount_percent ?? 15}% with yearly
                  </p>
                )}
              </div>
            </CardHeader>
            <CardContent className="bg-white text-sm sm:text-base">
              <ul className="space-y-3 mb-6">
                {[
                  { text: "Unlimited questions", icon: Zap },
                  { text: "Unlimited mock tests", icon: TrendingUp },
                  { text: "Jeenie AI 24/7", icon: Bot },
                  { text: "AI Study Planner", icon: Calendar },
                  { text: "Advanced analytics", icon: Star },
                  { text: "Priority support", icon: Crown },
                ].map(({ text, icon: Icon }, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Icon className="w-5 h-5 text-green-600 mt-0.5" />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>

              {isPro ? (
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white py-3 font-semibold">
                  You’re already Pro 🎉
                </Button>
              ) : (
                <Button
                  onClick={handleCheckout}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 font-semibold shadow-md hover:scale-[1.02] transition"
                >
                  Upgrade to Pro 👑
                </Button>
              )}

              <p className="text-[11px] text-center text-gray-500 mt-3">
                Cancel anytime • 30-day refund
              </p>
            </CardContent>
          </Card>
        </section>

        {/* WHY PRO */}
        <section className="mt-10 text-center">
          <h2 className="text-2xl font-bold mb-4">Why Students ❤️ Pro</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            <div className="bg-white p-4 rounded-xl shadow-sm">
              <div className="text-3xl mb-2">🎯</div>
              <p className="font-semibold">3x faster progress</p>
              <p className="text-sm text-gray-600">Unlimited practice = faster improvement</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm">
              <div className="text-3xl mb-2">🤖</div>
              <p className="font-semibold">AI-powered prep</p>
              <p className="text-sm text-gray-600">Jeenie targets your weak areas</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm">
              <div className="text-3xl mb-2">💰</div>
              <p className="font-semibold">Less than ₹2/day</p>
              <p className="text-sm text-gray-600">Affordable, flexible, powerful</p>
            </div>
          </div>
        </section>
      </div>

      {/* **IMPORTANT**: Razorpay script (once globally, e.g., in index.html or root layout) */}
      {/* <script src="https://checkout.razorpay.com/v1/checkout.js"></script> */}
    </div>
  );
};

export default PricingPage;
