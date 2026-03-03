'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { MapPin, XCircle } from 'lucide-react';
import { useOnboardingStore } from '@/app/store/onboardingStore';


interface BasicInfoForm {
  uk_postcode: string;
  uk_street: string;
  uk_city: string;
  current_position: string;
  soc_code: string;
  position_start_date: string;
}

export default function UKAndBasicInfoStep() {
  const { formData, updateFormData, nextStep, previousStep } = useOnboardingStore();

  const [answeredUK, setAnsweredUK] = useState<boolean | null>(
    formData.is_in_uk ?? null
  );
  const [showError, setShowError] = useState(false);

  const { register, handleSubmit, formState: { errors } } =
    useForm<BasicInfoForm>({
      defaultValues: {
        uk_postcode: formData.uk_postcode || '',
        uk_street: formData.uk_street || '',
        uk_city: formData.uk_city || '',
        current_position: formData.current_position || '',
        soc_code: formData.soc_code || '',
        position_start_date: formData.position_start_date || '',
      },
    });

  const handleYes = () => {
    updateFormData({ is_in_uk: true });
    setAnsweredUK(true);
    setShowError(false);
  };

  const handleNo = () => {
    updateFormData({ is_in_uk: false });
    setAnsweredUK(false);
    setShowError(true);
  };

  const handleBackToQuestion = () => {
    setAnsweredUK(null);
    setShowError(false);
    updateFormData({ is_in_uk: null });
  };

  const onSubmit = (data: BasicInfoForm) => {
    updateFormData({
      ...data,
      is_in_uk: true,
    });
    nextStep();
  };

  useEffect(()=>{
      setAnsweredUK(formData.is_in_uk ?? false);
  },[]);

  return (
    <div className="flex items-start justify-center min-h-[calc(100vh-200px)] py-8 font-inter">
      <div className="max-w-155 w-full flex flex-col items-center">

        <div className='max-w-140'>
          {!showError && <div className='w-full flex flex-col items-center gap-5'>

            <div className='bg-[#EBF3FF] rounded-full w-18 h-18 flex justify-center items-center px-4.5 py-4.25 text-[25px] text-[#0852C9]'>

              <MapPin className='w-full h-full' />
            </div>

            <div>

              <h2 className="text-[22px] lg:text-[28px] 2xl:text-[30px] font-bold text-[#111] mb-1 text-center">
                Are you currently in the UK?
              </h2>
              <p className="text-[15px] md:text-[18px] lg:text-[22px] text-[#4D4D4D] mb-2 text-center">
                WPC Jobs supports candidates residing within the United Kingdom
              </p>
            </div>

            <div className="w-full flex flex-row-reverse justify-between gap-4 mb-6">
              <button
                onClick={handleYes}
                disabled={answeredUK || false}
                className="md:max-w-50 h-14 flex-1 bg-[#0852C9] text-white py-3.5 rounded-[9px] font-semibold hover:bg-[#0852C9]/90"
              >
                Yes
              </button>

              <button
                onClick={handleNo}
                disabled={answeredUK || false}
                className="md:max-w-50 h-14 flex-1 bg-white border border-[#D0D0D0] text-[#515151] py-3.5 rounded-[9px] font-semibold hover:bg-blue-50"
              >
                No
              </button>
            </div>
          </div>}

          {showError && (
            <div className='w-full flex flex-col items-center gap-5'>

            <div className='bg-[#FFD0D0] rounded-full w-18 h-18 flex justify-center items-center px-4.5 py-4.25 text-[25px] text-[#FF2A2A]'>

              X
            </div>

            <div>

              <h2 className="text-[22px] lg:text-[28px] 2xl:text-[30px] font-bold text-[#111] mb-1 text-center">
                Unable to Proceed
              </h2>
              <p className="text-[15px] md:text-[18px] lg:text-[22px] text-[#4D4D4D] mb-2 text-center">
                UK Residency Required
              </p>
              <p className="text-[15px] md:text-[18px] lg:text-[22px] text-[#4D4D4D] mb-2 text-center">
                WPC Jobs currently only supports candidates residing within the UK. We are unable to proceed with your application at this time.
              </p>
            </div>

            <div className="w-full border border-[#D9DFE8] rounded-[9px] bg-[#FFFFFF] px-4.5 py-4.25">

              <p className="text-[15px] md:text-[18px] text-[#3E3E3E]">
                If you believe this is an error or you{"'"}re planning to relocate to the UK, please contact our support team for assistance.
              </p>
              
            </div>
              <button
                onClick={handleBackToQuestion}
                className="w-full h-14 bg-[#0852C9] text-white py-3.5 rounded-[9px] font-semibold hover:bg-[#0852C9]/90"
              >
                Back
              </button>
          </div>
          )}
        </div>

        {answeredUK === true && (
          <div className='w-full bg-white rounded-[14px] shadow-sm shadow-[#0E3A801F] p-8'>
            <h2 className="text-[22px] lg:text-[28px] 2xl:text-[30px] font-bold text-[#111] text-left">
              Current UK Address
            </h2>
            <p className="text-[15px] md:text-[18px] lg:text-[22px] text-[#4D4D4D] mb-3 text-left">
              Please enter your personal details
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              

              <div>
                <label className="block text-[18px] text-[#111111] font-medium mb-2">
                  Street Address
                </label>
                <input
                  {...register('uk_street', { required: 'Street address is required' })}
                  placeholder='Address'
                   className="w-full px-4 py-3 border border-[#E8E4ED] text-[#383838] text-[16px] rounded-lg focus:ring-2 focus:ring-[#0852C9] focus:outline-0"
                />
                {errors.uk_street && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.uk_street.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[18px] text-[#111111] font-medium mb-2">City</label>
                <select
                  {...register('uk_city', { required: 'City is required' })}
                   className="w-full px-4 py-3 border border-[#E8E4ED] text-[#383838] text-[16px] rounded-lg focus:ring-2 focus:ring-[#0852C9] focus:outline-0"
                  defaultValue=""
                >
                  <option value="" disabled>Select a city</option>
                  {uk_cities.map(city => (
                    <option key={city.code} value={city.code}>
                      {city.name}
                    </option>
                  ))}
                </select>
                {errors.uk_city && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.uk_city.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-[18px] text-[#111111] font-medium mb-2">Post Code</label>
                <input
                  {...register('uk_postcode', { required: 'Post code is required' })}
                  placeholder='Post Code'
                  className="w-full px-4 py-3 border border-[#E8E4ED] text-[#383838] text-[16px] rounded-lg focus:ring-2 focus:ring-[#0852C9] focus:outline-0"
                />
                {errors.uk_postcode && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.uk_postcode.message}
                  </p>
                )}
              </div>

              <div className="flex justify-between gap-4 pt-6">
                <button
                  type="button"
                  onClick={previousStep}
                  className="flex-1 border border-[#0A65CC]  text-[#0A65CC] max-w-[200px] py-4 text-[16px] lg:text-[18px] rounded-lg font-semibold"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-primary text-white max-w-[200px] py-4 text-[16px] lg:text-[18px] rounded-lg font-semibold"
                >
                  Continue
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}