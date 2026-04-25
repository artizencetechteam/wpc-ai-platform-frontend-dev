'use server';

import { cookies } from 'next/headers';
import { refreshTokenAction } from '@/app/auth/_action/auth.action';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://37.27.113.235:6767';

// ─── Token helpers ────────────────────────────────────────────────────────────

async function resolveToken(clientToken?: any): Promise<{ accessToken: string; sessionToken: string }> {
  let accessToken = '';
  let sessionToken = '';

  if (clientToken) {
    if (typeof clientToken === 'object') {
      accessToken =
        clientToken.access ??
        clientToken.token ??
        clientToken.access_token ??
        clientToken.key ??
        '';
      sessionToken =
        clientToken.session_token ??
        clientToken.session_id ??
        clientToken.sessionID ??
        '';
    } else if (typeof clientToken === 'string') {
      accessToken = clientToken.replace(/\s+/g, '').replace(/^(Bearer|Token)\s*/i, '');
    }
  }

  const store = await cookies();
  if (!accessToken) {
    const raw = store.get('access-token')?.value ?? store.get('access_token')?.value ?? '';
    accessToken = raw.replace(/\s+/g, '').replace(/^(Bearer|Token)\s*/i, '');
  }
  if (!sessionToken) {
    sessionToken = store.get('session-token')?.value ?? '';
  }

  return { accessToken, sessionToken };
}

function makeHeaders(accessToken: string, sessionToken?: string): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (accessToken) h['Authorization'] = `Bearer ${accessToken}`;
  if (sessionToken) h['X-Session-Token'] = sessionToken;
  return h;
}

async function apiFetch(
  url: string,
  options: RequestInit = {},
  clientToken?: string,
): Promise<Response> {
  const { accessToken, sessionToken } = await resolveToken(clientToken);
  let res = await fetch(url, {
    ...options,
    headers: makeHeaders(accessToken, sessionToken),
    cache: 'no-store',
  });

  console.log(`[apiFetch] ${options.method ?? 'GET'} ${url} → ${res.status}`);

  // Auto-refresh logic for Server Actions
  if (res.status === 401) {
    console.log('[apiFetch] 401 Detected. Attempting token refresh...');
    const refreshResult = await refreshTokenAction();
    
    if (refreshResult.success && refreshResult.accessToken) {
      console.log('[apiFetch] Refresh successful. Retrying original request...');
      // Retry with new token
      res = await fetch(url, {
        ...options,
        headers: makeHeaders(refreshResult.accessToken, sessionToken),
        cache: 'no-store',
      });
      console.log(`[apiFetch] Retry result → ${res.status}`);
    } else {
      console.warn('[apiFetch] Refresh failed or no new token. Returning original 401.');
    }
  }

  return res;
}

