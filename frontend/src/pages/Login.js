import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '@/App';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Building2, Users, Briefcase, Loader2 } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [userType, setUserType] = useState('enterprise');
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/login`, formData);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      toast.success('Login successful!');
      
      const actualUserType = response.data.user.user_type;
      if (actualUserType === 'enterprise') {
        navigate('/enterprise');
      } else if (actualUserType === 'vendor') {
        navigate('/vendor');
      } else if (actualUserType === 'job_seeker') {
        navigate('/job-seeker');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const userTypes = [
    { value: 'enterprise', label: 'Enterprise', icon: <Building2 className="w-4 h-4" />, desc: 'For businesses' },
    { value: 'vendor', label: 'Vendor', icon: <Users className="w-4 h-4" />, desc: 'For suppliers' },
    { value: 'worker', label: 'Worker', icon: <Briefcase className="w-4 h-4" />, desc: 'For job seekers' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-orange-50 flex items-center justify-center p-6">
      <Button 
        variant="ghost" 
        onClick={() => navigate('/')} 
        className="absolute top-6 left-6 font-semibold"
        data-testid="back-to-home-btn"
      >
        ← Back to Home
      </Button>
      <Card className="w-full max-w-2xl shadow-2xl border-2" data-testid="login-card">
        <CardHeader className="text-center pb-8 pt-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-yellow-gradient rounded-2xl flex items-center justify-center shadow-yellow">
              <span className="text-3xl font-black text-gray-900">S</span>
            </div>
          </div>
          <CardTitle className="text-3xl font-black" data-testid="login-title">Welcome Back</CardTitle>
          <CardDescription className="text-base" data-testid="login-description">Log in to your SetuHub account</CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-8">

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="font-semibold">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="h-12 border-2"
                data-testid="login-email-input"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="font-semibold">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className="h-12 border-2"
                data-testid="login-password-input"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 bg-yellow-gradient hover:opacity-90 text-gray-900 font-bold text-base shadow-yellow" 
              disabled={loading} 
              data-testid="login-submit-btn"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <span className="text-gray-600">Don't have an account? </span>
            <Button variant="link" className="p-0 h-auto font-bold text-yellow-600 hover:text-yellow-700" onClick={() => navigate('/register')} data-testid="login-register-link">
              Create one →
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
