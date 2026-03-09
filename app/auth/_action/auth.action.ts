"use server";

import { cookies } from "next/headers";
import axios from "axios";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://37.27.113.235:6767/";

type AuthResponse = Record<string, any>;

type ActionResult = {
  success: boolean;
  message: string;
  data: {
    id: number;
    email: string;
    role: string;
    onboarding: boolean;
  } | null;
};



const extractAccessToken = (data: any): string | null => {
  let raw = data?.access ?? data?.token ?? data?.access_token ?? data?.key ?? data?.jwt ?? data?.accessToken ?? null;
  if (!raw) return null;

 
  if (typeof raw === 'object' && raw !== null) {
    console.warn('⚠ extractAccessToken: token field is an object, extracting nested access/token field');
    raw = raw.access ?? raw.token ?? raw.access_token ?? null;
    if (!raw || typeof raw !== 'string') return null;
  }

  const str = String(raw).trim();
  if (str.startsWith('Token ') || str.startsWith('Bearer ')) {
    return str.split(' ')[1] ?? null;
  }
  return str;
};

const extractRefreshToken = (data: any): string | null =>
  data?.refresh ?? data?.refresh_token ?? data?.refreshToken ?? null;

const extractUser = (data: any) => {
  const u = data?.user?.user ?? data?.user ?? data?.data ?? data;
  return {
    id:         u?.id ?? data?.user_id ?? null,
    email:      u?.email ?? "",
    role:       u?.role ?? u?.user_type ?? u?.account_type ?? "employer", // ✅ API se
    onboarding: u?.onboarding_state ?? u?.onboarding ?? false,
  };
};




