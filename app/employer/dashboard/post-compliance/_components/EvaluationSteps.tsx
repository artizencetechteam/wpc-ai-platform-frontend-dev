'use client';

import React from 'react';
import { Check } from 'lucide-react';

interface EvaluationStepsProps {
  currentStep: number;
  steps: string[];
}

export default function EvaluationSteps({ currentStep, steps }: EvaluationStepsProps) {
  return (
    <div className="w-full bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-100/30 mb-8 overflow-x-auto scrollbar-hide">
      <div className="flex items-start justify-between min-w-[1100px] px-4 relative">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;
          const isLast = index === steps.length - 1;

          return (
            <React.Fragment key={step}>
              {/* Step Item */}
              <div className="flex flex-col items-center gap-4 relative z-10 w-[140px]">
                {/* Step Circle/Box */}
                <div
                  className={`flex items-center justify-center w-[52px] h-[52px] rounded-2xl border-2 transition-all duration-500 bg-white
                    ${isCompleted 
                      ? 'border-[#0852C9] text-[#0852C9] shadow-lg shadow-blue-50' 
                      : isActive 
                        ? 'border-[#0852C9] text-[#0852C9] ring-8 ring-blue-50/50' 
                        : 'border-gray-100 text-gray-300'}
                  `}
                >
                  {isCompleted ? (
                    <div className="bg-[#0852C9] w-full h-full rounded-[14px] flex items-center justify-center text-white">
                       <Check size={22} strokeWidth={4} />
                    </div>
                  ) : (
                    <span className={`text-[16px] font-black ${isActive ? 'text-[#0852C9]' : 'text-gray-300'}`}>
                      {index + 1}
                    </span>
                  )}
                </div>

                {/* Step Label */}
                <div className="h-10 flex items-start justify-center">
                  <span
                    className={`text-[10px] font-black uppercase tracking-widest text-center transition-colors duration-300 leading-tight px-2
                      ${isActive ? 'text-[#0852C9]' : isCompleted ? 'text-gray-900' : 'text-gray-400'}
                    `}
                  >
                    {step}
                  </span>
                </div>
              </div>
              
              {/* Connecting Line */}
              {!isLast && (
                <div className="flex-1 h-[2px] mt-[26px] bg-gray-100 relative overflow-hidden -mx-10 min-w-[40px]">
                   <div 
                    className="absolute inset-0 bg-[#0852C9] transition-all duration-1000 ease-in-out origin-left"
                    style={{ transform: `scaleX(${isCompleted ? 1 : 0})` }}
                   />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
