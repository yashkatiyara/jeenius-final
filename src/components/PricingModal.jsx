// src/components/billing/PricingModal.tsx
import React, { useEffect, useMemo, useState } from "react";
import { X, Crown, Check, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/utils/supabaseClient";

// If you use a tracker util already, keep it. Else these calls simply no-op.
const safeTrack = (fnName: string, ...args: any[]) => {
  try {
    // @ts-ignore
    if (window?.conversionManager?.[fnName]) {
      // @ts-ignore
      window.conversionManager[fnName](...args);
    }
  } catch {}
};

export type LimitType =
  | "daily_limit"
  | "monthly_limit"
  | "test_limit"
  | "jeenie_blocked"
  | "study_planner_blocked"
  | "almost_there";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  limitType?: LimitType;
};

type UserStats = {
  questions_completed: number;
  tests_completed: number;
  current_streak: number;
};

type Subscription = {
  plan_id: string | null;
  status: "active" | "trialing" | "canceled" | "past_due" | "inactive";
  current_period_end: string | null;
};

type Plan = {
  id: string;
  name: string; // "pro"
  monthly_price: number; // in INR (e.g. 49)
  yearly_price: number; // in INR (e.g. 499)
  discount_percent: number | null; // e.g. 15
  features: string[]; // text bullets
};

const LIMIT_MESSAGES: Record<
  LimitType,
  { title: string; message: string; icon: string; urgency: "low" | "medium" | "high" }
> = {
  daily_limit: {
    title: "Daily Limit Reached 🎯",
    message: "Aaj ke saare free questions khatam ho gaye. Pro leke ab bina rukke practice karo!",
    icon: "📘",
    urgency: "medium",
  },
  monthly_limit: {
    title: "Monthly Limit Reached 📊",
    message: "Is mahine ki free limit poori ho gayi. Pro se unlimited chalega — streak todna mat!",
    icon: "📈",
    urgency: "high",
  },
  test_limit: {
    title: "Mock Test Limit 🧪",
    message: "Free tests khatam. Pro ke saath unlimited mock tests abhi unlock karo.",
    icon: "🧠",
    urgency: "high",
  },
  jeenie_blocked: {
    title: "Jeenie AI is Pro-only 🤖",
    message: "Instant AI doubt solving 24/7 — sirf Pro users ke liye.",
    icon: "🤖",
    urgency: "medium",
  },
  study_planner_blocked: {
    title: "AI Study Planner is Pro-only 📅",
    message: "Exam date aur progress ke hisaab se dynamic plan — Pro me milega.",
    icon: "📅",
    urgency: "medium",
  },
  almost_there: {
    title: "Almost at your limit ⚡",
    message: "Bas kuch hi free questions bache hain. Unlimited ke liye Pro try karo.",
    icon: "⚡",
    urgency: "low",
  },
};

