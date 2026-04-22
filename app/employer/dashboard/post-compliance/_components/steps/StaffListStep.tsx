'use client';

import React, { useState } from 'react';
import { useAuditStore, EmployeeType } from '@/app/store/auditStore';
import { Plus, Upload, User, UserCheck, Search, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StaffListStep() {
  const { employees, addEmployee } = useAuditStore();
  const [showAddOptions, setShowAddOptions] = useState(false);
  const [modalType, setModalType] = useState<'A' | 'B' | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    fullName: '',
    designation: '',
    workingHours: '',
    salaryRate: '',
    payrollOnboardingDate: '',
    sponsorNote: '',
  });

  const handleOpenAdd = () => setShowAddOptions(!showAddOptions);

  const handleSelectOption = (type: 'A' | 'B') => {
    setModalType(type);
    setShowAddOptions(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      designation: '',
      workingHours: '',
      salaryRate: '',
      payrollOnboardingDate: '',
      sponsorNote: '',
    });
  };

  const handleSimulateExtraction = (type: 'N' | 'OTHER') => {
    setIsExtracting(true);
    toast.loading('AI is extracting COS details...', { id: 'extracting' });
    
    setTimeout(() => {
      setIsExtracting(false);
      toast.dismiss('extracting');
      
      if (type === 'N') {
        setFormData({
          ...formData,
          fullName: 'John Doe',
          designation: 'Software Engineer',
          workingHours: '37.5',
          salaryRate: 'per annum',
          sponsorNote: 'N'
        });
        toast.success('Extraction complete (Case 1: Standard)');
      } else {
        setFormData({
          ...formData,
          fullName: 'Jane Smith',
          designation: 'Senior Consultant',
          workingHours: '40',
          salaryRate: 'per hour',
          sponsorNote: 'Priority details found in sponsor note.'
        });
        toast.success('Extraction complete (Case 2: Priority Note)');
      }
    }, 1500);
  };

  const handleSubmit = () => {
    const type: EmployeeType = modalType === 'A' ? 'Sponsored - New hire' : 'Not Sponsored';
    addEmployee({
      type,
      fullName: formData.fullName,
      designation: formData.designation,
      workingHours: formData.workingHours,
      salaryRate: formData.salaryRate,
      payrollOnboardingDate: formData.payrollOnboardingDate,
      cosDetails: modalType === 'A' ? {
        workStartDate: '2024-05-01',
        workEndDate: '2027-05-01',
        cosAssignDate: '2024-04-15',
        cosAssignDateRaw: '2024-04-15',
        sponsorNote: formData.sponsorNote || 'N'
      } : undefined
    });
    setModalType(null);
    toast.success('Employee added to sequential audit list');
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[18px] font-extrabold text-[#111827]">Staff List Management</h3>
          <p className="text-[13px] text-gray-400 font-medium">Add all employees sequentially to begin the audit.</p>
        </div>
        
        <div className="relative">
          <button 
            onClick={handleOpenAdd}
            className="flex items-center gap-3 px-6 py-3 bg-[#0852C9] text-white rounded-2xl font-black text-[14px] hover:bg-[#0644A8] transition-all shadow-xl shadow-blue-100 active:scale-95"
          >
            <Plus size={18} />
            Add Employee
          </button>

          {showAddOptions && (
            <div className="absolute right-0 mt-3 w-72 bg-white rounded-2xl border border-gray-100 shadow-2xl p-4 z-50 animate-in slide-in-from-top-2 duration-200">
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => handleSelectOption('A')}
                  className="flex items-start gap-3 p-4 hover:bg-blue-50 rounded-xl transition-colors text-left group"
                >
                  <div className="p-2 bg-blue-100 rounded-lg text-[#0852C9] group-hover:bg-[#0852C9] group-hover:text-white transition-colors">
                    <UserCheck size={18} />
                  </div>
                  <div>
                    <div className="text-[13px] font-black text-gray-900 uppercase">Option A: Sponsored</div>
                    <div className="text-[11px] text-gray-400 font-bold">Standard/Migrant workers with COS</div>
                  </div>
                </button>
                <button 
                  onClick={() => handleSelectOption('B')}
                  className="flex items-start gap-3 p-4 hover:bg-gray-50 rounded-xl transition-colors text-left group"
                >
                  <div className="p-2 bg-gray-100 rounded-lg text-gray-600 group-hover:bg-gray-900 group-hover:text-white transition-colors">
                    <User size={18} />
                  </div>
                  <div>
                    <div className="text-[13px] font-black text-gray-900 uppercase">Option B: Not Sponsored</div>
                    <div className="text-[11px] text-gray-400 font-bold">Permanent/Regional full-time staff</div>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Employee Grid */}
      {employees.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-20 bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-100">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4 border border-gray-100">
             <Search className="text-gray-300" size={24} />
          </div>
          <p className="text-[13px] font-bold text-gray-400">No employees added yet. Click "+ Add Employee" to start.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {employees.map((emp, index) => (
            <div key={emp.id} className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm flex items-center gap-5 hover:border-blue-100 transition-colors">
               <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg
                ${emp.type.includes('Sponsored') ? 'bg-blue-50 text-[#0852C9]' : 'bg-gray-50 text-gray-400'}
               `}>
                 {index + 1}
               </div>
               <div className="flex-1">
                 <div className="text-[11px] font-black text-gray-400 uppercase tracking-widest">{emp.type}</div>
                 <div className="text-[15px] font-black text-gray-900">{emp.fullName || 'Unnamed Employee'}</div>
                 <div className="text-[12px] text-gray-500 font-medium">{emp.designation} · {emp.workingHours}h/week</div>
               </div>
               {emp.cosDetails && (
                 <div className="px-3 py-1 bg-green-50 text-green-600 text-[10px] font-black rounded-full uppercase tracking-tighter">
                   COS Active
                 </div>
               )}
            </div>
          ))}
        </div>
      )}

      {/* Modal / Overlay for Entry */}
      {modalType && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl p-8 animate-in zoom-in-95 duration-200">
            <h4 className="text-[20px] font-black text-gray-900 mb-6 flex items-center gap-3">
              {modalType === 'A' ? 'Adding Sponsored Employee' : 'Adding Permanent Staff'}
              <span className="text-[12px] font-bold text-gray-400 uppercase opacity-50 tracking-widest">Entry Panel</span>
            </h4>

            <div className="flex flex-col gap-5">
              {modalType === 'A' && (
                <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 flex flex-col gap-4">
                   <div className="flex items-center justify-between">
                      <div className="text-[13px] font-black text-[#0852C9] uppercase">Step 1: Upload COS</div>
                      <div className="flex gap-2">
                         <button onClick={() => handleSimulateExtraction('N')} className="text-[10px] bg-white px-3 py-1 rounded border border-blue-100 text-blue-600 font-bold hover:bg-blue-600 hover:text-white transition-colors">Simulate Case 1 (N)</button>
                         <button onClick={() => handleSimulateExtraction('OTHER')} className="text-[10px] bg-white px-3 py-1 rounded border border-blue-100 text-blue-600 font-bold hover:bg-blue-600 hover:text-white transition-colors">Simulate Case 2 (Note)</button>
                      </div>
                   </div>
                   <div className="border-2 border-dashed border-blue-200 bg-white rounded-xl p-6 flex flex-col items-center justify-center gap-3 group hover:border-[#0852C9] transition-colors cursor-pointer">
                      <Upload className="text-[#0852C9]" size={24} />
                      <span className="text-[12px] font-bold text-gray-400">Click to upload COS (PDF/JPEG)</span>
                   </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                 <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-black text-gray-400 uppercase ml-2 tracking-widest">Full Name</label>
                    <input 
                      className="p-4 bg-gray-50 border border-transparent rounded-2xl text-[14px] font-bold focus:bg-white focus:border-blue-200 transition-all outline-none"
                      placeholder="e.g. John Doe"
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    />
                 </div>
                 <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-black text-gray-400 uppercase ml-2 tracking-widest">Designation</label>
                    <input 
                      className="p-4 bg-gray-50 border border-transparent rounded-2xl text-[14px] font-bold focus:bg-white focus:border-blue-200 transition-all outline-none"
                      placeholder="e.g. Software Engineer"
                      value={formData.designation}
                      onChange={(e) => setFormData({...formData, designation: e.target.value})}
                    />
                 </div>
                 <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-black text-gray-400 uppercase ml-2 tracking-widest">Working Hours</label>
                    <input 
                      className="p-4 bg-gray-50 border border-transparent rounded-2xl text-[14px] font-bold focus:bg-white focus:border-blue-200 transition-all outline-none"
                      placeholder="e.g. 37.5"
                      value={formData.workingHours}
                      onChange={(e) => setFormData({...formData, workingHours: e.target.value})}
                    />
                 </div>
                 <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-black text-gray-400 uppercase ml-2 tracking-widest">Salary Rate</label>
                    <select 
                      className="p-4 bg-gray-50 border border-transparent rounded-2xl text-[14px] font-bold focus:bg-white focus:border-blue-200 transition-all outline-none appearance-none"
                      value={formData.salaryRate}
                      onChange={(e) => setFormData({...formData, salaryRate: e.target.value})}
                    >
                      <option value="" disabled>Select rate</option>
                      <option value="per annum">per annum</option>
                      <option value="per hour">per hour</option>
                    </select>
                 </div>
              </div>

              <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-black text-gray-400 uppercase ml-2 tracking-widest">Payroll Onboarding Date</label>
                  <input 
                    type="date"
                    className="p-4 bg-gray-50 border border-transparent rounded-2xl text-[14px] font-bold focus:bg-white focus:border-blue-200 transition-all outline-none"
                    value={formData.payrollOnboardingDate}
                    onChange={(e) => setFormData({...formData, payrollOnboardingDate: e.target.value})}
                  />
              </div>
            </div>

            <div className="flex items-center gap-4 mt-10">
               <button 
                onClick={() => setModalType(null)}
                className="flex-1 py-4 text-[14px] font-black text-gray-400 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all"
               >
                 Discard
               </button>
               <button 
                onClick={handleSubmit}
                className="flex-1 py-4 text-[14px] font-black text-white bg-[#0852C9] rounded-2xl hover:bg-[#0644A8] shadow-lg shadow-blue-100 transition-all active:scale-95 flex items-center justify-center gap-2"
               >
                 {isExtracting && <Loader2 className="animate-spin" size={16} />}
                 Complete Entry
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
