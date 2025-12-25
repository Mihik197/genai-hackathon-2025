"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  ShieldCheck,
  TrendUp,
  Users,
  Scales,
  ArrowRight,
  Lightning,
  BellRinging,
  Warning,
  Sparkle,
  CaretLeft,
  CaretRight,
  Target
} from "@phosphor-icons/react";

export default function Home() {
  const router = useRouter();
  const [activeModule, setActiveModule] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentTranslate, setCurrentTranslate] = useState(0);
  const [prevTranslate, setPrevTranslate] = useState(0);
  const [tickerMessages, setTickerMessages] = useState<string[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Generate live ticker messages
  const generateLiveMessages = () => {
    const marketData = [
      { symbol: "NIFTY", price: 21850 + Math.random() * 100, change: (Math.random() * 2 - 1).toFixed(2) },
      { symbol: "SENSEX", price: 72450 + Math.random() * 150, change: (Math.random() * 2 - 1).toFixed(2) },
    ];

    return [
      `🔴 ALERT: ${marketData[0].symbol} down ${Math.abs(parseFloat(marketData[0].change))}% - Consider defensive positioning`,
      `🤖 AI INSIGHT: Strong buy signal in Indian IT sector - TCS, Infosys showing bullish patterns`,
      `📊 LIVE: ${marketData[1].symbol} at ₹${marketData[1].price.toFixed(2)} (${marketData[1].change}%)`,
      `⚡ BREAKING: RBI maintains repo rate at 6.5% - Banking stocks stable`,
      `🎯 AI RECOMMENDATION: Accumulate pharma stocks - Export growth 12% YoY`,
      `💡 SMART TIP: Portfolio rebalancing suggested - Tech allocation 5% high`,
      `📈 TRENDING: EV sector momentum - Tata Motors up 3.2%`,
      `🚨 ALERT: Unusual options activity in HDFC Bank - Breakout incoming`,
      `🔍 AI SCANNER: 23 stocks crossed 200-day MA - Momentum building`,
      `💰 OPPORTUNITY: Gold dipping - Entry point at ₹61,200`,
      `🌏 GLOBAL: US Fed signals pause - Positive for India`,
      `🏆 TOP PICK: AI suggests Reliance Industries for long-term wealth`,
    ];
  };

  // Update ticker every 5 seconds
  useEffect(() => {
    setTickerMessages(generateLiveMessages());
    const interval = setInterval(() => {
      setTickerMessages(generateLiveMessages());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const modules = [
    {
      title: "Comply",
      subtitle: "Regulatory Intelligence",
      description: "AI-powered compliance monitoring with real-time gap analysis across 40+ regulations. Automated reporting reduces manual effort by 85%.",
      icon: Scales,
      href: "/comply",
      gradient: "from-violet-600 via-purple-600 to-fuchsia-600",
      stats: { primary: "3 Critical Gaps", secondary: "94% Compliant", tertiary: "Last scan: 2m" },
      metrics: [
        { label: "Regulations", value: "42" },
        { label: "Auto-fixes", value: "156" },
        { label: "Risk Score", value: "Low" },
      ]
    },
    {
      title: "Inclusion",
      subtitle: "Alternative Credit Scoring",
      description: "Machine learning models analyze 200+ non-traditional data points to provide fair credit access to underserved populations.",
      icon: Users,
      href: "/inclusion",
      gradient: "from-blue-600 via-cyan-600 to-teal-600",
      stats: { primary: "156 Approved", secondary: "+8.4% Growth", tertiary: "12 apps pending" },
      metrics: [
        { label: "Approval Rate", value: "67%" },
        { label: "Avg. Time", value: "4.2min" },
        { label: "Default Rate", value: "2.1%" },
      ]
    },
    {
      title: "Advisor",
      subtitle: "AI Investment Intelligence",
      description: "Personalized portfolio management powered by deep learning. Real-time optimization across 15+ asset classes with predictive analytics.",
      icon: TrendUp,
      href: "/advisor",
      gradient: "from-emerald-600 via-green-600 to-lime-600",
      stats: { primary: "$2.4M AUM", secondary: "+12.8% Returns", tertiary: "8 portfolios" },
      metrics: [
        { label: "Alpha", value: "+4.2%" },
        { label: "Sharpe Ratio", value: "1.84" },
        { label: "Win Rate", value: "73%" },
      ]
    },
    {
      title: "Shield",
      subtitle: "Fraud Detection Engine",
      description: "Real-time transaction monitoring using ensemble ML models. Detects anomalies in <50ms with 94% accuracy and minimal false positives.",
      icon: ShieldCheck,
      href: "/shield",
      gradient: "from-red-600 via-rose-600 to-pink-600",
      stats: { primary: "2.4K TXN/s", secondary: "94% Accuracy", tertiary: "3 threats blocked" },
      metrics: [
        { label: "False Positive", value: "0.8%" },
        { label: "Response", value: "48ms" },
        { label: "Blocked", value: "23" },
      ]
    },
  ];

  // Swipe handlers
  const handleStart = (clientX: number) => {
    setIsDragging(true);
    setStartX(clientX);
  };

  const handleMove = (clientX: number) => {
    if (!isDragging) return;
    const diff = clientX - startX;
    setCurrentTranslate(prevTranslate + diff);
  };

  const handleEnd = () => {
    setIsDragging(false);
    const movedBy = currentTranslate - prevTranslate;
    
    if (movedBy < -100 && activeModule < modules.length - 1) {
      setActiveModule(activeModule + 1);
    } else if (movedBy > 100 && activeModule > 0) {
      setActiveModule(activeModule - 1);
    }
    
    setPrevTranslate(-activeModule * 100);
    setCurrentTranslate(-activeModule * 100);
  };

  const navigateToModule = () => {
    router.push(modules[activeModule].href);
  };

  const nextModule = () => {
    if (activeModule < modules.length - 1) setActiveModule(activeModule + 1);
  };

  const prevModule = () => {
    if (activeModule > 0) setActiveModule(activeModule - 1);
  };

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>, cardIndex: number) => {
    if (isDragging) return;
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setMousePosition({ x, y });
    setHoveredCard(cardIndex);
  };

  const handleCardMouseLeave = () => {
    setHoveredCard(null);
    setMousePosition({ x: 0.5, y: 0.5 });
  };

  const getCardTransform = (cardIndex: number) => {
    if (hoveredCard !== cardIndex) return 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
    const { x, y } = mousePosition;
    const rotateY = (x - 0.5) * 20;
    const rotateX = (y - 0.5) * -20;
    return `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
  };

  const getGlarePosition = (cardIndex: number) => {
    if (hoveredCard !== cardIndex) return { x: 50, y: 50 };
    const { x, y } = mousePosition;
    return { x: x * 100, y: y * 100 };
  };

  return (
    <DashboardLayout>
      <div className="fixed inset-0 top-16 left-0 right-0 overflow-hidden">
        {/* Live Ticker Header */}
        <div className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b-2 border-red-500 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/5 to-transparent animate-scanline"></div>
          
          <div className="relative z-10 flex items-center py-3 px-8">
            <div className="flex items-center gap-2 mr-6 shrink-0">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-600 rounded-lg">
                <BellRinging size={18} weight="fill" className="text-white animate-pulse" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">Live Feed</span>
              </div>
              <div className="px-3 py-1.5 bg-slate-700/50 backdrop-blur-sm rounded-lg border border-slate-600">
                <span className="text-xs font-mono text-emerald-400" suppressHydrationWarning>
                  {currentTime.toLocaleTimeString('en-IN', { hour12: false })} IST
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-hidden">
              <div className="flex animate-ticker whitespace-nowrap">
                {[...tickerMessages, ...tickerMessages].map((msg, i) => (
                  <div key={i} className="inline-flex items-center mx-8">
                    <span className="text-sm font-medium text-white">{msg}</span>
                    <span className="mx-4 text-slate-500">•</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 ml-6 shrink-0">
              <Sparkle size={18} weight="fill" className="text-yellow-400 animate-pulse" />
              <span className="text-xs font-bold text-yellow-400">AI ACTIVE</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="relative bg-gradient-to-br from-slate-50 to-slate-100 h-full overflow-hidden flex flex-col p-4">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-10 w-96 h-96 bg-violet-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
            <div className="absolute top-40 right-10 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
            <div className="absolute bottom-20 left-1/2 w-96 h-96 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
          </div>

          <div className="relative z-10 text-center mb-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Lightning size={32} weight="fill" className="text-primary animate-pulse" />
              <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600">
                FinGuard Command Center
              </h1>
              <Target size={32} weight="fill" className="text-primary animate-pulse" />
            </div>
            <p className="text-text-muted text-sm font-medium">
              Swipe or use arrows to explore modules • Click to launch
            </p>
          </div>

          {/* Carousel */}
          <div className="relative max-w-6xl mx-auto flex-1 flex flex-col">
            <button
              onClick={prevModule}
              disabled={activeModule === 0}
              className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 z-20 w-12 h-12 rounded-full bg-white shadow-2xl flex items-center justify-center transition-all hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed ${activeModule === 0 ? 'invisible' : ''}`}
            >
              <CaretLeft size={24} weight="bold" className="text-primary" />
            </button>

            <button
              onClick={nextModule}
              disabled={activeModule === modules.length - 1}
              className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 z-20 w-12 h-12 rounded-full bg-white shadow-2xl flex items-center justify-center transition-all hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed ${activeModule === modules.length - 1 ? 'invisible' : ''}`}
            >
              <CaretRight size={24} weight="bold" className="text-primary" />
            </button>

            <div
              ref={carouselRef}
              className="relative overflow-hidden rounded-3xl cursor-grab active:cursor-grabbing"
              onMouseDown={(e) => handleStart(e.clientX)}
              onMouseMove={(e) => handleMove(e.clientX)}
              onMouseUp={handleEnd}
              onMouseLeave={handleEnd}
              onTouchStart={(e) => handleStart(e.touches[0].clientX)}
              onTouchMove={(e) => handleMove(e.touches[0].clientX)}
              onTouchEnd={handleEnd}
            >
              <div
                className="flex transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${activeModule * 100}%)` }}
              >
                {modules.map((module, idx) => {
                  const Icon = module.icon;
                  const glarePos = getGlarePosition(idx);
                  const isHovered = hoveredCard === idx;
                  return (
                    <div key={idx} className="min-w-full px-2 h-full">
                      <div 
                        className={`relative rounded-2xl overflow-hidden shadow-2xl transition-all duration-500 h-full ${idx === activeModule ? 'scale-100' : 'scale-95 opacity-50'}`}
                        style={{
                          transform: idx === activeModule ? getCardTransform(idx) : undefined,
                          transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.5s ease-out',
                        }}
                        onMouseMove={(e) => handleCardMouseMove(e, idx)}
                        onMouseLeave={handleCardMouseLeave}
                      >
                        <div className={`relative bg-gradient-to-br ${module.gradient} p-6 h-full`}>
                          {/* Grid Pattern */}
                          <div className="absolute inset-0 bg-grid-white/[0.1] bg-[size:30px_30px]"></div>
                          
                          {/* Glass Reflection Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/20 opacity-60"></div>
                          
                          {/* Animated Glare Effect */}
                          <div 
                            className="absolute inset-0 opacity-0 transition-opacity duration-300 pointer-events-none"
                            style={{
                              opacity: isHovered ? 0.4 : 0,
                              background: `radial-gradient(circle 400px at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,0.8), transparent 40%)`,
                            }}
                          ></div>
                          
                          {/* Shimmer Effect */}
                          <div 
                            className="absolute inset-0 opacity-0 transition-opacity duration-300"
                            style={{
                              opacity: isHovered ? 0.3 : 0,
                              background: `linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.5) 50%, transparent 60%)`,
                              backgroundSize: '200% 200%',
                              animation: isHovered ? 'shimmer 2s infinite' : 'none',
                            }}
                          ></div>
                          
                          {/* Dark Gradient Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>

                          <div className="relative z-10 h-full flex flex-col">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center ring-4 ring-white/40 shadow-2xl transform transition-transform duration-300 hover:scale-110 hover:rotate-6">
                                  <Icon size={32} weight="fill" className="text-white" />
                                </div>
                                <div>
                                  <h2 className="text-3xl font-black text-white mb-1">{module.title}</h2>
                                  <p className="text-lg font-semibold text-white/90">{module.subtitle}</p>
                                </div>
                              </div>
                            </div>

                            <p className="text-base text-white/95 leading-relaxed mb-4 max-w-3xl">
                              {module.description}
                            </p>

                            <div className="grid grid-cols-3 gap-3 mb-4">
                              {module.metrics.map((metric, i) => (
                                <div key={i} className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20 transform transition-all duration-300 hover:bg-white/20 hover:scale-105 hover:shadow-2xl">
                                  <div className="text-xs font-semibold text-white/70 mb-1">{metric.label}</div>
                                  <div className="text-2xl font-black text-white">{metric.value}</div>
                                </div>
                              ))}
                            </div>

                            <div className="grid grid-cols-3 gap-3 mb-4">
                              <div className="bg-white/15 backdrop-blur-md rounded-lg p-3 border border-white/30 transform transition-all duration-300 hover:bg-white/25 hover:scale-105">
                                <div className="text-xs font-bold text-white/60 uppercase tracking-wider mb-1">Primary</div>
                                <div className="text-lg font-bold text-white">{module.stats.primary}</div>
                              </div>
                              <div className="bg-white/15 backdrop-blur-md rounded-lg p-3 border border-white/30 transform transition-all duration-300 hover:bg-white/25 hover:scale-105">
                                <div className="text-xs font-bold text-white/60 uppercase tracking-wider mb-1">Secondary</div>
                                <div className="text-lg font-bold text-white">{module.stats.secondary}</div>
                              </div>
                              <div className="bg-white/15 backdrop-blur-md rounded-lg p-3 border border-white/30 transform transition-all duration-300 hover:bg-white/25 hover:scale-105">
                                <div className="text-xs font-bold text-white/60 uppercase tracking-wider mb-1">Status</div>
                                <div className="text-lg font-bold text-white">{module.stats.tertiary}</div>
                              </div>
                            </div>

                            <div className="mt-auto">
                              <Button
                                size="lg"
                                onClick={navigateToModule}
                                className="w-full bg-white text-gray-900 hover:bg-gray-100 shadow-2xl text-lg py-4 font-bold group transform hover:scale-105 transition-all"
                              >
                                Launch {module.title} Module
                                <ArrowRight size={20} weight="bold" className="ml-2 group-hover:translate-x-2 transition-transform" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 mt-4">
              {modules.map((module, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveModule(idx)}
                  className={`transition-all duration-300 rounded-full ${
                    idx === activeModule
                      ? `w-8 h-2.5 bg-gradient-to-r ${module.gradient}`
                      : 'w-2.5 h-2.5 bg-slate-300 hover:bg-slate-400'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
