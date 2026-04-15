'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

type Status = 'Satisfactory' | 'Action Required' | 'Consider Improvement';

interface ComplianceItem {
  id: number;
  area: string;
  requirement: string;
  observation: string;
  status: Status;
  details: {
    whatIsMissing: string;
    whyItMatters: string;
    likelyNextRequest: string;
  };
}

const initialComplianceData: ComplianceItem[] = [
  {
    id: 1,
    area: 'Personnel Dossiers',
    requirement: 'Maintain complete ID records for all employees',
    observation: 'Some passport or BRP copies are missing from personnel files',
    status: 'Consider Improvement',
    details: {
      whatIsMissing: 'Job descriptions or signed employment contracts',
      whyItMatters: 'Essential for demonstrating vacancy and role requirement',
      likelyNextRequest: 'Updates job descriptions matching COS details',
    },
  },
  {
    id: 2,
    area: 'Recruitment Documentation',
    requirement: 'Job descriptions and contracts for all positions',
    observation: 'Missing job descriptions or contracts for some employees',
    status: 'Consider Improvement',
    details: {
      whatIsMissing: 'Job descriptions or signed employment contracts',
      whyItMatters: 'Essential for demonstrating vacancy and role requirement',
      likelyNextRequest: 'Updates job descriptions matching COS details',
    },
  },
  {
    id: 3,
    area: 'Right to Work',
    requirement: 'Valid RTW checks before employment starts',
    observation: 'RTW checks incomplete for some sponsored worker',
    status: 'Action Required',
    details: {
      whatIsMissing: 'Job descriptions or signed employment contracts',
      whyItMatters: 'Essential for demonstrating vacancy and role requirement',
      likelyNextRequest: 'Updates job descriptions matching COS details',
    },
  },
  {
    id: 4,
    area: 'Sponsorship Duties',
    requirement: 'CoS records and UKVI correspondence archived',
    observation: 'CoS letters or UKVI correspondence missing for sponsored employees',
    status: 'Action Required',
    details: {
      whatIsMissing: 'Job descriptions or signed employment contracts',
      whyItMatters: 'Essential for demonstrating vacancy and role requirement',
      likelyNextRequest: 'Updates job descriptions matching COS details',
    },
  },
  {
    id: 5,
    area: 'Attendance Records',
    requirement: 'Accurate attendance tracking for sponsored workers',
    observation: 'Attendance records properly maintained',
    status: 'Satisfactory',
    details: {
      whatIsMissing: 'Job descriptions or signed employment contracts',
      whyItMatters: 'Essential for demonstrating vacancy and role requirement',
      likelyNextRequest: 'Updates job descriptions matching COS details',
    },
  },
  {
    id: 6,
    area: 'Visa Monitoring',
    requirement: 'Track visa expiry dates and maintain copies',
    observation: 'Visa vignette copies missing for out-country candidates',
    status: 'Action Required',
    details: {
      whatIsMissing: 'Job descriptions or signed employment contracts',
      whyItMatters: 'Essential for demonstrating vacancy and role requirement',
      likelyNextRequest: 'Updates job descriptions matching COS details',
    },
  },
];

const StatusBadge: React.FC<{ status: Status }> = ({ status }) => {
  const baseStyle = 'px-3 py-1 text-xs font-bold rounded-full whitespace-nowrap';
  switch (status) {
    case 'Satisfactory':
      return <span className={`${baseStyle} bg-green-100 text-green-700 border border-green-200`}>Satisfactory</span>;
    case 'Action Required':
      return <span className={`${baseStyle} bg-red-100 text-red-700 border border-red-200`}>Action Required</span>;
    case 'Consider Improvement':
      return <span className={`${baseStyle} bg-yellow-100 text-yellow-700 border border-yellow-200`}>Consider Improvement</span>;
    default:
      return null;
  }
};

