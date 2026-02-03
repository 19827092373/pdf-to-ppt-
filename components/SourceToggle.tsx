interface SourceToggleProps {
  showSourceLabel: boolean;
  onToggle: (show: boolean) => void;
  hasMultiplePdfs: boolean;
}

export default function SourceToggle({
  showSourceLabel,
  onToggle,
  hasMultiplePdfs,
}: SourceToggleProps) {
  if (!hasMultiplePdfs) {
    return null; // 单PDF时不显示来源开关
  }

  return (
    <label className="flex items-center gap-2 text-sm text-gray-600 mb-3 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={showSourceLabel}
        onChange={(e) => onToggle(e.target.checked)}
        className="w-4 h-4 text-blue-500 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
      />
      <span>显示图片来源</span>
    </label>
  );
}
