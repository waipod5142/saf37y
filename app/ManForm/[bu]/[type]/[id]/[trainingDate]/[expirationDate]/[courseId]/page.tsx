import { normalizeBuCode } from "@/lib/utils";
import ManFormTraining from "@/components/man-form-training";

export default async function TrainingCoursePage({
  params,
}: {
  params: Promise<{
    bu: string;
    type: string;
    id: string;
    trainingDate: string;
    expirationDate: string;
    courseId: string;
  }>;
}) {
  const { bu, type, id, trainingDate, expirationDate, courseId } = await params;

  // Decode URL parameters to handle special characters (including Thai characters)
  const decodedBu = decodeURIComponent(bu);
  const decodedType = decodeURIComponent(type);
  const decodedId = decodeURIComponent(id);
  const decodedTrainingDate = decodeURIComponent(trainingDate);
  const decodedExpirationDate = decodeURIComponent(expirationDate);
  const decodedCourseId = decodeURIComponent(courseId);

  // Normalize BU code (map office, srb, mkt, lbm, rmx, iagg, ieco to "th")
  const normalizedBu = normalizeBuCode(decodedBu);

  return (
    <div className="max-w-4xl mx-auto p-2">
      <ManFormTraining
        bu={normalizedBu}
        type={decodedType}
        trainingCourse={decodedId}
        courseId={decodedCourseId}
        trainingDate={decodedTrainingDate}
        expirationDate={decodedExpirationDate}
      />
    </div>
  );
}
