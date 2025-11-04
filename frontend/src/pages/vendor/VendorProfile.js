import { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '@/App';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Plus, X } from 'lucide-react';

const VendorProfile = ({ user, vendor, setVendor }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    gst_no: '',
    email: '',
    phone: '',
    operating_states: [],
    operating_cities: [],
    operating_pin_codes: [], // Kept for backward compatibility but not shown in UI
    services_offered: []
  });
  const [newState, setNewState] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newService, setNewService] = useState('');

  useEffect(() => {
    if (vendor) {
      setFormData({
        name: vendor.name || '',
        gst_no: vendor.gst_no || '',
        email: vendor.email || '',
        phone: vendor.phone || '',
        operating_states: vendor.operating_states || [],
        operating_cities: vendor.operating_cities || [],
        operating_pin_codes: vendor.operating_pin_codes || [],
        services_offered: vendor.services_offered || []
      });
    } else if (user) {
      setFormData(prev => ({
        ...prev,
        email: user.email,
        phone: user.phone || ''
      }));
    }
  }, [vendor, user]);

  const addItem = (field, value, setter) => {
    if (value.trim() && !formData[field].includes(value.trim())) {
      setFormData({ ...formData, [field]: [...formData[field], value.trim()] });
      setter('');
    }
  };

  const removeItem = (field, index) => {
    setFormData({
      ...formData,
      [field]: formData[field].filter((_, i) => i !== index)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/vendors`, formData);
      setVendor(response.data);
      
      // Update user with vendor_id
      const currentUser = JSON.parse(localStorage.getItem('user'));
      currentUser.vendor_id = response.data.id;
      localStorage.setItem('user', JSON.stringify(currentUser));
      
      toast.success('Vendor profile created successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create profile');
    } finally {
      setLoading(false);
    }
  };

  const serviceOptions = [
    'Last Mile Bike Captain',
    'Last Mile Van Captain',
    'Fulfillment Center Picker',
    'Fulfillment Center Loader',
    'Warehouse Associate',
    'Sort Center Coordinator',
    'Store Operations Executive',
    'Quality Control Inspector'
  ];

  return (
    <div className="p-8" data-testid="vendor-profile-page">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Vendor Profile</h1>
          <p className="text-slate-600">{vendor ? 'Manage your vendor details' : 'Create your vendor profile to start receiving job opportunities'}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{vendor ? 'Profile Details' : 'Create Vendor Profile'}</CardTitle>
            <CardDescription>Provide details about your manpower services</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Company Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., ABC Manpower Solutions"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    disabled={!!vendor}
                    data-testid="vendor-name-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gst_no">GST Number (Optional)</Label>
                  <Input
                    id="gst_no"
                    placeholder="22AAAAA0000A1Z5"
                    value={formData.gst_no}
                    onChange={(e) => setFormData({ ...formData, gst_no: e.target.value })}
                    disabled={!!vendor}
                    data-testid="gst-input"
                  />
                  <p className="text-xs text-slate-500">Required only if annual turnover exceeds ₹40 Lakhs</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    disabled={!!vendor}
                    data-testid="email-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+91 9876543210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                    disabled={!!vendor}
                    data-testid="phone-input"
                  />
                </div>
              </div>

              {/* Operating States */}
              <div className="space-y-2">
                <Label>Operating States *</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add state"
                    value={newState}
                    onChange={(e) => setNewState(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('operating_states', newState, setNewState))}
                    disabled={!!vendor}
                    data-testid="state-input"
                  />
                  <Button type="button" onClick={() => addItem('operating_states', newState, setNewState)} disabled={!!vendor} data-testid="add-state-btn">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.operating_states.map((state, idx) => (
                    <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-2">
                      {state}
                      {!vendor && (
                        <button type="button" onClick={() => removeItem('operating_states', idx)}>
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              </div>

              {/* Operating Cities */}
              <div className="space-y-2">
                <Label>Operating Cities *</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add city"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('operating_cities', newCity, setNewCity))}
                    disabled={!!vendor}
                    data-testid="city-input"
                  />
                  <Button type="button" onClick={() => addItem('operating_cities', newCity, setNewCity)} disabled={!!vendor} data-testid="add-city-btn">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.operating_cities.map((city, idx) => (
                    <span key={idx} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm flex items-center gap-2">
                      {city}
                      {!vendor && (
                        <button type="button" onClick={() => removeItem('operating_cities', idx)}>
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              </div>

              {/* Services Offered */}
              <div className="space-y-2">
                <Label>Services Offered *</Label>
                {!vendor && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-2">
                    {serviceOptions.map((service) => (
                      <Button
                        key={service}
                        type="button"
                        variant={formData.services_offered.includes(service) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          if (formData.services_offered.includes(service)) {
                            removeItem('services_offered', formData.services_offered.indexOf(service));
                          } else {
                            addItem('services_offered', service, () => {});
                          }
                        }}
                        data-testid={`service-${service.replace(/\s+/g, '-').toLowerCase()}`}
                      >
                        {service}
                      </Button>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {formData.services_offered.map((service, idx) => (
                    <span key={idx} className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm flex items-center gap-2">
                      {service}
                      {!vendor && (
                        <button type="button" onClick={() => removeItem('services_offered', idx)}>
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={loading || !!vendor || formData.operating_states.length === 0 || formData.operating_cities.length === 0 || formData.services_offered.length === 0} 
                className="w-full" 
                data-testid="save-vendor-btn"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  vendor ? 'Profile Created' : 'Create Profile'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VendorProfile;
