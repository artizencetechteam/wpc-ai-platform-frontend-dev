'use client';

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  createHRValidationRecordAction,
  listHRValidationRecordsAction,
  updateHRValidationRecordAction,
} from "@/app/employer/sections/action/action";
import HRValidationTabs from "../_components/HRValidationTabs";

export function getClientToken(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith("access-token="));
  if (!match) return "";
  const raw = decodeURIComponent(match.split("=").slice(1).join("="));
  return raw.replace(/\s+/g, "").replace(/^(Bearer|Token)\s*/i, "");
}



const SpinnerIcon = ({ color = "#0852C9" }: { color?: string }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ animation: "spin 1s linear infinite" }}>
    <circle cx="10" cy="10" r="8" stroke="#CBD5E1" strokeWidth="2.5" />
    <path d="M10 2a8 8 0 018 8" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
  </svg>
);


export default function CompanyPage() {
  return (
    <Suspense fallback={<div style={{ display: "flex", justifyContent: "center", padding: "100px" }}><SpinnerIcon /></div>}>
      <CompanyPageImpl />
    </Suspense>
  );
}

function CompanyPageImpl() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [hrRecordId, setHrRecordId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [tabProgress, setTabProgress] = useState<Record<string, boolean>>({});


  useEffect(() => {
    initHRRecord();
    const queryId = searchParams.get("recordId") || searchParams.get("id");
    if (queryId) {
      const p = sessionStorage.getItem(`hr_progress_${queryId}`);
      if (p) {
        try { setTabProgress(JSON.parse(p)); } catch { setTabProgress({}); }
      }
    }
  }, [searchParams]);

  async function initHRRecord() {
    setLoading(true);
    setApiError("");
    try {
      const token = getClientToken();
      const queryId = searchParams.get("recordId") || searchParams.get("id");
      const isNew = searchParams.get("action") === "new";

      const listRes = await listHRValidationRecordsAction(token);
      if (!listRes.success) {
        setApiError(listRes.message);
        setLoading(false);
        return;
      }

      const records = listRes.data ?? [];
      const sortedRecords = [...records].sort((a, b) => b.id - a.id);

      let recordId: number | null = null;

      if (isNew) {
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
      } else if (queryId) {
        recordId = Number(queryId);
      } else if (sortedRecords.length > 0) {
        recordId = sortedRecords[0].id;
      } else {
        // Fallback: Create one if none exists
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

        // Hydrate from server if available
        let srvName = "";
        const record = sortedRecords.find((r) => r.id === recordId);
        if (record) {
          if (record.company_name) {
            srvName = record.company_name;
            setCompanyName(srvName);
            sessionStorage.setItem(`company_name_${recordId}`, srvName);
          }
        }
      }
    } catch (e) {
      console.error("initHRRecord error:", e);
      setApiError("Unexpected error initialising HR record.");
    } finally {
      setLoading(false);
    }
  }

  // Real-time persistence now relies on the handleContinue save or local state

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleContinue = async () => {
    if (!companyName.trim()) return;
    setIsSubmitting(true);
    if (hrRecordId) {
      sessionStorage.setItem(`company_name_${hrRecordId}`, companyName.trim());

      // Save to server
      const token = getClientToken();
      await updateHRValidationRecordAction(hrRecordId, {
        company_name: companyName.trim(),
      }, token);

      // Mark company step as complete in progress map
      const pStr = sessionStorage.getItem(`hr_progress_${hrRecordId}`);
      const p = pStr ? JSON.parse(pStr) : {};
      p.company = true;
      sessionStorage.setItem(`hr_progress_${hrRecordId}`, JSON.stringify(p));
      router.push(`/employer/sections/hr-validation?recordId=${hrRecordId}`);
    }
  };

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", backgroundColor: "#F1F5F9", minHeight: "100vh" }}>
      <HRValidationTabs currentTabId="company" hrRecordId={hrRecordId} />

      <div style={{ maxWidth: "860px", margin: "60px auto", padding: "0 24px", transition: "max-width 0.3s ease" }}>
        {apiError && (
          <div style={{ marginBottom: "16px", padding: "12px 16px", backgroundColor: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ margin: 0, fontSize: "13px", color: "#DC2626" }}>⚠ {apiError}</p>
            <button onClick={() => initHRRecord()} style={{ background: "none", border: "1px solid #FECACA", borderRadius: "6px", padding: "4px 10px", fontSize: "12px", color: "#DC2626", cursor: "pointer" }}>Retry</button>
          </div>
        )}

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "100px" }}><SpinnerIcon /></div>
        ) : (
          <div style={{ backgroundColor: "#F8FAFC", borderRadius: "14px", border: "1.5px solid #E2E8F0", padding: "40px", maxWidth: "600px", margin: "0 auto", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", transition: "max-width 0.3s ease" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
              <div style={{ backgroundColor: "#EFF6FF", padding: "8px", borderRadius: "8px" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0852C9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 21h18" /><path d="M3 7v1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7H3" />
                  <path d="M19 21V11" /><path d="M5 21V11" />
                </svg>
              </div>
              <h2 style={{ margin: 0, fontSize: "24px", fontWeight: "700", color: "#0F172A" }}>Company Details</h2>
            </div>
            <p style={{ margin: "0 0 32px", fontSize: "14px", color: "#64748B" }}>
              Enter the company name to begin HR Records Validation
            </p>

            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#374151", marginBottom: "8px" }}>
                Company (Client) Name *
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Enter company or client name"
                style={{
                  width: "100%", padding: "12px 16px", borderRadius: "10px",
                  border: "1.5px solid #D1D5DB", fontSize: "15px", outline: "none",
                  boxSizing: "border-box", color: "#0F172A", backgroundColor: "white",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => e.target.style.borderColor = "#0852C9"}
                onBlur={(e) => e.target.style.borderColor = "#D1D5DB"}
              />
            </div>

            <button
              onClick={handleContinue}
              disabled={isSubmitting || !companyName.trim()}
              style={{
                width: "100%", padding: "14px", borderRadius: "10px", border: "none",
                backgroundColor: (isSubmitting || !companyName.trim()) ? "#93ABDE" : "#0852C9", color: "white",
                fontSize: "15px", fontWeight: "600", cursor: (isSubmitting || !companyName.trim()) ? "not-allowed" : "pointer",
                transition: "background-color 0.2s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
              }}
            >
              {isSubmitting && <SpinnerIcon color="#fff" />}
              {isSubmitting ? "Processing..." : "Continue to Staff List"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
