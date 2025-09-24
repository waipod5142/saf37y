"use client";

import { ChangeEvent } from "react";

interface MachineOptionProps {
  bu: string;
  type: string;
  id: string;
}

export default function MachineOption({ bu, type, id }: MachineOptionProps) {
  const handleMachineSelect = (e: ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    if (selectedValue.includes('Mixertrainer')) {
      const passcode = prompt('กรุณาใส่ Passcode:');
      if (passcode === '456789') {
        window.location.href = selectedValue;
      } else {
        alert('รหัสผิด กรุณาใส่ใหม่');
      }
    } else {
      window.location.href = selectedValue;
    }
  };

  // Only show dropdown for rmx business unit with specific machine types
  if (!['Mixer', 'Mixerweek', 'Mixertrainer', 'Mixertsm', 'Mixerphoto'].includes(type)) {
    return null;
  }

  return (
    <div className="px-4 py-4 bg-white rounded-md mb-4">
      <label
        htmlFor="machine-select"
        className="block text-lg font-semibold text-gray-700 mb-2"
      >
        เลือกแบบฟอร์มการตรวจ:
      </label>
      <select
        id="machine-select"
        className="block w-full p-3 border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        onChange={handleMachineSelect}
        defaultValue=""
      >
        <option value="" className="text-gray-500">
          -- ตัวเลือกทั้งหมด --
        </option>
        <option
          value={`/Machine/${bu}/Mixer/${id}`}
          className="odd:bg-gray-100 even:bg-gray-200"
        >
          แบบตรวจเช็ครถโม่ก่อนใช้งานประจำวัน
        </option>
        <option
          value={`/Machine/${bu}/Mixerweek/${id}`}
          className="odd:bg-gray-100 even:bg-gray-200"
        >
          แบบตรวจเช็ครถโม่ก่อนใช้งานประจำสัปดาห์
        </option>
        <option
          value={`/Machine/${bu}/Mixertrainer/${id}`}
          className="odd:bg-gray-100 even:bg-gray-200"
        >
          แบบตรวจเช็ครถโม่สำหรับครูฝึกอบรม SCCO
        </option>
        <option
          value={`/Machine/${bu}/Mixertsm/${id}`}
          className="odd:bg-gray-100 even:bg-gray-200"
        >
          แบบตรวจเช็ครถโม่สำหรับ TSM ของ ผจส
        </option>
        <option
          value={`/Machine/${bu}/Mixerphoto/${id}`}
          className="odd:bg-gray-100 even:bg-gray-200"
        >
          แบบถ่ายรูปรถโม่ 4 ด้าน
        </option>
      </select>
    </div>
  );
}