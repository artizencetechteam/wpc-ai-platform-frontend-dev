"use client";

import React, { useState, useEffect } from "react";
import { JobRoleType } from "../dashboard/post-role/page";
import ReactMarkdown from "react-markdown";
import { useRouter } from "next/navigation";

type FormType = {
  formData: JobRoleType;
  setFormData: (val: JobRoleType) => void;
  step: number;
  setStep: (val: number) => void;
};

const Form4 = ({ formData, setFormData, step, setStep }: FormType) => {
  const router = useRouter();
  const [jobOverview, setJobOverview] = useState(
    formData.job_description || ""
  );

  const [responsibilities, setResponsibilities] = useState<string[]>(
    formData.responsibilities || []
  );

  const [skills, setSkills] = useState<string[]>(
    formData.skills || []
  );

  const [showPreview, setShowPreview] = useState(true);
  const [showHelp, setShowHelp] = useState(false);

  /** keep formData in sync */
  useEffect(() => {
    setFormData({
      ...formData,
      job_description: jobOverview,
      responsibilities,
      skills,
    });
  }, [jobOverview, responsibilities, skills]);

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-[#111111] text-[18px] md:text-[20px] font-semibold">
          Describe The Job
        </h1>
      </div>

      <div className="flex flex-col gap-6">
        {/* Job Description Section with Markdown */}
        <div className="flex flex-col gap-2">
          <label className="text-[15px] md:text-[16px] font-medium text-[#111111]">
            Job description
          </label>
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            {/* Editor Toolbar - Disabled State */}
            <div className="bg-gray-50 border-b border-gray-300 px-3 py-2">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Formatting Buttons - Disabled */}
                <button
                  disabled
                  className="p-1.5 bg-gray-100 rounded opacity-50 cursor-not-allowed"
                  title="Bold (disabled)"
                  type="button"
                >
                  <span className="font-bold text-sm">B</span>
                </button>
                <button
                  disabled
                  className="p-1.5 bg-gray-100 rounded opacity-50 cursor-not-allowed"
                  title="Italic (disabled)"
                  type="button"
                >
                  <span className="italic text-sm">I</span>
                </button>
                <div className="w-px h-5 bg-gray-300 mx-1"></div>
                <button
                  disabled
                  className="p-1.5 bg-gray-100 rounded opacity-50 cursor-not-allowed"
                  title="Bullet List (disabled)"
                  type="button"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>
                <button
                  disabled
                  className="p-1.5 bg-gray-100 rounded opacity-50 cursor-not-allowed"
                  title="Numbered List (disabled)"
                  type="button"
                >
                  <span className="text-sm font-semibold">#</span>
                </button>
                <button
                  disabled
                  className="p-1.5 bg-gray-100 rounded opacity-50 cursor-not-allowed"
                  title="Heading (disabled)"
                  type="button"
                >
                  <span className="font-bold text-sm">H</span>
                </button>

                <div className="w-px h-5 bg-gray-300 mx-1"></div>

                {/* Edit/Preview Toggle Button */}
                {/* <button
                  onClick={() => setShowPreview(!showPreview)}
                  className={`px-3 py-1 text-xs rounded transition ${
                    showPreview
                      ? "bg-[#0852C9] text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                  type="button"
                >
                  {showPreview ? "Edit" : "Preview"}
                </button> */}

                {/* Help Button */}
                <button
                  onClick={() => setShowHelp(!showHelp)}
                  className="p-1.5 hover:bg-gray-200 rounded transition"
                  title="Formatting Help"
                  type="button"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </button>
              </div>

              {/* Help Panel */}
              {showHelp && (
                <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-600">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <strong>Headings:</strong> ## Heading
                    </div>
                    <div>
                      <strong>Bold:</strong> **text**
                    </div>
                    <div>
                      <strong>Italic:</strong> *text*
                    </div>
                    <div>
                      <strong>Bullet List:</strong> - item
                    </div>
                    <div>
                      <strong>Numbered List:</strong> 1. item
                    </div>
                    <div>
                      <strong>Link:</strong> [text](url)
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Content Area - Toggle between Preview and Edit (Read-only) */}
            {showPreview ? (
              <div className="p-4 min-h-[300px] max-h-[500px] overflow-y-auto bg-white">
                <ReactMarkdown
                  components={{
                    h1: ({ node, ...props }) => (
                      <h1
                        className="text-2xl font-bold mt-4 mb-2 text-gray-900"
                        {...props}
                      />
                    ),
                    h2: ({ node, ...props }) => (
                      <h2
                        className="text-xl font-bold mt-3 mb-2 text-gray-900"
                        {...props}
                      />
                    ),
                    h3: ({ node, ...props }) => (
                      <h3
                        className="text-lg font-semibold mt-2 mb-1 text-gray-900"
                        {...props}
                      />
                    ),
                    p: ({ node, ...props }) => (
                      <p
                        className="text-sm text-gray-700 leading-relaxed mb-3"
                        {...props}
                      />
                    ),
                    ul: ({ node, ...props }) => (
                      <ul
                        className="list-disc pl-5 space-y-1 mb-3"
                        {...props}
                      />
                    ),
                    ol: ({ node, ...props }) => (
                      <ol
                        className="list-decimal pl-5 space-y-1 mb-3"
                        {...props}
                      />
                    ),
                    li: ({ node, ...props }) => (
                      <li className="text-sm text-gray-700" {...props} />
                    ),
                    strong: ({ node, ...props }) => (
                      <strong
                        className="font-semibold text-gray-900"
                        {...props}
                      />
                    ),
                    em: ({ node, ...props }) => (
                      <em className="italic" {...props} />
                    ),
                  }}
                >
                  {formData.job_description || "*No content to preview*"}
                </ReactMarkdown>
              </div>
            ) : (
              <textarea
                id="markdown-editor"
                value={formData.job_description || ""}
                readOnly
                className="w-full min-h-[300px] max-h-[500px] p-4 text-sm text-gray-700 focus:outline-none resize-none font-mono overflow-y-auto bg-gray-50 cursor-not-allowed"
                placeholder="No job description available."
              />
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-gray-300 mt-8 pt-6 flex flex-col sm:flex-row justify-between gap-3 sm:gap-[15px]">
        <button
          onClick={() => router.push(`/employer/dashboard`)}
          className="px-4 sm:px-9 h-13 w-full sm:w-auto md:w-70 xl:w-90 rounded-[9px] border border-[#0852C9] text-[#0852C9] text-sm sm:text-base font-semibold hover:bg-blue-50 transition"
        >
          <span className="hidden sm:inline">Back to Dashboard</span>
          <span className="inline sm:hidden">← Back to Dashboard</span>
        </button>

        <button
          className="px-3 sm:px-4 py-2 h-13 text-xs sm:text-sm text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition flex items-center justify-center gap-1 sm:gap-2 w-full sm:w-auto"
          onClick={() => setStep(5)}
        >
          <svg
            className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          <span className="hidden sm:inline">Edit AI Draft</span>
          <span className="inline sm:hidden">Edit</span>
        </button>

        <div className="w-full sm:w-auto flex gap-2 sm:gap-3">
          {/* <button
            onClick={() => {
              setStep(step + 1)
            }}
            className="px-3 sm:px-6 h-13 text-blue-600 text-sm sm:text-base font-medium hover:text-blue-700 transition flex items-center justify-center gap-1 sm:gap-2 flex-1 sm:flex-initial"
          >
            <svg className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span className="hidden sm:inline">Preview</span>
            <span className="inline sm:hidden">View</span>
          </button> */}

          <button
            onClick={() => {
              setStep(step + 1)
            }}
            className="px-4 sm:px-9 h-13 flex-1 sm:w-auto md:w-70 xl:w-90 rounded-[9px] bg-[#0852C9] text-sm sm:text-[16px] text-[#FFFFFF] font-semibold hover:bg-[#0852C9]/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
           Preview and Publish
          </button>
        </div>
      </div>
    </div>
  );
};

export default Form4;