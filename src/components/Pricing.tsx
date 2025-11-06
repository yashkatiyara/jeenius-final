// src/pages/Pricing.tsx
import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import { Check, X, Crown, Zap, Bot, Calendar, TrendingUp, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/utils/supabaseClient';

const PricingPage = () => {
  const [planInfo, setPlanInfo] = useState(null);
  const [billingCycle, setBillingCycle] = useState('yearly');

  useEffect(() => {
    const fetchPlan = async () => {
      const { data, error } = await supabase.from('plans').select('*').eq('name', 'pro').single();
      if (!error && data) setPlanInfo(data);
    };
    fetchPlan();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50">
      <Header />
      <div className="pt-20 pb-16 px-3 sm:px-6">
        <section className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight">
            Choose Your Path to <span className="text-green-600">JEE Success 🎯</span>
          </h1>
          <p className="text-gray-600 text-sm sm:text-lg max-w-2xl mx-auto mt-3">
            Start free, upgrade anytime — zero pressure, all progress.
          </p>
          <div className="flex justify-center gap-4 mt-6">
            {['monthly', 'yearly'].map((cycle) => (
              <button
                key={cycle}
                onClick={() => setBillingCycle(cycle)}
                className={`px-5 py-2 rounded-lg font-semibold ${
                  billingCycle === cycle
                    ? 'bg-green-600 text-white shadow-md'
                    : 'bg-white border border-gray-300 text-gray-700'
                }`}
              >
                {cycle === 'yearly' ? 'Yearly (Save 15%)' : 'Monthly'}
              </button>
            ))}
          </div>
        </section>

        <section className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {/* Starter Plan */}
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
                <li><X className="inline w-5 h-5 text-gray-300 mr-2" />Jeenie AI & Study Planner</li>
              </ul>
              <Button className="w-full bg-white border border-green-600 text-green-600 py-3 font-semibold">
                Continue Free
              </Button>
            </CardContent>
          </Card>

          {/* Pro Plan */}
          <Card className="border-2 border-green-600 shadow-2xl scale-105 relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-1 rounded-full text-xs font-bold shadow-md">
                MOST POPULAR
              </span>
            </div>
            <CardHeader className="text-center bg-gradient-to-br from-green-50 to-emerald-50">
              <CardTitle className="text-2xl font-bold text-gray-900">Pro</CardTitle>
              <p className="text-green-700 mt-2 font-semibold">
                ₹{billingCycle === 'yearly' ? '499' : '49'}
                <span className="text-sm text-gray-600">
                  /{billingCycle === 'yearly' ? 'year' : 'month'}
                </span>
              </p>
              {billingCycle === 'yearly' && (
                <p className="text-xs text-green-600">Save ₹89/year</p>
              )}
            </CardHeader>
            <CardContent className="bg-white text-sm sm:text-base">
              <ul className="space-y-3 mb-6">
                {[
                  { text: 'Unlimited questions', icon: Zap },
                  { text: 'Unlimited tests', icon: TrendingUp },
                  { text: 'Jeenie AI 24/7', icon: Bot },
                  { text: 'AI Study Planner', icon: Calendar },
                  { text: 'Advanced analytics', icon: Star },
                  { text: 'Priority support', icon: Crown },
                ].map(({ text, icon: Icon }, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Icon className="w-5 h-5 text-green-600 mt-0.5" />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
              <Button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 font-semibold shadow-md hover:scale-[1.02] transition">
                Upgrade to Pro 👑
              </Button>
              <p className="text-xs text-center text-gray-500 mt-3">Cancel anytime • 30-day refund</p>
            </CardContent>
          </Card>
        </section>

        <section className="mt-12 text-center">
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
              <p className="text-sm text-gray-600">Jeenie guides your weak areas smartly</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm">
              <div className="text-3xl mb-2">💰</div>
              <p className="font-semibold">Less than ₹2/day</p>
              <p className="text-sm text-gray-600">Affordable, flexible, powerful</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default PricingPage;
