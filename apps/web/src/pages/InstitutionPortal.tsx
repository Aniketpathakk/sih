import React, { useState, useEffect } from 'react';
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Download,
  ShieldCheck,
  UserX,
  RefreshCw,
  Search,
  ArrowRight,
  Info,
} from 'lucide-react';

interface InstitutionPortalProps {
  institutionId: string;
}

export const InstitutionPortal: React.FC<InstitutionPortalProps> = ({
  institutionId,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'ledger'>('upload');
  const [institution, setInstitution] = useState<any>(null);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [currentBatch, setCurrentBatch] = useState<any>(null);
  const [batchRows, setBatchRows] = useState<any[]>([]);
  const [selectedRow, setSelectedRow] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Withdrawal modal state
  const [withdrawingAdmission, setWithdrawingAdmission] = useState<any>(null);
  const [withdrawalReason, setWithdrawalReason] = useState(
    'Student accepted allotment at IIT/NIT via CSAB.'
  );

  useEffect(() => {
    fetchInstitutionData();
  }, [institutionId]);

  const fetchInstitutionData = async () => {
    setLoading(true);
    try {
      const instRes = await fetch(`/api/v1/institutions/${institutionId}`);
      if (instRes.ok) setInstitution(await instRes.json());

      const appRes = await fetch(`/api/v1/institutions/${institutionId}/approvals`);
      if (appRes.ok) setApprovals(await appRes.json());

      const admRes = await fetch(`/api/v1/admissions?institutionId=${institutionId}`);
      if (admRes.ok) setAdmissions(await admRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const downloadSampleCsv = () => {
    const csvContent =
      'source_record_id,student_name,apaar_reference,programme_code,admission_route,seat_category,entry_type,admission_date\n' +
      'ADM-2026-001,Synthetic Student Alpha,900000005001,BTECH-CSE,STATE_COUNSELLING,GENERAL,FIRST_YEAR,2026-08-10\n' +
      'ADM-2026-002,Synthetic Student Beta,900000005002,BTECH-CSE,STATE_COUNSELLING,OBC_NCL,FIRST_YEAR,2026-08-10\n' +
      'ADM-2026-003,Synthetic NRI Candidate,900000005003,BTECH-CSE,NRI,NRI,FIRST_YEAR,2026-08-11\n' +
      'ADM-2026-004,Synthetic Gulf Candidate,900000005004,BTECH-CSE,FN_OCI_GULF,GULF_WORKER,FIRST_YEAR,2026-08-11\n' +
      'ADM-2026-005,Invalid Apaar Test,90000000000X,BTECH-CSE,STATE_COUNSELLING,GENERAL,FIRST_YEAR,2026-08-12\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'apaar_shield_template_2026.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const uploadSampleBatch = async () => {
    setLoading(true);
    try {
      const demoRows = [
        {
          sourceRecordId: 'DEMO-ADM-01',
          studentName: 'Synthetic Student Alpha',
          apaarReference: '900000005001',
          programmeCode: 'BTECH-CSE',
          seatCategory: 'GENERAL',
          admissionRoute: 'STATE_COUNSELLING',
        },
        {
          sourceRecordId: 'DEMO-ADM-02',
          studentName: 'Synthetic Student Beta',
          apaarReference: '900000005002',
          programmeCode: 'BTECH-CSE',
          seatCategory: 'OBC_NCL',
          admissionRoute: 'STATE_COUNSELLING',
        },
        {
          sourceRecordId: 'DEMO-ADM-03',
          studentName: 'Synthetic Student Malformed',
          apaarReference: '90000000000X', // Flagged format error
          programmeCode: 'BTECH-CSE',
          seatCategory: 'GENERAL',
          admissionRoute: 'STATE_COUNSELLING',
        },
        {
          sourceRecordId: 'DEMO-ADM-04',
          studentName: 'Synthetic Duplicate Entry',
          apaarReference: '900000005001', // Flagged batch duplicate
          programmeCode: 'BTECH-CSE',
          seatCategory: 'GENERAL',
          admissionRoute: 'STATE_COUNSELLING',
        },
      ];

      const res = await fetch(`/api/v1/institutions/${institutionId}/batches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': `IDEMP-${Date.now()}`,
        },
        body: JSON.stringify({
          academicYear: '2026-27',
          fileName: 'demo_admissions_batch.csv',
          rows: demoRows,
          submittedBy: 'Institution Admission Officer',
        }),
      });

      if (res.ok) {
        const batch = await res.json();
        setCurrentBatch(batch);
        const rowsRes = await fetch(`/api/v1/batches/${batch.id}/rows`);
        if (rowsRes.ok) {
          const rows = await rowsRes.json();
          setBatchRows(rows);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const certifyCurrentBatch = async () => {
    if (!currentBatch) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/batches/${currentBatch.id}/certify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          certifiedBy: 'Prof. Rajesh K. Varma (Principal)',
        }),
      });

      if (res.ok) {
        const certified = await res.json();
        setCurrentBatch(certified);
        await fetchInstitutionData();
        alert('✅ Batch certified and committed to AICTE Regulatory Ledger!');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const submitWithdrawal = async () => {
    if (!withdrawingAdmission) return;
    try {
      const res = await fetch(
        `/api/v1/admissions/${withdrawingAdmission.id}/events`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventType: 'WITHDRAWAL',
            reason: withdrawalReason,
            actorId: 'Institution Registrar',
          }),
        }
      );

      if (res.ok) {
        setWithdrawingAdmission(null);
        await fetchInstitutionData();
        alert('Admission withdrawal recorded with immutable event history.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredAdmissions = admissions.filter((a) => {
    const matchesSearch =
      a.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.apaarMasked.includes(searchTerm) ||
      a.programmeCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'ALL' || a.currentStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Institution Banner */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 tracking-wider uppercase mb-1">
            <span>AICTE Approval ID: {institution?.aicteInstitutionRef}</span>
            <span>•</span>
            <span>{institution?.institutionType}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            {institution?.officialName}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Institution Data Submission & Enrolment Lifecycle Portal (Academic Year 2026-27)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center min-w-[120px]">
            <span className="text-xs text-blue-700 font-medium">Approved Intake</span>
            <div className="text-xl font-bold text-blue-900">
              {approvals.reduce((s, a) => s + (a.approved_intake || 0), 0)}
            </div>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center min-w-[120px]">
            <span className="text-xs text-emerald-700 font-medium">Enrolled Students</span>
            <div className="text-xl font-bold text-emerald-900">
              {admissions.filter((a) => a.currentStatus === 'CONFIRMED').length}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('upload')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'upload'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Upload className="w-4 h-4" />
          Batch Submission & Staging Validation
        </button>

        <button
          onClick={() => setActiveTab('ledger')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'ledger'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileText className="w-4 h-4" />
          Enrolled Admissions Ledger ({admissions.length})
        </button>
      </div>

      {/* TAB 1: BATCH UPLOAD & STAGING */}
      {activeTab === 'upload' && (
        <div className="space-y-6">
          {/* Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Download className="w-5 h-5 text-blue-600" />
                  Canonical CSV Template
                </h3>
                <p className="text-xs text-slate-500 mt-2">
                  Download standard schema template pre-configured with required fields: APAAR ID, Category, Route, and Course Code.
                </p>
              </div>
              <button
                onClick={downloadSampleCsv}
                className="mt-4 px-4 py-2 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download Template (.CSV)
              </button>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-emerald-600" />
                  Quick Demo Batch
                </h3>
                <p className="text-xs text-slate-500 mt-2">
                  Trigger automated parsing with planted scenarios (valid rows + malformed APAAR + batch duplicate).
                </p>
              </div>
              <button
                onClick={uploadSampleBatch}
                disabled={loading}
                className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                Upload Planted Demo Batch
              </button>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-amber-600" />
                  Regulatory Certification
                </h3>
                <p className="text-xs text-slate-500 mt-2">
                  Head of Institution digital declaration. Valid staging rows commit transactionally into the national registry.
                </p>
              </div>
              <button
                onClick={certifyCurrentBatch}
                disabled={!currentBatch || currentBatch.status === 'COMMITTED' || loading}
                className={`mt-4 px-4 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition ${
                  currentBatch && currentBatch.status !== 'COMMITTED'
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                {currentBatch?.status === 'COMMITTED'
                  ? 'Batch Already Certified'
                  : 'Certify & Commit Staged Batch'}
              </button>
            </div>
          </div>

          {/* Staging Summary */}
          {currentBatch && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded font-semibold text-slate-700">
                      Batch ID: {currentBatch.id.slice(0, 8)}...
                    </span>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                        currentBatch.status === 'COMMITTED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : currentBatch.status === 'VALIDATED_WITH_ISSUES'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      Status: {currentBatch.status}
                    </span>
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 mt-1">
                    Staging Validation Report — {currentBatch.fileName}
                  </h4>
                </div>

                <div className="flex gap-4">
                  <div className="text-center px-4 py-2 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-xs text-slate-500">Total Rows</span>
                    <div className="text-lg font-bold text-slate-900">
                      {currentBatch.totalRows}
                    </div>
                  </div>
                  <div className="text-center px-4 py-2 bg-emerald-50 rounded-lg border border-emerald-200">
                    <span className="text-xs text-emerald-700 font-medium">Valid</span>
                    <div className="text-lg font-bold text-emerald-900">
                      {currentBatch.validRows}
                    </div>
                  </div>
                  <div className="text-center px-4 py-2 bg-rose-50 rounded-lg border border-rose-200">
                    <span className="text-xs text-rose-700 font-medium">Errors</span>
                    <div className="text-lg font-bold text-rose-900">
                      {currentBatch.errorRows}
                    </div>
                  </div>
                </div>
              </div>

              {/* Staged Rows Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600 text-xs uppercase border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Row #</th>
                      <th className="py-2.5 px-3">Source ID</th>
                      <th className="py-2.5 px-3">Student Name</th>
                      <th className="py-2.5 px-3">APAAR (Masked)</th>
                      <th className="py-2.5 px-3">Course</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Validation Status</th>
                      <th className="py-2.5 px-3 text-right">Diagnostic Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {batchRows.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-3 font-mono text-xs">{row.row_number}</td>
                        <td className="py-3 px-3 font-mono text-xs text-slate-600">
                          {row.source_record_id}
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-900">
                          {row.student_name}
                        </td>
                        <td className="py-3 px-3 font-mono text-xs text-slate-700">
                          {row.apaar_masked}
                        </td>
                        <td className="py-3 px-3 font-mono text-xs text-blue-700 font-semibold">
                          {row.programme_code}
                        </td>
                        <td className="py-3 px-3 text-xs">{row.seat_category}</td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-semibold ${
                              row.status === 'VALID'
                                ? 'bg-emerald-100 text-emerald-800'
                                : row.status === 'DUPLICATE'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          {row.issues_json && row.issues_json.length > 0 ? (
                            <button
                              onClick={() => setSelectedRow(row)}
                              className="text-xs text-rose-600 font-semibold hover:text-rose-800 underline flex items-center gap-1 justify-end ml-auto"
                            >
                              <AlertCircle className="w-3.5 h-3.5" />
                              Inspect Issue ({row.issues_json.length})
                            </button>
                          ) : (
                            <span className="text-xs text-emerald-600 font-medium flex items-center gap-1 justify-end">
                              <CheckCircle className="w-3.5 h-3.5" />
                              Ready to Commit
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Row Issue Diagnostic Modal */}
          {selectedRow && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4 border border-slate-200">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-rose-600" />
                    Row Validation Diagnostic (Row #{selectedRow.row_number})
                  </h3>
                  <button
                    onClick={() => setSelectedRow(null)}
                    className="text-slate-400 hover:text-slate-600 font-bold text-lg"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="text-xs bg-slate-50 p-3 rounded-lg border border-slate-200 font-mono">
                    <div>Student: <span className="font-bold">{selectedRow.student_name}</span></div>
                    <div>Source Record ID: {selectedRow.source_record_id}</div>
                    <div>Masked APAAR: {selectedRow.apaar_masked}</div>
                  </div>

                  {selectedRow.issues_json?.map((issue: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 bg-rose-50 border border-rose-200 rounded-lg space-y-1"
                    >
                      <div className="flex items-center justify-between text-xs font-semibold text-rose-800">
                        <span>Code: {issue.code}</span>
                        <span>Column: {issue.column}</span>
                      </div>
                      <p className="text-xs text-rose-900 font-medium">
                        {issue.message}
                      </p>
                      {issue.suggestedFix && (
                        <div className="text-xs text-slate-600 mt-2 bg-white/70 p-2 rounded border border-rose-100 flex items-start gap-1.5">
                          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                          <span><strong>Recommended Fix:</strong> {issue.suggestedFix}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setSelectedRow(null)}
                    className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800"
                  >
                    Close Diagnostic
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ENROLLED ADMISSIONS LEDGER */}
      {activeTab === 'ledger' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Institutional Admissions Ledger
              </h3>
              <p className="text-xs text-slate-500">
                Authoritative record of enrolled students linked with protected APAAR references.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search student, APAAR, course..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="ALL">All Statuses</option>
                <option value="CONFIRMED">CONFIRMED</option>
                <option value="WITHDRAWN">WITHDRAWN</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2.5 px-3">APAAR Reference</th>
                  <th className="py-2.5 px-3">Programme</th>
                  <th className="py-2.5 px-3">Admission Route</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Enrolment Date</th>
                  <th className="py-2.5 px-3 text-right">Lifecycle Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAdmissions.map((adm) => (
                  <tr key={adm.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-3 font-semibold text-slate-900">
                      {adm.studentName}
                    </td>
                    <td className="py-3 px-3 font-mono text-xs text-slate-700">
                      <span className="bg-slate-100 px-2 py-0.5 rounded font-medium">
                        {adm.apaarMasked}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-xs text-blue-700 font-semibold">
                      {adm.programmeCode}
                    </td>
                    <td className="py-3 px-3 text-xs">{adm.admissionRoute}</td>
                    <td className="py-3 px-3 text-xs">
                      <span className="font-medium text-slate-800">
                        {adm.seatCategory}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          adm.currentStatus === 'CONFIRMED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {adm.currentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-xs text-slate-500 font-mono">
                      {adm.admissionDate}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {adm.currentStatus === 'CONFIRMED' ? (
                        <button
                          onClick={() => setWithdrawingAdmission(adm)}
                          className="text-xs text-rose-600 font-semibold hover:text-rose-800 flex items-center gap-1 justify-end ml-auto bg-rose-50 px-2.5 py-1 rounded border border-rose-200 transition"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          Record Withdrawal
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">
                          Lifecycle Closed
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Withdrawal Action Modal */}
      {withdrawingAdmission && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4 border border-slate-200">
            <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
              <UserX className="w-5 h-5 text-rose-600" />
              Record Student Withdrawal
            </h3>
            <p className="text-xs text-slate-600">
              In accordance with AICTE Invariant 11, recording a withdrawal appends an immutable event to the audit trail. Historical admission evidence is preserved.
            </p>

            <div className="bg-slate-50 p-3 rounded-lg text-xs space-y-1 font-mono border border-slate-200">
              <div>Student: <span className="font-bold">{withdrawingAdmission.studentName}</span></div>
              <div>APAAR: {withdrawingAdmission.apaarMasked}</div>
              <div>Programme: {withdrawingAdmission.programmeCode}</div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Official Withdrawal Reason:
              </label>
              <textarea
                value={withdrawalReason}
                onChange={(e) => setWithdrawalReason(e.target.value)}
                rows={3}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setWithdrawingAdmission(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={submitWithdrawal}
                className="px-4 py-1.5 bg-rose-600 text-white text-xs font-semibold rounded-lg hover:bg-rose-700 transition"
              >
                Confirm Withdrawal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

