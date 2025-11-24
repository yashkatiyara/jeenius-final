import React from 'react';
import { ArrowRight, Sparkles, Brain, Target, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const Hero = () => {
  const navigate = useNavigate();

  const handleStartLearning = () => {
    navigate('/signup');
  };

  return (
    <section className="relative h-screen flex items-center overflow-hidden bg-gradient-to-br from-white via-[#f8f9fa] to-[#e6eeff]">
      {/* Floating orbs - Apple style */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-[10%] w-[300px] h-[300px] bg-primary/5 rounded-full blur-3xl animate-float" />
        <div className="absolute top-40 right-[15%] w-[250px] h-[250px] bg-[#e6eeff] rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-20 left-[20%] w-[200px] h-[200px] bg-primary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-0 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Content */}
          <div className="space-y-4 lg:space-y-6 animate-fade-in-up">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm font-medium text-primary">
                AI-Powered Learning Platform
              </span>
            </div>

            {/* Headline */}
            <div className="space-y-3 lg:space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1]">
                <span className="font-bold">Master JEE with</span>
                <span className="block text-primary mt-2 font-bold">
                  Intelligent AI
                </span>
              </h1>
              <p className="text-lg lg:text-xl text-muted-foreground max-w-xl leading-relaxed font-semibold">
                India's most advanced AI tutor that learns your style, adapts to your pace, and guides you to success.
              </p>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 lg:gap-6 pt-2">
              <div>
                <div className="text-2xl lg:text-3xl font-bold text-primary">50K+</div>
                <div className="text-xs lg:text-sm text-muted-foreground mt-1 font-semibold">Active Students</div>
              </div>
              <div className="w-px h-10 lg:h-12 bg-border" />
              <div>
                <div className="text-2xl lg:text-3xl font-bold text-primary">1M+</div>
                <div className="text-xs lg:text-sm text-muted-foreground mt-1 font-semibold">Questions Solved</div>
              </div>
              <div className="w-px h-10 lg:h-12 bg-border" />
              <div>
                <div className="text-2xl lg:text-3xl font-bold text-primary">98%</div>
                <div className="text-xs lg:text-sm text-muted-foreground mt-1 font-semibold">Success Rate</div>
              </div>
            </div>

            {/* CTA */}
            <div className="flex items-center gap-4 pt-2">
              <Button 
                size="lg"
                className="bg-primary hover:bg-primary/90 text-white px-6 lg:px-8 py-4 lg:py-6 text-base lg:text-lg font-bold rounded-xl shadow-apple-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                onClick={handleStartLearning}
              >
                <span className="font-bold">Start Learning Free</span>
                <ArrowRight className="ml-2 w-4 lg:w-5 h-4 lg:h-5" />
              </Button>
            </div>

            {/* Trust badges */}
            <div className="flex items-center gap-3 lg:gap-4 pt-2 text-xs lg:text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-4 lg:w-5 h-4 lg:h-5 rounded-full bg-green-500/10 flex items-center justify-center">
                  <div className="w-1.5 lg:w-2 h-1.5 lg:h-2 rounded-full bg-green-500" />
                </div>
                <span className="font-semibold">DPDP Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 lg:w-5 h-4 lg:h-5 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <div className="w-1.5 lg:w-2 h-1.5 lg:h-2 rounded-full bg-blue-500" />
                </div>
                <span className="font-semibold">Offline Ready</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 lg:w-5 h-4 lg:h-5 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <div className="w-1.5 lg:w-2 h-1.5 lg:h-2 rounded-full bg-purple-500" />
                </div>
                <span className="font-semibold">12 Languages</span>
              </div>
            </div>
          </div>

          {/* Visual */}
          <div className="relative hidden lg:block lg:h-[500px] animate-scale-in">
            {/* Main card */}
            <div className="glass-card rounded-3xl p-8 shadow-apple-lg relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">JEEnius AI</div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      <span>Active now</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-medium text-primary">Smart Mode</span>
                </div>
              </div>

              {/* Chat messages */}
              <div className="space-y-4">
                <div className="flex justify-start">
                  <div className="bg-primary/5 rounded-2xl rounded-tl-sm px-5 py-3.5 max-w-[85%]">
                    <p className="text-sm text-foreground leading-relaxed">
                      I've analyzed your learning pattern. You excel at visual concepts. Let's tackle Rotational Dynamics with diagrams.
                    </p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="bg-primary rounded-2xl rounded-tr-sm px-5 py-3.5 max-w-[85%]">
                    <p className="text-sm text-white leading-relaxed">
                      Perfect! I struggle with equations.
                    </p>
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-primary/5 rounded-2xl rounded-tl-sm px-5 py-3.5 max-w-[85%]">
                    <p className="text-sm text-foreground leading-relaxed">
                      I'll break it down step-by-step with illustrations. Ready for your personalized question?
                    </p>
                  </div>
                </div>
              </div>

              {/* Input area */}
              <div className="mt-6 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Ask me anything about JEE..."
                  className="flex-1 px-4 py-3 rounded-xl bg-muted/50 border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                  disabled
                />
                <Button
                  size="icon"
                  className="w-10 h-10 rounded-xl bg-primary hover:bg-primary/90"
                >
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Floating feature cards */}
            <div className="absolute -left-8 top-20 glass-card rounded-2xl p-4 shadow-apple max-w-[180px] animate-float z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <Target className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground font-semibold">Accuracy</div>
                  <div className="text-lg font-bold text-foreground">94%</div>
                </div>
              </div>
            </div>

            <div className="absolute -right-8 bottom-32 glass-card rounded-2xl p-4 shadow-apple max-w-[180px] animate-float z-10" style={{ animationDelay: '1s' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground font-semibold">Streak</div>
                  <div className="text-lg font-bold text-foreground">28 days</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
