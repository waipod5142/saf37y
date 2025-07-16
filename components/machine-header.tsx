import { getMachineById } from "@/data/machines";
import { machineTitles } from "@/lib/machine-types";
import { SettingsIcon, AlertTriangleIcon } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface MachineHeaderProps {
  bu: string;
  type: string;
  id: string;
}

export default async function MachineHeader({ bu, type, id }: MachineHeaderProps) {
  const machine = await getMachineById(bu, type, id);

  if (!machine) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
        <div className="flex items-center gap-2 text-red-700">
          <AlertTriangleIcon className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Machine Not Found</h2>
        </div>
        <p className="text-red-600 mt-2">
          No machine data found for {bu}/{type}/{id}
        </p>
      </div>
    );
  }

  const machineTitle = machineTitles[`${bu}${type.toLowerCase()}`] || `${type.charAt(0).toUpperCase() + type.slice(1)} Inspection`;

  return (
    <div className="max-w-4xl mx-auto p-2">
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="bg-blue-100 p-3 rounded-lg">
                <SettingsIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {machine.name}
              </h1>
              
              <h2 className="text-lg font-semibold text-gray-700 mb-4">
                {machineTitle}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-gray-50 p-3 rounded">
                  <span className="text-sm font-medium text-gray-500">Business Unit</span>
                  <p className="text-gray-900 font-semibold">{bu.toUpperCase()}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <span className="text-sm font-medium text-gray-500">Type</span>
                  <p className="text-gray-900 font-semibold">{type.charAt(0).toUpperCase() + type.slice(1)}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <span className="text-sm font-medium text-gray-500">Machine ID</span>
                  <p className="text-gray-900 font-semibold">{machine.id}</p>
                </div>
              </div>
              
              {machine.question && (
                <div className="mb-4">
                  <h3 className="text-md font-semibold text-gray-800 mb-2">Inspection Question</h3>
                  <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-400">
                    <ReactMarkdown className="text-gray-700">{machine.question}</ReactMarkdown>
                  </div>
                </div>
              )}
              
              {machine.howto && (
                <div className="mb-4">
                  <h3 className="text-md font-semibold text-gray-800 mb-2">How To Instructions</h3>
                  <div className="bg-green-50 p-3 rounded border-l-4 border-green-400">
                    <ReactMarkdown className="text-gray-700">{machine.howto}</ReactMarkdown>
                  </div>
                </div>
              )}
              
              {machine.accept && (
                <div className="mb-4">
                  <h3 className="text-md font-semibold text-gray-800 mb-2">Acceptance Criteria</h3>
                  <div className="bg-yellow-50 p-3 rounded border-l-4 border-yellow-400">
                    <ReactMarkdown className="text-gray-700">{machine.accept}</ReactMarkdown>
                  </div>
                </div>
              )}
              
              {machine.description && (
                <div>
                  <h3 className="text-md font-semibold text-gray-800 mb-2">Description</h3>
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>{machine.description}</ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
