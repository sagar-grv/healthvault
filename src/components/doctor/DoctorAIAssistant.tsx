'use client';

import { useState, useRef, useEffect } from 'react';
import Box from '@mui/material/Box';
import Fab from '@mui/material/Fab';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import Fade from '@mui/material/Fade';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { Profile, DoctorProfile } from '@/types';

// ── Types ──────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

interface DoctorAIAssistantProps {
  profile: Profile;
  doctorProfile: DoctorProfile | null;
  recentPatients: { id: string; full_name: string; health_id: string | null }[];
}

// ── Suggested questions ────────────────────────────────────────────────────────

const SUGGESTED_QUESTIONS = [
  'Which patients have abnormal results?',
  'What medications are my patients on?',
  'Who needs urgent follow-up?',
  'Any critical findings across my patients?',
];

// ── Simple markdown renderer ───────────────────────────────────────────────────

function MarkdownContent({ text }: { text: string }) {
  const html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '• $1')
    .replace(/\n/g, '<br />');

  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

// ── Typing indicator component ─────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1.5, py: 1 }}>
      {[0, 1, 2].map((i) => (
        <Box
          key={i}
          sx={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            bgcolor: 'secondary.main',
            animation: 'bounce 1.2s infinite',
            animationDelay: `${i * 0.2}s`,
            '@keyframes bounce': {
              '0%, 80%, 100%': { transform: 'scale(0.7)', opacity: 0.5 },
              '40%': { transform: 'scale(1)', opacity: 1 },
            },
          }}
        />
      ))}
    </Box>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function DoctorAIAssistant({
  profile,
  doctorProfile,
  recentPatients,
}: DoctorAIAssistantProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasUnread, setHasUnread] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const firstName = profile.full_name?.split(' ')[0] || 'Doctor';
  const specialty = doctorProfile?.specialization || doctorProfile?.qualification || '';
  const hasPatients = recentPatients.length > 0;
  const healthIds = recentPatients.map((p) => p.health_id).filter((id): id is string => !!id);

  // Auto-scroll to latest message
  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, open]);

  // Focus input when drawer opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open]);

  const handleClose = () => {
    setOpen(false);
    setInput('');
    setError('');
  };

  const handleSend = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setInput('');
    setError('');

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      text: trimmed,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      // Build history from current messages (exclude the just-added user message)
      const history = messages.map((m) => ({ role: m.role, text: m.text }));

      const res = await fetch('/api/doctor-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history,
          recentPatientHealthIds: healthIds,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || 'Something went wrong. Please try again.');
        setLoading(false);
        return;
      }

      const aiMsg: Message = {
        id: crypto.randomUUID(),
        role: 'ai',
        text: data.reply,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);

      // Mark unread if drawer is closed
      if (!open) setHasUnread(true);
    } catch {
      setError('Could not connect to AI assistant. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  const showSuggestions = messages.length === 0 && !loading;

  return (
    <>
      {/* ── Floating action button ──────────────────────────────────────── */}
      <Tooltip title="AI Assistant" placement="left">
        <Fab
          onClick={() => {
            setOpen(true);
            setHasUnread(false);
          }}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 20,
            width: 56,
            height: 56,
            background: 'linear-gradient(135deg, #047857, #10B981)',
            color: 'white',
            boxShadow: '0 4px 20px rgba(5,150,105,0.45)',
            zIndex: 1200,
            display: open ? 'none' : 'flex',
            '&:hover': {
              background: 'linear-gradient(135deg, #065F46, #047857)',
              transform: 'scale(1.05)',
            },
            transition: 'all 0.2s ease',
          }}
          aria-label="Open AI assistant"
        >
          {hasUnread ? (
            <Box sx={{ position: 'relative' }}>
              <ChatIcon sx={{ fontSize: 24 }} />
              <Box
                sx={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  bgcolor: 'warning.main',
                  border: '2px solid white',
                }}
              />
            </Box>
          ) : (
            <AutoAwesomeIcon sx={{ fontSize: 24 }} />
          )}
        </Fab>
      </Tooltip>

      {/* ── Chat drawer ─────────────────────────────────────────────────── */}
      <Fade in={open}>
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            bottom: 0,
            right: 0,
            zIndex: 1300,
            display: 'flex',
            flexDirection: 'column',
            // Mobile: full-width bottom sheet
            width: { xs: '100vw', sm: 380 },
            height: { xs: '85vh', sm: 560 },
            borderRadius: { xs: '20px 20px 0 0', sm: '16px 16px 0 0' },
            overflow: 'hidden',
            border: '1px solid #A7F3D0',
          }}
        >
          {/* Header */}
          <Box
            sx={{
              px: 2,
              py: 1.5,
              background: 'linear-gradient(135deg, #047857, #10B981)',
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              flexShrink: 0,
            }}
          >
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                bgcolor: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <AutoAwesomeIcon sx={{ fontSize: 18, color: 'white' }} />
            </Box>
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography
                sx={{ color: 'white', fontWeight: 700, fontSize: '0.9rem', lineHeight: 1.2 }}
              >
                HealthVault Assistant
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.72rem' }} noWrap>
                Dr. {firstName}
                {specialty ? ` · ${specialty}` : ''}
              </Typography>
            </Box>
            <IconButton
              onClick={handleClose}
              size="small"
              sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' } }}
              aria-label="Close assistant"
            >
              <CloseIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Box>

          {/* Messages area */}
          <Box
            sx={{
              flexGrow: 1,
              overflowY: 'auto',
              px: 2,
              py: 1.5,
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
              bgcolor: 'background.default',
            }}
          >
            {/* Welcome message */}
            {messages.length === 0 && (
              <Box
                sx={{
                  bgcolor: 'background.paper',
                  borderRadius: 2,
                  border: '1px solid rgba(5,150,105,0.25)',
                  p: 1.5,
                  display: 'flex',
                  gap: 1,
                  alignItems: 'flex-start',
                }}
              >
                <AutoAwesomeIcon
                  sx={{ fontSize: 16, color: 'secondary.main', flexShrink: 0, mt: 0.2 }}
                />
                <Typography variant="body2" sx={{ fontSize: '0.82rem', lineHeight: 1.5 }}>
                  {hasPatients
                    ? `Hello Dr. ${firstName}! I have access to your ${recentPatients.length} recent patient${recentPatients.length > 1 ? 's' : ''}'s shared records. Ask me anything.`
                    : `Hello Dr. ${firstName}! I don't have any patient data yet — search for a patient first to unlock patient-specific insights. I can still answer general medical questions.`}
                </Typography>
              </Box>
            )}

            {/* Suggested question chips */}
            {showSuggestions && hasPatients && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                {SUGGESTED_QUESTIONS.map((q) => (
                  <Chip
                    key={q}
                    label={q}
                    size="small"
                    onClick={() => handleSend(q)}
                    sx={{
                      fontSize: '0.72rem',
                      bgcolor: 'rgba(5,150,105,0.10)',
                      color: 'success.dark',
                      border: '1px solid rgba(5,150,105,0.25)',
                      cursor: 'pointer',
                      height: 'auto',
                      py: 0.5,
                      '& .MuiChip-label': { whiteSpace: 'normal', textAlign: 'left' },
                      '&:hover': { bgcolor: 'rgba(5,150,105,0.18)' },
                    }}
                  />
                ))}
              </Box>
            )}

            {/* Message bubbles */}
            {messages.map((msg) => (
              <Box
                key={msg.id}
                sx={{
                  display: 'flex',
                  flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                  alignItems: 'flex-end',
                  gap: 0.75,
                }}
              >
                {/* AI avatar */}
                {msg.role === 'ai' && (
                  <Box
                    sx={{
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      flexShrink: 0,
                      background: 'linear-gradient(135deg, #047857, #10B981)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 0.25,
                    }}
                  >
                    <AutoAwesomeIcon sx={{ fontSize: 13, color: 'white' }} />
                  </Box>
                )}

                <Box
                  sx={{
                    maxWidth: '78%',
                    bgcolor: msg.role === 'user' ? 'secondary.main' : 'background.paper',
                    color: msg.role === 'user' ? 'white' : 'text.primary',
                    borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    px: 1.5,
                    py: 1,
                    border: msg.role === 'ai' ? '1px solid' : 'none',
                    borderColor: msg.role === 'ai' ? 'divider' : 'transparent',
                    boxShadow: msg.role === 'ai' ? '0 1px 3px rgba(0,0,0,0.15)' : 'none',
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: '0.82rem',
                      lineHeight: 1.55,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    <MarkdownContent text={msg.text} />
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '0.65rem',
                      opacity: 0.6,
                      mt: 0.25,
                      textAlign: msg.role === 'user' ? 'right' : 'left',
                    }}
                  >
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                </Box>
              </Box>
            ))}

            {/* Typing indicator */}
            {loading && (
              <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.75 }}>
                <Box
                  sx={{
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    flexShrink: 0,
                    background: 'linear-gradient(135deg, #047857, #10B981)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <AutoAwesomeIcon sx={{ fontSize: 13, color: 'white' }} />
                </Box>
                <Box
                  sx={{
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: '16px 16px 16px 4px',
                    px: 1.5,
                    py: 0.5,
                  }}
                >
                  <TypingIndicator />
                </Box>
              </Box>
            )}

            {/* Error */}
            {error && !loading && (
              <Box
                sx={{
                  bgcolor: 'rgba(239,68,68,0.10)',
                  border: '1px solid rgba(239,68,68,0.35)',
                  borderRadius: 2,
                  px: 1.5,
                  py: 1,
                }}
              >
                <Typography sx={{ fontSize: '0.78rem', color: 'error.main' }}>{error}</Typography>
              </Box>
            )}

            <div ref={messagesEndRef} />
          </Box>

          {/* Input bar */}
          <Box
            sx={{
              px: 1.5,
              py: 1.25,
              borderTop: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
              display: 'flex',
              alignItems: 'flex-end',
              gap: 1,
              flexShrink: 0,
            }}
          >
            <TextField
              inputRef={inputRef}
              fullWidth
              multiline
              maxRows={3}
              placeholder="Ask about your patients..."
              value={input}
              onChange={(e) => {
                if (e.target.value.length <= 500) setInput(e.target.value);
              }}
              onKeyDown={handleKeyDown}
              disabled={loading}
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  fontSize: '0.83rem',
                  borderRadius: 3,
                  bgcolor: 'background.default',
                  '&.Mui-focused fieldset': { borderColor: 'secondary.main' },
                },
              }}
            />
            <IconButton
              onClick={() => handleSend(input)}
              disabled={loading || !input.trim()}
              sx={{
                width: 38,
                height: 38,
                flexShrink: 0,
                bgcolor: input.trim() && !loading ? 'secondary.main' : 'action.disabledBackground',
                color: input.trim() && !loading ? 'white' : 'text.disabled',
                borderRadius: 2,
                transition: 'all 0.15s',
                '&:hover': {
                  bgcolor:
                    input.trim() && !loading ? 'secondary.dark' : 'action.disabledBackground',
                },
                '&.Mui-disabled': { bgcolor: 'action.disabledBackground', color: 'text.disabled' },
              }}
              aria-label="Send message"
            >
              {loading ? (
                <CircularProgress size={16} sx={{ color: 'text.disabled' }} />
              ) : (
                <SendIcon sx={{ fontSize: 16 }} />
              )}
            </IconButton>
          </Box>

          {/* Character counter */}
          {input.length > 400 && (
            <Box sx={{ px: 2, pb: 0.5, bgcolor: 'background.paper' }}>
              <Typography
                sx={{
                  fontSize: '0.68rem',
                  color: input.length >= 500 ? 'error.main' : 'text.disabled',
                }}
              >
                {input.length}/500
              </Typography>
            </Box>
          )}
        </Paper>
      </Fade>
    </>
  );
}
