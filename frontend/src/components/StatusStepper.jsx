import { Check } from "lucide-react";

const STEPS = [
  { key: "requested", label: "Requested" },
  { key: "accepted", label: "Accepted" },
  { key: "in_progress", label: "In Progress" },
  { key: "completed", label: "Completed" },
];

export default function StatusStepper({ status }) {
  if (status === "cancelled") {
    return (
      <div className="bg-red-50 text-red-600 text-sm font-medium px-4 py-2 rounded-xl inline-block">
        Booking Cancelled
      </div>
    );
  }

  const currentIndex = STEPS.findIndex((s) => s.key === status);

  return (
    <div className="flex items-center w-full">
      {STEPS.map((step, i) => {
        const done = i <= currentIndex;
        const isLast = i === STEPS.length - 1;
        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                  done ? "bg-primary text-white" : "bg-slate-200 text-slate-500"
                }`}
              >
                {done ? <Check size={14} /> : i + 1}
              </div>
              <span className={`text-[11px] mt-1 ${done ? "text-primary font-medium" : "text-slate-400"}`}>
                {step.label}
              </span>
            </div>
            {!isLast && <div className={`h-0.5 flex-1 mx-1 ${i < currentIndex ? "bg-primary" : "bg-slate-200"}`} />}
          </div>
        );
      })}
    </div>
  );
}
