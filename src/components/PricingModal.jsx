// src/components/PricingModal.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { X, Crown, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { conversionManager } from "@/utils/conversionManager";

type LimitType =
  | "daily_limit"
  | "monthly_limit"
  | "test_limit"
  | "jeenie_blocked"
  | "study_planner_blocked"
  | "almost_there";

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  limitType?: LimitType;
  /** Optional: pass pre-fetched stats to avoid an extra request */
  userStats?: {
    questionsCompleted?: number;
    testsCompleted?: number;
    currentStreak?: number;
  };
  /** Optional: disable frequency cap (for QA) */
  disableFrequencyCap?: boolean;
}

/** ---- Utilities (frontend-only; no backend logic changes) ---- */

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Frequency cap: avoid annoying users */
const FREQUENCY_CAP_KEY = "pricing_modal_cap_v2";
const canShowModalByCap = (type: LimitType) => {
  try {
    const raw = localStorage.getItem(FREQUENCY_CAP_KEY);
    const now = Date.now();
    const data: Record<
      string,
      { lastShown: number; showCountToday: number; day: string }
    > = raw ? JSON.parse(raw) : {};
    const today = new Date().toISOString().slice(0, 10);

    const entry = data[type] || {
      lastShown: 0,
      showCountToday: 0,
      day: today,
    };

    // reset daily counter
    if (entry.day !== today) {
      entry.day = today;
      entry.showCountToday = 0;
    }

    const ONE_HOUR = 60 * 60 * 1000;
    const hourGatePassed = now - entry.lastShown > ONE_HOUR; // at most once per hour
    const underDailyCap = entry.showCountToday < 3; // at most 3/day

    return { allowed: hourGatePassed && underDailyCap, data, entry, today };
  } catch {
    // If anything fails, allow showing (don’t silently block revenue)
    return {
      allowed: true,
      data: {},
      entry: { lastShown: 0, showCountToday: 0, day: new Date().toISOString().slice(0, 10) },
      today: new Date().toISOString().slice(0, 10),
    };
  }
};

