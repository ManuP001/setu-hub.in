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
import { Loader2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CreateJob = ({ enterprise }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [gus, setGus] = useState([]);
  const [formData, setFormData] = useState({
    gu_id: '',
    role: '',
    quantity_required: 1,
    nature_of_job: '',
    description: ''
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
      toast.error('Failed to load facilities');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`${API}/jobs`, {
        ...formData,
        enterprise_id: enterprise.id,
        quantity_required: parseInt(formData.quantity_required)
      });
      
      toast.success('Job posted successfully!');
      navigate('/enterprise/jobs');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create job');
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

  if (gus.length === 0) {
    return (
      <div className="p-8" data-testid="no-facilities-message">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-slate-600 mb-4">Please add at least one facility before creating jobs</p>
            <Button onClick={() => navigate('/enterprise/gus')} data-testid="go-to-facilities-btn">Go to Facilities</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8" data-testid="create-job-page">
      <Button variant="ghost" onClick={() => navigate('/enterprise/jobs')} className="mb-4" data-testid="back-to-jobs-btn">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Jobs
      </Button>

      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Create Job Posting</h1>
          <p className="text-slate-600">Post a new job requirement for your facility</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Job Details</CardTitle>
            <CardDescription>Fill in the details for your job posting</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="gu_id">Select Facility *</Label>
                <Select 
                  value={formData.gu_id} 
                  onValueChange={(value) => setFormData({ ...formData, gu_id: value })}
                  required
                >
                  <SelectTrigger data-testid="facility-select">
                    <SelectValue placeholder="Choose a facility" />
                  </SelectTrigger>
                  <SelectContent>
                    {gus.map((gu) => (
                      <SelectItem key={gu.id} value={gu.id}>
                        {gu.facility_name} - {gu.city} ({gu.facility_type.replace('_', ' ')})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select 
                  value={formData.role} 
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                  required
                >
                  <SelectTrigger data-testid="role-select">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Last Mile Bike Captain">Last Mile Bike Captain</SelectItem>
                    <SelectItem value="Last Mile Van Captain">Last Mile Van Captain</SelectItem>
                    <SelectItem value="Fulfillment Center Picker">Fulfillment Center Picker</SelectItem>
                    <SelectItem value="Fulfillment Center Loader">Fulfillment Center Loader</SelectItem>
                    <SelectItem value="Warehouse Associate">Warehouse Associate</SelectItem>
                    <SelectItem value="Sort Center Coordinator">Sort Center Coordinator</SelectItem>
                    <SelectItem value="Store Operations Executive">Store Operations Executive</SelectItem>
                    <SelectItem value="Quality Control Inspector">Quality Control Inspector</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity_required">Quantity Required *</Label>
                  <Input
                    id="quantity_required"
                    type="number"
                    min="1"
                    placeholder="e.g., 5"
                    value={formData.quantity_required}
                    onChange={(e) => setFormData({ ...formData, quantity_required: e.target.value })}
                    required
                    data-testid="quantity-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shift_time">Shift Time</Label>
                  <Select 
                    value={formData.shift_time} 
                    onValueChange={(value) => setFormData({ ...formData, shift_time: value })}
                  >
                    <SelectTrigger data-testid="shift-select">
                      <SelectValue placeholder="Select shift" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">Morning (6 AM - 2 PM)</SelectItem>
                      <SelectItem value="afternoon">Afternoon (2 PM - 10 PM)</SelectItem>
                      <SelectItem value="night">Night (10 PM - 6 AM)</SelectItem>
                      <SelectItem value="full_day">Full Day</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Job Description</Label>
                <Textarea
                  id="description"
                  placeholder="Additional details about the job requirement..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  data-testid="description-input"
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full" data-testid="submit-job-btn">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Job...
                  </>
                ) : (
                  'Create Job Posting'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateJob;
