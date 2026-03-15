"use client";

import { useEffect, use } from "react";

export default function PtoFormRedirect({
  params,
}: {
  params: Promise<{ bu: string; id: string }>;
}) {
  const { id } = use(params);

  useEffect(() => {
    const decodedId = decodeURIComponent(id);
    window.location.href = `https://sccc-inseesafety-prod.web.app/Man/ptoform/${decodedId}`;
  }, [id]);

  return (
    <div className="max-w-4xl mx-auto p-8 text-center">
      <p>Redirecting to legacy system...</p>
    </div>
  );
}