function errMsg(data: any): string {
  if (!data) return 'Unexpected error.';
  if (typeof data === 'string') return data;
  if (data.detail) return String(data.detail);
  if (data.non_field_errors) return data.non_field_errors.join(' ');
  const k = Object.keys(data)[0];
  if (k) return Array.isArray(data[k]) ? `${k}: ${data[k][0]}` : String(data[k]);
  return 'Something went wrong.';
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type HRValidationRecord = {
  id: number;
  date_created?: string;
  date_updated?: string;
  company_name?: string | null;
  bank_statement_url?: string | null;
  bank_name?: string | null;
  transactions?: any | null;
  complete_summary_section?: boolean | null;
  result_complete_sections?: any | null;
  rtw_section_comments?: string | null;
  pension_section_comments?: string | null;
  authorising_officer_section_comments?: string | null;
  contract_section_comments?: string | null;
  financial_section_comments?: string | null;
  employeee_sections_comments?: string | null;
  User: number;
  [key: string]: any;
};

export type Employee = {
  id: number;
  employee_full_name: string;
  employment_start_date: string;
  nationality: string;
  HRValidationRecord_id: number;
  rtw_document_url?: string;
  status?: string;
  created_at?: string;
  // Pension fields
  min_22_year_age?: boolean;
  earning_gbp_10k_above?: boolean;
  pension_status?: string;
  opted_out?: boolean;
  auto_enrollment_date?: string | null;
  // AO fields
  role_in_company?: string | null;
  AO_Credentials_senior_most_employee?: boolean;
  AO_Credentials_company_director?: boolean;
  AO_Credentials_on_payroll?: boolean;
  AO_Credentials_holds_shared?: boolean;
  // RTW fields
  rtw_document_type?: string | null;
  visa_expiry_date?: string | null;
  passport_number?: string | null;
  [key: string]: any;
};

export type FinancialRecord = {
  id: number;
  current_closing_balance_gbp?: string | null;
  total_incoming_gbp_credits?: string | null;
  total_outgoing_gbp_debits?: string | null;
  payments_reflected_in_bank?: boolean | null;
  is_future_engagement?: boolean | null;
  HRValidationRecord_id?: number | null;
  [key: string]: any;
};

export type AddEmployeePayload = {
  employee_full_name: string;
  employment_start_date: string;
  nationality: string;
  HRValidationRecord_id: number;
  rtw_document_url?: string;
};

type AR<T = null> = { success: boolean; message: string; data?: T };

export type DashboardStats = {
  hrValidation: number;
  postComplianceValidation: number;
  callAgents: number;
  tasksInProcess: number;
};

export type TaskItem = {
  id: string | number;
  type: string;
  dateCreated: string;
  status: string;
  result: string;
  companyName?: string;
  employeeCount?: number;
  employees?: Employee[];
};

export type PostComplianceAudit = {
  id: number;
  reference_number?: string;
  company_client_name?: string | null;
  User?: number;
  date_created?: string;
  date_updated?: string;
  [key: string]: any;
};

export type PostComplianceStaff = {
  id: number;
  full_name: string;
  designation?: string | null;
  working_hours?: string | null;
  salary_rate?: string | null;
  payroll_onboarding_date?: string | null;
  employe_type?: string | null;
  cos_file_url?: string | null;
  cos_file_extracted_json?: any | null;
  cv_file_url?: string | null;
  cv_file_extracted_json?: any | null;
  experiece_letter_file_url?: string | null;
  interview_dates?: string | null;
  exp_validation_date?: string | null;
  employment_type?: string | null;
  rtw_work_check?: string | null;
  rtw_work_file_url?: string | null;
  rtw_work_file_extracted_json?: any | null;
  passport?: string | null;
  brp_visa?: string | null;
  visa_vignette?: string | null;
  cos?: string | null;
  right_to_work_check?: string | null;
  proof_of_address?: string | null;
  history_of_contact_details?: string | null;
  change_of_circumstance_tracking?: string | null;
  personal_information?: string | null;
  employment_contract?: string | null;
  cv_candidate?: string | null;
  experience_letter?: string | null;
  experience_letter_validation?: string | null;
  cv_unsuccessful_candidates?: string | null;
  job_advert?: string | null;
  interview_note_candidate?: string | null;
  interview_notes_unsuccessful?: string | null;
  english_language_proficiency_test?: string | null;
  tb_test?: string | null;
  p45_previous_employer?: string | null;
  attendance_records?: string | null;
  evidence_of_work?: string | null;
  holiday_leave_records?: string | null;
  unauthorised_absence?: string | null;
  work_location_changed?: string | null;
  statutory_leaves?: string | null;
  visa_monitoring?: string | null;
  overall_observation?: string | null;
  recommendation_remarks?: string | null;
  user?: number | null;
  PostComplianceAuditObj?: number | null;
  [key: string]: any;
};

export type CreateAuditPayload = {
  User?: number;
  company_client_name?: string;
};

export type UpdateAuditPayload = Partial<CreateAuditPayload>;

export type CreateStaffPayload = {
  full_name: string;
  post_compliance_audit: number;
  PostComplianceAuditObj: number;
  [key: string]: any;
};

export type UpdateStaffPayload = Partial<Omit<PostComplianceStaff, 'id'>>;

// ─── HR Validation Records ────────────────────────────────────────────────────

export async function listHRValidationRecordsAction(
  clientToken?: string,
): Promise<AR<HRValidationRecord[]>> {
  try {
    const res = await apiFetch(
      `${BASE_URL}/api/hr-validation/hr-validation-records/`,
      {},
      clientToken,
    );
    const data = await res.json();
    if (!res.ok) return { success: false, message: errMsg(data) };
    const records = Array.isArray(data) ? data : (data.results ?? []);
    // Debug: log all fields returned by API so we can see what date fields exist
    if (records.length > 0) {
      console.log('[HR record fields available]', Object.keys(records[0]));
      console.log('[HR record #0 full]', JSON.stringify(records[0]));
    }
    return { success: true, message: 'OK', data: records };
  } catch (e) {
    console.error('[listHRValidationRecordsAction]', e);
    return { success: false, message: 'Network error.' };
  }
}

export async function createHRValidationRecordAction(
  userId: number,
  clientToken?: string,
): Promise<AR<HRValidationRecord>> {
  try {
    const res = await apiFetch(
      `${BASE_URL}/api/hr-validation/hr-validation-records/`,
      { method: 'POST', body: JSON.stringify({ User: userId }) },
      clientToken,
    );
    const data = await res.json();
    if (!res.ok) return { success: false, message: errMsg(data) };
    return { success: true, message: 'Created.', data };
  } catch (e) {
    console.error('[createHRValidationRecordAction]', e);
    return { success: false, message: 'Network error.' };
  }
}

export async function updateHRValidationRecordAction(
  id: number,
  payload: Partial<HRValidationRecord>,
  clientToken?: string,
): Promise<AR<HRValidationRecord>> {
  try {
    const res = await apiFetch(
      `${BASE_URL}/api/hr-validation/hr-validation-records/${id}/`,
      { method: 'PATCH', body: JSON.stringify(payload) },
      clientToken,
    );
    const data = await res.json();
    if (!res.ok) return { success: false, message: errMsg(data) };
    return { success: true, message: 'Updated.', data };
  } catch (e) {
    console.error('[updateHRValidationRecordAction]', e);
    return { success: false, message: 'Network error.' };
  }
}

// ─── Employees ────────────────────────────────────────────────────────────────

export async function listEmployeesAction(
  hrValidationRecordId: number,
  clientToken?: string,
): Promise<AR<Employee[]>> {
  try {
    const res = await apiFetch(
      `${BASE_URL}/api/hr-validation/employees/?HRValidationRecord_id=${hrValidationRecordId}`,
      {},
      clientToken,
    );
    const data = await res.json();
    if (!res.ok) return { success: false, message: errMsg(data) };
    const employees = Array.isArray(data) ? data : (data.results ?? []);
    // Debug: log employee fields to find any date field
    if (employees.length > 0) {
      console.log(`[employee fields for record ${hrValidationRecordId}]`, Object.keys(employees[0]));
      console.log(`[employee #0 full]`, JSON.stringify(employees[0]));
    }
    return { success: true, message: 'OK', data: employees };
  } catch (e) {
    console.error('[listEmployeesAction]', e);
    return { success: false, message: 'Network error.' };
  }
}

export async function addEmployeeAction(
  payload: AddEmployeePayload,
  clientToken?: string,
): Promise<AR<Employee>> {
  try {
    const res = await apiFetch(
      `${BASE_URL}/api/hr-validation/employees/`,
      { method: 'POST', body: JSON.stringify(payload) },
      clientToken,
    );
    const data = await res.json();
    if (!res.ok) return { success: false, message: errMsg(data) };
    return { success: true, message: 'Employee added.', data };
  } catch (e) {
    console.error('[addEmployeeAction]', e);
    return { success: false, message: 'Network error.' };
  }
}

export async function updateEmployeeAction(
  id: number,
  payload: Partial<Employee>,
  clientToken?: string,
): Promise<AR<Employee>> {
  try {
    const res = await apiFetch(
      `${BASE_URL}/api/hr-validation/employees/${id}/`,
      { method: 'PATCH', body: JSON.stringify(payload) },
      clientToken,
    );
    const data = await res.json();
    if (!res.ok) return { success: false, message: errMsg(data) };
    return { success: true, message: 'Employee updated.', data };
  } catch (e) {
    console.error('[updateEmployeeAction]', e);
    return { success: false, message: 'Network error.' };
  }
}

// ─── Financial Records ─────────────────────────────────────────────────────────

export async function listFinancialRecordsAction(
  clientToken?: string,
): Promise<AR<FinancialRecord[]>> {
  try {
    const res = await apiFetch(`${BASE_URL}/api/hr-validation/financial-records/`, {}, clientToken);
    const data = await res.json();
    if (!res.ok) return { success: false, message: errMsg(data) };
    return { success: true, message: 'Financial records loaded.', data };
  } catch (e) {
    console.error('[listFinancialRecordsAction]', e);
    return { success: false, message: 'Network error.' };
  }
}

export async function createFinancialRecordAction(
  payload: Partial<FinancialRecord>,
  clientToken?: string,
): Promise<AR<FinancialRecord>> {
  try {
    const res = await apiFetch(
      `${BASE_URL}/api/hr-validation/financial-records/`,
      { method: 'POST', body: JSON.stringify(payload) },
      clientToken,
    );
    const data = await res.json();
    if (!res.ok) return { success: false, message: errMsg(data) };
    return { success: true, message: 'Financial record created.', data };
  } catch (e) {
    console.error('[createFinancialRecordAction]', e);
    return { success: false, message: 'Network error.' };
  }
}

export async function updateFinancialRecordAction(
  id: number,
  payload: Partial<FinancialRecord>,
  clientToken?: string,
): Promise<AR<FinancialRecord>> {
  try {
    const res = await apiFetch(
      `${BASE_URL}/api/hr-validation/financial-records/${id}/`,
      { method: 'PATCH', body: JSON.stringify(payload) },
      clientToken,
    );
    const data = await res.json();
    if (!res.ok) return { success: false, message: errMsg(data) };
    return { success: true, message: 'Financial record updated.', data };
  } catch (e) {
    console.error('[updateFinancialRecordAction]', e);
    return { success: false, message: 'Network error.' };
  }
}

// ─── Format date ──────────────────────────────────────────────────────────────
// Handles both ISO datetime strings and plain YYYY-MM-DD date strings

function formatDate(raw?: string | null): string {
  if (!raw) return '—';
  // Normalise plain YYYY-MM-DD so it parses in every timezone
  const normalised = raw.includes('T') ? raw : `${raw}T00:00:00`;
  const d = new Date(normalised);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// ─── Resolve best available date ──────────────────────────────────────────────
// Tries every plausible date field on the record and its employees

function resolveDateCreated(record: HRValidationRecord, employees: Employee[]): string {
  // 1. Try all known date-like keys on the record
  const recordKeys = [
    'created_at', 'createdAt', 'date_created', 'dateCreated',
    'updated_at', 'updatedAt', 'date', 'timestamp', 'time',
  ];
  for (const key of recordKeys) {
    const formatted = formatDate(record[key]);
    if (formatted !== '—') return formatted;
  }

  // 2. Try date fields on employees (created_at, etc.)
  const empDateKeys = ['created_at', 'createdAt', 'date_created', 'dateCreated'];
  const empDates: Date[] = [];
  for (const emp of employees) {
    for (const key of empDateKeys) {
      if (emp[key]) {
        const d = new Date(emp[key]);
        if (!isNaN(d.getTime())) { empDates.push(d); break; }
      }
    }
  }
  if (empDates.length > 0) {
    const latest = empDates.sort((a, b) => b.getTime() - a.getTime())[0];
    return formatDate(latest.toISOString());
  }

  // 3. Last resort: use the latest employment_start_date from employees
  // employment_start_date is always present and is a meaningful date
  const startDates: Date[] = employees
    .map((e) => new Date(
      e.employment_start_date?.includes('T')
        ? e.employment_start_date
        : `${e.employment_start_date}T00:00:00`,
    ))
    .filter((d) => !isNaN(d.getTime()));

  if (startDates.length > 0) {
    const latest = startDates.sort((a, b) => b.getTime() - a.getTime())[0];
    return formatDate(latest.toISOString());
  }

  return '—';
}

// ─── Status → display label ───────────────────────────────────────────────────

function statusToResult(s?: string): string {
  const map: Record<string, string> = {
    pending:     'Pending',
    in_progress: 'In Review',
    approved:    'Approved',
    rejected:    'Rejected',
    completed:   'Completed',
  };
  return map[s?.toLowerCase() ?? ''] ?? 'Pending';
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export async function getDashboardStatsAction(
  clientToken?: string,
): Promise<AR<DashboardStats>> {
  const res = await listHRValidationRecordsAction(clientToken);
  if (!res.success) return { success: false, message: res.message };
  const records = res.data ?? [];

  // Treat pending, in_progress, missing/null status all as "in process"
  const tasksInProcess = records.filter(
    (r) => !r.status || ['pending', 'in_progress', 'in progress'].includes(r.status.toLowerCase()),
  ).length;

  return {
    success: true,
    message: 'OK',
    data: {
      hrValidation: records.length,
      postComplianceValidation: 0,
      callAgents: 0,
      tasksInProcess,
    },
  };
}

// ─── All Tasks ────────────────────────────────────────────────────────────────

export async function getAllTasksAction(
  page = 1,
  clientToken?: string,
): Promise<AR<{ tasks: TaskItem[]; totalPages: number }>> {
  const res = await listHRValidationRecordsAction(clientToken);
  if (!res.success) return { success: false, message: res.message };

  const records = res.data ?? [];

  const tasks: TaskItem[] = await Promise.all(
    records.map(async (r) => {
      const empRes = await listEmployeesAction(r.id, clientToken);
      const employees = empRes.data ?? [];

      return {
        id: r.id,
        type: 'HR Validation',
        dateCreated: resolveDateCreated(r, employees),
        companyName: r.company_name || r.client_name || r.Company || r.business_name || 'N/A',
        status: r.status ?? 'Pending',
        result: statusToResult(r.status),
        employeeCount: employees.length,
        employees,
      };
    }),
  );

  const PAGE_SIZE = 10;
  const totalPages = Math.max(1, Math.ceil(tasks.length / PAGE_SIZE));
  const paginated = tasks.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return {
    success: true,
    message: 'OK',
    data: { tasks: paginated, totalPages },
  };
}

// ─── Filtered task actions ────────────────────────────────────────────────────

export async function getHRValidationTasksAction(page = 1, clientToken?: string) {
  return getAllTasksAction(page, clientToken);
}

export async function getPostComplianceTasksAction(
  page = 1,
  _clientToken?: string,
): Promise<AR<{ tasks: TaskItem[]; totalPages: number }>> {
  return { success: true, message: 'OK', data: { tasks: [], totalPages: 1 } };
}

export async function getCallAgentsTasksAction(
  page = 1,
  _clientToken?: string,
): Promise<AR<{ tasks: TaskItem[]; totalPages: number }>> {
  return { success: true, message: 'OK', data: { tasks: [], totalPages: 1 } };
}

// ─── Post Compliance Audits ───────────────────────────────────────────────────

export async function createPostComplianceAuditAction(
  userId: number,
  clientToken?: string,
): Promise<AR<PostComplianceAudit>> {
  try {
    const res = await apiFetch(
      `${BASE_URL}/api/post_compliance/audits/`,
      { method: 'POST', body: JSON.stringify({ User: userId }) },
      clientToken,
    );
    const data = await res.json();
    if (!res.ok) return { success: false, message: errMsg(data) };
    return { success: true, message: 'Audit created.', data };
  } catch (e) {
    console.error('[createPostComplianceAuditAction]', e);
    return { success: false, message: 'Network error.' };
  }
}

export async function listPostComplianceAuditsAction(
  clientToken?: string,
): Promise<AR<PostComplianceAudit[]>> {
  try {
    const res = await apiFetch(
      `${BASE_URL}/api/post_compliance/audits/`,
      {},
      clientToken,
    );
    const data = await res.json();
    if (!res.ok) return { success: false, message: errMsg(data) };
    const audits = Array.isArray(data) ? data : (data.results ?? []);
    return { success: true, message: 'OK', data: audits };
  } catch (e) {
    console.error('[listPostComplianceAuditsAction]', e);
    return { success: false, message: 'Network error.' };
  }
}

export async function getPostComplianceAuditAction(
  id: number,
  clientToken?: string,
): Promise<AR<PostComplianceAudit>> {
  try {
    const res = await apiFetch(
      `${BASE_URL}/api/post_compliance/audits/${id}/`,
      {},
      clientToken,
    );
    const data = await res.json();
    if (!res.ok) return { success: false, message: errMsg(data) };
    return { success: true, message: 'OK', data };
  } catch (e) {
    console.error('[getPostComplianceAuditAction]', e);
    return { success: false, message: 'Network error.' };
  }
}

export async function updatePostComplianceAuditAction(
  id: number,
  payload: UpdateAuditPayload,
  clientToken?: string,
): Promise<AR<PostComplianceAudit>> {
  try {
    const res = await apiFetch(
      `${BASE_URL}/api/post_compliance/audits/${id}/`,
      { method: 'PATCH', body: JSON.stringify(payload) },
      clientToken,
    );
    const data = await res.json();
    if (!res.ok) return { success: false, message: errMsg(data) };
    return { success: true, message: 'Audit updated.', data };
  } catch (e) {
    console.error('[updatePostComplianceAuditAction]', e);
    return { success: false, message: 'Network error.' };
  }
}

export async function deletePostComplianceAuditAction(
  id: number,
  clientToken?: string,
): Promise<AR<null>> {
  try {
    const res = await apiFetch(
      `${BASE_URL}/api/post_compliance/audits/${id}/`,
      { method: 'DELETE' },
      clientToken,
    );
    if (res.status === 204) {
      return { success: true, message: 'Audit deleted.', data: null };
    }
    const data = await res.json().catch(() => null);
    if (!res.ok) return { success: false, message: errMsg(data) };
    return { success: true, message: 'Audit deleted.', data: null };
  } catch (e) {
    console.error('[deletePostComplianceAuditAction]', e);
    return { success: false, message: 'Network error.' };
  }
}

// ─── Post Compliance Staff ────────────────────────────────────────────────────

export async function createPostComplianceStaffAction(
  payload: CreateStaffPayload,
  clientToken?: string,
): Promise<AR<PostComplianceStaff>> {
  console.log('[createPostComplianceStaffAction] payload received:', payload);
  try {
    const res = await apiFetch(
      `${BASE_URL}/api/post_compliance/staff/`,
      { method: 'POST', body: JSON.stringify(payload) },
      clientToken,
    );

    // We need to clone the response to log it, or just await json() directly
    const text = await res.text();
    console.log('[createPostComplianceStaffAction] DRF RESPONSE:', res.status, text);

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      data = text;
    }

    if (!res.ok) return { success: false, message: errMsg(data) };
    return { success: true, message: 'Staff created successfully', data: data as PostComplianceStaff };
  } catch (e) {
    console.error('[createPostComplianceStaffAction]', e);
    return { success: false, message: 'Network error.' };
  }
}

export async function listPostComplianceStaffAction(
  clientToken?: string,
): Promise<AR<PostComplianceStaff[]>> {
  try {
    const res = await apiFetch(
      `${BASE_URL}/api/post_compliance/staff/`,
      {},
      clientToken,
    );
    const data = await res.json();
    if (!res.ok) return { success: false, message: errMsg(data) };
    const staff = Array.isArray(data) ? data : (data.results ?? []);
    return { success: true, message: 'OK', data: staff };
  } catch (e) {
    console.error('[listPostComplianceStaffAction]', e);
    return { success: false, message: 'Network error.' };
  }
}

export async function getPostComplianceStaffByAuditAction(
  auditId: number,
  clientToken?: string,
): Promise<AR<PostComplianceStaff[]>> {
  try {
    const res = await apiFetch(
      `${BASE_URL}/api/post_compliance/staff/by-audit/${auditId}/`,
      {},
      clientToken,
    );
    const text = await res.text();
    console.log(`[getPostComplianceStaffByAuditAction] GET by-audit/${auditId}/ ->`, res.status, text);

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      data = text;
    }

    if (!res.ok) return { success: false, message: errMsg(data) };
    const staff = Array.isArray(data) ? data : (data.results ?? []);
    return { success: true, message: 'OK', data: staff };
  } catch (e) {
    console.error('[getPostComplianceStaffByAuditAction]', e);
    return { success: false, message: 'Network error.' };
  }
}

export async function getPostComplianceStaffAction(
  id: number,
  clientToken?: string,
): Promise<AR<PostComplianceStaff>> {
  try {
    const res = await apiFetch(
      `${BASE_URL}/api/post_compliance/staff/${id}/`,
      {},
      clientToken,
    );
    const data = await res.json();
    if (!res.ok) return { success: false, message: errMsg(data) };
    return { success: true, message: 'OK', data };
  } catch (e) {
    console.error('[getPostComplianceStaffAction]', e);
    return { success: false, message: 'Network error.' };
  }
}

export async function updatePostComplianceStaffAction(
  id: number,
  payload: UpdateStaffPayload,
  clientToken?: string,
): Promise<AR<PostComplianceStaff>> {
  try {
    console.log('[updatePostComplianceStaffAction] PATCH payload:', JSON.stringify(payload));
    const res = await apiFetch(
      `${BASE_URL}/api/post_compliance/staff/${id}/`,
      { method: 'PATCH', body: JSON.stringify(payload) },
      clientToken,
    );
    const text = await res.text();
    console.log('[updatePostComplianceStaffAction] RESPONSE', res.status, text);
    let data: any;
    try { data = JSON.parse(text); } catch { data = text; }
    if (!res.ok) return { success: false, message: errMsg(data) };
    return { success: true, message: 'Staff updated.', data };
  } catch (e) {
    console.error('[updatePostComplianceStaffAction]', e);
    return { success: false, message: 'Network error.' };
  }
}

/**
 * Convenience wrapper – PATCH any subset of the staff detail fields.
 * Uses the same PATCH endpoint; pass only the fields you want to update.
 */
export async function updatePostComplianceStaffDetailsAction(
  staffId: number,
  details: UpdateStaffPayload,
  clientToken?: string,
): Promise<AR<PostComplianceStaff>> {
  return updatePostComplianceStaffAction(staffId, details, clientToken);
}

export async function deletePostComplianceStaffAction(
  id: number,
  clientToken?: string,
): Promise<AR<null>> {
  try {
    const res = await apiFetch(
      `${BASE_URL}/api/post_compliance/staff/${id}/`,
      { method: 'DELETE' },
      clientToken,
    );
    if (res.status === 204) {
      return { success: true, message: 'Staff deleted.', data: null };
    }
    const data = await res.json().catch(() => null);
    if (!res.ok) return { success: false, message: errMsg(data) };
    return { success: true, message: 'Staff deleted.', data: null };
  } catch (e) {
    console.error('[deletePostComplianceStaffAction]', e);
    return { success: false, message: 'Network error.' };
  }
}
