'use client';

import React from 'react';
import { CheckCircle, AlertTriangle, XCircle, ArrowRight } from 'lucide-react';

const SummaryCard: React.FC<{ title: string; count: number; color: string; icon: React.ReactNode }> = ({ title, count, color, icon }) => {
  const colorClasses = {
    green: 'border-green-500 bg-green-50',
    orange: 'border-orange-500 bg-orange-50',
    red: 'border-red-500 bg-red-50',
  };

  return (
    <div className={`flex-1 p-6 rounded-2xl border-2 ${colorClasses[color]} flex items-center gap-5`}>
      {icon}
      <div>
        <div className="text-3xl font-extrabold text-gray-800">{count}</div>
        <div className="text-sm font-semibold text-gray-600 mt-1">{title}</div>
      </div>
    </div>
  );
};

export default function ReviewAndSubmit() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h3 className="text-[16px] font-bold text-gray-900">Review & Submit</h3>
        <p className="text-[12px] text-gray-500">Review all findings before final submission.</p>
      </div>

      <div className="flex gap-6">
        <SummaryCard 
          title="Compliant" 
          count={1} 
          color="green" 
          icon={<CheckCircle size={36} className="text-green-500" />} 
        />
        <SummaryCard 
          title="Partially Compliant" 
          count={2} 
          color="orange" 
          icon={<AlertTriangle size={36} className="text-orange-500" />} 
        />
        <SummaryCard 
          title="Non-Compliant" 
          count={3} 
          color="red" 
          icon={<XCircle size={36} className="text-red-500" />} 
        />
      </div>

      <div className="flex flex-col gap-4 pt-8 border-t border-gray-100">
        <h4 className="text-[14px] font-bold text-gray-900">Declaration</h4>
        <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
          <input id="declaration" type="checkbox" className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
          <label htmlFor="declaration" className="text-sm text-gray-600">
            I confirm that the information provided is accurate and complete to the best of my knowledge. I understand that this submission will be used for compliance evaluation purposes.
          </label>
        </div>
      </div>
    </div>
  );
}