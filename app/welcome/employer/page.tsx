"use client";

import Logo from "@/components/logo";
import { useState } from "react";
import { TiTick } from "react-icons/ti";
import HowitWorks from "./_components/howitworks";
import { useRouter } from "next/navigation";

const Employer = () => {
  const [isIntro, setIsIntro] = useState(true);
  const router = useRouter();

  return isIntro ? (
    <div className="w-full max-w-[440px] bg-white rounded-[14px] shadow-[0_12px_40px_rgba(14,58,128,0.12)] pt-[32px] pr-[32px] pb-[32px] pl-[32px]">

      <Logo className="object-contain h-32 w-40 mb-3" fontSize={18} />

      <div className="flex flex-col gap-3 font-inter py-3 border-b-2 border-[#C8CED5]">
        <h1 className="text-[19px] font-semibold">
          Welcome to WPC Jobs
        </h1>

        <p className="text-[#4D4D4D] text-[13px] leading-relaxed">
          WPC Jobs helps licensed sponsors hire, onboard, and remain compliant—without upfront recruitment risk.
        </p>

        <p className="text-[#4D4D4D] text-[13px] leading-relaxed">
          You{"'"}ll be guided through a short setup so we can:
        </p>

        <ul className="flex flex-col gap-2">
          {[
            "Verify your sponsor licence",
            "Understand your hiring needs",
            "Match you with suitable, sponsor-ready candidates",
          ].map((text) => (
            <li
              key={text}
              className="flex items-center gap-2 text-[#4D4D4D] text-[13px]"
            >
              <span className="text-[#33951A] rounded-full border border-[#33951A] p-[2px] flex-shrink-0">
                <TiTick size={14} />
              </span>
              {text}
            </li>
          ))}
        </ul>
      </div>

      <div className="w-full flex items-center justify-between gap-3 pt-5">
        <button
          onClick={() => setIsIntro(false)}
          className="bg-white border border-[#0A65CC] text-[#0A65CC] rounded-lg font-semibold py-2.5 px-6 hover:bg-blue-50 text-[13px]"
        >
          How it work
        </button>

        <button className="bg-white text-[#0852C9] border border-[#0852C9] rounded-lg font-semibold py-2.5 px-7 text-[13px]" onClick={()=>{
          router.push("/")
        }}>
          Back
        </button>
        <button className="bg-[#0852C9] hover:bg-[#0852C9]/90 text-white rounded-lg font-semibold py-2.5 px-7 text-[13px]" onClick={()=>{
          router.push("/auth/employer/login")
        }}>
          Continue
        </button>
      </div>

    </div>
  ) : (
    <HowitWorks setIsIntro={setIsIntro} />
  );
};

export default Employer;