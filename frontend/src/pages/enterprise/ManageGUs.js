import { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '@/App';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, MapPin, Loader2 } from 'lucide-react';

const ManageGUs = ({ enterprise }) => {
  const [gus, setGus] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    facility_type: '',
    facility_name: '',
    zone_name: '',
    address: '',
    city: '',
    state: '',
    pin_code: ''
  });

  useEffect(() => {
    if (enterprise?.id) {
      fetchGUs();
    }
  }, [enterprise]);

  const fetchGUs = async () => {
    try {
      const response = await axios.get(`${API}/gus?enterprise_id=${enterprise.id}`);
      setGus(response.data);
    } catch (error) {
      console.error('Failed to fetch GUs:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`${API}/gus`, {
        ...formData,
        enterprise_id: enterprise.id
      });
      
      toast.success('Facility added successfully!');
      setDialogOpen(false);
      fetchGUs();
      setFormData({
        facility_type: '',
        facility_name: '',
        zone_name: '',
        address: '',
        city: '',
        state: '',
        pin_code: ''
      });
    } catch (error) {
      toast.error('Failed to add facility');
    } finally {
      setLoading(false);
    }
  };

  if (!enterprise) {
    return (
      <div className="p-8" data-testid="no-enterprise-message">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-slate-600">Please create your enterprise profile first</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8" data-testid="manage-gus-page">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Facilities Management</h1>
          <p className="text-slate-600">Manage your geographic units and facilities</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="add-facility-btn">
              <Plus className="w-4 h-4 mr-2" />
              Add Facility
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Facility</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="facility_type">Facility Type *</Label>
                  <Select 
                    value={formData.facility_type} 
                    onValueChange={(value) => setFormData({ ...formData, facility_type: value })}
                    required
                  >
                    <SelectTrigger data-testid="facility-type-select">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dark_store">Dark Store</SelectItem>
                      <SelectItem value="fc">Fulfillment Center</SelectItem>
                      <SelectItem value="sort_center">Sort Center</SelectItem>
                      <SelectItem value="mother_hub">Mother Hub</SelectItem>
                      <SelectItem value="first_mile_hub">First Mile Hub</SelectItem>
                      <SelectItem value="last_mile_hub">Last Mile Hub</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="facility_name">Facility Name *</Label>
                  <Input
                    id="facility_name"
                    placeholder="e.g., Koramangala Hub"
                    value={formData.facility_name}
                    onChange={(e) => setFormData({ ...formData, facility_name: e.target.value })}
                    required
                    data-testid="facility-name-input"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="zone_name">Zone Name *</Label>
                <Input
                  id="zone_name"
                  placeholder="e.g., South Bangalore"
                  value={formData.zone_name}
                  onChange={(e) => setFormData({ ...formData, zone_name: e.target.value })}
                  required
                  data-testid="zone-name-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  placeholder="Full address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                  data-testid="address-input"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    placeholder="e.g., Bangalore"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    required
                    data-testid="city-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    placeholder="e.g., Karnataka"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    required
                    data-testid="state-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pin_code">Pin Code *</Label>
                  <Input
                    id="pin_code"
                    placeholder="560001"
                    value={formData.pin_code}
                    onChange={(e) => setFormData({ ...formData, pin_code: e.target.value })}
                    required
                    data-testid="pincode-input"
                  />
                </div>
              </div>

              <Button type="submit" disabled={loading} className="w-full" data-testid="submit-facility-btn">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Facility'
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {gus.length === 0 ? (
          <Card className="col-span-full" data-testid="no-facilities-message">
            <CardContent className="p-12 text-center">
              <MapPin className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-600 mb-4">No facilities added yet</p>
              <Button onClick={() => setDialogOpen(true)} data-testid="add-first-facility-btn">Add Your First Facility</Button>
            </CardContent>
          </Card>
        ) : (
          gus.map((gu, idx) => (
            <Card key={gu.id} className="hover:shadow-lg transition-shadow" data-testid={`facility-card-${idx}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <span className="truncate">{gu.facility_name}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-xs text-slate-500">Type</p>
                  <p className="font-medium capitalize">{gu.facility_type.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Zone</p>
                  <p className="font-medium">{gu.zone_name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Location</p>
                  <p className="text-sm">{gu.city}, {gu.state} - {gu.pin_code}</p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ManageGUs;