const setCookies = async (data: any) => {
  const cookieStore = await cookies();
  const accessToken  = extractAccessToken(data);
  const refreshToken = extractRefreshToken(data);
  const userObj      = extractUser(data);

  
  console.log(" setCookies — raw data keys:", Object.keys(data));
  console.log(" setCookies — extracted accessToken:", JSON.stringify(accessToken));
  console.log(" setCookies — token length:", accessToken?.length ?? 0);

  if (accessToken) {
   
    const cleanToken = accessToken.replace(/\s+/g, '');
    cookieStore.set("access-token", cleanToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    console.log(" setCookies — stored clean token (first 20):", cleanToken.slice(0, 20));
  }

  if (refreshToken) {
    cookieStore.set("refresh-token", refreshToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
  }

  cookieStore.set("user-info", JSON.stringify(userObj), {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return userObj;
};



const getFirstError = (errorData: any): string => {
  const fields = [
    "email", "password", "password1", "password2", "name",
    "role", "non_field_errors", "detail", "message",
  ];
  for (const field of fields) {
    if (errorData[field]) {
      const error = Array.isArray(errorData[field]) ? errorData[field][0] : errorData[field];
      return typeof error === "string" ? error : JSON.stringify(error);
    }
  }
  if (typeof errorData === "string") return errorData;
  return "An error occurred. Please try again.";
};

const formatErrorMessage = (error: string, isLogin: boolean = false): string => {
  const errorMap: Record<string, string> = {
    "This field is required.": "Please fill in all required fields.",
    "Email already exists.": "This email is already registered. Try logging in instead.",
    "user with this email already exists.": "This email is already registered. Try logging in instead.",
    "A user with that email already exists.": "This email is already registered. Try logging in instead.",
    "Invalid credentials.": "Invalid email or password. Please try again.",
    "No active account found with the given credentials.": "Invalid email or password. Please try again.",
    "Unable to log in with provided credentials.": "Invalid email or password. Please try again.",
    "This field may not be blank.": "Please fill in all required fields.",
    "Enter a valid email address.": "Please enter a valid email address.",
    "This password is too short. It must contain at least 8 characters.": "Password must be at least 8 characters long.",
    "This password is too common.": "Please choose a stronger password.",
    "This password is entirely numeric.": "Password cannot be entirely numeric.",
  };

  const normalizedError = error.trim();

  if (normalizedError.includes("not a valid choice") || normalizedError.toLowerCase().includes("invalid role"))
    return "Please select a valid role (student or teacher).";

  if (normalizedError.toLowerCase().includes("password")) {
    if (normalizedError.includes("too short") || normalizedError.includes("at least"))
      return "Password must be at least 8 characters long.";
    if (normalizedError.includes("too common")) return "Please choose a stronger password.";
    if (normalizedError.includes("entirely numeric")) return "Password cannot be entirely numeric.";
    if (normalizedError.includes("too similar")) return "Password is too similar to your email.";
  }

  if (normalizedError.toLowerCase().includes("email")) {
    if (normalizedError.includes("valid email") || normalizedError.includes("Enter a valid"))
      return "Please enter a valid email address.";
  }

  return errorMap[normalizedError] || error;
};

const handleAxiosError = (error: any, isLogin = false): ActionResult => {
  console.error("Auth error:", {
    message: error.message,
    response: error.response?.data,
    status: error.response?.status,
    code: error.code,
  });

  if (error.response?.data)
    return { success: false, message: formatErrorMessage(getFirstError(error.response.data), isLogin), data: null };

  if (error.request) {
    if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT")
      return { success: false, message: "Request timed out. Please try again.", data: null };
    if (error.code === "ERR_NETWORK" || error.code === "ECONNREFUSED")
      return { success: false, message: "Unable to reach the server. Please check your internet connection.", data: null };
    return { success: false, message: "Network error. Please check your connection and try again.", data: null };
  }

  return { success: false, message: "An unexpected error occurred. Please try again.", data: null };
};



export async function loginAction(payload: {
  email: string;
  password: string;
}): Promise<ActionResult> {
  try {
    const formData = new URLSearchParams();
    formData.append("email", payload.email);
    formData.append("password", payload.password);

   const { data } = await axios.post(
  `${API_URL}accounts/login/`,
  formData,
  {
    timeout: 15000,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  }
);


const token = extractAccessToken(data);

let profileData = null;

if (token) {
  const profileRes = await axios.get(
    `${API_URL}accounts/me/`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  console.log("PROFILE RESPONSE:", profileRes.data);

  profileData = profileRes.data;
}

const finalData = {
  ...data,
  user: profileData,
};

console.log(" Login API raw response:", JSON.stringify(finalData));

const userObj = await setCookies(finalData);

    return {
      success: true,
      message: "Login successful! Redirecting...",
      data: userObj,
    };
  } catch (error: any) {
    return handleAxiosError(error, true);
  }
}



export async function signupAction(payload: {
  email: string;
  password: string;
  name?: string;
  role: string;
}): Promise<ActionResult> {
  try {
    const registerForm = new URLSearchParams();
    registerForm.append("email", payload.email);
    registerForm.append("name", payload.name ?? "");
    registerForm.append("password", payload.password);
    registerForm.append("password2", payload.password);

    await axios.post(
      `${API_URL}accounts/register/`,
      registerForm,
      {
        timeout: 15000,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );


    const loginForm = new URLSearchParams();
    loginForm.append("email", payload.email);
    loginForm.append("password", payload.password);

    const { data } = await axios.post(
      `${API_URL}accounts/login/`,
      loginForm,
      {
        timeout: 15000,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );

 const token = extractAccessToken(data);

let profileData = null;

if (token) {
  const profileRes = await axios.get(
    `${API_URL}accounts/me/`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  profileData = profileRes.data;
}

const finalData = {
  ...data,
  user: profileData,
};

const userObj = await setCookies(finalData);

    return {
      success: true,
      message: "Account created successfully! Welcome aboard.",
      data: userObj,
    };
  } catch (error: any) {
    return handleAxiosError(error, false);
  }
}



export async function logoutAction(): Promise<{ success: boolean }> {
  const cookieStore = await cookies();
  cookieStore.delete("access-token");
  cookieStore.delete("refresh-token");
  cookieStore.delete("user-info");
  return { success: true };
}


export async function getAccessTokenAction(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("access-token")?.value ?? null;
}



export async function update_User_info() {
  try {
    const cookieStore = await cookies();
    const userInfoCookie = cookieStore.get("user-info")?.value;

    if (!userInfoCookie) return { success: false, message: "User info not found" };

    const updatedUserInfo = { ...JSON.parse(userInfoCookie), onboarding: true };

    cookieStore.set("user-info", JSON.stringify(updatedUserInfo), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return { success: true, message: "Onboarding completed successfully", data: updatedUserInfo };
  } catch (error) {
    console.error("Error updating user info:", error);
    return { success: false, message: "Failed to update user info" };
  }
}