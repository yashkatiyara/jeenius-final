import { MASTERY_CONFIG } from '@/config/studySystem';

export interface TopicPriority {
  subject: string;
  chapter: string;
  topic: string;
  priorityScore: number;
  accuracy: number;
  questionsAttempted: number;
  daysSincePractice: number;
  status: 'weak' | 'medium' | 'strong';
  allocatedMinutes: number;
}

export interface TimeAllocation {
  studyTime: number;
  revisionTime: number;
  mockTestTime: number;
  restTime: number;
}

export interface DailyPlan {
  date: string;
  tasks: {
    topic: string;
    subject: string;
    chapter: string;
    duration: number;
    type: 'study' | 'revision' | 'mock_test';
    timeSlot: 'morning' | 'afternoon' | 'evening';
  }[];
}

export interface RankPrediction {
  currentRank: number;
  targetRank: number;
  improvementWeeks: number;
  weeklyAccuracyTarget: number;
  accuracyGap: number;
}

export interface SWOTAnalysis {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

/**
 * Calculate dynamic phase allocation based on days to exam
 */
export function calculatePhaseAllocation(daysToExam: number): TimeAllocation {
  let studyPercent = 0.60;
  let revisionPercent = 0.25;
  let mockTestPercent = 0.10;
  const restPercent = 0.05;

  if (daysToExam > 180) {
    studyPercent = 0.70;
    revisionPercent = 0.20;
    mockTestPercent = 0.05;
  } else if (daysToExam > 90) {
    studyPercent = 0.60;
    revisionPercent = 0.25;
    mockTestPercent = 0.10;
  } else if (daysToExam > 30) {
    studyPercent = 0.50;
    revisionPercent = 0.30;
    mockTestPercent = 0.15;
  } else if (daysToExam > 15) {
    studyPercent = 0.40;
    revisionPercent = 0.35;
    mockTestPercent = 0.20;
  } else {
    studyPercent = 0.20;
    revisionPercent = 0.40;
    mockTestPercent = 0.35;
  }

  return {
    studyTime: studyPercent,
    revisionTime: revisionPercent,
    mockTestTime: mockTestPercent,
    restTime: restPercent,
  };
}

/**
 * Calculate priority score for a topic
 */
export function calculateTopicPriority(
  accuracy: number,
  questionsAttempted: number,
  daysSincePractice: number,
  examImportance: number = 50,
  isPrerequisite: boolean = false
): number {
  const weaknessWeight = (100 - accuracy) * 0.4;
  const forgettingWeight = Math.min((daysSincePractice / 7), 10) * 0.3;
  const importanceWeight = examImportance * 0.2;
  const prerequisiteBonus = isPrerequisite ? 20 * 0.1 : 0;

  return weaknessWeight + forgettingWeight + importanceWeight + prerequisiteBonus;
}

/**
 * Categorize topics based on accuracy
 */
export function categorizeTopics(topics: any[]): {
  weak: TopicPriority[];
  medium: TopicPriority[];
  strong: TopicPriority[];
} {
  const weak: TopicPriority[] = [];
  const medium: TopicPriority[] = [];
  const strong: TopicPriority[] = [];

  topics.forEach((topic) => {
    const accuracy = topic.accuracy || 0;
    const questionsAttempted = topic.questions_attempted || 0;
    const lastPracticed = topic.last_practiced 
      ? new Date(topic.last_practiced) 
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const daysSincePractice = Math.floor(
      (Date.now() - lastPracticed.getTime()) / (1000 * 60 * 60 * 24)
    );

    const priorityScore = calculateTopicPriority(
      accuracy,
      questionsAttempted,
      daysSincePractice,
      50,
      false
    );

    const topicPriority: TopicPriority = {
      subject: topic.subject,
      chapter: topic.chapter,
      topic: topic.topic,
      priorityScore,
      accuracy,
      questionsAttempted,
      daysSincePractice,
      status: accuracy < 60 ? 'weak' : accuracy < 80 ? 'medium' : 'strong',
      allocatedMinutes: 0,
    };

    if (accuracy < 60) {
      weak.push(topicPriority);
    } else if (accuracy < 80) {
      medium.push(topicPriority);
    } else {
      strong.push(topicPriority);
    }
  });

  // Sort by priority score (descending)
  weak.sort((a, b) => b.priorityScore - a.priorityScore);
  medium.sort((a, b) => b.priorityScore - a.priorityScore);
  strong.sort((a, b) => b.priorityScore - a.priorityScore);

  return { weak, medium, strong };
}

/**
 * Allocate daily study time across topics
 */
export function allocateDailyTime(
  dailyStudyHours: number,
  phaseAllocation: TimeAllocation,
  categorizedTopics: { weak: TopicPriority[]; medium: TopicPriority[]; strong: TopicPriority[] }
): { weak: TopicPriority[]; medium: TopicPriority[]; strong: TopicPriority[] } {
  const totalMinutes = dailyStudyHours * 60;
  const studyMinutes = totalMinutes * phaseAllocation.studyTime;

  // Allocate 60% to weak, 30% to medium, 10% to strong
  const weakMinutes = studyMinutes * 0.6;
  const mediumMinutes = studyMinutes * 0.3;
  const strongMinutes = studyMinutes * 0.1;

  // Distribute minutes across topics
  const distributeMinutes = (topics: TopicPriority[], totalMinutes: number) => {
    if (topics.length === 0) return topics;
    
    const minutesPerTopic = totalMinutes / topics.length;
    return topics.map(topic => ({
      ...topic,
      allocatedMinutes: Math.round(minutesPerTopic)
    }));
  };

  return {
    weak: distributeMinutes(categorizedTopics.weak, weakMinutes),
    medium: distributeMinutes(categorizedTopics.medium, mediumMinutes),
    strong: distributeMinutes(categorizedTopics.strong, strongMinutes),
  };
}

/**
 * Generate weekly plan
 */
export function generateWeeklyPlan(
  dailyStudyHours: number,
  categorizedTopics: { weak: TopicPriority[]; medium: TopicPriority[]; strong: TopicPriority[] },
  phaseAllocation: TimeAllocation
): DailyPlan[] {
  const weeklyPlan: DailyPlan[] = [];
  const today = new Date();

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

    const tasks: DailyPlan['tasks'] = [];

    // Sunday: Rest + Light Revision
    if (i === 6) {
      const revisionTopics = [...categorizedTopics.strong, ...categorizedTopics.medium].slice(0, 3);
      revisionTopics.forEach(topic => {
        tasks.push({
          topic: topic.topic,
          subject: topic.subject,
          chapter: topic.chapter,
          duration: 20,
          type: 'revision',
          timeSlot: 'afternoon'
        });
      });
    } 
    // Saturday: Integration + Chapter Test
    else if (i === 5) {
      const mixedTopics = [
        ...categorizedTopics.weak.slice(0, 2),
        ...categorizedTopics.medium.slice(0, 2)
      ];
      
      mixedTopics.forEach(topic => {
        tasks.push({
          topic: topic.topic,
          subject: topic.subject,
          chapter: topic.chapter,
          duration: 30,
          type: 'study',
          timeSlot: 'morning'
        });
      });

      tasks.push({
        topic: 'Chapter Test',
        subject: 'Mixed',
        chapter: 'All',
        duration: 60,
        type: 'mock_test',
        timeSlot: 'afternoon'
      });
    }
    // Monday-Friday: Focus Days
    else {
      // Morning: Hardest topics
      const morningTopics = categorizedTopics.weak.slice(i * 2, i * 2 + 2);
      morningTopics.forEach(topic => {
        tasks.push({
          topic: topic.topic,
          subject: topic.subject,
          chapter: topic.chapter,
          duration: topic.allocatedMinutes || 40,
          type: 'study',
          timeSlot: 'morning'
        });
      });

      // Afternoon: Medium topics
      const afternoonTopics = categorizedTopics.medium.slice(i, i + 1);
      afternoonTopics.forEach(topic => {
        tasks.push({
          topic: topic.topic,
          subject: topic.subject,
          chapter: topic.chapter,
          duration: topic.allocatedMinutes || 30,
          type: 'study',
          timeSlot: 'afternoon'
        });
      });

      // Evening: Revision
      const eveningTopics = categorizedTopics.strong.slice(i, i + 1);
      eveningTopics.forEach(topic => {
        tasks.push({
          topic: topic.topic,
          subject: topic.subject,
          chapter: topic.chapter,
          duration: 20,
          type: 'revision',
          timeSlot: 'evening'
        });
      });
    }

    weeklyPlan.push({
      date: date.toISOString().split('T')[0],
      tasks
    });
  }

