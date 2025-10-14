import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { API } from '@/App';
import { Button } from '@/components/ui/button';
import { Building2, LayoutDashboard, Briefcase, MapPin, Plus, LogOut, Menu, X } from 'lucide-react';
import { toast } from 'sonner';

// Sub-pages
import EnterpriseHome from '@/pages/enterprise/EnterpriseHome';
import EnterpriseProfile from '@/pages/enterprise/EnterpriseProfile';
import ManageGUs from '@/pages/enterprise/ManageGUs';
import ManageJobs from '@/pages/enterprise/ManageJobs';
import CreateJob from '@/pages/enterprise/CreateJob';
import BulkUpload from '@/pages/enterprise/BulkUpload';

const EnterpriseDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [enterprise, setEnterprise] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    setUser(userData);
    
    if (userData?.enterprise_id) {
      fetchEnterprise(userData.enterprise_id);
    }
  }, []);

  const fetchEnterprise = async (enterpriseId) => {
    try {
      const response = await axios.get(`${API}/enterprises/${enterpriseId}`);
      setEnterprise(response.data);
    } catch (error) {
      console.error('Failed to fetch enterprise:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const menuItems = [
    { path: '/', icon: <Building2 className="w-5 h-5" />, label: 'Home', external: true },
    { path: '/enterprise', icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard' },
    { path: '/enterprise/jobs', icon: <Briefcase className="w-5 h-5" />, label: 'Jobs' },
    { path: '/enterprise/gus', icon: <MapPin className="w-5 h-5" />, label: 'Facilities' },
    { path: '/enterprise/bulk-upload', icon: <Plus className="w-5 h-5" />, label: 'Bulk Upload' },
    { path: '/enterprise/profile', icon: <Building2 className="w-5 h-5" />, label: 'Profile' },
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg"
        data-testid="mobile-menu-toggle"
      >
        {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40
        w-64 bg-white border-r border-slate-200 
        transform transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `} data-testid="enterprise-sidebar">
        <div className="p-6 border-b">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-green-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg">SetuHub</h2>
              <p className="text-xs text-slate-500">Enterprise Portal</p>
            </div>
          </div>
          {enterprise && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-xs text-blue-600 font-medium">Current Enterprise</p>
              <p className="font-semibold text-sm truncate">{enterprise.name}</p>
              <p className="text-xs text-slate-600">Tier {enterprise.tier}</p>
            </div>
          )}
        </div>

        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setSidebarOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-lg
                  transition-all duration-200
                  ${isActive 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-slate-700 hover:bg-slate-100'
                  }
                `}
                data-testid={`nav-${item.label.toLowerCase()}`}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <div className="mb-3 px-2">
            <p className="text-xs text-slate-500">Logged in as</p>
            <p className="font-semibold text-sm truncate">{user?.full_name}</p>
            <p className="text-xs text-slate-600">{user?.role || 'User'}</p>
          </div>
          <Button variant="outline" className="w-full" onClick={handleLogout} data-testid="logout-btn">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Routes>
          <Route index element={<EnterpriseHome enterprise={enterprise} />} />
          <Route path="profile" element={<EnterpriseProfile user={user} enterprise={enterprise} setEnterprise={setEnterprise} />} />
          <Route path="gus" element={<ManageGUs enterprise={enterprise} />} />
          <Route path="jobs" element={<ManageJobs enterprise={enterprise} />} />
          <Route path="jobs/create" element={<CreateJob enterprise={enterprise} />} />
          <Route path="bulk-upload" element={<BulkUpload enterprise={enterprise} />} />
        </Routes>
      </main>
    </div>
  );
};

export default EnterpriseDashboard;
