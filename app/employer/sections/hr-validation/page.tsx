'use client';

import { useState, useRef, useCallback, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import {
  listEmployeesAction,
  addEmployeeAction,
  createHRValidationRecordAction,
  listHRValidationRecordsAction,
  type Employee,
} from "@/app/employer/sections/action/action";
import HRValidationTabs from "../_components/HRValidationTabs";
import { getClientToken } from "../company/page";



type ManualForm = { name: string; nationality: string; startDate: string };
type RTWForm = {
  name: string;
  nationality: string;
  startDate: string;
  documentType: string;
  documentNumber: string;
  expiryDate: string;
  dob: string;
  file: File | null;
  fileUrl: string;
  fileKey: string; // ← ADDED: store short key for DB (max 50 chars safe)
};










const lbl: React.CSSProperties = {
  display: "block",
  fontSize: "13px",
  fontWeight: "500",
  color: "#374151",
  marginBottom: "6px",
};
const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "8px",
  border: "1.5px solid #D1D5DB",
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box",
  color: "#0F172A",
  backgroundColor: "white",
};
const cancelBtn: React.CSSProperties = {
  padding: "11px 20px",
  borderRadius: "8px",
  border: "1.5px solid #D1D5DB",
  backgroundColor: "white",
  fontSize: "14px",
  fontWeight: "500",
  cursor: "pointer",
  color: "#374151",
};
const primaryBtn: React.CSSProperties = {
  padding: "11px 20px",
  borderRadius: "8px",
  border: "none",
  backgroundColor: "#0852C9",
  color: "white",
  fontSize: "14px",
  fontWeight: "600",
  cursor: "pointer",
};



const UserAvatar = ({ size = 48, color = "#9CA3AF" }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <circle cx="24" cy="18" r="9" stroke={color} strokeWidth="2.5" fill="none" />
    <path d="M6 42c0-9.941 8.059-18 18-18s18 8.059 18 18" stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" />
  </svg>
);

const ClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginRight: "5px", flexShrink: 0 }}>
    <circle cx="7" cy="7" r="6" stroke="#9CA3AF" strokeWidth="1.4" />
    <path d="M7 4v3.2l2 1.3" stroke="#9CA3AF" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

const SpinnerIcon = ({ color = "#0852C9" }: { color?: string }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ animation: "spin 1s linear infinite" }}>
    <circle cx="10" cy="10" r="8" stroke="#CBD5E1" strokeWidth="2.5" />
    <path d="M10 2a8 8 0 018 8" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
  </svg>
);



// ← UPDATED: now returns both publicUrl and fileKey
async function uploadFileToR2(file: File): Promise<{ publicUrl: string; fileKey: string }> {
  const presignRes = await fetch("/api/upload-presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileName: file.name, fileType: file.type }),
  });

  if (!presignRes.ok) {
    const err = await presignRes.json().catch(() => ({}));
    throw new Error(err.error || "Presigned URL could not be generated");
  }

  const { presignedUrl, publicUrl, fileKey } = await presignRes.json();

  const uploadRes = await fetch(presignedUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });

  if (!uploadRes.ok) {
    throw new Error(`R2 upload failed (${uploadRes.status})`);
  }

  // If API doesn't return fileKey, extract last 2 path segments from publicUrl as fallback
  const key = fileKey ?? publicUrl.split("/").slice(-2).join("/");

  return { publicUrl, fileKey: key };
}



