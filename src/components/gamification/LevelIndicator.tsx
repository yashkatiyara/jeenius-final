import React from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Trophy, Target, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface LevelIndicatorProps {
  currentLevel: number;
  questionsAtLevel: number;
  accuracyAtLevel: number;
  questionsProgress?: number;
  accuracyProgress?: number;
  questionsNeeded?: number;
  accuracyNeeded?: number;
  compact?: boolean;
}

const LEVEL_CONFIG = {
  1: {
    name: 'Foundation Builder',
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'from-blue-50 to-cyan-50',
    icon: '📚',
    border: 'border-blue-300'
  },
  2: {
    name: 'Intermediate Pro',
    color: 'from-purple-500 to-pink-500',
    bgColor: 'from-purple-50 to-pink-50',
    icon: '🚀',
    border: 'border-purple-300'
  },
  3: {
    name: 'Expert Master',
    color: 'from-amber-500 to-orange-500',
    bgColor: 'from-amber-50 to-orange-50',
    icon: '👑',
    border: 'border-amber-300'
  }
};

const LevelIndicator: React.FC<LevelIndicatorProps> = ({
  currentLevel,
  questionsAtLevel,
  accuracyAtLevel,
  questionsProgress = 0,
  accuracyProgress = 0,
  questionsNeeded = 0,
  accuracyNeeded = 0,
  compact = false
}) => {
  const config = LEVEL_CONFIG[currentLevel as keyof typeof LEVEL_CONFIG];

  if (compact) {
    return (
      <div className={`bg-gradient-to-r ${config.color} text-white px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg`}>
        <span className="text-lg">{config.icon}</span>
        <span className="font-bold text-sm">Level {currentLevel}</span>
      </div>
    );
  }

  return (
    <Card className={`bg-gradient-to-br ${config.bgColor} border-2 ${config.border} shadow-xl overflow-hidden`}>
      <div className="p-4 sm:p-6">
        {/* Level Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`bg-gradient-to-br ${config.color} p-3 rounded-xl`}>
              <span className="text-2xl">{config.icon}</span>
            </div>
            <div>
              <p className="text-xs text-gray-600 uppercase tracking-wider">Current Level</p>
              <p className="text-2xl font-bold bg-gradient-to-r ${config.color} bg-clip-text text-transparent">
                Level {currentLevel}
              </p>
              <p className="text-sm text-gray-600 font-medium">{config.name}</p>
            </div>
          </div>
          
          {currentLevel < 3 && (
            <Badge variant="outline" className="border-2">
              Next: Level {currentLevel + 1}
            </Badge>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-blue-600" />
              <span className="text-xs text-gray-600">Questions</span>
            </div>
            <p className="text-xl font-bold">{questionsAtLevel}</p>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-xs text-gray-600">Accuracy</span>
            </div>
            <p className="text-xl font-bold">{accuracyAtLevel.toFixed(0)}%</p>
          </div>
        </div>

        {/* Progress to Next Level */}
        {currentLevel < 3 && (
          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Questions Progress</span>
                <span className="text-xs text-gray-600">{questionsNeeded} more needed</span>
              </div>
              <Progress value={questionsProgress} className="h-2.5" />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Accuracy Progress</span>
                <span className="text-xs text-gray-600">
                  {accuracyNeeded > 0 ? `${accuracyNeeded.toFixed(0)}% more needed` : 'Target reached!'}
                </span>
              </div>
              <Progress value={accuracyProgress} className="h-2.5" />
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-dashed">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-600" />
                <p className="text-xs text-gray-700">
                  {questionsProgress >= 100 && accuracyProgress >= 100
                    ? '🎉 Ready to level up! Complete more questions to upgrade!'
                    : 'Keep practicing to unlock the next level!'}
                </p>
              </div>
            </div>
          </div>
        )}

        {currentLevel === 3 && (
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg p-4 text-center">
            <Trophy className="w-8 h-8 mx-auto mb-2" />
            <p className="font-bold">Maximum Level Reached!</p>
            <p className="text-sm opacity-90">You're a JEEnius Expert! 👑</p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default LevelIndicator;
