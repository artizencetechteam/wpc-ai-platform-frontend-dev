"use client";

import React, { useState } from 'react';
import { Sparkles, PhoneCall, Plus, Save, FileText } from 'lucide-react';

const suggestedItems = [
  'Add a verification question',
  'Include callback option',
  'Set voicemail message',
];

export default function CreateCallAgentPage() {
  const [questions, setQuestions] = useState<string[]>([
    'Can you confirm your current employment status?',
    'Do you have all required documentation ready?',
  ]);
  const [newQuestion, setNewQuestion] = useState('');

  const addQuestion = () => {
    const value = newQuestion.trim();
    if (!value) return;
    setQuestions((prev) => [...prev, value]);
    setNewQuestion('');
  };

  const removeQuestion = (index: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-[#FDFEFF] p-6 lg:p-10 font-inter">
      <div className="max-w-[1400px] mx-auto flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-[24px] md:text-[26px] font-black text-[#111827] tracking-tight">
            Create Agent
          </h1>
          <p className="text-[13px] text-gray-500 font-medium">
            Design and deploy AI telephone agents.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_0.8fr] gap-6">
          <div className="flex flex-col gap-6">
            <section className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0852C9] flex items-center justify-center">
                  <PhoneCall size={16} />
                </div>
                <h2 className="text-[16px] font-bold text-[#111827]">Agent Identity</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-gray-600">Agent Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Compliance Checker"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-[13px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-gray-600">Agent Type</label>
                  <select className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-[13px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200">
                    <option value="">Select type</option>
                    <option value="compliance">Compliance</option>
                    <option value="hr">HR</option>
                  </select>
                </div>
              </div>
            </section>

            <section className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
              <h2 className="text-[16px] font-bold text-[#111827] mb-3">Call Purpose</h2>
              <label className="text-[12px] font-semibold text-gray-600">What is this agent calling for?</label>
              <textarea
                rows={4}
                placeholder="e.g. This agent will call sponsors to verify compliance status and collect missing documentation."
                className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-[13px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </section>

            <section className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0852C9] flex items-center justify-center">
                  <FileText size={16} />
                </div>
                <h2 className="text-[16px] font-bold text-[#111827]">System Prompt</h2>
              </div>
              <label className="text-[12px] font-semibold text-gray-600">
                Provide the system-level instructions for the agent.
              </label>
              <textarea
                rows={5}
                placeholder="Define the agent tone, constraints, and compliance rules."
                className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-[13px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              <div className="mt-4">
                <label className="text-[12px] font-semibold text-gray-600">
                  Reference document (PDF)
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-[13px] text-gray-600 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-[12px] file:font-semibold file:text-[#0852C9] hover:file:bg-blue-100"
                />
                <p className="mt-1 text-[11px] text-gray-400">Upload a PDF to guide agent knowledge.</p>
              </div>
            </section>

            <section className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
              <h2 className="text-[16px] font-bold text-[#111827] mb-4">Questions to Ask</h2>
              <div className="flex flex-col gap-3">
                {questions.map((question, index) => (
                  <div key={`${question}-${index}`} className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5 text-[13px] text-gray-700">
                    <span>{question}</span>
                    <button
                      type="button"
                      className="text-gray-400 hover:text-red-500"
                      onClick={() => removeQuestion(index)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newQuestion}
                    onChange={(event) => setNewQuestion(event.target.value)}
                    placeholder="Add a question"
                    className="flex-1 rounded-lg border border-gray-200 px-3 py-2.5 text-[13px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                  <button
                    type="button"
                    onClick={addQuestion}
                    className="px-3 py-2.5 rounded-lg bg-[#0852C9] text-white text-[13px] font-semibold hover:bg-blue-700"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </section>
          </div>

          <div className="flex flex-col gap-6">
            <section className="bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white text-[#0852C9] flex items-center justify-center">
                  <Sparkles size={16} />
                </div>
                <h3 className="text-[15px] font-bold text-[#111827]">AI Assist</h3>
              </div>
              <p className="text-[12px] text-gray-500 mt-2">AI suggestions based on your configuration:</p>
              <div className="flex flex-col gap-2 mt-3">
                {suggestedItems.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-[12px] font-semibold text-[#0852C9] bg-white border border-blue-100"
                  >
                    {item}
                  </span>
                ))}
              </div>
              <button className="mt-4 w-full rounded-lg bg-[#0852C9] text-white text-[13px] font-semibold py-2.5 hover:bg-blue-700 transition">
                Generate Script
              </button>
            </section>

            <section className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0852C9] flex items-center justify-center">
                  <PhoneCall size={16} />
                </div>
                <h3 className="text-[15px] font-bold text-[#111827]">Test Call</h3>
              </div>
              <p className="text-[12px] text-gray-500 mt-2">Test your agent before activating.</p>
              <input
                type="tel"
                placeholder="+44 7700 000000"
                className="mt-3 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-[13px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              <button className="mt-3 w-full rounded-lg border border-gray-200 text-[13px] font-semibold text-gray-600 py-2.5 hover:bg-gray-50 transition">
                Make Test Call
              </button>
            </section>

            <div className="flex flex-col gap-3">
              <button className="w-full rounded-lg border border-gray-200 bg-white text-[13px] font-semibold text-gray-600 py-2.5 hover:bg-gray-50 transition flex items-center justify-center gap-2">
                <Save size={16} />
                Save Draft
              </button>
              <button className="w-full rounded-lg bg-emerald-600 text-white text-[13px] font-semibold py-2.5 hover:bg-emerald-700 transition">
                Activate Agent
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
