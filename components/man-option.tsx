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
        {bu === "vn"
          ? "Chọn hoạt động an toàn:"
          : "เลือกกิจกรรมด้านความปลอดภัย:"}
      </label>
      <select
        id="man-select"
        className="block w-full p-3 border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        onChange={handleManSelect}
        defaultValue=""
      >
        <option value="" className="text-gray-500">
          {bu === "vn" ? "-- Tất cả các tùy chọn --" : "-- ตัวเลือกทั้งหมด --"}
        </option>

        {/* Options for TH business unit */}
        {bu === "th" && (
          <>
            <option value={`/Man/${bu}/Sot/${id}`}>
              กิจกรรมความปลอดภัย SOT and VFL
            </option>
            <option value={`/Man/${bu}/Talk/${id}`}>
              การพูดคุยกับพนักงาน / Talk
            </option>
            <option value={`/Man/${bu}/Toolbox/${id}`}>
              การพูดคุยด้านความปลอดภัย Safety / Toolbox Talk
            </option>
            <option value={`/Man/${bu}/Meeting/${id}`}>
              การมีส่วนร่วมในเซฟตี้มีทติ้ง / Safety Meeting
            </option>
            <option value={`/Man/${bu}/Alert/${id}`}>
              ยืนยันการเข้าใจ Safety Alert / Safety Alert Acknowledgement
            </option>
            <option value={`/Man/${bu}/Training/${id}`}>
              ประวัติการฝึกอบรม Training Course
            </option>
          </>
        )}

        {/* Options for VN business unit */}
        {bu === "vn" && (
          <>
            <option value={`/Man/${bu}/Toolbox/${id}`}>
              Thảo luận an toàn / Toolbox Talk
            </option>
            <option value={`/Man/${bu}/Boot/${id}`}>
              Danh sách kiểm tra hạng mục An toàn / BOOT ON THE GROUND CHECK
              LIST
            </option>
            <option value={`/Man/${bu}/Pra/${id}`}>
              Đánh giá rủi ro cá nhân / Personal Risk Assessment
            </option>
            <option value={`/Man/${bu}/Alert/${id}`}>
              Cảnh báo an toàn / Safety Alert
            </option>
            <option disabled>──────────────────────────────</option>
            <option value={`/Man/${bu}/Ra/${id}`}>
              Danh sách kiểm tra đánh giá / Risk Assessmen Checklist
            </option>
            <option value={`/Man/${bu}/Pto/${id}`}>
              Quan sát công việc theo kế hoạch / Planned Task Observation
            </option>
          </>
        )}
      </select>
    </div>
  );
}
