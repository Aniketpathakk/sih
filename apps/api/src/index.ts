import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { runSeed } from './seeds/seed';
import { institutionsService } from './modules/institutions/institutions.service';
import { approvalsService } from './modules/approvals/approvals.service';
import { submissionsService } from './modules/submissions/submissions.service';
import { admissionsService } from './modules/admissions/admissions.service';
import { casesService } from './modules/cases/cases.service';
import { verificationService } from './modules/verification/verification.service';
import { reportsService } from './modules/reports/reports.service';
import { auditService } from './modules/audit/audit.service';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const upload = multer({ storage: multer.memoryStorage() });

// Initialize database with synthetic seed fixtures on startup
runSeed();

// -------------------------------------------------------------
// ROUTES: Core System & Health
// -------------------------------------------------------------

app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    system: 'APAAR-SHIELD API',
    version: '1.0.0',
    mode: 'MOCK_INTEGRATION_MODE',
    productionVerified: false,
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/v1/seed/reset', (req, res) => {
  runSeed();
  res.json({ message: 'Synthetic dataset reseeded successfully.' });
});

// -------------------------------------------------------------
// ROUTES: Institutions & Approvals
// -------------------------------------------------------------

app.get('/api/v1/institutions', (req, res) => {
  res.json(institutionsService.getAll());
});

app.get('/api/v1/institutions/:id', (req, res) => {
  const inst = institutionsService.getById(req.params.id);
  if (!inst) return res.status(404).json({ error: 'Institution not found' });
  res.json(inst);
});

app.get('/api/v1/institutions/:id/campuses', (req, res) => {
  res.json(institutionsService.getCampuses(req.params.id));
});

app.get('/api/v1/institutions/:id/approvals', (req, res) => {
  const campuses = institutionsService.getCampuses(req.params.id);
  const approvals: any[] = [];
  for (const c of campuses) {
    approvals.push(...approvalsService.getApprovalsByCampus(c.id));
  }
  res.json(approvals);
});

// -------------------------------------------------------------
// ROUTES: Ingestion & Submissions
// -------------------------------------------------------------

app.post(
  '/api/v1/institutions/:institutionId/batches',
  upload.single('file'),
  async (req, res) => {
    try {
      const { institutionId } = req.params;
      const academicYear = req.body.academicYear || '2026-27';
      const idempotencyKey = req.headers['idempotency-key'] as string;
      const fileName = req.file?.originalname || req.body.fileName || 'admissions_upload.csv';

      let rows: any[] = [];

      if (req.file) {
        // Parse CSV string into rows
        const csvContent = req.file.buffer.toString('utf-8');
        const lines = csvContent
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean);

        if (lines.length > 1) {
          const headers = lines[0]
            .split(',')
            .map((h) => h.trim().toLowerCase().replace(/['"]/g, ''));

          for (let i = 1; i < lines.length; i++) {
            const values = lines[i]
              .split(',')
              .map((v) => v.trim().replace(/['"]/g, ''));
            const rowObj: Record<string, string> = {};
            headers.forEach((h, idx) => {
              rowObj[h] = values[idx] || '';
            });
            rows.push(rowObj);
          }
        }
      } else if (req.body.rows && Array.isArray(req.body.rows)) {
        rows = req.body.rows;
      }

      const batch = await submissionsService.createBatch(
        institutionId,
        academicYear,
        fileName,
        rows,
        idempotencyKey,
        req.body.submittedBy || 'institution-operator'
      );

      res.status(201).json(batch);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

app.get('/api/v1/batches/:id', (req, res) => {
  const batch = submissionsService.getBatch(req.params.id);
  if (!batch) return res.status(404).json({ error: 'Batch not found' });
  res.json(batch);
});

app.get('/api/v1/batches/:id/rows', (req, res) => {
  const rows = submissionsService.getBatchRows(req.params.id);
  res.json(rows);
});

app.post('/api/v1/batches/:id/certify', async (req, res) => {
  try {
    const certified = await submissionsService.certifyBatch(
      req.params.id,
      req.body.certifiedBy || 'principal@institution.edu'
    );
    res.json(certified);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// ROUTES: Admissions & Lifecycle
// -------------------------------------------------------------

app.get('/api/v1/admissions', (req, res) => {
  const { institutionId, programmeCode, academicYear } = req.query as any;
  res.json(
    admissionsService.getAdmissions({
      institutionId,
      programmeCode,
      academicYear,
    })
  );
});

app.get('/api/v1/admissions/:id', (req, res) => {
  const admission = admissionsService.getById(req.params.id);
  if (!admission) return res.status(404).json({ error: 'Admission not found' });
  res.json(admission);
});

app.get('/api/v1/admissions/:id/history', (req, res) => {
  res.json(admissionsService.getHistory(req.params.id));
});

app.post('/api/v1/admissions/:id/events', (req, res) => {
  try {
    const result = admissionsService.submitLifecycleEvent(
      req.params.id,
      req.body
    );
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// ROUTES: AICTE Case Adjudication & Alerts
// -------------------------------------------------------------

app.get('/api/v1/cases', (req, res) => {
  const { status, institutionId } = req.query as any;
  res.json(casesService.getAll({ status, institutionId }));
});

app.get('/api/v1/cases/:id', (req, res) => {
  const c = casesService.getById(req.params.id);
  if (!c) return res.status(404).json({ error: 'Case not found' });
  res.json(c);
});

app.post('/api/v1/cases/:id/decisions', (req, res) => {
  try {
    const updated = casesService.decideCase(req.params.id, req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// ROUTES: Purpose-Limited Verification Disclosure
// -------------------------------------------------------------

app.post('/api/v1/disclosure-requests', (req, res) => {
  try {
    const disclosure = verificationService.verifyClaim(req.body);
    res.json(disclosure);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// ROUTES: Regulatory Intelligence & Audit
// -------------------------------------------------------------

app.get('/api/v1/reports/summary', (req, res) => {
  res.json(reportsService.getNationalSummary());
});

app.get('/api/v1/reports/seat-positions', (req, res) => {
  const { institutionId } = req.query as any;
  res.json(reportsService.getSeatPositionSummaries(institutionId));
});

app.get('/api/v1/audit-events', (req, res) => {
  const limit = parseInt(req.query.limit as string) || 50;
  res.json(auditService.getRecent(limit));
});

// Start the standalone development server locally. Vercel imports the Express
// app as a serverless handler and must not start a second listener.
if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`🚀 APAAR-SHIELD Backend Modular API running on http://localhost:${port}/api/v1`);
    console.log(`🛡️  Identity Vault Initialized with AES-256-GCM and HMAC-SHA256 Tokenization`);
  });
}

export default app;

