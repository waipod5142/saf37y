"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Video, ChevronDown, ChevronUp } from "lucide-react";

interface MachineInductionProps {
  bu: string;
  type: string;
  id: string;
}

interface InductionMaterial {
  title: string;
  url: string;
  type: "pdf" | "video";
  language?: string;
}

export default function MachineInduction({
  bu,
  type,
  id,
}: MachineInductionProps) {
  const [expandedSections, setExpandedSections] = useState<{
    [key: string]: boolean;
  }>({
    pdf: true,
    video: true,
  });

  // Only show for bu=vn and type=plantaccess, or bu=lk and id=rmx
  const showForVietnam = bu === "vn" && type.toLowerCase() === "plantaccess";
  const showForSriLanka = bu === "lk" && id.toLowerCase() === "rmx";

  if (!showForVietnam && !showForSriLanka) {
    return null;
  }

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Define induction materials based on plant ID
  const getInductionMaterials = (): {
    pdfs: InductionMaterial[];
    videos: InductionMaterial[];
  } => {
    const plantId = id.toLowerCase();

    // Sri Lanka RMX induction materials
    if (bu === "lk" && plantId === "rmx") {
      return {
        pdfs: [
          {
            title: "RMX Safety Induction (English)",
            url: "https://firebasestorage.googleapis.com/v0/b/sccc-inseesafety-prod.firebasestorage.app/o/Video%2FInduction%20PPT%20RMX%20English.pdf?alt=media&token=6fb2df3e-1a97-4a73-a11e-bae6a4b71d04",
            type: "pdf",
            language: "English",
          },
          {
            title: "RMX Safety Induction (Sinhala)",
            url: "https://firebasestorage.googleapis.com/v0/b/sccc-inseesafety-prod.firebasestorage.app/o/Video%2FInduction%20PPT%20RMX%20Sinhala.pdf?alt=media&token=5cabaf0c-d50a-4c4e-997b-a1cef7a80d58",
            type: "pdf",
            language: "Sinhala",
          },
        ],
        videos: [],
      };
    }

    if (plantId === "honc") {
      return {
        pdfs: [
          {
            title: "HONC Safety Induction for Visitor 2024 (Vietnamese)",
            url: "https://firebasestorage.googleapis.com/v0/b/sccc-inseesafety-prod.firebasestorage.app/o/Video%2FHONC%20Safety%20Induction%20for%20Visitor%202024_VN_V2.pdf?alt=media&token=7c0179f4-20a5-4884-acf7-7c17d1e9005e",
            type: "pdf",
            language: "Vietnamese",
          },
          {
            title: "HONC Safety Induction for Visitor 2024 (English)",
            url: "https://firebasestorage.googleapis.com/v0/b/sccc-inseesafety-prod.firebasestorage.app/o/Video%2FHONC%20Safety%20Induction%20for%20Visitor%202024_EN_V2.pdf?alt=media&token=cd2b2a1b-2e2d-4672-8d97-dc8dd3d1a728",
            type: "pdf",
            language: "English",
          },
        ],
        videos: [
          {
            title: "HONC Safety Induction Video",
            url: "https://firebasestorage.googleapis.com/v0/b/sccc-inseesafety-prod.firebasestorage.app/o/Video%2FHONC%20Safety%20Induction%20video_31_5_2023.mp4?alt=media&token=29efa2ae-2b25-41da-8103-dfb45df8146e",
            type: "video",
          },
        ],
      };
    } else if (plantId === "catl") {
      return {
        pdfs: [
          {
            title: "CATL Safety Induction 2024",
            url: "https://firebasestorage.googleapis.com/v0/b/sccc-inseesafety-prod.firebasestorage.app/o/Video%2FCATL%20Safety%20Induction%202024.pdf?alt=media&token=8af2f506-42dd-4867-8c2c-dddb4100a37e",
            type: "pdf",
          },
        ],
        videos: [
          {
            title: "Cat Lai Safety Induction Video",
            url: "https://firebasestorage.googleapis.com/v0/b/sccc-inseesafety-prod.firebasestorage.app/o/Video%2FC%C3%A1t%20L%C3%A1i%2030%2005%20-%20Voice%20Over.mp4?alt=media&token=b277359d-8db6-45b0-b7fb-5da7d0547734",
            type: "video",
          },
        ],
      };
    } else if (plantId === "thiv") {
      return {
        pdfs: [
          {
            title: "Thi Vai Safety Induction for Visitor 2024 (Vietnamese)",
            url: "https://firebasestorage.googleapis.com/v0/b/sccc-inseesafety-prod.firebasestorage.app/o/Video%2FH%C6%B0%E1%BB%9Bng%20d%E1%BA%ABn%20An%20to%C3%A0n%20cho%20Kh%C3%A1ch%20tham%20quan%20Thi%20Vai%20%202024_VN_V2.pdf?alt=media&token=4b07848e-dd38-49b8-beaa-a96c773df34b",
            type: "pdf",
            language: "Vietnamese",
          },
          {
            title: "THIV Safety Induction for Visitor 2024 (English)",
            url: "https://firebasestorage.googleapis.com/v0/b/sccc-inseesafety-prod.firebasestorage.app/o/Video%2FTHIV%20Safety%20Induction%20for%20Visitor%202024_EN_V2.pdf?alt=media&token=75ad7cf0-928d-419f-bd22-29212c7973aa",
            type: "pdf",
            language: "English",
          },
        ],
        videos: [
          {
            title: "THI VAI Safety Induction Video",
            url: "https://firebasestorage.googleapis.com/v0/b/sccc-inseesafety-prod.firebasestorage.app/o/Video%2FTHI%20VAI%20Safety%20Induction%20Video_31_05_2023.MP4?alt=media&token=939004bc-b336-4b81-83d2-5f1c2ba0100e",
            type: "video",
          },
        ],
      };
    } else if (plantId === "ho") {
      return {
        pdfs: [],
        videos: [
          {
            title: "HO Safety Induction Video",
            url: "https://firebasestorage.googleapis.com/v0/b/sccc-inseesafety-prod.firebasestorage.app/o/Video%2FHO%2019_5_2023%20-%20voice%20over_mp4.mp4?alt=media&token=4d018d37-3231-442d-bd09-12f6caf6e888",
            type: "video",
          },
        ],
      };
    } else if (plantId === "hiep") {
      return {
        pdfs: [],
        videos: [
          {
            title: "Hiep Phuoc Safety Induction Video",
            url: "https://firebasestorage.googleapis.com/v0/b/sccc-inseesafety-prod.firebasestorage.app/o/Video%2FHi%E1%BB%87p%20Ph%C6%B0%E1%BB%9Bc%201205%20-%20Voice%20Over_mp4.mp4?alt=media&token=b6e70a8a-1cfe-4f80-99b3-939ef04641eb",
            type: "video",
          },
        ],
      };
    }

    return { pdfs: [], videos: [] };
  };

  const { pdfs, videos } = getInductionMaterials();

  // Don't show component if no materials available
  if (pdfs.length === 0 && videos.length === 0) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-center text-2xl font-bold text-blue-600">
          Safety Induction Materials
        </CardTitle>
        <p className="text-center text-sm text-gray-600 mt-2">
          Please review the safety induction materials before entering the plant
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* PDF Documents Section */}
        {pdfs.length > 0 && (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection("pdf")}
              className="w-full flex items-center justify-between p-4 bg-blue-50 hover:bg-blue-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-lg">
                  Safety Induction Documents ({pdfs.length})
                </h3>
              </div>
              {expandedSections.pdf ? (
                <ChevronUp className="h-5 w-5 text-blue-600" />
              ) : (
                <ChevronDown className="h-5 w-5 text-blue-600" />
              )}
            </button>

            {expandedSections.pdf && (
              <div className="p-4 space-y-3 bg-white">
                {pdfs.map((pdf, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-md hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{pdf.title}</p>
                      {pdf.language && (
                        <p className="text-sm text-gray-500 mt-1">
                          Language: {pdf.language}
                        </p>
                      )}
                    </div>
                    <a
                      href={pdf.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        type="button"
                        variant="outline"
                        className="ml-4 flex items-center gap-2"
                      >
                        <FileText className="h-4 w-4" />
                        View PDF
                      </Button>
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Video Section */}
        {videos.length > 0 && (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection("video")}
              className="w-full flex items-center justify-between p-4 bg-green-50 hover:bg-green-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Video className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold text-lg">
                  Safety Induction Videos ({videos.length})
                </h3>
              </div>
              {expandedSections.video ? (
                <ChevronUp className="h-5 w-5 text-green-600" />
              ) : (
                <ChevronDown className="h-5 w-5 text-green-600" />
              )}
            </button>

            {expandedSections.video && (
              <div className="p-4 space-y-4 bg-white">
                {videos.map((video, index) => (
                  <div key={index} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-800">{video.title}</p>
                      <a
                        href={video.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <Video className="h-4 w-4" />
                          Open in New Tab
                        </Button>
                      </a>
                    </div>
                    <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
                      <video
                        controls
                        className="w-full h-full"
                        preload="metadata"
                      >
                        <source src={video.url} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Important Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-gray-700">
            <strong className="text-yellow-800">Important:</strong> All
            visitors must review and understand the safety induction materials
            before entering the plant premises. If you have any questions about
            safety procedures, please contact plant personnel.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
