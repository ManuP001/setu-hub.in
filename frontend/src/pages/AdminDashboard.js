import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '@/App';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Briefcase, Users, Building2, CheckCircle, Clock, MapPin, 
  TrendingUp, FileText, LogOut, ArrowLeft 
} from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get(`${API}/admin/dashboard`);
      setDashboardData(response.data);
    } catch (error) {
      console.error('Failed to fetch admin dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600">Loading dashboard...</p>
      </div>
    );
  }

  const stats = dashboardData?.overview || {};

  const statCards = [
    { title: 'Total Jobs', value: stats.total_jobs, icon: <Briefcase className="w-6 h-6" />, color: 'blue' },
    { title: 'Open Jobs', value: stats.open_jobs, icon: <Clock className="w-6 h-6" />, color: 'orange' },
    { title: 'Committed', value: stats.committed_jobs, icon: <CheckCircle className="w-6 h-6" />, color: 'green' },
    { title: 'Fulfilled', value: stats.fulfilled_jobs, icon: <CheckCircle className="w-6 h-6" />, color: 'purple' },
    { title: 'Enterprises', value: stats.total_enterprises, icon: <Building2 className="w-6 h-6" />, color: 'indigo' },
    { title: 'Vendors', value: stats.total_vendors, icon: <Users className="w-6 h-6" />, color: 'pink' },
    { title: 'Workers', value: stats.total_workers, icon: <Users className="w-6 h-6" />, color: 'teal' },
    { title: 'Applications', value: stats.total_applications, icon: <FileText className="w-6 h-6" />, color: 'yellow' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/')} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
            <div className="h-8 w-px bg-slate-300"></div>
            <div>
              <h1 className="text-2xl font-black text-gray-900">SetuHub Admin</h1>
              <p className="text-xs text-gray-600">System Overview Dashboard</p>
            </div>
          </div>
          <Button variant="ghost" onClick={handleLogout} className="gap-2">
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Overview Stats */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">System Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((stat, idx) => (
              <Card key={idx} className="hover:shadow-lg transition-shadow">
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
        </div>

        {/* Location Coverage */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Geographic Coverage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center p-6 bg-blue-50 rounded-lg">
                  <div className="text-4xl font-black text-blue-600 mb-2">{stats.states_covered}</div>
                  <p className="text-sm text-slate-600 font-semibold">States Covered</p>
                </div>
                <div className="text-center p-6 bg-green-50 rounded-lg">
                  <div className="text-4xl font-black text-green-600 mb-2">{stats.cities_covered}</div>
                  <p className="text-sm text-slate-600 font-semibold">Cities Covered</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Recent Jobs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Recent Jobs ({dashboardData?.recent_jobs?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboardData?.recent_jobs?.slice(0, 5).map((job, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-semibold capitalize text-sm">{job.role}</p>
                      <p className="text-xs text-slate-600">{job.quantity_required} positions</p>
                    </div>
                    <Badge variant="secondary" className={
                      job.status === 'open' ? 'bg-green-100 text-green-800' : 
                      job.status === 'vendor_committed' ? 'bg-blue-100 text-blue-800' : 
                      'bg-purple-100 text-purple-800'
                    }>
                      {job.status}
                    </Badge>
                  </div>
                ))}
                {(!dashboardData?.recent_jobs || dashboardData.recent_jobs.length === 0) && (
                  <p className="text-sm text-slate-500 text-center py-4">No recent jobs</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Commitments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Recent Commitments ({dashboardData?.recent_commitments?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboardData?.recent_commitments?.slice(0, 5).map((commitment, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{commitment.poc_name}</p>
                      <p className="text-xs text-slate-600">{commitment.poc_contact}</p>
                    </div>
                    <Badge variant="secondary" className={
                      commitment.status === 'committed' ? 'bg-orange-100 text-orange-800' : 
                      'bg-green-100 text-green-800'
                    }>
                      {commitment.status}
                    </Badge>
                  </div>
                ))}
                {(!dashboardData?.recent_commitments || dashboardData.recent_commitments.length === 0) && (
                  <p className="text-sm text-slate-500 text-center py-4">No recent commitments</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Metrics */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-black text-green-600 mb-1">
                  {stats.total_jobs > 0 ? Math.round((stats.committed_jobs / stats.total_jobs) * 100) : 0}%
                </div>
                <p className="text-xs text-slate-600 font-semibold">Commitment Rate</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-black text-blue-600 mb-1">
                  {stats.total_jobs > 0 ? Math.round((stats.fulfilled_jobs / stats.total_jobs) * 100) : 0}%
                </div>
                <p className="text-xs text-slate-600 font-semibold">Fulfillment Rate</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-black text-purple-600 mb-1">
                  {stats.total_jobs > 0 ? Math.round((stats.open_jobs / stats.total_jobs) * 100) : 0}%
                </div>
                <p className="text-xs text-slate-600 font-semibold">Open Jobs</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminDashboard;
