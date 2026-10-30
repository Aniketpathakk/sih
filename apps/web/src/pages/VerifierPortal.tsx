import React, { useState } from 'react';
import {
  ShieldCheck,
  Search,
  Lock,
  QrCode,
  FileCheck,
  AlertTriangle,
  Building,
  GraduationCap,
  Calendar,
  CheckCircle,
} from 'lucide-react';

export const VerifierPortal: React.FC = () => {
  const [purposeCode, setPurposeCode] = useState('EMPLOYMENT_BACKGROUND_CHECK');
  const [verifierOrg, setVerifierOrg] = useState('Tata Consultancy Services HR');
  const [studentRef, setStudentRef] = useState('');
  const [disclosure, setDisclosure] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/v1/disclosure-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purposeCode,
          verifierOrgName: verifierOrg,
          studentRef: studentRef || undefined,
        }),
      });

      if (res.ok) {
        setDisclosure(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Banner */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-start gap-4">
        <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Authorised Academic Verification & Disclosure Portal
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Purpose-limited, consent-bound student admission status verification for employers, scholarship bodies, and higher education institutes.
          </p>
          <div className="flex items-center gap-2 mt-3 text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
            <Lock className="w-3.5 h-3.5 shrink-0" />
            <span>
              <strong>Privacy Protection:</strong> Under India DPDP and AICTE Invariant 15, verifiers receive only purpose-specific claims. Raw APAAR and personal demographic profiles are strictly protected.
            </span>
          </div>
        </div>
      </div>

      {/* Query Form */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="font-bold text-slate-900 text-sm mb-4 flex items-center gap-2">
          <Search className="w-4 h-4 text-blue-600" />
          Initiate Scoped Verification Query
        </h2>

        <form onSubmit={handleVerify} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              Verifier Organisation:
            </label>
            <input
              type="text"
              required
              value={verifierOrg}
              onChange={(e) => setVerifierOrg(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              Authorised Purpose Code:
            </label>
            <select
              value={purposeCode}
              onChange={(e) => setPurposeCode(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="EMPLOYMENT_BACKGROUND_CHECK">
                EMPLOYMENT_BACKGROUND_CHECK (Pre-Hire Verification)
              </option>
              <option value="SCHOLARSHIP_VALIDATION">
                SCHOLARSHIP_VALIDATION (Government / Direct Benefit Transfer)
              </option>
              <option value="HIGHER_ED_ADMISSION">
                HIGHER_ED_ADMISSION (Post-Graduate Enrolment)
              </option>
            </select>
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="text-xs font-semibold text-slate-700">
              Student / Admission Reference Token (Optional):
            </label>
            <input
              type="text"
              placeholder="e.g. STU-0042 (Leave blank for benchmark sample)"
              value={studentRef}
              onChange={(e) => setStudentRef(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>

          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              {loading ? 'Verifying...' : 'Query Authorised Claims'}
            </button>
          </div>
        </form>
      </div>

      {/* Verification Result Card */}
      {disclosure && (
        <div className="bg-white rounded-xl shadow-md border-2 border-emerald-500 p-6 space-y-6 relative overflow-hidden">
          {/* Watermark Banner */}
          <div className="bg-amber-100 border-b border-amber-300 text-amber-900 text-center py-1 text-xs font-mono font-bold uppercase tracking-wider -mx-6 -mt-6 mb-4 flex items-center justify-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
            SYNTHETIC BENCHMARK PROTOTYPE • STATUS: {disclosure.status}
          </div>

          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
                Cryptographically Sealed Credential
              </span>
              <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">
                {disclosure.maskedName}
              </h3>
              <div className="text-xs text-slate-500 font-mono mt-1">
                Subject Reference: {disclosure.studentReference}
              </div>
            </div>

            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg text-emerald-800 text-xs font-bold">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              {disclosure.admissionStatus} ENROLMENT
            </div>
          </div>

          {/* Key Facts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-blue-600" />
                AICTE Approved Institution:
              </span>
              <div className="font-bold text-slate-900 text-sm">
                {disclosure.institutionName}
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <span className="text-slate-500 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                Sanctioned Programme:
              </span>
              <div className="font-bold text-slate-900 text-sm">
                {disclosure.programmeName}
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                Academic Session:
              </span>
              <div className="font-bold text-slate-900 text-sm">
                {disclosure.academicYear}
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <span className="text-slate-500 flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-blue-600" />
                Verification Purpose:
              </span>
              <div className="font-bold text-slate-900 text-sm">
                {disclosure.purposeCode}
              </div>
            </div>
          </div>

          {/* Cryptographic Seal & QR Code */}
          <div className="bg-slate-900 text-white rounded-lg p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1 max-w-md">
              <div className="text-[11px] text-amber-400 font-mono flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                HMAC-SHA256 INTEGRITY SEAL
              </div>
              <div className="font-mono text-xs text-slate-300 break-all">
                {disclosure.signature}
              </div>
              <div className="text-[10px] text-slate-400">
                Verified: {new Date(disclosure.verifiedAt).toLocaleString()} • Expires: {new Date(disclosure.expiresAt).toLocaleDateString()}
              </div>
            </div>

            <div className="bg-white p-2 rounded-lg text-slate-900 flex flex-col items-center">
              {/* Synthetic visual QR placeholder */}
              <div className="w-20 h-20 bg-slate-100 border border-slate-300 rounded flex flex-col items-center justify-center text-slate-700">
                <QrCode className="w-12 h-12 text-slate-800" />
                <span className="text-[8px] font-mono font-bold mt-1">VERIFY QR</span>
              </div>
              <span className="text-[9px] text-slate-500 mt-1 font-mono">Scan for Instant Proof</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