const markModalShown = (type: LimitType) => {
  try {
    const raw = localStorage.getItem(FREQUENCY_CAP_KEY);
    const now = Date.now();
    const data: Record<
      string,
      { lastShown: number; showCountToday: number; day: string }
    > = raw ? JSON.parse(raw) : {};
    const today = new Date().toISOString().slice(0, 10);

    const entry = data[type] || { lastShown: 0, showCountToday: 0, day: today };
    if (entry.day !== today) {
      entry.day = today;
      entry.showCountToday = 0;
    }
    entry.lastShown = now;
    entry.showCountToday += 1;
    data[type] = entry;
    localStorage.setItem(FREQUENCY_CAP_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
};

/** ---- API facades (align/rename URLs to your backend without changing logic) ---- */
async function fetchPlans() {
  // Expected: Array<{ id, name, badge?, features: string[], includes:{ [featureKey]: boolean }, pricing:{ monthly?:{amount,currency}, yearly?:{amount,currency,compareAt?}}, primary?: boolean }>
  const res = await fetch("/api/pricing/plans", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load plans");
  return res.json();
}

async function fetchUserUsage() {
  // Expected: { questionsToday, questionsMonth, testsMonth, limits:{ daily, monthly, test }, subscription:{ tier:'free'|'pro'|..., status }, stats?:{ questionsCompleted, testsCompleted, currentStreak } }
  const res = await fetch("/api/user/usage", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load usage");
  return res.json();
}

async function fetchUpgradeStats() {
  // Expected: { weeklyUpgrades?: number }  (optional)
  const res = await fetch("/api/stats/weekly_upgrades", { credentials: "include" });
  // ok even if 404
  if (!res.ok) return {};
  return res.json();
}

async function fetchABVariant(key: string) {
  // Expected: { key, variant: 'A'|'B'|'C', payload?: {title?:string, message?:string, icon?:string} }
  const res = await fetch(`/api/ab/variant?key=${encodeURIComponent(key)}`, {
    credentials: "include",
  });
  if (!res.ok) return { key, variant: "A" };
  return res.json();
}

async function startCheckout(planId: string, billingCycle: "monthly" | "yearly") {
  // Expected: { url } -> redirect to hosted checkout (Razorpay/Stripe/…)
  const res = await fetch("/api/billing/checkout", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ planId, billingCycle, source: "pricing_modal" }),
  });
  if (!res.ok) throw new Error("Checkout init failed");
  return res.json();
}

/** ---- Component ---- */

const PricingModal: React.FC<PricingModalProps> = ({
  isOpen,
  onClose,
  limitType = "daily_limit",
  userStats = {},
  disableFrequencyCap = false,
}) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [abCopy, setAbCopy] = useState<{ title?: string; message?: string; icon?: string }>();
  const [weeklyUpgrades, setWeeklyUpgrades] = useState<number | undefined>();
  const [plans, setPlans] = useState<any[]>([]);
  const [usage, setUsage] = useState<any | null>(null);
  const [primaryPlanId, setPrimaryPlanId] = useState<string | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  /** Fetch data once per open */
  useEffect(() => {
    let active = true;

    (async () => {
      if (!isOpen) return;

      // Frequency cap
      if (!disableFrequencyCap) {
        const gate = canShowModalByCap(limitType);
        if (!gate.allowed) {
          onClose();
          return;
        }
      }

      conversionManager?.trackModalShown?.(limitType);
      document.body.style.overflow = "hidden";

      try {
        const [plansRes, usageRes, upgradesRes, abRes] = await Promise.all([
          fetchPlans().catch(() => []),
          fetchUserUsage().catch(() => null),
          fetchUpgradeStats().catch(() => ({})),
          fetchABVariant("pricing_modal_copy").catch(() => ({ variant: "A" })),
        ]);

        if (!active) return;

        setPlans(Array.isArray(plansRes) ? plansRes : plansRes?.plans ?? []);
        setUsage(usageRes);
        setWeeklyUpgrades(upgradesRes?.weeklyUpgrades);
        setAbCopy(abRes?.payload || undefined);

        const primary =
          (Array.isArray(plansRes) ? plansRes : plansRes?.plans ?? []).find(
            (p: any) => p.primary
          ) || (Array.isArray(plansRes) ? plansRes[0] : null);
        setPrimaryPlanId(primary?.id || null);
      } catch {
        // tolerate errors; modal still renders with minimal info
      }

      // small delay for smooth entrance focus
      await sleep(100);
      closeBtnRef.current?.focus();
      markModalShown(limitType);
    })();

    return () => {
      active = false;
      document.body.style.overflow = "unset";
    };
  }, [isOpen, limitType, disableFrequencyCap, onClose]);

  const effectiveStats = useMemo(() => {
    const apiStats = usage?.stats || {};
    return {
      questionsCompleted: apiStats.questionsCompleted ?? userStats.questionsCompleted,
      testsCompleted: apiStats.testsCompleted ?? userStats.testsCompleted,
      currentStreak: apiStats.currentStreak ?? userStats.currentStreak,
    };
  }, [usage, userStats]);

  const baseMessages: Record<
    LimitType,
    { defaultTitle: string; defaultMessage: string; defaultIcon: string; urgency: "low" | "medium" | "high" }
  > = {
    daily_limit: {
      defaultTitle: "Daily Limit Reached!",
      defaultMessage:
        "You’ve hit today’s free quota. Upgrade to Pro for unlimited practice and keep the momentum going.",
      defaultIcon: "📚",
      urgency: "medium",
    },
    monthly_limit: {
      defaultTitle: "Monthly Cap Reached!",
      defaultMessage: "You’ve maxed out this month’s free questions. Go Pro for unlimited access.",
      defaultIcon: "📈",
      urgency: "high",
    },
    test_limit: {
      defaultTitle: "Mock Test Limit Reached!",
      defaultMessage: "You’ve used your free mock tests. Unlock unlimited tests with Pro.",
      defaultIcon: "🧪",
      urgency: "high",
    },
    jeenie_blocked: {
      defaultTitle: "Jeenie AI is a Pro Feature",
      defaultMessage: "Get 24/7 instant doubt solving with Jeenie AI. Upgrade to Pro to continue.",
      defaultIcon: "🤖",
      urgency: "medium",
    },
    study_planner_blocked: {
      defaultTitle: "AI Study Planner is a Pro Feature",
      defaultMessage: "Build a dynamic plan that adapts to your progress and exam date.",
      defaultIcon: "📅",
      urgency: "medium",
    },
    almost_there: {
      defaultTitle: "Almost at Your Daily Limit",
      defaultMessage: "Only a few free questions left today. Upgrade for unlimited practice.",
      defaultIcon: "⚡",
      urgency: "low",
    },
  };

  const copy = baseMessages[limitType];
  const title = abCopy?.title || copy.defaultTitle;
  const message = abCopy?.message || copy.defaultMessage;
  const icon = abCopy?.icon || copy.defaultIcon;
  const urgency = copy.urgency;

  const proPlan = useMemo(() => {
    const p = plans.find((pl: any) => (primaryPlanId ? pl.id === primaryPlanId : pl.primary));
    return p || plans[0];
  }, [plans, primaryPlanId]);

  const priceDisplay = useMemo(() => {
    if (!proPlan?.pricing) return null;
    const { yearly, monthly } = proPlan.pricing;
    // Prefer yearly if available, else monthly
    const chosen = yearly || monthly;
    if (!chosen) return null;
    return {
      amount: chosen.amount,
      currency: chosen.currency || "INR",
      cycle: yearly ? "/year" : "/month",
      compareAt: chosen.compareAt,
      hasYearly: Boolean(yearly),
    };
  }, [proPlan]);

  const handleUpgrade = useCallback(
    async (cycle: "monthly" | "yearly" | "auto") => {
      try {
        setLoading(true);
        conversionManager?.trackCtaClick?.("pricing_modal_upgrade", { limitType, cycle });

        // choose cycle: prefer yearly if available
        const actualCycle =
          cycle === "auto"
            ? (proPlan?.pricing?.yearly ? "yearly" : "monthly")
            : cycle;

        if (!proPlan?.id) {
          // If plans failed to load, send user to pricing page (no backend changes)
          navigate("/pricing");
          return;
        }
        const { url } = await startCheckout(proPlan.id, actualCycle);
        window.location.href = url;
      } catch (e) {
        // Fallback: go to pricing page
        navigate("/pricing");
      } finally {
        setLoading(false);
        onClose();
      }
    },
    [limitType, navigate, onClose, proPlan]
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pricing-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md sm:rounded-2xl bg-white shadow-2xl sm:animate-in sm:zoom-in sm:duration-200 max-h-[92vh] overflow-y-auto rounded-t-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-br from-green-50 to-emerald-50 p-4 border-b border-gray-200 relative">
          <button
            ref={closeBtnRef}
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition p-1 rounded-full hover:bg-white/60"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="text-center pr-8">
            <div className="text-4xl mb-2 animate-bounce" aria-hidden>
              {icon}
            </div>
            <h2 id="pricing-modal-title" className="text-lg sm:text-2xl font-bold text-gray-900">
              {title}
            </h2>
          </div>
        </div>

        {/* Body */}
        <div className="p-4">
          <p className="text-gray-600 text-center text-sm sm:text-base mb-4">{message}</p>

          {/* Social Proof (only if API returns real data) */}
          {!!weeklyUpgrades && urgency !== "low" && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4 flex items-start gap-2">
              <Sparkles className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm text-orange-900">
                <strong>{weeklyUpgrades.toLocaleString()} students</strong> upgraded this week.
              </p>
            </div>
          )}

          {/* User stats (from API or props) */}
          {!!effectiveStats?.questionsCompleted && effectiveStats.questionsCompleted > 50 && (
            <div className="bg-blue-50 rounded-lg p-3 mb-4">
              <p className="text-xs sm:text-sm text-blue-900 text-center">
                🎯 You’ve completed <strong>{effectiveStats.questionsCompleted}</strong> questions.
                Imagine what unlimited access could do!
              </p>
            </div>
          )}

          {/* Pro Features Preview (from plan/features if available) */}
          {proPlan && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-3 sm:p-4 mb-4 border border-green-200">
              <div className="flex items-center gap-2 mb-3">
                <Crown className="w-4 h-4 text-green-600" />
                <span className="font-bold text-green-900 text-sm">Upgrade to Pro & Get:</span>
              </div>
              <ul className="space-y-2 text-xs sm:text-sm">
                {(proPlan?.features || []).slice(0, 6).map((f: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-gray-700">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Pricing (from API) */}
          {priceDisplay && (
            <div className="text-center mb-4">
              <div className="flex items-baseline justify-center gap-2 mb-1">
                <span className="text-3xl sm:text-4xl font-bold text-green-600">
                  {priceDisplay.currency === "INR" ? "₹" : ""}{priceDisplay.amount}
                </span>
                <span className="text-gray-500 text-sm sm:text-base">{priceDisplay.cycle}</span>
              </div>
              {!!priceDisplay.compareAt && (
                <p className="text-xs sm:text-sm text-gray-600">
                  <span className="line-through text-gray-400">
                    {priceDisplay.currency === "INR" ? "₹" : ""}{priceDisplay.compareAt}
                  </span>{" "}
                  • You save{" "}
                  {priceDisplay.currency === "INR" ? "₹" : ""}
                  {Number(priceDisplay.compareAt) - Number(priceDisplay.amount)}
                </p>
              )}
              <p className="text-[11px] sm:text-xs text-green-700 font-semibold mt-1">
                Cancel anytime • 30-day money-back
              </p>
            </div>
          )}

          {/* CTA */}
          <div className="space-y-3">
            <Button
              disabled={loading}
              onClick={() => handleUpgrade("auto")}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 rounded-lg text-base shadow-lg hover:shadow-xl transition-all active:scale-[0.99]"
            >
              <Crown className="w-5 h-5 mr-2" />
              {loading ? "Starting checkout…" : "Upgrade to Pro"}
            </Button>

            <div className="grid grid-cols-2 gap-2">
              <Button
                disabled={loading}
                variant="outline"
                onClick={() => handleUpgrade("monthly")}
                className="w-full border-2 py-3 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
              >
                Monthly
              </Button>
              <Button
                disabled={loading}
                variant="outline"
                onClick={() => handleUpgrade("yearly")}
                className="w-full border-2 py-3 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
              >
                Yearly (Best)
              </Button>
            </div>

            <Button
              disabled={loading}
              onClick={onClose}
              variant="ghost"
              className="w-full py-3 rounded-lg text-gray-500"
            >
              Maybe later
            </Button>
          </div>

          <p className="text-center text-[11px] text-gray-400 mt-3">
            We only show this occasionally. Your prep comes first.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PricingModal;
