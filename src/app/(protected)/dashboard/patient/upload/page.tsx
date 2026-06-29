'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
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
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import LockOpenOutlinedIcon from '@mui/icons-material/LockOpenOutlined';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFileOutlined';
import ImageIcon from '@mui/icons-material/ImageOutlined';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdfOutlined';
import CompressIcon from '@mui/icons-material/CompressOutlined';
import DocumentScannerOutlinedIcon from '@mui/icons-material/DocumentScannerOutlined';
import { createClient } from '@/lib/supabase/client';
import { REPORT_TYPES, REPORT_TYPE_COLORS, ACCEPTED_FILE_TYPES, MAX_FILE_SIZE } from '@/constants';
import { optimizeImage, isOptimizableImage, formatFileSize } from '@/lib/utils/image-optimizer';
import { checkUploadAllowed, recordUpload } from '@/app/(protected)/dashboard/patient/actions';
import ThemeToggle from '@/components/ThemeToggle';

const uploadKeyframes = `
@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 0.85; }
  50% { transform: scale(1.06); opacity: 1; }
}
@keyframes scaleUp {
  from { transform: scale(0.85); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
`;

const CameraCapture = dynamic(() => import('@/components/patient/CameraCapture'), { ssr: false });

export default function UploadReportPage() {
  const router = useRouter();
  const t = useTranslations('upload');

  const [title, setTitle] = useState('');
  const [reportType, setReportType] = useState('');
  const [reportDate, setReportDate] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isShareable, setIsShareable] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState<{
    original: number;
    compressed: number;
  } | null>(null);
  const [uploadDone, setUploadDone] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(0);

  const handleCameraCapture = (images: Blob[], captureTitle?: string) => {
    if (!images.length) return;

    setShowCamera(false);
    const blob = images[0];
    const isPdf = blob.type === 'application/pdf';
    const fileName = isPdf ? 'scanned-report.pdf' : 'scanned-report.jpg';
    const capturedFile = new File([blob], fileName, { type: blob.type });
    setFile(capturedFile);
    setCompressionInfo(null);
    if (!title) setTitle(captureTitle || (isPdf ? 'Merged Scan' : 'Scanned Report'));
    if (!reportDate) setReportDate(new Date().toISOString().split('T')[0]);
  };

  const handleFileChange = (selectedFile: File | null) => {
    if (!selectedFile) return;
    if (!ACCEPTED_FILE_TYPES.includes(selectedFile.type)) {
      setError(t('invalidType'));
      return;
    }
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError(t('fileTooLarge'));
      return;
    }
    setFile(selectedFile);
    setError('');
    setCompressionInfo(null);
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
    setProgress(0);
    setProgressLabel('');
    if (!file) {
      setError(t('noFile'));
      return;
    }
    setUploading(true);

    try {
      const rateCheck = await checkUploadAllowed();
      if (!rateCheck.allowed) {
        setError(rateCheck.error || 'Upload limit reached');
        setUploading(false);
        return;
      }

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError(t('sessionExpired'));
        setUploading(false);
        return;
      }

      let uploadBlob: Blob | File = file;
      let uploadFileName = file.name;
      let uploadMimeType = file.type;
      let uploadSize = file.size;
      let thumbnailBlob: Blob | null = null;

      if (isOptimizableImage(file)) {
        setProgress(10);
        setProgressLabel(t('optimizing'));
        try {
          const optimized = await optimizeImage(file);
          uploadBlob = optimized.blob;
          uploadFileName = optimized.fileName;
          uploadMimeType = optimized.mimeType;
          uploadSize = optimized.compressedSize;
          thumbnailBlob = optimized.thumbnail;
          setCompressionInfo({ original: file.size, compressed: optimized.compressedSize });
        } catch {
          uploadBlob = file;
        }
      }

      setProgress(20);
      setProgressLabel(t('uploading'));
      const reportId = crypto.randomUUID();
      const filePath = `${user.id}/${reportId}/${uploadFileName}`;

      const { error: uploadError } = await supabase.storage
        .from('reports')
        .upload(filePath, uploadBlob, { contentType: uploadMimeType, upsert: false });

      if (uploadError) {
        setError(`Upload failed: ${uploadError.message}`);
        return;
      }
      setProgress(70);

      let thumbnailPath: string | null = null;
      if (thumbnailBlob) {
        setProgressLabel(t('savingThumbnail'));
        thumbnailPath = `${user.id}/${reportId}/thumb.jpg`;
        await supabase.storage
          .from('reports')
          .upload(thumbnailPath, thumbnailBlob, { contentType: 'image/jpeg', upsert: false });
      }
      setProgress(85);

      setProgressLabel(t('savingReport'));
      const { error: dbError } = await supabase.from('reports').insert({
        id: reportId,
        patient_id: user.id,
        title,
        report_type: reportType,
        file_path: filePath,
        file_name: uploadFileName,
        file_size: uploadSize,
        mime_type: uploadMimeType,
        notes: notes || null,
        report_date: reportDate,
        is_shareable: isShareable,
        thumbnail_path: thumbnailPath,
      });

      if (dbError) {
        setError(`Failed to save report: ${dbError.message}`);
        await supabase.storage.from('reports').remove([filePath]);
        if (thumbnailPath) await supabase.storage.from('reports').remove([thumbnailPath]);
        return;
      }

      setProgress(100);
      setProgressLabel(t('done'));
      await recordUpload();
      setUploading(false);
      setUploadDone(true);
      setRedirectCountdown(2);
    } catch {
      setError(t('unknownError'));
      setUploading(false);
    }
  };

  // Auto-redirect after upload success
  useEffect(() => {
    if (redirectCountdown > 0) {
      const timer = setTimeout(() => {
        setRedirectCountdown((c) => c - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
    if (redirectCountdown === 0 && uploadDone) {
      router.push('/dashboard/patient?uploaded=1');
      router.refresh();
    }
  }, [redirectCountdown, uploadDone, router]);

  const fileIcon =
    file?.type === 'application/pdf' ? (
      <PictureAsPdfIcon sx={{ fontSize: 36, color: 'error.main' }} />
    ) : file?.type?.startsWith('image/') ? (
      <ImageIcon sx={{ fontSize: 36, color: '#8B5CF6' }} />
    ) : (
      <InsertDriveFileIcon sx={{ fontSize: 36, color: 'primary.main' }} />
    );

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 4 }}>
      <style>{uploadKeyframes}</style>
      <AppBar position="sticky" color="inherit" elevation={0}>
        <Toolbar>
          <IconButton edge="start" onClick={() => router.push('/dashboard/patient')}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ ml: 1, flexGrow: 1 }}>
            {t('pageTitle')}
          </Typography>
          <ThemeToggle />
          {/* Scan Report — secondary action in the app bar */}
          <Tooltip title={t('scanInstead')}>
            <IconButton onClick={() => setShowCamera(true)} aria-label="Scan report with camera">
              <DocumentScannerOutlinedIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Breadcrumbs sx={{ px: 2, pt: 1.5 }} aria-label="breadcrumb">
        <Link
          href="/dashboard/patient"
          style={{ color: 'inherit', textDecoration: 'none', fontSize: '0.8rem' }}
        >
          Dashboard
        </Link>
        <Typography color="text.primary" sx={{ fontSize: '0.8rem' }}>
          Upload Report
        </Typography>
      </Breadcrumbs>

      {/* Upload progress overlay */}
      {(uploading || uploadDone) && (
        <Box
          sx={{
            position: 'fixed',
            inset: 0,
            zIndex: 1300,
            bgcolor: 'background.paper',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 3,
            px: 4,
          }}
        >
          {uploadDone ? (
            /* Success state with auto-redirect */
            <Box sx={{ textAlign: 'center', animation: 'scaleUp 0.3s ease' }}>
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  bgcolor: 'rgba(5,150,105,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                }}
              >
                <Box
                  component="svg"
                  viewBox="0 0 24 24"
                  sx={{ width: 40, height: 40, color: 'success.main' }}
                >
                  <path
                    d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"
                    fill="currentColor"
                  />
                </Box>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                {t('done') || 'Report uploaded!'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Redirecting to dashboard in {redirectCountdown}s...
              </Typography>
            </Box>
          ) : (
            /* In-progress state */
            <Box sx={{ textAlign: 'center', width: '100%', maxWidth: 320 }}>
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  bgcolor: 'rgba(37,99,235,0.10)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                  animation: 'pulse 1.5s ease-in-out infinite',
                }}
              >
                <Box
                  component="svg"
                  viewBox="0 0 24 24"
                  sx={{ width: 28, height: 28, color: 'primary.main' }}
                >
                  <path
                    d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm-3.06 16L7.4 14.46l1.41-1.41 2.12 2.12 4.24-4.24 1.41 1.41L10.94 18z"
                    fill="currentColor"
                  />
                </Box>
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                {progressLabel || t('uploading')}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{ height: 6, borderRadius: 3, mb: 1.5 }}
              />
              <Typography variant="caption" color="text.secondary">
                {progress}%
              </Typography>
            </Box>
          )}
        </Box>
      )}

      <Box sx={{ px: 2, py: 3, maxWidth: 520, mx: 'auto' }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          {/* Drop Zone */}
          <Box
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-input')?.click()}
            sx={{
              border: '2px dashed',
              borderColor: dragOver ? 'primary.main' : file ? 'secondary.main' : 'transparent',
              outline: `${dragOver || file ? 0 : 1}px solid`,
              outlineColor: 'divider',
              borderRadius: 3,
              p: 4,
              textAlign: 'center',
              bgcolor: dragOver
                ? 'rgba(37,99,235,0.08)'
                : file
                  ? 'rgba(5,150,105,0.08)'
                  : 'action.hover',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              mb: 3,
              '&:hover': { borderColor: 'primary.main', bgcolor: 'rgba(37,99,235,0.08)' },
            }}
          >
            {file ? (
              <Box className="animate-scale-in">
                {fileIcon}
                <Typography variant="body1" sx={{ fontWeight: 600, mt: 1 }}>
                  {file.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatFileSize(file.size)}
                  {isOptimizableImage(file) && <> — {t('willBeOptimized')}</>}
                </Typography>
                {compressionInfo && (
                  <Chip
                    icon={<CompressIcon sx={{ fontSize: 14 }} />}
                    label={`${formatFileSize(compressionInfo.original)} → ${formatFileSize(compressionInfo.compressed)} (${Math.round((1 - compressionInfo.compressed / compressionInfo.original) * 100)}% smaller)`}
                    size="small"
                    sx={{ mt: 1, bgcolor: 'rgba(5,150,105,0.12)', color: 'success.dark' }}
                  />
                )}
                {!compressionInfo && (
                  <Chip
                    label={t('tapToChange')}
                    size="small"
                    sx={{ mt: 1.5, bgcolor: 'rgba(5,150,105,0.12)', color: 'success.dark' }}
                  />
                )}
              </Box>
            ) : (
              <>
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: 3,
                    bgcolor: 'rgba(37,99,235,0.10)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 2,
                  }}
                >
                  <CloudUploadIcon sx={{ fontSize: 28, color: 'primary.main' }} />
                </Box>
                <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {t('dropPrompt')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('dropHint')}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mt: 1.5 }}>
                  {['PDF', 'JPG', 'PNG'].map((f) => (
                    <Chip
                      key={f}
                      label={f}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: '0.7rem' }}
                    />
                  ))}
                </Box>
              </>
            )}
            <input
              id="file-input"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,image/*"
              onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
              style={{ display: 'none' }}
            />
          </Box>

          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <TextField
                fullWidth
                label={t('reportTitle')}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder={t('reportTitlePlaceholder')}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                select
                label={t('reportType')}
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                required
                sx={{ mb: 2 }}
              >
                {REPORT_TYPES.map((type) => {
                  const c = REPORT_TYPE_COLORS[type.value] || REPORT_TYPE_COLORS.other;
                  return (
                    <MenuItem key={type.value} value={type.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box
                          sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: c.color }}
                        />
                        {type.label}
                      </Box>
                    </MenuItem>
                  );
                })}
              </TextField>
              <TextField
                fullWidth
                label={t('reportDate')}
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                required
                slotProps={{
                  inputLabel: { shrink: true },
                  htmlInput: { max: new Date().toISOString().split('T')[0] },
                }}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label={t('notes')}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                multiline
                rows={2}
                placeholder={t('notesPlaceholder')}
              />
            </CardContent>
          </Card>

          {/* Visibility Toggle */}
          <Card
            sx={{
              mb: 3,
              bgcolor: isShareable ? 'rgba(5,150,105,0.08)' : 'background.default',
              border: `1px solid ${isShareable ? 'rgba(5,150,105,0.35)' : 'transparent'}`,
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={isShareable}
                    onChange={(e) => setIsShareable(e.target.checked)}
                    color="secondary"
                  />
                }
                label={
                  <Box sx={{ ml: 0.5, display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    {isShareable ? (
                      <LockOpenOutlinedIcon
                        sx={{ fontSize: 20, color: 'secondary.main', mt: 0.1, flexShrink: 0 }}
                      />
                    ) : (
                      <LockOutlinedIcon
                        sx={{ fontSize: 20, color: 'text.secondary', mt: 0.1, flexShrink: 0 }}
                      />
                    )}
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {isShareable ? t('shareableTitle') : t('privateTitle')}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {isShareable ? t('shareableBody') : t('privateBody')}
                      </Typography>
                    </Box>
                  </Box>
                }
                sx={{ m: 0, alignItems: 'flex-start' }}
              />
            </CardContent>
          </Card>

          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={uploading || !file}
            sx={{ py: 1.75, fontSize: '1rem', boxShadow: '0 4px 14px rgba(37,99,235,0.3)' }}
          >
            {uploading ? progressLabel || `${t('uploading')} ${progress}%` : t('submitButton')}
          </Button>
        </Box>
      </Box>

      {/* Camera Capture — full screen, triggered by Scan button */}
      {showCamera && (
        <CameraCapture onCapture={handleCameraCapture} onClose={() => setShowCamera(false)} />
      )}
    </Box>
  );
}
