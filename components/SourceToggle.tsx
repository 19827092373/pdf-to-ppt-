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
          relative flex items-center gap-2.5 text-sm font-medium transition-all duration-200
          ${showSourceLabel
            ? 'text-white bg-gradient-to-r from-indigo-500 to-indigo-600 shadow-md hover:shadow-lg hover:from-indigo-600 hover:to-indigo-700'
            : 'text-slate-600 bg-white border-2 border-slate-200 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 shadow-sm hover:shadow-md'
          }
          px-4 py-2.5 rounded-xl cursor-pointer select-none w-full justify-center group
        `}
      >
        <Tag size={16} className={showSourceLabel ? 'text-white' : 'text-slate-400 group-hover:text-indigo-500'} />
        <span>显示图片来源</span>

        {/* 切换指示器 */}
        <div className="ml-auto flex items-center">
          <div className={`
            w-10 h-5 rounded-full relative transition-colors duration-200
            ${showSourceLabel ? 'bg-white/30' : 'bg-slate-200 group-hover:bg-indigo-200'}
          `}>
            <div className={`
              absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform duration-200 shadow-sm
              ${showSourceLabel ? 'translate-x-5 bg-white' : 'translate-x-0 bg-white'}
            `} />
          </div>
        </div>

        {/* 悬停提示 */}
        <div className="
          absolute right-full mr-2 px-2 py-1 bg-slate-800 text-white text-xs rounded
          opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none
          -top-1
        ">
          点击切换
        </div>
      </button>
    </div>
  );
}