function RTWUploadArea({
  onFileChange,
}: {
  // ← UPDATED: callback now also receives fileKey
  onFileChange: (file: File | null, url?: string | null, key?: string | null) => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    async (f: File) => {
      const allowed = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];

      if (!allowed.includes(f.type)) {
        setErrorMsg("Only PDF, JPG or PNG supported.");
        setStatus("error");
        return;
      }

      if (f.size > 10 * 1024 * 1024) {
        setErrorMsg("File must be under 10MB.");
        setStatus("error");
        return;
      }

      setFile(f);
      setStatus("uploading");
      setErrorMsg("");

      try {
        // ← UPDATED: destructure both publicUrl and fileKey
        const { publicUrl, fileKey } = await uploadFileToR2(f);
        onFileChange(f, publicUrl, fileKey);
        setStatus("done");
      } catch (e: any) {
        setErrorMsg(e.message || "Upload failed.");
        setStatus("error");
        onFileChange(f, null, null);
      }
    },
    [onFileChange]
  );

  const removeFile = () => {
    setFile(null);
    setStatus("idle");
    setErrorMsg("");
    onFileChange(null, null, null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) processFile(dropped);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) processFile(selected);
  };

  return (
    <div>
      {!file ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          style={{
            border: `2px dashed ${dragOver ? "#0852C9" : "#CBD5E1"}`,
            borderRadius: "10px",
            padding: "32px 24px",
            textAlign: "center",
            cursor: "pointer",
            backgroundColor: dragOver ? "#EFF6FF" : "#F8FAFC",
            transition: "all 0.15s",
          }}
        >
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "10px" }}>
            <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
              <path d="M19 27V13M19 13l-7 7M19 13l7 7" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M7 29h24" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <p style={{ margin: 0, fontSize: "13.5px", fontWeight: "600", color: "#374151" }}>
            Drop file here or <span style={{ color: "#0852C9" }}>browse</span>
          </p>
          <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#94A3B8" }}>PDF, JPG or PNG · Max 10MB</p>
          <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: "none" }} onChange={handleInputChange} />
        </div>
      ) : (
        <div style={{ border: "1.5px solid #E2E8F0", borderRadius: "10px", padding: "14px 16px", backgroundColor: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect x="4" y="2" width="16" height="22" rx="2" fill="#EFF6FF" stroke="#0852C9" strokeWidth="1.5" />
              <path d="M4 8h16M8 13h8M8 17h5" stroke="#0852C9" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            <div>
              <p style={{ margin: 0, fontSize: "13px", fontWeight: "600", color: "#0F172A" }}>{file.name}</p>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748B" }}>
                {(file.size / 1024).toFixed(1)} KB ·{" "}
                {status === "uploading" && <span style={{ color: "#0852C9" }}>Uploading…</span>}
                {status === "done" && <span style={{ color: "#10B981" }}>✓ Uploaded</span>}
                {status === "error" && <span style={{ color: "#DC2626" }}>✗ {errorMsg}</span>}
              </p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {status === "uploading" && <SpinnerIcon />}
            {status === "done" && (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" fill="#10B981" />
                <path d="M5 8l2.5 2.5L11 5.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            <button onClick={removeFile} style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8", fontSize: "16px", lineHeight: 1 }}>✕</button>
          </div>
        </div>
      )}
    </div>
  );
}



export default function HRRecordsValidation() {
  return (
    <Suspense fallback={<div style={{ display: "flex", justifyContent: "center", padding: "100px" }}><SpinnerIcon /></div>}>
      <HRRecordsValidationImpl />
    </Suspense>
  );
}

