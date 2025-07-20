import { getMachineById } from "@/data/machines";
import { SettingsIcon, AlertTriangleIcon, QrCodeIcon } from "lucide-react";
import ReactMarkdown from "react-markdown";
import QRCodeComponent from "./qr-code";

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

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-6">
      {/* QR Code Section */}
      <div className="bg-gray-50 p-4 rounded-lg mb-4 w-full flex justify-center items-center">
          <QRCodeComponent 
            value={`https://www.saf37y.com/Machine/${bu}/${type}/${id}`}
            size={96}
            className="flex-shrink-0"
          />
      </div>
      <div className="p-6">
          <div className="flex items-start gap-4">
            
            <div className="flex-1">
             
              <h2 className="text-lg font-semibold text-gray-700 mb-4">
                {machine.header}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                <div className="bg-gray-50 p-3 rounded">
                  <span className="text-sm font-medium text-gray-500">Machine ID</span>
                  <p className="text-gray-900 font-semibold">{machine.id}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <span className="text-sm font-medium text-gray-500">Business Unit</span>
                  <p className="text-gray-900 font-semibold">{bu.toUpperCase()}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <span className="text-sm font-medium text-gray-500">Type</span>
                  <p className="text-gray-900 font-semibold">{type.charAt(0).toUpperCase() + type.slice(1)}</p>
                </div>

                {machine.country && (
                  <div className="bg-gray-50 p-3 rounded">
                    <span className="text-sm font-medium text-gray-500">Country</span>
                    <p className="text-gray-900 font-semibold">{machine.country}</p>
                  </div>
                )}
                {machine.site && (
                  <div className="bg-gray-50 p-3 rounded">
                    <span className="text-sm font-medium text-gray-500">Site</span>
                    <p className="text-gray-900 font-semibold">{machine.site}</p>
                  </div>
                )}
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
  );
}
