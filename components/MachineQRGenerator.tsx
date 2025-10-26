"use client";

import { Machine } from "@/types/machine";
import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { jsPDF } from "jspdf";
import { Button } from "./ui/button";
import { Download } from "lucide-react";
import { getMachineEmoji } from "@/lib/machine-types";

interface MachineQRGeneratorProps {
  machines: (Machine & { machineKey: string })[];
  onClose?: () => void;
}

interface MachineWithTitle extends Machine {
  machineKey: string;
  formTitle?: string;
  emoji?: string;
}

export function MachineQRGenerator({
  machines,
  onClose,
}: MachineQRGeneratorProps) {
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const [machinesWithTitles, setMachinesWithTitles] = useState<
    MachineWithTitle[]
  >([]);
  const [isLoadingTitles, setIsLoadingTitles] = useState(true);

  // Fetch form titles for all machines
  useEffect(() => {
    const fetchTitles = async () => {
      setIsLoadingTitles(true);
      const machinesWithData = await Promise.all(
        machines.map(async (machine) => {
          try {
            const response = await fetch(
              `/api/form-title?bu=${machine.bu}&type=${machine.type}`
            );
            const data = await response.json();
            const emoji = getMachineEmoji(machine.type);

            return {
              ...machine,
              formTitle: data.title || undefined,
              emoji: emoji || undefined,
            };
          } catch (error) {
            console.error(
              "Error fetching title for machine:",
              machine.id,
              error
            );
            const emoji = getMachineEmoji(machine.type);
            return {
              ...machine,
              formTitle: undefined,
              emoji: emoji || undefined,
            };
          }
        })
      );
      setMachinesWithTitles(machinesWithData);
      setIsLoadingTitles(false);
    };

    fetchTitles();
  }, [machines]);

  // Generate QR codes
  useEffect(() => {
    if (!isLoadingTitles && machinesWithTitles.length > 0) {
      machinesWithTitles.forEach((machine, index) => {
        const canvas = canvasRefs.current[index];
        if (canvas) {
          // Capitalize first letter of type
          const typeCapitalized = machine.type
            ? machine.type.charAt(0).toUpperCase() + machine.type.slice(1)
            : "";

          // Determine URL based on type
          const formTypes = [
            "boot",
            "alert",
            "ra",
            "pto",
            "meeting",
            "training",
            "pra",
          ];
          const isFormType = formTypes.includes(machine.type.toLowerCase());

          const qrUrl = isFormType
            ? `https://www.saf37y.com/ManForm/${machine.bu}/${typeCapitalized}Form/${machine.id}`
            : `https://www.saf37y.com/Machine/${machine.bu}/${typeCapitalized}/${machine.id}`;

          QRCode.toCanvas(
            canvas,
            qrUrl,
            {
              width: 200,
              margin: 1,
              color: {
                dark: "#000000",
                light: "#FFFFFF",
              },
            },
            (error) => {
              if (error) {
                console.error("QR Code generation error:", error);
              }
            }
          );
        }
      });
    }
  }, [machinesWithTitles, isLoadingTitles]);

  const generatePDF = async () => {
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = 210; // A4 width in mm
    const margin = 6;
    const cardsPerRow = 3; // 3 columns
    const cardWidth = (pageWidth - margin * 4) / cardsPerRow; // ~62mm per card
    const cardHeight = 90; // Height for better spacing
    const cardsPerPage = 9; // 3x3 grid

    for (let i = 0; i < machinesWithTitles.length; i++) {
      const machine = machinesWithTitles[i];
      const canvas = canvasRefs.current[i];

      // Add new page if needed (except for first item)
      if (i > 0 && i % cardsPerPage === 0) {
        pdf.addPage();
      }

      // Calculate position
      const cardIndex = i % cardsPerPage;
      const row = Math.floor(cardIndex / cardsPerRow);
      const col = cardIndex % cardsPerRow;
      const x = margin + col * (cardWidth + margin);
      const y = margin + row * (cardHeight + margin);

      // Draw border
      pdf.setDrawColor(0);
      pdf.setLineWidth(0.5);
      pdf.rect(x, y, cardWidth, cardHeight);

      const centerX = x + cardWidth / 2;
      let currentY = y + 3;

      // Add form title with text wrapping
      const title = machine.formTitle || "Daily Inspection";
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      const titleLines = pdf.splitTextToSize(title, cardWidth - 6);

      titleLines.forEach((line: string, idx: number) => {
        pdf.text(line, centerX, currentY + idx * 3.5, { align: "center" });
      });

      currentY += titleLines.length * 3.5 + 2;

      // Add QR Code (centered)
      const qrSize = 38;
      const qrX = centerX - qrSize / 2;

      if (canvas) {
        const qrDataUrl = canvas.toDataURL("image/png");
        pdf.addImage(qrDataUrl, "PNG", qrX, currentY, qrSize, qrSize);
      }

      currentY += qrSize + 5;

      // Add ID below QR code in BOLD (centered)
      const idText = machine.id || "";
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(0, 0, 255);
      pdf.text(idText, centerX, currentY, { align: "center" });
      pdf.setTextColor(0, 0, 0);

      currentY += 5;

      // Add machine details
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");
      const lineHeight = 3.5;

      const addDetail = (value: string | undefined) => {
        if (value && currentY + 3 < y + cardHeight - 2) {
          const lines = pdf.splitTextToSize(value, cardWidth - 6);
          lines.forEach((line: string) => {
            pdf.text(line, centerX, currentY, { align: "center" });
            currentY += lineHeight;
          });
        }
      };

      // Add machine details (values only, no labels)
      if (machine.kind) addDetail(machine.kind);
      if (machine.area) addDetail(machine.area);
      if (machine.swl) addDetail(machine.swl);
      if (machine.owner) addDetail(machine.owner);
      if (machine.department) addDetail(machine.department);
      if (machine.place) addDetail(machine.place);
      if (machine.name) addDetail(machine.name);
    }

    // Download PDF
    const filename = `machine-qr-codes-${new Date().getTime()}.pdf`;
    pdf.save(filename);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 justify-end mb-4">
        <Button onClick={() => generatePDF()} className="gap-2">
          <Download className="h-4 w-4" />
          Download PDF
        </Button>
      </div>

      {/* Preview Grid */}
      <div className="grid grid-cols-3 gap-4 max-h-[500px] overflow-y-auto border rounded-lg p-4">
        {isLoadingTitles ? (
          <div className="col-span-3 text-center py-8">
            <p className="text-sm text-gray-500">Loading machine data...</p>
          </div>
        ) : (
          machinesWithTitles.map((machine, index) => {
            return (
              <div
                key={machine.machineKey}
                className="border rounded-lg p-3 space-y-2"
              >
                <div className="text-center">
                  <p className="font-bold text-xs">
                    {machine.formTitle || "Daily Inspection"}
                  </p>
                  {/* <p className="text-blue-600 font-bold text-xs">{machine.bu?.toUpperCase()}</p> */}
                </div>

                <div className="flex flex-col items-center gap-1">
                  <canvas
                    ref={(el) => {
                      canvasRefs.current[index] = el;
                    }}
                    className="w-20 h-20 border"
                  />
                  <p className="font-bold text-sm text-blue-600">
                    {machine.id}
                  </p>

                  <div className="w-full text-xs space-y-0.5 text-center">
                    {machine.emoji && (
                      <p className="text-lg">{machine.emoji}</p>
                    )}
                    {machine.kind && <p>{machine.kind}</p>}
                    {machine.area && <p>{machine.area}</p>}
                    {machine.swl && <p>{machine.swl}</p>}
                    {machine.owner && <p>{machine.owner}</p>}
                    {machine.department && <p>{machine.department}</p>}
                    {machine.place && <p>{machine.place}</p>}
                    {machine.name && <p>{machine.name}</p>}
                  </div>
                </div>

                {/* <p className="text-xs text-gray-500">
                  {machine.owner || machine.department || "Insee"}
                </p> */}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
