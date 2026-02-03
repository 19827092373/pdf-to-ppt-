import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Rect, CroppedImage, PDFDocument } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

interface PdfCropperProps {
  pdfDocument: PDFDocument;
  onCropComplete: (image: CroppedImage, pageNumber?: number) => void;
}

export const PdfCropper: React.FC<PdfCropperProps> = ({ pdfDocument, onCropComplete }) => {
  const [renderScale, setRenderScale] = useState<number>(2.0); // Default to 2.0 (High Res)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoom, setZoom] = useState<number>(1.0); // 1.0 = 100% display size relative to original PDF point size
  const [rotation, setRotation] = useState<number>(0); // 0, 90, 180, 270
  const [isRendering, setIsRendering] = useState<boolean>(false);

  // Crop state
  const [isSelecting, setIsSelecting] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [currentRect, setCurrentRect] = useState<Rect | null>(null);

  // Dimensions for the container to ensure overlay matches canvas
  const [canvasDims, setCanvasDims] = useState<{ width: number, height: number } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null); // Scrollable area
  const wrapperRef = useRef<HTMLDivElement>(null); // Holds canvas + overlay

  const renderPage = useCallback(async () => {
    if (!pdfDocument || !canvasRef.current) return;

    setIsRendering(true);
    try {
      const page = await pdfDocument.getPage(currentPage);
      // Always render at high resolution with rotation
      const viewport = page.getViewport({ scale: renderScale, rotation: rotation });

      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (!context) return;

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // Store standard dimensions (1.0 scale) for calculation
      setCanvasDims({
        width: viewport.width / renderScale,
        height: viewport.height / renderScale
      });

      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise;
    } catch (err) {
      console.error("Error rendering page", err);
    } finally {
      setIsRendering(false);
    }
  }, [pdfDocument, currentPage, renderScale, rotation]); // Add rotation to dependency

  useEffect(() => {
    // Reset zoom when document changes, or keep it? 
    // Let's reset to a safe default or keep current if valid.
    // For now, simple render.
    renderPage();
  }, [renderPage]);

  // Fit to container width
  const fitToWidth = () => {
    if (!containerRef.current || !canvasDims) return;
    const containerWidth = containerRef.current.clientWidth - 40; // -40 for padding
    const naturalWidth = canvasDims.width;
    const newZoom = containerWidth / naturalWidth;
    setZoom(newZoom);
  };

  const fitToPage = () => {
    if (!containerRef.current || !canvasDims) return;
    const containerHeight = containerRef.current.clientHeight - 40;
    const naturalHeight = canvasDims.height;
    const newZoom = containerHeight / naturalHeight;
    setZoom(newZoom);
  };

  // Coordinate helper
  const getCoordinates = (e: React.MouseEvent) => {
    if (!wrapperRef.current) return { x: 0, y: 0 };
    const rect = wrapperRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Prevent default to stop text selection or image dragging
    e.preventDefault();
    if (e.button !== 0) return; // Only left click

    const coords = getCoordinates(e);
    setIsSelecting(true);
    setStartPos(coords);
    setCurrentRect({ x: coords.x, y: coords.y, width: 0, height: 0 });
  };

  // Global event listeners for drag
  useEffect(() => {
    if (!isSelecting || !startPos) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      e.preventDefault();

      if (!wrapperRef.current) return;
      const rect = wrapperRef.current.getBoundingClientRect();

      // Calculate raw coordinates relative to canvas top-left
      const rawX = e.clientX - rect.left;
      const rawY = e.clientY - rect.top;

      // Clamp coordinates to stay within canvas bounds
      const clampedX = Math.max(0, Math.min(rawX, rect.width));
      const clampedY = Math.max(0, Math.min(rawY, rect.height));

      const rawWidth = clampedX - startPos.x;
      const rawHeight = clampedY - startPos.y;

      const width = Math.abs(rawWidth);
      const height = Math.abs(rawHeight);

      // Calculate top-left based on drag direction
      const x = rawWidth > 0 ? startPos.x : clampedX;
      const y = rawHeight > 0 ? startPos.y : clampedY;

      setCurrentRect({ x, y, width, height });
    };

    const handleGlobalMouseUp = (e: MouseEvent) => {
      e.preventDefault();
      setIsSelecting(false);

      if (!currentRect || !canvasRef.current || !startPos) {
        setStartPos(null);
        setCurrentRect(null);
        return;
      }

      // Threshold to prevent accidental tiny clicks
      if (currentRect.width < 10 || currentRect.height < 10) {
        setStartPos(null);
        setCurrentRect(null);
        return;
      }

      // Capture the image
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');

      // Convert visual coordinates to high-res canvas coordinates
      const scaleFactor = renderScale / zoom;

      const actualX = currentRect.x * scaleFactor;
      const actualY = currentRect.y * scaleFactor;
      const actualWidth = currentRect.width * scaleFactor;
      const actualHeight = currentRect.height * scaleFactor;

      if (tempCtx) {
        tempCanvas.width = actualWidth;
        tempCanvas.height = actualHeight;

        tempCtx.drawImage(
          canvasRef.current,
          actualX, actualY, actualWidth, actualHeight,
          0, 0, actualWidth, actualHeight
        );

        const dataUrl = tempCanvas.toDataURL('image/png');

        onCropComplete({
          id: uuidv4(),
          dataUrl,
          width: actualWidth,
          height: actualHeight,
          aspectRatio: actualWidth / actualHeight
        }, currentPage);
      }

      // Reset selection visualization
      setStartPos(null);
      setCurrentRect(null);
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isSelecting, startPos, currentRect, zoom, canvasDims, renderScale, onCropComplete]);


  const changePage = (delta: number) => {
    const newPage = currentPage + delta;
    if (newPage >= 1 && newPage <= pdfDocument.numPages) {
      setCurrentPage(newPage);
      setStartPos(null);
      setCurrentRect(null);
    }
  };

  // Keyboard shortcuts for page navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Arrow keys for page navigation
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        changePage(-1);
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        changePage(1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, pdfDocument]);

  return (
    <div className="flex flex-col h-full bg-slate-100 border-r border-slate-200">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 bg-white border-b border-slate-200 shadow-sm z-20">
        <div className="flex items-center gap-2">
          <button
            onClick={() => changePage(-1)}
            disabled={currentPage <= 1 || isRendering}
            className="p-1 rounded hover:bg-slate-100 disabled:opacity-30"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium w-24 text-center select-none">
            第 {currentPage} 页 / 共 {pdfDocument?.numPages || '-'} 页
          </span>
          <button
            onClick={() => changePage(1)}
            disabled={!pdfDocument || currentPage >= pdfDocument.numPages || isRendering}
            className="p-1 rounded hover:bg-slate-100 disabled:opacity-30"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-600">清晰度:</span>
          <select
            value={renderScale}
            onChange={(e) => setRenderScale(parseFloat(e.target.value))}
            className="px-2 py-1 bg-white border border-slate-300 rounded text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer hover:border-indigo-400 transition-colors"
          >
            <option value="1.5">1.5x (快速)</option>
            <option value="2">2.0x (标准)</option>
            <option value="3">3.0x (超清)</option>
            <option value="4">4.0x (原画)</option>
            <option value="6">6.0x (极清)</option>
            <option value="8">8.0x (无损)</option>
          </select>

          <div className="w-px h-4 bg-slate-300 mx-1"></div>

          <button onClick={fitToWidth} className="px-2 py-1 text-xs border rounded hover:bg-slate-100 font-medium">
            适应宽度
          </button>
          <button onClick={fitToPage} className="px-2 py-1 text-xs border rounded hover:bg-slate-100 font-medium">
            适应页面
          </button>
          <div className="w-px h-4 bg-slate-300 mx-1"></div>
          <button
            onClick={() => setRotation(r => (r + 90) % 360)}
            className="px-2 py-1 text-xs border rounded hover:bg-slate-100 font-medium flex items-center gap-1"
            title="旋转页面 (90°)"
          >
            <RotateCw className="w-3 h-3" />
            {rotation}°
          </button>
          <div className="w-px h-4 bg-slate-300 mx-1"></div>
          <button onClick={() => setZoom(s => Math.max(0.1, s - 0.1))} className="p-1 rounded hover:bg-slate-100">
            <ZoomOut className="w-5 h-5" />
          </button>
          <span className="text-xs text-slate-500 w-12 text-center select-none">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(s => Math.min(10.0, s + 0.1))} className="p-1 rounded hover:bg-slate-100">
            <ZoomIn className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Scrollable Area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto relative p-8 flex justify-start items-start bg-slate-300"
      >
        {/* Canvas Wrapper - Explicit dimensions ensure overlay covers perfectly */}
        <div
          ref={wrapperRef}
          className="relative shadow-xl bg-white select-none origin-top-left"
          style={{
            width: canvasDims ? canvasDims.width * zoom : 'auto',
            height: canvasDims ? canvasDims.height * zoom : 'auto',
            minWidth: canvasDims ? canvasDims.width * zoom : 'auto', // Force size
            minHeight: canvasDims ? canvasDims.height * zoom : 'auto',
            cursor: 'crosshair'
          }}
          onMouseDown={handleMouseDown}
        >
          <canvas
            ref={canvasRef}
            className="block pointer-events-none origin-top-left"
            style={{
              width: '100%',
              height: '100%'
            }}
          />

          {/* Drawing Overlay */}
          {currentRect && (
            <div
              className="absolute border-2 border-red-600 bg-red-500/20 pointer-events-none z-10"
              style={{
                left: currentRect.x,
                top: currentRect.y,
                width: currentRect.width,
                height: currentRect.height,
              }}
            />
          )}
        </div>
      </div>

      <div className="bg-white p-2 text-xs text-slate-500 text-center border-t border-slate-200">
        提示：鼠标左键拖动以框选题目
      </div>
    </div>
  );
};