import React from 'react';
import { SlideData } from '../types';
import { Trash2, ArrowUp, Merge, LayoutTemplate, Download } from 'lucide-react';

interface SlideListProps {
  slides: SlideData[];
  onDeleteSlide: (id: string) => void;
  onDeleteImage: (slideId: string, imgId: string) => void;
  onMergeUp: (slideId: string) => void;
  onExport: () => void;
  onReorder: (dragIndex: number, hoverIndex: number) => void;
}

export const SlideList: React.FC<SlideListProps> = ({
  slides,
  onDeleteSlide,
  onDeleteImage,
  onMergeUp,
  onExport,
  onReorder
}) => {
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    // Mark this as an internal slide drag
    e.dataTransfer.setData("application/teacher-ppt-slide", "true");
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault(); // Necessary to allow dropping
    e.stopPropagation(); // Prevent bubbling to app container
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent bubbling
    if (draggedIndex === null) return;

    if (draggedIndex !== dropIndex) {
      onReorder(draggedIndex, dropIndex);
    }
    setDraggedIndex(null);
  };


  if (slides.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center">
        <LayoutTemplate className="w-12 h-12 mb-4 opacity-20" />
        <p>暂无幻灯片</p>
        <p className="text-sm mt-2">请从 PDF 中框选区域以生成幻灯片。</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
        <div>
          <h2 className="font-bold text-slate-800">幻灯片 ({slides.length})</h2>
          <p className="text-xs text-slate-500">预览列表</p>
        </div>
        <button
          onClick={onExport}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded shadow-sm text-sm font-medium transition-colors"
        >
          <Download className="w-4 h-4" />
          导出 PPT
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-100">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            className={`group relative bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden transition-opacity ${draggedIndex === index ? 'opacity-40 border-dashed border-indigo-400' : 'opacity-100'
              } cursor-move`}
          >

            {/* Slide Header */}
            <div className="bg-slate-50 border-b border-slate-100 px-3 py-2 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500">第 {index + 1} 页</span>
              <div className="flex items-center gap-1">
                {index > 0 && slide.images.length + slides[index - 1].images.length <= 2 && (
                  <button
                    onClick={() => onMergeUp(slide.id)}
                    title="合并到上一页"
                    className="p-1 text-slate-400 hover:text-blue-600 rounded hover:bg-blue-50"
                  >
                    <Merge className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => onDeleteSlide(slide.id)}
                  title="删除页面"
                  className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Slide Content Preview - Full Width */}
            <div className="p-3">
              <div className="aspect-video bg-white border border-slate-200 rounded relative flex flex-col p-2 gap-2">
                {slide.images.map((img, imgIndex) => (
                  <div key={img.id} className="relative group/img flex-1 flex items-start justify-start w-full overflow-hidden">
                    <img
                      src={img.dataUrl}
                      alt={`Clip ${imgIndex}`}
                      className="max-h-full max-w-full object-contain border border-transparent"
                      // Alignment: Left Top
                      style={{ alignSelf: 'flex-start' }}
                    />
                    <button
                      onClick={() => onDeleteImage(slide.id, img.id)}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover/img:opacity-100 transition-opacity shadow-sm"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};