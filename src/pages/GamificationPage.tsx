import React from 'react';
import Header from '@/components/Header';
import PointsDisplay from '@/components/gamification/PointsDisplay';
import BadgesShowcase from '@/components/gamification/BadgesShowcase';
import SmartStudyPlanner from '@/components/ai-study-planner/SmartStudyPlanner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Brain, Star } from 'lucide-react';

const GamificationPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
      <Header />
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-7xl mx-auto space-y-6">
          <PointsDisplay />
          
          <Tabs defaultValue="planner" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-white">
              <TabsTrigger value="planner" className="flex items-center gap-2">
                <Brain className="w-4 h-4" />
                AI Study Planner
              </TabsTrigger>
              <TabsTrigger value="badges" className="flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                Badges
              </TabsTrigger>
              <TabsTrigger value="points" className="flex items-center gap-2">
                <Star className="w-4 h-4" />
                Points History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="planner" className="mt-6">
              <SmartStudyPlanner />
            </TabsContent>

            <TabsContent value="badges" className="mt-6">
              <BadgesShowcase />
            </TabsContent>

            <TabsContent value="points" className="mt-6">
              <div className="text-center py-12">
                <Star className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">Points history coming soon!</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default GamificationPage;
