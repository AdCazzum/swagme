import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, 
  Shield, 
  QrCode, 
  Zap, 
  Users, 
  Globe, 
  CheckCircle,
  BarChart3,
  PlayCircle,
  Award,
  Rocket,
  Sparkles,
  Gift,
  Calendar,
  Smartphone,
  UserCheck,
  Eye,
  Bot
} from 'lucide-react';

interface LandingPageProps {
  onNavigateToDashboard: () => void;
}

const LandingPage = ({ onNavigateToDashboard }: LandingPageProps) => {
  const scrollToDemo = () => {
    document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' });
  };

  const startApp = () => {
    onNavigateToDashboard();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Navigation */}
      <nav className="relative bg-white/95 backdrop-blur-lg border-b border-gray-200/60 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl transform rotate-3 hover:rotate-0 transition-transform duration-300">
                  <span className="text-white font-bold text-xl">S</span>
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-3 border-white animate-pulse shadow-lg"></div>
                <Sparkles className="absolute -bottom-1 -left-1 w-4 h-4 text-yellow-400 animate-bounce" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 bg-clip-text text-transparent">
                  SwagForm
                </h1>
                <p className="text-sm font-medium text-gray-600">Event Lead Collection</p>
              </div>
            </div>

            {/* CTA */}
            <Button 
              onClick={startApp}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-0"
            >
              <Rocket className="w-5 h-5 mr-2" />
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-purple-600/5 to-pink-600/5"></div>
        
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-20 h-20 bg-blue-400/20 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute top-40 right-20 w-32 h-32 bg-purple-400/20 rounded-full blur-2xl animate-bounce"></div>
          <div className="absolute bottom-20 left-20 w-16 h-16 bg-pink-400/20 rounded-full blur-lg animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-green-100 to-emerald-100 border border-green-200 rounded-full px-6 py-3 mb-8 shadow-lg backdrop-blur-sm">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-sm"></div>
              <span className="text-sm font-semibold text-green-800">
                🎉 Perfect for Events & Conferences
              </span>
              <Gift className="w-4 h-4 text-green-600" />
            </div>

            {/* Main Headline */}
            <h1 className="text-5xl lg:text-7xl font-black text-gray-900 leading-tight mb-8">
              Collect Event Leads
              <br />
              <span className="relative inline-block">
                <span className="relative z-10 text-blue-700">Distribute Swag</span>
                <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-full h-2 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-full opacity-60"></div>
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-2xl lg:text-3xl text-gray-700 max-w-4xl mx-auto mb-8 leading-relaxed font-medium">
              Create, share, and collect form responses 
              <span className="font-bold text-blue-700"> securely on the blockchain</span>. 
              <br className="hidden lg:block" />
              Beautiful forms with 
              <span className="font-bold text-purple-700"> QR code sharing</span> and 
              <span className="font-bold text-green-700"> real-time analytics</span>.
            </p>

            {/* World Integration Highlight */}
            <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6 max-w-4xl mx-auto mb-12 shadow-lg">
              <div className="flex items-center justify-center space-x-4 mb-4">
                <div className="flex items-center space-x-2">
                  <UserCheck className="w-8 h-8 text-blue-600" />
                  <Eye className="w-6 h-6 text-purple-600" />
                </div>
                <div className="h-8 w-px bg-gray-300"></div>
                <div className="flex items-center space-x-2">
                  <Bot className="w-6 h-6 text-red-500 line-through opacity-50" />
                  <span className="text-lg font-bold text-gray-900">No Bots, No Fake Leads</span>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                🌍 Only <span className="text-blue-700">Real, Verified Humans</span>
              </h3>
              <p className="text-lg text-gray-700 leading-relaxed">
                Thanks to <span className="font-bold text-purple-700">World Chain integration</span>, 
                every lead is automatically verified as a real person. 
                <span className="font-bold text-green-700"> No bots, no duplicates, no spam</span> - 
                just qualified prospects ready to engage with your brand.
              </p>
            </div>

            {/* Use Cases */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-16">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50 hover:shadow-xl transition-shadow duration-300">
                <Calendar className="w-8 h-8 text-blue-600 mb-4 mx-auto" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">Conference Booths</h3>
                <p className="text-gray-600">Collect verified leads at your booth with QR codes on banners and tables</p>
                <div className="mt-3 flex items-center justify-center space-x-1 text-xs text-green-700 font-medium">
                  <UserCheck className="w-4 h-4" />
                  <span>100% Human Verified</span>
                </div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50 hover:shadow-xl transition-shadow duration-300">
                <Gift className="w-8 h-8 text-purple-600 mb-4 mx-auto" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">Swag Distribution</h3>
                <p className="text-gray-600">Give away merch to real people - no bots wasting your inventory</p>
                <div className="mt-3 flex items-center justify-center space-x-1 text-xs text-green-700 font-medium">
                  <Shield className="w-4 h-4" />
                  <span>Anti-Bot Protection</span>
                </div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50 hover:shadow-xl transition-shadow duration-300">
                <Users className="w-8 h-8 text-green-600 mb-4 mx-auto" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">Networking Events</h3>
                <p className="text-gray-600">Build quality contact lists with genuine attendees only</p>
                <div className="mt-3 flex items-center justify-center space-x-1 text-xs text-green-700 font-medium">
                  <CheckCircle className="w-4 h-4" />
                  <span>Qualified Prospects</span>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8 mb-16">
              <Button 
                onClick={startApp}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold px-12 py-6 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 text-xl border-0"
              >
                <Rocket className="w-6 h-6 mr-3" />
                Create Your First Form
                <ArrowRight className="w-6 h-6 ml-3" />
              </Button>
              <Button 
                onClick={scrollToDemo}
                variant="outline"
                size="lg"
                className="border-3 border-gray-300 hover:border-blue-400 bg-white/80 backdrop-blur-sm text-gray-800 hover:text-blue-700 font-bold px-12 py-6 rounded-2xl transition-all duration-300 hover:shadow-xl text-xl"
              >
                <PlayCircle className="w-6 h-6 mr-3" />
                See How It Works
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="demo" className="py-24 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <Badge className="mb-6 px-6 py-2 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border-purple-200 text-lg font-semibold">
              🚀 3 Simple Steps
            </Badge>
            <h2 className="text-5xl font-black text-gray-900 mb-6">Perfect for Events</h2>
            <p className="text-2xl text-gray-600 max-w-3xl mx-auto font-medium">
              From setup to <span className="text-blue-700 font-bold">verified lead collection</span> in 
              <span className="text-purple-700 font-bold"> under 5 minutes</span>
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
            {[
              {
                step: '01',
                title: 'Create Your Form',
                description: 'Design a simple form to collect names, emails, and contact info. Add your event branding and customize the look.',
                icon: Zap,
                color: 'blue',
                features: ['Event branding', 'Custom questions', 'Mobile optimized']
              },
              {
                step: '02',
                title: 'Generate QR Code',
                description: 'Get an instant QR code to print on banners, business cards, or display on screens at your booth.',
                icon: QrCode,
                color: 'purple',
                features: ['Print-ready QR codes', 'Instant generation', 'Mobile-first design']
              },
              {
                step: '03',
                title: 'Collect Verified Leads',
                description: 'Watch real, human-verified leads come in real-time. Export contact lists and follow up with confidence.',
                icon: UserCheck,
                color: 'green',
                features: ['Real-time updates', 'Human verification', 'Quality guaranteed']
              }
            ].map((step, index) => (
              <div key={index} className="text-center group">
                <div className="relative mb-8">
                  {/* Connection Line */}
                  {index < 2 && (
                    <div className="hidden lg:block absolute top-12 left-full w-16 h-0.5 bg-gradient-to-r from-gray-300 to-gray-400 z-0"></div>
                  )}
                  
                  <div className={`relative w-24 h-24 bg-gradient-to-br from-${step.color}-400 to-${step.color}-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl group-hover:scale-110 transition-transform duration-300 z-10`}>
                    <step.icon className="w-12 h-12 text-white" />
                  </div>
                  <div className="absolute -top-3 -right-3 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center border-4 border-gray-100">
                    <span className="text-lg font-black text-gray-700">{step.step}</span>
                  </div>
                </div>
                <h3 className="text-3xl font-black text-gray-900 mb-4">{step.title}</h3>
                <p className="text-gray-700 leading-relaxed max-w-sm mx-auto mb-6 text-lg">
                  {step.description}
                </p>
                <div className="space-y-2">
                  {step.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center justify-center space-x-2">
                      <div className={`w-2 h-2 bg-${step.color}-500 rounded-full`}></div>
                      <span className="text-sm font-medium text-gray-600">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-black text-gray-900 mb-6">
              Why Event Organizers Love SwagForm
            </h2>
            <p className="text-2xl text-gray-600 max-w-3xl mx-auto font-medium">
              Built specifically for 
              <span className="text-blue-700 font-bold"> verified lead collection</span> and 
              <span className="text-purple-700 font-bold"> event management</span>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {[
              {
                icon: UserCheck,
                title: 'Human-Verified Leads',
                description: 'Every submission is verified through World Chain. No bots, no fake accounts - only real people interested in your event.',
                color: 'blue',
                badge: 'World Powered'
              },
              {
                icon: Shield,
                title: 'Secure & Permanent',
                description: 'All lead data is stored securely on the blockchain - no more lost contact lists or data breaches.',
                color: 'green',
                badge: 'Enterprise Security'
              },
              {
                icon: QrCode,
                title: 'QR Code Magic',
                description: 'Print QR codes on anything - banners, business cards, screens. Perfect for busy event environments.',
                color: 'purple',
                badge: 'Print Ready'
              },
              {
                icon: Smartphone,
                title: 'Mobile-First',
                description: 'Attendees can fill out forms on their phones in seconds - no app downloads or complicated processes.',
                color: 'indigo',
                badge: 'Zero Friction'
              },
              {
                icon: Zap,
                title: 'Lightning Fast',
                description: 'Set up a lead collection form in under 2 minutes. Get your QR code instantly and start collecting.',
                color: 'yellow',
                badge: '2 Min Setup'
              },
              {
                icon: BarChart3,
                title: 'Quality Guarantee',
                description: 'Watch verified leads come in during your event. Export quality contact lists immediately for follow-up.',
                color: 'pink',
                badge: '100% Real'
              }
            ].map((feature, index) => (
              <Card key={index} className="group hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 bg-white/90 backdrop-blur-sm border-0 shadow-lg overflow-hidden">
                <div className={`h-2 bg-gradient-to-r from-${feature.color}-400 to-${feature.color}-600`}></div>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-16 h-16 bg-gradient-to-br from-${feature.color}-400 to-${feature.color}-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                      <feature.icon className="w-8 h-8 text-white" />
                    </div>
                    <Badge className={`bg-${feature.color}-100 text-${feature.color}-800 border-${feature.color}-200 text-xs font-semibold`}>
                      {feature.badge}
                    </Badge>
                  </div>
                  <CardTitle className="text-2xl font-bold text-gray-900 mb-3">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-gray-700 leading-relaxed text-lg">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl animate-bounce"></div>
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-8 px-8 py-3 bg-white/20 backdrop-blur-sm text-white border-white/30 text-lg font-semibold">
            🎯 Ready for Your Next Event?
          </Badge>
          
          <h2 className="text-5xl lg:text-7xl font-black text-white mb-8 leading-tight">
            Start Collecting Leads 
            <br />
            <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
              Today
            </span>
          </h2>
          
          <p className="text-2xl text-blue-100 mb-12 max-w-3xl mx-auto font-medium leading-relaxed">
            Join event organizers who've collected thousands of <span className="text-white font-bold">verified leads</span> with SwagForm. 
            <span className="text-white font-bold">Setup takes 2 minutes</span> - your next event starts now.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-6 sm:space-y-0 sm:space-x-8 mb-12">
            <Button 
              onClick={startApp}
              size="lg"
              className="bg-white text-blue-700 hover:bg-gray-100 font-black px-12 py-6 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 text-xl border-0"
            >
              <Rocket className="w-6 h-6 mr-3" />
              Create Your Form Now
              <ArrowRight className="w-6 h-6 ml-3" />
            </Button>
            
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 text-blue-100 mb-2">
                <UserCheck className="w-6 h-6 text-green-300" />
                <span className="text-lg font-medium">100% Human Verified Leads</span>
              </div>
              <div className="flex items-center justify-center space-x-2 text-blue-100">
                <CheckCircle className="w-6 h-6 text-green-300" />
                <span className="text-lg font-medium">Perfect for conferences & events</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Simplified Footer */}
      <footer className="relative bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="text-2xl font-bold text-white">SwagForm</span>
            </div>
            <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
              The easiest way to collect <span className="text-white font-semibold">verified leads</span> at events. 
              <span className="text-white font-semibold">Secure, fast, and human-powered.</span>
            </p>
            
            <div className="flex items-center justify-center space-x-8 text-gray-300 text-lg mb-8">
              <span className="font-medium">© 2024 SwagForm</span>
              <span className="hidden md:inline">•</span>
              <span>Built for Event Organizers</span>
            </div>
            
            <div className="flex items-center justify-center space-x-6">
              <div className="flex items-center space-x-2 bg-green-900/50 backdrop-blur-sm rounded-full px-4 py-2 border border-green-500/30">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-300 font-semibold text-sm">Live on World Chain</span>
              </div>
              <span className="text-gray-400 text-sm font-mono">Chain ID: 4801</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage; 