import { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '@/App';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Briefcase, MapPin, Building2, Clock, Filter, Loader2 } from 'lucide-react';

const AvailableJobs = ({ vendor }) => {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedJob, setSelectedJob] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [commitmentDialog, setCommitmentDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pocData, setPocData] = useState({
    poc_name: '',
    poc_contact: ''
  });

  useEffect(() => {
    // Fetch jobs regardless of vendor profile status
    fetchAvailableJobs();
  }, []);

  useEffect(() => {
    filterJobs();
  }, [jobs, roleFilter]);

  const fetchAvailableJobs = async () => {
    try {
      const response = await axios.get(`${API}/jobs/vendor-view`);
      setJobs(response.data);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
      toast.error('Failed to load available jobs');
    }
  };

  const filterJobs = () => {
    let filtered = jobs;

    if (roleFilter !== 'all') {
      filtered = filtered.filter(job => job.role === roleFilter);
    }

    setFilteredJobs(filtered);
  };

  const handleCommit = async () => {
    if (!vendor?.id) {
      toast.error('Please complete your vendor profile before committing to jobs');
      setCommitmentDialog(false);
      setDialogOpen(false);
      return;
    }
    
    if (!pocData.poc_name || !pocData.poc_contact) {
      toast.error('Please provide POC details');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API}/commitments`, {
        job_id: selectedJob.id,
        vendor_id: vendor.id,
        poc_name: pocData.poc_name,
        poc_contact: pocData.poc_contact
      });
      
      toast.success('Successfully committed to job!');
      setCommitmentDialog(false);
      setDialogOpen(false);
      setPocData({ poc_name: '', poc_contact: '' });
      fetchAvailableJobs();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to commit to job');
    } finally {
      setLoading(false);
    }
  };

  // Allow vendors to browse jobs even without complete profile
  // if (!vendor) {
  //   return (
  //     <div className="p-8" data-testid="no-vendor-message">
  //       <Card>
  //         <CardContent className="p-12 text-center">
  //           <p className="text-slate-600">Please create your vendor profile first</p>
  //         </CardContent>
  //       </Card>
  //     </div>
  //   );
  // }

  const uniqueRoles = ['all', ...new Set(jobs.map(job => job.role))];

  return (
    <div className="p-8" data-testid="available-jobs-page">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Available Jobs</h1>
        <p className="text-slate-600">Browse and commit to job opportunities in your operating areas</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-slate-400" />
            <div className="flex-1">
              <Label className="text-sm mb-2">Filter by Role</Label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-64" data-testid="role-filter-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {uniqueRoles.map(role => (
                    <SelectItem key={role} value={role} className="capitalize">
                      {role === 'all' ? 'All Roles' : role.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-slate-600">
              Showing <span className="font-bold">{filteredJobs.length}</span> jobs
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Jobs Grid */}
      {filteredJobs.length === 0 ? (
        <Card data-testid="no-jobs-message">
          <CardContent className="p-12 text-center">
            <Briefcase className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-600">No jobs available matching your criteria</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredJobs.map((job, idx) => (
            <Card key={job.id} className="hover:shadow-lg transition-all cursor-pointer" onClick={() => { setSelectedJob(job); setDialogOpen(true); }} data-testid={`job-card-${idx}`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="capitalize text-xl">{job.role}</CardTitle>
                    <div className="flex items-center gap-2 mt-2 text-sm text-slate-600">
                      <Building2 className="w-4 h-4" />
                      <span>{job.enterprise_details?.name}</span>
                    </div>
                  </div>
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                    {job.quantity_required} positions
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-slate-500" />
                    <span className="font-medium">{job.gu_details?.facility_name}</span>
                  </div>
                  <div className="text-sm text-slate-600">
                    {job.gu_details?.city}, {job.gu_details?.state} - {job.gu_details?.pin_code}
                  </div>
                  {job.nature_of_job && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-slate-500" />
                      <span className="capitalize">{job.nature_of_job.replace('_', ' ')}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Job Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Job Details</DialogTitle>
          </DialogHeader>
          {selectedJob && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Role</p>
                  <p className="font-semibold capitalize">{selectedJob.role}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Quantity Required</p>
                  <p className="font-semibold">{selectedJob.quantity_required}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Enterprise</p>
                  <p className="font-semibold">{selectedJob.enterprise_details?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Nature of Work</p>
                  <p className="font-semibold capitalize">{selectedJob.nature_of_job ? selectedJob.nature_of_job.replace('_', ' ') : 'Not specified'}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-bold mb-3">Facility Details</h4>
                <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                  <div>
                    <p className="text-sm text-slate-600">Facility</p>
                    <p className="font-semibold">{selectedJob.gu_details?.facility_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Type</p>
                    <p className="capitalize">{selectedJob.gu_details?.facility_type.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Location</p>
                    <p>{selectedJob.gu_details?.address}</p>
                    <p>{selectedJob.gu_details?.city}, {selectedJob.gu_details?.state} - {selectedJob.gu_details?.pin_code}</p>
                  </div>
                </div>
              </div>

              {selectedJob.description && (
                <div>
                  <p className="text-sm text-slate-500 mb-2">Description</p>
                  <p className="text-sm border p-3 rounded bg-slate-50">{selectedJob.description}</p>
                </div>
              )}

              <Button 
                onClick={() => { setDialogOpen(false); setCommitmentDialog(true); }} 
                className="w-full" 
                size="lg"
                data-testid="acknowledge-commit-btn"
              >
                Acknowledge & Commit to Fulfillment
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Commitment Dialog */}
      <Dialog open={commitmentDialog} onOpenChange={setCommitmentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Provide Point of Contact</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">Please provide the contact details for the person who will manage this job fulfillment.</p>
            
            <div className="space-y-2">
              <Label htmlFor="poc_name">POC Name *</Label>
              <Input
                id="poc_name"
                placeholder="Full name"
                value={pocData.poc_name}
                onChange={(e) => setPocData({ ...pocData, poc_name: e.target.value })}
                data-testid="poc-name-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="poc_contact">POC Contact Number *</Label>
              <Input
                id="poc_contact"
                placeholder="+91 9876543210"
                value={pocData.poc_contact}
                onChange={(e) => setPocData({ ...pocData, poc_contact: e.target.value })}
                data-testid="poc-contact-input"
              />
            </div>

            <Button 
              onClick={handleCommit} 
              disabled={loading} 
              className="w-full"
              data-testid="confirm-commitment-btn"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Committing...
                </>
              ) : (
                'Confirm Commitment'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AvailableJobs;
