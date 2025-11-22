/**
 * Spaced Repetition System - Forgetting curve implementation
 */

export interface RevisionSchedule {
  topic: string;
  subject: string;
  chapter: string;
  lastReviewed: Date;
  nextReview: Date;
  reviewNumber: number;
  retentionProbability: number;
  urgency: 'critical' | 'high' | 'medium' | 'low';
}

/**
 * Calculate next review date based on spaced repetition intervals
 * Intervals: 1, 3, 7, 15, 30, 60 days
 */
export function calculateNextReviewDate(
  lastReviewDate: Date,
  reviewNumber: number,
  performanceAccuracy: number
): Date {
  const intervals = [1, 3, 7, 15, 30, 60]; // days
  
  // Adjust interval based on accuracy
  let intervalIndex = Math.min(reviewNumber, intervals.length - 1);
  
  // If poor performance, reset to earlier interval
  if (performanceAccuracy < 60) {
    intervalIndex = Math.max(0, intervalIndex - 2);
  } else if (performanceAccuracy < 75) {
    intervalIndex = Math.max(0, intervalIndex - 1);
  }
  
  const daysToAdd = intervals[intervalIndex];
  const nextReview = new Date(lastReviewDate);
  nextReview.setDate(nextReview.getDate() + daysToAdd);
  
  return nextReview;
}

/**
 * Calculate retention probability using Ebbinghaus forgetting curve
 * R = e^(-t/S)
 * where t = time since last review, S = strength of memory (based on accuracy)
 */
export function calculateRetentionProbability(
  lastReviewDate: Date,
  accuracy: number,
  reviewCount: number
): number {
  const now = new Date();
  const daysSinceReview = Math.floor(
    (now.getTime() - lastReviewDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  // Strength increases with accuracy and review count
  const baseStrength = 5; // days
  const accuracyBonus = (accuracy / 100) * 10;
  const reviewBonus = reviewCount * 2;
  const memoryStrength = baseStrength + accuracyBonus + reviewBonus;
  
  // Forgetting curve
  const retentionProbability = Math.exp(-daysSinceReview / memoryStrength) * 100;
  
  return Math.max(0, Math.min(100, retentionProbability));
}

/**
 * Determine revision urgency
 */
export function determineRevisionUrgency(
  retentionProbability: number,
  daysSinceReview: number
): RevisionSchedule['urgency'] {
  if (retentionProbability < 30 || daysSinceReview > 30) {
    return 'critical';
  } else if (retentionProbability < 50 || daysSinceReview > 15) {
    return 'high';
  } else if (retentionProbability < 70 || daysSinceReview > 7) {
    return 'medium';
  }
  return 'low';
}

/**
 * Generate revision schedule for all topics
 */
export function generateRevisionSchedule(
  topics: Array<{
    subject: string;
    chapter: string;
    topic: string;
    accuracy: number;
    lastPracticed: Date | null;
    questionsAttempted: number;
  }>
): RevisionSchedule[] {
  const now = new Date();
  const defaultLastReview = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
  
  return topics
    .filter(t => t.questionsAttempted >= 5) // Only topics with sufficient practice
    .map(topic => {
      const lastReviewed = topic.lastPracticed || defaultLastReview;
      const reviewNumber = Math.floor(topic.questionsAttempted / 10);
      const retentionProbability = calculateRetentionProbability(
        lastReviewed,
        topic.accuracy,
        reviewNumber
      );
      
      const daysSinceReview = Math.floor(
        (now.getTime() - lastReviewed.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      const nextReview = calculateNextReviewDate(
        lastReviewed,
        reviewNumber,
        topic.accuracy
      );
      
      const urgency = determineRevisionUrgency(retentionProbability, daysSinceReview);
      
      return {
        topic: topic.topic,
        subject: topic.subject,
        chapter: topic.chapter,
        lastReviewed,
        nextReview,
        reviewNumber,
        retentionProbability,
        urgency
      };
    })
    .sort((a, b) => {
      // Sort by urgency first, then by retention probability
      const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
        return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      }
      return a.retentionProbability - b.retentionProbability;
    });
}

/**
 * Get topics due for revision today
 */
export function getTopicsDueToday(revisionSchedule: RevisionSchedule[]): RevisionSchedule[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return revisionSchedule.filter(item => {
    const reviewDate = new Date(item.nextReview);
    reviewDate.setHours(0, 0, 0, 0);
    return reviewDate <= today;
  });
}

/**
 * Calculate recommended revision duration based on topic complexity and retention
 */
export function calculateRevisionDuration(
  retentionProbability: number,
  questionsAttempted: number
): number {
  // Base duration: 10 minutes
  let duration = 10;
  
  // Add time based on low retention
  if (retentionProbability < 30) {
    duration += 20;
  } else if (retentionProbability < 50) {
    duration += 10;
  } else if (retentionProbability < 70) {
    duration += 5;
  }
  
  // Reduce time for well-practiced topics
  if (questionsAttempted > 50) {
    duration = Math.max(5, duration - 5);
  }
  
  return duration;
}
