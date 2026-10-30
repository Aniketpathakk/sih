import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  BarChart3,
  Layers,
  FileCheck2,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Eye,
  History,
  RotateCcw,
} from 'lucide-react';

export const AicteCommandCentre: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'matrix' | 'cases' | 'audit'>('matrix');
  const [summary, setSummary] = useState<any>(null);
  const [seatPositions, setSeatPositions] = useState<any[]>([]);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [cases, setCases] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [decisionNotes, setDecisionNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const sumRes = await fetch('/api/v1/reports/summary');
      if (sumRes.ok) setSummary(await sumRes.json());

      const seatRes = await fetch('/api/v1/reports/seat-positions');
      if (seatRes.ok) {
        const data = await seatRes.json();
        setSeatPositions(data.summaries || []);
        setEvaluations(data.evaluations || []);
      }

      const caseRes = await fetch('/api/v1/cases');
      if (caseRes.ok) setCases(await caseRes.json());

      const auditRes = await fetch('/api/v1/audit-events');
      if (auditRes.ok) setAuditLogs(await auditRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const adjudicateCase = async (status: 'FALSE_POSITIVE' | 'CORRECTION_REQUESTED' | 'RESOLVED') => {
    if (!selectedCase) return;
    try {
      const res = await fetch(`/api/v1/cases/${selectedCase.id}/decisions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision: status,
          reason: decisionNotes || `Adjudicated as ${status} after regulatory review.`,
          reviewerId: 'Dr. Sunita Deshmukh (AICTE Regulatory Officer)',
        }),
      });

      if (res.ok) {
        setSelectedCase(null);
        setDecisionNotes('');
        await fetchData();
        alert(`Case resolved with decision: ${status}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const resetBenchmarkData = async () => {
    if (confirm('Reset synthetic benchmark dataset to default state?')) {
      await fetch('/api/v1/seed/reset', { method: 'POST' });
      await fetchData();
      alert('Benchmark data reseeded successfully.');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-slate-900 rounded-xl text-white p-6 shadow-md border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">
            <span>AICTE Regulation Bureau</span>
            <span>•</span>
            <span>National Regulatory Command Centre</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            AICTE Regulatory Intelligence & Capacity Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Deterministic Rule Engine & Cross-Institution Enrolment Reconciliation (AY 2026-27)
          </p>
        </div>

        <button
          onClick={resetBenchmarkData}
          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg border border-slate-700 flex items-center gap-2 transition"
        >
          <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
          Reset Demo Benchmark Data
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-500 uppercase">Sanctioned Intake</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            {summary?.totalApprovedIntake || 0}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">
            Across {summary?.totalProgrammesApproved || 0} approved programmes
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-500 uppercase">Enrolment Utilisation</span>
          <div className="text-2xl font-extrabold text-blue-600 mt-1">
            {summary?.overallIntakeUtilisationPct || 0}%
          </div>
          <span className="text-xs text-emerald-600 font-medium mt-1 block">
            {summary?.totalConfirmedAdmissions || 0} confirmed admissions
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-500 uppercase">Integrity Review Cases</span>
          <div className="text-2xl font-extrabold text-amber-600 mt-1">
            {summary?.openIntegrityCases || 0}
          </div>
          <span className="text-xs text-amber-700 font-medium mt-1 block">
            Concurrent enrolments / anomalies
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-500 uppercase">Reported Withdrawals</span>
          <div className="text-2xl font-extrabold text-slate-700 mt-1">
            {summary?.totalWithdrawnAdmissions || 0}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">
            Lifecycle events recorded
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('matrix')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'matrix'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Seat Position Matrix & Regulatory Rules
        </button>

        <button
          onClick={() => setActiveTab('cases')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'cases'
              ? 'border-amber-600 text-amber-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          Reconciliation Cases ({cases.filter((c) => c.status === 'OPEN').length})
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'audit'
              ? 'border-slate-800 text-slate-800'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <History className="w-4 h-4" />
          Immutable Audit Trail ({auditLogs.length})
        </button>
      </div>

      {/* TAB 1: SEAT POSITION MATRIX */}
      {activeTab === 'matrix' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Approved Intake & Category Rule Adherence
            </h3>
            <p className="text-xs text-slate-500">
              AICTE Approval Process Handbook (APH 2024–27): Within-Intake (5% NRI cap), Supernumerary (15% FN/OCI ceiling with 1/3 Gulf allocation), and Lateral Entry isolation.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Programme</th>
                  <th className="py-2.5 px-3">Approved Intake</th>
                  <th className="py-2.5 px-3">Actual Enrolled</th>
                  <th className="py-2.5 px-3">Utilisation</th>
                  <th className="py-2.5 px-3">NRI Seats (Max 5%)</th>
                  <th className="py-2.5 px-3">Supernumerary (Max 15%)</th>
                  <th className="py-2.5 px-3">Lateral Entry</th>
                  <th className="py-2.5 px-3">Regulatory Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {seatPositions.map((summary) => (
                  <tr key={summary.programmeApprovalId} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900">
                        {summary.programmeName}
                      </div>
                      <div className="font-mono text-xs text-blue-700">
                        {summary.programmeCode} ({summary.academicYear})
                      </div>
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-800">
                      {summary.approvedIntake}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-900">
                      {summary.actualWithinIntakeCount}
                    </td>
                    <td className="py-3 px-3">
                      <div className="w-24 bg-slate-200 rounded-full h-2 mb-1 overflow-hidden">
                        <div
                          className={`h-2 rounded-full ${
                            summary.status === 'CAPACITY_EXCEEDED'
                              ? 'bg-rose-600'
                              : summary.status === 'NEAR_CAPACITY'
                              ? 'bg-amber-500'
                              : 'bg-emerald-600'
                          }`}
                          style={{
                            width: `${Math.min(
                              100,
                              (summary.actualWithinIntakeCount / summary.approvedIntake) * 100
                            )}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs font-mono text-slate-500">
                        {Math.round(
                          (summary.actualWithinIntakeCount / summary.approvedIntake) * 100
                        )}%
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-xs font-medium">
                        {summary.nriCount} / {summary.nriPermittedLimit}
                      </div>
                      {summary.nriCount > summary.nriPermittedLimit ? (
                        <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-1 py-0.5 rounded">
                          EXCEEDS 5% CAP
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-600 font-medium">
                          Compliant
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-xs font-medium">
                        {summary.supernumeraryCount} / {summary.supernumeraryPermittedLimit}
                      </div>
                      <span className="text-[10px] text-slate-500">
                        (Gulf Ward: {summary.gulfWorkerSubCount})
                      </span>
                    </td>
                    <td className="py-3 px-3 text-xs font-mono">
                      {summary.lateralEntryCount} (2nd Yr)
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          summary.status === 'WITHIN_CAPACITY'
                            ? 'bg-emerald-100 text-emerald-800'
                            : summary.status === 'CATEGORY_VIOLATION'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {summary.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: RECONCILIATION CASE QUEUE */}
      {activeTab === 'cases' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Reconciliation & Cross-Institution Integrity Cases
            </h3>
            <p className="text-xs text-slate-500">
              In accordance with AICTE Invariant 10, potential concurrent enrolments are flagged for human review, not automated adverse findings.
            </p>
          </div>

          <div className="space-y-3">
            {cases.map((c) => (
              <div
                key={c.id}
                className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition bg-slate-50/50 flex flex-wrap items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                        c.severity === 'HIGH'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {c.severity} SEVERITY
                    </span>
                    <span className="text-xs font-mono font-semibold text-slate-800">
                      {c.caseType}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        c.status === 'OPEN'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 text-sm">
                    {c.studentMaskedName} (APAAR: {c.apaarMasked})
                  </h4>
                  <p className="text-xs text-slate-600 max-w-2xl">
                    {c.evidenceSummary}
                  </p>
                </div>

                <button
                  onClick={() => setSelectedCase(c)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Review Case & Adjudicate
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Case Adjudication Modal */}
      {selectedCase && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-600" />
                Case Investigation: {selectedCase.caseType}
              </h3>
              <button
                onClick={() => setSelectedCase(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ×
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg space-y-2 border border-slate-200 text-xs">
              <div className="flex justify-between">
                <span>Student Subject:</span>
                <span className="font-bold">{selectedCase.studentMaskedName}</span>
              </div>
              <div className="flex justify-between">
                <span>Protected Reference:</span>
                <span className="font-mono">{selectedCase.apaarMasked}</span>
              </div>
              <div className="flex justify-between">
                <span>Institution A:</span>
                <span className="font-semibold text-blue-700">{selectedCase.institutionNameA}</span>
              </div>
              <div className="flex justify-between">
                <span>Institution B:</span>
                <span className="font-semibold text-purple-700">{selectedCase.institutionNameB}</span>
              </div>
              <div className="flex justify-between">
                <span>Statutory Reference:</span>
                <span className="text-slate-600 italic">{selectedCase.policyClauseRef}</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Officer Decision & Rationale:
              </label>
              <textarea
                placeholder="Enter regulatory reasoning (e.g., reviewed class timetable / distance mode permitted under UGC simultaneous guidelines)..."
                value={decisionNotes}
                onChange={(e) => setDecisionNotes(e.target.value)}
                rows={3}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <span className="text-[11px] text-slate-500">
                Human decision is audited independently.
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => adjudicateCase('FALSE_POSITIVE')}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition"
                >
                  Mark False Positive (Valid Concurrency)
                </button>
                <button
                  onClick={() => adjudicateCase('CORRECTION_REQUESTED')}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition"
                >
                  Request Clarification
                </button>
                <button
                  onClick={() => adjudicateCase('RESOLVED')}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg transition"
                >
                  Confirm Violation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: IMMUTABLE AUDIT LOG */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Regulatory Audit & Provenance Trail
            </h3>
            <p className="text-xs text-slate-500">
              CERT-In & DPDP compliant append-only event trail with sensitive identifier redaction.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Timestamp (UTC)</th>
                  <th className="py-2.5 px-3">Actor Role</th>
                  <th className="py-2.5 px-3">Actor Email</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Resource Target</th>
                  <th className="py-2.5 px-3">Redacted Event Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-xs">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 text-slate-500">
                      {new Date(log.occurredAt).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-sans font-semibold">
                        {log.actorRole}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 font-sans">{log.actorEmail}</td>
                    <td className="py-2.5 px-3 font-semibold text-blue-700 font-sans">
                      {log.action}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {log.resourceType}:{log.resourceId.slice(0, 8)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 truncate max-w-xs font-sans">
                      {JSON.stringify(log.details)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

