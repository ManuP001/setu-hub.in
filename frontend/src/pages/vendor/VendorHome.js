import { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '@/App';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, CheckCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const VendorHome = ({ vendor }) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (vendor?.id) {
      fetchDashboardData();
    }
  }, [vendor]);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get(`${API}/dashboard/vendor/${vendor.id}`);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };

  if (!vendor) {
    return (
      <div className="p-8" data-testid="vendor-setup-required">
        <Card className="mb-6 bg-yellow-50 border-yellow-200">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Complete Your Vendor Profile</h2>
            <p className="text-slate-700 mb-6">Create your vendor profile to commit to jobs and track your performance</p>
            <Button onClick={() => navigate('/vendor/profile')} size="lg" className="bg-yellow-600 hover:bg-yellow-700" data-testid="setup-profile-btn">Setup Profile Now</Button>
          </CardContent>
        </Card>
        
        {/* Quick Actions - Allow browsing jobs even without profile */}
        <Card data-testid="quick-actions-card">
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-slate-600">You can browse available jobs right now. To commit to jobs, you'll need to complete your vendor profile.</p>
              <Button onClick={() => navigate('/vendor/jobs')} className="w-full" size="lg" data-testid="browse-jobs-btn">
                <Briefcase className="w-5 h-5 mr-2" />
                Browse Available Jobs
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statCards = [
    { title: 'Total Commitments', value: stats?.total_commitments || 0, icon: <Briefcase className="w-8 h-8" />, color: 'blue' },
    { title: 'Active', value: stats?.active_commitments || 0, icon: <Clock className="w-8 h-8" />, color: 'orange' },
    { title: 'Fulfilled', value: stats?.fulfilled_commitments || 0, icon: <CheckCircle className="w-8 h-8" />, color: 'green' },
  ];

  return (
    <div className="p-8" data-testid="vendor-home">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {vendor.name}!</h1>
        <p className="text-slate-600">Here's an overview of your commitments</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {statCards.map((stat, idx) => (
          <Card key={idx} className="hover:shadow-lg transition-shadow" data-testid={`stat-card-${idx}`}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 bg-${stat.color}-100 text-${stat.color}-600 rounded-lg`}>
                  {stat.icon}
                </div>
                <span className="text-3xl font-bold">{stat.value}</span>
              </div>
              <p className="text-slate-600 font-medium">{stat.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card data-testid="quick-actions-card">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button onClick={() => navigate('/vendor/jobs')} className="h-auto py-6" data-testid="browse-jobs-btn">
              <Briefcase className="w-5 h-5 mr-2" />
              Browse Available Jobs
            </Button>
            <Button variant="outline" onClick={() => navigate('/vendor/commitments')} className="h-auto py-6" data-testid="view-commitments-btn">
              <CheckCircle className="w-5 h-5 mr-2" />
              View My Commitments
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Operating Areas */}
      <Card className="mt-6" data-testid="operating-areas-card">
        <CardHeader>
          <CardTitle>Your Operating Areas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-600 mb-2">States</p>
              <div className="flex flex-wrap gap-2">
                {vendor.operating_states.map((state, idx) => (
                  <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                    {state}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-2">Cities</p>
              <div className="flex flex-wrap gap-2">
                {vendor.operating_cities.map((city, idx) => (
                  <span key={idx} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                    {city}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-2">Services Offered</p>
              <div className="flex flex-wrap gap-2">
                {vendor.services_offered.map((service, idx) => (
                  <span key={idx} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm capitalize">
                    {service.replace('_', ' ')}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorHome;
