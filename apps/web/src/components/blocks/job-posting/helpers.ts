const maxDimension = 1920;
const maxBytes = 1_000_000;

const loadImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => { resolve(image); };
    image.onerror = () => { reject(new Error('Image load failed')); };
    image.src = url;
  });

const toBlob = (canvas: HTMLCanvasElement, quality: number): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Compression failed'));
          return;
        }

        resolve(blob);
      },
      'image/jpeg',
      quality
    );
  });

const scaleDimension = (width: number, height: number): { width: number; height: number } => {
  if (width <= maxDimension && height <= maxDimension) {
    return { width, height };
  }

  const ratio = width > height ? maxDimension / width : maxDimension / height;
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio)
  };
};

export const compressImageFile = async (file: File): Promise<File> => {
  if (file.size <= maxBytes) {
    return file;
  }

  const objectUrl = URL.createObjectURL(file);
  const image = await loadImage(objectUrl);
  URL.revokeObjectURL(objectUrl);

  const { width, height } = scaleDimension(image.width, image.height);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) {
    return file;
  }

  context.drawImage(image, 0, 0, width, height);

  let quality = 0.9;
  let blob = await toBlob(canvas, quality);

  while (blob.size > maxBytes && quality > 0.45) {
    quality -= 0.1;
    blob = await toBlob(canvas, quality);
  }

  return new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' });
};

export const buildAiDescriptionOptions = (input: string): ReadonlyArray<string> => {
  const normalized = input.trim();

  if (!normalized) {
    return [];
  }

  return [
    `I need a qualified professional for ${normalized}. The work is at my residence and should be completed with clean, safe finishing. Please include required materials, estimated duration, and the earliest available start time.`,
    `Looking for an experienced service provider to handle ${normalized}. Priority is quality and punctuality. Share your approach, warranty terms, and a detailed quote before starting.`,
    `Requesting support for ${normalized}. The scope may include inspection, diagnosis, and full execution. I value transparent pricing, clear communication, and proper cleanup after completion.`
  ];
};

export const getStepDirection = (nextStep: number, currentStep: number): 1 | -1 =>
  nextStep >= currentStep ? 1 : -1;

export const draftStorageKey = (locale: 'en' | 'ar'): string => `yidak_job_draft_${locale}`;
