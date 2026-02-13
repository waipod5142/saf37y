// This page is redirected by middleware to the legacy system
// Users will never see this component

export default async function MachinePage() {
  return (
    <div className="max-w-4xl mx-auto p-8 text-center">
      <p>Redirecting to legacy system...</p>
    </div>
  );
}
