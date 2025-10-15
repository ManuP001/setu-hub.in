import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Building2, Briefcase, Clock, Shield, TrendingUp, Star, ArrowRight, CheckCircle2, Zap, Award, BarChart3, MapPin, Percent, Activity } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const [jobRoles, setJobRoles] = useState([]);
  const [marketStats, setMarketStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const backendUrl = process.env.REACT_APP_BACKEND_URL;

  const handleGetStarted = () => {
    if (user) {
      if (user.user_type === 'enterprise') {
        navigate('/enterprise');
      } else if (user.user_type === 'vendor') {
        navigate('/vendor');
      } else if (user.user_type === 'job_seeker') {
        navigate('/job-seeker');
      }
    } else {
      navigate('/register');
    }
  };

  const features = [
    {
      icon: <Clock className="w-8 h-8" />,
      title: 'Get reliable staff in hours, not weeks',
      description: 'Connect with vetted workers instantly and fill urgent staffing needs'
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: 'AI-powered, human vetted',
      description: 'Smart matching technology combined with manual verification'
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: 'Staffing reinvented',
      description: 'Modern platform built for the logistics and quick commerce era'
    }
  ];

  const stats = [
    { value: '10,000+', label: 'Active Workers' },
    { value: '500+', label: 'Enterprise Clients' },
    { value: '98%', label: 'Fill Rate' },
    { value: '6hrs', label: 'Avg. Response Time' }
  ];

  const portalFeatures = [
    {
      type: 'Enterprise Portal',
      color: 'blue',
      icon: <Building2 className="w-6 h-6" />,
      features: [
        { icon: <Briefcase />, text: 'Post jobs at micro-market level' },
        { icon: <BarChart3 />, text: 'Real-time analytics dashboard' },
        { icon: <Users />, text: 'Bulk upload & management' },
        { icon: <Shield />, text: 'Role-based access control' }
      ]
    },
    {
      type: 'Vendor Portal',
      color: 'orange',
      icon: <Users className="w-6 h-6" />,
      features: [
        { icon: <Zap />, text: 'Instant job notifications' },
        { icon: <Star />, text: 'Performance tracking' },
        { icon: <Award />, text: 'Gamification & rewards' },
        { icon: <TrendingUp />, text: 'Earnings dashboard' }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-yellow-gradient rounded-xl flex items-center justify-center shadow-yellow">
              <span className="text-2xl font-black text-gray-900">S</span>
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900" data-testid="landing-logo">SetuHub</h1>
              <p className="text-xs text-gray-600">Staffing Reinvented</p>
            </div>
          </div>
          <div className="flex gap-3 items-center">
            <Button variant="ghost" onClick={() => navigate('/login')} data-testid="landing-login-btn" className="font-semibold">Log In</Button>
            <Button onClick={() => navigate('/register')} data-testid="landing-register-btn" className="bg-yellow-gradient hover:opacity-90 text-gray-900 font-bold shadow-yellow">Get Started</Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-yellow-50 via-white to-orange-50">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="max-w-7xl mx-auto px-6 py-24 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-fade-in">
              <h2 className="text-6xl lg:text-7xl font-black leading-tight" data-testid="hero-title">
                Connecting businesses with
                <span className="text-gradient block mt-2">get-the-job-done workers</span>
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed max-w-xl" data-testid="hero-subtitle">
                Human-vetted workforce marketplace for quick commerce, e-commerce, and logistics enterprises
              </p>
              <div className="flex gap-4">
                <Button size="lg" onClick={handleGetStarted} className="bg-yellow-gradient hover:opacity-90 text-gray-900 font-bold text-lg px-8 h-14 shadow-yellow" data-testid="hero-cta-btn">
                  Get Started <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button size="lg" variant="outline" className="font-semibold text-lg px-8 h-14 border-2">Learn More</Button>
              </div>
            </div>
            <div className="relative animate-scale-in">
              <div className="relative bg-white rounded-2xl shadow-2xl p-8 border-2 border-gray-100">
                <div className="absolute -top-6 -right-6 bg-gradient-to-br from-green-400 to-blue-500 w-24 h-24 rounded-full flex items-center justify-center shadow-lg">
                  <Award className="w-12 h-12 text-white" />
                </div>
                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-4 bg-green-50 rounded-xl border border-green-200">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">98% Fill Rate</p>
                      <p className="text-sm text-gray-600">Jobs filled successfully</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">&lt; 6 Hours</p>
                      <p className="text-sm text-gray-600">Average response time</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-orange-50 rounded-xl border border-orange-200">
                    <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">10,000+ Workers</p>
                      <p className="text-sm text-gray-600">Vetted and ready</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-black mb-4">Why Choose SetuHub?</h3>
            <p className="text-xl text-gray-600">Fast, reliable, and powered by technology</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <Card key={idx} className="p-8 hover-lift border-2 border-gray-100 bg-white" data-testid={`feature-card-${idx}`}>
                <div className="w-16 h-16 bg-yellow-gradient rounded-2xl flex items-center justify-center mb-6 shadow-yellow">
                  <div className="text-gray-900">{feature.icon}</div>
                </div>
                <h4 className="text-xl font-bold mb-3">{feature.title}</h4>
                <p className="text-gray-600">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Portal Features */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-black mb-4">Powerful Portals for Every User</h3>
            <p className="text-xl text-gray-600">Tailored experiences for enterprises and vendors</p>
          </div>
          <div className="grid lg:grid-cols-2 gap-8">
            {portalFeatures.map((portal, idx) => (
              <Card key={idx} className="p-8 border-2 border-gray-100 hover-lift" data-testid={`portal-card-${idx}`}>
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-14 h-14 bg-${portal.color}-500 rounded-xl flex items-center justify-center`}>
                    <div className="text-white">{portal.icon}</div>
                  </div>
                  <h4 className="text-2xl font-bold">{portal.type}</h4>
                </div>
                <div className="space-y-3">
                  {portal.features.map((feature, fidx) => (
                    <div key={fidx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-gray-200">
                        <div className="w-4 h-4 text-gray-700">{feature.icon}</div>
                      </div>
                      <span className="font-medium text-gray-700">{feature.text}</span>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 bg-gradient-to-br from-yellow-400 via-yellow-300 to-orange-300">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, idx) => (
              <div key={idx} className="text-center" data-testid={`stat-${idx}`}>
                <div className="text-5xl font-black text-gray-900 mb-2">{stat.value}</div>
                <div className="text-lg font-semibold text-gray-800">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gray-900">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h3 className="text-4xl font-black text-white mb-4" data-testid="cta-title">Ready to Transform Your Staffing?</h3>
          <p className="text-xl text-gray-300 mb-8">Join hundreds of enterprises already using SetuHub</p>
          <Button size="lg" onClick={() => navigate('/register')} className="bg-yellow-gradient hover:opacity-90 text-gray-900 font-bold text-lg px-12 h-14 shadow-yellow" data-testid="cta-register-btn">
            Get Started Free <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-gradient rounded-lg flex items-center justify-center">
                <span className="text-xl font-black text-gray-900">S</span>
              </div>
              <span className="text-xl font-black text-white">SetuHub</span>
            </div>
            <p className="text-gray-400">&copy; 2025 SetuHub. Staffing reinvented.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
