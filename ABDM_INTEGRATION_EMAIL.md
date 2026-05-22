Subject: Request for Technical Guidance — ABDM Integration for HealthVault (Patient Health Record Platform)

Dear ABDM Technical Team,

I am writing to seek technical guidance on integrating our digital health platform, HealthVault, with the Ayushman Bharat Digital Mission (ABDM) ecosystem.

---

## About HealthVault

HealthVault is a patient-centric digital health record platform built for India's healthcare ecosystem. It enables patients to securely store, manage, and selectively share their medical records with registered doctors — eliminating the need to carry physical paper reports to every clinic visit.

**Live URL:** https://healthvault-dusky.vercel.app
**GitHub:** https://github.com/sagar-grv/healthvault

---

## Current Architecture

| Layer          | Technology                                            |
| -------------- | ----------------------------------------------------- |
| Frontend       | Next.js 15 (App Router, React Server Components)      |
| Database       | Supabase PostgreSQL 17 with Row Level Security (RLS)  |
| Authentication | Supabase Auth (email/password) with role-based access |
| Storage        | Supabase Storage (encrypted medical report files)     |
| AI Analysis    | Google Gemini API (medical report summarization)      |
| Deployment     | Vercel                                                |

---

## Current Features Implemented

### For Patients

- Unique Health ID (HV-XXXX-XXXX format) for identification
- Upload medical reports (PDF, JPG, PNG — prescriptions, lab reports, scans, discharge summaries, vaccination records)
- Per-report privacy controls (private by default, toggle to shareable)
- Bulk sharing management
- AI-powered report analysis (summary, key findings, abnormal values, medications, recommendations)
- Access log — view which doctors accessed their records and when
- QR code generation for Health ID sharing

### For Doctors

- Patient search by Health ID
- View only shareable reports (RLS-enforced)
- AI clinical insights across patient records
- Doctor AI assistant for clinical queries
- Search rate limiting and audit logging
- Medical credential verification (registration number, council, specialization)

### Security & Compliance

- Row Level Security (RLS) on all database tables
- Role-based access control (patient / doctor / admin)
- Signed URLs for file access (1-hour TTL)
- Access audit trail for all doctor-patient interactions
- Rate limiting on searches and AI queries

---

## ABDM Integration — What We Want to Achieve

We have designed HealthVault to be ABDM-ready from the ground up. Our current architecture maps conceptually to ABDM components:

| HealthVault Concept                       | ABDM Equivalent                         |
| ----------------------------------------- | --------------------------------------- |
| Health ID (HV-XXXX-XXXX)                  | ABHA Number                             |
| Shareable/Private toggle                  | ABDM Consent Manager                    |
| Access logs                               | ABDM audit trail requirements           |
| Doctor profiles with registration numbers | Healthcare Professionals Registry (HPR) |
| Report storage and sharing                | Health Information Exchange (HIE-CM)    |

### Planned Integration Steps

1. **ABHA Number Creation/Linking** — Replace or supplement our proprietary Health ID with actual ABHA numbers for patient identification
2. **ABDM Consent Manager Integration** — Replace our current shareable/private toggle with ABDM's standardized consent artifacts (consent request, consent approval, consent denial)
3. **HPR Registration** — Register verified doctors on the Healthcare Professionals Registry
4. **HIE-CM Connectivity** — Enable Health Information Exchange so patients can share records across any ABDM-connected platform, not just HealthVault
5. **ABHA QR Code Scanning** — Adapt our existing QR scanner (currently built but hidden) to scan ABHA QR codes for instant patient identification

---

## Our Specific Questions

### 1. Sandbox Onboarding Process

- What is the current process to register HealthVault as an ABDM application in the sandbox environment?
- Are there specific technical prerequisites (SSL certificates, domain requirements, webhook endpoints) we need to prepare?
- Is there a developer portal or API documentation hub we should reference?

### 2. ABHA Number Integration (Milestone 1)

- For a platform like HealthVault where patients register via email/password, what is the recommended flow to create or link an ABHA number during onboarding?
- Should we create ABHA numbers on behalf of patients, or should patients bring their existing ABHA numbers and link them to their HealthVault account?
- What are the authentication requirements for ABHA creation APIs (OAuth2, API keys, certificates)?

### 3. Consent Framework (Milestone 3)

- Our current model uses a simple per-report shareable/private toggle. How do we map this to ABDM's consent artifact framework?
- What is the recommended consent flow for a doctor viewing a patient's records? Does the patient need to approve each access, or can they grant blanket consent for a time period?
- Are there sample implementations or reference code for the consent request/approval/denial flow?

### 4. HIE-CM Technical Integration

- What are the API endpoints and data formats for sending/receiving health records through the Health Information Exchange?
- Does ABDM support FHIR R4 resources natively, or do we need to transform our data?
- What is the expected payload format for different document types (prescriptions, lab reports, discharge summaries)?

### 5. HPR Registration for Doctors

- Our platform has a doctor verification flow with registration numbers and medical council details. How do we integrate this with the Healthcare Professionals Registry?
- Can we programmatically verify a doctor's HPR registration status during our onboarding flow?
- What is the process for our platform to act as a HIP (Health Information Provider) and HIU (Health Information User)?

### 6. Certification Milestones

- What are the specific technical requirements for each of the 3 ABDM certification milestones?
  - Milestone 1: ABHA ID creation, verification, and obtaining link token
  - Milestone 2: Linking and exporting health data
  - Milestone 3: Sending consent request and importing data
- Is there a checklist or self-assessment tool available?

### 7. Microsite Program

- We are a solo-developer startup building for the Indian healthcare market. Are we eligible for the ABDM Microsite program or any startup support initiatives?
- Is there technical mentorship available for small teams integrating with ABDM?

---

## Why This Matters

HealthVault is designed to solve a real problem for Indian patients — the fragmentation of medical records across clinics, hospitals, and labs. By integrating with ABDM, we can:

1. **Give patients true ownership** of their health data through ABHA-linked records
2. **Enable interoperability** so records flow seamlessly between any ABDM-connected platform
3. **Reduce medical errors** by giving doctors a complete, consented view of patient history
4. **Support India's digital health mission** by contributing a patient-first platform to the ecosystem

We are committed to building this correctly and in full compliance with ABDM standards. Any technical guidance, documentation references, or sandbox access you can provide would be greatly appreciated.

---

## Contact Information

**Developer:** Sagar Gurav
**Email:** sagargurav1812@gmail.com
**Project:** HealthVault
**GitHub:** https://github.com/sagar-grv/healthvault

I would be happy to schedule a call or provide any additional technical details about our platform. Thank you for your time and for building India's digital health infrastructure.

Warm regards,
Sagar Gurav
Developer, HealthVault
sagargurav1812@gmail.com
