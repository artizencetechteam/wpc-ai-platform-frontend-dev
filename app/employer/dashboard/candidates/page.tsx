'use client';

import React, { useState, useEffect } from 'react';
import { Search, MapPin, Calendar, Briefcase, Eye, Clock, Loader2, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { get_offers, Offer } from '@/app/action/job_role.action';
import clientApi from '@/lib/axios';

export default function EmployerOffersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All Offers');
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawingId, setWithdrawingId] = useState<number | null>(null);

  // Fetch offers on mount
  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    setLoading(true);
    const response = await get_offers();
    
    if (response.success && response.data) {
      setOffers(response.data.data);
    } else {
      toast.error(response.message);
    }
    
    setLoading(false);
  };

  const getInitials = (offer: Offer) => {
    const name = offer.candidate_email;
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

  // Filter offers
  const filteredOffers = offers.filter(offer => {
    // Filter by status
    if (filterCategory === 'Pending' && offer.status !== 'pending') return false;
    if (filterCategory === 'Accepted' && offer.status !== 'accepted') return false;
    if (filterCategory === 'Rejected' && offer.status !== 'rejected') return false;

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesCandidate = offer.candidate_email.toLowerCase().includes(query);
      const matchesRole = offer.role_title.toLowerCase().includes(query);
      const matchesJobTitle = offer.job_title_name.toLowerCase().includes(query);

      if (!matchesCandidate && !matchesRole && !matchesJobTitle) {
        return false;
      }
    }

    return true;
  });

  // Withdraw offer functionality
  const handleWithdraw = async (id: number) => {
    setWithdrawingId(id);
    
    try {
      const res = await clientApi.patch(`api/employer/job/offer/${id}/`, {
        status: "reject"
      });
      
      if (res.status !== 200 && res.status !== 201 && res.status !== 204) {
        toast.error("Failed to withdraw offer");
      } else {
        toast.success("Offer withdrawn successfully");
        // Refresh the offers list
        fetchOffers();
      }
    } catch (error: any) {
      console.error("Withdraw error:", error);
      const errorMessage = error.response?.data?.message || error.response?.data?.detail || "Failed to withdraw offer";
      toast.error(errorMessage);
    } finally {
      setWithdrawingId(null);
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-[1400px] mx-auto">
        {/* Header Section */}
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
          <div className="flex-shrink-0">
            <h1 className="text-[24px] sm:text-[28px] font-semibold text-[#18191C] mb-1">
              Job Offers
            </h1>
            <p className="text-[14px] text-[#5E6670]">
              Manage offers sent to candidates
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:flex-1 sm:max-w-[600px]">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#9199A3]" />
              <input
                type="text"
                placeholder="Search offers..."
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
              <option value="All Offers">All Offers</option>
              <option value="Pending">Pending</option>
              <option value="Accepted">Accepted</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-lg border-t-[3px] shadow-sm animate-pulse relative"
                style={{
                  borderImage: 'linear-gradient(to right, #0A65CC, #E7F0FA) 1'
                }}
              >
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-[48px] h-[48px] rounded-full bg-[#E7F0FA]"></div>
                  </div>
                  <div className="flex-1 min-w-[200px] w-full">
                    <div className="h-4 bg-[#E0E0E0] rounded w-32 mb-2"></div>
                    <div className="h-3 bg-[#E0E0E0] rounded w-24 mb-2"></div>
                    <div className="flex flex-wrap gap-2 sm:gap-4 mt-2">
                      <div className="h-3 bg-[#E0E0E0] rounded w-20"></div>
                      <div className="h-3 bg-[#E0E0E0] rounded w-20"></div>
                      <div className="h-3 bg-[#E0E0E0] rounded w-16"></div>
                      <div className="h-3 bg-[#E0E0E0] rounded w-24"></div>
                    </div>
                  </div>
                  <div className="min-w-[120px] w-full sm:w-auto">
                    <div className="h-7 bg-[#E0E0E0] rounded w-28"></div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <div className="h-9 bg-[#E0E0E0] rounded w-28"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Offer Cards */}
        {!loading && (
          <>
            {filteredOffers.length > 0 ? (
              <div className="space-y-4">
                {filteredOffers.map((offer) => (
                  <div
                    key={offer.id}
                    className="bg-white rounded-lg border-t-[3px] rounded-sm shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.01] relative"
                    style={{
                      borderImage: 'linear-gradient(to right, #0A65CC, #E7F0FA) 1'
                    }}
                  >
                    {/* Status Badge - Top Right */}
                    <div className="absolute top-4 right-4 z-10">
                      {offer.status === 'pending' && (
                        <span className="inline-block px-3 py-1.5 bg-[#FFF4ED] text-[#FF6B00] text-[13px] font-medium rounded-md">
                          Pending
                        </span>
                      )}
                      {offer.status === 'accepted' && (
                        <span className="inline-block px-3 py-1.5 bg-[#E7F6EA] text-[#0BA02C] text-[13px] font-medium rounded-md">
                          Accepted
                        </span>
                      )}
                      {offer.status === 'rejected' && (
                        <span className="inline-block px-3 py-1.5 bg-[#FEE2E2] text-[#DC2626] text-[13px] font-medium rounded-md">
                          Rejected
                        </span>
                      )}
                      {offer.status === 'withdrawn' && (
                        <span className="inline-block px-3 py-1.5 bg-[#F3F4F6] text-[#6B7280] text-[13px] font-medium rounded-md">
                          Withdrawn
                        </span>
                      )}
                    </div>

                    <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 pr-4 sm:pr-32">
                      {/* Candidate Avatar */}
                      <div className="flex-shrink-0">
                        <div className="w-[48px] h-[48px] rounded-full bg-[#E7F0FA] flex items-center justify-center">
                          <User className="w-6 h-6 text-[#0A65CC]" />
                        </div>
                      </div>

                      {/* Offer Info */}
                      <div className="flex-1 min-w-[200px] w-full sm:w-auto">
                        <h3 className="text-[16px] font-semibold text-[#18191C] mb-1">
                          {offer.candidate_email}
                        </h3>
                        <p className="text-[14px] text-[#474C54] mb-2">
                          {offer.job_title_name}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[12px] text-[#767F8C]">
                          <div className="flex items-center gap-1">
                            <Briefcase className="w-[12px] h-[12px] flex-shrink-0" />
                            <span className="text-[#18191C] font-medium">{offer.role_title}</span>
                          </div>
                          {offer.company_name && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-[12px] h-[12px] flex-shrink-0" />
                              <span className="truncate">{offer.company_name}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Calendar className="w-[12px] h-[12px] flex-shrink-0" />
                            <span className="whitespace-nowrap">Start: {formatDate(offer.proposed_start_date)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-[12px] h-[12px] flex-shrink-0" />
                            <span className="whitespace-nowrap">Sent: {formatDate(offer.created_at)}</span>
                          </div>
                        </div>
                        {offer.additional_note && (
                          <div className="mt-2 text-[13px] text-[#5E6670] italic">
                            "{offer.additional_note}"
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                        <button
                          onClick={() => toast.info('Opening offer details...')}
                          className="px-4 py-2 bg-white border border-[#D6DDEB] text-[#18191C] text-[13px] font-medium rounded-md hover:bg-[#F8F8F8] transition flex items-center gap-1.5"
                        >
                          <Eye className="w-[14px] h-[14px]" />
                          View Details
                        </button>
                        {offer.status === 'pending' && (
                          <button
                            onClick={() => handleWithdraw(offer.id)}
                            disabled={withdrawingId === offer.id}
                            className="px-4 py-2 text-[#DC2626] text-[13px] font-medium hover:bg-[#FEE2E2] rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                          >
                            {withdrawingId === offer.id ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Withdrawing...
                              </>
                            ) : (
                              'Withdraw'
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className='w-full flex flex-col items-center justify-center gap-6 md:gap-8 mt-8'>
                <img 
                  src="/offers.png" 
                  alt="No offers found" 
                  className='w-full max-w-[350px] md:max-w-[600px] xl:max-w-[750px] h-auto object-contain' 
                />
                
                <div className="w-full max-w-[600px] md:max-w-[700px] px-4 flex flex-col items-center justify-center gap-3 md:gap-4">
                  <h2 className='text-[24px] md:text-[28px] xl:text-[30px] text-[#2F2F2F] font-semibold text-center'>
                    {searchQuery ? 'No offers match your search' : filterCategory !== 'All Offers' ? `No ${filterCategory.toLowerCase()} offers found` : 'No job offers sent yet'}
                  </h2>
                  <p className='text-[16px] md:text-[20px] xl:text-[22px] text-[#373737] text-center leading-relaxed'>
                    {searchQuery 
                      ? 'Try adjusting your search criteria to find offers.' 
                      : filterCategory !== 'All Offers' 
                        ? `You haven't sent any ${filterCategory.toLowerCase()} offers. Your sent offers will appear here.`
                        : 'Offers you send to candidates will appear here. Start by selecting qualified candidates and extending job offers.'}
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}