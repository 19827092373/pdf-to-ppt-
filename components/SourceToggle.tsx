import { Tag } from 'lucide-react';

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
    <div className="px-4 py-3 border-b border-slate-100">
      <button
        onClick={() => onToggle(!showSourceLabel)}
        className={`
          flex items-center gap-2 text-sm font-medium transition-all
          ${showSourceLabel
            ? 'text-indigo-600 bg-indigo-50'
            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }
          px-3 py-2 rounded-lg cursor-pointer select-none w-full
        `}
      >
        <Tag size={16} />
        <span>显示图片来源</span>
        {showSourceLabel && (
          <span className="ml-auto text-xs text-indigo-500 font-medium">已开启</span>
        )}
      </button>
    </div>
  );
}
