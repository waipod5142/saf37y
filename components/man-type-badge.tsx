import { Badge } from "./ui/badge";

const typeLabels: { [key: string]: string } = {
  sot: "กิจกรรมความปลอดภัย SOT and VFL",
  talk: "การพูดคุยกับพนักงาน / Talk",
  toolbox: "การพูดคุยด้านความปลอดภัย Safety / Toolbox Talk",
  coupon: "โทเคนสำหรับร้านอาหาร / Food Token",
  meeting: "การมีส่วนร่วมในเซฟตี้มีทติ้ง / Safety Meeting",
  alert: "ยืนยันการเข้าใจ Safety Alert / Safety Alert Acknowledgement",
  training: "การมีส่วนร่วมในเซฟตี้มีทติ้ง / Training record",
};

const typeVariants: {
  [key: string]: "primary" | "warning" | "success" | "secondary" | "purple" | "pink" | "indigo" | "destructive";
} = {
  sot: "primary",      // Blue for SOT (Safety Observation Tour)
  talk: "warning",     // Amber/Orange for Talk
  toolbox: "success",  // Green for Toolbox
  coupon: "pink",      // Pink for Food Token (friendly, food-related)
  meeting: "purple",   // Purple for Safety Meeting (formal, important)
  alert: "destructive", // Red for Safety Alert (urgent, attention-grabbing)
  training: "indigo",  // Indigo for Training (educational, professional)
};

interface ManTypeBadgeProps {
  type: string;
  className?: string;
}

export default function ManTypeBadge({ type, className }: ManTypeBadgeProps) {
  const normalizedType = type.toLowerCase();
  const label = typeLabels[normalizedType] || type.toUpperCase();
  const variant = typeVariants[normalizedType] || "secondary";

  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
}