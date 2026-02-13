"use client";

import { useEffect, use } from "react";

export default function ManPage({
  params,
}: {
  params: Promise<{ bu: string; type: string; id: string }>;
}) {
  const { type, id } = use(params);

  useEffect(() => {
    // Decode URL parameters to handle special characters (including Thai characters)
    const decodedType = decodeURIComponent(type).toLowerCase();
    const decodedId = decodeURIComponent(id);

    // Determine redirect URL based on type
    let redirectUrl: string;

    if (decodedType === "toolbox") {
      redirectUrl = `https://sccc-inseesafety-prod.web.app/Man/toolbox/${decodedId}`;
    } else if (decodedType === "boot") {
      redirectUrl = `https://sccc-inseesafety-prod.web.app/Man/bootform/${decodedId}`;
    } else {
      redirectUrl = `https://sccc-inseesafety-prod.web.app/Man/${decodedType}/${decodedId}`;
    }

    // Redirect to the legacy system
    window.location.href = redirectUrl;
  }, [type, id]);

  return (
    <div className="max-w-4xl mx-auto p-8 text-center">
      <p>Redirecting to legacy system...</p>
    </div>
  );
}
