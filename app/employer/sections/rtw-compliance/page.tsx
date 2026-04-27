'use client';

import { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import HRValidationTabs from "../_components/HRValidationTabs";
import { listHRValidationRecordsAction, listEmployeesAction, updateHRValidationRecordAction, updateEmployeeAction } from "@/app/employer/sections/action/action";
import { getClientToken } from "@/app/employer/sections/company/page";


// --- Types ---
type TabId = "company" | "staff" | "rtw" | "pension" | "auth" | "contracts" | "financial" | "summary";

type Employee = {
  id: string;
  employee_full_name: string;
  nationality: string;
  documentType?: string;
  documentNumber?: string;
  startDate?: string;
  passportNumber?: string;
  check_date?: string | null;
  company_name?: string | null;
};

// --- Icons ---
const GreenCheckCircle = () => (
  <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
    <circle cx="28" cy="28" r="27" stroke="#10B981" strokeWidth="2" fill="none" />
    <path d="M18 28l8 8 12-14" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const AlertTriangleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: "2px" }}>
    <path d="M8 2L1 14h14L8 2z" fill="none" stroke="#DC2626" strokeWidth="1.4" strokeLinejoin="round" />
    <path d="M8 7v3M8 12v.5" stroke="#DC2626" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

const SpinnerIcon = ({ color = "#0852C9" }: { color?: string }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ animation: "spin 1s linear infinite" }}>
    <circle cx="10" cy="10" r="8" stroke="#CBD5E1" strokeWidth="2.5" />
    <path d="M10 2a8 8 0 018 8" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
  </svg>
);

const CloudIcon = (): React.JSX.Element => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.5 19L19 19C21.2091 19 23 17.2091 23 15C23 12.7909 21.2091 11 19 11C18.8296 11 18.6625 11.0107 18.4988 11.0317C17.7412 8.14811 15.1182 6 12 6C9.11584 6 6.6247 7.8258 5.67232 10.3957C3.12061 10.7483 1 12.9163 1 15.5C1 18.5376 3.46243 21 6.5 21L8 21" />
    <path d="M12 11V21M12 11L9 14M12 11L15 14" />
  </svg>
);

// --- Helpers ---
function formatDate(dateStr?: string): string | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = d.getDate();
  const suffix = day === 1 || day === 21 || day === 31 ? "st" : day === 2 || day === 22 ? "nd" : day === 3 || day === 23 ? "rd" : "th";
  const month = d.toLocaleString("en-GB", { month: "long" });
  return `${month} ${day}${suffix}, ${d.getFullYear()}`;
}

function getInitial(name?: string): string {
  return (name || "?").trim()[0].toUpperCase();
}

// --- NoMigrantScreen ---
function NoMigrantScreen({ onContinue }: { onContinue: () => void }) {
  return (
    <div style={{ maxWidth: "860px", margin: "30px auto", padding: "0 24px" }}>
      <div style={{
        backgroundColor: "white", borderRadius: "12px", border: "1px solid #E2E8F0",
        padding: "80px 40px", display: "flex", flexDirection: "column",
        alignItems: "center", textAlign: "center", gap: "10px",
      }}>
        <GreenCheckCircle />
        <h2 style={{ margin: "10px 0 0", fontSize: "20px", fontWeight: "700", color: "#0F172A" }}>No Migrant Employees</h2>
        <p style={{ margin: "4px 0 0", fontSize: "14px", color: "#64748B", maxWidth: "380px", lineHeight: "1.65" }}>
          All employees are British/Irish and skip RTW validation.
        </p>
        <button 
          onClick={() => {
            const btn = event?.currentTarget as HTMLButtonElement;
            if (btn) btn.disabled = true;
            onContinue();
          }} 
          style={{
            marginTop: "12px", padding: "11px 28px", backgroundColor: "#0852C9",
            color: "white", border: "none", borderRadius: "8px",
            fontSize: "14px", fontWeight: "600", cursor: "pointer",
            display: "flex", alignItems: "center", gap: "8px"
          }}
        >
          Continue to Pension Compliance
        </button>
      </div>
    </div>
  );
}

