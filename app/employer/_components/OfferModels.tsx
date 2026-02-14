"use client";
import { useState, useEffect, useRef } from 'react';
import { X, Check, ChevronDown, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { get_job_titles, send_offer } from '@/app/action/job_role.action';
import { useParams } from 'next/navigation';

const OfferModals = ({ isOpen, onClose, candidateName = "Alexandra Thompson", candidateId, roleId, jrt }) => {
  const [step, setStep] = useState(1);
  const [jobTitles, setJobTitles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedJobTitle, setSelectedJobTitle] = useState(null);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const {candidateid,id} = useParams()
  
  const [formData, setFormData] = useState({
    position: '',
    salary: '',
    startDate: '',
    notes: ''
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load job titles when modal opens
  useEffect(() => {
    const loadJobTitles = async () => {
      try {
        const result = await get_job_titles();
        if (result.success && result.data) {
          setJobTitles(result.data);
        } else {
          toast.error(result.message || 'Failed to load job titles');
        }
      } catch (error) {
        console.error('Error loading job titles:', error);
        toast.error('Failed to load job titles');
      }
    };

    if (isOpen) {
      loadJobTitles();
    }
  }, [isOpen]);

  const filteredJobTitles = jobTitles.filter(job =>
    job.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleJobTitleSelect = (job) => {
    setSelectedJobTitle(job);
    setFormData(prev => ({ ...prev, position: job.name }));
    setSearchTerm('');
    setIsDropdownOpen(false);
  };

  const handleInputChange = (field, value) => {
    if (field === 'salary') {
      const numericValue = value.replace(/[^0-9]/g, '');
      setFormData(prev => ({ ...prev, [field]: numericValue }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleNext = () => {
    if (!formData.salary || !formData.startDate) {
      toast.error("Please fill all required fields");
      return;
    }
    setStep(2);
  };

  const handleEdit = () => {
    setStep(1);
  };

  const handleSendOffer = async () => {
    setLoading(true);
    
    try {
      const offerData = {
        role: Number(id),
        job_title: jrt.id,
        proposed_start_date: formData.startDate,
        annual_salary: Number(formData.salary),
        additional_note: formData.notes
      };

      const result = await send_offer(Number(candidateid), offerData);
      
      if (result.success) {
        setStep(3);
        toast.success("Offer sent successfully!");
      } else {
        toast.error(result.message || 'Failed to send offer');
      }
    } catch (error) {
      console.error('Error sending offer:', error);
      toast.error('Failed to send offer');
    } finally {
      setLoading(false);
    }
  };

  const handleDone = () => {
    setStep(1);
    setSelectedJobTitle(null);
    setSearchTerm('');
    setFormData({
      position: '',
      salary: '',
      startDate: '',
      notes: ''
    });
    onClose();
  };

  const formatSalary = (salary) => {
    if (!salary) return '';
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(salary);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <style>{`
        * {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        }
      `}</style>

      <div 
        className="absolute inset-0 bg-black/30 bg-opacity-50"
        onClick={step === 3 ? null : onClose}
      />

      <div className="relative w-full max-w-full md:max-w-[600px] mx-4">
        {step === 1 && (
          <div className="bg-white rounded-lg shadow-xl overflow-hidden">
            <div className="bg-[#0852C9] p-7 flex items-start justify-between">
              <div>
                <h2 className="text-[20px] font-bold text-white">Make an Offer</h2>
                <p className="text-[14px] text-[#FFFFFF] mt-3">
                  Extend an offer to {candidateName}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:font-bold transition-colors duration-200"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div ref={dropdownRef}>
                <label className="block text-[14px] font-medium text-[#111111] mb-2">
                  Position
                </label>
                <div className="relative">
                  <div 
                    className="w-full px-4 py-2.5 rounded-md border border-[#E8E4ED] text-[15px] text-[#383838] flex items-center justify-between cursor-pointer focus-within:ring-2 focus-within:ring-[#2563eb] focus-within:border-transparent"
                    
                    role="button"
                    tabIndex={0}
                  >
                    <span className={jrt ? "text-[#383838]" : "text-gray-400"}>
                      {jrt ? jrt.name : "Select a position"}
                    </span>  
                  </div>

                  {/* {isDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-[#E8E4ED] rounded-md shadow-lg max-h-[300px] overflow-hidden">
                      <div className="p-2 border-b border-[#E8E4ED]">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search positions..."
                            className="w-full pl-10 pr-4 py-2 text-[14px] border border-[#E8E4ED] rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                      
                      <div className="max-h-[240px] overflow-y-auto">
                        {filteredJobTitles.length > 0 ? (
                          filteredJobTitles.map((job) => (
                            <div
                              key={job.id}
                              onClick={() => handleJobTitleSelect(job)}
                              className={`px-4 py-2.5 cursor-pointer hover:bg-[#f3f4f6] text-[14px] ${
                                selectedJobTitle?.id === job.id ? 'bg-[#E4F1FF] text-[#0852C9]' : 'text-[#383838]'
                              }`}
                            >
                              {job.name}
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-2.5 text-[14px] text-gray-400">
                            No positions found
                          </div>
                        )}
                      </div>
                    </div>
                  )} */}
                </div>
              </div>

              <div>
                <label className="block text-[14px] font-medium text-[#111111] mb-2">
                  Annual Salary (£)
                </label>
                <input
                  type="text"
                  value={formData.salary}
                  onChange={(e) => handleInputChange('salary', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-md border border-[#E8E4ED] text-[15px] text-[#383838] focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
                  placeholder="e.g. 28000"
                />
              </div>

              <div>
                <label className="block text-[14px] font-medium text-[#111111] mb-2">
                  Proposed Start Date
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  min={getTodayDate()}
                  className="w-full px-4 py-2.5 rounded-md border border-[#E8E4ED] text-[15px] text-[#383838] focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-[14px] font-medium text-[#111111] mb-2">
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-md border border-[#E8E4ED] text-[15px] text-[#383838] resize-none focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
                  placeholder="Any additional details about the offer..."
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-[#f9fafb] border-t border-[#e5e7eb] flex items-center justify-between gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-md border border-[#0A65CC] md:max-w-[200px] bg-white text-[#0A65CC] font-medium text-[15px] transition-colors duration-200 hover:bg-[#f3f4f6]"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                className="flex-1 py-2.5 rounded-md md:max-w-[200px] bg-[#0852C9] hover:bg-[#0852C9]/90 text-white font-medium text-[15px] transition-all duration-200 hover:bg-[#1d4ed8] hover:shadow-md"
              >
                Review Offer
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="bg-white rounded-lg shadow-xl overflow-hidden">
            <div className="bg-[#0852C9] px-6 py-5 flex items-start justify-between">
              <div>
                <h2 className="text-[20px] font-bold text-white">Confirm Offer</h2>
                <p className="text-[14px] text-[#FFFFFF] mt-3">
                  Please review the offer details
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-white transition-colors duration-200"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className='px-4 py-5.5 space-y-4 border border-[#D0D5DD] rounded-[6px]'>
                <div className="flex justify-between items-start">
                  <span className="text-[14px] text-[#000000C4]">Candidate</span>
                  <span className="text-[15px] font-semibold text-[#000000E0] text-right">
                    {candidateName}
                  </span>
                </div>

                <div className="flex justify-between items-start">
                  <span className="text-[14px] text-[#000000C4]">Position</span>
                  <span className="text-[15px] font-semibold text-[#000000E0] text-right">
                    {jrt ? jrt.name : "Select a position"}
                  </span>
                </div>

                <div className="flex justify-between items-start">
                  <span className="text-[14px] text-[#000000C4]">Annual Salary</span>
                  <span className="text-[15px] font-semibold text-[#0852C9] text-right">
                    {formatSalary(formData.salary)}
                  </span>
                </div>

                <div className="flex justify-between items-start">
                  <span className="text-[14px] text-[#000000C4]">Start Date</span>
                  <span className="text-[15px] font-semibold text-[#000000E0] text-right">
                    {formatDate(formData.startDate)}
                  </span>
                </div>
              </div>

              <div className="mt-6 p-4 bg-[#FFF4E1] border border-[#F79F07] rounded-[6px]">
                <p className="text-[13px] font-medium text-[#B47C44] mb-1">
                  Success Fee Notice
                </p>
                <p className="text-[13px] text-[#B47C44] leading-relaxed">
                  By sending this offer, you agree to WPC's recruitment success fee of £1,500–£3,000 upon candidate acceptance.
                </p>
              </div>
            </div>

            <div className="px-6 py-4 bg-[#f9fafb] border-t border-[#e5e7eb] flex items-center justify-between gap-3">
              <button
                onClick={handleEdit}
                disabled={loading}
                className="flex-1 py-2.5 rounded-md border border-[#0A65CC] md:max-w-[200px] bg-white text-[#0A65CC] font-medium text-[15px] transition-colors duration-200 hover:bg-[#f3f4f6] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Edit Offer
              </button>
              <button
                onClick={handleSendOffer}
                disabled={loading}
                className="flex-1 py-2.5 rounded-md md:max-w-[200px] bg-[#0852C9] hover:bg-[#0852C9]/90 text-white font-medium text-[15px] transition-all duration-200 hover:bg-[#1d4ed8] hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Sending...
                  </>
                ) : (
                  'Send Offer'
                )}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="bg-white rounded-lg shadow-xl overflow-hidden">
            <div className="p-8 text-center">
              <div className="flex justify-center mb-6">
                <div className="w-25 h-25 rounded-full bg-[#E9FBEF] flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full border-[3px] border-[#33951A] flex items-center justify-center">
                    <Check className="w-8 h-8 text-[#33951A]" strokeWidth={3} />
                  </div>
                </div>
              </div>
              <h2 className="text-[22px] font-semibold text-[#000000] mb-3">
                Offer Sent!
              </h2>
              <p className="text-[15px] text-[#000000] leading-relaxed mb-8">
                Your offer has been sent to {candidateName}.<br />
                You'll be notified when they respond.
              </p>

              <button
                onClick={handleDone}
                className="w-full py-3 rounded-md bg-[#0852C9] text-white font-medium text-[15px] transition-all duration-200 hover:bg-[#1d4ed8] hover:shadow-md"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OfferModals;