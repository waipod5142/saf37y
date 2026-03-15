"use client";

import { useEffect } from "react";

export default function TransactionRedirect() {
  useEffect(() => {
    window.location.href = "https://report-safetypassport.web.app/";
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-8 text-center">
      <p>Redirecting to reports system...</p>
    </div>
  );
}
