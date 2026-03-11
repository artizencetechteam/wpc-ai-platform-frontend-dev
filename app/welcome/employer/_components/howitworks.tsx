"use client";
import Logo from "@/components/logo";
import { useRouter } from "next/navigation";
import { useState } from "react";

const workingData = [
    {
        heading: "Create your employer profile",
        explanation:
            "Add your company details—we check your licence status automatically.",
    },
    {
        heading: "Post a role in minutes",
        explanation:
            "Select a SOC code or job title. The system auto-generates a compliant job description, salary range, and skill criteria, which you can edit if needed.",
    },
    {
        heading: "Get matched with the right candidates",
        explanation:
            "We match you with sponsor-ready candidates based on skills, experience, and visa status.",
    },
    {
        heading: "Interview and shortlist in one place",
        explanation:
            "Book interviews directly. Our AI transcribes the call and summarizes key notes for your hiring team.",
    },
    {
        heading: "Make offers and hire confidently",
        explanation:
            "Generate offer letters and confirm hires—you only pay when a candidate accepts.",
    },
    {
        heading: "Automated onboarding",
        explanation:
            "The system instantly generates the Offer Letter, Employment Contract, and the 'CoS Data Pack' for your SMS.",
    },
    {
        heading: "Sponsorship support",
        explanation:
            "We assist with CoS data, sponsor processes, and switching sponsorship where required.",
    },
    {
        heading: "Zero-Risk Hire",
        explanation:
            "Make an offer through the platform. You only pay your fixed success fee once the candidate accepts.",
    },
    {
        heading: "Stay compliant after hire",
        explanation:
            "Ongoing support available for sponsor record keeping duties, visa monitoring, HR compliance (WPC HRMS tools), and audits.",
    },
];


const HowitWorks = ({ setIsIntro }) => {
    const [workings, setWorkings] = useState(workingData);
    const router = useRouter();
    return (
        <div>
            <div className="h-270"></div>
            <div className="w-full max-w-[540px] bg-white rounded-[14px] shadow-[0_12px_40px_rgba(14,58,128,0.12)] px-8.75 py-10 mt-[200px]">
                <Logo className="object-contain h-40 w-48.75 mb-2" fontSize={20} />
                <div className="flex flex-col gap-2 font-inter py-2 border-b-2 border-[#C8CED5]">
                    <h1 className="text-[20px] lg:text-[22px] xl:text-[26px] 2xl:text-[30px] font-semibold">
                        How does WPC AI work?
                    </h1>

                    <div className="flex flex-col items-center justify-center gap-3 mt-4">
                        {workings.map((item, index) => (
                            <div
                                key={index}
                                className="
    w-full
    border border-[#E4E4E4]
    bg-white
    rounded-lg
    px-4 py-3
    transition-all duration-300 ease-out
    hover:bg-gray-50
    hover:border-[#0A65CC]/90
    hover:scale-[1.03]
  "
                            >
                                <div className="flex items-start gap-3 px-4 py-3.5">
                                    <div className="flex flex-col gap-[2px]">
                                        <h3 className="font-inter font-medium text-[#010101] text-[15px] lg:text-[16px] 2xl:text-[18px]">
                                            {item.heading}
                                        </h3>

                                        <p className="font-sans text-[#424242] text-[14px] lg:text-[14px] 2xl:text-[16px]">
                                            {item.explanation}
                                        </p>
                                    </div>
                                </div>
                            </div>

                        ))}
                    </div>

                </div>

                <div className="w-full flex items-center justify-between pt-4">
                    <button
                        onClick={() => setIsIntro(true)}
                        className="bg-white border border-[#0A65CC] text-[#0A65CC] rounded-lg font-semibold py-3 px-9 hover:bg-blue-50"
                    >
                        Go Back
                    </button>

                    <button className="bg-[#0852C9] hover:bg-[#0852C9]/90 text-white rounded-lg font-semibold py-3 px-9"onClick={()=>{
                        router.push("/auth/employer/login")
                    }}>
                        Get Started
                    </button>
                </div>
            </div>
            <div className="h-30"></div>
        </div>
    );
};

export default HowitWorks;
