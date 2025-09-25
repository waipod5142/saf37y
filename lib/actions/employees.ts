"use server";

import { firestore } from "@/firebase/server";
import { Employee } from "@/types/employee";

// Utility function to serialize Firestore objects for client-server boundary
function serializeFirestoreData(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle Firestore Timestamp objects
  if (obj && typeof obj === 'object' && obj.toDate) {
    return obj.toDate().toISOString();
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => serializeFirestoreData(item));
  }

  // Handle plain objects
  if (obj && typeof obj === 'object' && obj.constructor === Object) {
    const serialized: any = {};
    Object.keys(obj).forEach(key => {
      serialized[key] = serializeFirestoreData(obj[key]);
    });
    return serialized;
  }

  // Return primitive values as-is
  return obj;
}

export async function getEmployeeByIdAction(
  id: string
): Promise<{ success: boolean; employee?: Employee; error?: string }> {
  try {
    // Decode URL parameters to handle special characters (including Thai characters)
    const decodedId = decodeURIComponent(id);

    // Query the employees collection with matching id
    const employeeQuery = firestore
      .collection("employees")
      .where("empId", "==", decodedId)
      .limit(1);

    const querySnapshot = await employeeQuery.get();

    if (querySnapshot.empty) {
      return {
        success: false,
        error: `No employee found with ID: ${decodedId}`,
      };
    }

    const doc = querySnapshot.docs[0];
    const employeeData = doc.data();

    // Add the document ID to the employee data
    const employee: Employee = {
      id: doc.id,
      ...employeeData,
    };

    // Serialize the data to handle Firestore objects
    const serializedEmployee = serializeFirestoreData(employee) as Employee;

    return {
      success: true,
      employee: serializedEmployee,
    };
  } catch (error) {
    console.error("Error fetching employee:", error);
    return {
      success: false,
      error: `Failed to fetch employee: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

export async function getAllEmployeesAction(): Promise<{ success: boolean; employees?: Employee[]; error?: string }> {
  try {
    const employeesQuery = firestore.collection("employees");
    const querySnapshot = await employeesQuery.get();

    if (querySnapshot.empty) {
      return {
        success: true,
        employees: [],
      };
    }

    const employees: Employee[] = [];
    querySnapshot.forEach((doc) => {
      const employeeData = doc.data();
      const employee: Employee = {
        id: doc.id,
        ...employeeData,
      };
      employees.push(employee);
    });

    // Serialize the data to handle Firestore objects
    const serializedEmployees = serializeFirestoreData(employees) as Employee[];

    return {
      success: true,
      employees: serializedEmployees,
    };
  } catch (error) {
    console.error("Error fetching employees:", error);
    return {
      success: false,
      error: `Failed to fetch employees: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}