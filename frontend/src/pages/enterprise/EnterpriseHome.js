import { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '@/App';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, CheckCircle, Clock, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const EnterpriseHome = ({ enterprise }) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentJobs, setRecentJobs] = useState([]);

  useEffect(() => {
    if (enterprise?.id) {
      fetchDashboardData();
    }
  }, [enterprise]);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, jobsRes] = await Promise.all([
        axios.get(`${API}/dashboard/enterprise/${enterprise.id}`),
        axios.get(`${API}/jobs?enterprise_id=${enterprise.id}`)
      ]);
      setStats(statsRes.data);
      setRecentJobs(jobsRes.data.slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };

  if (!enterprise) {
    return (
      <div className="p-8" data-testid="enterprise-setup-required">
        <Card>
          <CardContent className="p-12 text-center">
            <h2 className="text-2xl font-bold mb-4">Complete Your Setup</h2>
            <p className="text-slate-600 mb-6">Please create your enterprise profile to get started</p>
            <Button onClick={() => navigate('/enterprise/profile')} data-testid="setup-profile-btn">Setup Profile</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statCards = [
    { title: 'Total Jobs', value: stats?.total_jobs || 0, icon: <Briefcase className="w-8 h-8" />, color: 'blue' },
    { title: 'Open Jobs', value: stats?.open_jobs || 0, icon: <Clock className="w-8 h-8" />, color: 'orange' },
    { title: 'Committed', value: stats?.committed_jobs || 0, icon: <CheckCircle className="w-8 h-8" />, color: 'green' },
    { title: 'Facilities', value: stats?.total_facilities || 0, icon: <MapPin className="w-8 h-8" />, color: 'purple' },
  ];

  return (
    <div className="p-8" data-testid="enterprise-home">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome back!</h1>
        <p className="text-slate-600">Here's an overview of your workforce management</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

      {/* Recent Jobs */}
      <Card data-testid="recent-jobs-card">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Recent Job Postings</CardTitle>
            <Button variant="outline" onClick={() => navigate('/enterprise/jobs')} data-testid="view-all-jobs-btn">View All</Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentJobs.length === 0 ? (
            <div className="text-center py-8" data-testid="no-jobs-message">
              <p className="text-slate-500">No jobs posted yet</p>
              <Button className="mt-4" onClick={() => navigate('/enterprise/jobs/create')} data-testid="create-first-job-btn">Create Your First Job</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentJobs.map((job, idx) => (
                <div key={job.id} className="flex justify-between items-center p-4 border rounded-lg hover:bg-slate-50 transition-colors" data-testid={`job-item-${idx}`}>
                  <div>
                    <h4 className="font-semibold">{job.role}</h4>
                    <p className="text-sm text-slate-600">Quantity: {job.quantity_required}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      job.status === 'open' ? 'bg-orange-100 text-orange-700' :
                      job.status === 'vendor_committed' ? 'bg-green-100 text-green-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {job.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EnterpriseHome;
