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
    <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-white via-[#f8f9fa] to-[#e6eeff] pt-20 pb-8 md:pt-0 md:pb-0">
      {/* Floating orbs - Apple style */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-[10%] w-[150px] h-[150px] md:w-[300px] md:h-[300px] bg-primary/5 rounded-full blur-3xl animate-float" />
        <div className="absolute top-40 right-[15%] w-[100px] h-[100px] md:w-[250px] md:h-[250px] bg-[#e6eeff] rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-20 left-[20%] w-[80px] h-[80px] md:w-[200px] md:h-[200px] bg-primary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-0 relative z-10">
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-12 items-center">
          {/* Content */}
          <div className="space-y-4 lg:space-y-6 animate-fade-in-up text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full glass-card">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs md:text-sm font-medium text-primary">
                AI-Powered Learning Platform
              </span>
            </div>

            {/* Headline */}
            <div className="space-y-2 lg:space-y-4">
              <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1]">
                <span className="font-bold">Master JEE with</span>
                <span className="block text-primary mt-1 md:mt-2 font-bold">
                  Intelligent AI
                </span>
              </h1>
              <p className="text-base lg:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed font-semibold">
                India's most advanced AI tutor that learns your style, adapts to your pace, and guides you to success.
              </p>
            </div>

            {/* Stats - Mobile optimized grid */}
            <div className="flex items-center justify-center lg:justify-start gap-3 md:gap-6 pt-2">
              <div className="text-center">
                <div className="text-xl md:text-3xl font-bold text-primary">50K+</div>
                <div className="text-[10px] md:text-sm text-muted-foreground mt-0.5 md:mt-1 font-semibold">Active Students</div>
              </div>
              <div className="w-px h-8 md:h-12 bg-border" />
              <div className="text-center">
                <div className="text-xl md:text-3xl font-bold text-primary">1M+</div>
                <div className="text-[10px] md:text-sm text-muted-foreground mt-0.5 md:mt-1 font-semibold">Questions Solved</div>
              </div>
              <div className="w-px h-8 md:h-12 bg-border" />
              <div className="text-center">
                <div className="text-xl md:text-3xl font-bold text-primary">98%</div>
                <div className="text-[10px] md:text-sm text-muted-foreground mt-0.5 md:mt-1 font-semibold">Success Rate</div>
              </div>
            </div>

            {/* CTA */}
            <div className="flex items-center justify-center lg:justify-start gap-4 pt-2">
              <Button 
                size="lg"
                className="bg-primary hover:bg-primary/90 text-white px-5 md:px-8 py-3 md:py-6 text-sm md:text-lg font-bold rounded-xl shadow-apple-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                onClick={handleStartLearning}
              >
                <span className="font-bold">Start Learning Free</span>
                <ArrowRight className="ml-2 w-4 lg:w-5 h-4 lg:h-5" />
              </Button>
            </div>

            {/* Trust badges - Mobile optimized */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 md:gap-4 pt-2 text-[10px] md:text-sm text-muted-foreground">
              <div className="flex items-center gap-1 md:gap-2">
                <div className="w-3 md:w-5 h-3 md:h-5 rounded-full bg-green-500/10 flex items-center justify-center">
                  <div className="w-1 md:w-2 h-1 md:h-2 rounded-full bg-green-500" />
                </div>
                <span className="font-semibold">DPDP Compliant</span>
              </div>
              <div className="flex items-center gap-1 md:gap-2">
                <div className="w-3 md:w-5 h-3 md:h-5 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <div className="w-1 md:w-2 h-1 md:h-2 rounded-full bg-blue-500" />
                </div>
                <span className="font-semibold">Offline Ready</span>
              </div>
              <div className="flex items-center gap-1 md:gap-2">
                <div className="w-3 md:w-5 h-3 md:h-5 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <div className="w-1 md:w-2 h-1 md:h-2 rounded-full bg-purple-500" />
                </div>
                <span className="font-semibold">12 Languages</span>
              </div>
            </div>
          </div>

          {/* Visual - Mobile Preview Card */}
          <div className="relative lg:h-[500px] animate-scale-in">
            {/* Main card */}
            <div className="glass-card rounded-2xl md:rounded-3xl p-4 md:p-8 shadow-apple-lg relative z-10">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-primary flex items-center justify-center">
                    <Brain className="w-4 h-4 md:w-5 md:h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-xs md:text-sm font-semibold text-foreground">JEEnius AI</div>
                    <div className="flex items-center gap-1 text-[10px] md:text-xs text-muted-foreground">
                      <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-green-500 animate-pulse" />
                      <span>Active now</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 md:px-3 md:py-1.5 rounded-full bg-primary/10">
                  <Sparkles className="w-3 h-3 md:w-3.5 md:h-3.5 text-primary" />
                  <span className="text-[10px] md:text-xs font-medium text-primary">Smart Mode</span>
                </div>
              </div>

              {/* Chat messages - Simplified for mobile */}
              <div className="space-y-3 md:space-y-4">
                <div className="flex justify-start">
                  <div className="bg-primary/5 rounded-xl md:rounded-2xl rounded-tl-sm px-3 py-2 md:px-5 md:py-3.5 max-w-[90%] md:max-w-[85%]">
                    <p className="text-xs md:text-sm text-foreground leading-relaxed">
                      I've analyzed your learning pattern. Let's tackle Rotational Dynamics!
                    </p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="bg-primary rounded-xl md:rounded-2xl rounded-tr-sm px-3 py-2 md:px-5 md:py-3.5 max-w-[90%] md:max-w-[85%]">
                    <p className="text-xs md:text-sm text-white leading-relaxed">
                      Perfect! I struggle with equations.
                    </p>
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-primary/5 rounded-xl md:rounded-2xl rounded-tl-sm px-3 py-2 md:px-5 md:py-3.5 max-w-[90%] md:max-w-[85%]">
                    <p className="text-xs md:text-sm text-foreground leading-relaxed">
                      I'll break it down step-by-step. Ready?
                    </p>
                  </div>
                </div>
              </div>

              {/* Input area */}
              <div className="mt-4 md:mt-6 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Ask me anything..."
                  className="flex-1 px-3 py-2 md:px-4 md:py-3 rounded-lg md:rounded-xl bg-muted/50 border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 text-xs md:text-sm"
                  disabled
                />
                <Button
                  size="icon"
                  className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-primary hover:bg-primary/90"
                >
                  <ArrowRight className="w-3 h-3 md:w-4 md:h-4" />
                </Button>
              </div>
            </div>

            {/* Floating feature cards - Hidden on small mobile, visible on larger screens */}
            <div className="absolute -left-2 md:-left-8 top-10 md:top-20 glass-card rounded-xl md:rounded-2xl p-2 md:p-4 shadow-apple max-w-[120px] md:max-w-[180px] animate-float z-10 hidden sm:block">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-7 h-7 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-green-500/10 flex items-center justify-center">
                  <Target className="w-3 h-3 md:w-5 md:h-5 text-green-600" />
                </div>
                <div>
                  <div className="text-[10px] md:text-xs text-muted-foreground font-semibold">Accuracy</div>
                  <div className="text-sm md:text-lg font-bold text-foreground">94%</div>
                </div>
              </div>
            </div>

            <div className="absolute -right-2 md:-right-8 bottom-20 md:bottom-32 glass-card rounded-xl md:rounded-2xl p-2 md:p-4 shadow-apple max-w-[120px] md:max-w-[180px] animate-float z-10 hidden sm:block" style={{ animationDelay: '1s' }}>
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-7 h-7 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <TrendingUp className="w-3 h-3 md:w-5 md:h-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-[10px] md:text-xs text-muted-foreground font-semibold">Streak</div>
                  <div className="text-sm md:text-lg font-bold text-foreground">28 days</div>
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
