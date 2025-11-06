// src/pages/Pricing.tsx
import React, { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import { Check, X, Crown, Zap, Bot, Calendar, TrendingUp, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { conversionManager } from "@/utils/conversionManager";

/** ---- API facades (align URLs to your backend; no logic changes) ---- */
async function fetchPlans() {
  // Expected: Array<{ id, name, badge?, primary?, features: string[], includes: Record<string, boolean>, pricing:{ monthly?:{amount,currency,compareAt?}, yearly?:{amount,currency,compareAt?} } }>
  const res = await fetch("/api/pricing/plans", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load plans");
  return res.json();
}

async function fetchUserSubscription() {
  // Expected: { tier: 'free'|'pro'|..., status: 'active'|'trialing'|'canceled'|..., currentPeriodEnd?: ISO }
  const res = await fetch("/api/user/subscription", { credentials: "include" });
  if (!res.ok) return null;
  return res.json();
}

async function startCheckout(planId: string, billingCycle: "monthly" | "yearly") {
  const res = await fetch("/api/billing/checkout", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ planId, billingCycle, source: "pricing_page" }),
  });
  if (!res.ok) throw new Error("Checkout init failed");
  return res.json();
}

const PricingPage: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [sub, setSub] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [plansRes, subRes] = await Promise.all([fetchPlans(), fetchUserSubscription()]);
        if (!active) return;
        setPlans(Array.isArray(plansRes) ? plansRes : plansRes?.plans ?? []);
        setSub(subRes);
      } catch (e: any) {
        setError(e?.message || "Failed to load pricing.");
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const starter = useMemo(
    () =>
      plans.find((p) => /starter|free|basic/i.test(p?.name || "")) ||
      plans.find((p) => !p?.primary) ||
      plans[0],
    [plans]
  );

  const pro = useMemo(
    () => plans.find((p) => p?.primary) || plans.find((p) => /pro|plus|premium/i.test(p?.name || "")) || plans[1],
    [plans]
  );

  const formattedPrice = (plan: any, cycle: "monthly" | "yearly") => {
    const point = plan?.pricing?.[cycle];
    if (!point) return null;
    const amount = point.amount;
    const currency = point.currency || "INR";
    const compareAt = point.compareAt;
    return { amount, currency, compareAt };
  };

  const handleUpgrade = async (planId: string, cycle: "monthly" | "yearly") => {
    try {
      setLoading(true);
      conversionManager?.trackCtaClick?.("pricing_page_upgrade", { planId, cycle });
      const { url } = await startCheckout(planId, cycle);
      window.location.href = url;
    } catch {
      setError("Couldn’t start checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isProActive = /pro|plus|premium/i.test(sub?.tier || "") && /active|trialing/i.test(sub?.status || "");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50">
      <Header />

      <div className="pt-24 pb-16">
        {/* Hero */}
        <section className="py-8 sm:py-12">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-3xl sm:text-5xl font-bold text-gray-900 mb-3">
              Choose Your Path to
              <span className="text-green-600 block mt-1">JEE Success 🎯</span>
            </h1>
            <p className="text-base sm:text-xl text-gray-600 max-w-2xl mx-auto mb-6 sm:mb-8">
              Start free, upgrade anytime. Transparent pricing, no surprises.
            </p>

            {/* Billing Toggle (mobile-first) */}
            <div className="inline-flex items-center rounded-xl border bg-white shadow-sm overflow-hidden">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-semibold transition-all ${
                  billingCycle === "monthly" ? "bg-green-600 text-white" : "text-gray-700 hover:bg-gray-50"
                }`}
                aria-pressed={billingCycle === "monthly"}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle("yearly")}
                className={`relative px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-semibold transition-all ${
                  billingCycle === "yearly" ? "bg-green-600 text-white" : "text-gray-700 hover:bg-gray-50"
                }`}
                aria-pressed={billingCycle === "yearly"}
              >
                Yearly
                <span className="hidden sm:inline absolute -top-2 -right-2 bg-orange-500 text-white text-[10px] px-2 py-1 rounded-full">
                  Save more
                </span>
              </button>
            </div>

            {!!error && (
              <p className="text-red-600 text-sm mt-4" role="alert">
                {error}
              </p>
            )}
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-6">
          <div className="container mx-auto px-3 sm:px-4">
            <div className="grid md:grid-cols-2 gap-4 sm:gap-8 max-w-5xl mx-auto">
              {/* Starter / Free */}
              {starter && (
                <Card className="relative shadow-lg hover:shadow-xl transition-all duration-300 border-2">
                  <CardHeader className="text-center pb-3 sm:pb-4">
                    <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900">
                      {starter.name || "Starter"}
                    </CardTitle>
                    <div className="mt-3">
                      <div className="flex items-baseline justify-center">
                        <span className="text-4xl sm:text-5xl font-bold text-gray-900">
                          {starter.pricing?.monthly?.amount > 0 || starter.pricing?.yearly?.amount > 0 ? "" : "₹0"}
                        </span>
                        <span className="text-gray-600 ml-2 text-sm sm:text-base">
                          {starter.pricing?.monthly?.amount > 0 || starter.pricing?.yearly?.amount > 0
                            ? ""
                            : "/forever"}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-500 mt-1">Perfect to get started</p>
                    </div>
                  </CardHeader>

                  <CardContent className="px-4 sm:px-6">
                    <ul className="space-y-2 sm:space-y-3 mb-5 sm:mb-8">
                      {(starter.features || []).map((f: string, i: number) => (
                        <li key={i} className="flex items-start space-x-2 sm:space-x-3">
                          <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700 text-sm sm:text-base">{f}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      className="w-full text-base sm:text-lg py-4 sm:py-6 bg-white border-2 border-green-600 text-green-600 hover:bg-green-50"
                      size="lg"
                      onClick={() => navigate("/")}
                    >
                      Get Started Free
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Pro */}
              {pro && (
                <Card className="relative shadow-2xl hover:shadow-3xl transition-all duration-300 border-2 border-green-500 md:scale-105">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 sm:px-6 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold flex items-center space-x-2 shadow-lg">
                      <Crown className="w-4 h-4" />
                      <span>{pro.badge || "MOST POPULAR"}</span>
                    </div>
                  </div>

                  <CardHeader className="text-center pb-3 sm:pb-4 bg-gradient-to-br from-green-50 to-emerald-50">
                    <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900">{pro.name || "Pro"}</CardTitle>
                    <div className="mt-3">
                      <div className="flex items-baseline justify-center">
                        {(() => {
                          const p = formattedPrice(pro, billingCycle);
                          if (!p) return <span className="text-gray-500">Pricing unavailable</span>;
                          return (
                            <>
                              <span className="text-4xl sm:text-5xl font-bold text-green-600">
                                {p.currency === "INR" ? "₹" : ""}
                                {p.amount}
                              </span>
                              <span className="text-gray-600 ml-2 text-sm sm:text-base">
                                /{billingCycle === "monthly" ? "month" : "year"}
                              </span>
                            </>
                          );
                        })()}
                      </div>
                      {(() => {
                        const p = formattedPrice(pro, billingCycle);
                        if (p?.compareAt) {
                          const saving = Number(p.compareAt) - Number(p.amount);
                          return (
                            <div className="mt-1 space-y-0.5">
                              <p className="text-xs sm:text-sm text-gray-500 line-through">
                                {p.currency === "INR" ? "₹" : ""}
                                {p.compareAt}/{billingCycle === "monthly" ? "month" : "year"}
                              </p>
                              <p className="text-green-600 font-semibold text-xs sm:text-sm">
                                Save {p.currency === "INR" ? "₹" : ""}
                                {saving}!
                              </p>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </CardHeader>

                  <CardContent className="bg-white px-4 sm:px-6">
                    {/* Feature highlights with icons */}
                    <ul className="space-y-2 sm:space-y-3 mb-5 sm:mb-8">
                      {(pro.features || []).slice(0, 8).map((f: string, i: number) => {
                        const Icon =
                          /unlimited/i.test(f) ? Zap
                          : /planner|calendar/i.test(f) ? Calendar
                          : /analytics|progress|rank|trend/i.test(f) ? TrendingUp
                          : /jeenie|ai/i.test(f) ? Bot
                          : Star;
                        const highlight = /unlimited|ai|planner|analytics/i.test(f);
                        return (
                          <li key={i} className="flex items-start space-x-2 sm:space-x-3">
                            <Icon className={`w-4 h-4 sm:w-5 sm:h-5 mt-0.5 ${highlight ? "text-green-600" : "text-green-500"}`} />
                            <span className={`${highlight ? "text-gray-900 font-semibold" : "text-gray-700"} text-sm sm:text-base`}>
                              {f}
                            </span>
                          </li>
                        );
                      })}
                    </ul>

                    {isProActive ? (
                      <Button
                        disabled
                        className="w-full text-base sm:text-lg py-4 sm:py-6 bg-gray-200 text-gray-600"
                        size="lg"
                      >
                        You’re already on Pro
                      </Button>
                    ) : (
                      <Button
                        disabled={loading || !pro?.id}
                        onClick={() => handleUpgrade(pro.id, billingCycle)}
                        className="w-full text-base sm:text-lg py-4 sm:py-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg active:scale-[0.99]"
                        size="lg"
                      >
                        Upgrade to Pro 👑
                      </Button>
                    )}

                    <p className="text-center text-[11px] sm:text-xs text-gray-500 mt-3">
                      Cancel anytime • 30-day money-back guarantee
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </section>

        {/* Feature Comparison Table (real data, no hardcode) */}
        {!!starter && !!pro && (
          <section className="py-10 sm:py-16 bg-white">
            <div className="container mx-auto px-3 sm:px-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-12">Detailed Comparison</h2>

              <div className="max-w-4xl mx-auto overflow-x-auto">
                <table className="w-full border-collapse text-sm sm:text-base">
                  <thead>
                    <tr className="border-b-2">
                      <th className="text-left py-3 sm:py-4 px-4 sm:px-6 font-semibold text-gray-900">Feature</th>
                      <th className="text-center py-3 sm:py-4 px-4 sm:px-6 font-semibold text-gray-900">
                        {starter.name || "Starter"}
                      </th>
                      <th className="text-center py-3 sm:py-4 px-4 sm:px-6 font-semibold text-green-600">
                        {pro.name || "Pro"}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {Array.from(
                      new Set([...(starter.features || []), ...(pro.features || [])])
                    ).map((feat, i) => {
                      const starterHas = (starter.includes && starter.includes[feat]) || (starter.features || []).includes(feat);
                      const proHas = (pro.includes && pro.includes[feat]) || (pro.features || []).includes(feat);
                      return (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="py-3 sm:py-4 px-4 sm:px-6 text-gray-700">{feat}</td>
                          <td className="text-center py-3 sm:py-4 px-4 sm:px-6">
                            {starterHas ? (
                              <Check className="w-5 h-5 text-green-600 mx-auto" />
                            ) : (
                              <X className="w-5 h-5 text-gray-300 mx-auto" />
                            )}
                          </td>
                          <td className="text-center py-3 sm:py-4 px-4 sm:px-6">
                            {proHas ? (
                              <Check className="w-5 h-5 text-green-600 mx-auto" />
                            ) : (
                              <X className="w-5 h-5 text-gray-300 mx-auto" />
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* Trust Section (light, non-annoying) */}
        <section className="py-10 sm:py-12 bg-gradient-to-br from-green-50 to-emerald-50">
          <div className="container mx-auto px-3 sm:px-4 text-center">
            <h3 className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8">Why Students Choose Pro</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 max-w-4xl mx-auto">
              <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
                <div className="text-3xl sm:text-4xl mb-2">🎯</div>
                <h4 className="font-bold mb-1">More Practice, Faster Progress</h4>
                <p className="text-xs sm:text-sm text-gray-600">Unlimited practice accelerates improvement.</p>
              </div>
              <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
                <div className="text-3xl sm:text-4xl mb-2">🤖</div>
                <h4 className="font-bold mb-1">AI-Powered Learning</h4>
                <p className="text-xs sm:text-sm text-gray-600">Jeenie adapts to your weak areas.</p>
              </div>
              <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
                <div className="text-3xl sm:text-4xl mb-2">💰</div>
                <h4 className="font-bold mb-1">Value You Can Feel</h4>
                <p className="text-xs sm:text-sm text-gray-600">Priced for students, cancel anytime.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default PricingPage;
