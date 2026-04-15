'use client';

import React from 'react';
import { CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

interface Finding {
  id: string;
  title: string;
  description: string;
  status: 'compliant' | 'partially-compliant' | 'non-compliant';
}

const statusConfig = {
  compliant: {
    icon: CheckCircle2,
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200',
    label: 'Compliant'
  },
  'partially-compliant': {
    icon: AlertCircle,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    label: 'Partially Compliant'
  },
  'non-compliant': {
    icon: XCircle,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    label: 'Non-Compliant'
  }
};

const mockFindings: Finding[] = [
  { id: '1', title: 'Right to Work', description: 'RTW checks incomplete for some sponsored workers', status: 'non-compliant' },
  { id: '2', title: 'Sponsorship Duties', description: 'CoS letters or UKVI correspondence missing for sponsored employees.', status: 'non-compliant' },
  { id: '3', title: 'Visa Monitoring', description: 'Visa vignette copies missing for out-country candidates.', status: 'non-compliant' },
  { id: '4', title: 'Personnel Dossiers', description: 'Some passport or BRP copies are missing from personnel files.', status: 'partially-compliant' },
  { id: '5', title: 'Recruitment Documentation', description: 'Missing job descriptions or contracts for some employees.', status: 'partially-compliant' },
  { id: '6', title: 'Attendance Records', description: 'Attendance records properly maintained.', status: 'compliant' },
];

export default function FindingsSection() {
  const counts = {
    compliant: mockFindings.filter(f => f.status === 'compliant').length,
    'partially-compliant': mockFindings.filter(f => f.status === 'partially-compliant').length,
    'non-compliant': mockFindings.filter(f => f.status === 'non-compliant').length,
  };

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(statusConfig).map(([key, config]) => {
          const Icon = config.icon;
          return (
            <div key={key} className={`flex items-center gap-6 p-5 rounded-2xl border-2 ${config.bg} ${config.border}`}>
              <div className={`p-3 rounded-xl bg-white shadow-sm ${config.color}`}>
                <Icon size={28} />
              </div>
              <div>
                <div className="text-[24px] font-bold text-gray-900">{counts[key as keyof typeof counts]}</div>
                <div className={`text-[13px] font-semibold ${config.color}`}>{config.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Findings List */}
      <div className="flex flex-col gap-3">
        {mockFindings.map((finding) => {
          const config = statusConfig[finding.status];
          const Icon = config.icon;
          
          return (
            <div 
              key={finding.id} 
              className={`flex items-center gap-4 p-4 rounded-xl border-l-4 bg-white shadow-sm border ${config.border} border-l-[6px] border-l-current ${config.color.replace('text', 'border')}`}
              style={{ borderLeftColor: 'currentColor' }}
            >
              <div className={config.color}>
                <Icon size={20} />
              </div>
              <div className="flex flex-col">
                <h4 className="text-[14px] font-bold text-gray-900">{finding.title}</h4>
                <p className="text-[12px] text-gray-500">{finding.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
