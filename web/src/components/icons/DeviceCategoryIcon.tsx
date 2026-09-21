import React from "react";

export type DeviceCategory =
  | "water_meter"
  | "temperature_humidity"
  | "smart_building"
  | "rf_uhf_reader"
  | "camera"
  | "unknown";

interface DeviceCategoryIconProps {
  category: DeviceCategory | string;
  size?: number;
  className?: string;
}

export function DeviceCategoryIcon({
  category,
  size = 18,
  className = "",
}: DeviceCategoryIconProps) {
  const normalized = (category || "").toLowerCase();

  switch (normalized) {
    case "water_meter":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`shrink-0 ${className}`}
          aria-label="Đồng hồ nước"
        >
          <circle cx="12" cy="12" r="10" className="fill-blue-600/20 stroke-blue-500" strokeWidth="1.75" />
          <circle cx="12" cy="13" r="5" className="stroke-blue-400 fill-blue-950/60" strokeWidth="1.5" />
          <path d="M12 13L15 10" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M12 5C12 5 10 7.5 10 9C10 10.1 10.9 11 12 11C13.1 11 14 10.1 14 9C14 7.5 12 5 12 5Z" fill="#60A5FA" />
        </svg>
      );

    case "temperature_humidity":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`shrink-0 ${className}`}
          aria-label="Cảm biến nhiệt độ/độ ẩm"
        >
          <circle cx="12" cy="12" r="10" className="fill-cyan-600/20 stroke-cyan-500" strokeWidth="1.75" />
          {/* Thermometer */}
          <path d="M9 7C9 5.9 9.9 5 11 5C12.1 5 13 5.9 13 7V13.3C14.2 14.1 15 15.5 15 17C15 19.2 13.2 21 11 21C8.8 21 7 19.2 7 17C7 15.5 7.8 14.1 9 13.3V7Z" stroke="#22D3EE" strokeWidth="1.25" />
          <circle cx="11" cy="17" r="2.5" fill="#EF4444" />
          <path d="M11 11V15" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
          {/* Water drop */}
          <path d="M17 9C17 9 15.5 11 15.5 12.2C15.5 13 16.2 13.7 17 13.7C17.8 13.7 18.5 13 18.5 12.2C18.5 11 17 9 17 9Z" fill="#38BDF8" />
        </svg>
      );

    case "smart_building":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`shrink-0 ${className}`}
          aria-label="Smart Building"
        >
          <circle cx="12" cy="12" r="10" className="fill-orange-600/20 stroke-orange-500" strokeWidth="1.75" />
          {/* Small building */}
          <path d="M6 18V11H11V18H6Z" stroke="#FDBA74" strokeWidth="1.25" fill="#7C2D12/40" />
          {/* Main building */}
          <path d="M11 18V7H18V18H11Z" stroke="#FB923C" strokeWidth="1.25" fill="#431407/60" />
          {/* Windows */}
          <circle cx="8.5" cy="13.5" r="0.75" fill="#FEF08A" />
          <circle cx="13.5" cy="9.5" r="0.75" fill="#FEF08A" />
          <circle cx="15.5" cy="9.5" r="0.75" fill="#FEF08A" />
          <circle cx="13.5" cy="12.5" r="0.75" fill="#FEF08A" />
          <circle cx="15.5" cy="12.5" r="0.75" fill="#FEF08A" />
        </svg>
      );

    case "rf_uhf_reader":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`shrink-0 ${className}`}
          aria-label="RF UHF đọc thẻ"
        >
          <circle cx="12" cy="12" r="10" className="fill-green-600/20 stroke-green-500" strokeWidth="1.75" />
          {/* Card */}
          <rect x="6" y="9" width="10" height="7" rx="1" stroke="#4ADE80" strokeWidth="1.25" fill="#052E16/60" />
          <rect x="8" y="11" width="3" height="2" rx="0.5" fill="#FACC15" />
          {/* Radio wave arcs */}
          <path d="M17 9C18.5 10.2 19.5 11.5 19.5 13" stroke="#86EFAC" strokeWidth="1.25" strokeLinecap="round" />
          <path d="M19 7C21 8.5 22 10.5 22 13" stroke="#BBF7D0" strokeWidth="1.25" strokeLinecap="round" />
        </svg>
      );

    case "camera":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`shrink-0 ${className}`}
          aria-label="Camera"
        >
          <circle cx="12" cy="12" r="10" className="fill-fuchsia-600/20 stroke-fuchsia-500" strokeWidth="1.75" />
          {/* Camera body */}
          <path d="M6 9H13L15 8H18V13H15L13 12H6V9Z" stroke="#F472B6" strokeWidth="1.25" fill="#701A75/60" />
          <circle cx="10" cy="10.5" r="1.5" fill="#F43F5E" />
          {/* Stand */}
          <path d="M8 12V15H11" stroke="#F472B6" strokeWidth="1.25" strokeLinecap="round" />
        </svg>
      );

    case "unknown":
    default:
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`shrink-0 ${className}`}
          aria-label="Chưa phân loại"
        >
          <circle cx="12" cy="12" r="10" className="fill-slate-600/20 stroke-slate-400" strokeWidth="1.75" />
          {/* Chip/generic sensor */}
          <rect x="8" y="8" width="8" height="8" rx="1.5" stroke="#94A3B8" strokeWidth="1.25" fill="#1E293B" />
          <circle cx="12" cy="12" r="1.5" fill="#CBD5E1" />
          {/* Pins */}
          <path d="M10 6V8M14 6V8M10 16V18M14 16V18M6 10H8M6 14H8M16 10H18M16 14H18" stroke="#64748B" strokeWidth="1" strokeLinecap="round" />
        </svg>
      );
  }
}

