"use client";

import React, { useEffect, useState } from "react";
import { JobRoleType } from "../dashboard/post-role/page";
import clientApi from "@/lib/axios";
import toast from "react-hot-toast";
import ReactMarkDown from "react-markdown";

type FormType = {
  formData: JobRoleType;
  setFormData: (val: JobRoleType) => void;
  step: number;
  setStep: (val: number) => void;
};

const ReviewPage = ({ formData, setFormData, step, setStep }: FormType) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [localFormData, setLocalFormData] = useState<JobRoleType>(formData);

  // Markdown editor states
  const [editedDescription, setEditedDescription] = useState("");
  const [showPreview, setShowPreview] = useState(true);
  const [showHelp, setShowHelp] = useState(false);

  // Predefined job titles
  const [jobTitles, setJobTitles] = useState<Array<{ id: number; name: string }>>([
    { id: 1, name: "Chef" },
    { id: 2, name: "Chef de Partie" },
    { id: 3, name: "Head Chef" },
    { id: 4, name: "Chief executive officer" },
    { id: 5, name: "Driver" }
  ]);
  const [isCreatingTitle, setIsCreatingTitle] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const [jobTypes, setJobTypes] = useState<Array<{ id: number; name: string }>>([]);
  const [isCreatingType, setIsCreatingType] = useState(false);
  const [customType, setCustomType] = useState("");


  useEffect(() => {
    loadJobTitles();
    loadJobTypes();
    setEditedDescription(formData.job_description || "");
    console.log(formData);
  }, []);

  const loadJobTypes = async () => {
    try {
      const res = await clientApi.get("api/employer/job/types/");
      if (res.status === 200 || res.status === 201) {
        setJobTypes(res.data);
      } else {
        toast.error("Failed to load job types");
      }
    } catch (error) {
      console.error("Failed to fetch job types:", error);
      toast.error("Failed to load job types");
    }
  };
  
  const loadJobTitles = async () => {
    try {
      const res = await clientApi.get(`api/employer/job/titles/`);
      if (res.status === 200 || res.status === 201) {
        setJobTitles(res.data);
      } else {
        toast.error("Failed to load titles");
      }
    } catch (error) {
      toast.error("Failed to load titles");
    }
  };

  const createCustomTitle = async (titleName: string) => {
    try {
      setIsCreatingTitle(true);
      const res = await clientApi.post(`api/employer/job/titles/`, {
        name: titleName,
      });
      if (res.status === 200 || res.status === 201) {
        const newTitle = res.data;
        setJobTitles([...jobTitles, newTitle]);
        setLocalFormData({ ...localFormData, job_title: newTitle });
        setCustomTitle("");
        toast.success("Title created successfully");
      } else {
        toast.error("Failed to create title");
      }
    } catch (error) {
      toast.error("Failed to create title");
    } finally {
      setIsCreatingTitle(false);
    }
  };

  const handleEdit = (field: string) => {
    setEditingField(field);
    if (field === 'job_description') {
      setEditedDescription(localFormData.job_description || "");
      setShowPreview(true);
    }
  };

  const handleCancel = () => {
    // Reset to original formData
    setLocalFormData(formData);
    setEditingField(null);
    if (editingField === 'job_description') {
      setEditedDescription(formData.job_description || "");
      setShowPreview(true);
      setShowHelp(false);
    }
  };

  const handleSaveField = (field: string) => {
    if (field === "responsibilities") {
      const list = (localFormData.responsibilities || [])
        .map(r => r.trim());

      if (list.length === 0) {
        toast.error("At least one responsibility is required");
        return;
      }

      if (list.some(r => r === "")) {
        toast.error("Responsibilities cannot be empty");
        return;
      }

      setLocalFormData(prev => ({
        ...prev,
        responsibilities: list,
      }));
    }

    if (field === "skills") {
      const list = (localFormData.skills || [])
        .map(s => s.trim());

      if (list.length === 0) {
        toast.error("At least one skill is required");
        return;
      }

      if (list.some(s => s === "")) {
        toast.error("Skills cannot be empty");
        return;
      }

      setLocalFormData(prev => ({
        ...prev,
        skills: list,
      }));
    }

    if (field === "job_description") {
      setLocalFormData(prev => ({
        ...prev,
        job_description: editedDescription,
      }));
      setShowPreview(true);
      setShowHelp(false);
    }

    setEditingField(null);
  };

  const insertMarkdown = (syntax: string) => {
    const textarea = document.getElementById(
      "markdown-editor"
    ) as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = editedDescription.substring(start, end);

    let newText = "";
    const beforeText = editedDescription.substring(0, start);
    const afterText = editedDescription.substring(end);

    switch (syntax) {
      case "bold":
        newText = `${beforeText}**${selectedText || "bold text"}**${afterText}`;
        break;
      case "italic":
        newText = `${beforeText}*${selectedText || "italic text"}*${afterText}`;
        break;
      case "bullet":
        newText = `${beforeText}\n- ${selectedText || "list item"}${afterText}`;
        break;
      case "number":
        newText = `${beforeText}\n1. ${
          selectedText || "numbered item"
        }${afterText}`;
        break;
      case "heading":
        newText = `${beforeText}\n## ${selectedText || "Heading"}${afterText}`;
        break;
      default:
        return;
    }

    setEditedDescription(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd =
        start + newText.length - afterText.length;
    }, 0);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Prepare update data with all changes
      const updateData: any = {
        job_title: localFormData.job_title,
        job_type: localFormData.job_type,
        company: localFormData.company,
        country: localFormData.country,
        language: localFormData.language,
        min_salary: localFormData.min_salary || localFormData.minimum,
        max_salary: localFormData.max_salary || localFormData.maximum,
        rate: "annual",
        job_description: localFormData.job_description,
        job_location: localFormData.job_location,
        responsibilities: localFormData.responsibilities,
        skills: localFormData.skills,
      };

      const response = await clientApi.patch(
        `api/employer/role/${formData.id}/`,
        updateData
      );

      if (response.status !== 200 && response.status !== 201) {
        throw new Error('Failed to update job posting');
      }

      setFormData(localFormData);
      setStep(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error updating job posting:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-[#111111] text-[20px] font-semibold">Review</h1>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="flex flex-col gap-6">
        {/* Job details */}
        <div className="flex flex-col pb-4">
          <h3 className="text-sm font-semibold text-[#111] mb-3">
            Job details
          </h3>

          {/* Job title */}
          <div className="flex justify-between items-start py-2">
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#111] mb-1">Job title</p>
              {editingField === 'job_title' ? (
                <div className="flex flex-col gap-3">
                  <select
                    value={localFormData.job_title?.id || ''}
                    onChange={(e) => {
                      const selectedJob = jobTitles.find(job => job.id === parseInt(e.target.value));
                      setLocalFormData({
                        ...localFormData,
                        job_title: selectedJob || localFormData.job_title
                      });
                    }}
                    className="text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0852C9]"
                  >
                    <option value="">Select a job title</option>
                    {jobTitles.map((job) => (
                      <option key={job.id} value={job.id}>
                        {job.name}
                      </option>
                    ))}
                  </select>

                  {/* OR divider */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 border-t border-gray-300"></div>
                    <span className="text-xs text-gray-500 font-medium">OR</span>
                    <div className="flex-1 border-t border-gray-300"></div>
                  </div>

                  {/* Custom title section */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700">
                      Create a custom job title
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customTitle}
                        onChange={(e) => setCustomTitle(e.target.value)}
                        placeholder="e.g., Senior Sous Chef"
                        className="flex-1 text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0852C9]"
                        disabled={isCreatingTitle}
                      />
                      <button
                        onClick={() => {
                          if (customTitle.trim()) {
                            createCustomTitle(customTitle.trim());
                          } else {
                            toast.error("Please enter a job title");
                          }
                        }}
                        disabled={isCreatingTitle || !customTitle.trim()}
                        className="px-4 py-2 bg-[#0852C9] text-white text-sm rounded hover:bg-[#0852C9]/90 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                      >
                        {isCreatingTitle ? 'Creating...' : 'Create'}
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleSaveField('job_title')}
                      disabled={!localFormData.job_title?.id}
                      className="px-4 py-1 bg-[#0852C9] text-white text-sm rounded hover:bg-[#0852C9]/90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Save and Publish
                    </button>
                    <button
                      onClick={handleCancel}
                      className="px-4 py-1 border border-gray-300 text-sm rounded hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-700">
                  {localFormData.job_title?.name || "Not specified"}
                </p>
              )}
            </div>
            {editingField !== 'job_title' && (
              <button
                onClick={() => handleEdit('job_title')}
                className="text-[#0852C9] hover:text-[#0852C9]/90"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            )}
          </div>

          {/* Job Type - ONLY SELECT, NO CUSTOM CREATION */}
          <div className="flex justify-between items-start py-2">
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#111] mb-1">Job type</p>
              {editingField === 'job_type' ? (
                <div className="flex flex-col gap-2">
                  <select
                    value={localFormData.job_type?.id || ''}
                    onChange={(e) => {
                      const selectedType = jobTypes.find(type => type.id === parseInt(e.target.value));
                      setLocalFormData({
                        ...localFormData,
                        job_type: selectedType || localFormData.job_type
                      });
                    }}
                    className="text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0852C9]"
                  >
                    <option value="">Select a job type</option>
                    {jobTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveField('job_type')}
                      disabled={!localFormData.job_type?.id}
                      className="px-4 py-1 bg-[#0852C9] text-white text-sm rounded hover:bg-[#0852C9]/90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancel}
                      className="px-4 py-1 border border-gray-300 text-sm rounded hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-700">
                  {localFormData.job_type_details?.name || "Not specified"}
                </p>
              )}
            </div>
            {editingField !== 'job_type' && (
              <button
                onClick={() => handleEdit('job_type')}
                className="text-[#0852C9] hover:text-[#0852C9]/90"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            )}
          </div>

          {/* Job Location */}
          {(localFormData) && (
            <div className="flex justify-between items-start py-2">
              <div className="flex-1">
                <p className="text-sm font-semibold text-[#111] mb-1">Job Location</p>
                {editingField === 'job_location' ? (
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      value={localFormData.job_location || ''}
                      onChange={(e) => setLocalFormData({ ...localFormData, job_location: e.target.value })}
                      className="text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0852C9]"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveField('job_location')}
                        className="px-4 py-1 bg-[#0852C9] text-white text-sm rounded hover:bg-[#0852C9]/90"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancel}
                        className="px-4 py-1 border border-gray-300 text-sm rounded hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-700">{localFormData.job_location}</p>
                )}
              </div>
              {editingField !== 'job_location' && (
                <button
                  onClick={() => handleEdit('job_location')}
                  className="text-[#0852C9] hover:text-[#0852C9]/90"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              )}
            </div>
          )}

          {/* Company */}
          {(localFormData.company || editingField === 'company') && (
            <div className="flex justify-between items-start py-2">
              <div className="flex-1">
                <p className="text-sm font-semibold text-[#111] mb-1">Company for this job</p>
                {editingField === 'company' ? (
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      value={localFormData.company || ''}
                      onChange={(e) => setLocalFormData({ ...localFormData, company: e.target.value })}
                      className="text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0852C9]"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveField('company')}
                        className="px-4 py-1 bg-[#0852C9] text-white text-sm rounded hover:bg-[#0852C9]/90"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancel}
                        className="px-4 py-1 border border-gray-300 text-sm rounded hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-700">{localFormData.company}</p>
                )}
              </div>
              {editingField !== 'company' && (
                <button
                  onClick={() => handleEdit('company')}
                  className="text-[#0852C9] hover:text-[#0852C9]/90"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            )}
          </div>
        )}

          <div className="flex justify-between items-start py-2">
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#111] mb-1">Country and language</p>
              {editingField === 'country_language' ? (
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    placeholder="Country"
                    value={localFormData.country || ''}
                    onChange={(e) => setLocalFormData({ ...localFormData, country: e.target.value })}
                    className="text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0852C9]"
                  />
                  <input
                    type="text"
                    placeholder="Language"
                    value={localFormData.language || ''}
                    onChange={(e) => setLocalFormData({ ...localFormData, language: e.target.value })}
                    className="text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0852C9]"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveField('country_language')}
                      className="px-4 py-1 bg-[#0852C9] text-white text-sm rounded hover:bg-[#0852C9]/90"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancel}
                      className="px-4 py-1 border border-gray-300 text-sm rounded hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-700">{localFormData.country || "United Kingdom"}</p>
                  <p className="text-sm text-gray-700">{localFormData.language || "English"}</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Pay */}
        <div className="flex flex-col gap-2 pb-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-[#111] mb-1">Pay</h3>
              {editingField === 'pay' ? (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-700">Minimum Salary (£)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">£</span>
                      <input
                        type="number"
                        placeholder="e.g., 25000"
                        value={localFormData.min_salary || localFormData.minimum || ''}
                        onChange={(e) => setLocalFormData({ ...localFormData, min_salary: e.target.value })}
                        className="w-full text-sm border border-gray-300 rounded pl-7 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0852C9]"
                      />
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-700">Maximum Salary (£)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">£</span>
                      <input
                        type="number"
                        placeholder="e.g., 35000"
                        value={localFormData.max_salary || localFormData.maximum || ''}
                        onChange={(e) => setLocalFormData({ ...localFormData, max_salary: e.target.value })}
                        className="w-full text-sm border border-gray-300 rounded pl-7 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0852C9]"
                      />
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-700">Rate</label>
                    <input
                      type="text"
                      value="Annual"
                      readOnly
                      className="text-sm border border-gray-300 rounded px-3 py-2 bg-gray-50 text-gray-600 cursor-not-allowed"
                    />
                  </div>
                  
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={() => handleSaveField('pay')}
                      className="px-4 py-1 bg-[#0852C9] text-white text-sm rounded hover:bg-[#0852C9]/90"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancel}
                      className="px-4 py-1 border border-gray-300 text-sm rounded hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-700">
                  {(localFormData.min_salary || localFormData.minimum) && (localFormData.max_salary || localFormData.maximum)
                    ? `£${localFormData.min_salary || localFormData.minimum} – £${localFormData.max_salary || localFormData.maximum} per ${localFormData.rate || localFormData.job_rate || "year"}`
                    : "Not specified"}
                </p>
              )}
            </div>
            {editingField !== 'pay' && (
              <button
                onClick={() => handleEdit('pay')}
                className="text-[#0852C9] hover:text-[#0852C9]/90"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Job description with Markdown Editor */}
        <div className="flex flex-col gap-2 pb-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-[#111] mb-1">Job description</h3>

             <div className="border border-gray-300 rounded-lg overflow-hidden">
                  {/* Editor Toolbar */}
                  <div className="bg-gray-50 border-b border-gray-300 px-3 py-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Formatting Buttons */}
                      <button
                        onClick={() => insertMarkdown("bold")}
                        className="p-1.5 hover:bg-gray-200 rounded transition"
                        title="Bold"
                        type="button"
                      >
                        <span className="font-bold text-sm">B</span>
                      </button>
                      <button
                        onClick={() => insertMarkdown("italic")}
                        className="p-1.5 hover:bg-gray-200 rounded transition"
                        title="Italic"
                        type="button"
                      >
                        <span className="italic text-sm">I</span>
                      </button>
                      <div className="w-px h-5 bg-gray-300 mx-1"></div>
                      <button
                        onClick={() => insertMarkdown("bullet")}
                        className="p-1.5 hover:bg-gray-200 rounded transition"
                        title="Bullet List"
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
                        onClick={() => insertMarkdown("number")}
                        className="p-1.5 hover:bg-gray-200 rounded transition"
                        title="Numbered List"
                        type="button"
                      >
                        <span className="text-sm font-semibold">#</span>
                      </button>
                      <button
                        onClick={() => insertMarkdown("heading")}
                        className="p-1.5 hover:bg-gray-200 rounded transition"
                        title="Heading"
                        type="button"
                      >
                        <span className="font-bold text-sm">H</span>
                      </button>

                      <div className="w-px h-5 bg-gray-300 mx-1"></div>

                      {/* Edit/Preview Toggle Button */}
                      <button
                        onClick={() => setShowPreview(!showPreview)}
                        className={`px-3 py-1 text-xs rounded transition ${
                          showPreview
                            ? "bg-[#0852C9] text-white"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                        type="button"
                      >
                        {showPreview ? "Edit" : "Preview"}
                      </button>

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

                      <div className="ml-auto flex items-center gap-2">
                        <button
                          onClick={handleCancel}
                          className="text-sm text-gray-600 hover:text-gray-800 px-3 py-1 rounded border border-gray-300 hover:bg-gray-50"
                          type="button"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveField('job_description')}
                          className="text-sm bg-[#0852C9] text-white px-3 py-1 rounded hover:bg-[#0852C9]/90"
                          type="button"
                        >
                          Save
                        </button>
                      </div>
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

                  {/* Content Area - Toggle between Preview and Edit */}
                  {showPreview ? (
                    <div className="p-4 min-h-[300px] max-h-[500px] overflow-y-auto bg-white">
                      <ReactMarkDown
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
                        {editedDescription || "*No content to preview*"}
                      </ReactMarkDown>
                    </div>
                  ) : (
                    <textarea
                      id="markdown-editor"
                      value={editedDescription}
                      onChange={(e) => setEditedDescription(e.target.value)}
                      className="w-full min-h-[300px] max-h-[500px] p-4 text-sm text-gray-700 focus:outline-none resize-none font-mono overflow-y-auto"
                      placeholder="Enter job description in markdown format...

Example:
## Job Overview
We are seeking an experienced professional...

**Key Responsibilities**
- Responsibility 1
- Responsibility 2

**Qualifications**
- Qualification 1
- Qualification 2"
                    />
                  )}
                </div>
            </div>
            {editingField !== 'job_description' && (
              <button
                onClick={() => handleEdit('job_description')}
                className="text-[#0852C9] hover:text-[#0852C9]/90"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            )}
          </div>
        </div>

        <div className="text-center pt-4">
          <p className="text-[15px] text-[#000000]">
            Have feedback?{" "}
            <span className="hover:text-[#0852C9] font-semibold cursor-pointer">
              Tell us more.
            </span>
          </p>
        </div>

        <div className="p-2">
          <p className="text-[15px] text-gray-700 leading-relaxed font-medium">
            By selecting Confirm, you agree that this job post reflects your
            requirements, and agree it will be posted and applications will be
            processed following Indeed's{" "}
            <a href="#" className="font-semibold text-[#0852C9] hover:underline">
              Terms
            </a>
            ,{" "}
            <a href="#" className="font-semibold text-[#0852C9] hover:underline">
              Cookie
            </a>{" "}
            and{" "}
            <a href="#" className="font-semibold text-[#0852C9] hover:underline">
              Privacy
            </a>{" "}
            Policies.
          </p>
        </div>
      </div>

      <div className="border-t border-gray-300 mt-8 pt-6 flex justify-between gap-5">
        <button
          onClick={() => setStep(step - 1)}
          disabled={isLoading}
          className="px-9 h-13 w-1/2 md:w-70 xl:w-90 rounded-[9px] border border-[#0852C9] text-[#0852C9] font-semibold hover:bg-blue-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="px-9 h-13 w-1/2 md:w-70 xl:w-90 rounded-[9px] bg-[#0852C9] text-[16px] text-[#FFFFFF] font-semibold hover:bg-[#0852C9]/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
};

export default ReviewPage;