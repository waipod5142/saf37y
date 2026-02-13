import { firestore } from "@/firebase/server";

async function getMixerForms() {
  try {
    const formsSnapshot = await firestore
      .collection("forms")
      .get();

    // Filter forms where type starts with "mixer"
    const mixerForms = formsSnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      } as { id: string; type?: string; [key: string]: any }))
      .filter(form => {
        const type = form.type || "";
        return type.toLowerCase().startsWith("mixer");
      });

    return {
      forms: mixerForms,
      error: null
    };
  } catch (error) {
    console.error("Error fetching mixer forms:", error);
    return {
      forms: [],
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

export default async function RmxTypePage() {
  const data = await getMixerForms();

  if (data.error) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6 text-red-600">Error Loading Data</h1>
        <p className="text-red-500">{data.error}</p>
      </div>
    );
  }

  // Group forms by type and count
  const typeCount: Record<string, number> = {};
  data.forms.forEach(form => {
    const type = form.type || "Unknown";
    typeCount[type] = (typeCount[type] || 0) + 1;
  });

  const typeSummary = Object.entries(typeCount)
    .sort(([, a], [, b]) => b - a)
    .map(([type, count]) => ({ type, count }));

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Mixer Forms Summary</h1>

      <div className="mb-6">
        <p className="text-lg">Total Forms: <strong>{data.forms.length}</strong></p>
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold mb-3">Forms by Type</h2>
        {typeSummary.map(({ type, count }) => (
          <div key={type} className="flex items-center justify-between border rounded-lg p-3 bg-white shadow-sm">
            <span className="font-medium">{type}</span>
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
              {count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
