import clientApi from "@/lib/axios";

// action for getting the dashboard
export async function get_condidate_dashboard() {
    try {
        const res = await clientApi.get('api/candidate/dashboard/');
        
        if (res.status === 200 || res.status === 204) {
            return {
                success: true,
                message: "Successfully fetched Dashboard",
                data: res.data.data
            };
        }
        return {
            success: false,
            message: "Failed to get dashboard"
        };
    } catch (error: any) {
        console.log(error); 
        // Check for authentication error
        if (error.response?.status === 401 || error.response?.status === 403) {
            return {
                success: false,
                message: "Authentication credentials were not provided.",
                detail: "Authentication credentials were not provided."
            };
        }
        // Generic error
        return {
            success: false,
            message: "Failed to get the dashboard"
        };
    }
}

// action for getting the profile
export async function get_candidate_profile() {
    try {
        const res = await clientApi.get('api/candidate/profile/');
        
        if (res.status === 200 || res.status === 204) {
            return {
                success: true,
                message: "Successfully fetched profile",
                data: res.data
            };
        }
        
        return {
            success: false,
            message: "Failed to get the profile"
        };
    } catch (error: any) {
        console.log(error);
        if (error.response?.status === 401 || error.response?.status === 403) {
            return {
                success: false,
                message: "Authentication credentials were not provided.",
                detail: "Authentication credentials were not provided."
            };
        }
        return {
            success: false,
            message: "Failed to get the profile"
        };
    }
}

// action for updating a profile
export async function update_candidate_profile(data: {
  preferred_industries?: string;
  preferred_work_type?: string;
  preferred_locations?: string;
  passport_number?: string;
  passport_country?: string;
  full_name?: string;
  phone_number?: string;
  nationality?: string;
  address?: string;
  portfolio?: Array<{
    id?: number; // Optional for new items
    link_type: string;
    url: string;
    description?: string;
  }>;
  interested_roles?:Array<{
    id?:number;
    name:string;
    code: number | null;
    job_related_roles: string[];
  }>
}) {
  try {
    const res = await clientApi.patch('api/candidate/profile/', data);
    
    if (res.status === 200 || res.status === 204) {
      return {
        success: true,
        message: "Successfully updated profile",
        data: res.data
      };
    }
    
    return {
      success: false,
      message: "Failed to update profile"
    };
  } catch (error: any) {
    console.error("Profile update error:", error);
    
    // Authentication errors
    if (error.response?.status === 401 || error.response?.status === 403) {
      return {
        success: false,
        message: "Authentication credentials were not provided.",
        detail: error.response?.data?.detail || "Authentication credentials were not provided."
      };
    }
    
    // Validation errors
    if (error.response?.status === 400) {
      return {
        success: false,
        message: "Validation error",
        detail: error.response?.data
      };
    }
    
    // Generic error with more context
    return {
      success: false,
      message: error.response?.data?.message || "Failed to update profile",
      detail: error.response?.data
    };
  }
}

// update cv
export async function update_candidate_cv(cvFile: File) {
  try {
    const formData = new FormData();
    formData.append('cv_file', cvFile);

    const res = await clientApi.patch('api/candidate/profile/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (res.status === 200 || res.status === 204) {
      return {
        success: true,
        message: "Successfully updated CV",
        data: res.data
      };
    }

    return {
      success: false,
      message: "Failed to update CV"
    };
  } catch (error: any) {
    console.error("CV update error:", error);

    // Authentication errors
    if (error.response?.status === 401 || error.response?.status === 403) {
      return {
        success: false,
        message: "Authentication credentials were not provided.",
        detail: error.response?.data?.detail || "Authentication credentials were not provided."
      };
    }

    // Validation errors (e.g., file too large, wrong format)
    if (error.response?.status === 400) {
      return {
        success: false,
        message: "Invalid file",
        detail: error.response?.data?.resume?.[0] || error.response?.data
      };
    }

    // Generic error
    return {
      success: false,
      message: error.response?.data?.message || "Failed to update CV",
      detail: error.response?.data
    };
  }
}


// update cv
export async function update_passport(cvFile: File) {
  try {
    const formData = new FormData();
    formData.append('passport_document', cvFile);

    const res = await clientApi.patch('api/candidate/profile/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (res.status === 200 || res.status === 204) {
      return {
        success: true,
        message: "Successfully updated CV",
        data: res.data
      };
    }

    return {
      success: false,
      message: "Failed to update CV"
    };
  } catch (error: any) {
    console.error("CV update error:", error);

    // Authentication errors
    if (error.response?.status === 401 || error.response?.status === 403) {
      return {
        success: false,
        message: "Authentication credentials were not provided.",
        detail: error.response?.data?.detail || "Authentication credentials were not provided."
      };
    }

    // Validation errors (e.g., file too large, wrong format)
    if (error.response?.status === 400) {
      return {
        success: false,
        message: "Invalid file",
        detail: error.response?.data?.resume?.[0] || error.response?.data
      };
    }

    // Generic error
    return {
      success: false,
      message: error.response?.data?.message || "Failed to update CV",
      detail: error.response?.data
    };
  }
}



// Type definitions
export interface Interview {
  id: number;
  candidate_email: string;
  role_title: string;
  employer_email: string;
  time_slot_1: string;
  time_slot_2: string;
  time_slot_3: string;
  terms_and_conditions: boolean;
  created_at: string;
  updated_at: string;
  joining_link: string;
  mode: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'completed' | 'cancelled';
  candidate: number;
  role: number;
  employer: number;
}

export interface GetInterviewsResponse {
  success: boolean;
  message: string;
  data?: Interview[];
}

// Simple action to get candidate interviews
export async function get_candidate_interviews(): Promise<GetInterviewsResponse> {
  try {
    const res = await clientApi.get<Interview[]>('api/candidate/interview/');
    
    if (res.status === 200 || res.status === 201) {
      return {
        success: true,
        message: "Interviews fetched successfully",
        data: res.data
      };
    }
    
    return {
      success: false,
      message: "Failed to get interviews"
    };
    
  } catch (error: any) {
    // Unauthorized error
    if (error.response?.status === 401) {
      return {
        success: false,
        message: error.response?.data?.detail || "Authentication required"
      };
    }
    
    // Generic error
    return {
      success: false,
      message: error.response?.data?.detail || "Failed to get interviews"
    };
  }
}


// Type definitions
export interface JobOffer {
  id: number;
  candidate: number;
  candidate_email: string;
  role: number;
  role_title: string;
  employer: number;
  employer_email: string;
  job_title: number;
  job_title_name: string;
  proposed_start_date: string;
  additional_note: string;
  company_name: string | null;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface GetOffersResponse {
  success: boolean;
  message: string;
  data?: JobOffer[];
}

// Simple action to get candidate offers
export async function candidate_offers(): Promise<GetOffersResponse> {
  try {
    const res = await clientApi.get<JobOffer[]>('api/candidate/offer/');
    
    if (res.status === 200 || res.status === 201) {
      return {
        success: true,
        message: "Offers fetched successfully",
        data: res.data
      };
    }
    
    return {
      success: false,
      message: "Failed to get offers"
    };
    
  } catch (error: any) {
    // Unauthorized error
    if (error.response?.status === 401) {
      return {
        success: false,
        message: error.response?.data?.detail || "Authentication required"
      };
    }
    
    // Generic error
    return {
      success: false,
      message: error.response?.data?.detail || "Failed to get offers"
    };
  }
}