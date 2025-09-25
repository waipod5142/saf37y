"use client";

import { useState, useEffect } from "react";
import { getEmployeeByIdAction } from "@/lib/actions/employees";
import { Employee } from "@/types/employee";
import { AlertTriangleIcon } from "lucide-react";

interface ManHeaderProps {
  bu: string;
  type: string;
  id: string;
}

export default function ManHeader({ bu, type, id }: ManHeaderProps) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        setLoading(true);
        const result = await getEmployeeByIdAction(id);

        if (result.success && result.employee) {
          setEmployee(result.employee);
        } else {
          setError(result.error || "Employee not found");
        }
      } catch (err) {
        setError("Failed to fetch employee data");
        console.error("Error fetching employee:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [id]);

  if (loading) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
          <div className="text-gray-600">Loading employee details...</div>
        </div>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
        <div className="flex items-center gap-2 text-red-700">
          <AlertTriangleIcon className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Employee Not Found</h2>
        </div>
        <p className="text-red-600 mt-2">
          {error || `No employee data found for ID: ${id}`}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-6">
      <div className="p-6">
        <div className="mb-4">
          <div className="flex-1">
            {/* Employee Header */}
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-blue-600 mb-1">
                {employee.displayName || employee.fullName || `${employee.firstName} ${employee.lastName}`}
              </h2>
              <p className="text-lg text-gray-600">
                {employee.position || 'N/A'}
              </p>
            </div>

            {/* Basic Information */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                {employee.empId && (
                  <div className="flex flex-col">
                    <span className="text-gray-500 font-medium">Employee ID</span>
                    <span className="text-gray-900">{employee.empId}</span>
                  </div>
                )}

                {employee.idCard && (
                  <div className="flex flex-col">
                    <span className="text-gray-500 font-medium">ID Card</span>
                    <span className="text-gray-900">{employee.idCard}</span>
                  </div>
                )}

                {employee.prefix && (
                  <div className="flex flex-col">
                    <span className="text-gray-500 font-medium">Prefix</span>
                    <span className="text-gray-900">{employee.prefix}</span>
                  </div>
                )}

                {employee.firstName && (
                  <div className="flex flex-col">
                    <span className="text-gray-500 font-medium">First Name</span>
                    <span className="text-gray-900">{employee.firstName}</span>
                  </div>
                )}

                {employee.lastName && (
                  <div className="flex flex-col">
                    <span className="text-gray-500 font-medium">Last Name</span>
                    <span className="text-gray-900">{employee.lastName}</span>
                  </div>
                )}

                {employee.dateOfBirth && (
                  <div className="flex flex-col">
                    <span className="text-gray-500 font-medium">Date of Birth</span>
                    <span className="text-gray-900">{employee.dateOfBirth}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Work Information */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Work Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                {employee.company && (
                  <div className="flex flex-col">
                    <span className="text-gray-500 font-medium">Company</span>
                    <span className="text-gray-900">{employee.company}</span>
                  </div>
                )}

                {employee.department && (
                  <div className="flex flex-col">
                    <span className="text-gray-500 font-medium">Department</span>
                    <span className="text-gray-900">{employee.department}</span>
                  </div>
                )}

                {employee.function && (
                  <div className="flex flex-col">
                    <span className="text-gray-500 font-medium">Function</span>
                    <span className="text-gray-900">{employee.function}</span>
                  </div>
                )}

                {employee.bu && (
                  <div className="flex flex-col">
                    <span className="text-gray-500 font-medium">Business Unit</span>
                    <span className="text-gray-900">{employee.bu}</span>
                  </div>
                )}

                {employee.level && (
                  <div className="flex flex-col">
                    <span className="text-gray-500 font-medium">Level</span>
                    <span className="text-gray-900">{employee.level}</span>
                  </div>
                )}

                {employee.site && (
                  <div className="flex flex-col">
                    <span className="text-gray-500 font-medium">Site</span>
                    <span className="text-gray-900">{employee.site}</span>
                  </div>
                )}

                {employee.plantId && (
                  <div className="flex flex-col">
                    <span className="text-gray-500 font-medium">Plant ID</span>
                    <span className="text-gray-900">{employee.plantId}</span>
                  </div>
                )}

                {employee.startDate && (
                  <div className="flex flex-col">
                    <span className="text-gray-500 font-medium">Start Date</span>
                    <span className="text-gray-900">{employee.startDate}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Contact Information */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                {employee.phoneNumber && (
                  <div className="flex flex-col">
                    <span className="text-gray-500 font-medium">Phone Number</span>
                    <span className="text-gray-900">{employee.phoneNumber}</span>
                  </div>
                )}

                {employee.address && (
                  <div className="flex flex-col">
                    <span className="text-gray-500 font-medium">Address</span>
                    <span className="text-gray-900">{employee.address}</span>
                  </div>
                )}
              </div>
            </div>

            {/* System Information */}
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">System Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                {employee.createdAt && (
                  <div className="flex flex-col">
                    <span className="text-gray-500 font-medium">Created At</span>
                    <span className="text-gray-900">{employee.createdAt}</span>
                  </div>
                )}

                {employee.updatedAt && (
                  <div className="flex flex-col">
                    <span className="text-gray-500 font-medium">Updated At</span>
                    <span className="text-gray-900">{employee.updatedAt}</span>
                  </div>
                )}

                {employee.importedAt && (
                  <div className="flex flex-col">
                    <span className="text-gray-500 font-medium">Imported At</span>
                    <span className="text-gray-900">{employee.importedAt}</span>
                  </div>
                )}

                {employee.createdBy && (
                  <div className="flex flex-col">
                    <span className="text-gray-500 font-medium">Created By</span>
                    <span className="text-gray-900">{employee.createdBy}</span>
                  </div>
                )}

                {employee.cardExpiryDate && (
                  <div className="flex flex-col">
                    <span className="text-gray-500 font-medium">Card Expiry Date</span>
                    <span className="text-gray-900">{employee.cardExpiryDate}</span>
                  </div>
                )}

                {employee.type && (
                  <div className="flex flex-col">
                    <span className="text-gray-500 font-medium">Type</span>
                    <span className="text-gray-900">{employee.type}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}