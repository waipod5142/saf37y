"use client";

import { useEffect, use } from "react";

export default function ManCatchAllPage({
  params,
}: {
  params: Promise<{ segments: string[] }>;
}) {
  const { segments } = use(params);

  useEffect(() => {
    // The last segment is the employee ID
    const id = segments[segments.length - 1];
    const decodedId = decodeURIComponent(id);
    window.location.href = `https://sccc-inseesafety-prod.web.app/profile/${decodedId}`;
  }, [segments]);

  return (
    <div className="max-w-4xl mx-auto p-8 text-center">
      <p>Redirecting to legacy system...</p>
    </div>
  );
}
