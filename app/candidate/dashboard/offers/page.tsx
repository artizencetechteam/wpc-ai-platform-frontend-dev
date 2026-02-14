'use client';

import React, { useState, useEffect } from 'react';
import { Search, MapPin, Calendar, Briefcase, Eye, Clock, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { candidate_offers, JobOffer } from '@/app/action/candidate.action';

export default function JobOffersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All Offers');
  const [offers, setOffers] = useState<JobOffer[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch offers on mount
  useEffect(() => {
    const fetchOffers = async () => {
      setLoading(true);
      const response = await candidate_offers();
      
      if (response.success && response.data) {
        setOffers(response.data);
      } else {
        toast.error(response.message);
      }
      
      setLoading(false);
    };

    fetchOffers();
  }, []);

  const getInitials = (offer: JobOffer) => {
    const name = offer.company_name || offer.employer_email;
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
      const matchesCompany = offer.company_name?.toLowerCase().includes(query);
      const matchesRole = offer.role_title.toLowerCase().includes(query);
      const matchesJobTitle = offer.job_title_name.toLowerCase().includes(query);
      const matchesEmployer = offer.employer_email.toLowerCase().includes(query);

      if (!matchesCompany && !matchesRole && !matchesJobTitle && !matchesEmployer) {
        return false;
      }
    }

    return true;
  });

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
              Review and respond to your job offers
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:flex-1 sm:max-w-[600px]">
            <div className="flex-1 relative">
              {/* <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#9199A3]" />
              <input
                type="text"
                placeholder="Search offers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-full pl-10 pr-4 py-2.5 text-[14px] text-[#18191C] placeholder:text-[#9199A3] border border-[#D6DDEB] focus:outline-none focus:border-[#0A65CC] bg-white"
              /> */}
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
                className="bg-white rounded-lg border-t-[3px]  shadow-sm animate-pulse relative"
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
                    <div className="h-9 bg-[#E0E0E0] rounded w-24"></div>
                    <div className="h-9 bg-[#E0E0E0] rounded w-16"></div>
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
                    </div>

                    <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 pr-4 sm:pr-32">
                      {/* Company Avatar */}
                      <div className="flex-shrink-0">
                        <div className="w-[48px] h-[48px] rounded-full bg-[#E7F0FA] flex items-center justify-center">
                          <span className="text-[16px] font-semibold text-[#0A65CC]">
                            {getInitials(offer)}
                          </span>
                        </div>
                      </div>

                      {/* Offer Info */}
                      <div className="flex-1 min-w-[200px] w-full sm:w-auto">
                        <h3 className="text-[16px] font-semibold text-[#18191C] mb-1">
                          {offer.company_name || offer.employer_email}
                        </h3>
                        <p className="text-[14px] text-[#474C54] mb-2">
                          {offer.job_title_name}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[12px] text-[#767F8C]">
                          <div className="flex items-center gap-1">
                            <span className="text-[#18191C] font-medium">{offer.role_title}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-[12px] h-[12px] flex-shrink-0" />
                            <span className="truncate">{offer.employer_email}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-[12px] h-[12px] flex-shrink-0" />
                            <span className="whitespace-nowrap">Join: {formatDate(offer.proposed_start_date)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                        {offer.status === 'pending' ? (
                          <>
                            <button
                              onClick={() => toast.success('Offer accepted!')}
                              className="px-4 py-2 bg-[#0BA02C] text-white text-[13px] font-medium rounded-md hover:bg-[#099125] transition whitespace-nowrap flex items-center gap-1.5"
                            >
                              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Accept Offer
                            </button>
                            <button
                              onClick={() => toast.info('Opening offer details...')}
                              className="px-4 py-2 bg-white border border-[#D6DDEB] text-[#18191C] text-[13px] font-medium rounded-md hover:bg-[#F8F8F8] transition flex items-center gap-1.5"
                            >
                              <Eye className="w-[14px] h-[14px]" />
                              View Offer
                            </button>
                            <button
                              onClick={() => toast.error('Offer rejected')}
                              className="px-3 py-2 text-[#DC2626] text-[13px] font-medium hover:bg-[#FEE2E2] rounded-md transition"
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => toast.info('Opening details...')}
                            className="px-4 py-2 bg-white border border-[#D6DDEB] text-[#18191C] text-[13px] font-medium rounded-md hover:bg-[#F8F8F8] transition flex items-center gap-1.5"
                          >
                            <Eye className="w-[14px] h-[14px]" />
                            View Details
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-[#E4E5E7] p-8 sm:p-12 text-center">
                <div className="w-16 h-16 bg-[#F1F2F4] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="w-8 h-8 text-[#767F8C]" />
                </div>
                <h3 className="text-[18px] font-semibold text-[#18191C] mb-2">
                  No job offers found
                </h3>
                <p className="text-[14px] text-[#767F8C]">
                  {searchQuery ? 'Try adjusting your search' : filterCategory !== 'All Offers' ? `No ${filterCategory.toLowerCase()} offers` : 'Your job offers will appear here'}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}