const ComplianceRow: React.FC<{ item: ComplianceItem }> = ({ item }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <tbody className="divide-y divide-gray-200">
      <tr 
        onClick={() => setIsOpen(!isOpen)} 
        className={`group cursor-pointer transition-colors duration-200 border-b border-gray-100
          ${isOpen ? 'bg-[#F8FAFC]' : 'hover:bg-gray-50/80'}
        `}
      >
        <td className="p-4 w-12 text-center text-gray-400">
          <div className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
             <ChevronDown size={18} />
          </div>
        </td>
        <td className="p-4 text-sm font-medium text-gray-400 w-12">{item.id}</td>
        <td className="p-4 text-[14px] font-bold text-gray-900 min-w-[180px]">{item.area}</td>
        <td className="p-4 text-[13px] text-gray-600 max-w-[240px] leading-relaxed">{item.requirement}</td>
        <td className="p-4 text-[13px] text-gray-500 max-w-[240px] leading-relaxed italic">"{item.observation}"</td>
        <td className="p-4 text-right">
          <StatusBadge status={item.status} />
        </td>
      </tr>
      {isOpen && (
        <tr>
          <td colSpan={6} className="p-0 border-b border-gray-100">
            <div className="bg-[#FBFCFE] border-l-[6px] border-[#0852C9] overflow-hidden animate-in fade-in slide-in-from-top-1 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-8">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-[#0852C9]">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#0852C9]" />
                    <h4 className="font-extrabold text-[12px] uppercase tracking-wider">What is missing</h4>
                  </div>
                  <p className="text-[13px] text-gray-700 leading-relaxed font-medium bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    {item.details.whatIsMissing}
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-[#0852C9]">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#0852C9]" />
                    <h4 className="font-extrabold text-[12px] uppercase tracking-wider">Why it matters</h4>
                  </div>
                  <p className="text-[13px] text-gray-700 leading-relaxed font-medium bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    {item.details.whyItMatters}
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-[#0852C9]">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#0852C9]" />
                    <h4 className="font-extrabold text-[12px] uppercase tracking-wider">Likely next request</h4>
                  </div>
                  <p className="text-[13px] text-[#0852C9] leading-relaxed font-bold bg-blue-50/50 p-4 rounded-xl border border-blue-100 shadow-sm">
                    {item.details.likelyNextRequest}
                  </p>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </tbody>
  );
};

export default function GapAnalysis() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h3 className="text-[16px] font-bold text-gray-900">Gap Analysis</h3>
        <p className="text-[12px] text-gray-500">Detailed breakdown of compliance gaps. Click rows to expand details.</p>
      </div>

      <div className="flex flex-wrap items-center gap-6 text-xs text-gray-600">
        <div className="flex items-center gap-2 whitespace-nowrap">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500" /> Satisfactory / Compliant
        </div>
        <div className="flex items-center gap-2 whitespace-nowrap">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Action required / Non-compliant
        </div>
        <div className="flex items-center gap-2 whitespace-nowrap">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-400" /> Consider improvement / Partial
        </div>
      </div>

      <div className="overflow-x-auto border border-gray-100 rounded-2xl max-h-[700px] overflow-y-auto shadow-sm bg-white">
        <table className="min-w-full table-auto border-separate border-spacing-0">
          <thead className="bg-[#F8FAFC] sticky top-0 z-30 border-b border-gray-100">
            <tr>
              <th className="p-5 w-12"></th>
              <th className="p-5 text-left text-[11px] font-extrabold text-[#64748B] uppercase tracking-wider">#</th>
              <th className="p-5 text-left text-[11px] font-extrabold text-[#64748B] uppercase tracking-wider">Compliance Area</th>
              <th className="p-5 text-left text-[11px] font-extrabold text-[#64748B] uppercase tracking-wider">Requirement</th>
              <th className="p-5 text-left text-[11px] font-extrabold text-[#64748B] uppercase tracking-wider">Observation</th>
              <th className="p-5 text-right text-[11px] font-extrabold text-[#64748B] uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          {initialComplianceData.map(item => <ComplianceRow key={item.id} item={item} />)}
        </table>
      </div>
    </div>
  );
}