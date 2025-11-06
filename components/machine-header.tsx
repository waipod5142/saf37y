"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getMachineByIdAction } from "@/lib/actions/machines";
import { Machine } from "@/types/machine";
import { AlertTriangleIcon } from "lucide-react";
import ReactMarkdown from "react-markdown";
import QRCodeComponent from "./qr-code";

interface MachineHeaderClientProps {
  bu: string;
  type: string;
  id: string;
}

export default function MachineHeaderClient({
  bu,
  type,
  id,
}: MachineHeaderClientProps) {
  const [machine, setMachine] = useState<Machine | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleMachineIdClick = () => {
    // Capitalize first letter of type
    const capitalizedType = type.charAt(0).toUpperCase() + type.slice(1);
    // Navigate to machine detail page
    router.push(`/Machine/${bu}/${capitalizedType}/${encodeURIComponent(id)}`);
  };

  useEffect(() => {
    const fetchMachine = async () => {
      try {
        setLoading(true);
        const result = await getMachineByIdAction(bu, type, id);

        if (result.success && result.machine) {
          setMachine(result.machine);
        } else {
          setError(result.error || "Machine not found");
        }
      } catch (err) {
        setError("Failed to fetch machine data");
        console.error("Error fetching machine:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMachine();
  }, [bu, type, id]);

  if (loading) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
        <div className="text-gray-600">Loading machine details...</div>
      </div>
    );
  }

  if (error || !machine) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
        <div className="flex items-center gap-2 text-red-700">
          <AlertTriangleIcon className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Machine Not Found</h2>
        </div>
        <p className="text-red-600 mt-2">
          {error || `No machine data found for ${bu}/${type}/${id}`}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-6">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <button
              onClick={handleMachineIdClick}
              className="text-2xl font-bold text-blue-600 hover:text-blue-800 mb-2 cursor-pointer transition-colors duration-200 bg-transparent border-none p-0 text-left"
              title="Click to open full machine page"
            >
              {machine.id.toUpperCase()}
            </button>

            {/* Dynamic machine information */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              {machine.bu && (
                <div className="flex flex-col">
                  <span className="text-gray-500 font-medium">BU</span>
                  <span className="text-gray-900">{machine.bu}</span>
                </div>
              )}

              {machine.type && (
                <div className="flex flex-col">
                  <span className="text-gray-500 font-medium">Type</span>
                  <span className="text-gray-900">{machine.type}</span>
                </div>
              )}

              {machine.site && (
                <div className="flex flex-col">
                  <span className="text-gray-500 font-medium">Site</span>
                  <span className="text-gray-900">{machine.site}</span>
                </div>
              )}

              {machine.plantId && (
                <div className="flex flex-col">
                  <span className="text-gray-500 font-medium">Plant ID</span>
                  <span className="text-gray-900">{machine.plantId}</span>
                </div>
              )}

              {machine.status && (
                <div className="flex flex-col">
                  <span className="text-gray-500 font-medium">Status</span>
                  <span className="text-gray-900">{machine.status}</span>
                </div>
              )}

              {machine.kind && (
                <div className="flex flex-col">
                  <span className="text-gray-500 font-medium">Kind</span>
                  <span className="text-gray-900">{machine.kind}</span>
                </div>
              )}

              {machine.name && (
                <div className="flex flex-col">
                  <span className="text-gray-500 font-medium">Name</span>
                  <span className="text-gray-900">{machine.name}</span>
                </div>
              )}

              {machine.interval && (
                <div className="flex flex-col">
                  <span className="text-gray-500 font-medium">Interval</span>
                  <span className="text-gray-900">{machine.interval}</span>
                </div>
              )}

              {machine.quantity && (
                <div className="flex flex-col">
                  <span className="text-gray-500 font-medium">Quantity</span>
                  <span className="text-gray-900">{machine.quantity}</span>
                </div>
              )}

              {machine.description && (
                <div className="flex flex-col">
                  <span className="text-gray-500 font-medium">Description</span>
                  <span className="text-gray-900">{machine.description}</span>
                </div>
              )}

              {machine.area && (
                <div className="flex flex-col">
                  <span className="text-gray-500 font-medium">Area</span>
                  <span className="text-gray-900">{machine.area}</span>
                </div>
              )}

              {machine.department && (
                <div className="flex flex-col">
                  <span className="text-gray-500 font-medium">Department</span>
                  <span className="text-gray-900">{machine.department}</span>
                </div>
              )}

              {machine.location && (
                <div className="flex flex-col">
                  <span className="text-gray-500 font-medium">Location</span>
                  <span className="text-gray-900">{machine.location}</span>
                </div>
              )}

              {machine.owner && (
                <div className="flex flex-col">
                  <span className="text-gray-500 font-medium">Owner</span>
                  <span className="text-gray-900">{machine.owner}</span>
                </div>
              )}

              {machine.ownerId && (
                <div className="flex flex-col">
                  <span className="text-gray-500 font-medium">Owner ID</span>
                  <span className="text-gray-900">{machine.ownerId}</span>
                </div>
              )}

              {machine.email && (
                <div className="flex flex-col">
                  <span className="text-gray-500 font-medium">
                    Responsible person email
                  </span>
                  <span className="text-gray-900 break-words break-all">
                    {machine.email}
                  </span>
                </div>
              )}

              {machine.supemail && (
                <div className="flex flex-col">
                  <span className="text-gray-500 font-medium">CC email</span>
                  <span className="text-gray-900 break-words break-all">
                    {machine.supemail}
                  </span>
                </div>
              )}

              {machine.registerDate && (
                <div className="flex flex-col">
                  <span className="text-gray-500 font-medium">
                    Register Date
                  </span>
                  <span className="text-gray-900">
                    {typeof machine.registerDate === "string"
                      ? machine.registerDate
                      : new Date(machine.registerDate).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            {/* Remark section */}
            {machine.remark && (
              <div className="mt-4">
                <span className="text-gray-500 font-medium text-sm">
                  Remark
                </span>
                <div className="mt-1 text-gray-900 prose prose-sm max-w-none">
                  <ReactMarkdown>{machine.remark}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>

          {/* QR Code */}
          <div className="ml-6 flex-shrink-0">
            <QRCodeComponent
              value={`https://www.saf37y.com/Machine/${bu}/${type.charAt(0).toUpperCase() + type.slice(1)}/${encodeURIComponent(machine.id)}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
