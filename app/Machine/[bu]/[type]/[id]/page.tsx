"use client";

import { useEffect } from "react";

export default function MachinePage({
  params,
}: {
  params: { bu: string; type: string; id: string };
}) {
  useEffect(() => {
    // Decode the ID to handle special characters (including Thai characters)
    const decodedId = decodeURIComponent(params.id);

    // Redirect to the legacy system
    window.location.href = `https://sccc-inseesafety-prod.web.app/Machine/${decodedId}`;
  }, [params.id]);

  return (
    <div className="max-w-4xl mx-auto p-8 text-center">
      <p>Redirecting to legacy system...</p>
    </div>
  );
}
