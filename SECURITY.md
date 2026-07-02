# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

HealthVault is currently in pre-launch (0.1.x). Security updates are applied to the latest version on `main`.

## Reporting a Vulnerability

If you discover a security vulnerability in HealthVault, please report it responsibly.

**Do NOT open a public GitHub issue for security vulnerabilities.**

### How to Report

1. **Email**: Send details to the repository maintainer via GitHub
2. **Include**:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### What to Expect

- **Acknowledgment**: Within 48 hours of your report
- **Assessment**: We will evaluate the severity and impact
- **Fix timeline**: Critical vulnerabilities will be patched within 7 days
- **Disclosure**: We will coordinate with you on public disclosure timing

## Security Measures

HealthVault handles sensitive medical data. We implement:

### Authentication & Authorization

- Supabase Auth with JWT validation on every request
- Role-based access control (patient, doctor, admin)
- Row Level Security (RLS) on all 18 database tables
- Session timeout (15-minute idle logout)

### Data Protection

- All medical reports stored in private Supabase Storage buckets
- File size limits (10MB max)
- Encrypted data in transit (HTTPS/HSTS)
- CSRF protection on all POST routes
- Content Security Policy (CSP) headers

### AI Security

- Prompt injection detection (15 pattern matching rules)
- Topic enforcement (medical documents only)
- Rate limiting (20 requests/hour global, 10/route)
- Response validation (max 20KB, injection check)
- Full audit logging of all AI interactions

### Infrastructure

- Vercel deployment with automatic HTTPS
- GitHub Actions CI with CodeQL security scanning
- Dependabot for dependency vulnerability updates
- Pre-commit hooks (Husky + lint-staged)

## Data Handling

- Medical reports are private by default
- Patients control which reports are shared
- All doctor access is logged in `access_logs`
- Soft-deleted accounts have 72-hour recovery window
- Audit data retained for 90 days

## Compliance Ready

HealthVault is designed with ABDM (Ayushman Bharat Digital Mission) compliance in mind. We follow:

- Data minimization principles
- Purpose limitation for medical data
- User consent tracking (consent_logs table)
- Right to deletion (account deletion with grace period)
