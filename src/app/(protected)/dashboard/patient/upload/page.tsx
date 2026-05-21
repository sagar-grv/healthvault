'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import MenuItem from '@mui/material/MenuItem';
import Alert from '@mui/material/Alert';
import LinearProgress from '@mui/material/LinearProgress';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import IconButton from '@mui/material/IconButton';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import LockOpenOutlinedIcon from '@mui/icons-material/LockOpenOutlined';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFileOutlined';
import ImageIcon from '@mui/icons-material/ImageOutlined';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdfOutlined';
import { createClient } from '@/lib/supabase/client';
import { REPORT_TYPES, REPORT_TYPE_COLORS, ACCEPTED_FILE_TYPES, MAX_FILE_SIZE } from '@/constants';

export default function UploadReportPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [reportType, setReportType] = useState('');
  const [reportDate, setReportDate] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isShareable, setIsShareable] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  const handleFileChange = (selectedFile: File | null) => {
    if (!selectedFile) return;
    if (!ACCEPTED_FILE_TYPES.includes(selectedFile.type)) {
      setError('Only PDF, JPG, and PNG files are accepted.');
      return;
    }
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError('File size must be less than 10MB.');
      return;
    }
    setFile(selectedFile);
    setError('');
    if (!title) setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileChange(e.dataTransfer.files[0] || null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setProgress(0); // Reset progress on each attempt
    if (!file) { setError('Please select a file to upload.'); return; }
    setUploading(true);
    setProgress(15);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Session expired. Please login again.');
        setUploading(false);
        return;
      }

      setProgress(35);
      const reportId = crypto.randomUUID();
      const filePath = `${user.id}/${reportId}/${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from('reports')
        .upload(filePath, file, { contentType: file.type, upsert: false });

      if (uploadError) { setError(`Upload failed: ${uploadError.message}`); return; }
      setProgress(75);

      const { error: dbError } = await supabase.from('reports').insert({
        id: reportId, patient_id: user.id,
        title, report_type: reportType,
        file_path: filePath, file_name: file.name,
        file_size: file.size, mime_type: file.type,
        notes: notes || null, report_date: reportDate,
        is_shareable: isShareable,
      });

      if (dbError) {
        setError(`Failed to save report: ${dbError.message}`);
        await supabase.storage.from('reports').remove([filePath]);
        return;
      }

      setProgress(100);
      router.push('/dashboard/patient');
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const fileIcon = file?.type === 'application/pdf'
    ? <PictureAsPdfIcon sx={{ fontSize: 36, color: '#EF4444' }} />
    : file?.type?.startsWith('image/')
    ? <ImageIcon sx={{ fontSize: 36, color: '#8B5CF6' }} />
    : <InsertDriveFileIcon sx={{ fontSize: 36, color: '#2563EB' }} />;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 4 }}>
      <AppBar position="sticky" color="inherit" elevation={0}>
        <Toolbar>
          <IconButton edge="start" onClick={() => router.push('/dashboard/patient')}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ ml: 1 }}>Upload Report</Typography>
        </Toolbar>
      </AppBar>

      {uploading && (
        <Box sx={{ position: 'sticky', top: 64, zIndex: 10 }}>
          <LinearProgress variant="indeterminate" sx={{ height: 3 }} />
        </Box>
      )}

      <Box sx={{ px: 2, py: 3, maxWidth: 520, mx: 'auto' }}>
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit}>
          {/* Drop Zone */}
          <Box
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-input')?.click()}
            sx={{
              border: `2px dashed ${dragOver ? '#2563EB' : file ? '#059669' : '#E5E7EB'}`,
              borderRadius: 3,
              p: 4,
              textAlign: 'center',
              bgcolor: dragOver ? '#EFF6FF' : file ? '#F0FDF4' : '#FAFAFA',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              mb: 3,
              '&:hover': { borderColor: '#2563EB', bgcolor: '#EFF6FF' },
            }}
          >
            {file ? (
              <Box className="animate-scale-in">
                {fileIcon}
                <Typography variant="body1" sx={{ fontWeight: 600, mt: 1 }}>{file.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </Typography>
                <Chip label="Tap to change" size="small" sx={{ mt: 1.5, bgcolor: '#D1FAE5', color: '#065F46' }} />
              </Box>
            ) : (
              <>
                <Box sx={{ width: 56, height: 56, borderRadius: 3, bgcolor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
                  <CloudUploadIcon sx={{ fontSize: 28, color: '#2563EB' }} />
                </Box>
                <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                  Tap to upload or drop here
                </Typography>
                <Typography variant="body2" color="text.secondary">PDF, JPG, or PNG — Max 10MB</Typography>
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mt: 1.5 }}>
                  {['PDF', 'JPG', 'PNG'].map(f => (
                    <Chip key={f} label={f} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                  ))}
                </Box>
              </>
            )}
            <input
              id="file-input"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,image/*"
              onChange={e => handleFileChange(e.target.files?.[0] || null)}
              style={{ display: 'none' }}
            />
          </Box>

          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <TextField
                fullWidth label="Report Title" value={title}
                onChange={e => setTitle(e.target.value)}
                required placeholder="e.g., Blood Test Results"
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth select label="Report Type" value={reportType}
                onChange={e => setReportType(e.target.value)} required sx={{ mb: 2 }}
              >
                {REPORT_TYPES.map(type => {
                  const c = REPORT_TYPE_COLORS[type.value] || REPORT_TYPE_COLORS.other;
                  return (
                    <MenuItem key={type.value} value={type.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: c.color }} />
                        {type.label}
                      </Box>
                    </MenuItem>
                  );
                })}
              </TextField>
              <TextField
                fullWidth label="Report Date" type="date"
                value={reportDate}
                onChange={e => setReportDate(e.target.value)}
                required
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth label="Notes (Optional)" value={notes}
                onChange={e => setNotes(e.target.value)}
                multiline rows={2}
                placeholder="Any additional notes..."
              />
            </CardContent>
          </Card>

          {/* Visibility Toggle */}
          <Card sx={{ mb: 3, bgcolor: isShareable ? '#F0FDF4' : '#F9FAFB', border: `1px solid ${isShareable ? '#A7F3D0' : '#E5E7EB'}` }}>
            <CardContent sx={{ p: 2.5 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={isShareable}
                    onChange={e => setIsShareable(e.target.checked)}
                    color="secondary"
                  />
                }
                label={
                  <Box sx={{ ml: 0.5, display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    {isShareable
                      ? <LockOpenOutlinedIcon sx={{ fontSize: 20, color: 'secondary.main', mt: 0.1, flexShrink: 0 }} />
                      : <LockOutlinedIcon sx={{ fontSize: 20, color: 'text.secondary', mt: 0.1, flexShrink: 0 }} />
                    }
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {isShareable ? 'Shareable with doctors' : 'Private — only you'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {isShareable
                          ? 'Doctors with your Health ID can view this report'
                          : 'Only you can see this report — switch to share with doctors'}
                      </Typography>
                    </Box>
                  </Box>
                }
                sx={{ m: 0, alignItems: 'flex-start' }}
              />
            </CardContent>
          </Card>

          <Button
            type="submit" variant="contained" fullWidth size="large"
            disabled={uploading || !file}
            sx={{ py: 1.75, fontSize: '1rem', boxShadow: '0 4px 14px rgba(37,99,235,0.3)' }}
          >
            {uploading ? `Uploading... ${progress}%` : 'Upload Report'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
