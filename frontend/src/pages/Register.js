import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '@/App';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Building2, Users, Briefcase, Loader2 } from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [userType, setUserType] = useState('enterprise');
  const [enterpriseList, setEnterpriseList] = useState([]);
  
  // Enterprise form
  const [enterpriseForm, setEnterpriseForm] = useState({
    enterprise_name: '',
    email: '',
    phone: '',
    password: '',
    full_name: ''
  });

  // Vendor form
  const [vendorForm, setVendorForm] = useState({
    vendor_name: '',
    email: '',
    phone: '',
    password: '',
    full_name: ''
  });

  // Worker form
  const [workerForm, setWorkerForm] = useState({
    full_name: '',
    phone: ''
  });

  useEffect(() => {
    fetchEnterpriseList();
  }, []);

  const fetchEnterpriseList = async () => {
    try {
      const response = await axios.get(`${API}/enterprise-list`);
      setEnterpriseList(response.data.enterprises);
    } catch (error) {
      console.error('Failed to fetch enterprise list:', error);
    }
  };

  const userTypes = [
    { value: 'enterprise', label: 'Enterprise', icon: <Building2 className="w-4 h-4" />, desc: 'For businesses hiring workers' },
    { value: 'vendor', label: 'Vendor', icon: <Users className="w-4 h-4" />, desc: 'For manpower suppliers' },
    { value: 'worker', label: 'Worker', icon: <Briefcase className="w-4 h-4" />, desc: 'For job seekers' }
  ];

  const validatePhone = (phone, isWorker = false) => {
    if (isWorker) {
      // Worker: Must be exactly 10 digits
      const digitsOnly = phone.replace(/\D/g, '');
      return digitsOnly.length === 10;
    }
    return phone.length > 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let requestData = {
      user_type: userType === 'worker' ? 'job_seeker' : userType
    };

    if (userType === 'enterprise') {
      if (!enterpriseForm.enterprise_name || !enterpriseForm.email || !enterpriseForm.phone || !enterpriseForm.password) {
        toast.error('Please fill all required fields');
        return;
      }
      requestData = {
        ...requestData,
        enterprise_name: enterpriseForm.enterprise_name,
        email: enterpriseForm.email,
        phone: enterpriseForm.phone,
        password: enterpriseForm.password,
        full_name: enterpriseForm.full_name || enterpriseForm.enterprise_name
      };
    } else if (userType === 'vendor') {
      if (!vendorForm.vendor_name || !vendorForm.email || !vendorForm.phone || !vendorForm.password) {
        toast.error('Please fill all required fields');
        return;
      }
      requestData = {
        ...requestData,
        vendor_name: vendorForm.vendor_name,
        email: vendorForm.email,
        phone: vendorForm.phone,
        password: vendorForm.password,
        full_name: vendorForm.full_name || vendorForm.vendor_name
      };
    } else if (userType === 'worker') {
      if (!workerForm.full_name || !workerForm.phone) {
        toast.error('Please fill all required fields');
        return;
      }
      if (!validatePhone(workerForm.phone, true)) {
        toast.error('Phone number must be exactly 10 digits');
        return;
      }
      requestData = {
        ...requestData,
        full_name: workerForm.full_name,
        phone: '+91' + workerForm.phone.replace(/\D/g, '')
      };
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/register`, requestData);
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
      <Card className="w-full max-w-2xl shadow-2xl border-2" data-testid="register-card">
        <CardHeader className="text-center pb-8 pt-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-yellow-gradient rounded-2xl flex items-center justify-center shadow-yellow">
              <span className="text-3xl font-black text-gray-900">S</span>
            </div>
          </div>
          <CardTitle className="text-3xl font-black" data-testid="register-title">Create Account</CardTitle>
          <CardDescription className="text-base" data-testid="register-description">
            Join SetuHub marketplace as {userType === 'enterprise' ? 'an Enterprise' : userType === 'vendor' ? 'a Vendor' : 'a Worker'}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <div className="mb-6">
            <Label className="text-sm font-semibold mb-3 block">I am registering as:</Label>
            <Tabs value={userType} onValueChange={setUserType}>
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
            <div className="mt-2 text-center">
              <p className="text-xs text-gray-600">{userTypes.find(t => t.value === userType)?.desc}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* ENTERPRISE FORM */}
            {userType === 'enterprise' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="enterprise_name" className="font-semibold">Enterprise Name *</Label>
                  <Select 
                    value={enterpriseForm.enterprise_name} 
                    onValueChange={(value) => setEnterpriseForm({ ...enterpriseForm, enterprise_name: value })}
                    required
                  >
                    <SelectTrigger data-testid="enterprise-name-select">
                      <SelectValue placeholder="Select your enterprise" />
                    </SelectTrigger>
                    <SelectContent>
                      {enterpriseList.map((ent) => (
                        <SelectItem key={ent} value={ent}>{ent}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ent_email" className="font-semibold">Email *</Label>
                  <Input
                    id="ent_email"
                    type="email"
                    placeholder="you@company.com"
                    value={enterpriseForm.email}
                    onChange={(e) => setEnterpriseForm({ ...enterpriseForm, email: e.target.value })}
                    required
                    className="h-11 border-2"
                    data-testid="enterprise-email-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ent_phone" className="font-semibold">Phone Number *</Label>
                  <div className="flex gap-2">
                    <div className="w-20">
                      <Input
                        value="+91"
                        disabled
                        className="h-11 border-2 bg-gray-100 text-center font-semibold"
                      />
                    </div>
                    <Input
                      id="ent_phone"
                      type="tel"
                      placeholder="9876543210"
                      maxLength="10"
                      value={enterpriseForm.phone}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        setEnterpriseForm({ ...enterpriseForm, phone: value });
                      }}
                      required
                      className="h-11 border-2"
                      data-testid="enterprise-phone-input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ent_password" className="font-semibold">Password *</Label>
                  <Input
                    id="ent_password"
                    type="password"
                    placeholder="••••••••"
                    value={enterpriseForm.password}
                    onChange={(e) => setEnterpriseForm({ ...enterpriseForm, password: e.target.value })}
                    required
                    className="h-11 border-2"
                    data-testid="enterprise-password-input"
                  />
                </div>
              </>
            )}

            {/* VENDOR FORM */}
            {userType === 'vendor' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="vendor_name" className="font-semibold">Vendor Name *</Label>
                  <Input
                    id="vendor_name"
                    type="text"
                    placeholder="ABC Manpower Solutions"
                    value={vendorForm.vendor_name}
                    onChange={(e) => setVendorForm({ ...vendorForm, vendor_name: e.target.value })}
                    required
                    className="h-11 border-2"
                    data-testid="vendor-name-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ven_email" className="font-semibold">Email *</Label>
                  <Input
                    id="ven_email"
                    type="email"
                    placeholder="you@vendorcompany.com"
                    value={vendorForm.email}
                    onChange={(e) => setVendorForm({ ...vendorForm, email: e.target.value })}
                    required
                    className="h-11 border-2"
                    data-testid="vendor-email-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ven_phone" className="font-semibold">Phone Number *</Label>
                  <div className="flex gap-2">
                    <div className="w-20">
                      <Input
                        value="+91"
                        disabled
                        className="h-11 border-2 bg-gray-100 text-center font-semibold"
                      />
                    </div>
                    <Input
                      id="ven_phone"
                      type="tel"
                      placeholder="9876543210"
                      maxLength="10"
                      value={vendorForm.phone}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        setVendorForm({ ...vendorForm, phone: value });
                      }}
                      required
                      className="h-11 border-2"
                      data-testid="vendor-phone-input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ven_password" className="font-semibold">Password *</Label>
                  <Input
                    id="ven_password"
                    type="password"
                    placeholder="••••••••"
                    value={vendorForm.password}
                    onChange={(e) => setVendorForm({ ...vendorForm, password: e.target.value })}
                    required
                    className="h-11 border-2"
                    data-testid="vendor-password-input"
                  />
                </div>
              </>
            )}

            {/* WORKER FORM */}
            {userType === 'worker' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="worker_name" className="font-semibold">Full Name *</Label>
                  <Input
                    id="worker_name"
                    type="text"
                    placeholder="Rahul Kumar"
                    value={workerForm.full_name}
                    onChange={(e) => setWorkerForm({ ...workerForm, full_name: e.target.value })}
                    required
                    className="h-11 border-2"
                    data-testid="worker-name-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="worker_phone" className="font-semibold">Phone Number *</Label>
                  <div className="flex gap-2">
                    <div className="w-20">
                      <Input
                        value="+91"
                        disabled
                        className="h-11 border-2 bg-gray-100 text-center font-semibold"
                      />
                    </div>
                    <Input
                      id="worker_phone"
                      type="tel"
                      placeholder="9876543210"
                      maxLength="10"
                      value={workerForm.phone}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        setWorkerForm({ ...workerForm, phone: value });
                      }}
                      required
                      className="h-11 border-2 flex-1"
                      data-testid="worker-phone-input"
                    />
                  </div>
                  <p className="text-xs text-gray-600">Enter 10-digit mobile number</p>
                </div>
              </>
            )}

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
