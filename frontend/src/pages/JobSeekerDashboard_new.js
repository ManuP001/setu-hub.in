import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '@/App';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Briefcase, MapPin, Building2, Clock, Search, Filter, LogOut, Send, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const JobSeekerDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('browse');
  const [applications, setApplications] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applyDialog, setApplyDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [applicationForm, setApplicationForm] = useState({
    applicant_name: '',
    applicant_email: '',
    applicant_phone: '',
    experience: '',
    cover_note: ''
  });

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    setUser(userData);
    if (userData) {
      setApplicationForm(prev => ({
        ...prev,
        applicant_name: userData.full_name || '',
        applicant_email: userData.email || '',
        applicant_phone: userData.phone || ''
      }));
    }
    fetchJobs();
    fetchApplications();
  }, []);

  useEffect(() => {
    filterJobs();
  }, [jobs, searchTerm, roleFilter]);

  const fetchJobs = async () => {
    try {
      const response = await axios.get(`${API}/jobs?status=open`);
      const jobsData = response.data;

      const enrichedJobs = await Promise.all(
        jobsData.map(async (job) => {
          try {
            const [guRes, enterpriseRes] = await Promise.all([
              axios.get(`${API}/gus`),
              axios.get(`${API}/enterprises/${job.enterprise_id}`)
            ]);
            const gu = guRes.data.find(g => g.id === job.gu_id);
            return {
              ...job,
              gu_details: gu,
              enterprise_details: enterpriseRes.data
            };
          } catch (error) {
            return job;
          }
        })
      );

      setJobs(enrichedJobs);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
      toast.error('Failed to load jobs');
    }
  };

  const fetchApplications = async () => {
    try {
      const response = await axios.get(`${API}/applications`);
      setApplications(response.data);
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    }
  };

  const filterJobs = () => {
    let filtered = jobs;

    if (roleFilter !== 'all') {
      filtered = filtered.filter(job => job.role === roleFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(job => 
        job.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.enterprise_details?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.gu_details?.city.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredJobs(filtered);
  };

  const handleApply = async () => {
    if (!applicationForm.applicant_name || !applicationForm.applicant_email || !applicationForm.applicant_phone) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API}/applications`, {
        job_id: selectedJob.id,
        ...applicationForm
      });
      toast.success('Application submitted successfully!');
      setApplyDialog(false);
      fetchApplications();
      setApplicationForm(prev => ({
        applicant_name: prev.applicant_name,
        applicant_email: prev.applicant_email,
        applicant_phone: prev.applicant_phone,
        experience: '',
        cover_note: ''
      }));
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const hasApplied = (jobId) => {
    return applications.some(app => app.job_id === jobId);
  };

  const uniqueRoles = ['all', ...new Set(jobs.map(job => job.role))];

  return (
    <div className=\"min-h-screen bg-slate-50\">
      {/* Header */}
      <header className=\"bg-white border-b sticky top-0 z-40\">
        <div className=\"max-w-7xl mx-auto px-6 py-4 flex justify-between items-center\">
          <div className=\"flex items-center gap-3\">
            <div className=\"w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center\">
              <Briefcase className=\"w-6 h-6 text-white\" />
            </div>
            <div>
              <h1 className=\"text-xl font-bold\">SetuHub</h1>
              <p className=\"text-xs text-slate-500\">Job Seeker Portal</p>
            </div>
          </div>
          <div className=\"flex items-center gap-4\">
            <div className=\"text-right\">
              <p className=\"text-sm font-semibold\">{user?.full_name}</p>
              <p className=\"text-xs text-slate-600\">{user?.email}</p>
            </div>
            <Button variant=\"outline\" onClick={handleLogout} data-testid=\"logout-btn\">
              <LogOut className=\"w-4 h-4 mr-2\" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className=\"max-w-7xl mx-auto px-6 py-8\">
        <Tabs value={activeTab} onValueChange={setActiveTab} className=\"w-full\">
          <TabsList className=\"grid w-full max-w-md grid-cols-2 mb-8\">
            <TabsTrigger value=\"browse\" data-testid=\"browse-tab\">
              <Briefcase className=\"w-4 h-4 mr-2\" />
              Browse Jobs
            </TabsTrigger>
            <TabsTrigger value=\"applications\" data-testid=\"applications-tab\">
              <FileText className=\"w-4 h-4 mr-2\" />
              My Applications ({applications.length})
            </TabsTrigger>
          </TabsList>

          {/* Browse Jobs Tab */}
          <TabsContent value=\"browse\" className=\"space-y-6\">
            <div>
              <h2 className=\"text-3xl font-bold mb-2\" data-testid=\"page-title\">Find Your Next Opportunity</h2>
              <p className=\"text-slate-600\">Browse available job positions across logistics and quick commerce sectors</p>
            </div>

            {/* Filters */}
            <Card>
              <CardContent className=\"p-6\">
                <div className=\"grid grid-cols-1 md:grid-cols-3 gap-4\">
                  <div className=\"md:col-span-2 relative\">
                    <Search className=\"absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400\" />
                    <Input
                      placeholder=\"Search by role, company, or location...\"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className=\"pl-10\"
                      data-testid=\"search-input\"
                    />
                  </div>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger data-testid=\"role-filter-select\">
                      <div className=\"flex items-center gap-2\">
                        <Filter className=\"w-4 h-4\" />
                        <SelectValue />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {uniqueRoles.map(role => (
                        <SelectItem key={role} value={role} className=\"capitalize\">
                          {role === 'all' ? 'All Roles' : role.replace('_', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className=\"mt-4 text-sm text-slate-600\">
                  Showing <span className=\"font-bold\">{filteredJobs.length}</span> available positions
                </div>
              </CardContent>
            </Card>

            {/* Jobs Grid */}
            {filteredJobs.length === 0 ? (
              <Card data-testid=\"no-jobs-message\">
                <CardContent className=\"p-12 text-center\">
                  <Briefcase className=\"w-16 h-16 mx-auto mb-4 text-slate-300\" />
                  <p className=\"text-slate-600\">No jobs found matching your criteria</p>
                </CardContent>
              </Card>
            ) : (
              <div className=\"grid grid-cols-1 lg:grid-cols-2 gap-6\">
                {filteredJobs.map((job, idx) => (
                  <Card key={job.id} className=\"hover:shadow-lg transition-all\" data-testid={`job-card-${idx}`}>
                    <CardHeader>
                      <div className=\"flex justify-between items-start\">
                        <div className=\"flex-1\">
                          <CardTitle className=\"capitalize text-xl mb-2\">{job.role}</CardTitle>
                          <div className=\"flex items-center gap-2 text-sm text-slate-600\">
                            <Building2 className=\"w-4 h-4\" />
                            <span>{job.enterprise_details?.name || 'Company'}</span>
                          </div>
                        </div>
                        <Badge className=\"bg-purple-100 text-purple-700 border-purple-200\">
                          {job.quantity_required} openings
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className=\"space-y-3\">
                        {job.gu_details && (
                          <div className=\"flex items-start gap-2 text-sm\">
                            <MapPin className=\"w-4 h-4 text-slate-500 mt-0.5\" />
                            <div>
                              <p className=\"font-medium\">{job.gu_details.facility_name}</p>
                              <p className=\"text-slate-600\">
                                {job.gu_details.city}, {job.gu_details.state} - {job.gu_details.pin_code}
                              </p>
                            </div>
                          </div>
                        )}
                        {job.shift_time && (
                          <div className=\"flex items-center gap-2 text-sm\">
                            <Clock className=\"w-4 h-4 text-slate-500\" />
                            <span className=\"capitalize\">{job.shift_time}</span>
                          </div>
                        )}
                        {job.salary && (
                          <div className=\"text-sm\">
                            <span className=\"text-slate-500\">Salary:</span>
                            <span className=\"font-semibold ml-2\">{job.salary}</span>
                          </div>
                        )}
                        {job.description && (
                          <p className=\"text-sm text-slate-600 pt-2 border-t\">{job.description}</p>
                        )}
                      </div>
                      <div className=\"mt-4 pt-4 border-t flex justify-between items-center\">
                        <div className=\"text-xs text-slate-500\">
                          Posted: {new Date(job.created_at).toLocaleDateString()}
                        </div>
                        <Button
                          onClick={() => {
                            setSelectedJob(job);
                            setApplyDialog(true);
                          }}
                          disabled={hasApplied(job.id)}
                          data-testid={`apply-btn-${idx}`}
                        >
                          {hasApplied(job.id) ? 'Applied' : 'Apply Now'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* My Applications Tab */}
          <TabsContent value=\"applications\" className=\"space-y-6\">
            <div>
              <h2 className=\"text-3xl font-bold mb-2\">My Applications</h2>
              <p className=\"text-slate-600\">Track your job applications</p>
            </div>

            {applications.length === 0 ? (
              <Card data-testid=\"no-applications-message\">
                <CardContent className=\"p-12 text-center\">
                  <FileText className=\"w-16 h-16 mx-auto mb-4 text-slate-300\" />
                  <p className=\"text-slate-600 mb-4\">You haven't applied to any jobs yet</p>
                  <Button onClick={() => setActiveTab('browse')} data-testid=\"browse-jobs-btn\">Browse Jobs</Button>
                </CardContent>
              </Card>
            ) : (
              <div className=\"space-y-4\">
                {applications.map((application, idx) => (
                  <Card key={application.id} data-testid={`application-card-${idx}`}>
                    <CardContent className=\"p-6\">
                      <div className=\"flex justify-between items-start mb-4\">
                        <div>
                          <h3 className=\"text-xl font-bold capitalize\">{application.job_details?.role}</h3>
                          <p className=\"text-sm text-slate-600\">
                            {application.enterprise_details?.name} • {application.gu_details?.city}
                          </p>
                        </div>
                        <Badge className={
                          application.status === 'applied' ? 'bg-blue-100 text-blue-700' :
                          application.status === 'shortlisted' ? 'bg-green-100 text-green-700' :
                          application.status === 'reviewed' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-slate-100 text-slate-700'
                        }>
                          {application.status}
                        </Badge>
                      </div>
                      <div className=\"grid md:grid-cols-2 gap-4 text-sm\">
                        <div>
                          <p className=\"text-slate-500\">Applied on</p>
                          <p className=\"font-semibold\">{new Date(application.applied_at).toLocaleString()}</p>
                        </div>
                        {application.experience && (
                          <div>
                            <p className=\"text-slate-500\">Experience</p>
                            <p className=\"font-semibold\">{application.experience}</p>
                          </div>
                        )}
                      </div>
                      {application.cover_note && (
                        <div className=\"mt-4 pt-4 border-t\">
                          <p className=\"text-sm text-slate-500 mb-1\">Cover Note</p>
                          <p className=\"text-sm\">{application.cover_note}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Apply Dialog */}
      <Dialog open={applyDialog} onOpenChange={setApplyDialog}>
        <DialogContent className=\"max-w-2xl\">
          <DialogHeader>
            <DialogTitle>Apply for {selectedJob?.role}</DialogTitle>
          </DialogHeader>
          <div className=\"space-y-4\">
            {selectedJob && (
              <div className=\"bg-slate-50 p-4 rounded-lg mb-4\">
                <p className=\"font-semibold\">{selectedJob.enterprise_details?.name}</p>
                <p className=\"text-sm text-slate-600\">{selectedJob.gu_details?.facility_name}, {selectedJob.gu_details?.city}</p>
              </div>
            )}

            <div className=\"grid grid-cols-2 gap-4\">
              <div className=\"space-y-2\">
                <Label htmlFor=\"applicant_name\">Full Name *</Label>
                <Input
                  id=\"applicant_name\"
                  value={applicationForm.applicant_name}
                  onChange={(e) => setApplicationForm({ ...applicationForm, applicant_name: e.target.value })}
                  data-testid=\"applicant-name-input\"
                />
              </div>
              <div className=\"space-y-2\">
                <Label htmlFor=\"applicant_email\">Email *</Label>
                <Input
                  id=\"applicant_email\"
                  type=\"email\"
                  value={applicationForm.applicant_email}
                  onChange={(e) => setApplicationForm({ ...applicationForm, applicant_email: e.target.value })}
                  data-testid=\"applicant-email-input\"
                />
              </div>
            </div>

            <div className=\"grid grid-cols-2 gap-4\">
              <div className=\"space-y-2\">
                <Label htmlFor=\"applicant_phone\">Phone Number *</Label>
                <Input
                  id=\"applicant_phone\"
                  value={applicationForm.applicant_phone}
                  onChange={(e) => setApplicationForm({ ...applicationForm, applicant_phone: e.target.value })}
                  data-testid=\"applicant-phone-input\"
                />
              </div>
              <div className=\"space-y-2\">
                <Label htmlFor=\"experience\">Experience</Label>
                <Input
                  id=\"experience\"
                  placeholder=\"e.g., 2 years\"
                  value={applicationForm.experience}
                  onChange={(e) => setApplicationForm({ ...applicationForm, experience: e.target.value })}
                  data-testid=\"experience-input\"
                />
              </div>
            </div>

            <div className=\"space-y-2\">
              <Label htmlFor=\"cover_note\">Cover Note</Label>
              <Textarea
                id=\"cover_note\"
                placeholder=\"Tell us why you're a good fit for this role...\"
                value={applicationForm.cover_note}
                onChange={(e) => setApplicationForm({ ...applicationForm, cover_note: e.target.value })}
                rows={4}
                data-testid=\"cover-note-input\"
              />
            </div>

            <Button onClick={handleApply} disabled={loading} className=\"w-full\" data-testid=\"submit-application-btn\">
              {loading ? (
                <>
                  <Loader2 className=\"w-4 h-4 mr-2 animate-spin\" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className=\"w-4 h-4 mr-2\" />
                  Submit Application
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className=\"bg-white border-t mt-12 py-6\">
        <div className=\"max-w-7xl mx-auto px-6 text-center text-sm text-slate-600\">
          <p>&copy; 2025 SetuHub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default JobSeekerDashboard;
