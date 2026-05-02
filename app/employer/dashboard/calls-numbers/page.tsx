"use client";

import React, { useState } from 'react';
import { Phone, Plus, PhoneCall, Clock } from 'lucide-react';

type TabKey = 'inbound' | 'logs';

type InboundNumber = {
  number: string;
  status: 'Active' | 'Available';
  assignedTo: string;
  callsToday: number;
};

type CallLog = {
  number: string;
  agent: string;
  duration: string;
  outcome: 'Completed' | 'Missed' | 'Voicemail';
  time: string;
};

const inboundNumbers: InboundNumber[] = [
  {
    number: '+44 20 7123 4567',
    status: 'Active',
    assignedTo: 'Compliance Checker',
    callsToday: 23,
  },
  {
    number: '+44 20 7123 4568',
    status: 'Active',
    assignedTo: 'Document Reminder',
    callsToday: 15,
  },
  {
    number: '+44 20 7123 4569',
    status: 'Available',
    assignedTo: 'Unassigned',
    callsToday: 0,
  },
];

const callLogs: CallLog[] = [
  {
    number: '+44 20 7123 4567',
    agent: 'Compliance Checker',
    duration: '03:22',
    outcome: 'Completed',
    time: 'Today, 09:20 AM',
  },
  {
    number: '+44 20 7123 4568',
    agent: 'Document Reminder',
    duration: '00:48',
    outcome: 'Voicemail',
    time: 'Today, 08:10 AM',
  },
  {
    number: '+44 20 7123 4567',
    agent: 'Compliance Checker',
    duration: '01:12',
    outcome: 'Missed',
    time: 'Yesterday, 05:42 PM',
  },
];

const statusStyles: Record<InboundNumber['status'], string> = {
  Active: 'bg-emerald-100 text-emerald-700',
  Available: 'bg-gray-100 text-gray-600',
};

const outcomeStyles: Record<CallLog['outcome'], string> = {
  Completed: 'bg-emerald-100 text-emerald-700',
  Missed: 'bg-amber-100 text-amber-700',
  Voicemail: 'bg-blue-100 text-blue-700',
};

export default function CallsNumbersPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('inbound');

  return (
    <div className="min-h-screen bg-[#FDFEFF] p-6 lg:p-10 font-inter">
      <div className="max-w-[1400px] mx-auto flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-1">
            <h1 className="text-[24px] md:text-[26px] font-black text-[#111827] tracking-tight">
              Phone Numbers
            </h1>
            <p className="text-[13px] text-gray-500 font-medium">
              Manage your inbound phone numbers and call logs.
            </p>
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('inbound')}
                className={`px-4 py-2 rounded-lg text-[13px] font-semibold border transition ${
                  activeTab === 'inbound'
                    ? 'bg-white border-gray-200 text-[#111827] shadow-sm'
                    : 'bg-transparent border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  <Phone size={14} />
                  Inbound Numbers
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('logs')}
                className={`px-4 py-2 rounded-lg text-[13px] font-semibold border transition ${
                  activeTab === 'logs'
                    ? 'bg-white border-gray-200 text-[#111827] shadow-sm'
                    : 'bg-transparent border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  <PhoneCall size={14} />
                  Call Logs
                </span>
              </button>
            </div>

            <button className="flex items-center gap-2 px-4 py-2.5 bg-[#0852C9] text-white text-[13px] font-semibold rounded-lg hover:bg-blue-700 transition">
              <Plus size={16} />
              Add Number
            </button>
          </div>
        </div>

        {activeTab === 'inbound' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {inboundNumbers.map((item) => (
              <div
                key={item.number}
                className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md transition"
              >
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0852C9] flex items-center justify-center">
                    <PhoneCall size={18} />
                  </div>
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${statusStyles[item.status]}`}>
                    {item.status}
                  </span>
                </div>
                <div className="mt-4 flex flex-col gap-2">
                  <p className="text-[15px] font-bold text-[#111827]">{item.number}</p>
                  <p className="text-[12px] text-gray-500">
                    Assigned to: <span className="font-semibold text-gray-700">{item.assignedTo}</span>
                  </p>
                  <div className="flex items-center gap-2 text-[12px] text-gray-500">
                    <Clock size={14} />
                    <span>{item.callsToday} calls today</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
            <div className="grid grid-cols-5 gap-4 px-5 py-3 bg-gray-50 text-[12px] font-semibold text-gray-500">
              <span>Number</span>
              <span>Agent</span>
              <span>Duration</span>
              <span>Outcome</span>
              <span>Time</span>
            </div>
            {callLogs.map((log) => (
              <div key={`${log.number}-${log.time}`} className="grid grid-cols-5 gap-4 px-5 py-4 border-t border-gray-100 text-[13px] text-gray-600">
                <span className="font-semibold text-[#111827]">{log.number}</span>
                <span>{log.agent}</span>
                <span>{log.duration}</span>
                <span className={`w-fit px-2 py-0.5 rounded-full text-[11px] font-semibold ${outcomeStyles[log.outcome]}`}>
                  {log.outcome}
                </span>
                <span>{log.time}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
