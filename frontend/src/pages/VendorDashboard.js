import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { API } from '@/App';
import { Button } from '@/components/ui/button';
import { Users, LayoutDashboard, Briefcase, User, LogOut, Menu, X, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

// Sub-pages
import VendorHome from '@/pages/vendor/VendorHome';
import VendorProfile from '@/pages/vendor/VendorProfile';
import AvailableJobs from '@/pages/vendor/AvailableJobs';
import MyCommitments from '@/pages/vendor/MyCommitments';

const VendorDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    setUser(userData);
    
    if (userData?.vendor_id) {
      fetchVendor(userData.vendor_id);
    }
  }, []);

  const fetchVendor = async (vendorId) => {
    try {
      const response = await axios.get(`${API}/vendors/${vendorId}`);
      setVendor(response.data);
    } catch (error) {
      console.error('Failed to fetch vendor:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const menuItems = [
    { path: '/vendor', icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard' },
    { path: '/vendor/jobs', icon: <Briefcase className="w-5 h-5" />, label: 'Available Jobs' },
    { path: '/vendor/commitments', icon: <CheckCircle className="w-5 h-5" />, label: 'My Commitments' },
    { path: '/vendor/profile', icon: <User className="w-5 h-5" />, label: 'Profile' },
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
      `} data-testid="vendor-sidebar">
        <div className="p-6 border-b">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-blue-600 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg">SetuHub</h2>
              <p className="text-xs text-slate-500">Vendor Portal</p>
            </div>
          </div>
          {vendor && (
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-xs text-green-600 font-medium">Vendor</p>
              <p className="font-semibold text-sm truncate">{vendor.name}</p>
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
                    ? 'bg-green-600 text-white shadow-md' 
                    : 'text-slate-700 hover:bg-slate-100'
                  }
                `}
                data-testid={`nav-${item.label.toLowerCase().replace(/\s/g, '-')}`}
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
          <Route index element={<VendorHome vendor={vendor} />} />
          <Route path="profile" element={<VendorProfile user={user} vendor={vendor} setVendor={setVendor} />} />
          <Route path="jobs" element={<AvailableJobs vendor={vendor} />} />
          <Route path="commitments" element={<MyCommitments vendor={vendor} />} />
        </Routes>
      </main>
    </div>
  );
};

export default VendorDashboard;