async function getUserId() {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

async function fetchUserStats(user_id: string): Promise<UserStats | null> {
  const { data, error } = await supabase
    .from("user_stats")
    .select("questions_completed, tests_completed, current_streak")
    .eq("user_id", user_id)
    .single();
  if (error) return null;
  return data as UserStats;
}

async function fetchSubscription(user_id: string): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("plan_id, status, current_period_end")
    .eq("user_id", user_id)
    .in("status", ["active", "trialing", "past_due"])
    .maybeSingle();
  if (error) return null;
  return (data ?? null) as Subscription | null;
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

const PricingModal: React.FC<Props> = ({ isOpen, onClose, limitType = "daily_limit" }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);

  const message = useMemo(() => LIMIT_MESSAGES[limitType], [limitType]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        if (!isOpen) return;
        setLoading(true);
        const userId = await getUserId();
        if (!userId) {
          // not logged in → show plan directly (no stats)
          const p = await fetchProPlan();
          if (!mounted) return;
          setPlan(p);
          setUserStats(null);
          setSubscription(null);
          setLoading(false);
          return;
        }
        const [stats, sub, p] = await Promise.all([
          fetchUserStats(userId),
          fetchSubscription(userId),
          fetchProPlan(),
        ]);
        if (!mounted) return;
        setUserStats(stats);
        setSubscription(sub);
        setPlan(p);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    if (isOpen) {
      safeTrack("trackModalShown", limitType);
      document.body.style.overflow = "hidden";
      load();
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      mounted = false;
      document.body.style.overflow = "unset";
    };
  }, [isOpen, limitType]);

  const isPro =
    subscription?.status === "active" || subscription?.status === "trialing";

  const handleUpgrade = () => {
    safeTrack("trackModalCTA", { where: "pricing_modal", limitType });
    onClose();
    navigate(`/pricing?utm_source=modal&utm_cause=${encodeURIComponent(limitType)}`);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="relative bg-gradient-to-br from-green-50 to-emerald-50 p-4 sm:p-6 border-b">
          <button
            onClick={onClose}
            className="absolute right-3 top-3 p-1 rounded-full text-gray-500 hover:bg-white/60"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="text-center pr-8">
            <div className="text-4xl sm:text-5xl mb-2">{message.icon}</div>
            <h2 className="text-lg sm:text-2xl font-bold text-gray-900">{message.title}</h2>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6">
          <p className="text-gray-700 text-sm sm:text-base text-center mb-4">
            {message.message}
          </p>

          {/* Stats (real) */}
          {loading ? (
            <div className="flex justify-center my-3">
              <Loader2 className="w-6 h-6 animate-spin text-green-600" />
            </div>
          ) : userStats ? (
            <div className="bg-blue-50 rounded-xl p-3 sm:p-4 mb-4 text-center text-blue-900 text-xs sm:text-sm">
              🎯 {userStats.questions_completed} questions • 🧪 {userStats.tests_completed} tests • 🔥{" "}
              {userStats.current_streak}-day streak
            </div>
          ) : null}

          {/* Social Proof for high urgency */}
          {["high"].includes(message.urgency) && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4 flex items-start gap-2">
              <Sparkles className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
              <p className="text-xs sm:text-sm text-orange-900">
                <strong>500+ students</strong> upgraded this week to unlock Pro. Join them! 🚀
              </p>
            </div>
          )}

          {/* Pro Features (from DB if available) */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-3 sm:p-4 mb-4 border border-green-200">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Crown className="w-5 h-5 text-green-700" />
              <span className="font-semibold text-green-900">What you get in Pro</span>
            </div>
            <ul className="text-xs sm:text-sm text-gray-800 space-y-2">
              {(plan?.features?.length
                ? plan.features
                : [
                    "Unlimited questions & mock tests",
                    "Jeenie AI 24/7 doubt solving",
                    "AI-powered dynamic study planner",
                    "Advanced performance analytics",
                  ]
              ).map((f, i) => (
                <li key={i} className="flex gap-2">
                  <Check className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Pricing from DB */}
          <div className="text-center mb-4">
            <div className="flex items-baseline justify-center gap-2 mb-1">
              <span className="text-3xl sm:text-4xl font-bold text-green-700">
                ₹{plan?.yearly_price ?? 499}
              </span>
              <span className="text-gray-500 text-sm sm:text-base">/year</span>
            </div>
            {plan?.discount_percent ? (
              <p className="text-xs text-green-700 font-semibold">
                Save {plan.discount_percent}% with yearly billing
              </p>
            ) : (
              <p className="text-xs text-gray-500">Best value for serious prep</p>
            )}
          </div>

          {/* CTAs */}
          {isPro ? (
            <Button
              onClick={onClose}
              className="w-full py-3 sm:py-3.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-md"
            >
              You’re already Pro 🎉
            </Button>
          ) : (
            <>
              <Button
                onClick={handleUpgrade}
                className="w-full py-3 sm:py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-lg shadow-lg"
              >
                <Crown className="w-4 h-4 mr-2" />
                Upgrade to Pro
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
                className="w-full mt-3 border-2 border-gray-300 text-gray-700 py-3 rounded-lg"
              >
                Maybe later
              </Button>
            </>
          )}

          <p className="text-center text-[11px] text-gray-500 mt-3">
            💯 30-day money-back • Cancel anytime
          </p>
        </div>
      </div>
    </div>
  );
};

export default PricingModal;
