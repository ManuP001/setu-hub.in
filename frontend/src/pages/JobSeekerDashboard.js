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
import { Briefcase, MapPin, Building2, Clock, Search, Filter, LogOut, User, Send, FileText, Loader2 } from 'lucide-react';
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

      // Fetch additional details for each job
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

  const fetchApplications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/applications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setApplications(response.data);
    } catch (error) {
      console.error('Failed to fetch applications:', error);
      toast.error('Failed to load applications');
    }
  };

  const handleApply = (job) => {
    setSelectedJob(job);
    setApplyDialog(true);
  };

  const submitApplication = async () => {
    if (!selectedJob) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const applicationData = {
        ...applicationForm,
        job_id: selectedJob.id
      };
      
      await axios.post(`${API}/applications`, applicationData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Application submitted successfully!');
      setApplyDialog(false);
      fetchApplications(); // Refresh applications
      
      // Reset form
      setApplicationForm({
        applicant_name: user?.full_name || '',
        applicant_email: user?.email || '',
        applicant_phone: user?.phone || '',
        experience: '',
        cover_note: ''
      });
    } catch (error) {
      console.error('Failed to submit application:', error);
      toast.error('Failed to submit application');
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

  const uniqueRoles = ['all', ...new Set(jobs.map(job => job.role))];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => window.location.href = '/'} 
              className="font-semibold"
              data-testid="home-btn"
            >
              ← Home
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">SetuHub</h1>
                <p className="text-xs text-slate-500">Job Seeker Portal</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold">{user?.full_name}</p>
              <p className="text-xs text-slate-600">{user?.email}</p>
            </div>
            <Button variant="outline" onClick={handleLogout} data-testid="logout-btn">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2" data-testid="page-title">Find Your Next Opportunity</h2>
          <p className="text-slate-600">Browse available job positions and manage your applications</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="browse" data-testid="browse-tab">
              <Briefcase className="w-4 h-4 mr-2" />
              Browse Jobs
            </TabsTrigger>
            <TabsTrigger value="applications" data-testid="applications-tab">
              <FileText className="w-4 h-4 mr-2" />
              My Applications ({applications.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="mt-6">
            {/* Filters */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Search by role, company, or location..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                      data-testid="search-input"
                    />
                  </div>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger data-testid="role-filter-select">
                      <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4" />
                        <SelectValue />
                      </div>
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
                <div className="mt-4 text-sm text-slate-600">
                  Showing <span className="font-bold">{filteredJobs.length}</span> available positions
                </div>
              </CardContent>
            </Card>

            {/* Jobs Grid */}
            {filteredJobs.length === 0 ? (
              <Card data-testid="no-jobs-message">
                <CardContent className="p-12 text-center">
                  <Briefcase className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-600">No jobs found matching your criteria</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredJobs.map((job, idx) => (
                  <Card key={job.id} className="hover:shadow-lg transition-all" data-testid={`job-card-${idx}`}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="capitalize text-xl mb-2">{job.role}</CardTitle>
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Building2 className="w-4 h-4" />
                            <span>{job.enterprise_details?.name || 'Company'}</span>
                          </div>
                        </div>
                        <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                          {job.quantity_required} openings
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {job.gu_details && (
                          <>
                            <div className="flex items-start gap-2 text-sm">
                              <MapPin className="w-4 h-4 text-slate-500 mt-0.5" />
                              <div>
                                <p className="font-medium">{job.gu_details.facility_name}</p>
                                <p className="text-slate-600">
                                  {job.gu_details.city}, {job.gu_details.state} - {job.gu_details.pin_code}
                                </p>
                              </div>
                            </div>
                          </>
                        )}
                        {job.shift_time && (
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="w-4 h-4 text-slate-500" />
                            <span className="capitalize">{job.shift_time}</span>
                          </div>
                        )}
                        {job.description && (
                          <p className="text-sm text-slate-600 pt-2 border-t">{job.description}</p>
                        )}
                      </div>
                      <div className="mt-4 pt-4 border-t flex justify-between items-center">
                        <div className="text-xs text-slate-500">
                          Posted on: {new Date(job.created_at).toLocaleDateString()}
                        </div>
                        <Button 
                          onClick={() => handleApply(job)}
                          className="bg-purple-600 hover:bg-purple-700"
                          data-testid={`apply-btn-${idx}`}
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Apply Now
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="applications" className="mt-6">
            {applications.length === 0 ? (
              <Card data-testid="no-applications-message">
                <CardContent className="p-12 text-center">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-600">No applications submitted yet</p>
                  <p className="text-sm text-slate-500 mt-2">Browse jobs and apply to get started</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {applications.map((application, idx) => (
                  <Card key={application.id} data-testid={`application-card-${idx}`}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg capitalize">{application.job?.role || 'Job Role'}</h3>
                          <p className="text-slate-600">{application.job?.enterprise_details?.name || 'Company'}</p>
                          <p className="text-sm text-slate-500 mt-1">
                            Applied on: {new Date(application.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge 
                          className={
                            application.status === 'pending' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                            application.status === 'accepted' ? 'bg-green-100 text-green-700 border-green-200' :
                            'bg-red-100 text-red-700 border-red-200'
                          }
                        >
                          {application.status}
                        </Badge>
                      </div>
                      {application.cover_note && (
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-sm text-slate-600">{application.cover_note}</p>
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

      {/* Application Dialog */}
      <Dialog open={applyDialog} onOpenChange={setApplyDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Apply for {selectedJob?.role}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedJob && (
              <div className="bg-slate-50 p-4 rounded-lg">
                <h4 className="font-semibold capitalize">{selectedJob.role}</h4>
                <p className="text-sm text-slate-600">{selectedJob.enterprise_details?.name}</p>
                <p className="text-sm text-slate-600">{selectedJob.gu_details?.city}, {selectedJob.gu_details?.state}</p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="applicant_name">Full Name</Label>
                <Input
                  id="applicant_name"
                  value={applicationForm.applicant_name}
                  onChange={(e) => setApplicationForm(prev => ({...prev, applicant_name: e.target.value}))}
                  data-testid="applicant-name-input"
                />
              </div>
              <div>
                <Label htmlFor="applicant_email">Email</Label>
                <Input
                  id="applicant_email"
                  type="email"
                  value={applicationForm.applicant_email}
                  onChange={(e) => setApplicationForm(prev => ({...prev, applicant_email: e.target.value}))}
                  data-testid="applicant-email-input"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="applicant_phone">Phone Number</Label>
              <Input
                id="applicant_phone"
                value={applicationForm.applicant_phone}
                onChange={(e) => setApplicationForm(prev => ({...prev, applicant_phone: e.target.value}))}
                data-testid="applicant-phone-input"
              />
            </div>
            
            <div>
              <Label htmlFor="experience">Years of Experience</Label>
              <Input
                id="experience"
                value={applicationForm.experience}
                onChange={(e) => setApplicationForm(prev => ({...prev, experience: e.target.value}))}
                placeholder="e.g., 2 years"
                data-testid="experience-input"
              />
            </div>
            
            <div>
              <Label htmlFor="cover_note">Cover Note</Label>
              <Textarea
                id="cover_note"
                value={applicationForm.cover_note}
                onChange={(e) => setApplicationForm(prev => ({...prev, cover_note: e.target.value}))}
                placeholder="Tell us why you're interested in this position..."
                rows={4}
                data-testid="cover-note-input"
              />
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setApplyDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={submitApplication}
                disabled={loading || !applicationForm.applicant_name || !applicationForm.applicant_email}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
                data-testid="submit-application-btn"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Application
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="bg-white border-t mt-12 py-6">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-slate-600">
          <p>&copy; 2025 SetuHub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default JobSeekerDashboard;
