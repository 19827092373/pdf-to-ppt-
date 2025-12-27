import PptxGenJS from "pptxgenjs";
import { SlideData } from "../types";

export const generatePPT = async (slides: SlideData[], filename: string = "习题.pptx") => {
  const pptx = new PptxGenJS();

  // Set 16:9 layout
  pptx.layout = "LAYOUT_16x9";

  // Define layout constants (in inches)
  // 16:9 slide is 10 x 5.625 inches
  const SLIDE_WIDTH = 10;
  const SLIDE_HEIGHT = 5.625;
  const MARGIN = 0.3;

  // Config: Max width (Full width minus margins)
  // Maximize image size as requested (removing previous 60% limit)
  const MAX_CONTENT_WIDTH = SLIDE_WIDTH - (MARGIN * 2);

  // Available height for content (full height minus margins)
  const AVAILABLE_HEIGHT = SLIDE_HEIGHT - (MARGIN * 2);

  slides.forEach((slideData) => {
    const slide = pptx.addSlide();

    const imageCount = slideData.images.length;

    if (imageCount === 0) return;

    if (imageCount === 1) {
      // Single Image Logic: 
      // Limit width to 60%, limit height to available height.
      // Align Left, Top.
      const img = slideData.images[0];

      let w = MAX_CONTENT_WIDTH;
      let h = w / img.aspectRatio;

      // If height exceeds available height, scale down by height
      if (h > AVAILABLE_HEIGHT) {
        h = AVAILABLE_HEIGHT;
        w = h * img.aspectRatio;
      }

      slide.addImage({
        data: img.dataUrl,
        x: MARGIN,
        y: MARGIN,
        w: w,
        h: h,
      });

    } else {
      // Two Images Logic: 
      // Flow layout - place second image directly below first one
      const GAP = 0.05; // Tight gap (approx 1.27mm)

      const img1 = slideData.images[0];
      const img2 = slideData.images[1];

      // Calculate initial natural heights for max width
      let w1 = MAX_CONTENT_WIDTH;
      let h1 = w1 / img1.aspectRatio;

      let w2 = MAX_CONTENT_WIDTH;
      let h2 = w2 / img2.aspectRatio;

      // Check total height
      const totalHeight = h1 + h2 + GAP;

      // If total height exceeds available space, scale both down proportionally
      if (totalHeight > AVAILABLE_HEIGHT) {
        const scaleFactor = AVAILABLE_HEIGHT / totalHeight;

        w1 = w1 * scaleFactor;
        h1 = h1 * scaleFactor;

        w2 = w2 * scaleFactor;
        h2 = h2 * scaleFactor;
      }

      // Add Image 1
      slide.addImage({
        data: img1.dataUrl,
        x: MARGIN,
        y: MARGIN,
        w: w1,
        h: h1,
      });

      // Add Image 2 (Immediately below Image 1)
      slide.addImage({
        data: img2.dataUrl,
        x: MARGIN,
        y: MARGIN + h1 + GAP,
        w: w2,
        h: h2,
      });
    }
  });

  await pptx.writeFile({ fileName: filename });
};