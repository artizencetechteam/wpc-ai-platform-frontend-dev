'use client';

import React from 'react';
import { Check, X, Minus } from 'lucide-react';

export type ComplianceStatus = 'present' | 'missing' | 'na';

interface ComplianceTableProps {
  documents: string[];
  employees: string[];
  data: Record<string, Record<string, ComplianceStatus>>;
  onStatusChange?: (doc: string, emp: string, status: ComplianceStatus) => void;
  readOnly?: boolean;
}

const statusColors = {
  present: {
    bg: 'bg-[#E3F9F1]',
    border: 'border-[#10B981]',
    text: 'text-[#059669]',
    icon: Check,
  },
  missing: {
    bg: 'bg-[#FEF2F2]',
    border: 'border-[#EF4444]',
    text: 'text-[#DC2626]',
    icon: X,
  },
  na: {
    bg: 'bg-[#FFF7ED]',
    border: 'border-[#F97316]',
    text: 'text-[#EA580C]',
    icon: Minus,
  },
};

export default function ComplianceTable({
  documents,
  employees,
  data,
  onStatusChange,
  readOnly = false,
}: ComplianceTableProps) {
  const getNextStatus = (current: ComplianceStatus): ComplianceStatus => {
    if (current === 'present') return 'missing';
    if (current === 'missing') return 'na';
    return 'present';
  };

  return (
    <div className="w-full overflow-hidden rounded-xl border border-gray-100 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-50">
              <th className="py-4 px-6 text-[14px] font-semibold text-[#1D1D1D] bg-[#F9FAFB] min-w-[200px]">
                Document Name
              </th>
              {employees.map((emp) => (
                <th key={emp} className="py-4 px-4 text-[13px] font-semibold text-[#4B5563] bg-[#F9FAFB] text-center min-w-[80px]">
                  {emp}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {documents.map((doc) => (
              <tr key={doc} className="hover:bg-gray-50/50 transition-colors">
                <td className="py-4 px-6 text-[13.5px] text-[#4B5563] font-medium">
                  {doc}
                </td>
                {employees.map((emp) => {
                  const status = data[doc]?.[emp] || 'na';
                  const Config = statusColors[status];
                  const Icon = Config.icon;

                  return (
                    <td key={emp} className="py-2 px-4 text-center">
                      <button
                        disabled={readOnly}
                        onClick={() => onStatusChange?.(doc, emp, getNextStatus(status))}
                        className={`inline-flex items-center justify-center w-8 h-8 rounded-md border transition-all
                          ${Config.bg} ${Config.border} ${Config.text}
                          ${!readOnly ? 'cursor-pointer hover:scale-110 active:scale-95' : 'cursor-default'}
                        `}
                      >
                        <Icon size={16} strokeWidth={3} />
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
