import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { PdfCropper } from './components/PdfCropper';
import { SlideList } from './components/SlideList';
import PdfTabs from './components/PdfTabs';
import SourceToggle from './components/SourceToggle';
import { generatePPT } from './utils/pptGenerator';
import { SlideData, CroppedImage, PdfMetadata } from './types';
import { FileUp, BookOpen, AlertCircle, CodeXml, CheckCircle } from 'lucide-react';

// Maximum number of PDFs allowed
const MAX_PDFS = 3;

// PDF设置接口
interface PdfSettings {
  zoom: number;
  rotation: number;
  renderScale: number;
  currentPage: number;
}

const App: React.FC = () => {
  // Multi-PDF state management
  const [pdfDocuments, setPdfDocuments] = useState<PdfMetadata[]>([]);
  const [activePdfIndex, setActivePdfIndex] = useState(0);
  const [showSourceLabel, setShowSourceLabel] = useState(false);

  // Per-PDF settings (zoom, rotation, renderScale, currentPage)
  const [pdfSettings, setPdfSettings] = useState<Record<number, PdfSettings>>({});

  const [slides, setSlides] = useState<SlideData[]>([]);
  const [fileName, setFileName] = useState<string>("presentation");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  // File name editing
  const [isEditingFileName, setIsEditingFileName] = useState(false);
  const [customFileName, setCustomFileName] = useState(fileName);

  // Undo history
  const [history, setHistory] = useState<SlideData[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Ref for file input to trigger clicks
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle drag and drop
  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();

    // Disable drag upload in workspace (edit mode) - only allow drag when we have fewer than MAX PDFs
    if (pdfDocuments.length >= MAX_PDFS) return;

    // Only show overlay if dragging files (not internal elements like slides)
    if (e.dataTransfer.types.includes("Files")) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    // Only set to false if we are leaving the main container
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    // Disable drop when we have reached max PDFs
    if (pdfDocuments.length >= MAX_PDFS) return;

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError("请上传有效的 PDF 文件。");
      return;
    }

    processFile(file);
  };

  const processFile = (file: File, isReplacement: boolean = false, replaceIndex?: number) => {
    setIsLoading(true);
    setError(null);

    // Check for duplicate file names (only for multiple PDFs)
    const fileNameWithoutExt = file.name.replace('.pdf', '');
    const isDuplicate = pdfDocuments.some(pdf => pdf.fileName === fileNameWithoutExt);

    if (isDuplicate && pdfDocuments.length > 0) {
      setIsLoading(false);
      setError(`文件 "${file.name}" 已存在，请使用不同名称的文件。`);
      setTimeout(() => setError(null), 3000);
      return;
    }

    // Set filename based on first PDF or keep existing
    if (pdfDocuments.length === 0) {
      setFileName(fileNameWithoutExt);
      setCustomFileName(fileNameWithoutExt);
    }

    // Check if PDF.js library is loaded
    if (!window.pdfjsLib) {
      setIsLoading(false);
      setError("PDF.js 库未加载，请刷新页面重试。");
      return;
    }

    const fileReader = new FileReader();
    fileReader.onload = async function () {
      const typedarray = new Uint8Array(this.result as ArrayBuffer);
      try {
        const loadingTask = window.pdfjsLib!.getDocument(typedarray);
        const pdf = await loadingTask.promise;

        const newPdf: PdfMetadata = {
          document: pdf,
          fileName: fileNameWithoutExt,
          id: uuidv4(),
        };

        if (isReplacement && replaceIndex !== undefined) {
          // Replace existing PDF
          setPdfDocuments(prev => {
            const updated = [...prev];
            updated[replaceIndex] = newPdf;
            return updated;
          });
        } else {
          // Add new PDF
          setPdfDocuments(prev => [...prev, newPdf]);
          // If this is the first PDF or an addition, switch to it
          setActivePdfIndex(pdfDocuments.length);
        }

        // Only reset slides if this is the first PDF
        if (pdfDocuments.length === 0) {
          setSlides([]);
          setHistory([[]]);
          setHistoryIndex(0);
        }
      } catch (err) {
        console.error(err);
        setError("无法加载 PDF，请尝试其他文件。");
      } finally {
        setIsLoading(false);
      }
    };
    fileReader.readAsArrayBuffer(file);
  };

  // Handle file upload
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError("请上传有效的 PDF 文件。");
      return;
    }

    // Check if we've reached the maximum number of PDFs
    if (pdfDocuments.length >= MAX_PDFS) {
      setError(`最多支持 ${MAX_PDFS} 个 PDF 文件。`);
      setTimeout(() => setError(null), 3000);
      return;
    }

    processFile(file);

    // Reset the input value so the same file can be selected again if needed
    event.target.value = '';
  };

  // Trigger file input click
  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  // Get default settings for a new PDF
  const getDefaultSettings = (): PdfSettings => ({
    zoom: 1.0,
    rotation: 0,
    renderScale: 2.0,
    currentPage: 1,
  });

  // Get settings for current PDF, or defaults if not set
  const getCurrentPdfSettings = (): PdfSettings => {
    return pdfSettings[activePdfIndex] || getDefaultSettings();
  };

  // Update a specific setting for the current PDF
  const updatePdfSetting = <K extends keyof PdfSettings>(key: K, value: PdfSettings[K]) => {
    setPdfSettings(prev => ({
      ...prev,
      [activePdfIndex]: {
        ...(prev[activePdfIndex] || getDefaultSettings()),
        [key]: value,
      },
    }));
  };

  // Handle PDF removal - also clean up settings
  const handleRemovePdf = (index: number) => {
    setPdfDocuments(prev => {
      const updated = prev.filter((_, i) => i !== index);

      // Clean up settings for removed PDF and reindex
      setPdfSettings(settings => {
        const newSettings: Record<number, PdfSettings> = {};
        Object.entries(settings).forEach(([idx, setting]) => {
          const numIdx = parseInt(idx);
          if (numIdx < index) {
            // Keep settings for PDFs before the removed one
            newSettings[numIdx] = setting;
          } else if (numIdx > index) {
            // Shift settings for PDFs after the removed one
            newSettings[numIdx - 1] = setting;
          }
        });
        return newSettings;
      });

      // Adjust active index if needed
      if (activePdfIndex >= updated.length && updated.length > 0) {
        setActivePdfIndex(updated.length - 1);
      } else if (updated.length === 0) {
        // No PDFs left, reset everything
        setSlides([]);
        setHistory([[]]);
        setHistoryIndex(0);
        setFileName("presentation");
        setCustomFileName("presentation");
        setPdfSettings({});
      }

      return updated;
    });
  };

  // Handle PDF tab click
  const handleTabClick = (index: number) => {
    setActivePdfIndex(index);
  };

  // Get the currently active PDF document
  const activePdfDocument = pdfDocuments[activePdfIndex]?.document || null;

  // Undo history functions
  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setSlides(history[newIndex]);
    }
  };

  const addToHistory = (newSlides: SlideData[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newSlides);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // Keyboard shortcut for undo (Ctrl+Z / Cmd+Z)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [history, historyIndex]);

  // When a crop happens, create a new slide with source info
  const handleCropComplete = (image: CroppedImage, pageNumber?: number) => {
    const activePdf = pdfDocuments[activePdfIndex];

    const imageWithSource: CroppedImage = {
      ...image,
      sourcePdfName: activePdf?.fileName,
      sourcePageNumber: pageNumber,
    };

    const newSlide: SlideData = {
      id: uuidv4(),
      images: [imageWithSource]
    };
    setSlides(prev => {
      const newSlides = [...prev, newSlide];
      addToHistory(newSlides);
      return newSlides;
    });
  };

  const handleDeleteSlide = (id: string) => {
    setSlides(prev => {
      const newSlides = prev.filter(s => s.id !== id);
      addToHistory(newSlides);
      return newSlides;
    });
  };

  const handleDeleteImage = (slideId: string, imgId: string) => {
    setSlides(prev => {
      const newSlides = prev.map(slide => {
        if (slide.id !== slideId) return slide;
        const newImages = slide.images.filter(img => img.id !== imgId);
        // If no images left, user can delete the empty slide manually or we can keep it empty
        return { ...slide, images: newImages };
      }).filter(slide => slide.images.length > 0); // Auto remove empty slides for cleaner UX
      addToHistory(newSlides);
      return newSlides;
    });
  };

  // Merge the specified slide into the previous one
  const handleMergeUp = (slideId: string) => {
    const index = slides.findIndex(s => s.id === slideId);
    if (index <= 0) return;

    const currentSlide = slides[index];
    const prevSlide = slides[index - 1];

    // Check if we can merge (max 2 images recommended for this layout)
    if (prevSlide.images.length + currentSlide.images.length > 2) {
      setError("无法合并：每页幻灯片最多允许 2 张图片。");
      // Clear error after 3 seconds
      setTimeout(() => setError(null), 3000);
      return;
    }

    const mergedSlide = {
      ...prevSlide,
      images: [...prevSlide.images, ...currentSlide.images]
    };

    const newSlides = [...slides];
    newSlides[index - 1] = mergedSlide;
    newSlides.splice(index, 1); // Remove the current one

    setSlides(newSlides);
    addToHistory(newSlides);
  };

  // Reorder slides
  const handleReorderSlides = (dragIndex: number, hoverIndex: number) => {
    const dragSlide = slides[dragIndex];
    if (!dragSlide) return;

    const newSlides = [...slides];
    newSlides.splice(dragIndex, 1);
    newSlides.splice(hoverIndex, 0, dragSlide);
    setSlides(newSlides);
    addToHistory(newSlides);
  };

  const handleExport = async () => {
    if (slides.length === 0) {
      setError("请先添加至少一张幻灯片。");
      setTimeout(() => setError(null), 3000);
      return;
    }
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await generatePPT(slides, `${fileName}_习题.pptx`);
      setSuccess("PPT 导出成功！");
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      console.error(e);
      setError("生成 PPT 文件时出错，请重试。");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="flex flex-col h-screen overflow-hidden text-slate-800 relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Full Screen Drag Overlay */}
      {isDragOver && (
        <div className="absolute inset-0 bg-indigo-50/90 z-50 flex items-center justify-center border-4 border-indigo-500 border-dashed rounded-xl m-4 pointer-events-none transition-all duration-200">
          <div className="text-center">
            <FileUp className="w-20 h-20 text-indigo-500 mx-auto mb-4" />
            <h3 className="text-3xl font-bold text-indigo-700">释放即可上传</h3>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 justify-between shadow-sm z-30">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg text-white">
            <BookOpen className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
            教师 PDF 转 PPT 工具
          </h1>
        </div>

        {pdfDocuments.length > 0 && (
          <div className="flex items-center gap-4 text-sm">
            {isEditingFileName ? (
              <input
                type="text"
                value={customFileName}
                onChange={(e) => setCustomFileName(e.target.value)}
                onBlur={() => {
                  setIsEditingFileName(false);
                  if (customFileName.trim()) {
                    setFileName(customFileName.trim());
                  } else {
                    setCustomFileName(fileName);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.currentTarget.blur();
                  } else if (e.key === 'Escape') {
                    setCustomFileName(fileName);
                    setIsEditingFileName(false);
                  }
                }}
                className="px-2 py-1 border border-indigo-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                autoFocus
              />
            ) : (
              <span
                className="text-slate-500 cursor-pointer hover:text-indigo-600"
                onClick={() => {
                  setIsEditingFileName(true);
                  setCustomFileName(fileName);
                }}
                title="点击编辑文件名"
              >
                文件名: <span className="font-semibold text-slate-800">{fileName}</span>
              </span>
            )}
            <label
              className={`cursor-pointer font-medium ${pdfDocuments.length >= MAX_PDFS ? 'text-gray-400 cursor-not-allowed' : 'text-indigo-600 hover:text-indigo-800'}`}
            >
              {pdfDocuments.length >= MAX_PDFS ? '已达上限' : '添加PDF'}
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleFileChange}
                disabled={pdfDocuments.length >= MAX_PDFS}
              />
            </label>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {!activePdfDocument ? (
          // Upload State
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 p-6 relative">
            <div
              className={`w-full max-w-md bg-white p-10 rounded-2xl shadow-xl border-2 transition-all duration-200 text-center border-slate-100`}
            >
              <div className="mx-auto w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
                <FileUp className="w-10 h-10 text-indigo-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">上传 PDF 文件</h2>
              <p className="text-slate-500 mb-8">
                点击下方按钮选择，或直接将文件<span className="text-indigo-600 font-bold">拖入页面的任意位置</span>
              </p>

              <label className="block w-full">
                <span className="sr-only">选择 PDF</span>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-slate-500
                    file:mr-4 file:py-3 file:px-6
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-indigo-600 file:text-white
                    hover:file:bg-indigo-700
                    cursor-pointer"
                />
              </label>

              {isLoading && (
                <div className="mt-4 text-indigo-600 animate-pulse text-sm">正在加载 PDF...</div>
              )}

              {error && (
                <div className="mt-6 p-3 bg-red-50 text-red-600 rounded-lg flex items-center justify-center gap-2 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
            </div>

            {/* Developer Credits - Redesigned UI */}
            <div className="mt-12">
              <div className="bg-white px-5 py-3 rounded-xl border border-slate-100 shadow-lg shadow-indigo-100/50 flex items-center gap-4 transition-transform hover:-translate-y-1 duration-300">
                <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-md">
                  <CodeXml className="w-7 h-7" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs text-slate-400 font-bold tracking-wider mb-0.5">软件开发</span>
                  <span className="text-base font-bold text-slate-800">
                    @感恩烧饼
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Workspace State
          <>
            {error && (
              <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50 p-3 bg-red-50 text-red-600 rounded-lg flex items-center gap-2 text-sm shadow-lg border border-red-200">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
            {success && (
              <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50 p-3 bg-green-50 text-green-600 rounded-lg flex items-center gap-2 text-sm shadow-lg border border-green-200">
                <CheckCircle className="w-4 h-4" />
                {success}
              </div>
            )}
            <div className="flex-1 h-full min-w-0 border-r border-slate-200 flex flex-col">
              <PdfTabs
                pdfDocuments={pdfDocuments}
                activePdfIndex={activePdfIndex}
                onTabClick={handleTabClick}
                onRemovePdf={handleRemovePdf}
                onAddPdf={triggerFileUpload}
                onFileChange={handleFileChange}
                maxPdfs={MAX_PDFS}
              />
              <PdfCropper
                pdfDocument={activePdfDocument}
                onCropComplete={handleCropComplete}
                zoom={getCurrentPdfSettings().zoom}
                rotation={getCurrentPdfSettings().rotation}
                renderScale={getCurrentPdfSettings().renderScale}
                currentPage={getCurrentPdfSettings().currentPage}
                onZoomChange={(v) => updatePdfSetting('zoom', v)}
                onRotationChange={(v) => updatePdfSetting('rotation', v)}
                onRenderScaleChange={(v) => updatePdfSetting('renderScale', v)}
                onPageChange={(v) => updatePdfSetting('currentPage', v)}
              />
            </div>
            {/* Increased width from w-96 to w-[480px] */}
            <div className="w-[320px] h-full border-l border-slate-200 shadow-xl z-20">
              <SourceToggle
                showSourceLabel={showSourceLabel}
                onToggle={setShowSourceLabel}
                hasMultiplePdfs={pdfDocuments.length > 1}
              />
              <SlideList
                slides={slides}
                onDeleteSlide={handleDeleteSlide}
                onDeleteImage={handleDeleteImage}
                onMergeUp={handleMergeUp}
                onExport={handleExport}
                onReorder={handleReorderSlides}
                showSourceLabel={showSourceLabel}
              />
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default App;