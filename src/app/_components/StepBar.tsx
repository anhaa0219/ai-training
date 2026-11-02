'use client';

import { Step, StepItem } from '../types';
const STEPS: StepItem[] = [
  { id: 1, label: 'Upload' },
  { id: 2, label: 'Label' },
  { id: 3, label: 'Train' },
  { id: 4, label: 'Test' },
];
interface StepHeaderProps {
  currentStep: Step;
  canNavigate: boolean;
  onStepClick: (step: Step) => void;
}
export const StepBar = ({
  currentStep,
  canNavigate,
  onStepClick,
}: StepHeaderProps) => {
  return (
    <div className="flex justify-around w-full items-center mb-8 px-4">
      {STEPS.map((result) => {
        const isActive = currentStep === result.id;
        const isDone = currentStep >= result.id;
        return (
          <div
            key={result.id}
            className="flex flex-col justify-center items-center"
          >
            <div
              onClick={() => {
                if (result.id <= currentStep || canNavigate) {
                  onStepClick(result.id);
                }
              }}
              className={`flex w-10 h-10 rounded-full border-2 border-solid font-sans text-[18px] font-semibold justify-center items-center cursor-pointer ${isActive ? 'bg-[#3b5bdb] text-white ' : isDone ? 'bg-[#e7ecfd] border-[#3b5bdb]' : 'border-[#dfe4ee] bg-[#ffffff] text-[#5d6779]'}`}
            >
              {result.id}
            </div>
            <div className="font-sans text-[15px] font-bold">
              {result.label}
            </div>
          </div>
        );
      })}
    </div>
  );
};
