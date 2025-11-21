import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { SUBSCRIPTION_PLANS } from '@/config/subscriptionPlans';
import { initializePayment } from '@/utils/razorpay';
import { Check, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/Header';

const SubscriptionPlans = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');

  const handleSelectPlan = async (planId: string) => {
    if (!user) {
      navigate('/login?redirect=/subscription-plans');
      return;
    }

    try {
      setLoading(planId);

      await initializePayment(
        planId,
        user.id,
        user.email || '',
        user.user_metadata?.name || 'Student'
      );

    } catch (error) {
      console.error('Payment error:', error);
      alert('Failed to initiate payment. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const currentPlan = billingCycle === 'monthly' ? SUBSCRIPTION_PLANS.monthly : SUBSCRIPTION_PLANS.yearly;

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 to-green-50 overflow-hidden flex flex-col">
      <Header />
      <div className="flex-1 pt-16 pb-4 px-4 overflow-hidden flex flex-col">
        {/* Hero Section */}
        <section className="py-2 flex-shrink-0">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Unlock Your Full Potential</h1>
            <p className="text-sm text-gray-600 mb-4">Choose the plan that works best for you</p>
            
            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-green-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all relative ${
                  billingCycle === 'yearly'
                    ? 'bg-green-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Yearly
                {currentPlan.savings > 0 && (
                  <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    Save ₹{currentPlan.savings}
                  </span>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Pricing Card */}
        <section className="flex-1 py-2 flex items-center overflow-hidden">
          <div className="container mx-auto px-4 w-full">
            <div className="max-w-lg mx-auto">
              {/* Pro Plan */}
              <Card className="border-2 border-green-500 relative bg-gradient-to-br from-white to-green-50">
                {(currentPlan.popular || currentPlan.bestValue) && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-1 text-xs font-semibold shadow-lg">
                      {currentPlan.popular && '🚀 Most Popular'}
                      {currentPlan.bestValue && '💎 Best Value'}
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-4 pt-6">
                  <div className="mx-auto w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mb-3 shadow-lg">
                    <Crown className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-xl mb-2">{currentPlan.name}</CardTitle>
                  <div className="space-y-1">
                    {currentPlan.originalPrice && (
                      <div className="text-sm text-gray-400 line-through">
                        ₹{currentPlan.originalPrice}
                      </div>
                    )}
                    <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      ₹{currentPlan.price}
                      <span className="text-base text-gray-500 font-normal">
                        /{currentPlan.displayDuration.replace('per ', '')}
                      </span>
                    </div>
                    {currentPlan.savings > 0 && (
                      <div className="flex items-center justify-center space-x-2">
                        <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-orange-300 text-xs">
                          Save ₹{currentPlan.savings}
                        </Badge>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{currentPlan.tagline}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 max-h-[200px] overflow-y-auto">
                    {currentPlan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start space-x-2 p-1.5 rounded-lg">
                        <div className="mt-0.5 text-green-600 flex-shrink-0">
                          <Check className="w-4 h-4" />
                        </div>
                        <span className="text-sm text-gray-700">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={() => handleSelectPlan(billingCycle)}
                    disabled={loading === billingCycle}
                    className="w-full h-10 text-sm bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold shadow-lg"
                  >
                    {loading === billingCycle ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      'Upgrade to Pro Now'
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Free tier info */}
        <section className="py-2 flex-shrink-0">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-md mx-auto bg-white rounded-lg p-3 shadow-md">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Free Tier Available</h3>
              <p className="text-xs text-gray-600 mb-2">
                Start with 15 questions per day
              </p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="hover:bg-gray-50 h-8 text-xs"
              >
                Continue with Free
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SubscriptionPlans;
