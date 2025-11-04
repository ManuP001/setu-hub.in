import { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '@/App';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const EnterpriseProfile = ({ user, enterprise, setEnterprise }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    enterprise_type: ''
  });

  useEffect(() => {
    if (enterprise) {
      setFormData({
        name: enterprise.name || '',
        enterprise_type: enterprise.enterprise_type || ''
      });
    }
  }, [enterprise]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/enterprises`, formData);
      setEnterprise(response.data);
      
      // Update user with enterprise_id
      const currentUser = JSON.parse(localStorage.getItem('user'));
      currentUser.enterprise_id = response.data.id;
      localStorage.setItem('user', JSON.stringify(currentUser));
      
      toast.success('Enterprise profile created successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8" data-testid="enterprise-profile-page">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Enterprise Profile</h1>
          <p className="text-slate-600">{enterprise ? 'Manage your enterprise details' : 'Create your enterprise profile to get started'}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{enterprise ? 'Edit Profile' : 'Create Enterprise'}</CardTitle>
            <CardDescription>Provide details about your organization</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Enterprise Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Zepto Operations"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  data-testid="enterprise-name-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="enterprise_type">Enterprise Type *</Label>
                <Select 
                  value={formData.enterprise_type} 
                  onValueChange={(value) => setFormData({ ...formData, enterprise_type: value })}
                  required
                >
                  <SelectTrigger data-testid="enterprise-type-select">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="qcom">Quick Commerce</SelectItem>
                    <SelectItem value="ecomm">E-commerce</SelectItem>
                    <SelectItem value="3pl">3PL Logistics</SelectItem>
                    <SelectItem value="food_delivery">Food Delivery</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" disabled={loading || !!enterprise} className="w-full" data-testid="save-enterprise-btn">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  enterprise ? 'Profile Created' : 'Create Profile'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {enterprise && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>User Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-slate-600">Full Name</p>
                <p className="font-semibold">{user?.full_name}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Email</p>
                <p className="font-semibold">{user?.email}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Role</p>
                <p className="font-semibold">{user?.role || 'User'}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default EnterpriseProfile;
