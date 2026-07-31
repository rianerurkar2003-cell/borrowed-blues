const STYLES = {
  completed: "bg-bb-moss/70 text-bb-forest",
  requested: "bg-bb-blue-2 text-bb-forest",
  cancelled: "bg-[#f2dede] text-[#8a3a1c]",
};
const DEFAULT_STYLE = "bg-bb-forest text-bb-cream"; // scheduled + any other status

export default function StatusBadge({ status, className = "" }) {
  return (
    <span className={`text-xs px-3 py-1 rounded-full capitalize ${STYLES[status] || DEFAULT_STYLE} ${className}`}>
      {status}
    </span>
  );
}
