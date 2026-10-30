import React, { useState } from 'react';
import { RoleSwitcher, ActiveRole } from './components/RoleSwitcher';
import { InstitutionPortal } from './pages/InstitutionPortal';
import { AicteCommandCentre } from './pages/AicteCommandCentre';
import { VerifierPortal } from './pages/VerifierPortal';

export const App: React.FC = () => {
  const [currentRole, setCurrentRole] = useState<ActiveRole>('INSTITUTION_ALPHA');

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Top Stakeholder Persona Switcher */}
      <RoleSwitcher
        currentRole={currentRole}
        onRoleChange={(role) => setCurrentRole(role)}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentRole === 'INSTITUTION_ALPHA' && (
          <InstitutionPortal institutionId="inst-alpha-001" />
        )}

        {currentRole === 'INSTITUTION_BETA' && (
          <InstitutionPortal institutionId="inst-beta-002" />
        )}

        {currentRole === 'AICTE_OFFICER' && <AicteCommandCentre />}

        {currentRole === 'VERIFIER' && <VerifierPortal />}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-4 px-6 text-xs flex flex-wrap items-center justify-between gap-4 mt-auto">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-300">APAAR-SHIELD</span>
          <span>•</span>
          <span>SIH26263 Prototype Specification</span>
          <span>•</span>
          <span>AICTE Regulation Bureau</span>
        </div>
        <div className="flex items-center gap-4 text-slate-400">
          <span>AICTE APH 2024–27 Baseline</span>
          <span>•</span>
          <span>Privacy by Design (DPDP / CERT-In)</span>
          <span>•</span>
          <span className="font-mono text-amber-400">AES-256-GCM + HMAC-SHA256</span>
        </div>
      </footer>
    </div>
  );
};

export default App;

