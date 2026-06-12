'use client';

import { useState, useCallback, useRef } from 'react';
import { getAiLanguage, setAiLanguage } from '@/lib/utils/language';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Divider from '@mui/material/Divider';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import StopIcon from '@mui/icons-material/Stop';
import CloseIcon from '@mui/icons-material/Close';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'हिंदी (Hindi)' },
  { code: 'ta', name: 'தமிழ் (Tamil)' },
  { code: 'te', name: 'తెలుగు (Telugu)' },
  { code: 'mr', name: 'मराठी (Marathi)' },
  { code: 'bn', name: 'বাংলা (Bengali)' },
  { code: 'gu', name: 'ગુજરાતી (Gujarati)' },
  { code: 'kn', name: 'ಕನ್ನಡ (Kannada)' },
  { code: 'ml', name: 'മലയാളം (Malayalam)' },
  { code: 'pa', name: 'ਪੰਜਾਬੀ (Punjabi)' },
  { code: 'or', name: 'ଓଡ଼ିଆ (Odia)' },
  { code: 'as', name: 'অসমীয়া (Assamese)' },
];

// Maps our language codes to BCP-47 for Web Speech API
const SPEECH_LANG_MAP: Record<string, string> = {
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

interface AbnormalItem {
  name: string;
  yourValue: string;
  normalRange: string;
  whatItMeans: string;
  isHigh: boolean;
}

interface InterpretationResult {
  headline: string;
  explanation: string;
  keyPoints: string[];
  abnormalItems: AbnormalItem[];
  actionAdvice: string;
  audioText: string;
}

interface HealthInterpreterProps {
  reportId: string;
  reportTitle: string;
  defaultLanguage?: string;
  open: boolean;
  onClose: () => void;
}

export default function HealthInterpreter({
  reportId,
  reportTitle,
  defaultLanguage = 'en',
  open,
  onClose,
}: HealthInterpreterProps) {
  // Self-initialise from saved preference — ignores defaultLanguage prop so the
  // user's stored language (AI or UI locale) is always used on first open.
  const [language, setLanguage] = useState<string>(() => getAiLanguage() || defaultLanguage);
  const [result, setResult] = useState<InterpretationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const stopSpeaking = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setSpeaking(false);
  }, []);

  const interpret = useCallback(
    async (lang: string) => {
      setLoading(true);
      setError(null);
      setResult(null);
      stopSpeaking();
      try {
        const res = await fetch('/api/interpret-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reportId, language: lang }),
        });

        if (!res.ok) {
          const data = await res.json();
          setError(data.error || 'Could not interpret this report.');
          return;
        }

        const data = await res.json();
        setResult(data);
      } catch {
        setError('Network error. Please check your connection.');
      } finally {
        setLoading(false);
      }
    },
    [reportId, stopSpeaking]
  );

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    // Persist AI language preference (does NOT affect app UI language)
    setAiLanguage(lang);
    if (result) {
      // Re-interpret in new language
      interpret(lang);
    }
  };

  const speak = useCallback(() => {
    if (!result?.audioText) return;

    if (speaking) {
      stopSpeaking();
      return;
    }

    if (!window.speechSynthesis) {
      setError('Text-to-speech is not supported in this browser.');
      return;
    }

    const utterance = new SpeechSynthesisUtterance(result.audioText);
    utterance.lang = SPEECH_LANG_MAP[language] || 'en-IN';
    utterance.rate = 0.9; // Slightly slower for clarity
    utterance.pitch = 1;

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [result, speaking, language, stopSpeaking]);

  const handleClose = () => {
    stopSpeaking();
    onClose();
  };

  // Auto-interpret on first open
  const handleOpen = useCallback(() => {
    if (!result && !loading) {
      interpret(language);
    }
  }, [result, loading, language, interpret]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      slotProps={{ transition: { onEntered: handleOpen } }}
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: 3,
          maxHeight: '90vh',
        },
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutoAwesomeIcon sx={{ color: '#7C3AED' }} />
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              Explain This Report
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              noWrap
              sx={{ maxWidth: 200, display: 'block' }}
            >
              {reportTitle}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ px: 2.5, py: 2 }}>
        {/* Language Selector */}
        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel>Language</InputLabel>
          <Select
            value={language}
            label="Language"
            onChange={(e) => handleLanguageChange(e.target.value)}
          >
            {LANGUAGES.map((l) => (
              <MenuItem key={l.code} value={l.code}>
                {l.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Loading */}
        {loading && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress size={32} sx={{ color: 'secondary.main' }} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Reading your report...
            </Typography>
          </Box>
        )}

        {/* Error */}
        {error && !loading && (
          <Box>
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
            <Button variant="contained" fullWidth onClick={() => interpret(language)}>
              Try Again
            </Button>
          </Box>
        )}

        {/* Result */}
        {result && !loading && (
          <Box>
            {/* Headline + Listen button */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 1,
                mb: 2,
              }}
            >
              <Typography
                variant="h6"
                sx={{ fontWeight: 700, fontSize: '1.05rem', lineHeight: 1.3 }}
              >
                {result.headline}
              </Typography>
              <IconButton
                onClick={speak}
                size="small"
                sx={{
                  bgcolor: speaking ? 'secondary.main' : 'rgba(124,58,237,0.10)',
                  color: speaking ? 'secondary.contrastText' : 'secondary.main',
                  flexShrink: 0,
                  '&:hover': { bgcolor: speaking ? 'secondary.dark' : 'rgba(124,58,237,0.18)' },
                }}
              >
                {speaking ? <StopIcon fontSize="small" /> : <VolumeUpIcon fontSize="small" />}
              </IconButton>
            </Box>

            {/* Explanation */}
            <Typography variant="body2" sx={{ lineHeight: 1.7, color: 'text.primary', mb: 2 }}>
              {result.explanation}
            </Typography>

            {/* Key Points */}
            {result.keyPoints?.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 600,
                    color: 'text.secondary',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  Key Points
                </Typography>
                <Box sx={{ mt: 1 }}>
                  {result.keyPoints.map((point, i) => (
                    <Box
                      key={i}
                      sx={{ display: 'flex', gap: 1, mb: 0.75, alignItems: 'flex-start' }}
                    >
                      <CheckCircleIcon
                        sx={{ fontSize: 16, color: 'secondary.main', mt: 0.2, flexShrink: 0 }}
                      />
                      <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
                        {point}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            {/* Abnormal Values */}
            {result.abnormalItems?.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 600,
                    color: 'text.secondary',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  Values to Note
                </Typography>
                <Box sx={{ mt: 1 }}>
                  {result.abnormalItems.map((item, i) => (
                    <Box
                      key={i}
                      sx={{
                        p: 1.5,
                        mb: 1,
                        borderRadius: 2,
                        bgcolor: item.isHigh ? 'rgba(239,68,68,0.10)' : 'rgba(37,99,235,0.08)',
                        border: `1px solid ${item.isHigh ? 'rgba(239,68,68,0.35)' : 'rgba(37,99,235,0.25)'}`,
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          mb: 0.5,
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {item.name}
                        </Typography>
                        <Chip
                          icon={
                            item.isHigh ? (
                              <TrendingUpIcon sx={{ fontSize: 14 }} />
                            ) : (
                              <TrendingDownIcon sx={{ fontSize: 14 }} />
                            )
                          }
                          label={item.yourValue}
                          size="small"
                          sx={{
                            bgcolor: item.isHigh ? 'rgba(239,68,68,0.15)' : 'rgba(37,99,235,0.12)',
                            color: item.isHigh ? 'error.main' : 'primary.main',
                            fontWeight: 700,
                            fontSize: '0.7rem',
                          }}
                        />
                      </Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block' }}
                      >
                        Normal: {item.normalRange}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontSize: '0.8rem', mt: 0.5, color: 'text.primary' }}
                      >
                        {item.whatItMeans}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            {/* Action Advice */}
            {result.actionAdvice && (
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: 'rgba(5,150,105,0.08)',
                  border: '1px solid rgba(5,150,105,0.35)',
                }}
              >
                <Typography variant="body2" sx={{ color: 'success.dark', fontWeight: 500 }}>
                  💡 {result.actionAdvice}
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
