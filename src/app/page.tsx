'use client';
import React, { useState } from 'react';
import { Step } from './types';
import { StepBar } from './_components/StepBar';
export default function Home() {
  const [step, setStep] = useState<Step>(1);
  const [images, setImages] = useState<File[]>([]);
  const isStep1Valid = images.length > 0;
  // const canGoNext = step === 1 ? isStep1Valid : true;
  const handleNext = () => {
    // if (!canGoNext) return;
    if (step < 4) setStep((prev) => (prev + 1) as Step);
  };
  const handleBack = () => {
    if (step > 1) setStep((prev) => (prev - 1) as Step);
  };
  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-start bg-[#f4f6fb] p-6 border border-solid border-[#dfe4ee] rounded-2xl">
      <div className="min-h-screen w-full flex flex-col items-center justify-start bg-[#f4f6fb] p-6 border border-solid border-[#dfe4ee] rounded-2xl">
        <StepBar currentStep={step} canNavigate={true} onStepClick={setStep} />
        <div className="p-7 w-full rounded-2xl flex flex-col gap-5 border border-solid border-[#dfe4ee] bg-[#ffffff]">
          {step === 1 && (
            <div className="flex flex-col">
              <p className="text-[44px] text-[#1d2433] font-bold">
                Step 1: Add your photos
              </p>
              {/* <content orno iishee/> */}
            </div>
          )}
          {step === 2 && (
            <div className="flex flex-col">
              <p className="text-[44px] text-[#1d2433] font-bold">
                Step 2: Tell the model what each photo is
              </p>
              {/* <content orno iishee/> */}
            </div>
          )}
          {step === 3 && (
            <div className="flex flex-col">
              <p className="text-[44px] text-[#1d2433] font-bold">
                Step 3: Train the model
              </p>
              {/* <content orno iishee/> */}
            </div>
          )}
          {step === 4 && (
            <div className="flex flex-col">
              <p className="text-[44px] text-[#1d2433] font-bold">
                Step 4: Test with new photos
              </p>
              {/* <content orno iishee/> */}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
