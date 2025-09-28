"use client";

import { ChangeEvent } from "react";

interface ManOptionProps {
  bu: string;
  type: string;
  id: string;
}

export default function ManOption({ bu, type, id }: ManOptionProps) {
  const handleManSelect = (e: ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    if (selectedValue) {
      window.location.href = selectedValue;
    }
  };

  return (
    <div className="py-4 bg-white rounded-md mb-4">
      <label
        htmlFor="man-select"
        className="block text-lg font-semibold text-gray-700 mb-2"
      >
        เลือกกิจกรรมด้านความปลอดภัย:
      </label>
      <select
        id="man-select"
        className="block w-full p-3 border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        onChange={handleManSelect}
        defaultValue=""
      >
        <option value="" className="text-gray-500">
          -- ตัวเลือกทั้งหมด --
        </option>
        <option
          value={`/Man/${bu}/Sot/${id}`}
          className="odd:bg-gray-100 even:bg-gray-200"
        >
          กิจกรรมความปลอดภัย SOT and VFL
        </option>
        <option
          value={`/Man/${bu}/Talk/${id}`}
          className="odd:bg-gray-100 even:bg-gray-200"
        >
          การพูดคุยกับพนักงาน / Talk
        </option>
        <option
          value={`/Man/${bu}/Toolbox/${id}`}
          className="odd:bg-gray-100 even:bg-gray-200"
        >
          การพูดคุยด้านความปลอดภัย Safety / Toolbox Talk
        </option>
        <option
          value={`/Man/${bu}/Coupon/${id}`}
          className="odd:bg-gray-100 even:bg-gray-200"
        >
          โทเคนสำหรับร้านอาหาร / Food Token
        </option>
        <option
          value={`/Man/${bu}/Meeting/${id}`}
          className="odd:bg-gray-100 even:bg-gray-200"
        >
          การมีส่วนร่วมในเซฟตี้มีทติ้ง / Safety Meeting
        </option>
        <option
          value={`/Man/${bu}/Alert/${id}`}
          className="odd:bg-gray-100 even:bg-gray-200"
        >
          ยืนยันการเข้าใจ Safety Alert / Safety Alert Acknowledgement
        </option>
        <option
          value={`/Man/${bu}/Training/${id}`}
          className="odd:bg-gray-100 even:bg-gray-200"
        >
          ประวัติการฝึกอบรม Training Course
        </option>
      </select>
    </div>
  );
}