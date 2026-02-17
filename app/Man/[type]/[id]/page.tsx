"use client";

import { useEffect, use } from "react";

export default function ManShortPage({
  params,
}: {
  params: Promise<{ type: string; id: string }>;
}) {
  const { id } = use(params);

  useEffect(() => {
    // Decode the ID to handle special characters (including Thai characters)
    const decodedId = decodeURIComponent(id);

    // Redirect all /Man/{type}/{id} pages to profile in the legacy system
    window.location.href = `https://sccc-inseesafety-prod.web.app/profile/${decodedId}`;
  }, [id]);

  return (
    <div className="max-w-4xl mx-auto p-8 text-center">
      <p>Redirecting to legacy system...</p>
    </div>
  );
}
