export const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

function analyzePixels(data) {
  let rTotal = 0, gTotal = 0, bTotal = 0;
  const hist = new Uint32Array(256);
  const pixelCount = data.length / 4;

  for (let i = 0; i < data.length; i += 4) {
    rTotal += data[i];
    gTotal += data[i + 1];
    bTotal += data[i + 2];

    const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    hist[gray]++;
  }

  const avgBrightness = (rTotal + gTotal + bTotal) / (3 * pixelCount);

  const mid = pixelCount / 2;
  let count = 0;
  let medianGray = 0;
  for (let i = 0; i < 256; i++) {
    count += hist[i];
    if (count >= mid) { medianGray = i; break; }
  }

  return { avgBrightness, medianGray };
}

function enhanceExposure(ctx, canvas) {
  let imgData;
  try {
    imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  } catch (e) {
    console.warn('enhanceExposure: no se pudo acceder a los píxeles:', e.message);
    return;
  }

  const data = imgData.data;
  const { avgBrightness, medianGray } = analyzePixels(data);

  const needsBrightness = avgBrightness > 0 && avgBrightness < 80;
  const needsContrast   = medianGray < 60;

  if (!needsBrightness && !needsContrast) return;

  const brightnessFactor  = needsBrightness ? 110 / avgBrightness : 1;
  const contrastFactor    = needsContrast   ? 1.15 : 1;
  const contrastIntercept = needsContrast   ? 128 * (1 - contrastFactor) : 0;

  for (let i = 0; i < data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      let val = data[i + c];
      if (needsBrightness) val = val * brightnessFactor;
      if (needsContrast)   val = val * contrastFactor + contrastIntercept;
      data[i + c] = Math.min(255, Math.max(0, val));
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

function resolveOutputFormat(image) {
  const src = image.src ?? '';
  const mightHaveAlpha = /\.(png|webp|gif)(\?|$)/i.test(src);
  if (!mightHaveAlpha) return { mime: 'image/jpeg', quality: 0.95 };

  const probe = document.createElement('canvas');
  probe.width = Math.min(image.naturalWidth, 64);
  probe.height = Math.min(image.naturalHeight, 64);
  const pCtx = probe.getContext('2d');
  pCtx.drawImage(image, 0, 0, probe.width, probe.height);

  try {
    const d = pCtx.getImageData(0, 0, probe.width, probe.height).data;
    for (let i = 3; i < d.length; i += 4) {
      if (d[i] < 255) return { mime: 'image/png', quality: 1 };
    }
  } catch (_) { }

  return { mime: 'image/jpeg', quality: 0.95 };
}

function createScaledCanvas(srcWidth, srcHeight, maxSize) {
  let width = srcWidth;
  let height = srcHeight;

  if (width > maxSize || height > maxSize) {
    const ratio = Math.min(maxSize / width, maxSize / height);
    width  = Math.round(width  * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = document.createElement('canvas');
  canvas.width  = width;
  canvas.height = height;
  return canvas;
}

function drawCrop(ctx, image, pixelCrop, destWidth, destHeight) {
  ctx.imageSmoothingEnabled  = true;
  ctx.imageSmoothingQuality  = 'high';
  ctx.drawImage(
    image,
    pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
    0, 0, destWidth, destHeight
  );
}

const MAX_SIZE  = 1200;
const THUMB_SIZE = 300;

export async function getDualCroppedImg(imageSrc, pixelCrop) {
  const image = await createImage(imageSrc);
  const { mime, quality } = resolveOutputFormat(image);

  const hqCanvas = createScaledCanvas(pixelCrop.width, pixelCrop.height, MAX_SIZE);
  const hqCtx    = hqCanvas.getContext('2d');
  drawCrop(hqCtx, image, pixelCrop, hqCanvas.width, hqCanvas.height);
  enhanceExposure(hqCtx, hqCanvas);

  const thumbCanvas = createScaledCanvas(hqCanvas.width, hqCanvas.height, THUMB_SIZE);
  const thumbCtx    = thumbCanvas.getContext('2d');
  thumbCtx.imageSmoothingEnabled = true;
  thumbCtx.imageSmoothingQuality = 'high';
  thumbCtx.drawImage(hqCanvas, 0, 0, thumbCanvas.width, thumbCanvas.height);

  return {
    altaCalidad: hqCanvas.toDataURL(mime, quality),
    thumb:       thumbCanvas.toDataURL(mime, mime === 'image/png' ? 1 : 0.85),
  };
}

export function downloadBase64Image(base64Data, filename) {
  const link = document.createElement('a');
  link.href     = base64Data;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
