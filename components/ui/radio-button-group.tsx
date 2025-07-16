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

  return (
    <div className={cn("flex", className)}>
      {choices.map((choice, index) => (
        <label key={index} className="flex-1 cursor-pointer">
          <input
            type="radio"
            value={choice.value}
            {...register(questionName, {
              required: "Please answer this question",
            })}
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
      ))}
    </div>
  );
}