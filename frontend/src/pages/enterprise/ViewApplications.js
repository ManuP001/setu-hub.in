import { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '@/App';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Users, Briefcase, Phone, Calendar, MapPin, Building2 } from 'lucide-react';

const ViewApplications = ({ enterprise }) => {
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (enterprise?.id) {
      fetchEnterpriseJobs();
    }
  }, [enterprise]);

  useEffect(() => {
    if (jobs.length > 0) {
      fetchApplications();
    }
  }, [jobs, selectedJob]);

  const fetchEnterpriseJobs = async () => {
    try {
      const response = await axios.get(`${API}/jobs?enterprise_id=${enterprise.id}`);
      setJobs(response.data);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
      toast.error('Failed to load jobs');
    }
  };

  const fetchApplications = async () => {
    try {
      setLoading(true);
      let allApplications = [];

      if (selectedJob === 'all') {
        // Fetch applications for all jobs
        for (const job of jobs) {
          try {
            const response = await axios.get(`${API}/applications/job/${job.id}`);
            const appsWithJobDetails = response.data.map(app => ({
              ...app,
              job_title: job.role,
              job_location: job.gu_id,
              quantity_required: job.quantity_required
            }));
            allApplications = [...allApplications, ...appsWithJobDetails];
          } catch (error) {
            console.error(`Failed to fetch applications for job ${job.id}:`, error);
          }
        }
      } else {
        // Fetch applications for selected job
        const response = await axios.get(`${API}/applications/job/${selectedJob}`);
        const selectedJobData = jobs.find(j => j.id === selectedJob);
        allApplications = response.data.map(app => ({
          ...app,
          job_title: selectedJobData?.role,
          job_location: selectedJobData?.gu_id,
          quantity_required: selectedJobData?.quantity_required
        }));
      }

      setApplications(allApplications);
    } catch (error) {
      console.error('Failed to fetch applications:', error);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (applicationId, newStatus) => {
    try {
      await axios.put(`${API}/applications/${applicationId}/status`, {
        status: newStatus
      });
      toast.success('Application status updated');
      fetchApplications();
    } catch (error) {
      toast.error('Failed to update application status');
    }
  };

  if (!enterprise) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-slate-600">Please complete your enterprise profile first</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusColors = {
    applied: 'bg-blue-100 text-blue-800',
    reviewed: 'bg-yellow-100 text-yellow-800',
    shortlisted: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800'
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Job Applications</h1>
        <p className="text-slate-600">
          Review and manage applications for your open positions
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-sm font-semibold mb-2 block">Filter by Job</label>
              <Select value={selectedJob} onValueChange={setSelectedJob}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Jobs ({jobs.length})</SelectItem>
                  {jobs.map(job => (
                    <SelectItem key={job.id} value={job.id}>
                      {job.role} - {job.quantity_required} positions
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-slate-600 pt-6">
              <span className="font-bold">{applications.length}</span> applications
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Applications List */}
      {loading ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-slate-500">Loading applications...</p>
          </CardContent>
        </Card>
      ) : applications.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-600">No applications received yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {applications.map((app, idx) => (
            <Card key={idx} className="hover:shadow-lg transition-all">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold">{app.applicant_name}</h3>
                        <p className="text-sm text-slate-600">Applied for: {app.job_title}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pl-15">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Phone className="w-4 h-4" />
                        <span>{app.applicant_phone}</span>
                      </div>
                      
                      {app.experience && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Briefcase className="w-4 h-4" />
                          <span>Experience: {app.experience}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Calendar className="w-4 h-4" />
                        <span>Applied: {new Date(app.applied_at).toLocaleDateString()}</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Building2 className="w-4 h-4" />
                        <span>{app.quantity_required} positions</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    <Badge className={statusColors[app.status] || 'bg-gray-100 text-gray-800'}>
                      {app.status.toUpperCase()}
                    </Badge>

                    <div className="flex gap-2">
                      {app.status === 'applied' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateApplicationStatus(app.id, 'reviewed')}
                          >
                            Mark Reviewed
                          </Button>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => updateApplicationStatus(app.id, 'shortlisted')}
                          >
                            Shortlist
                          </Button>
                        </>
                      )}
                      {app.status === 'reviewed' && (
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => updateApplicationStatus(app.id, 'shortlisted')}
                        >
                          Shortlist
                        </Button>
                      )}
                      {(app.status === 'applied' || app.status === 'reviewed') && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => updateApplicationStatus(app.id, 'rejected')}
                        >
                          Reject
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ViewApplications;
