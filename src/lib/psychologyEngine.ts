/**
 * Psychology Engine - Student mental health and burnout detection
 */

export interface BurnoutSignal {
  type: 'accuracy_drop' | 'time_decrease' | 'night_study' | 'incomplete_targets' | 'consecutive_low';
  severity: 'low' | 'medium' | 'high';
  message: string;
  recommendation: string;
}

export interface EnergyScore {
  score: number; // 0-100
  status: 'excellent' | 'good' | 'tired' | 'burnout';
  signals: BurnoutSignal[];
  recommendation: string;
}

export interface MotivationMessage {
  message: string;
  emoji: string;
  type: 'celebration' | 'encouragement' | 'warning';
}

/**
 * Calculate energy score based on recent performance
 */
export function calculateEnergyScore(
  recentAccuracy: number[],
  avgAccuracy: number,
  recentStudyHours: number[],
  avgStudyHours: number,
  consecutiveLowDays: number,
  nightStudySessions: number
): EnergyScore {
  let score = 100;
  const signals: BurnoutSignal[] = [];

  // Check accuracy drop
  const recentAvg = recentAccuracy.length > 0 
    ? recentAccuracy.reduce((a, b) => a + b, 0) / recentAccuracy.length 
    : avgAccuracy;
  
  const accuracyDrop = avgAccuracy - recentAvg;
  
  if (accuracyDrop > 15) {
    score -= 25;
    signals.push({
      type: 'accuracy_drop',
      severity: 'high',
      message: `Accuracy dropped by ${accuracyDrop.toFixed(0)}%`,
      recommendation: 'Take a rest day and focus on easier topics'
    });
  } else if (accuracyDrop > 10) {
    score -= 15;
    signals.push({
      type: 'accuracy_drop',
      severity: 'medium',
      message: `Accuracy dropped by ${accuracyDrop.toFixed(0)}%`,
      recommendation: 'Reduce study load by 30%'
    });
  }

  // Check time decrease
  const recentTimeAvg = recentStudyHours.length > 0
    ? recentStudyHours.reduce((a, b) => a + b, 0) / recentStudyHours.length
    : avgStudyHours;
  
  const timeDecrease = ((avgStudyHours - recentTimeAvg) / avgStudyHours) * 100;
  
  if (timeDecrease > 30) {
    score -= 20;
    signals.push({
      type: 'time_decrease',
      severity: 'high',
      message: `Study time decreased by ${timeDecrease.toFixed(0)}%`,
      recommendation: 'Motivation low - set smaller achievable goals'
    });
  }

  // Check night study
  if (nightStudySessions > 3) {
    score -= 15;
    signals.push({
      type: 'night_study',
      severity: 'medium',
      message: `${nightStudySessions} late night study sessions`,
      recommendation: 'Prioritize sleep - study in morning instead'
    });
  }

  // Check consecutive low days
  if (consecutiveLowDays >= 3) {
    score -= 20;
    signals.push({
      type: 'consecutive_low',
      severity: 'high',
      message: `${consecutiveLowDays} consecutive low performance days`,
      recommendation: 'Take a mandatory rest day to recover'
    });
  }

  // Determine status
  let status: EnergyScore['status'];
  let recommendation: string;

  if (score >= 80) {
    status = 'excellent';
    recommendation = 'Great energy! Keep up the momentum.';
  } else if (score >= 60) {
    status = 'good';
    recommendation = 'Good pace. Monitor your energy levels.';
  } else if (score >= 40) {
    status = 'tired';
    recommendation = 'Reduce study load by 30%. Focus on revision only.';
  } else {
    status = 'burnout';
    recommendation = 'Mandatory rest day required. Take tomorrow off.';
  }

  return {
    score: Math.max(0, score),
    status,
    signals,
    recommendation
  };
}

/**
 * Generate motivational message based on performance
 */
export function generateMotivationMessage(
  streak: number,
  todayAccuracy: number,
  questionsToday: number,
  rankChange?: number
): MotivationMessage {
  // Celebration messages
  if (todayAccuracy >= 90 && questionsToday >= 20) {
    return {
      message: 'Outstanding performance! You\'re crushing it today!',
      emoji: '🌟',
      type: 'celebration'
    };
  }

  if (streak >= 30) {
    return {
      message: `${streak}-day streak! You're unstoppable!`,
      emoji: '🔥',
      type: 'celebration'
    };
  }

  if (rankChange && rankChange >= 5) {
    return {
      message: `Climbed ${rankChange} ranks! Keep climbing!`,
      emoji: '📈',
      type: 'celebration'
    };
  }

  // Encouragement messages
  if (todayAccuracy >= 70 && todayAccuracy < 90) {
    return {
      message: 'Good progress! Push for 90%+ accuracy.',
      emoji: '💪',
      type: 'encouragement'
    };
  }

  if (streak >= 7 && streak < 30) {
    return {
      message: 'Great consistency! Keep the streak alive.',
      emoji: '⚡',
      type: 'encouragement'
    };
  }

  if (questionsToday >= 10 && questionsToday < 20) {
    return {
      message: 'Nice work today! Try for 20+ questions.',
      emoji: '👍',
      type: 'encouragement'
    };
  }

  // Warning messages
  if (todayAccuracy < 60 && questionsToday >= 10) {
    return {
      message: 'Focus needed. Review mistakes carefully.',
      emoji: '⚠️',
      type: 'warning'
    };
  }

  if (streak >= 7 && questionsToday === 0) {
    return {
      message: `Don't break your ${streak}-day streak!`,
      emoji: '🔥',
      type: 'warning'
    };
  }

  // Default
  return {
    message: 'Start strong today! Every question counts.',
    emoji: '🚀',
    type: 'encouragement'
  };
}

/**
 * Suggest adaptive target adjustment
 */
export function suggestTargetAdjustment(
  currentTarget: number,
  recentCompletionRate: number, // % of days target was met
  avgAccuracy: number,
  energyScore: number
): { newTarget: number; reason: string } {
  // Burnout detected - reduce drastically
  if (energyScore < 40) {
    return {
      newTarget: Math.max(5, Math.floor(currentTarget * 0.5)),
      reason: 'Energy low - taking it easy to recover'
    };
  }

  // Consistently missing target - reduce
  if (recentCompletionRate < 0.5 && avgAccuracy < 70) {
    return {
      newTarget: Math.max(10, Math.floor(currentTarget * 0.7)),
      reason: 'Target too high - adjusting to build consistency'
    };
  }

  // Consistently meeting target with high accuracy - increase
  if (recentCompletionRate > 0.8 && avgAccuracy >= 80) {
    return {
      newTarget: Math.min(75, Math.floor(currentTarget * 1.2)),
      reason: 'Performing well - time to level up!'
    };
  }

  // No change needed
  return {
    newTarget: currentTarget,
    reason: 'Target is appropriate for current performance'
  };
}

/**
 * Detect if rest day is needed
 */
export function shouldSuggestRestDay(
  consecutiveLowDays: number,
  energyScore: number,
  daysWithoutRest: number
): { suggest: boolean; reason: string } {
  if (energyScore < 30) {
    return {
      suggest: true,
      reason: 'Critical burnout detected - rest required'
    };
  }

  if (consecutiveLowDays >= 3) {
    return {
      suggest: true,
      reason: '3+ consecutive low performance days'
    };
  }

  if (daysWithoutRest >= 14) {
    return {
      suggest: true,
      reason: '2 weeks without rest - mental refresh needed'
    };
  }

  return {
    suggest: false,
    reason: 'Energy levels healthy'
  };
}
