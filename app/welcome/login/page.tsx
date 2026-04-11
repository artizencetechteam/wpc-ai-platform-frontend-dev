"use client";
import Logo from "@/components/logo";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { MdMail } from "react-icons/md";
import { CgLock } from "react-icons/cg";
import { BiUser } from "react-icons/bi";
import { LuBuilding2 } from "react-icons/lu";

export default function Login() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loginType, setLoginType] = useState<"candidate" | "employer" | "">("");

    const handleLogin = (e: any) => {
        e.preventDefault();
        console.log({ email, password, loginType });
    };


    return (
        <div className="w-full max-w-[540px] bg-white rounded-[14px] shadow-[0_12px_40px_rgba(14,58,128,0.12)] px-8.75 py-10 mx-auto mt-20">

            <Logo className="object-contain h-40 w-48.75 mb-2" fontSize={20} />

            <div className="text-center mb-8">
                <h1 className="text-[24px] lg:text-[26px] 2xl:text-[30px] font-semibold">
                    Welcome Back
                </h1>
                <p className="text-[#4D4D4D] mt-1">Sign in to your account</p>
            </div>

            <form onSubmit={handleLogin} className="flex flex-col gap-3">
                <div className="flex flex-col items-start gap-1 w-full">

                    <label htmlFor="" className="text-[#111111] font-inter font-medium text-[15px] lg:text-[17px] 2xl:text-[19px]">Email Address</label>
                    <div className="relative w-full">
                        <input
                            type="email"
                            placeholder="Enter email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full border-2 border-[#D0D5DD] rounded-[9px] shadow-sm shadow-[#1018280D] text-[#667085] text-[15px] md:text-[16px] font-inter font-medium px-4 py-3.5 pl-10 focus:outline-0 focus:ring-2 focus:ring-[#0852C9]/90"
                            required
                        />
                        <MdMail className="absolute top-4 left-3 text-[#000000]" size={20} />
                    </div>
                </div>

                <div className="flex flex-col items-start gap-1 w-full">

                    <label htmlFor="" className="text-[#111111] font-inter font-medium text-[15px] lg:text-[17px] 2xl:text-[19px]">Password</label>

                    <div className="relative w-full">
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full border-2 border-[#D0D5DD] rounded-[9px] shadow-sm shadow-[#1018280D] text-[#667085] text-[15px] md:text-[16px] font-inter font-medium px-4 py-3.5 pl-10 focus:outline-0 focus:ring-2 focus:ring-[#0852C9]/90"
                            required
                        />
                        <CgLock className="absolute top-4 left-3 text-[#000000]" size={20} />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute top-4 right-3 text-[#000000]"
                        >
                            {showPassword ? <AiOutlineEyeInvisible size={20} /> : <AiOutlineEye size={20} />}
                        </button>
                    </div>
                </div>

                <p className="font-medium mb-1">I am a..</p>

                <div className="grid grid-cols-2 gap-4">
                    <button
                        type="button"
                        onClick={() => setLoginType("candidate")}
                        className={`border-2  rounded-[9.25px] flex flex-col items-center py-6 gap-3 hover:border-[#0852C9] ${loginType === "candidate" ? "border-[#0852C9] bg-[#0852C9]/10 font-medium" :"border-[#D0D5DD]"
                            }`}
                    >
                        <BiUser size={25} className="text-[#123EB7]" />
                        Candidate
                    </button>

                    <button
                        type="button"
                        onClick={() => setLoginType("employer")}
                        className={`border-2  rounded-[9.25px] flex flex-col items-center py-6 gap-3 hover:border-[#0852C9] ${loginType === "employer" ? "border-[#0852C9] bg-[#0852C9]/10 font-medium" :"border-[#D0D5DD]"                            }`}
                    >
                        <LuBuilding2 size={25} className="text-[#123EB7]" />
                        Employer
                    </button>
                </div>

                <button
                    type="submit"
                    className="w-full bg-[#0852C9] text-[16px] lg:text-[18px] text-[#FFFFFF] px-4 py-3.5 rounded-[9px] font-semibold hover:bg-[#0852C9]/90 hover:cursor-pointer transition"
                >
                    Secure Login
                </button>

                <button
                    type="button"
                    className="w-full bg-[#0852C9] text-[16px] lg:text-[18px] text-[#FFFFFF] px-4 py-3.5 rounded-[9px] font-semibold hover:bg-[#0852C9]/90 hover:cursor-pointer transition flex items-center justify-center gap-2"
                >
                    <img src="/google-logo.png" alt="Google" className="w-7 h-7" />
                    Continue With Google
                </button>

                {/* <div className="flex justify-between text-[15px] lg:text-[18px] text-[#0852C9] font-inter font-medium mt-1">
                    <button
                        type="button"
                        className="hover:underline"
                        onClick={()=>{
                            router.push("/welcome/forgot-password");
                        }}
                    >
                        Forgot Password?
                    </button>
                </div> */}

                <p className="text-center text-[15px] lg:text-[18px] text-[#1E1D1D] mt-1 border-t-2 border-[#8A8A8A]/90 pt-2">
                    Don{"'"}t have an account?{" "}
                    <button
                        type="button"
                        className="text-[#0852C9] hover:underline"
                        onClick={() => router.push("/employer/dashboard") }
                    >
                        Create Account
                    </button>
                </p>
            </form>
        </div>
    );
}
