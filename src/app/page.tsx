"use client"
import { Source_Serif_4 } from "next/font/google";
import { StepBar } from "./_components/StepBar";
import { useState } from "react";

export default function Home() {
  const [step,setStep] = useState(1);
  return (
    <main className="h-screen w-full flex flex-col justify-center bg-[#f4f6fb] p-6">
      <div className="border-2 border-solid border-[#dfe4ee] p-4 rounded-lg">
        <div className="flex w-full justify-around">
          <StepBar number = {1} label="Upload"/>
          <StepBar number = {2} label="Label"/>
          <StepBar number = {3} label="Train"/>
          <StepBar number = {4} label="Test"/>
        </div>
        
        </div>
       
    </main>
  );
}