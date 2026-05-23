'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import StopIcon from '@mui/icons-material/Stop';
import CloseIcon from '@mui/icons-material/Close';
import TranslateIcon from '@mui/icons-material/Translate';
import { ExtractedReportData } from '@/lib/ai/report-extractor';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी (Hindi)' },
  { code: 'ta', label: 'தமிழ் (Tamil)' },
  { code: 'te', label: 'తెలుగు (Telugu)' },
  { code: 'mr', label: 'मराठी (Marathi)' },
  { code: 'bn', label: 'বাংলা (Bengali)' },
  { code: 'gu', label: 'ગુજરાતી (Gujarati)' },
  { code: 'kn', label: 'ಕನ್ನಡ (Kannada)' },
  { code: 'ml', label: 'മലയാളം (Malayalam)' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ (Punjabi)' },
  { code: 'or', label: 'ଓଡ଼ିଆ (Odia)' },
  { code: 'as', label: 'অসমীয়া (Assamese)' },
];

interface Highlight {
  name: string;
  value: string;
  status: 'normal' | 'high' | 'low';
  meaning: string;
}

interface ReportExplanationProps {
  open: boolean;
  onClose: () => void;
  extractedData: ExtractedReportData;
  defaultLanguage?: string;
}

export default function ReportExplanation({
  open,
  onClose,
  extractedData,
  defaultLanguage = 'en',
}: ReportExplanationProps) {
  const [language, setLanguage] = useState(defaultLanguage);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [speaking, setSpeaking] = useState(false);

  const fetchExplanation = async (lang: string) => {
    setLoading(true);
    setError(null);
    setExplanation(null);
    setHighlights([]);

    try {
      const response = await fetch('/api/explain-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extractedData, language: lang }),
      });

      if (!response.ok) {
        const err = await response.json();
        setError(err.error || 'Could not generate explanation.');
        return;
      }

      const data = await response.json();
      setExplanation(data.explanation);
      setHighlights(data.highlights || []);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch on first open or language change
  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    fetchExplanation(newLang);
  };

  // Fetch on dialog open if no explanation yet
  const handleOpen = () => {
    if (!explanation && !loading) {
      fetchExplanation(language);
    }
  };

  // Text-to-Speech
  const speak = () => {
    if (!explanation) return;

    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(explanation);
    utterance.lang = getVoiceLang(language);
    utterance.rate = 0.9; // Slightly slower for clarity
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  };

  // Stop speech on close
  const handleClose = () => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
    onClose();
  };

  // Map language code to BCP-47 voice tag
  function getVoiceLang(code: string): string {
    const map: Record<string, string> = {
      en: 'en-IN',
      hi: 'hi-IN',
      ta: 'ta-IN',
      te: 'te-IN',
      mr: 'mr-IN',
      bn: 'bn-IN',
      gu: 'gu-IN',
      kn: 'kn-IN',
      ml: 'ml-IN',
      pa: 'pa-IN',
      or: 'or-IN',
      as: 'as-IN',
    };
    return map[code] || 'en-IN';
  }

  const statusColor = (status: string) => {
    if (status === 'high' || status === 'low') return '#DC2626';
    return '#059669';
  };

  const statusBg = (status: string) => {
    if (status === 'high' || status === 'low') return '#FEF2F2';
    return '#F0FDF4';
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      onTransitionEnd={() => {
        if (open) handleOpen();
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Report Explanation
        </Typography>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {/* Language selector */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <TranslateIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
          <TextField
            select
            size="small"
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            sx={{ minWidth: 160 }}
          >
            {LANGUAGES.map((l) => (
              <MenuItem key={l.code} value={l.code}>
                {l.label}
              </MenuItem>
            ))}
          </TextField>
        </Box>

        {/* Loading state */}
        {loading && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress size={32} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Reading your report...
            </Typography>
          </Box>
        )}

        {/* Error state */}
        {error && (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography color="error" sx={{ mb: 2 }}>
              {error}
            </Typography>
            <Button variant="outlined" size="small" onClick={() => fetchExplanation(language)}>
              Try Again
            </Button>
          </Box>
        )}

        {/* Explanation */}
        {explanation && (
          <>
            {/* Listen button */}
            <Button
              variant={speaking ? 'contained' : 'outlined'}
              color={speaking ? 'error' : 'primary'}
              startIcon={speaking ? <StopIcon /> : <VolumeUpIcon />}
              onClick={speak}
              fullWidth
              sx={{ mb: 2 }}
            >
              {speaking ? 'Stop' : 'Listen'}
            </Button>

            {/* Text explanation */}
            <Box
              sx={{
                p: 2,
                bgcolor: '#F9FAFB',
                borderRadius: 2,
                mb: 2,
                lineHeight: 1.8,
              }}
            >
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', fontSize: '1rem' }}>
                {explanation}
              </Typography>
            </Box>

            {/* Highlights (test values with status) */}
            {highlights.length > 0 && (
              <Box>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, mb: 1, color: 'text.secondary' }}
                >
                  Key Values
                </Typography>
                {highlights.map((h, i) => (
                  <Box
                    key={i}
                    sx={{
                      p: 1.5,
                      mb: 1,
                      borderRadius: 2,
                      bgcolor: statusBg(h.status),
                      border: `1px solid ${h.status === 'normal' ? '#BBF7D0' : '#FECACA'}`,
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {h.name}
                      </Typography>
                      <Chip
                        label={`${h.value} — ${h.status.toUpperCase()}`}
                        size="small"
                        sx={{
                          bgcolor: statusColor(h.status),
                          color: 'white',
                          fontWeight: 600,
                          fontSize: '0.7rem',
                        }}
                      />
                    </Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 0.5, display: 'block' }}
                    >
                      {h.meaning}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
