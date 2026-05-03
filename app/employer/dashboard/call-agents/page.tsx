"use client";
import React, { useState } from 'react';
import { Search, Sparkles, PhoneCall, MoreHorizontal } from 'lucide-react';
import Link from 'next/link';

type AgentStatus = 'Active' | 'Paused';

type Agent = {
  name: string;
  category: 'Compliance' | 'HR';
  status: AgentStatus;
  callsCompleted: number;
  successRate: number;
};

const agents: Agent[] = [
  {
    name: 'Compliance Checker',
    category: 'Compliance',
    status: 'Active',
    callsCompleted: 156,
    successRate: 92,
  },
  {
    name: 'Document Reminder',
    category: 'HR',
    status: 'Active',
    callsCompleted: 89,
    successRate: 88,
  },
  {
    name: 'Deadline Follow-up',
    category: 'Compliance',
    status: 'Paused',
    callsCompleted: 234,
    successRate: 95,
  },
  {
    name: 'Right to Work Verifier',
    category: 'HR',
    status: 'Active',
    callsCompleted: 67,
    successRate: 91,
  },
  {
    name: 'Sponsor Check-in',
    category: 'Compliance',
    status: 'Paused',
    callsCompleted: 45,
    successRate: 85,
  },
  {
    name: 'Onboarding Assistant',
    category: 'HR',
    status: 'Active',
    callsCompleted: 112,
    successRate: 94,
  },
];

const statusStyles: Record<AgentStatus, string> = {
  Active: 'bg-emerald-100 text-emerald-700',
  Paused: 'bg-amber-100 text-amber-700',
};

const categoryStyles: Record<Agent['category'], string> = {
  Compliance: 'bg-blue-50 text-[#0852C9] border border-blue-100',
  HR: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
};

export default function CallAgentsPage() {
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const toggleMenu = (agentName: string) => {
    setOpenMenu((current) => (current === agentName ? null : agentName));
  };

  return (
    <div className="min-h-screen bg-[#FDFEFF] p-6 lg:p-10 font-inter">
      <div className="max-w-[1400px] mx-auto flex flex-col gap-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col">
            <h1 className="text-[24px] md:text-[26px] font-black text-[#111827] tracking-tight">
              AI Telephone Agents
            </h1>
            <p className="text-[13px] text-gray-500 font-medium">
              Manage all created AI agents and track call performance.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search agents"
                className="w-full md:w-[260px] bg-white border border-gray-200 rounded-lg pl-9 pr-3 py-2.5 text-[13px] text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <Link
              href="/employer/dashboard/call-agents/create"
              className="flex items-center gap-2 px-4 py-2.5 bg-[#0852C9] text-white text-[13px] font-semibold rounded-lg hover:bg-blue-700 transition"
            >
              <Sparkles size={16} />
              Create New Agent
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-[14px] font-semibold text-gray-700">All AI Agents</p>
          <span className="text-[12px] text-gray-500">{agents.length} agents configured</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {agents.map((agent) => (
            <div
              key={agent.name}
              className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0852C9] flex items-center justify-center">
                    <PhoneCall size={18} />
                  </div>
                  <div>
                    <p className="text-[15px] font-bold text-[#111827]">{agent.name}</p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold mt-1 ${categoryStyles[agent.category]}`}>
                      {agent.category}
                    </span>
                  </div>
                </div>
                <div className="relative">
                  <button
                    type="button"
                    aria-label={`Open menu for ${agent.name}`}
                    className="text-gray-400 hover:text-gray-600"
                    onClick={() => toggleMenu(agent.name)}
                  >
                    <MoreHorizontal size={18} />
                  </button>

                  {openMenu === agent.name && (
                    <div className="absolute right-0 mt-2 w-40 rounded-lg border border-gray-100 bg-white shadow-lg z-10">
                      <button className="w-full text-left px-3 py-2 text-[12px] text-gray-700 hover:bg-gray-50">
                        View details
                      </button>
                      <button className="w-full text-left px-3 py-2 text-[12px] text-gray-700 hover:bg-gray-50">
                        Edit agent
                      </button>
                      <button className="w-full text-left px-3 py-2 text-[12px] text-gray-700 hover:bg-gray-50">
                        {agent.status === 'Active' ? 'Pause agent' : 'Activate agent'}
                      </button>
                      <button className="w-full text-left px-3 py-2 text-[12px] text-red-600 hover:bg-red-50">
                        Delete agent
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-4 text-[12px] text-gray-500">
                <div>
                  <p className="text-[11px] uppercase tracking-wide">Status</p>
                  <span className={`mt-1 inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${statusStyles[agent.status]}`}>
                    {agent.status}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-[11px] uppercase tracking-wide">Calls Completed</p>
                  <p className="text-[15px] font-bold text-[#111827]">{agent.callsCompleted}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide">Success Rate</p>
                  <p className="text-[15px] font-bold text-emerald-600">{agent.successRate}%</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] uppercase tracking-wide">Last Update</p>
                  <p className="text-[12px] font-semibold text-gray-600">Today</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}