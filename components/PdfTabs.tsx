import { X, Plus } from 'lucide-react';
import { PdfMetadata } from '../types';

interface PdfTabsProps {
  pdfDocuments: PdfMetadata[];
  activePdfIndex: number;
  onTabClick: (index: number) => void;
  onRemovePdf: (index: number) => void;
  onAddPdf: () => void;
  maxPdfs: number;
}

export default function PdfTabs({
  pdfDocuments,
  activePdfIndex,
  onTabClick,
  onRemovePdf,
  onAddPdf,
  maxPdfs,
}: PdfTabsProps) {
  if (pdfDocuments.length <= 1) {
    return null; // 单PDF时不显示标签栏
  }

  const canAddMore = pdfDocuments.length < maxPdfs;

  // 截断过长的文件名
  const truncateFileName = (fileName: string, maxLength: number = 15) => {
    if (fileName.length <= maxLength) return fileName;
    return fileName.substring(0, maxLength - 3) + '...';
  };

  return (
    <div className="flex items-center gap-2 mb-4 p-2 bg-gray-50 rounded-lg border border-gray-200">
      {pdfDocuments.map((pdf, index) => (
        <button
          key={pdf.id}
          onClick={() => onTabClick(index)}
          className={`
            relative group flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-all
            ${
              index === activePdfIndex
                ? 'bg-blue-500 text-white shadow-sm'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }
          `}
        >
          <span>{truncateFileName(pdf.fileName)}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemovePdf(index);
            }}
            className={`
              p-0.5 rounded transition-opacity
              ${index === activePdfIndex
                ? 'hover:bg-blue-400'
                : 'hover:bg-gray-200'
              }
              opacity-0 group-hover:opacity-100
            `}
            title="移除此PDF"
          >
            <X size={14} />
          </button>
        </button>
      ))}

      {canAddMore && (
        <button
          onClick={onAddPdf}
          className="
            flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm
            bg-white text-gray-600 border border-dashed border-gray-300
            hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50
            transition-all
          "
          title="添加PDF"
        >
          <Plus size={16} />
          <span>添加PDF</span>
        </button>
      )}
    </div>
  );
}
