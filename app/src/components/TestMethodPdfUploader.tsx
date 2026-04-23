import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, Download, Trash2 } from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import { toast } from 'sonner';

interface TestMethodPdfUploaderProps {
  testMethodId: string;
  currentPdfUrl?: string;
  onUploadSuccess?: () => void;
}

export function TestMethodPdfUploader({ 
  testMethodId, 
  currentPdfUrl, 
  onUploadSuccess 
}: TestMethodPdfUploaderProps) {
  const { dispatch } = useStore();
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
    } else {
      toast.error('Please select a PDF file');
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);

    try {
      // Simple upload simulation - in real app, use cloud storage (Firebase, AWS S3) or local base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const pdfUrl = reader.result as string; // base64 url
        // Dispatch update
        dispatch({ 
          type: 'ADD_TEST_METHOD_PDF', 
          payload: { testMethodId, pdfUrl } 
        });
        toast.success('PDF uploaded successfully');
        setFile(null);
        onUploadSuccess?.();
      };
      reader.onerror = () => {
        toast.error('Upload failed');
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error('Upload failed');
      setUploading(false);
    }
  };

  const handleDelete = () => {
    dispatch({ 
      type: 'ADD_TEST_METHOD_PDF', 
      payload: { testMethodId, pdfUrl: '' } 
    });
    toast.success('PDF removed');
    onUploadSuccess?.();
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Test Method PDF Upload
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentPdfUrl ? (
          <div className="space-y-2">
            <p className="text-sm text-slate-600">Current PDF:</p>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                asChild
              >
                <a href={currentPdfUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => {
                  if (currentPdfUrl.startsWith('file://')) {
                    e.preventDefault();
                    toast.error('PDF viewing disabled in desktop app for security. Use devtools or file system.');
                    return;
                  }
                }}>
                  <Download className="h-4 w-4 mr-1" />
                  View PDF
                </a>
              </Button>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Remove
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">No PDF attached</p>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="pdf-upload">Upload PDF Procedure</Label>
          <div className="flex gap-2">
            <Input
              id="pdf-upload"
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="flex-1"
            />
            <Button
              onClick={handleUpload}
              disabled={!file || uploading}
              size="sm"
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
          <p className="text-xs text-slate-500">
            Upload PDF of test method procedure (max 10MB)
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