// --- RTWVerificationScreen ---
interface RTWVerificationScreenProps {
  migrants: Employee[];
  onBackToStaffList: () => void;
  onContinue: () => void;
  onSaveEmployee: (empId: string, data: any) => Promise<void>;
}

function RTWVerificationScreen({ migrants, onBackToStaffList, onContinue, onSaveEmployee }: RTWVerificationScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const employee = migrants[currentIndex];
  const hasDocument = !!(employee?.documentType || employee?.documentNumber);
  const formattedStart = employee?.startDate ? formatDate(employee.startDate) : null;

  const [isExtracting, setIsExtracting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [manualName, setManualName] = useState("");
  const [checkDate, setCheckDate] = useState("");
  const [companyName, setCompanyName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (employee) {
      const toISODate = (val?: string | null) => {
        if (!val) return "";
        const d = new Date(val);
        if (isNaN(d.getTime())) return val;
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };
      setCheckDate(toISODate(extractedData?.check_date || employee.check_date));
      const rawCompany = extractedData?.company_name || employee.company_name || "";
      setCompanyName(rawCompany.replace(/\s+/g, " ").trim());
    }
  }, [currentIndex, extractedData, employee]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setIsExtracting(true);
    const loadingToast = toast.loading("Analyzing RTW document...");

    try {
      const response = await axios.post("/api/extract-rtw", formData);
      const data = response.data;

      if (data.success) {
        setExtractedData(data.extracted);
        if (data.extracted.name_extraction_failed) {
          toast.error("Name could not be extracted automatically. Manual input required.");
        } else {
          toast.success("RTW details extracted successfully!");
        }
      } else {
        toast.error(data.message || "Extraction failed.");
      }
    } catch (err: any) {
      console.error("RTW extraction error:", err);
      toast.error(err.response?.data?.details || "Failed to parse RTW document.");
    } finally {
      setIsExtracting(false);
      toast.dismiss(loadingToast);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div style={{ maxWidth: "860px", margin: "30px auto", padding: "0 24px" }}>
      {/* Header */}
      <div style={{ marginBottom: "22px" }}>
        <h2 style={{ margin: 0, fontSize: "24px", fontWeight: "700", color: "#0F172A", letterSpacing: "-0.3px" }}>
          Workflow 1: RTW & Start Date Compliance
        </h2>
        <p style={{ margin: "6px 0 0", fontSize: "13.5px", color: "#64748B" }}>
          Validating Right to Work documents for migrant employees
        </p>
      </div>

      {/* Employee Info & Card */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
        <button style={{
          padding: "5px 16px", borderRadius: "20px",
          border: "1.5px solid #E2E8F0",
          backgroundColor: "white", color: "#475569",
          fontSize: "13px", fontWeight: "400", cursor: "default",
        }}>Employee {currentIndex + 1} of {migrants.length}</button>
        <span style={{ fontSize: "13.5px", color: "#475569", fontWeight: "500" }}>{employee?.employee_full_name}</span>
      </div>

      <div style={{
        backgroundColor: "white", borderRadius: "10px", border: "1px solid #E2E8F0",
        padding: "20px 24px", marginBottom: "14px", display: "flex", alignItems: "center", gap: "16px",
      }}>
        <div style={{
          width: "44px", height: "44px", borderRadius: "50%",
          backgroundColor: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "18px", fontWeight: "700", color: "#0852C9", flexShrink: 0,
        }}>{getInitial(employee?.employee_full_name)}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "17px", fontWeight: "700", color: "#0F172A" }}>{employee?.employee_full_name}</div>
          <div style={{ fontSize: "13px", color: "#64748B", marginTop: "4px" }}>
            Migrant Worker{formattedStart ? ` • Employment Start: ${formattedStart}` : ""}
          </div>
        </div>
        
        {/* Upload/Change Button */}
        <div>
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: "none" }} accept=".pdf,.png,.jpg,.jpeg" />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isExtracting}
            style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "9px 16px", backgroundColor: "#F0F9FF",
              border: "1.5px solid #0EA5E9", borderRadius: "8px",
              color: "#0369A1", fontSize: "13.5px", fontWeight: "600",
              cursor: isExtracting ? "not-allowed" : "pointer"
            }}
          >
            {isExtracting ? <SpinnerIcon color="#0EA5E9" /> : <CloudIcon />}
            {isExtracting ? "Analyzing..." : hasDocument ? "Change Document" : "Upload RTW Document"}
          </button>
        </div>
      </div>

      {/* RTW Verification */}
      <div style={{
        backgroundColor: "white", borderRadius: "10px", border: "1px solid #E2E8F0",
        padding: "24px 26px", marginBottom: "28px",
      }}>
        <h3 style={{ margin: "0 0 5px", fontSize: "16px", fontWeight: "700", color: "#0F172A" }}>RTW Document Verification</h3>
        <p style={{ margin: "0 0 18px", fontSize: "13px", color: "#64748B" }}>Verify the uploaded RTW document and extracted information</p>
        
        {!hasDocument && !extractedData ? (
          <div style={{
            display: "flex", alignItems: "flex-start", gap: "11px",
            padding: "14px 18px",
            backgroundColor: "#FFF5F5",
            borderRadius: "8px", border: "1.5px solid #FCA5A5",
          }}>
            <AlertTriangleIcon />
            <div>
              <div style={{ fontSize: "14px", fontWeight: "600", color: "#DC2626", marginBottom: "3px" }}>RTW Document Missing</div>
              <div style={{ fontSize: "13px", color: "#DC2626", lineHeight: "1.5" }}>
                No RTW document has been uploaded for this employee. Please upload a document to proceed.
              </div>
            </div>
          </div>
        ) : (
          <div style={{
            padding: "16px 18px", backgroundColor: "#F0FDF4",
            borderRadius: "8px", border: "1.5px solid #BBF7D0",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
              <div style={{ color: "#166534", fontSize: "14px", fontWeight: "700" }}>✓ {extractedData ? "Extracted Information" : "Document on File"}</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
              {/* Employee Name / Manual Input */}
              <div>
                <div style={{ fontSize: "11px", color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Employee Name</div>
                {extractedData?.name_extraction_failed ? (
                  <div style={{ marginTop: "4px" }}>
                    <input 
                      type="text" 
                      value={manualName} 
                      onChange={(e) => setManualName(e.target.value)}
                      placeholder="Enter employee name manually"
                      style={{
                        width: "100%", padding: "8px 10px", borderRadius: "6px",
                        border: "1.5px solid #FCA5A5", fontSize: "13px", outline: "none"
                      }}
                    />
                    <div style={{ fontSize: "11px", color: "#DC2626", marginTop: "3px" }}>Auto-extraction failed. Please enter manually.</div>
                  </div>
                ) : (
                  <div style={{ fontSize: "14px", fontWeight: "600", color: "#0F172A" }}>
                    {extractedData?.employee_name || employee.employee_full_name}
                  </div>
                )}
              </div>

              {/* Check Date */}
              <div>
                <div style={{ fontSize: "11px", color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Check Date</div>
                <div style={{ fontSize: "14px", fontWeight: "600", color: "#0F172A" }}>
                  {checkDate ? formatDate(checkDate) : "N/A"}
                </div>
              </div>

              {/* Company Name */}
              <div>
                <div style={{ fontSize: "11px", color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Company Name</div>
                <div style={{ fontSize: "14px", fontWeight: "600", color: "#0F172A" }}>
                  {companyName || "N/A"}
                </div>
              </div>

              {/* Reference Number */}
              {(extractedData?.reference_number || employee.documentNumber) && (
                <div>
                  <div style={{ fontSize: "11px", color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Reference Number</div>
                  <div style={{ fontSize: "14px", fontWeight: "600", color: "#0F172A" }}>
                    {extractedData?.reference_number || employee.documentNumber || "N/A"}
                  </div>
                </div>
              )}
            </div>

            {/* Routing / Reason (Metadata from AI) */}
            {extractedData?.routing && (
              <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid #BBF7D0" }}>
                <div style={{ fontSize: "11px", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Compliance Context</div>
                <div style={{ fontSize: "12.5px", color: "#166534", lineHeight: "1.5" }}>
                  {extractedData.routing.reason}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
...
        <button onClick={onBackToStaffList} style={{
          padding: "10px 20px", backgroundColor: "white", color: "#374151",
          border: "1.5px solid #D1D5DB", borderRadius: "8px",
          fontSize: "14px", fontWeight: "500", cursor: "pointer",
        }}>Back to Staff List</button>

        <div style={{ display: "flex", gap: "10px" }}>
          {currentIndex > 0 && <button onClick={() => setCurrentIndex(currentIndex - 1)} style={{
            padding: "10px 18px", backgroundColor: "white", color: "#475569",
            border: "1.5px solid #E2E8F0", borderRadius: "8px",
            fontSize: "13.5px", fontWeight: "500", cursor: "pointer",
          }}>← Previous</button>}
          {currentIndex < migrants.length - 1 ? (
            <button 
              onClick={async () => {
                setIsSubmitting(true);
                try {
                  const data = {
                    passport_number: extractedData?.reference_number || employee.documentNumber,
                    check_date: checkDate || null,
                    company_name: companyName || null
                  };
                  await onSaveEmployee(employee.id, data);
                  setCurrentIndex(currentIndex + 1);
                  setExtractedData(null);
                  setManualName("");
                } finally {
                  setIsSubmitting(false);
                }
              }} 
              disabled={isSubmitting}
              style={{
                padding: "10px 18px", backgroundColor: isSubmitting ? "#93ABDE" : "#0852C9", color: "white",
                border: "none", borderRadius: "8px",
                fontSize: "13.5px", fontWeight: "600", cursor: isSubmitting ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", gap: "8px"
              }}
            >
              {isSubmitting && <SpinnerIcon color="#fff" />}
              Next Employee →
            </button>
          ) : (
            <button 
              onClick={async () => {
                setIsSubmitting(true);
                try {
                  const data = {
                    passport_number: extractedData?.reference_number || employee.documentNumber,
                    check_date: checkDate || null,
                    company_name: companyName || null
                  };
                  await onSaveEmployee(employee.id, data);
                  onContinue();
                } finally {
                  // Keep it true if we are navigating away
                }
              }} 
              disabled={isSubmitting}
              style={{
                padding: "10px 18px", backgroundColor: isSubmitting ? "#93ABDE" : "#0852C9", color: "white",
                border: "none", borderRadius: "8px",
                fontSize: "13.5px", fontWeight: "600", cursor: isSubmitting ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", gap: "8px"
              }}
            >
              {isSubmitting && <SpinnerIcon color="#fff" />}
              {isSubmitting ? "Processing..." : "Continue to Pension Compliance"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RTWCompliance() {
  return (
    <Suspense fallback={<div style={{ display: "flex", justifyContent: "center", padding: "100px" }}><SpinnerIcon /></div>}>
      <RTWComplianceImpl />
    </Suspense>
  );
}

function RTWComplianceImpl() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [recordId, setRecordId] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function loadData() {
      let dataLoaded = false;
      try {
        const token = getClientToken();
        if (token) {
          const queryId = searchParams.get("recordId") || searchParams.get("id");
          let id = queryId || sessionStorage.getItem("current_hr_record_id");
          
          if (!id) {
            const hrRes = await listHRValidationRecordsAction(token);
            if (hrRes.success && hrRes.data && hrRes.data.length > 0) {
              const sorted = [...hrRes.data].sort((a, b) => b.id - a.id);
              id = String(sorted[0].id);
              sessionStorage.setItem("current_hr_record_id", id);
            }
          }
          const numId = id ? Number(id) : null;
          setRecordId(numId);

          if (numId) {
            const empRes = await listEmployeesAction(numId, token);
            if (empRes.success && empRes.data) {
              const mapped = empRes.data.map((e: any) => ({
                id: String(e.id),
                employee_full_name: e.employee_full_name,
                nationality: e.nationality || "Migrant",
                documentType: e.rtw_document_url ? "Uploaded Document" : "",
                documentNumber: e.passport_number || (e.rtw_document_url ? e.rtw_document_url : ""),
                startDate: e.employment_start_date,
                passportNumber: e.passport_number,
                check_date: e.check_date,
                company_name: e.company_name,
              }));
              setEmployees(mapped);
              sessionStorage.setItem(`hr_employees_${id}`, JSON.stringify(mapped));
              dataLoaded = true;
            }
          }
        }
      } catch (err) {
        console.error("Error fetching RTW employees via API", err);
      }
      
      if (!dataLoaded && recordId) {
        try {
          const saved = sessionStorage.getItem(`hr_employees_${recordId}`);
          if (saved) setEmployees(JSON.parse(saved));
        } catch {}
      }
      setLoaded(true);
    }
    loadData();
  }, [searchParams]);

  const migrants = employees.filter((e) => !["british", "irish", "british/irish"].includes(e.nationality?.toLowerCase() || ""));
  const hasMigrants = migrants.length > 0;

  const markRTWComplete = () => {
    if (!recordId) return;
    try {
      const p = JSON.parse(sessionStorage.getItem(`hr_progress_${recordId}`) || "{}");
      sessionStorage.setItem(`hr_progress_${recordId}`, JSON.stringify({ ...p, rtw: true }));
    } catch {}
  };

  const handleSaveEmployee = async (empId: string, data: any) => {
    try {
      const token = getClientToken();
      await updateEmployeeAction(Number(empId), data, token);
      
      // Update local state so it persists if we go back/forward
      setEmployees(prev => prev.map(emp => emp.id === empId ? { ...emp, ...data } : emp));
    } catch (err) {
      console.error("Error saving employee RTW data:", err);
    }
  };

  const handleBack = () => router.push(`/employer/sections/hr-validation?recordId=${recordId}`);
  const handleContinueToPension = async () => {
    markRTWComplete();

    if (recordId) {
      const token = getClientToken();
      try {
        const record = await getHRRecord(recordId);
        await updateHRValidationRecordAction(recordId, {
          result_complete_sections: {
            ...(record?.result_complete_sections || {}),
            has_migrants: hasMigrants,
            migrant_count: migrants.length,
          }
        }, token);
      } catch (err) {
        console.error("Error updating RTW status:", err);
      }
    }

    router.push(`/employer/sections/pension?recordId=${recordId}`);
  };

  async function getHRRecord(id: number) {
    try {
      const token = getClientToken();
      const res = await listHRValidationRecordsAction(token);
      if (res.success && res.data) {
        return res.data.find(r => r.id === id);
      }
      return null;
    } catch { return null; }
  }

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", backgroundColor: "#F1F5F9", minHeight: "100vh" }}>
      <HRValidationTabs currentTabId="rtw" hrRecordId={recordId} onBack={handleBack} />
      {loaded && (hasMigrants
        ? <RTWVerificationScreen 
            migrants={migrants} 
            onBackToStaffList={handleBack} 
            onContinue={handleContinueToPension} 
            onSaveEmployee={handleSaveEmployee}
          />
        : <NoMigrantScreen onContinue={handleContinueToPension} />
      )}
    </div>
  );
}