'use client';

import { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Report } from '@/types';
import { REPORT_TYPES } from '@/constants';
import { createClient } from '@/lib/supabase/client';
import ReportAnalysisCard from './ReportAnalysisCard';

interface ReportDetailDialogProps {
  report: Report | null;
  open: boolean;
  onClose: () => void;
  onUpdated: (updated: Report) => void;
  onDeleted: (id: string) => void;
}

export default function ReportDetailDialog({
  report,
  open,
  onClose,
  onUpdated,
  onDeleted,
}: ReportDetailDialogProps) {
  const [tab, setTab] = useState(0); // 0 = view, 1 = edit
  const [title, setTitle] = useState('');
  const [reportType, setReportType] = useState('');
  const [reportDate, setReportDate] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [loadingFile, setLoadingFile] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Load file URL when viewing
  const handleOpen = async () => {
    if (!report) return;
    setTitle(report.title);
    setReportType(report.report_type);
    setReportDate(report.report_date);
    setNotes(report.notes || '');
    setTab(0);
    setError('');
    setConfirmDelete(false);

    // Load signed URL
    setLoadingFile(true);
    try {
      const supabase = createClient();
      const { data } = await supabase.storage
        .from('reports')
        .createSignedUrl(report.file_path, 300);
      setFileUrl(data?.signedUrl || null);
    } catch {
      setFileUrl(null);
    } finally {
      setLoadingFile(false);
    }
  };

  // Load file URL and reset state when dialog opens with a report
  useEffect(() => {
    if (open && report) {
      handleOpen();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, report?.id]);

  const handleSave = async () => {
    if (!report) return;
    setError('');
    setSaving(true);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from('reports')
        .update({
          title,
          report_type: reportType,
          report_date: reportDate,
          notes: notes || null,
        })
        .eq('id', report.id);

      if (updateError) {
        setError(updateError.message);
        return;
      }

      onUpdated({
        ...report,
        title,
        report_type: reportType as Report['report_type'],
        report_date: reportDate,
        notes: notes || null,
      });
      onClose();
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!report) return;
    setDeleting(true);

    try {
      const supabase = createClient();

      // Delete file from storage
      await supabase.storage.from('reports').remove([report.file_path]);

      // Delete record from database
      const { error: deleteError } = await supabase
        .from('reports')
        .delete()
        .eq('id', report.id);

      if (deleteError) {
        setError(deleteError.message);
        return;
      }

      onDeleted(report.id);
      onClose();
    } catch {
      setError('Failed to delete. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  if (!report) return null;

  return (
    <Dialog open={open} onClose={onClose} fullScreen>
      {/* App Bar */}
      <AppBar position="sticky" color="inherit" elevation={1}>
        <Toolbar>
          <IconButton edge="start" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, ml: 1, fontWeight: 600 }} noWrap>
            {report.title}
          </Typography>
          {tab === 0 && (
            <IconButton onClick={() => setTab(1)} aria-label="Edit">
              <EditIcon />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      {/* Tabs */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} centered>
        <Tab label="View" />
        <Tab label="Edit" />
      </Tabs>

      <DialogContent sx={{ p: 0 }}>
        {/* View Tab */}
        {tab === 0 && (
          <Box>
            {loadingFile && (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography>Loading document...</Typography>
              </Box>
            )}
            {!loadingFile && fileUrl && report.mime_type === 'application/pdf' && (
              <iframe
                src={fileUrl}
                style={{ width: '100%', height: 'calc(100vh - 160px)', border: 'none' }}
                title="Report PDF"
              />
            )}
            {!loadingFile && fileUrl && report.mime_type?.startsWith('image/') && (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={fileUrl}
                  alt={report.title}
                  style={{ maxWidth: '100%', height: 'auto', borderRadius: 8 }}
                />
              </Box>
            )}
            {!loadingFile && !fileUrl && (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="error">Unable to load document.</Typography>
              </Box>
            )}
            {/* AI Analysis */}
            {!loadingFile && (
              <Box sx={{ px: 2, pb: 3 }}>
                <ReportAnalysisCard reportId={report.id} />
              </Box>
            )}
          </Box>
        )}

        {/* Edit Tab */}
        {tab === 1 && (
          <Box sx={{ p: 3, maxWidth: 500, mx: 'auto' }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <TextField
              fullWidth
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              select
              label="Report Type"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              required
              sx={{ mb: 2 }}
            >
              {REPORT_TYPES.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              label="Report Date"
              type="date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              required
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Notes (Optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              multiline
              rows={3}
              sx={{ mb: 3 }}
            />

            {/* Delete Section */}
            <Box
              sx={{
                mt: 4,
                pt: 3,
                borderTop: '1px solid',
                borderColor: 'divider',
              }}
            >
              {!confirmDelete ? (
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => setConfirmDelete(true)}
                  fullWidth
                >
                  Delete Report
                </Button>
              ) : (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    This will permanently delete this report and its file. This cannot be undone.
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      color="error"
                      size="small"
                      onClick={handleDelete}
                      disabled={deleting}
                    >
                      {deleting ? 'Deleting...' : 'Confirm Delete'}
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setConfirmDelete(false)}
                    >
                      Cancel
                    </Button>
                  </Box>
                </Alert>
              )}
            </Box>
          </Box>
        )}
      </DialogContent>

      {/* Save Button (only on edit tab) */}
      {tab === 1 && (
        <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
}