function HRRecordsValidationImpl() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [hrRecordId, setHrRecordId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState<"choose" | "manual" | "rtw">("choose");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);

  const [manualForm, setManualForm] = useState<ManualForm>({ name: "", nationality: "British", startDate: "" });
  const [rtwForm, setRtwForm] = useState<RTWForm>({
    name: "", nationality: "", startDate: "",
    documentType: "", documentNumber: "", expiryDate: "", dob: "",
    file: null, fileUrl: "", fileKey: "", // ← ADDED fileKey
  });

  useEffect(() => { initHRRecord(); }, [searchParams]);

  async function initHRRecord() {
    setLoading(true);
    setApiError("");
    try {
      const token = getClientToken();

      // 1. Check for explicit recordId or action=new in URL
      const queryId = searchParams.get("recordId") || searchParams.get("id");
      const isNew = searchParams.get("action") === "new";

      const listRes = await listHRValidationRecordsAction(token);
      if (!listRes.success) {
        setApiError(listRes.message);
        setLoading(false);
        return;
      }

      const records = listRes.data ?? [];
      // Sort records by ID descending so data[0] is the NEWEST
      const sortedRecords = [...records].sort((a, b) => b.id - a.id);

      let recordId: number | null = null;

      if (isNew) {
        // Create brand new record
        let userId: number | null = null;
        try {
          const raw = document.cookie
            .split("; ")
            .find((r) => r.startsWith("user-info="))
            ?.split("=")
            .slice(1)
            .join("=");
          if (raw) {
            const parsed = JSON.parse(decodeURIComponent(raw));
            userId = parsed?.id ?? null;
          }
        } catch { /* ignore */ }

        if (!userId) {
          setApiError("User session invalid. Please login again.");
          setLoading(false);
          return;
        }

        const createRes = await createHRValidationRecordAction(userId, token);
        if (!createRes.success) {
          setApiError(createRes.message);
          setLoading(false);
          return;
        }
        recordId = createRes.data?.id ?? null;
      }
      else if (queryId) {
        // Use specific ID from URL
        recordId = Number(queryId);
      }
      else if (sortedRecords.length > 0) {
        // Fallback: Use newest existing record
        recordId = sortedRecords[0].id;
      }
      else {
        // No records exist and none requested: Create first one
        let userId: number | null = null;
        try {
          const raw = document.cookie
            .split("; ")
            .find((r) => r.startsWith("user-info="))
            ?.split("=")
            .slice(1)
            .join("=");
          if (raw) {
            const parsed = JSON.parse(decodeURIComponent(raw));
            userId = parsed?.id ?? null;
          }
        } catch { /* ignore */ }

        if (userId) {
          const createRes = await createHRValidationRecordAction(userId, token);
          if (createRes.success) recordId = createRes.data?.id ?? null;
        }
      }

      setHrRecordId(recordId);
      if (recordId !== null) {
        sessionStorage.setItem("current_hr_record_id", String(recordId));
        if (isNew) {
          router.replace(`/employer/sections/hr-validation?recordId=${recordId}`);
        }
        await loadEmployees(recordId, token);
      }
    } catch (e) {
      console.error("initHRRecord error:", e);
      setApiError("Unexpected error initialising HR record.");
    } finally {
      setLoading(false);
    }
  }

  async function loadEmployees(recordId: number, token?: string) {
    const t = token || getClientToken();
    const res = await listEmployeesAction(recordId, t);
    if (res.success && res.data) {
      setEmployees(res.data);
    } else {
      setApiError(res.message);
    }
  }

  const stats = {
    total: employees.length,
    migrant: employees.filter((e) =>
      !["british", "irish", "british/irish"].includes(e.nationality?.toLowerCase() ?? "")
    ).length,
    british_irish: employees.filter((e) =>
      ["british", "irish", "british/irish"].includes(e.nationality?.toLowerCase() ?? "")
    ).length,
  };

  const handleManualAdd = async () => {
    if (!manualForm.name.trim() || !manualForm.startDate || hrRecordId === null) return;
    setSubmitting(true);
    setSubmitError("");
    const res = await addEmployeeAction(
      {
        employee_full_name: manualForm.name,
        employment_start_date: manualForm.startDate,
        nationality: manualForm.nationality,
        HRValidationRecord_id: hrRecordId,
      },
      getClientToken()
    );
    if (res.success) {
      setShowModal(false);
      await loadEmployees(hrRecordId);
    } else {
      setSubmitError(res.message);
    }
    setSubmitting(false);
  };

  const handleRtwAdd = async () => {
    if (!rtwForm.name.trim() || !rtwForm.startDate || hrRecordId === null) return;
    setSubmitting(true);
    setSubmitError("");
    const res = await addEmployeeAction(
      {
        employee_full_name: rtwForm.name,
        employment_start_date: rtwForm.startDate,
        nationality: rtwForm.nationality || "Migrant",
        HRValidationRecord_id: hrRecordId,

        rtw_document_url: rtwForm.fileKey || undefined,
      },
      getClientToken()
    );
    if (res.success) {
      setShowModal(false);
      await loadEmployees(hrRecordId);
    } else {
      setSubmitError(res.message);
    }
    setSubmitting(false);
  };

  const openModal = (step: "choose" | "manual" | "rtw" = "choose") => {
    setModalStep(step);
    setSubmitError("");
    setManualForm({ name: "", nationality: "British", startDate: "" });
    setRtwForm({
      name: "", nationality: "", startDate: "",
      documentType: "", documentNumber: "", expiryDate: "", dob: "",
      file: null, fileUrl: "", fileKey: "", // ← ADDED fileKey reset
    });
    setShowModal(true);
  };

  const markStaffComplete = () => {
    try {
      const p = JSON.parse(sessionStorage.getItem("hr_progress") || "{}");
      sessionStorage.setItem("hr_progress", JSON.stringify({ ...p, staff: true }));
    } catch {}
  };

  const staffComplete = employees.length > 0;



  const manualFormValid = manualForm.name.trim() && manualForm.startDate;
  // ← UPDATED: rtwFormValid now checks fileKey instead of fileUrl for DB safety
  const rtwFormValid = rtwForm.name.trim() && rtwForm.startDate && rtwForm.file && rtwForm.fileKey;

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", backgroundColor: "#F1F5F9", minHeight: "100vh" }}>
      <HRValidationTabs 
        currentTabId="staff" 
        hrRecordId={hrRecordId} 
        staffComplete={staffComplete}
      />

      <div style={{ maxWidth: "860px", margin: "30px auto", padding: "0 24px" }}>

        {apiError && (
          <div style={{ marginBottom: "16px", padding: "12px 16px", backgroundColor: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ margin: 0, fontSize: "13px", color: "#DC2626" }}>⚠ {apiError}</p>
            <button onClick={() => initHRRecord()} style={{ background: "none", border: "1px solid #FECACA", borderRadius: "6px", padding: "4px 10px", fontSize: "12px", color: "#DC2626", cursor: "pointer" }}>Retry</button>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "22px", fontWeight: "700", color: "#0F172A" }}>Staff List</h2>
            <p style={{ margin: "5px 0 0", fontSize: "13px", color: "#64748B" }}>
              Add all employees before proceeding to validation workflows
            </p>
          </div>
          <button
            onClick={() => openModal("choose")}
            disabled={hrRecordId === null || loading}
            style={{ display: "flex", alignItems: "center", gap: "7px", backgroundColor: hrRecordId !== null && !loading ? "#0852C9" : "#93ABDE", color: "white", border: "none", borderRadius: "8px", padding: "10px 20px", fontSize: "14px", fontWeight: "600", cursor: hrRecordId !== null && !loading ? "pointer" : "not-allowed", flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="white" strokeWidth="2" strokeLinecap="round" /></svg>
            Add Employee
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "14px", marginBottom: "18px" }}>
          {[
            { label: "Total Employees", value: stats.total },
            { label: "Migrant Workers", value: stats.migrant },
            { label: "British / Irish", value: stats.british_irish },
          ].map((s) => (
            <div key={s.label} style={{ backgroundColor: "white", borderRadius: "10px", padding: "22px 26px", border: "1px solid #E2E8F0" }}>
              <div style={{ fontSize: "32px", fontWeight: "700", color: "#0F172A", marginBottom: "4px" }}>
                {loading ? <SpinnerIcon color="#CBD5E1" /> : s.value}
              </div>
              <div style={{ fontSize: "13px", color: "#64748B" }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ backgroundColor: "white", borderRadius: "10px", border: "1px solid #E2E8F0", overflow: "hidden" }}>
          <div style={{ padding: "22px 24px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0, fontSize: "15.5px", fontWeight: "600", color: "#0F172A" }}>Employee Records</h3>
            {!loading && employees.length > 0 && (
              <button onClick={() => hrRecordId && loadEmployees(hrRecordId)}
                style={{ background: "none", border: "1px solid #E2E8F0", borderRadius: "6px", padding: "4px 10px", fontSize: "12px", color: "#64748B", cursor: "pointer" }}>
                ↻ Refresh
              </button>
            )}
          </div>

          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "48px" }}><SpinnerIcon /></div>
          ) : employees.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 24px 60px", gap: "8px" }}>
              <UserAvatar size={52} color="#94A3B8" />
              <p style={{ margin: "6px 0 2px", fontSize: "15px", fontWeight: "600", color: "#334155" }}>No employees added yet</p>
              <p style={{ margin: 0, fontSize: "13px", color: "#64748B" }}>Click "Add Employee" to start building your staff list</p>
              <button onClick={() => openModal("choose")} style={{ display: "flex", alignItems: "center", gap: "7px", marginTop: "10px", backgroundColor: "white", color: "#334155", border: "1.5px solid #CBD5E1", borderRadius: "8px", padding: "9px 18px", fontSize: "13.5px", fontWeight: "500", cursor: "pointer" }}>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1v11M1 6.5h11" stroke="#334155" strokeWidth="1.8" strokeLinecap="round" /></svg>
                Add First Employee
              </button>
            </div>
          ) : (
            <div style={{ padding: "0 16px 16px" }}>
              {employees.map((emp, i) => (
                <div key={emp.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", backgroundColor: "#F8FAFC", borderRadius: "8px", marginBottom: "8px", border: "1px solid #E2E8F0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "38px", height: "38px", borderRadius: "50%", backgroundColor: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <UserAvatar size={24} color="#0852C9" />
                    </div>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: "600", color: "#0F172A" }}>{emp.employee_full_name}</div>
                      <div style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>
                        #{i + 1} · {emp.nationality} · {emp.employment_start_date}
                        {emp.rtw_document_url ? " · RTW uploaded" : ""}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", color: "#64748B", fontSize: "13px" }}>
                    <ClockIcon />{emp.status ?? "Pending"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {employees.length > 0 && (
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px" }}>
            <button onClick={() => { markStaffComplete(); router.push(`/employer/sections/rtw-compliance?recordId=${hrRecordId}`); }}
              style={{ backgroundColor: "#0852C9", color: "white", border: "none", borderRadius: "8px", padding: "12px 26px", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}>
              Proceed to Validation Workflows →
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15,23,42,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300 }} onClick={() => setShowModal(false)}>
          <div style={{ backgroundColor: "white", borderRadius: "14px", padding: "26px 28px 24px", width: "520px", maxWidth: "95vw", boxShadow: "0 25px 60px rgba(0,0,0,0.22)", position: "relative", maxHeight: "90vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>

            <h3 style={{ margin: "0 32px 4px 0", fontSize: "18px", fontWeight: "700", color: "#0F172A" }}>Add New Employee</h3>
            <p style={{ margin: "0 0 20px", fontSize: "13px", color: "#64748B" }}>Choose how you want to add the employee record</p>
            <button onClick={() => setShowModal(false)} style={{ position: "absolute", top: "16px", right: "16px", background: "none", border: "1.5px solid #CBD5E1", borderRadius: "50%", width: "28px", height: "28px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748B", fontSize: "13px" }}>✕</button>

            {submitError && (
              <div style={{ marginBottom: "14px", padding: "10px 12px", backgroundColor: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "8px" }}>
                <p style={{ margin: 0, fontSize: "12.5px", color: "#DC2626" }}>⚠ {submitError}</p>
              </div>
            )}

            {modalStep === "choose" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                {[
                  {
                    step: "rtw" as const,
                    title: "RTW-Led Entry",
                    desc: "For Migrant Workers – Upload RTW document for AI extraction",
                    icon: (
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <rect x="3" y="2" width="14" height="16" rx="2" stroke="#0852C9" strokeWidth="1.5" />
                        <path d="M6 7h8M6 10h8M6 13h5" stroke="#0852C9" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    ),
                  },
                  {
                    step: "manual" as const,
                    title: "Manual Entry",
                    desc: "Enter employee details manually",
                    icon: (
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <circle cx="10" cy="7" r="3.5" stroke="#0852C9" strokeWidth="1.5" />
                        <path d="M3 17c0-3.866 3.134-7 7-7s7 3.134 7 7" stroke="#0852C9" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    ),
                  },
                ].map((opt) => (
                  <button key={opt.step} onClick={() => setModalStep(opt.step)}
                    style={{ border: "1.5px solid #E2E8F0", borderRadius: "10px", padding: "20px 16px", backgroundColor: "white", cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}
                    onMouseOver={(e) => { e.currentTarget.style.borderColor = "#0852C9"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(8,82,201,0.08)"; }}
                    onMouseOut={(e) => { e.currentTarget.style.borderColor = "#E2E8F0"; e.currentTarget.style.boxShadow = "none"; }}>
                    <div style={{ width: "38px", height: "38px", borderRadius: "8px", backgroundColor: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>{opt.icon}</div>
                    <div style={{ fontSize: "14px", fontWeight: "600", color: "#0F172A", marginBottom: "5px" }}>{opt.title}</div>
                    <div style={{ fontSize: "12px", color: "#64748B", lineHeight: "1.5" }}>{opt.desc}</div>
                  </button>
                ))}
              </div>
            )}

            {modalStep === "rtw" && (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <span style={{ fontSize: "14.5px", fontWeight: "600", color: "#0F172A" }}>RTW-Led Entry</span>
                  <button onClick={() => setModalStep("choose")} style={{ background: "none", border: "none", cursor: "pointer", color: "#475569", fontSize: "13px", fontWeight: "500" }}>Change</button>
                </div>
                <div style={{ marginBottom: "14px" }}>
                  <label style={lbl}>Upload RTW Document *</label>
                  <RTWUploadArea
                    onFileChange={async (f, url, key) => {
                      setRtwForm((prev) => ({ ...prev, file: f, fileUrl: url || "", fileKey: key || "" }));
                      if (f && url) {
                        setIsExtracting(true);
                        const loadingToast = toast.loading("AI is extracting details...");
                        try {
                          const formData = new FormData();
                          formData.append("file", f);
                          const res = await axios.post("/api/extract-rtw", formData);
                          if (res.data.success) {
                            const { employee_name, nationality, visa_expiry_date, reference_number } = res.data.extracted;
                            setRtwForm(prev => ({
                              ...prev,
                              name: employee_name || prev.name,
                              nationality: nationality || prev.nationality,
                              expiryDate: visa_expiry_date || prev.expiryDate,
                              documentNumber: reference_number || prev.documentNumber,
                            }));
                            if (res.data.extracted.name_extraction_failed) {
                              toast.error("Name could not be extracted automatically. Please enter manually.");
                            } else {
                              toast.success("Details extracted successfully!");
                            }
                          }
                        } catch (err) {
                          console.error("Extraction error in modal:", err);
                        } finally {
                          setIsExtracting(false);
                          toast.dismiss(loadingToast);
                        }
                      }
                    }}
                  />
                  {isExtracting && (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px", fontSize: "12px", color: "#0852C9" }}>
                      <SpinnerIcon /> Analyzing document...
                    </div>
                  )}
                </div>
                <div style={{ marginBottom: "14px" }}>
                  <label style={lbl}>Employee Full Name *</label>
                  <input type="text" value={rtwForm.name} onChange={(e) => setRtwForm({ ...rtwForm, name: e.target.value })} placeholder="Enter full name" style={inputStyle} />
                </div>
                <div style={{ marginBottom: "14px" }}>
                  <label style={lbl}>Immigration Status</label>
                  <input type="text" value={rtwForm.nationality} onChange={(e) => setRtwForm({ ...rtwForm, nationality: e.target.value })} placeholder="e.g. Migrant, British" style={inputStyle} />
                </div>
                <div style={{ marginBottom: "22px" }}>
                  <label style={lbl}>Employment Start Date *</label>
                  <input type="date" value={rtwForm.startDate} onChange={(e) => setRtwForm({ ...rtwForm, startDate: e.target.value })} style={inputStyle} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <button onClick={() => setShowModal(false)} style={cancelBtn} disabled={submitting}>Cancel</button>
                  <button onClick={handleRtwAdd} disabled={!rtwFormValid || submitting}
                    style={{ ...primaryBtn, opacity: rtwFormValid && !submitting ? 1 : 0.5, cursor: rtwFormValid && !submitting ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                    {submitting ? <><SpinnerIcon color="#fff" /> Adding…</> : "Add Employee"}
                  </button>
                </div>
              </>
            )}

            {modalStep === "manual" && (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                  <span style={{ fontSize: "14.5px", fontWeight: "600", color: "#0F172A" }}>Manual Entry</span>
                  <button onClick={() => setModalStep("choose")} style={{ background: "none", border: "none", cursor: "pointer", color: "#475569", fontSize: "13px", fontWeight: "500" }}>Change</button>
                </div>
                <div style={{ marginBottom: "14px" }}>
                  <label style={lbl}>Employee Full Name *</label>
                  <input type="text" value={manualForm.name} onChange={(e) => setManualForm({ ...manualForm, name: e.target.value })} placeholder="Enter full name" style={inputStyle} />
                </div>
                <div style={{ marginBottom: "14px" }}>
                  <label style={lbl}>Immigration Status</label>
                  <div style={{ position: "relative" }}>
                    <select value={manualForm.nationality} onChange={(e) => setManualForm({ ...manualForm, nationality: e.target.value })}
                      style={{ ...inputStyle, appearance: "none", paddingRight: "36px" }}>
                      <option value="British">British</option>
                      <option value="Irish">Irish</option>
                      <option value="British/Irish">British / Irish</option>
                      <option value="Migrant">Migrant</option>
                      <option value="Other">Other</option>
                    </select>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                      <path d="M3 5l4 4 4-4" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>
                <div style={{ marginBottom: "22px" }}>
                  <label style={lbl}>Employment Start Date *</label>
                  <input type="date" value={manualForm.startDate} onChange={(e) => setManualForm({ ...manualForm, startDate: e.target.value })} style={inputStyle} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <button onClick={() => setShowModal(false)} style={cancelBtn} disabled={submitting}>Cancel</button>
                  <button onClick={handleManualAdd} disabled={!manualFormValid || submitting}
                    style={{ ...primaryBtn, opacity: manualFormValid && !submitting ? 1 : 0.5, cursor: manualFormValid && !submitting ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                    {submitting ? <><SpinnerIcon color="#fff" /> Adding…</> : "Add Employee"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}