'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
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
import { isOnline, queueUpload } from '@/lib/offline/db';
import ThemeToggle from '@/components/ThemeToggle';

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

  // Handle camera capture — pre-fills the file field with the first captured image
  const handleCameraCapture = (images: Blob[]) => {
    setShowCamera(false);
    if (!images.length) return;
    const blob = images[0];
    const capturedFile = new File([blob], 'scanned-report.jpg', { type: 'image/jpeg' });
    setFile(capturedFile);
    setCompressionInfo(null);
    if (!title) setTitle('Scanned Report');
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
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError(t('sessionExpired'));
        setUploading(false);
        return;
      }

      // If offline, queue the upload for later
      if (!isOnline()) {
        const reportId = crypto.randomUUID();
        const filePath = `${user.id}/${reportId}/${file.name}`;
        await queueUpload({
          file,
          fileName: file.name,
          mimeType: file.type,
          title,
          reportType,
          reportDate,
          notes,
          isShareable,
          filePath,
        });
        setProgress(100);
        setProgressLabel(t('done'));
        router.push('/dashboard/patient');
        router.refresh();
        return;
      }

      // Step 1: Optimize image (skip for PDFs)
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
          // If optimization fails, upload original
          uploadBlob = file;
        }
      }

      // Step 2: Upload to Supabase Storage
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

      // Step 3: Upload thumbnail (if generated)
      let thumbnailPath: string | null = null;
      if (thumbnailBlob) {
        setProgressLabel(t('savingThumbnail'));
        thumbnailPath = `${user.id}/${reportId}/thumb.jpg`;
        await supabase.storage
          .from('reports')
          .upload(thumbnailPath, thumbnailBlob, { contentType: 'image/jpeg', upsert: false });
      }
      setProgress(85);

      // Step 4: Save to database
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
      router.push('/dashboard/patient');
      router.refresh();
    } catch {
      setError(t('unknownError'));
    } finally {
      setUploading(false);
    }
  };

  const fileIcon =
    file?.type === 'application/pdf' ? (
      <PictureAsPdfIcon sx={{ fontSize: 36, color: '#EF4444' }} />
    ) : file?.type?.startsWith('image/') ? (
      <ImageIcon sx={{ fontSize: 36, color: '#8B5CF6' }} />
    ) : (
      <InsertDriveFileIcon sx={{ fontSize: 36, color: '#2563EB' }} />
    );

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 4 }}>
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

      {uploading && (
        <Box
          sx={{
            position: 'sticky',
            top: 64,
            zIndex: 10,
            bgcolor: 'background.paper',
            px: 2,
            py: 1,
          }}
        >
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{ height: 4, borderRadius: 2 }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            {progressLabel || `${t('uploading')} ${progress}%`}
          </Typography>
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
              border: `2px dashed ${dragOver ? '#2563EB' : file ? '#059669' : 'transparent'}`,
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
              '&:hover': { borderColor: '#2563EB', bgcolor: 'rgba(37,99,235,0.08)' },
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
                  <CloudUploadIcon sx={{ fontSize: 28, color: '#2563EB' }} />
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
                slotProps={{ inputLabel: { shrink: true } }}
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
