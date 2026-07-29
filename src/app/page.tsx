'use client';

import Link from 'next/link';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SearchIcon from '@mui/icons-material/Search';
import TimelineIcon from '@mui/icons-material/Timeline';
import LockIcon from '@mui/icons-material/LockOutlined';
import TranslateIcon from '@mui/icons-material/Translate';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const features = [
  {
    icon: <AutoAwesomeIcon />,
    title: 'Explain Any Report',
    desc: 'Upload a prescription, lab report, or scan. Get a plain-language explanation in your language.',
    color: '#EFF6FF',
    iconColor: 'primary.main',
  },
  {
    icon: <FactCheckIcon />,
    title: 'See the Evidence',
    desc: 'Every claim is tagged with its source. You see what comes from the report vs. what is general information.',
    color: '#F0FDF4',
    iconColor: 'secondary.main',
  },
  {
    icon: <TranslateIcon />,
    title: 'Your Language',
    desc: 'Explanations in English, Hindi, Tamil, Telugu, Marathi, Bengali, and more.',
    color: '#FFF7ED',
    iconColor: '#C2410C',
  },
  {
    icon: <TimelineIcon />,
    title: 'Track Over Time',
    desc: 'Compare lab results across months. See trends. Know when something changes.',
    color: '#F5F3FF',
    iconColor: 'secondary.main',
  },
  {
    icon: <SearchIcon />,
    title: 'Ask Your Records',
    desc: 'Search your entire medical history. Get answers with source cards.',
    color: '#ECFDF5',
    iconColor: '#059669',
  },
  {
    icon: <LockIcon />,
    title: 'Private by Default',
    desc: 'Your reports stay private. Share only when you choose. Full audit trail.',
    color: '#FEF2F2',
    iconColor: '#DC2626',
  },
];

export default function LandingPage() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Hero */}
      <Box sx={{ pt: { xs: 8, md: 12 }, pb: { xs: 6, md: 8 }, textAlign: 'center' }}>
        <Container maxWidth="sm">
          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              fontSize: { xs: '1.75rem', md: '2.5rem' },
              lineHeight: 1.2,
              mb: 2,
            }}
          >
            Understand your medical reports.
            <br />
            Know what to ask next.
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mb: 4, maxWidth: 480, mx: 'auto' }}
          >
            Upload a report. Get a clear explanation in your language. Every fact traced back to the
            source. No guesswork.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              component={Link}
              href="/register"
              variant="contained"
              size="large"
              endIcon={<ArrowForwardIcon />}
            >
              Get Started
            </Button>
            <Button component={Link} href="/login" variant="outlined" size="large">
              Sign In
            </Button>
          </Box>
        </Container>
      </Box>

      {/* How it works */}
      <Container maxWidth="md" sx={{ pb: { xs: 6, md: 8 } }}>
        <Typography variant="h5" sx={{ fontWeight: 700, textAlign: 'center', mb: 4 }}>
          How it works
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
          {[
            {
              step: '1',
              title: 'Upload',
              desc: 'Take a photo or upload a PDF of your medical report.',
            },
            {
              step: '2',
              title: 'Understand',
              desc: 'AI reads your report and explains it in plain language.',
            },
            {
              step: '3',
              title: 'Ask',
              desc: 'Follow up with questions. Every answer shows its source.',
            },
          ].map((s) => (
            <Card
              key={s.step}
              sx={{ flex: 1, textAlign: 'center', border: '1px solid', borderColor: 'divider' }}
            >
              <CardContent sx={{ py: 3 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    bgcolor: 'secondary.main',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 1.5,
                    fontWeight: 700,
                    fontSize: '1.1rem',
                  }}
                >
                  {s.step}
                </Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {s.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {s.desc}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Container>

      {/* Features */}
      <Box sx={{ bgcolor: 'grey.50', py: { xs: 6, md: 8 } }}>
        <Container maxWidth="md">
          <Typography variant="h5" sx={{ fontWeight: 700, textAlign: 'center', mb: 4 }}>
            Everything you need to understand your health
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            {features.map((f) => (
              <Card key={f.title} sx={{ border: '1px solid', borderColor: 'divider' }}>
                <CardContent sx={{ display: 'flex', gap: 1.5, p: 2.5 }}>
                  <Box sx={{ color: f.iconColor, mt: 0.25, flexShrink: 0 }}>{f.icon}</Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.25 }}>
                      {f.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {f.desc}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Container>
      </Box>

      {/* Evidence tagline */}
      <Box sx={{ py: { xs: 6, md: 8 }, textAlign: 'center' }}>
        <Container maxWidth="sm">
          <AutoAwesomeIcon sx={{ fontSize: 32, color: 'secondary.main', mb: 1.5 }} />
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            Every claim, traced to its source
          </Typography>
          <Typography variant="body2" color="text.secondary">
            HealthVault does not guess. Every piece of information is labeled — from your report,
            general medical knowledge, or AI interpretation. You always know where it comes from.
          </Typography>
        </Container>
      </Box>

      {/* Footer CTA */}
      <Box sx={{ bgcolor: 'grey.900', color: 'white', py: 6, textAlign: 'center' }}>
        <Container maxWidth="sm">
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
            Ready to understand your reports?
          </Typography>
          <Typography variant="body2" sx={{ mb: 3, color: 'grey.400' }}>
            Free. No credit card. Your data stays yours.
          </Typography>
          <Button
            component={Link}
            href="/register"
            variant="contained"
            size="large"
            color="secondary"
          >
            Get Started Free
          </Button>
        </Container>
      </Box>
    </Box>
  );
}
