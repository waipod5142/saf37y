"use client";

import { useState } from "react";
import { UseFormRegister, FieldValues } from "react-hook-form";
import { cn } from "@/lib/utils";

interface Choice {
  value: string;
  text: string;
  colorClass: string;
}

interface RadioButtonGroupProps {
  register: UseFormRegister<any>;
  questionName: string;
  handleRadioChange: (questionName: string, value: string) => void;
  choices: Choice[];
  className?: string;
}

export default function RadioButtonGroup({
  register,
  questionName,
  handleRadioChange,
  choices,
  className,
}: RadioButtonGroupProps) {
  const [selectedValue, setSelectedValue] = useState<string>("");

  const handleChange = (value: string) => {
    setSelectedValue(value);
    handleRadioChange(questionName, value);
  };

  // Add defensive checks for undefined register and empty choices
  if (!register || typeof register !== 'function') {
    return (
      <div className="p-4 bg-yellow-100 border border-yellow-400 rounded-md">
        <p className="text-yellow-800">Form is loading...</p>
      </div>
    );
  }

  if (!choices || choices.length === 0) {
    return (
      <div className="p-4 bg-red-100 border border-red-400 rounded-md">
        <p className="text-red-800">No choices available</p>
      </div>
    );
  }

  try {
    // Try to call register with a test name to see if it works
    const testRegister = register('test', { required: false });
    if (!testRegister) {
      return (
        <div className="p-4 bg-yellow-100 border border-yellow-400 rounded-md">
          <p className="text-yellow-800">Form is initializing...</p>
        </div>
      );
    }
  } catch (error) {
    return (
      <div className="p-4 bg-yellow-100 border border-yellow-400 rounded-md">
        <p className="text-yellow-800">Form is not ready yet...</p>
      </div>
    );
  }

  return (
    <div className={cn("flex", className)}>
      {choices.map((choice, index) => {
        let registerProps = {};
        try {
          registerProps = register(questionName, {
            required: "Please answer this question",
          });
        } catch (error) {
          console.error("Register error:", error);
          // Return a simple radio button without register
          return (
            <label key={index} className="flex-1 cursor-pointer">
              <input
                type="radio"
                value={choice.value}
                onChange={() => handleChange(choice.value)}
                className="sr-only"
              />
              <span
                className={cn(
                  "flex items-center justify-center px-4 py-3 font-semibold transition-all duration-300 min-h-full text-base text-white",
                  choice.colorClass,
                  index === 0 && "rounded-l-full",
                  index === choices.length - 1 && "rounded-r-full",
                  selectedValue === choice.value && "ring-4 ring-blue-500 ring-offset-1 ring-offset-gray-100 z-10 relative scale-105",
                  selectedValue && selectedValue !== choice.value && "opacity-60 scale-[99%]"
                )}
              >
                {choice.text}
              </span>
            </label>
          );
        }

        return (
          <label key={index} className="flex-1 cursor-pointer">
            <input
              type="radio"
              value={choice.value}
              {...registerProps}
              onChange={() => handleChange(choice.value)}
              className="sr-only"
            />
            <span
              className={cn(
                "flex items-center justify-center px-4 py-3 font-semibold transition-all duration-300 min-h-full text-base text-white",
                choice.colorClass,
                index === 0 && "rounded-l-full",
                index === choices.length - 1 && "rounded-r-full",
                selectedValue === choice.value && "ring-4 ring-blue-500 ring-offset-1 ring-offset-gray-100 z-10 relative scale-105",
                selectedValue && selectedValue !== choice.value && "opacity-60 scale-[99%]"
              )}
            >
              {choice.text}
            </span>
          </label>
        );
      })}
    </div>
  );
}