import { Badge } from "./ui/badge";

const typeLabels: { [bu: string]: { [type: string]: string } } = {
  th: {
    sot: "กิจกรรมความปลอดภัย SOT and VFL",
    talk: "การพูดคุยกับพนักงาน / Talk",
    toolbox: "การพูดคุยด้านความปลอดภัย Safety / Toolbox Talk",
    coupon: "โทเคนสำหรับร้านอาหาร / Food Token",
    meeting: "การมีส่วนร่วมในเซฟตี้มีทติ้ง / Safety Meeting",
    alert: "ยืนยันการเข้าใจ Safety Alert / Safety Alert Acknowledgement",
    training: "การมีส่วนร่วมในเซฟตี้มีทติ้ง / Training record",
  },
  vn: {
    pra: "Đánh giá rủi ro cá nhân / Personal Risk Assessment",
    alert: "Cảnh báo an toàn / Safety Alert",
    boot: "Danh sách kiểm tra hạng mục An toàn / BOOT ON THE GROUND CHECK LIST",
    ra: "Danh sách kiểm tra đánh giá / Risk Assessmen Checklist",
    toolbox: "Thảo luận an toàn / Toolbox Talk",
    pto: "Quan sát công việc theo kế hoạch / Planned Task Observation",
    grease: "Phương pháp bơm mỡ / Greasing Method",
    lubrication: "Phương pháp bôi trơn / Lubrication Method",
  },
};

type BadgeVariant = "primary" | "warning" | "success" | "secondary" | "purple" | "pink" | "indigo" | "destructive";

const typeVariants: { [bu: string]: { [type: string]: BadgeVariant } } = {
  th: {
    sot: "primary",      // Blue for SOT (Safety Observation Tour)
    talk: "warning",     // Amber/Orange for Talk
    toolbox: "success",  // Green for Toolbox
    coupon: "pink",      // Pink for Food Token (friendly, food-related)
    meeting: "purple",   // Purple for Safety Meeting (formal, important)
    alert: "destructive", // Red for Safety Alert (urgent, attention-grabbing)
    training: "indigo",  // Indigo for Training (educational, professional)
  },
  vn: {
    pra: "primary",
    alert: "destructive",
    boot: "success",
    ra: "warning",
    toolbox: "success",
    pto: "purple",
    grease: "indigo",
    lubrication: "pink",
  },
};

interface ManTypeBadgeProps {
  type: string;
  bu?: string;
  className?: string;
}

export default function ManTypeBadge({ type, bu = 'th', className }: ManTypeBadgeProps) {
  const normalizedType = type.toLowerCase();

  // Get label and variant based on business unit and type
  const label = typeLabels[bu]?.[normalizedType] || type.toUpperCase();
  const variant = typeVariants[bu]?.[normalizedType] || "secondary";

  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
}