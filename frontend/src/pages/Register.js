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

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [userType, setUserType] = useState('enterprise');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    phone: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/register`, {
        ...formData,
        user_type: userType === 'worker' ? 'job_seeker' : userType
      });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      toast.success('Registration successful!');
      
      const actualUserType = response.data.user.user_type;
      if (actualUserType === 'enterprise') {
        navigate('/enterprise');
      } else if (actualUserType === 'vendor') {
        navigate('/vendor');
      } else if (actualUserType === 'job_seeker') {
        navigate('/job-seeker');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const userTypes = [
    { value: 'enterprise', label: 'Enterprise', icon: <Building2 className="w-4 h-4" />, desc: 'For businesses hiring workers' },
    { value: 'vendor', label: 'Vendor', icon: <Users className="w-4 h-4" />, desc: 'For manpower suppliers' },
    { value: 'worker', label: 'Worker', icon: <Briefcase className="w-4 h-4" />, desc: 'For job seekers' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-orange-50 flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl shadow-2xl border-2" data-testid="register-card">
        <CardHeader className="text-center pb-8 pt-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-yellow-gradient rounded-2xl flex items-center justify-center shadow-yellow">
              <span className="text-3xl font-black text-gray-900">W</span>
            </div>
          </div>
          <CardTitle className="text-3xl font-black" data-testid="register-title">Create Account</CardTitle>
          <CardDescription className="text-base" data-testid="register-description">Join SetuHub marketplace today</CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <Tabs value={userType} onValueChange={setUserType} className="mb-6">
            <TabsList className="grid w-full grid-cols-3 h-auto p-1 bg-gray-100">
              {userTypes.map(type => (
                <TabsTrigger 
                  key={type.value} 
                  value={type.value}
                  className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-yellow-gradient data-[state=active]:text-gray-900 data-[state=active]:shadow-md"
                  data-testid={`tab-${type.value}`}
                >
                  {type.icon}
                  <span className="font-bold text-xs">{type.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name" className="font-semibold">Full Name</Label>
                <Input
                  id="full_name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                  className="h-11 border-2"
                  data-testid="register-fullname-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username" className="font-semibold">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="johndoe"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                  className="h-11 border-2"
                  data-testid="register-username-input"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="font-semibold">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="h-11 border-2"
                  data-testid="register-email-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="font-semibold">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+91 9876543210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="h-11 border-2"
                  data-testid="register-phone-input"
                />
              </div>
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
                className="h-11 border-2"
                data-testid="register-password-input"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 bg-yellow-gradient hover:opacity-90 text-gray-900 font-bold text-base shadow-yellow mt-6" 
              disabled={loading} 
              data-testid="register-submit-btn"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <span className="text-gray-600">Already have an account? </span>
            <Button variant="link" className="p-0 h-auto font-bold text-yellow-600 hover:text-yellow-700" onClick={() => navigate('/login')} data-testid="register-login-link">
              Sign in →
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
