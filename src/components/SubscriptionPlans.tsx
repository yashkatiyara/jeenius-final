export const SUBSCRIPTION_PLANS = {
  monthly: {
    name: 'Pro Monthly',
    price: 49,
    originalPrice: null,
    duration: '1 month',
    displayDuration: 'per month',
    savings: 0,
    popular: false,
    bestValue: false,
    features: [
      '✨ Unlimited Practice Questions',
      '🤖 Unlimited AI Doubt Solver (JEEnie)',
      '📊 Unlimited Chapter Tests + AI Analysis',
      '🎯 Smart Revision & Weak Area Tracking',
      '🏆 Full Leaderboard Access',
      '⚡ Priority Support',
      '🚀 Early Access to New Features'
    ],
    tagline: 'Less than a pizza — but can change your rank!',
    razorpayPlanId: 'plan_monthly_49' // Replace with actual Razorpay plan ID
  },
  
  yearly: {
    name: 'Pro Yearly',
    price: 499,
    originalPrice: 588,
    duration: '12 months',
    displayDuration: 'per year',
    savings: 89,
    popular: true,
    bestValue: true,
    features: [
      '✨ Everything in Pro Monthly',
      '💚 2 Months FREE (Save ₹89)',
      '🤖 Unlimited AI Doubt Solver',
      '📊 Advanced Performance Analytics',
      '🎯 Personalized Study Plans',
      '🏆 Premium Leaderboard Badges',
      '⚡ Priority Support 24/7',
      '🚀 Lifetime Access to New Features'
    ],
    tagline: 'Most students choose this! Best value for serious learners.',
    razorpayPlanId: 'plan_yearly_499' // Replace with actual Razorpay plan ID
  }
};

export const FREE_PLAN_LIMITS = {
  questionsPerDay: 20,
  mockTestsPerMonth: 2,
  aiQueriesPerDay: 3,
  chaptersUnlocked: 2
};

export const CONVERSION_MESSAGES = {
  dailyLimit: {
    title: '🚀 Daily Limit Reached!',
    message: 'You\'ve solved 20 questions today. Unlock unlimited practice with Pro!',
    cta: 'Upgrade for just ₹49/month'
  },
  aiLimit: {
    title: '🤖 AI Limit Reached!',
    message: 'Your 3 free AI queries are used. Get unlimited AI help with Pro!',
    cta: 'Unlock Unlimited AI'
  },
  weakAreas: {
    title: '🎯 Smart Plan Ready!',
    message: 'AI found 3 weak areas in your performance. Unlock your personalized plan with Pro!',
    cta: 'Get My Smart Plan'
  },
  chapterLocked: {
    title: '🔒 Premium Chapter',
    message: 'Unlock all chapters + unlimited questions with Pro subscription!',
    cta: 'Unlock All Chapters'
  },
  testLocked: {
    title: '📊 Mock Test Limit Reached',
    message: 'You\'ve used your 2 free tests this month. Get unlimited with Pro!',
    cta: 'Unlock Unlimited Tests'
  }
};

export const REFERRAL_CONFIG = {
  enabled: true,
  reward: {
    type: 'free_month',
    threshold: 3, // Refer 3 friends
    message: 'Refer 3 friends → Get 1 month Pro free!'
  }
};
