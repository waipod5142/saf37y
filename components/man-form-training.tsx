"use client";

import { useForm, FieldValues, SubmitHandler } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { submitTrainingForm } from "@/lib/actions/man";
import QRCodeComponent from "@/components/qr-code";

interface ManFormTrainingProps {
  bu: string;
  type: string;
  trainingCourse: string;
  courseId: string;
  trainingDate: string;
  expirationDate: string;
  isInDialog?: boolean;
}

interface TrainingFormData extends FieldValues {
  empId: string;
  remark?: string;
  [key: string]: any;
}

export default function ManFormTraining({
  bu,
  type,
  trainingCourse,
  courseId,
  trainingDate,
  expirationDate,
  isInDialog = false,
}: ManFormTrainingProps) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<TrainingFormData>();

  // Generate QR code URL
  const qrUrl = `https://www.saf37y.com/ManForm/${bu}/${type}/${trainingCourse}/${trainingDate}/${expirationDate}/${courseId}`;

  const onSubmit: SubmitHandler<TrainingFormData> = async (formData) => {
    try {
      // Validate required fields
      if (!formData.empId) {
        toast.error("Please enter Staff ID");
        return;
      }

      const trainingData = {
        ...formData, // This includes user-input empId as Staff ID
        trainingCourse, // URL parameter as trainingCourse
        bu,
        type: "trainingform",
        courseId,
        trainingDate,
        expirationDate,
        remark: formData.remark || "",
        timestamp: new Date().toISOString(),
      };

      // Save to Firestore using server action
      try {
        const result = await submitTrainingForm(trainingData);

        if (result.success) {
          toast.success("Training form submitted successfully!");

          // Capture the empId before resetting the form
          const submittedEmpId = formData.empId;

          reset();

          // Navigate to the Man detail page
          router.push(`/Man/${bu}/Training/${submittedEmpId}`);
        } else {
          toast.error(result.error || "Failed to submit training form");
        }
      } catch (serverError) {
        console.error("Server action error:", serverError);
        toast.error("Failed to save training form. Please try again.");
      }
    } catch (error) {
      console.error("General error:", error);
      toast.error("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <div>
      <Card className="mb-6">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="w-full">
              <CardTitle className="text-center sm:text-left text-xl font-bold text-gray-800">
                📚 Training Course Registration
              </CardTitle>
              <p className="text-center sm:text-left text-lg font-semibold text-blue-600 mt-1">
                {trainingCourse}
              </p>
              <div className="mt-3 space-y-1 text-sm text-gray-600">
                <p>
                  <strong>Course ID:</strong> {courseId}
                </p>
                <p>
                  <strong>Training Date:</strong> {trainingDate}
                </p>
                <p>
                  <strong>Expiration Date:</strong> {expirationDate}
                </p>
              </div>
            </div>
            <div className="flex justify-center sm:justify-end flex-shrink-0">
              <QRCodeComponent value={qrUrl} size={100} />
            </div>
          </div>
        </CardHeader>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Staff ID */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label htmlFor="empId" className="text-lg font-semibold">
                Staff ID / รหัสพนักงาน *
              </Label>
              <Input
                {...register("empId", { required: "Staff ID is required" })}
                placeholder="Enter Staff ID"
                className="w-full"
                autoFocus
              />
              {errors.empId && (
                <p className="text-red-500 text-sm">{errors.empId.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Remark */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label className="text-lg font-semibold">
                Remark / หมายเหตุ (Optional)
              </Label>
              <Textarea
                {...register("remark")}
                placeholder="Additional notes..."
                className="w-full min-h-[60px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-md shadow-lg text-lg"
        >
          {isSubmitting ? "Submitting..." : "Submit / ส่ง"}
        </Button>
      </form>
    </div>
  );
}
