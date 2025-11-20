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
    if (selectedValue.includes("Mixertrainer")) {
      const passcode = prompt("กรุณาใส่ Passcode:");
      if (passcode === "456789") {
        window.location.href = selectedValue;
      } else {
        alert("รหัสผิด กรุณาใส่ใหม่");
      }
    } else {
      window.location.href = selectedValue;
    }
  };

  // Check if it's a Mixer or Plant type
  const isMixerType = [
    "mixer",
    "mixerweek",
    "mixertrainer",
    "mixertsm",
    "mixerphoto",
  ].includes(type);
  const isPlantType = [
    "plant",
    "plantweek",
    "plantmonth",
    "plantmaintenance",
    "planttalk",
    "plantstat",
    "plantaccess",
    "plantasset",
  ].includes(type);

  // Only show dropdown for specific machine types and bu must be "th"
  if (bu !== "th" || (!isMixerType && !isPlantType) || (!id.startsWith("C") && !id.startsWith("LOG"))) {
    return null;
  }

  return (
    <div className="py-4 bg-white rounded-md mb-4">
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

        {isMixerType && (
          <>
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
          </>
        )}

        {isPlantType && (
          <>
            <option
              value={`/Machine/${bu}/Plant/${id}`}
              className="odd:bg-gray-100 even:bg-gray-200"
            >
              แบบตรวจหน่วยผลิตคอนกรีตประจำวัน
            </option>
            <option
              value={`/Machine/${bu}/Plantweek/${id}`}
              className="odd:bg-gray-100 even:bg-gray-200"
            >
              แบบตรวจหน่วยผลิตคอนกรีตประจำสัปดาห์
            </option>
            <option
              value={`/Machine/${bu}/Plantmonth/${id}`}
              className="odd:bg-gray-100 even:bg-gray-200"
            >
              แบบตรวจหน่วยผลิตคอนกรีตประจำเดือน
            </option>
            <option
              value={`/Machine/${bu}/Plantmaintenance/${id}`}
              className="odd:bg-gray-100 even:bg-gray-200"
            >
              แบบตรวจหน่วยผลิตคอนกรีตสำหรับช่าง
            </option>
            <option disabled>──────────────────────────────</option>
            <option
              value={`/Machine/${bu}/Planttalk/${id}`}
              className="odd:bg-gray-100 even:bg-gray-200"
            >
              Safety Talk แบบการสื่อสารความปลอดภัย
            </option>
            <option
              value={`/Machine/${bu}/Plantstat/${id}`}
              className="odd:bg-gray-100 even:bg-gray-200"
            >
              Safety Statistics แบบยืนยันการลงสถิติอุบัติตอนเช้า
            </option>
            <option
              value={`/Machine/${bu}/Plantaccess/${id}`}
              className="odd:bg-gray-100 even:bg-gray-200"
            >
              Visitor Plant Access Control แบบบันทึกการเข้าออกหน่วยผลิต
            </option>
            <option
              value={`/Machine/${bu}/Plantasset/${id}`}
              className="odd:bg-gray-100 even:bg-gray-200"
            >
              Plant Asset ทรัพย์สินของ Plant ในการตรวจนับประจำปี
            </option>
          </>
        )}
      </select>
    </div>
  );
}
