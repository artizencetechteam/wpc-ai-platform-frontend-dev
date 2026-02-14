'use client';

import React, { useState } from 'react';
import { X, Clock, Calendar as CalendarIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { rescheduleInterview } from '@/app/action/job_role.action';

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  interview: {
    id: number;
    role_title: string;
    candidate_email: string;
    time_slot_1: string;
    time_slot_2: string;
    time_slot_3: string;
  };
  onRescheduleSuccess: () => void;
}

export default function RescheduleModal({ 
  isOpen, 
  onClose, 
  interview,
  onRescheduleSuccess 
}: RescheduleModalProps) {
  const [selectedMonth, setSelectedMonth] = useState('February');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([]);
  const [currentTime, setCurrentTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = ['2025', '2026', '2027', '2028'];

  // Generate calendar days
  const generateCalendarDays = () => {
    const monthIndex = months.indexOf(selectedMonth);
    const year = parseInt(selectedYear);
    const firstDay = new Date(year, monthIndex, 1).getDay();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    
    // Add actual days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    return days;
  };

  const handleDateClick = (day: number) => {
    if (!currentTime) {
      toast.error('Please select a time first');
      return;
    }

    if (selectedTimeSlots.length >= 3) {
      toast.error('You can only select up to 3 time slots');
      return;
    }

    const monthIndex = months.indexOf(selectedMonth);
    const dateTime = new Date(
      parseInt(selectedYear),
      monthIndex,
      day,
      parseInt(currentTime.split(':')[0]),
      parseInt(currentTime.split(':')[1])
    );

    const isoString = dateTime.toISOString();
    
    if (selectedTimeSlots.includes(isoString)) {
      toast.error('This time slot is already selected');
      return;
    }

    setSelectedTimeSlots([...selectedTimeSlots, isoString]);
    setCurrentTime('');
  };

  const handleRemoveTimeSlot = (index: number) => {
    setSelectedTimeSlots(selectedTimeSlots.filter((_, i) => i !== index));
  };

  const formatDisplayDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }) + ' at ' + date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const handleReschedule = async () => {
    if (selectedTimeSlots.length === 0) {
      toast.error('Please select at least one time slot');
      return;
    }

    setIsSubmitting(true);

    try {
      const rescheduleData: any = {};
      
      // Add selected time slots to the request
      if (selectedTimeSlots[0]) rescheduleData.time_slot_1 = selectedTimeSlots[0];
      if (selectedTimeSlots[1]) rescheduleData.time_slot_2 = selectedTimeSlots[1];
      if (selectedTimeSlots[2]) rescheduleData.time_slot_3 = selectedTimeSlots[2];

      console.log('Rescheduling interview:', interview.id, rescheduleData);

      // Call the action with interview ID and time slots
      const response = await rescheduleInterview(interview.id, rescheduleData);

      if (response.success) {
        toast.success(response.message);
        onRescheduleSuccess();
        onClose();
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      console.error('Reschedule error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-[650px] w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0A65CC] to-[#0952b8] p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-[26px] font-bold text-white mb-2">
                Reschedule Interview
              </h2>
              <div className="flex flex-col gap-1">
                <p className="text-[15px] text-white/90 font-medium">
                  {interview.role_title}
                </p>
                <p className="text-[13px] text-white/75">
                  {interview.candidate_email}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="p-2 hover:bg-white/20 rounded-lg transition disabled:opacity-50 ml-4"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Instructions */}
          <div className="mb-6 bg-blue-50 border border-blue-100 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <CalendarIcon className="w-5 h-5 text-[#0A65CC] mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-[16px] font-semibold text-[#18191C] mb-1">
                  Select Available Times
                </h3>
                <p className="text-[14px] text-[#5E6670]">
                  Choose up to 3 time slots. The candidate will confirm their preferred time.
                </p>
              </div>
            </div>
          </div>

          {/* Calendar */}
          <div className="border-2 border-[#E7F0FA] rounded-xl p-5 mb-6 bg-gradient-to-br from-white to-blue-50/30">
            {/* Month & Year Selectors */}
            <div className="flex items-center gap-3 mb-5">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 border-2 border-[#D6DDEB] rounded-lg text-[14px] text-[#18191C] font-medium bg-white focus:outline-none focus:border-[#0A65CC] cursor-pointer disabled:opacity-50 transition"
              >
                {months.map(month => (
                  <option key={month} value={month}>{month}</option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                disabled={isSubmitting}
                className="px-4 py-2.5 border-2 border-[#D6DDEB] rounded-lg text-[14px] text-[#18191C] font-medium bg-white focus:outline-none focus:border-[#0A65CC] cursor-pointer disabled:opacity-50 transition"
              >
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Day Headers */}
              {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                <div key={day} className="text-center text-[11px] font-bold text-[#767F8C] py-2">
                  {day}
                </div>
              ))}

              {/* Calendar Days */}
              {generateCalendarDays().map((day, index) => (
                <div key={index} className="aspect-square">
                  {day ? (
                    <button
                      onClick={() => handleDateClick(day)}
                      disabled={!currentTime || isSubmitting}
                      className={`w-full h-full flex items-center justify-center text-[14px] font-medium rounded-lg transition-all ${
                        currentTime && !isSubmitting
                          ? 'hover:bg-[#0A65CC] hover:text-white hover:scale-105 text-[#18191C] cursor-pointer shadow-sm hover:shadow-md'
                          : 'text-[#9199A3] cursor-not-allowed opacity-50'
                      }`}
                    >
                      {day}
                    </button>
                  ) : (
                    <div></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Time Picker */}
          <div className="mb-6">
            <h4 className="text-[16px] font-semibold text-[#18191C] mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#0A65CC]" />
              Select Time
            </h4>
            <div className="relative">
              <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#0A65CC]" />
              <input
                type="time"
                value={currentTime}
                onChange={(e) => setCurrentTime(e.target.value)}
                disabled={isSubmitting}
                className="w-full pl-12 pr-4 py-3.5 border-2 border-[#D6DDEB] rounded-lg text-[15px] text-[#18191C] font-medium focus:outline-none focus:border-[#0A65CC] focus:ring-4 focus:ring-[#0A65CC]/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              />
            </div>
          </div>

          {/* Selected Time Slots */}
          <div className="mb-6">
            <h4 className="text-[16px] font-semibold text-[#18191C] mb-3">
              Selected Time Slots 
              <span className="ml-2 inline-flex items-center justify-center w-6 h-6 text-[12px] font-bold text-white bg-[#0A65CC] rounded-full">
                {selectedTimeSlots.length}
              </span>
              <span className="text-[14px] font-normal text-[#767F8C]">/3</span>
            </h4>
            <div className="space-y-2">
              {selectedTimeSlots.length === 0 ? (
                <div className="text-center py-8 px-4 border-2 border-dashed border-[#D6DDEB] rounded-lg bg-gray-50/50">
                  <CalendarIcon className="w-8 h-8 text-[#9199A3] mx-auto mb-2" />
                  <p className="text-[14px] text-[#767F8C]">
                    No time slots selected yet
                  </p>
                  <p className="text-[12px] text-[#9199A3] mt-1">
                    Select a time and click on a date to add
                  </p>
                </div>
              ) : (
                selectedTimeSlots.map((slot, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-[#E7F0FA] to-[#E7F0FA]/50 rounded-lg border border-[#0A65CC]/20 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 flex items-center justify-center bg-[#0A65CC] text-white font-bold text-[12px] rounded-full">
                        {index + 1}
                      </div>
                      <span className="text-[14px] font-medium text-[#18191C]">
                        {formatDisplayDateTime(slot)}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveTimeSlot(index)}
                      disabled={isSubmitting}
                      className="p-2 hover:bg-red-100 hover:text-red-600 rounded-lg transition disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4 border-t border-[#D6DDEB]">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3.5 border-2 border-[#D6DDEB] text-[#18191C] rounded-lg text-[15px] font-semibold hover:bg-[#F1F2F4] hover:border-[#9199A3] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleReschedule}
              disabled={isSubmitting || selectedTimeSlots.length === 0}
              className="flex-1 px-6 py-3.5 bg-gradient-to-r from-[#0A65CC] to-[#0952b8] text-white rounded-lg text-[15px] font-semibold hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Rescheduling...
                </>
              ) : (
                <>
                  <CalendarIcon className="w-4 h-4" />
                  Send Request
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}