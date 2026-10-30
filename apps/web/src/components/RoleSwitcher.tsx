import React from 'react';
import { Shield, Building2, Eye, UserCheck, AlertTriangle } from 'lucide-react';

export type ActiveRole =
  | 'INSTITUTION_ALPHA'
  | 'INSTITUTION_BETA'
  | 'AICTE_OFFICER'
  | 'VERIFIER';

interface RoleSwitcherProps {
  currentRole: ActiveRole;
  onRoleChange: (role: ActiveRole) => void;
}

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({
  currentRole,
  onRoleChange,
}) => {
  return (
    <div className="bg-slate-900 border-b border-slate-800 text-white px-4 py-2 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="bg-blue-600 p-1.5 rounded-lg text-white font-bold flex items-center gap-2">
          <Shield className="w-5 h-5 text-amber-300" />
          <span className="tracking-wide">APAAR-SHIELD</span>
        </div>
        <span className="text-xs bg-slate-800 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30 flex items-center gap-1 font-mono">
          <AlertTriangle className="w-3 h-3" />
          SIH26263 PROTOTYPE • MOCK PROVIDER
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-400 font-medium">Active Persona:</span>
        <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700">
          <button
            onClick={() => onRoleChange('INSTITUTION_ALPHA')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-md font-medium transition ${
              currentRole === 'INSTITUTION_ALPHA'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            Alpha Institute (Admin)
          </button>

          <button
            onClick={() => onRoleChange('INSTITUTION_BETA')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-md font-medium transition ${
              currentRole === 'INSTITUTION_BETA'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            Beta College
          </button>

          <button
            onClick={() => onRoleChange('AICTE_OFFICER')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-md font-medium transition ${
              currentRole === 'AICTE_OFFICER'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-amber-200" />
            AICTE Regulatory Officer
          </button>

          <button
            onClick={() => onRoleChange('VERIFIER')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-md font-medium transition ${
              currentRole === 'VERIFIER'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Verifier Portal
          </button>
        </div>
      </div>
    </div>
  );
};