  return weeklyPlan;
}

/**
 * Predict rank based on accuracy and performance
 */
export function predictRank(
  avgAccuracy: number,
  questionsAttempted: number,
  targetExam: string
): RankPrediction {
  const baseCandidates = targetExam === 'JEE' ? 1200000 : 1800000;
  
  // Difficulty multiplier based on questions attempted
  const difficultyMultiplier = questionsAttempted < 100 ? 1.2 : 
                               questionsAttempted < 500 ? 1.0 :
                               questionsAttempted < 1000 ? 0.9 : 0.8;

  // Current rank projection
  const currentRank = Math.round(
    baseCandidates * (1 - avgAccuracy / 100) * difficultyMultiplier
  );

  // Target rank (90% accuracy)
  const targetRank = Math.round(
    baseCandidates * (1 - 90 / 100) * difficultyMultiplier
  );

  // Improvement path
  const accuracyGap = 90 - avgAccuracy;
  const weeksNeeded = Math.ceil(Math.abs(accuracyGap) / 2); // 2% improvement per week

  return {
    currentRank,
    targetRank,
    improvementWeeks: weeksNeeded,
    weeklyAccuracyTarget: avgAccuracy + 2,
    accuracyGap
  };
}

/**
 * Generate SWOT Analysis
 */
export function generateSWOTAnalysis(
  categorizedTopics: { weak: TopicPriority[]; medium: TopicPriority[]; strong: TopicPriority[] }
): SWOTAnalysis {
  const strengths = categorizedTopics.strong
    .slice(0, 5)
    .map(t => `${t.subject} - ${t.topic} (${t.accuracy}%)`);

  const weaknesses = categorizedTopics.weak
    .slice(0, 5)
    .map(t => `${t.subject} - ${t.topic} (${t.accuracy}%)`);

  const opportunities = categorizedTopics.medium
    .slice(0, 3)
    .map(t => `${t.subject} - ${t.topic} is close to mastery`);

  const threats = categorizedTopics.strong
    .filter(t => t.daysSincePractice >= 7)
    .slice(0, 3)
    .map(t => `${t.subject} - ${t.topic} not revised in ${t.daysSincePractice} days`);

  return {
    strengths: strengths.length > 0 ? strengths : ['Complete more practice to identify strengths'],
    weaknesses: weaknesses.length > 0 ? weaknesses : ['No significant weaknesses found yet'],
    opportunities: opportunities.length > 0 ? opportunities : ['Focus on building foundation first'],
    threats: threats.length > 0 ? threats : ['Keep practicing to maintain performance']
  };
}
