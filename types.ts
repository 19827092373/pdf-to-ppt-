export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CroppedImage {
  id: string;
  dataUrl: string;
  width: number;
  height: number;
  aspectRatio: number; // width / height
  // 来源信息（多PDF支持）
  sourcePdfName?: string;   // PDF文件名
  sourcePageNumber?: number; // 页码
}

export interface SlideData {
  id: string;
  images: CroppedImage[];
}

export enum SelectionMode {
  IDLE,
  SELECTING,
}

// PDF.js type definitions
export interface PDFPage {
  getViewport: (params: { scale: number }) => PDFViewport;
  render: (params: {
    canvasContext: CanvasRenderingContext2D;
    viewport: PDFViewport;
  }) => { promise: Promise<void> };
}

export interface PDFViewport {
  width: number;
  height: number;
}

export interface PDFLoadingTask {
  promise: Promise<PDFDocument>;
}

// PDF文档元数据（多PDF支持）
export interface PdfMetadata {
  document: PDFDocument;
  fileName: string;
  id: string;  // 唯一标识
}

export interface PDFDocument {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PDFPage>;
}

export interface PDFJSLib {
  getDocument: (data: Uint8Array | ArrayBuffer) => PDFLoadingTask;
  GlobalWorkerOptions: {
    workerSrc: string;
  };
}

// Global definition for window.pdfjsLib loaded via script tag
declare global {
  interface Window {
    pdfjsLib?: PDFJSLib;
  }
}
