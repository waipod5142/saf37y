"use client";

import { useState } from "react";
import { useForm, FieldValues, SubmitHandler } from "react-hook-form";
import { Button } from "./ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import MultiImageUploader, { ImageUpload } from "@/components/multi-image-uploader";
import { auth, storage } from "@/firebase/client";
import { signInAnonymously } from "firebase/auth";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { submitManForm } from "@/lib/actions/man";

interface ManFormSOTProps {
  bu: string;
  type: string;
  id: string;
  isInDialog?: boolean;
}

interface SOTFormData extends FieldValues {
  report: 'sot' | 'vfl' | '';
  area: string;
  talkwith: string;
  topics: string[];
  safe?: string;
  care?: string;
  riskLevel: 'low' | 'medium' | 'high' | '';
  actionComment?: string;
  remark?: string;
  [key: string]: any;
}

export default function ManFormSOT({ bu, type, id, isInDialog = false }: ManFormSOTProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm<SOTFormData>();

  const [images, setImages] = useState<ImageUpload[]>([]);
  const [selectedSafetyIssues, setSelectedSafetyIssues] = useState<string[]>([]);

  // Watch form values
  const report = watch('report');
  const riskLevel = watch('riskLevel');

  // Safety issue categories with colors matching the screenshot
  const safetyIssueCategories = [
    { id: 'ppe', label: 'อุปกรณ์คุ้มครองความปลอดภัยส่วนบุคคล (PPE)', color: 'bg-blue-500' },
    { id: 'workingAtHight', label: 'การทำงานบนที่สูง (Working at Height)', color: 'bg-red-500' },
    { id: 'isolation', label: 'การตัดแยกแหล่งพลังงาน (Isolation of plant and equipment)', color: 'bg-orange-500' },
    { id: 'vehicles', label: 'ยานพาหนะและการจราจร (Vehicles and Traffic Safety)', color: 'bg-yellow-500' },
    { id: 'electrical', label: 'การทำงานกับไฟฟ้า (Electrical Safety)', color: 'bg-yellow-400' },
    { id: 'guarding', label: 'การ์ดของเครื่องจักร (Machine Guarding)', color: 'bg-green-500' },
    { id: 'hotwork', label: 'การทำงานความร้อนและประกายไฟ (Hot Work and Permits)', color: 'bg-teal-500' },
    { id: 'lifting', label: 'การทำงานยก (Lifting Equipment)', color: 'bg-blue-600' },
    { id: 'quarries', label: 'การทำงานเกี่ยวกับเหมือง (Quarries)', color: 'bg-indigo-500' },
    { id: 'hotMaterials', label: 'การทำงานกับวัสดุที่มีความร้อน (Hot Materials)', color: 'bg-purple-500' },
    { id: 'csm', label: 'การบริหารจัดการผู้รับเหมา (Contractor Management)', color: 'bg-pink-500' },
    { id: 'equipment', label: 'การใช้งานอุปกรณ์และเครื่องมือ (Portable Equipment)', color: 'bg-purple-400' },
    { id: 'generalWork', label: 'การทำงานทั่วไป (General Work Permits)', color: 'bg-gray-500' },
  ];

  // Handle safety issue selection
  const handleSafetyIssueToggle = (issueId: string) => {
    setSelectedSafetyIssues(prev => {
      const updated = prev.includes(issueId)
        ? prev.filter(id => id !== issueId)
        : [...prev, issueId];
      setValue('topics', updated);
      return updated;
    });
  };


  const onSubmit: SubmitHandler<SOTFormData> = async (formData) => {
    try {
      // Validate required fields
      if (!formData.report) {
        toast.error("Please select a reporting type (SOT or VFL)");
        return;
      }

      if (!formData.area || !formData.talkwith) {
        toast.error("Please fill in all required fields");
        return;
      }

      if (selectedSafetyIssues.length === 0) {
        toast.error("Please select at least one safety issue category");
        return;
      }

      if (!formData.riskLevel) {
        toast.error("Please select a risk level");
        return;
      }

      // Authenticate anonymously if not already authenticated (for Storage upload)
      if (!auth.currentUser) {
        try {
          await signInAnonymously(auth);
        } catch (authError: any) {
          console.error("Authentication error:", authError);
          toast.error("Authentication failed. Please try again.");
          return;
        }
      }

      // Upload images to Firebase Storage and get download URLs
      const imageUrls: string[] = [];

      for (let index = 0; index < images.length; index++) {
        const image = images[index];
        if (image.file) {
          try {
            const path = `Man/${bu}/${type}/${id}/${Date.now()}-${index}-${image.file.name}`;
            const storageRef = ref(storage, path);

            // Upload file and wait for completion
            const uploadTask = uploadBytesResumable(storageRef, image.file);
            await uploadTask;

            // Get download URL after upload completes
            const downloadURL = await getDownloadURL(storageRef);
            imageUrls.push(downloadURL);
          } catch (uploadError) {
            console.error(`Upload error for image ${index}:`, uploadError);
            toast.error(`Failed to upload image ${index + 1}. Please try again.`);
            return;
          }
        }
      }

      const sotData = {
        ...formData,
        topics: selectedSafetyIssues,
        bu,
        type: type.toLowerCase(),
        id,
        images: imageUrls,
        timestamp: new Date().toISOString(),
      };

      // Save to Firestore using server action
      try {
        const result = await submitManForm(sotData);

        if (result.success) {
          toast.success("SOT/VFL report submitted successfully!");
          reset();
          setSelectedSafetyIssues([]);
          setImages([]);

          // Scroll to top and optionally reload
          window.scrollTo(0, 0);
        } else {
          toast.error(result.error || "Failed to submit SOT/VFL report");
        }
      } catch (serverError) {
        console.error("Server action error:", serverError);
        toast.error("Failed to save SOT/VFL report. Please try again.");
      }
    } catch (error) {
      console.error("General error:", error);
      toast.error("An unexpected error occurred. Please try again.");
    }
  };

  // Get risk level color
  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-500 hover:bg-green-700';
      case 'medium': return 'bg-orange-500 hover:bg-orange-700';
      case 'high': return 'bg-red-500 hover:bg-red-700';
      default: return 'bg-gray-300 hover:bg-gray-400';
    }
  };

  return (
    <div>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-center text-xl font-bold text-gray-800">
            🛡️ กิจกรรม SOT and VFL
          </CardTitle>
        </CardHeader>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Reporting Type Selection */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <Label className="text-lg font-semibold text-gray-800">
                1. โปรดเลือกประเภทการรายงานของท่านในวันนี้ / Please select your reporting type today. *
              </Label>
              <div className="flex flex-col space-y-3">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    value="sot"
                    {...register('report', { required: 'Please select a reporting type' })}
                    className="sr-only"
                  />
                  <div className={`px-4 py-2 rounded-full text-white font-medium text-sm transition-colors ${
                    report === 'sot' ? 'bg-red-500 ring-2 ring-offset-2 ring-gray-400' : 'bg-gray-400 hover:bg-red-400'
                  }`}>
                    Safety Observation Tour (SOT)
                  </div>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    value="vfl"
                    {...register('report', { required: 'Please select a reporting type' })}
                    className="sr-only"
                  />
                  <div className={`px-4 py-2 rounded-full text-white font-medium text-sm transition-colors ${
                    report === 'vfl' ? 'bg-red-500 ring-2 ring-offset-2 ring-gray-400' : 'bg-gray-400 hover:bg-red-400'
                  }`}>
                    Visible Felt Leadership (VFL)
                  </div>
                </label>
              </div>
              {errors.report && (
                <p className="text-red-500 text-sm">{errors.report.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Area/Location Field */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label htmlFor="area" className="text-lg font-semibold">
                2. พื้นที่ที่สังเกตการณ์ความปลอดภัย / Area or Location for observing *
              </Label>
              <Input
                {...register("area", { required: "Area is required" })}
                placeholder="Enter area or location"
                className="w-full"
              />
              {errors.area && (
                <p className="text-red-500 text-sm">{errors.area.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Observer Name Field */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label htmlFor="talkwith" className="text-lg font-semibold">
                3. ชื่อของบุคคลที่ท่านได้คุยด้วย / Observer's name *
              </Label>
              <Input
                {...register("talkwith", { required: "Observer name is required" })}
                placeholder="Enter observer name"
                className="w-full"
              />
              {errors.talkwith && (
                <p className="text-red-500 text-sm">{errors.talkwith.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Safety Issues Categories */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <Label className="text-lg font-semibold text-gray-800">
                4. ประเด็นความปลอดภัยที่ท่านได้ตรวจสอบ / The safety issues that you have observed *
              </Label>
              <div className="grid grid-cols-1 gap-3">
                {safetyIssueCategories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => handleSafetyIssueToggle(category.id)}
                    className={`px-3 py-2 rounded-md text-white text-sm font-medium transition-all ${
                      selectedSafetyIssues.includes(category.id)
                        ? `${category.color} opacity-100 ring-2 ring-offset-2 ring-gray-400`
                        : `${category.color} opacity-50 hover:opacity-90`
                    }`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
              {selectedSafetyIssues.length === 0 && (
                <p className="text-red-500 text-sm">Please select at least one safety issue category</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Positive Reinforcement */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label className="text-lg font-semibold">
                5. การชมเชย: การกระทำ/สิ่งที่ปลอดภัย (Positive reinforcement: Safe Action or Safe Condition)
              </Label>
              <Textarea
                {...register("safe")}
                placeholder="กรอกรายละเอียด..."
                className="w-full min-h-[80px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Safety Care */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label className="text-lg font-semibold">
                6. ความห่วงใย: การกระทำ/สิ่งที่ไม่ปลอดภัย (Safety care : Unsafe Action or Unsafe Condition) และข้อตกลงความร่วมมือ (Agreement) ร่วมกัน
              </Label>
              <div className="text-sm text-gray-600 mb-2">และคำแนะนำการใส่ใจต่อความปลอดภัย (Agreement) วามใส</div>
              <Textarea
                {...register("care")}
                placeholder="กรอกรายละเอียด..."
                className="w-full min-h-[80px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Risk Level */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <Label className="text-lg font-semibold">
                7. ระดับความรุนแรงของความเสี่ยง / Risk Level *
              </Label>
              <div className="flex flex-col space-y-3">
                <button
                  type="button"
                  onClick={() => setValue('riskLevel', 'low')}
                  className={`px-4 py-2 rounded-md text-white font-medium text-sm transition-colors ${
                    riskLevel === 'low' ? 'bg-green-500 ring-2 ring-offset-2 ring-gray-400' : 'bg-green-400 hover:bg-green-500'
                  }`}
                >
                  ต่ำ (Low) - มีโอกาสเกิดขึ้นน้อย ไม่มีผลกระทบร้ายแรง (Low probability of occurrence with no significant impact)
                </button>
                <button
                  type="button"
                  onClick={() => setValue('riskLevel', 'medium')}
                  className={`px-4 py-2 rounded-md text-white font-medium text-sm transition-colors ${
                    riskLevel === 'medium' ? 'bg-orange-500 ring-2 ring-offset-2 ring-gray-400' : 'bg-orange-400 hover:bg-orange-500'
                  }`}
                >
                  ปานกลาง (Medium) - มีโอกาสเกิดขึ้นและอาจส่งผลกระทบต่อความปลอดภัย (Moderate probability of occurrence that may impact safety)
                </button>
                <button
                  type="button"
                  onClick={() => setValue('riskLevel', 'high')}
                  className={`px-4 py-2 rounded-md text-white font-medium text-sm transition-colors ${
                    riskLevel === 'high' ? 'bg-red-500 ring-2 ring-offset-2 ring-gray-400' : 'bg-red-400 hover:bg-red-500'
                  }`}
                >
                  สูง (High) - มีความเสี่ยงสูงที่อาจเกิดอุบัติเหตุหรือส่งผลร้ายแรง (High risk of accidents or severe consequences)
                </button>
              </div>
              {!riskLevel && (
                <p className="text-red-500 text-sm">Please select a risk level</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Process Comments */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label className="text-lg font-semibold">
                8. มาตรการแก้ไขและป้องกัน หรือความคิดเห็นอื่นที่มีต่อการดำเนินการครั้งนี้ / Process of action or General Comments.
              </Label>
              <Textarea
                {...register("actionComment")}
                placeholder="กรอกรายละเอียด..."
                className="w-full min-h-[80px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Image Upload */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <Label className="text-lg font-semibold">
                รูปภาพประกอบ (Attach Image) (Optional)
              </Label>
              <MultiImageUploader
                images={images}
                onImagesChange={setImages}
                urlFormatter={(image) => {
                  if (!image.file) {
                    return `https://firebasestorage.googleapis.com/v0/b/sccc-inseesafety-prod.firebasestorage.app/o/${encodeURIComponent(
                      image.url
                    )}?alt=media`;
                  }
                  return image.url;
                }}
                compressionType="general"
              />
            </div>
          </CardContent>
        </Card>

        {/* Remark */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label className="text-lg font-semibold">
                หมายเหตุ (Remark) (Optional)
              </Label>
              <Textarea
                {...register("remark")}
                placeholder="กรอกหมายเหตุ..."
                className="w-full min-h-[60px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 px-6 rounded-md shadow-lg text-lg"
        >
          {isSubmitting ? "Submitting..." : "ส่ง / Submit"}
        </Button>
      </form>
    </div>
  );
}