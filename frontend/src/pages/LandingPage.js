import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Building2, Users, Briefcase, ArrowRight, CheckCircle2 } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');

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
      navigate('/login');
    }
  };

  const personas = [
    {
      icon: <Building2 className="w-12 h-12" />,
      title: 'Enterprises',
      description: 'Quick commerce, e-commerce, and 3PL companies managing workforce needs across multiple locations',
      features: ['Multi-location job posting', 'Real-time vendor matching', 'Analytics dashboard', 'Bulk upload']
    },
    {
      icon: <Users className="w-12 h-12" />,
      title: 'Vendors',
      description: 'Manpower suppliers connecting with enterprises to fulfill workforce requirements',
      features: ['Access to verified opportunities', 'Area-based job filtering', 'Quick commitment process', 'Performance tracking']
    },
    {
      icon: <Briefcase className="w-12 h-12" />,
      title: 'Job Seekers',
      description: 'Individuals looking for opportunities in logistics, quick commerce, and e-commerce sectors',
      features: ['Browse open positions', 'Apply directly', 'Track applications', 'Career growth']
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-green-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent" data-testid="landing-logo">SetuHub</h1>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => navigate('/login')} data-testid="landing-login-btn">Login</Button>
            <Button onClick={() => navigate('/register')} data-testid="landing-register-btn">Get Started</Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center max-w-4xl mx-auto animate-fade-in">
          <h2 className="text-5xl lg:text-6xl font-bold mb-6 leading-tight" data-testid="hero-title">
            Connect Talent with
            <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent"> Opportunity</span>
          </h2>
          <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto" data-testid="hero-subtitle">
            The marketplace connecting enterprises, vendors, and job seekers in the logistics and quick commerce ecosystem
          </p>
          <Button size="lg" onClick={handleGetStarted} className="text-lg px-8 py-6 h-auto" data-testid="hero-cta-btn">
            Get Started <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Personas Section */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <h3 className="text-3xl font-bold text-center mb-12" data-testid="personas-title">Built for Three Unique Personas</h3>
        <div className="grid md:grid-cols-3 gap-8">
          {personas.map((persona, idx) => (
            <Card key={idx} className="p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 border-transparent hover:border-blue-200" data-testid={`persona-card-${idx}`}>
              <div className="text-blue-600 mb-4">{persona.icon}</div>
              <h4 className="text-xl font-bold mb-3">{persona.title}</h4>
              <p className="text-slate-600 mb-6">{persona.description}</p>
              <ul className="space-y-2">
                {persona.features.map((feature, fidx) => (
                  <li key={fidx} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-green-600 py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h3 className="text-3xl font-bold text-white mb-4" data-testid="cta-title">Ready to Transform Your Workforce Management?</h3>
          <p className="text-blue-100 mb-8 text-lg">Join thousands of enterprises, vendors, and job seekers already on SetuHub</p>
          <Button size="lg" variant="secondary" onClick={() => navigate('/register')} className="text-lg px-8 py-6 h-auto" data-testid="cta-register-btn">
            Create Your Account
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p>&copy; 2025 SetuHub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
