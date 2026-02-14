'use client';

import React, { useState, useEffect } from 'react';
import { Search, Calendar, MapPin, Video, RefreshCw, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { get_candidate_interviews, Interview } from '@/app/action/candidate.action';

export default function InterviewPage() {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'requests' | 'completed'>('upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch interviews on mount
  useEffect(() => {
    const fetchInterviews = async () => {
      setLoading(true);
      const response = await get_candidate_interviews();
      
      if (response.success && response.data) {
        setInterviews(response.data);
      } else {
        toast.error(response.message);
      }
      
      setLoading(false);
    };

    fetchInterviews();
  }, []);

  const getInitials = (company: string) => {
    return company
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
      return interview.role_title.toLowerCase().includes(query);
    }
    
    return true;
  });

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-[1400px] mx-auto">
        {/* Header Section */}
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
          <div className="flex-shrink-0">
            <h1 className="text-[24px] sm:text-[30px] font-semibold text-[#18191C] mb-1">
              Interviews
            </h1>
            <p className="text-[14px] text-[#5E6670]">
              Manage your upcoming and requested interviews
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:flex-1 sm:max-w-[600px]">
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
              className="px-4 py-2.5 border border-[#D6DDEB] rounded-full text-[14px] text-[#18191C] bg-white focus:outline-none cursor-pointer flex-shrink-0 w-full sm:w-auto"
            >
              <option value="All">All</option>
              <option value="This Week">This Week</option>
              <option value="This Month">This Month</option>
            </select>
          </div>
        </div>

        {/* Tabs */}
        {/* <div className="flex gap-6 mb-6 border-b border-[#D6DDEB]">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`pb-3 text-[14px] font-medium relative ${
              activeTab === 'upcoming'
                ? 'text-[#0A65CC] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#0A65CC]'
                : 'text-[#767F8C]'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`pb-3 text-[14px] font-medium relative ${
              activeTab === 'requests'
                ? 'text-[#0A65CC] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#0A65CC]'
                : 'text-[#767F8C]'
            }`}
          >
            Requests
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`pb-3 text-[14px] font-medium relative ${
              activeTab === 'completed'
                ? 'text-[#0A65CC] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#0A65CC]'
                : 'text-[#767F8C]'
            }`}
          >
            Completed
          </button>
        </div> */}

        {/* Loading State */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-lg border-l-4 border-l-[#E0E0E0] shadow-sm animate-pulse"
              >
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                  {/* Company Avatar Shimmer */}
                  <div className="flex-shrink-0">
                    <div className="w-[48px] h-[48px] rounded-full bg-[#E7F0FA]"></div>
                  </div>

                  {/* Company Info Shimmer */}
                  <div className="flex-1 min-w-[200px] w-full sm:w-auto">
                    <div className="h-4 bg-[#E0E0E0] rounded w-32 mb-2"></div>
                    <div className="h-3 bg-[#E0E0E0] rounded w-24 mb-2"></div>
                    <div className="h-3 bg-[#E0E0E0] rounded w-28"></div>
                  </div>

                  {/* Date & Time Shimmer */}
                  <div className="flex items-center gap-2 min-w-[140px] w-full sm:w-auto">
                    <div className="w-4 h-4 bg-[#E0E0E0] rounded"></div>
                    <div>
                      <div className="h-3 bg-[#E0E0E0] rounded w-20 mb-1"></div>
                      <div className="h-3 bg-[#E0E0E0] rounded w-16"></div>
                    </div>
                  </div>

                  {/* Platform Shimmer */}
                  <div className="min-w-[130px] w-full sm:w-auto">
                    <div className="h-8 bg-[#E0E0E0] rounded w-24"></div>
                  </div>

                  {/* Status Shimmer */}
                  <div className="min-w-[100px] w-full sm:w-auto">
                    <div className="h-7 bg-[#E0E0E0] rounded w-20"></div>
                  </div>

                  {/* Action Buttons Shimmer */}
                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
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
                    className="bg-white rounded-lg border-l-4 border-l-[#0A65CC] shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.01]"
                  >
                    <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                      {/* Company Avatar */}
                      <div className="flex-shrink-0">
                        <div className="w-[48px] h-[48px] rounded-full bg-[#E7F0FA] flex items-center justify-center">
                          <span className="text-[16px] font-semibold text-[#0A65CC]">
                            {getInitials(interview.role_title)}
                          </span>
                        </div>
                      </div>

                      {/* Company Info */}
                      <div className="flex-1 min-w-[200px] w-full sm:w-auto">
                        <h3 className="text-[16px] font-semibold text-[#18191C] mb-1">
                          {interview.role_title}
                        </h3>
                        <p className="text-[14px] text-[#474C54] mb-1.5">
                          Role Position
                        </p>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-[14px] h-[14px] text-[#767F8C] flex-shrink-0" />
                          <span className="text-[12px] text-[#767F8C] truncate">{interview.employer_email}</span>
                        </div>
                      </div>

                      {/* Date & Time */}
                      <div className="flex items-center gap-2 min-w-[140px] w-full sm:w-auto">
                        <Calendar className="w-[16px] h-[16px] text-[#767F8C] flex-shrink-0" />
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
                      <div className="min-w-[130px] w-full sm:w-auto">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#D6DDEB] rounded-md w-fit">
                          <Video className="w-[14px] h-[14px] text-[#0A65CC]" />
                          <span className="text-[13px] text-[#18191C]">
                            {interview.mode || 'Online'}
                          </span>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="min-w-[100px] w-full sm:w-auto">
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
                      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                        {interview.status === 'confirmed' ? (
                          <>
                            {interview.joining_link ? (
                              <button 
                                onClick={() => window.open(interview.joining_link, '_blank')}
                                className="px-4 py-2 bg-[#0BA02C] text-white text-[13px] font-medium rounded-md hover:bg-[#099125] transition whitespace-nowrap"
                              >
                                Join Meeting
                              </button>
                            ) : (
                              <span className="px-4 py-2 bg-[#F1F2F4] text-[#767F8C] text-[13px] font-medium rounded-md">
                                Link Pending
                              </span>
                            )}
                            <button className="p-2 hover:bg-[#F1F2F4] rounded-md transition">
                              <RefreshCw className="w-[18px] h-[18px] text-[#767F8C]" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button 
                              className="px-4 py-2 bg-[#0BA02C] text-white text-[13px] font-medium rounded-md hover:bg-[#099125] transition whitespace-nowrap"
                            >
                              Confirm Time
                            </button>
                            <button 
                              className="px-4 py-2 bg-white border border-[#D6DDEB] text-[#18191C] text-[13px] font-medium rounded-md hover:bg-[#F8F8F8] transition"
                            >
                              Decline
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-[#E4E5E7] p-8 sm:p-12 text-center">
                <div className="w-16 h-16 bg-[#F1F2F4] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-[#767F8C]" />
                </div>
                <h3 className="text-[18px] font-semibold text-[#18191C] mb-2">
                  No interviews found
                </h3>
                <p className="text-[14px] text-[#767F8C]">
                  {searchQuery ? 'Try adjusting your search' : `No ${activeTab} interviews`}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}