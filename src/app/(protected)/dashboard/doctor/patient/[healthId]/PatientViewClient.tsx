'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DescriptionIcon from '@mui/icons-material/DescriptionOutlined';
import CloseIcon from '@mui/icons-material/Close';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CalendarTodayIcon from '@mui/icons-material/CalendarTodayOutlined';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Report } from '@/types';
import { REPORT_TYPES, REPORT_TYPE_COLORS } from '@/constants';
import { createClient } from '@/lib/supabase/client';
import ReportAnalysisCard from '@/components/patient/ReportAnalysisCard';
import PatientInsightsCard from '@/components/doctor/PatientInsightsCard';

interface PatientViewClientProps {
  found: boolean;
  healthId: string;
  patientName: string;
  reports: Report[];
  doctorId: string;
  doctorName: string;
  hasActiveShare: boolean;
}

export default function PatientViewClient({
  found,
  healthId,
  patientName,
  reports,
  hasActiveShare,
}: PatientViewClientProps) {
  const router = useRouter();
  const [viewingReport, setViewingReport] = useState<Report | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [loadingFile, setLoadingFile] = useState(false);

  const handleViewReport = async (report: Report) => {
    setViewingReport(report);
    setFileUrl(null);
    setLoadingFile(true);
    try {
      const supabase = createClient();
      const { data } = await supabase.storage
        .from('reports')
        .createSignedUrl(report.file_path, 3600);
      setFileUrl(data?.signedUrl || null);
    } catch {
      setFileUrl(null);
    } finally {
      setLoadingFile(false);
    }
  };

  const getReportTypeLabel = (type: string) =>
    REPORT_TYPES.find((t) => t.value === type)?.label || type;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="sticky" color="inherit" elevation={0}>
        <Toolbar>
          <IconButton edge="start" onClick={() => router.push('/dashboard/doctor')}>
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ ml: 1 }}>
            <Typography variant="h6">Patient Records</Typography>
            {found && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  display: 'block',
                  lineHeight: 1,
                  mt: -0.25,
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {healthId}
              </Typography>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      <Breadcrumbs sx={{ px: 2, pt: 1.5 }} aria-label="breadcrumb">
        <Link
          href="/dashboard/doctor"
          style={{ color: 'inherit', textDecoration: 'none', fontSize: '0.8rem' }}
        >
          Dashboard
        </Link>
        <Typography color="text.primary" sx={{ fontSize: '0.8rem' }}>
          {patientName}
        </Typography>
      </Breadcrumbs>

      <Box sx={{ px: 2, py: 3, maxWidth: 600, mx: 'auto' }}>
        {/* Not Found */}
        {!found && (
          <Card
            className="animate-fade-in-up"
            sx={{
              textAlign: 'center',
              py: 7,
              border: '2px dashed',
              borderColor: 'divider',
              bgcolor: 'transparent',
              boxShadow: 'none',
            }}
          >
            <CardContent>
              <Box
                sx={{
                  width: 72,
                  height: 72,
                  borderRadius: 4,
                  bgcolor: 'rgba(239,68,68,0.10)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2.5,
                }}
              >
                <ErrorOutlineIcon sx={{ fontSize: 32, color: 'error.main' }} />
              </Box>
              <Typography variant="h4" sx={{ mb: 1 }}>
                Patient Not Found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                No patient found with Health ID:
              </Typography>
              <Typography
                sx={{
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  mb: 3,
                  color: 'text.primary',
                }}
              >
                {healthId}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Please ask the patient to confirm their Health ID and try again.
              </Typography>
              <Button variant="contained" onClick={() => router.push('/dashboard/doctor')}>
                Back to Search
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Patient Found */}
        {found && (
          <>
            {/* Patient Info Card */}
            <Card
              className="animate-fade-in-up"
              sx={{
                mb: 3,
                bgcolor: 'rgba(5,150,105,0.08)',
                border: '1px solid rgba(5,150,105,0.30)',
              }}
            >
              <CardContent sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  sx={{
                    width: 48,
                    height: 48,
                    background: 'linear-gradient(135deg, #047857, #10B981)',
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    boxShadow: '0 4px 12px rgba(5,150,105,0.40)',
                  }}
                >
                  {patientName.charAt(0).toUpperCase()}
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h5" sx={{ mb: 0.25 }}>
                    {patientName}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      fontFamily: 'var(--font-mono)',
                      color: 'success.dark',
                      fontWeight: 600,
                    }}
                  >
                    {healthId}
                  </Typography>
                </Box>
                {hasActiveShare && (
                  <Chip
                    label={`${reports.length} report${reports.length !== 1 ? 's' : ''}`}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(5,150,105,0.15)',
                      color: 'success.dark',
                      fontWeight: 600,
                    }}
                  />
                )}
              </CardContent>
            </Card>

            {hasActiveShare ? (
              <>
                {/* Access logged notice */}
                <Alert severity="info" icon={<InfoOutlinedIcon />} sx={{ mb: 2.5 }}>
                  This access is logged. {patientName.split(' ')[0]} can see that you viewed their
                  records.
                </Alert>

                {/* AI Clinical Insights */}
                {reports.length > 0 && (
                  <PatientInsightsCard reports={reports} patientName={patientName} />
                )}

                {/* No Shareable Reports */}
                {reports.length === 0 && (
                  <Card
                    sx={{
                      textAlign: 'center',
                      py: 6,
                      border: '2px dashed',
                      borderColor: 'divider',
                      bgcolor: 'transparent',
                      boxShadow: 'none',
                    }}
                  >
                    <CardContent>
                      <Box
                        sx={{
                          width: 64,
                          height: 64,
                          borderRadius: 4,
                          bgcolor: 'rgba(37,99,235,0.10)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mx: 'auto',
                          mb: 2,
                        }}
                      >
                        <InfoOutlinedIcon sx={{ fontSize: 28, color: 'primary.main' }} />
                      </Box>
                      <Typography variant="h5" sx={{ mb: 1 }}>
                        No Shared Reports
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ maxWidth: 280, mx: 'auto' }}
                      >
                        Ask {patientName.split(' ')[0]} to open HealthVault and share reports before
                        your appointment.
                      </Typography>
                    </CardContent>
                  </Card>
                )}

                {/* Reports list */}
                {reports.length > 0 && (
                  <Box
                    sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}
                    className="stagger-children"
                  >
                    {reports.map((report) => {
                      const typeColor =
                        REPORT_TYPE_COLORS[report.report_type] || REPORT_TYPE_COLORS.other;
                      return (
                        <Card
                          key={report.id}
                          onClick={() => handleViewReport(report)}
                          sx={{
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              transform: 'translateY(-1px)',
                              boxShadow: '0 8px 24px rgba(0,0,0,0.22)',
                            },
                          }}
                        >
                          <CardContent
                            sx={{
                              p: 2,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 2,
                              '&:last-child': { pb: 2 },
                            }}
                          >
                            <Box
                              sx={{
                                width: 44,
                                height: 44,
                                borderRadius: 2.5,
                                flexShrink: 0,
                                bgcolor: typeColor.bg,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <DescriptionIcon sx={{ fontSize: 22, color: typeColor.color }} />
                            </Box>
                            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                              <Typography variant="body1" sx={{ fontWeight: 600 }} noWrap>
                                {report.title}
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.25 }}>
                                <Chip
                                  label={getReportTypeLabel(report.report_type)}
                                  size="small"
                                  sx={{
                                    bgcolor: typeColor.bg,
                                    color: typeColor.color,
                                    fontWeight: 600,
                                    fontSize: '0.68rem',
                                    height: 20,
                                  }}
                                />
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <CalendarTodayIcon
                                    sx={{ fontSize: 11, color: 'text.disabled' }}
                                  />
                                  <Typography variant="caption" color="text.secondary">
                                    {new Date(report.report_date).toLocaleDateString('en-IN', {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric',
                                    })}
                                  </Typography>
                                </Box>
                              </Box>
                              {report.notes && (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  noWrap
                                  sx={{ display: 'block', mt: 0.25 }}
                                >
                                  {report.notes}
                                </Typography>
                              )}
                            </Box>
                            <OpenInNewIcon
                              sx={{ fontSize: 18, color: 'text.disabled', flexShrink: 0 }}
                            />
                          </CardContent>
                        </Card>
                      );
                    })}
                  </Box>
                )}
              </>
            ) : (
              <Card
                sx={{
                  textAlign: 'center',
                  py: 6,
                  border: '2px dashed',
                  borderColor: 'error.main',
                  bgcolor: 'transparent',
                  boxShadow: 'none',
                }}
              >
                <CardContent>
                  <Box
                    sx={{
                      width: 64,
                      height: 64,
                      borderRadius: 4,
                      bgcolor: 'rgba(239,68,68,0.10)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 2,
                    }}
                  >
                    <WarningAmberIcon sx={{ fontSize: 28, color: 'error.main' }} />
                  </Box>
                  <Typography variant="h5" sx={{ mb: 1 }}>
                    No Reports Available
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ maxWidth: 320, mx: 'auto' }}
                  >
                    {patientName.split(' ')[0]} has not shared any reports with you yet. Ask them to
                    share their medical reports.
                  </Typography>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </Box>

      {/* Report Viewer Dialog */}
      <Dialog
        open={!!viewingReport}
        onClose={() => {
          setViewingReport(null);
          setFileUrl(null);
        }}
        fullScreen
      >
        <AppBar position="sticky" color="inherit" elevation={0}>
          <Toolbar>
            <IconButton
              edge="start"
              onClick={() => {
                setViewingReport(null);
                setFileUrl(null);
              }}
            >
              <CloseIcon />
            </IconButton>
            <Box sx={{ ml: 1, flexGrow: 1, minWidth: 0 }}>
              <Typography variant="h6" noWrap>
                {viewingReport?.title}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {viewingReport ? getReportTypeLabel(viewingReport.report_type) : ''}
              </Typography>
            </Box>
            {fileUrl && (
              <IconButton
                component="a"
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open in new tab"
              >
                <OpenInNewIcon />
              </IconButton>
            )}
          </Toolbar>
          <Divider />
        </AppBar>
        <DialogContent sx={{ p: 0 }}>
          {loadingFile && (
            <Box sx={{ p: 6, textAlign: 'center' }}>
              <Box className="skeleton" sx={{ width: '100%', height: 60, mb: 2 }} />
              <Box className="skeleton" sx={{ width: '80%', height: 400 }} />
            </Box>
          )}
          {!loadingFile && fileUrl && viewingReport?.mime_type === 'application/pdf' && (
            <iframe
              src={fileUrl}
              style={{ width: '100%', height: 'calc(100vh - 64px)', border: 'none' }}
              title="Report PDF"
            />
          )}
          {!loadingFile && fileUrl && viewingReport?.mime_type?.startsWith('image/') && (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={fileUrl}
                alt={viewingReport?.title || 'Report'}
                style={{ maxWidth: '100%', height: 'auto', borderRadius: 12 }}
              />
            </Box>
          )}
          {!loadingFile && !fileUrl && viewingReport !== null && (
            <Box sx={{ p: 6, textAlign: 'center' }}>
              <ErrorOutlineIcon sx={{ fontSize: 48, color: 'error.main', mb: 2 }} />
              <Typography color="error">Unable to load document. Please try again.</Typography>
            </Box>
          )}
          {!loadingFile && viewingReport && (
            <Box sx={{ px: 2, pb: 3 }}>
              <ReportAnalysisCard reportId={viewingReport.id} />
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
