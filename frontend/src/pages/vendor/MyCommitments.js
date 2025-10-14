import { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '@/App';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Building2, MapPin, User, Phone } from 'lucide-react';

const MyCommitments = ({ vendor }) => {
  const [commitments, setCommitments] = useState([]);
  const [jobDetails, setJobDetails] = useState({});

  useEffect(() => {
    if (vendor?.id) {
      fetchCommitments();
    }
  }, [vendor]);

  const fetchCommitments = async () => {
    try {
      const response = await axios.get(`${API}/commitments?vendor_id=${vendor.id}`);
      const commitmentsData = response.data;
      setCommitments(commitmentsData);

      // Fetch job details for each commitment
      const jobDetailsMap = {};
      for (const commitment of commitmentsData) {
        const jobRes = await axios.get(`${API}/jobs/${commitment.job_id}`);
        const job = jobRes.data;
        
        // Fetch GU details
        const guRes = await axios.get(`${API}/gus`);
        const gu = guRes.data.find(g => g.id === job.gu_id);
        
        // Fetch enterprise details
        const enterpriseRes = await axios.get(`${API}/enterprises/${job.enterprise_id}`);
        
        jobDetailsMap[commitment.job_id] = {
          ...job,
          gu_details: gu,
          enterprise_details: enterpriseRes.data
        };
      }
      setJobDetails(jobDetailsMap);
    } catch (error) {
      console.error('Failed to fetch commitments:', error);
    }
  };

  if (!vendor) {
    return (
      <div className="p-8" data-testid="no-vendor-message">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-slate-600">Please create your vendor profile first</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8" data-testid="my-commitments-page">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Commitments</h1>
        <p className="text-slate-600">View and manage your job commitments</p>
      </div>

      {commitments.length === 0 ? (
        <Card data-testid="no-commitments-message">
          <CardContent className="p-12 text-center">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-600">You haven't committed to any jobs yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {commitments.map((commitment, idx) => {
            const job = jobDetails[commitment.job_id];
            if (!job) return null;

            return (
              <Card key={commitment.id} className="hover:shadow-lg transition-shadow" data-testid={`commitment-card-${idx}`}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="capitalize text-xl">{job.role}</CardTitle>
                      <div className="flex items-center gap-2 mt-2 text-sm text-slate-600">
                        <Building2 className="w-4 h-4" />
                        <span>{job.enterprise_details?.name}</span>
                      </div>
                    </div>
                    <Badge className={`${
                      commitment.status === 'committed' ? 'bg-green-100 text-green-700 border-green-200' :
                      'bg-blue-100 text-blue-700 border-blue-200'
                    }`}>
                      {commitment.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Job Details */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm text-slate-700">Job Details</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-slate-500" />
                          <span className="font-medium">{job.gu_details?.facility_name}</span>
                        </div>
                        <div className="text-sm text-slate-600 pl-6">
                          {job.gu_details?.city}, {job.gu_details?.state}
                        </div>
                        <div className="text-sm">
                          <span className="text-slate-500">Quantity:</span>
                          <span className="font-semibold ml-2">{job.quantity_required}</span>
                        </div>
                        {job.shift_time && (
                          <div className="text-sm">
                            <span className="text-slate-500">Shift:</span>
                            <span className="font-semibold ml-2 capitalize">{job.shift_time}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* POC Details */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm text-slate-700">Your POC Details</h4>
                      <div className="bg-green-50 border border-green-200 p-4 rounded-lg space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <User className="w-4 h-4 text-green-600" />
                          <span className="font-semibold">{commitment.poc_name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-green-600" />
                          <span>{commitment.poc_contact}</span>
                        </div>
                        <div className="text-xs text-slate-600 mt-2">
                          Committed on: {new Date(commitment.commitment_timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyCommitments;
