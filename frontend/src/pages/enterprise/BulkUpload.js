import { useState } from 'react';
import axios from 'axios';
import { API } from '@/App';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Upload, FileText, CheckCircle, XCircle, Download, Loader2 } from 'lucide-react';

const BulkUpload = ({ enterprise }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setResult(null);
    } else {
      toast.error('Please select a valid CSV file');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API}/jobs/bulk-upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setResult(response.data);
      if (response.data.jobs_created > 0) {
        toast.success(`Successfully created ${response.data.jobs_created} jobs!`);
      }
      if (response.data.errors.length > 0) {
        toast.warning(`${response.data.errors.length} rows had errors`);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const template = `enterprise_id,gu_id,role,quantity_required,shift_time,description,salary,experience_required
${enterprise?.id || 'your-enterprise-id'},your-gu-id,picker,5,morning,Pick items from shelves,25000,0-1 years
${enterprise?.id || 'your-enterprise-id'},your-gu-id,rider,3,full_day,Deliver orders,30000,1-2 years`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'job_upload_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-8" data-testid="bulk-upload-page">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Bulk Job Upload</h1>
          <p className="text-slate-600">Upload multiple job postings at once using a CSV file</p>
        </div>

        {/* Instructions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Upload Instructions</CardTitle>
            <CardDescription>Follow these steps to upload jobs in bulk</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="font-medium">Required CSV Columns:</p>
              <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                <li><strong>enterprise_id</strong> - Your enterprise ID (required)</li>
                <li><strong>gu_id</strong> - Facility/GU ID where job is posted (required)</li>
                <li><strong>role</strong> - Job role (picker, loader, rider, etc.) (required)</li>
                <li><strong>quantity_required</strong> - Number of positions (required)</li>
                <li><strong>shift_time</strong> - Shift timing (optional)</li>
                <li><strong>description</strong> - Job description (optional)</li>
                <li><strong>salary</strong> - Salary range (optional)</li>
                <li><strong>experience_required</strong> - Experience needed (optional)</li>
              </ul>
            </div>
            <Button variant="outline" onClick={downloadTemplate} data-testid="download-template-btn">
              <Download className="w-4 h-4 mr-2" />
              Download Template
            </Button>
          </CardContent>
        </Card>

        {/* Upload Section */}
        <Card data-testid="upload-section">
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center space-y-6">
              <div className="w-full max-w-md">
                <label htmlFor="csv-upload" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {file ? (
                      <>
                        <FileText className="w-12 h-12 mb-3 text-blue-600" />
                        <p className="text-sm font-medium text-slate-700">{file.name}</p>
                        <p className="text-xs text-slate-500 mt-1">{(file.size / 1024).toFixed(2)} KB</p>
                      </>
                    ) : (
                      <>
                        <Upload className="w-12 h-12 mb-3 text-slate-400" />
                        <p className="mb-2 text-sm text-slate-500">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-slate-500">CSV files only</p>
                      </>
                    )}
                  </div>
                  <input
                    id="csv-upload"
                    type="file"
                    className="hidden"
                    accept=".csv"
                    onChange={handleFileChange}
                    data-testid="file-input"
                  />
                </label>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleUpload}
                  disabled={!file || loading}
                  size="lg"
                  data-testid="upload-btn"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Jobs
                    </>
                  )}
                </Button>
                {file && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFile(null);
                      setResult(null);
                    }}
                    data-testid="clear-btn"
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {result && (
          <Card className="mt-6" data-testid="results-card">
            <CardHeader>
              <CardTitle>Upload Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-600 font-medium">Total Rows</p>
                  <p className="text-2xl font-bold text-blue-900">{result.total_rows}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <p className="text-sm text-green-600 font-medium">Created</p>
                  </div>
                  <p className="text-2xl font-bold text-green-900">{result.jobs_created}</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <p className="text-sm text-red-600 font-medium">Errors</p>
                  </div>
                  <p className="text-2xl font-bold text-red-900">{result.errors.length}</p>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Error Details:</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {result.errors.map((error, idx) => (
                      <Alert key={idx} variant="destructive">
                        <AlertDescription>
                          <strong>Row {error.row}:</strong> {error.error}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default BulkUpload;
