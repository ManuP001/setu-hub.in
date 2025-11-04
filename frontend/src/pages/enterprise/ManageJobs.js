import { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '@/App';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Briefcase, Search, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ManageJobs = ({ enterprise }) => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [gus, setGus] = useState([]);
  const [vendors, setVendors] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedJob, setSelectedJob] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (enterprise?.id) {
      fetchJobs();
      fetchGUs();
    }
  }, [enterprise]);

  useEffect(() => {
    filterJobs();
  }, [jobs, searchTerm, statusFilter]);

  const fetchJobs = async () => {
    try {
      const response = await axios.get(`${API}/jobs?enterprise_id=${enterprise.id}`);
      setJobs(response.data);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    }
  };

  const fetchGUs = async () => {
    try {
      const response = await axios.get(`${API}/gus?enterprise_id=${enterprise.id}`);
      setGus(response.data);
    } catch (error) {
      console.error('Failed to fetch GUs:', error);
    }
  };

  const fetchVendorDetails = async (vendorId) => {
    if (vendors[vendorId]) return vendors[vendorId];
    
    try {
      const response = await axios.get(`${API}/vendors/${vendorId}`);
      setVendors(prev => ({ ...prev, [vendorId]: response.data }));
      return response.data;
    } catch (error) {
      console.error('Failed to fetch vendor:', error);
      return null;
    }
  };

  const filterJobs = () => {
    let filtered = jobs;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(job => job.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(job => 
        job.role.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredJobs(filtered);
  };

  const handleViewDetails = async (job) => {
    if (job.committed_vendor_id) {
      await fetchVendorDetails(job.committed_vendor_id);
    }
    setSelectedJob(job);
    setDialogOpen(true);
  };

  const getGUDetails = (guId) => {
    return gus.find(gu => gu.id === guId);
  };

  const getStatusBadge = (status) => {
    const styles = {
      open: 'bg-orange-100 text-orange-700 border-orange-200',
      vendor_committed: 'bg-green-100 text-green-700 border-green-200',
      fulfilled: 'bg-blue-100 text-blue-700 border-blue-200',
      cancelled: 'bg-slate-100 text-slate-700 border-slate-200'
    };
    return <Badge className={styles[status] || styles.open}>{status.replace('_', ' ')}</Badge>;
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
    <div className="p-8" data-testid="manage-jobs-page">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Job Management</h1>
          <p className="text-slate-600">Manage all your job postings</p>
        </div>
        <Button onClick={() => navigate('/enterprise/jobs/create')} data-testid="create-job-btn">
          <Plus className="w-4 h-4 mr-2" />
          Create Job
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="search-jobs-input"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger data-testid="status-filter-select">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="vendor_committed">Vendor Committed</SelectItem>
                <SelectItem value="fulfilled">Fulfilled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Jobs List */}
      {filteredJobs.length === 0 ? (
        <Card data-testid="no-jobs-message">
          <CardContent className="p-12 text-center">
            <Briefcase className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-600 mb-4">No jobs found</p>
            <Button onClick={() => navigate('/enterprise/jobs/create')} data-testid="create-first-job-btn">Create Your First Job</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredJobs.map((job, idx) => {
            const gu = getGUDetails(job.gu_id);
            return (
              <Card key={job.id} className="hover:shadow-md transition-shadow" data-testid={`job-card-${idx}`}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold capitalize">{job.role}</h3>
                        {getStatusBadge(job.status)}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-slate-500">Quantity Required</p>
                          <p className="font-semibold">{job.quantity_required}</p>
                        </div>
                        {gu && (
                          <>
                            <div>
                              <p className="text-slate-500">Facility</p>
                              <p className="font-semibold">{gu.facility_name}</p>
                            </div>
                            <div>
                              <p className="text-slate-500">Location</p>
                              <p className="font-semibold">{gu.city}</p>
                            </div>
                          </>
                        )}
                        {job.nature_of_job && (
                          <div>
                            <p className="text-slate-500">Nature of Work</p>
                            <p className="font-semibold capitalize">{job.nature_of_job.replace('_', ' ')}</p>
                          </div>
                        )}
                      </div>
                      {job.description && (
                        <p className="text-sm text-slate-600 mt-3">{job.description}</p>
                      )}
                    </div>
                    <Button variant="outline" onClick={() => handleViewDetails(job)} data-testid={`view-job-details-${idx}`}>
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
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
                  <p className="text-sm text-slate-500">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedJob.status)}</div>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Quantity Required</p>
                  <p className="font-semibold">{selectedJob.quantity_required}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Nature of Work</p>
                  <p className="font-semibold capitalize">{selectedJob.nature_of_job ? selectedJob.nature_of_job.replace('_', ' ') : 'Not specified'}</p>
                </div>
              </div>

              {selectedJob.description && (
                <div>
                  <p className="text-sm text-slate-500 mb-2">Description</p>
                  <p className="text-sm border p-3 rounded bg-slate-50">{selectedJob.description}</p>
                </div>
              )}

              {selectedJob.committed_vendor_id && vendors[selectedJob.committed_vendor_id] && (
                <div className="border-t pt-4">
                  <h4 className="font-bold mb-3 text-green-700">Vendor Commitment</h4>
                  <div className="bg-green-50 border border-green-200 p-4 rounded-lg space-y-2">
                    <div>
                      <p className="text-sm text-slate-600">Vendor Name</p>
                      <p className="font-semibold">{vendors[selectedJob.committed_vendor_id].name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Contact</p>
                      <p className="font-semibold">{vendors[selectedJob.committed_vendor_id].phone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Email</p>
                      <p className="font-semibold">{vendors[selectedJob.committed_vendor_id].email}</p>
                    </div>
                    {selectedJob.commitment_timestamp && (
                      <div>
                        <p className="text-sm text-slate-600">Committed On</p>
                        <p className="font-semibold">{new Date(selectedJob.commitment_timestamp).toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageJobs;
