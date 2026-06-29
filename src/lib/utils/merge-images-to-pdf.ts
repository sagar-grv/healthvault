import { jsPDF } from 'jspdf';

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function getImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = reject;
    img.src = dataUrl;
  });
}

export async function mergeImagesToPdf(images: Blob[]): Promise<Blob> {
  if (images.length === 0) throw new Error('No images to merge');
  if (images.length === 1) return images[0];

  const pdf = new jsPDF();
  let isFirstPage = true;

  for (const blob of images) {
    const dataUrl = await blobToDataUrl(blob);
    const { width, height } = await getImageDimensions(dataUrl);
    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = pdf.internal.pageSize.getHeight();
    const scale = Math.min(pdfW / width, pdfH / height);
    const imgW = width * scale;
    const imgH = height * scale;
    const x = (pdfW - imgW) / 2;
    const y = (pdfH - imgH) / 2;

    if (isFirstPage) {
      isFirstPage = false;
    } else {
      pdf.addPage();
    }

    pdf.addImage(dataUrl, 'JPEG', x, y, imgW, imgH);
  }

  return pdf.output('blob');
}
