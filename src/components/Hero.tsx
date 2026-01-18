import React from 'react';
import { ArrowRight, Zap, BookOpen, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Hero = () => {
  const navigate = useNavigate();

  const handleStartLearning = () => {
    navigate('/signup');
  };

  return (
    <section className="relative h-screen w-full flex flex-col bg-white overflow-hidden">
      {/* Subtle geometric background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#e6eeff] rounded-full -translate-y-1/2 translate-x-1/3 opacity-60" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#e6eeff] rounded-full translate-y-1/2 -translate-x-1/3 opacity-40" />
      </div>

      {/* Floating Navigation Buttons - Top Right */}
      <div className="fixed top-6 right-6 flex gap-3 z-50 pointer-events-auto">
        <button
          onClick={() => navigate('/why-us')}
          className="px-6 py-2.5 text-sm md:text-base font-semibold text-[#013062] rounded-full hover:bg-[#013062]/5 transition-all duration-300 hover:scale-105 border border-[#013062]/10 hover:border-[#013062]/30"
        >
          Why Us
        </button>
        <button
          onClick={() => navigate('/login')}
          className="px-6 py-2.5 text-sm md:text-base font-semibold text-white bg-[#013062] rounded-full hover:bg-[#1a5fa0] transition-all duration-300 hover:scale-105 shadow-md hover:shadow-lg"
        >
          Sign In
        </button>
      </div>

      {/* Main hero content - Center aligned */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          {/* Main headline */}
          <div className="space-y-4">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-wide leading-[1.05]">
              <span className="text-[#013062] block">Where AI</span>
              <span className="text-[#013062] block">adapts YOU</span>
            </h1>

            <p className="text-lg md:text-xl text-[#013062]/70 max-w-2xl mx-auto leading-relaxed font-light">
              The smartest way to prepare for JEE & NEET. Personalized learning that evolves with you.
            </p>
          </div>

          {/* CTA Button */}
          <div className="pt-4">
            <button
              onClick={handleStartLearning}
              className="group relative inline-flex items-center gap-3 px-10 md:px-12 py-4 md:py-5 text-base md:text-lg font-bold text-white rounded-full overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg hover:shadow-2xl"
            >
              {/* Background */}
              <div className="absolute inset-0 bg-[#013062] group-hover:bg-[#1a5fa0] transition-colors duration-300" />

              {/* Glow on hover */}
              <div className="absolute -inset-1 bg-gradient-to-r from-[#013062] to-[#1a5fa0] rounded-full opacity-0 group-hover:opacity-50 blur-xl transition-opacity duration-300 -z-10" />

              {/* Content */}
              <span className="relative z-10 text-white">Start Learning Free</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300 relative z-10" />
            </button>
          </div>

          {/* Feature cards - 3 column grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 pt-8 max-w-3xl mx-auto">
            <div className="bg-white/50 backdrop-blur-sm border border-[#013062]/10 rounded-2xl p-5 md:p-6 hover:border-[#013062]/30 hover:shadow-lg transition-all duration-300 group">
              <div className="w-10 h-10 rounded-lg bg-[#013062]/10 flex items-center justify-center mb-3 mx-auto group-hover:scale-110 transition-transform">
                <Zap className="w-5 h-5 text-[#013062]" />
              </div>
              <h3 className="text-[#013062] font-semibold text-base mb-1">Adaptive</h3>
              <p className="text-[#013062]/50 text-xs">AI adjusts difficulty</p>
            </div>

            <div className="bg-white/50 backdrop-blur-sm border border-[#013062]/10 rounded-2xl p-5 md:p-6 hover:border-[#013062]/30 hover:shadow-lg transition-all duration-300 group">
              <div className="w-10 h-10 rounded-lg bg-[#013062]/10 flex items-center justify-center mb-3 mx-auto group-hover:scale-110 transition-transform">
                <BookOpen className="w-5 h-5 text-[#013062]" />
              </div>
              <h3 className="text-[#013062] font-semibold text-base mb-1">40K+ Questions</h3>
              <p className="text-[#013062]/50 text-xs">Comprehensive bank</p>
            </div>

            <div className="bg-white/50 backdrop-blur-sm border border-[#013062]/10 rounded-2xl p-5 md:p-6 hover:border-[#013062]/30 hover:shadow-lg transition-all duration-300 group">
              <div className="w-10 h-10 rounded-lg bg-[#013062]/10 flex items-center justify-center mb-3 mx-auto group-hover:scale-110 transition-transform">
                <Trophy className="w-5 h-5 text-[#013062]" />
              </div>
              <h3 className="text-[#013062] font-semibold text-base mb-1">Track Progress</h3>
              <p className="text-[#013062]/50 text-xs">Real-time analytics</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
