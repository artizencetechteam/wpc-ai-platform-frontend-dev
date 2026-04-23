'use client';

import React, { useState } from 'react';
import { useAuditStore, DocAvailability } from '@/app/store/auditStore';
import { Check, X, Minus, MessageSquare, AlertCircle, Info, User, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { updatePostComplianceStaffDetailsAction } from '@/app/employer/sections/action/action';

const DOSSIER_DOCS = [
  'Passport', 'BRP/EVISA', 'Visa Vignette', 'COS', 'Right to work check',
  'Proof of address', 'History of contact details (evidence)', 'Change of circumstance tracking',
  'Personal information', 'Employment contract', 'CV (candidate)', 'Experience Letter',
  'Experience letter validation', 'CV (unsuccessful candidates)', 'Job advert',
  'Interview note (candidate)', 'Interview notes (unsuccessful candidates)',
  'English Language Proficiency test', 'TB Test', 'P45 (previous employer)',
  'Attendance records', 'Evidence of Work', 'Holiday/Leave records',
  'Unauthorized Absence', 'Work Location changed', 'Statutory Leaves', 'Visa Monitoring'
];

// Maps display label → API field name on the staff detail endpoint
const DOC_TO_API: Record<string, string> = {
  'Passport':                                  'passport',
  'BRP/EVISA':                                 'brp_visa',
  'Visa Vignette':                             'visa_vignette',
  'COS':                                       'cos',
  'Right to work check':                       'right_to_work_check',
  'Proof of address':                          'proof_of_address',
  'History of contact details (evidence)':     'history_of_contact_details',
  'Change of circumstance tracking':           'change_of_circumstance_tracking',
  'Personal information':                      'personal_information',
  'Employment contract':                       'employment_contract',
  'CV (candidate)':                            'cv_candidate',
  'Experience Letter':                         'experience_letter',
  'Experience letter validation':              'experience_letter_validation',
  'CV (unsuccessful candidates)':              'cv_unsuccessful_candidates',
  'Job advert':                                'job_advert',
  'Interview note (candidate)':                'interview_note_candidate',
  'Interview notes (unsuccessful candidates)': 'interview_notes_unsuccessful',
  'English Language Proficiency test':         'english_language_proficiency_test',
  'TB Test':                                   'tb_test',
  'P45 (previous employer)':                   'p45_previous_employer',
  'Attendance records':                        'attendance_records',
  'Evidence of Work':                          'evidence_of_work',
  'Holiday/Leave records':                     'holiday_leave_records',
  'Unauthorized Absence':                      'unauthorised_absence',
  'Work Location changed':                     'work_location_changed',
  'Statutory Leaves':                          'statutory_leaves',
  'Visa Monitoring':                           'visa_monitoring',
};

export default function DossierWorkflow() {
  const { employees, updateEmployee } = useAuditStore();
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(employees[0]?.id || null);
  const [isSaving, setIsSaving] = useState(false);

  const selectedEmployee = employees.find(e => e.id === selectedEmpId);

  const handleDocStatus = (doc: string, status: DocAvailability) => {
    if (!selectedEmpId) return;
    const currentDocs = selectedEmployee?.documents || {};
    updateEmployee(selectedEmpId, {
      documents: { ...currentDocs, [doc]: status }
    });
  };

  const handleRemarks = (obs: string, rec: string) => {
    if (!selectedEmpId) return;
    updateEmployee(selectedEmpId, {
      remarks: { observation: obs, recommendation: rec }
    });
  };

  const handleSaveDossier = async () => {
    if (!selectedEmployee || !selectedEmpId) return;
    const staffId = Number(selectedEmpId);
    if (isNaN(staffId)) {
      toast.error('Invalid employee ID.');
      return;
    }
    setIsSaving(true);
    try {
      // Build the payload by mapping each document label to its API field
      const docPayload: Record<string, string | null> = {};
      for (const doc of DOSSIER_DOCS) {
        const apiField = DOC_TO_API[doc];
        if (apiField) {
          const rawStatus = selectedEmployee.documents[doc];
          let apiStatus = null;
          if (rawStatus === 'present') apiStatus = 'Available';
          else if (rawStatus === 'missing') apiStatus = 'Missing';
          else if (rawStatus === 'n/a') apiStatus = 'N/A';
          docPayload[apiField] = apiStatus;
        }
      }
      const res = await updatePostComplianceStaffDetailsAction(staffId, {
        ...docPayload,
        overall_observation: selectedEmployee.remarks?.observation || null,
        recommendation_remarks: selectedEmployee.remarks?.recommendation || null,
      });
      if (res.success) {
        toast.success('Dossier saved to server');
      } else {
        toast.error(res.message || 'Save failed.');
      }
    } catch {
      toast.error('Network error saving dossier.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h3 className="text-[18px] font-extrabold text-[#111827]">Workflow 1: Personnel Dossier</h3>
        <p className="text-[13px] text-gray-400 font-medium">Detailed document availability check for each employee file.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Staff Switcher */}
        <div className="w-full lg:w-[240px] flex flex-col gap-2 shrink-0">
           {employees.map(emp => (
             <button
               key={emp.id}
               onClick={() => setSelectedEmpId(emp.id)}
               className={`p-4 rounded-2xl border transition-all text-left flex items-center gap-3
                 ${selectedEmpId === emp.id ? 'bg-[#0852C9] border-[#0852C9] text-white shadow-xl shadow-blue-100' : 'bg-white border-gray-100 text-gray-500 hover:border-blue-100'}
               `}
             >
               <User size={16} />
               <span className="text-[13px] font-black truncate">{emp.fullName}</span>
             </button>
           ))}
        </div>

        {/* Checklist Matrix */}
        <div className="flex-1 w-full flex flex-col gap-8">
           {selectedEmployee ? (
             <>
               <div className="overflow-x-auto border border-gray-100 rounded-3xl bg-white shadow-sm overflow-hidden">
                  <table className="min-w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="p-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">Document Registry</th>
                        <th className="p-5 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">N/A</th>
                        <th className="p-5 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">✓ (Available)</th>
                        <th className="p-5 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">× (Missing)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {DOSSIER_DOCS.map(doc => {
                        const status = selectedEmployee.documents[doc];
                        return (
                          <tr key={doc} className="hover:bg-gray-50 transition-colors">
                            <td className="p-5 text-[14px] font-bold text-gray-700">{doc}</td>
                            <td className="p-2 text-center">
                              <button 
                                onClick={() => handleDocStatus(doc, 'n/a')}
                                className={`w-10 h-10 rounded-xl inline-flex items-center justify-center transition-all
                                  ${status === 'n/a' ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-300 hover:bg-gray-100'}
                                `}>
                                <Minus size={18} />
                              </button>
                            </td>
                            <td className="p-2 text-center">
                              <button 
                                onClick={() => handleDocStatus(doc, 'present')}
                                className={`w-10 h-10 rounded-xl inline-flex items-center justify-center transition-all
                                  ${status === 'present' ? 'bg-green-500 text-white shadow-lg shadow-green-100' : 'text-gray-300 hover:bg-green-50'}
                                `}>
                                <Check size={18} />
                              </button>
                            </td>
                            <td className="p-2 text-center">
                              <button 
                                onClick={() => handleDocStatus(doc, 'missing')}
                                className={`w-10 h-10 rounded-xl inline-flex items-center justify-center transition-all
                                  ${status === 'missing' ? 'bg-red-500 text-white shadow-lg shadow-red-100' : 'text-gray-300 hover:bg-red-50'}
                                `}>
                                <X size={18} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
               </div>

               {/* Remarks Section */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-3 p-6 bg-blue-50/50 rounded-3xl border border-blue-100">
                     <div className="flex items-center gap-2 text-[12px] font-black text-[#0852C9] uppercase">
                       <MessageSquare size={16} />
                       Overall Observation
                     </div>
                     <textarea 
                       className="p-4 bg-white rounded-2xl border border-blue-100 text-[13px] font-medium min-h-[120px] outline-none focus:ring-2 ring-blue-100 transition-all"
                       placeholder="Enter findings and patterns observed..."
                       value={selectedEmployee.remarks?.observation || ''}
                       onChange={(e) => handleRemarks(e.target.value, selectedEmployee.remarks?.recommendation || '')}
                     />
                  </div>
                  <div className="flex flex-col gap-3 p-6 bg-green-50/50 rounded-3xl border border-green-100">
                     <div className="flex items-center gap-2 text-[12px] font-black text-green-600 uppercase">
                       <AlertCircle size={16} />
                       Recommendation Remarks
                     </div>
                     <textarea 
                       className="p-4 bg-white rounded-2xl border border-green-100 text-[13px] font-medium min-h-[120px] outline-none focus:ring-2 ring-green-100 transition-all"
                       placeholder="Enter required actions and improvements..."
                       value={selectedEmployee.remarks?.recommendation || ''}
                       onChange={(e) => handleRemarks(selectedEmployee.remarks?.observation || '', e.target.value)}
                     />
                  </div>
               </div>

               <div className="flex justify-end pt-4">
                  <button 
                    onClick={handleSaveDossier}
                    disabled={isSaving}
                    className={`px-12 py-4 bg-gray-900 text-white rounded-2xl text-[14px] font-black shadow-xl flex items-center gap-2 transition-all active:scale-95 ${isSaving ? 'opacity-70 pointer-events-none' : ''}`}
                  >
                    {isSaving && <Loader2 className="animate-spin" size={16} />}
                    {isSaving ? 'Saving...' : 'Save Dossier'}
                  </button>
               </div>
             </>
           ) : (
             <div className="p-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-center">
                <Info className="text-gray-300 mb-4" size={32} />
                <p className="text-[14px] font-bold text-gray-400">Add employees to start the Dossier check.</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
