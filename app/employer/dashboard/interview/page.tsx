'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Search, Calendar, MapPin, Video, RefreshCw, ExternalLink, Trash2Icon } from 'lucide-react';
import toast from 'react-hot-toast';
import { get_employer_interviews, EmployerInterview, delete_interview } from "../../../action/job_role.action"
import { useRouter } from 'next/navigation';
import RescheduleModal from '../../_components/Reschedule';
export default function EmployerInterviewPage() {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'requests' | 'completed'>('upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [interviews, setInterviews] = useState<EmployerInterview[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<EmployerInterview | null>(null);

  // router
  const router = useRouter()

  // Fetch interviews on mount
  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    setLoading(true);
    const response = await get_employer_interviews();
    
    if (response.success && response.data) {
      setInterviews(response.data);
    } else {
      toast.error(response.message);
    }
    
    setLoading(false);
  };

  const handleOpenRescheduleModal = (interview: EmployerInterview) => {
    setSelectedInterview(interview);
    setIsRescheduleModalOpen(true);
  };

  const handleCloseRescheduleModal = () => {
    setIsRescheduleModalOpen(false);
    setSelectedInterview(null);
  };

  const handleRescheduleSuccess = () => {
    // Refresh interviews list after successful reschedule
    fetchInterviews();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Filter interviews
  const filteredInterviews = interviews.filter(interview => {
    // Filter by tab
    if (activeTab === 'upcoming' && interview.status === 'completed') return false;
    if (activeTab === 'requests' && interview.status !== 'pending') return false;
    if (activeTab === 'completed' && interview.status !== 'completed') return false;
    
    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesRole = interview.role_title.toLowerCase().includes(query);
      const matchesCandidate = interview.candidate_email.toLowerCase().includes(query);
      
      if (!matchesRole && !matchesCandidate) {
        return false;
      }
    }
    
    // Filter by date category
    if (filterCategory !== 'All') {
      const interviewDate = new Date(interview.time_slot_1);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (filterCategory === 'This Week') {
        const weekFromNow = new Date(today);
        weekFromNow.setDate(today.getDate() + 7);
        
        if (interviewDate < today || interviewDate > weekFromNow) {
          return false;
        }
      }
      
      if (filterCategory === 'This Month') {
        const monthFromNow = new Date(today);
        monthFromNow.setMonth(today.getMonth() + 1);
        
        if (interviewDate < today || interviewDate > monthFromNow) {
          return false;
        }
      }
      
      if (filterCategory === 'Today') {
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        
        if (interviewDate < today || interviewDate >= tomorrow) {
          return false;
        }
      }
    }
    
    return true;
  });

const [deletingId, setDeletingId] = useState<number | null>(null);

const handle_delete = async (id: number) => {
  setDeletingId(id);  
  
  try {
    const res = await delete_interview(id);
    
    if (!res.success) {
      toast.error(res.message || "Failed to delete the interview");
    } else {
      toast.success("Interview deleted successfully");
      fetchInterviews();  
    }
  } catch (error) {
    console.error('Delete error:', error);
    toast.error("An error occurred while deleting the interview");
  } finally {
    setDeletingId(null);  
  }
};

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-[1400px] mx-auto">
        {/* Header Section */}
        <div className="mb-6 flex items-center justify-between gap-6">
          <div className="flex-shrink-0">
            <h1 className="text-[30px] font-semibold text-[#18191C] mb-1">
              Interviews
            </h1>
            <p className="text-[14px] text-[#5E6670]">
              Manage your upcoming and requested interviews
            </p>
          </div>
          
          <div className="flex items-center gap-3 flex-1 max-w-[600px]">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#9199A3]" />
              <input
                type="text"
                placeholder="Search interviews..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-full pl-10 pr-4 py-2.5 text-[14px] text-[#18191C] placeholder:text-[#9199A3] border border-[#D6DDEB] focus:outline-none focus:border-[#0A65CC] bg-white"
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2.5 border border-[#D6DDEB] rounded-full text-[14px] text-[#18191C] bg-white focus:outline-none cursor-pointer flex-shrink-0"
            >
              <option value="All">All</option>
              <option value="Today">Today</option>
              <option value="This Week">This Week</option>
              <option value="This Month">This Month</option>
            </select>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-lg border-l-4 border-l-[#E0E0E0] shadow-sm animate-pulse"
              >
                <div className="p-5 flex items-center gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-[48px] h-[48px] rounded-full bg-[#E7F0FA]"></div>
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <div className="h-4 bg-[#E0E0E0] rounded w-32 mb-2"></div>
                    <div className="h-3 bg-[#E0E0E0] rounded w-24 mb-2"></div>
                    <div className="h-3 bg-[#E0E0E0] rounded w-28"></div>
                  </div>
                  <div className="flex items-center gap-2 min-w-[140px]">
                    <div className="w-4 h-4 bg-[#E0E0E0] rounded"></div>
                    <div>
                      <div className="h-3 bg-[#E0E0E0] rounded w-20 mb-1"></div>
                      <div className="h-3 bg-[#E0E0E0] rounded w-16"></div>
                    </div>
                  </div>
                  <div className="min-w-[130px]">
                    <div className="h-8 bg-[#E0E0E0] rounded w-24"></div>
                  </div>
                  <div className="min-w-[100px]">
                    <div className="h-7 bg-[#E0E0E0] rounded w-20"></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-9 bg-[#E0E0E0] rounded w-28"></div>
                    <div className="h-9 w-9 bg-[#E0E0E0] rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Interview Cards */}
        {!loading && (
          <>
            {filteredInterviews.length > 0 ? (
              <div className="space-y-4">
                {filteredInterviews.map((interview) => (
                  <div
                    key={interview.id}
                    className="bg-white rounded-lg border-l-4 border-l-[#0A65CC] shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="p-5 flex items-center gap-6">
                      {/* Candidate Avatar */}
                      <div className="flex-shrink-0">
                        <div className="w-[48px] h-[48px] rounded-full bg-[#E7F0FA] flex items-center justify-center">
                          <span className="text-[16px] font-semibold text-[#0A65CC]">
                            {getInitials(interview.role_title)}
                          </span>
                        </div>
                      </div>

                      {/* Interview Info */}
                      <div className="flex-1 min-w-[200px]">
                        <h3 className="text-[16px] font-semibold text-[#18191C] mb-1">
                          {interview.role_title}
                        </h3>
                        <p className="text-[14px] text-[#474C54] mb-1.5">
                          Candidate Interview
                        </p>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-[14px] h-[14px] text-[#767F8C]" />
                          <span className="text-[12px] text-[#767F8C]">{interview.candidate_email}</span>
                        </div>
                      </div>

                      {/* Date & Time */}
                      <div className="flex items-center gap-2 min-w-[140px]">
                        <Calendar className="w-[16px] h-[16px] text-[#767F8C]" />
                        <div>
                          <p className="text-[14px] font-medium text-[#18191C]">
                            {formatDate(interview.time_slot_1)}
                          </p>
                          <p className="text-[12px] text-[#767F8C]">
                            {formatTime(interview.time_slot_1)}
                          </p>
                        </div>
                      </div>

                      {/* Platform */}
                      <div className="min-w-[130px]">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#D6DDEB] rounded-md w-fit">
                          <Video className="w-[14px] h-[14px] text-[#0A65CC]" />
                          <span className="text-[13px] text-[#18191C]">
                            {interview.mode || 'Ms Teams'}
                          </span>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="min-w-[100px]">
                        {interview.status === 'confirmed' ? (
                          <span className="inline-block px-3 py-1.5 bg-[#E7F6EA] text-[#0BA02C] text-[13px] font-medium rounded-md">
                            Confirmed
                          </span>
                        ) : interview.status === 'pending' ? (
                          <span className="inline-block px-3 py-1.5 bg-[#FFF4ED] text-[#FF6B00] text-[13px] font-medium rounded-md">
                            Pending
                          </span>
                        ) : (
                          <span className="inline-block px-3 py-1.5 bg-[#E8ECFF] text-[#5465E0] text-[13px] font-medium rounded-md">
                            {interview.status}
                          </span>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        {interview.status === 'confirmed' ? (
                          <>
                            {interview.joining_link ? (
                              <button 
                                onClick={() => window.open(interview.joining_link, '_blank')}
                                className="px-4 py-2 bg-[#0BA02C] text-white text-[13px] font-medium rounded-md hover:bg-[#099125] transition whitespace-nowrap flex items-center gap-1.5"
                              >
                                <ExternalLink className="w-[14px] h-[14px]" />
                                Join Meeting
                              </button>
                            ) : (
                              <span className="px-4 py-2 bg-[#F1F2F4] text-[#767F8C] text-[13px] font-medium rounded-md">
                                Link Pending
                              </span>
                            )}
                            <button 
                              onClick={() => handleOpenRescheduleModal(interview)}
                              className="p-2 hover:bg-[#F1F2F4] rounded-md transition"
                              title="Reschedule"
                            >
                              <RefreshCw className="w-[18px] h-[18px] text-[#767F8C]" />
                            </button>
                          </>
                        ) : interview.status === 'pending' ? (
                          <>
                            <button 
                              onClick={() => handleOpenRescheduleModal(interview)}
                              className="px-4 py-2 flex items-center gap-1 bg-white border border-[#D6DDEB] text-[#18191C] text-[14px] font-medium rounded-md hover:bg-[#F8F8F8] transition"
                            >
                             <RefreshCw size={15} /> Reschedule
                            </button>
                            <button 
                              onClick={() => handle_delete(interview.id)}
                              className="px-4 py-2 bg-white border border-[#D6DDEB] text-[#18191C] text-[10px] font-medium rounded-md hover:bg-[#F8F8F8] transition"
                            >
                              <Trash2Icon size={15}/>
                            </button>
                          </>
                        ) : (
                          <span className="px-4 py-2 bg-[#F1F2F4] text-[#767F8C] text-[13px] font-medium rounded-md">
                            {interview.status}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="w-full flex flex-col items-center justify-center gap-3 md:gap-4 mt-8 py-12">
                <Image 
                  src="/interview.png" 
                  alt="No interviews scheduled" 
                  width={600} 
                  height={400} 
                  className="w-full max-w-[400px] md:max-w-[600px] h-[300px] md:h-[400px] object-contain"
                />
                
                <div className="w-full max-w-[600px] px-4 flex flex-col items-center justify-center gap-3 md:gap-4">
                  <h2 className="text-[24px] md:text-[28px] text-[#2F2F2F] font-semibold text-center">
                    No interviews {activeTab === 'upcoming' ? 'scheduled' : activeTab === 'requests' ? 'requested' : 'completed'}
                  </h2>
                  <p className="text-[16px] md:text-[18px] text-[#373737] text-center leading-relaxed">
                    {searchQuery 
                      ? 'No interviews match your search. Try adjusting your filters.' 
                      : `You haven't ${activeTab === 'upcoming' ? 'scheduled any' : activeTab === 'requests' ? 'received any' : 'completed any'} interviews yet. Once candidates are shortlisted, interviews will appear here.`
                    }
                  </p>

                  {!searchQuery && (
                    <>
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-4">
                        <button 
                          onClick={() => router.push('/')}
                          className="px-6 py-3 border-2 border-[#0A65CC] text-[#0A65CC] rounded-md text-[16px] font-semibold hover:bg-[#0A65CC] hover:text-white transition-colors"
                        >
                          View candidates
                        </button>
                        <button 
                           onClick={() => router.push('/')}
                          className="px-6 py-3 bg-[#0A65CC] text-white rounded-md text-[16px] font-semibold hover:bg-[#0952b8] transition-colors"
                        >
                          Schedule an interview
                        </button>
                      </div>

                      <p className="text-[14px] md:text-[16px] text-[#424242] text-center mt-2">
                        Shortlist candidates to start scheduling interviews.
                      </p>
                    </> 
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Reschedule Modal */}
      {selectedInterview && (
        <RescheduleModal
          isOpen={isRescheduleModalOpen}
          onClose={handleCloseRescheduleModal}
          interview={selectedInterview}
          onRescheduleSuccess={handleRescheduleSuccess}
        />
      )}
    </div>
  );
}