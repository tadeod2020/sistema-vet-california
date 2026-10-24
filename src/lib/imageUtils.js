/**
 * Utilidad de compresión y optimización de imágenes en el navegador.
 * 
 * Evita que fotos de alta resolución tomadas con celulares (3MB - 12MB)
 * saturen LocalStorage (límite 5MB) o provoquen timeouts, error 413 o TypeError: terminated en Supabase.
 */

// Límite máximo estricto para PDFs en base64 (650 KB)
export const MAX_PDF_BYTES = 650 * 1024;

/**
 * Convierte un DataURL (base64) a un Blob nativo del navegador.
 * Crucial para que visores PDF integrados de Chrome/Firefox/Safari abran documentos
 * sin bloqueos de origen cruzado ni restricciones de iframe data: URL.
 */
export function dataUrlToBlob(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) {
    return null;
  }
  try {
    const parts = dataUrl.split(',');
    if (parts.length < 2) return null;
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
    const binary = atob(parts[1]);
    const len = binary.length;
    const u8arr = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      u8arr[i] = binary.charCodeAt(i);
    }
    return new Blob([u8arr], { type: mime });
  } catch (err) {
    console.warn('Error convirtiendo dataUrl a Blob:', err);
    return null;
  }
}

/**
 * Lee un archivo como DataURL (promesa segura)
 */
function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('No se pudo leer el archivo seleccionado.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Carga una imagen HTML a partir de un DataURL
 */
function loadImageFromDataUrl(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('No se pudo decodificar la imagen. Si usas iPhone, asegúrate de tomar la foto directamente o usar formato JPG o PNG.'));
    img.src = dataUrl;
  });
}

/**
 * Renderiza una imagen a canvas y exporta en JPEG con fondo blanco para transparencia
 */
function renderCanvasToJpeg(img, targetWidth, targetHeight, quality) {
  let width = img.naturalWidth || img.width;
  let height = img.naturalHeight || img.height;

  if (width <= 0 || height <= 0) {
    throw new Error('Dimensiones de imagen inválidas');
  }

  if (width > targetWidth || height > targetHeight) {
    const ratio = Math.min(targetWidth / width, targetHeight / height);
    width = Math.max(1, Math.round(width * ratio));
    height = Math.max(1, Math.round(height * ratio));
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo inicializar el motor de renderizado 2D');

  // Fondo blanco para evitar fondos negros en PNG transparentes al exportar a JPEG
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', quality);
}

/**
 * Comprime un archivo de imagen asegurando que nunca exceda el presupuesto de bytes (multi-pass)
 */
export async function compressImageFile(file, maxWidth = 450, maxHeight = 450, quality = 0.70, maxChars = 45000) {
  if (!file) return null;

  // Si no es tipo imagen, validar extensión
  const isImage = file.type?.startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp|avif)$/i.test(file.name || '');
  if (!isImage) {
    throw new Error('El archivo seleccionado no es una imagen válida.');
  }

  const rawDataUrl = await readFileAsDataUrl(file);
  const img = await loadImageFromDataUrl(rawDataUrl);

  // Pase 1: dimensiones y calidad deseadas
  let result = renderCanvasToJpeg(img, maxWidth, maxHeight, quality);

  // Pase 2: si excede el presupuesto seguro (~30KB-35KB), reducir dimensiones y calidad
  if (result.length > maxChars) {
    const pass2Width = Math.round(maxWidth * 0.8);
    const pass2Height = Math.round(maxHeight * 0.8);
    const pass2Quality = Math.max(0.50, quality - 0.12);
    result = renderCanvasToJpeg(img, pass2Width, pass2Height, pass2Quality);
  }

  // Pase 3: último pase ultra-ligero de emergencia si aún excede
  if (result.length > maxChars) {
    const pass3Width = Math.round(maxWidth * 0.65);
    const pass3Height = Math.round(maxHeight * 0.65);
    result = renderCanvasToJpeg(img, pass3Width, pass3Height, 0.45);
  }

  return result;
}

/**
 * Optimizador específico para fotos de perfil / mascotas / pasaporte.
 * Tamaño objetivo: 15KB - 30KB (ideal para sincronización instantánea y LocalStorage).
 */
export async function compressPetPhoto(file) {
  // Max 400x400 px, calidad 0.70, tope máximo de 42,000 caracteres (~30 KB)
  return compressImageFile(file, 400, 400, 0.70, 42000);
}

/**
 * Optimizador específico para fotos de estudios de laboratorio / rayos X / recetas.
 * Tamaño objetivo: 35KB - 60KB (preserva legibilidad de textos y números).
 */
export async function compressLabImage(file) {
  // Max 1000x1000 px, calidad 0.68, tope máximo de 80,000 caracteres (~58 KB)
  return compressImageFile(file, 1000, 1000, 0.68, 80000);
}

/**
 * Valida y lee un PDF para laboratorio, asegurando que no exceda el límite seguro de 350KB.
 */
export async function validateAndReadLabPdf(file) {
  if (!file) throw new Error('No se proporcionó ningún archivo');
  
  if (file.size > MAX_PDF_BYTES) {
    const currentKb = Math.round(file.size / 1024);
    throw new Error(`El archivo PDF pesa ${currentKb} KB. El límite máximo para sincronización fluida es de 650 KB.\n\nSugerencia: Si es un estudio impreso, tómale una foto con el celular (se optimiza automáticamente a alta nitidez en menos de 60 KB).`);
  }

  return readFileAsDataUrl(file);
}

/**
 * Comprime un string base64 existente si excede 45KB
 */
export async function compressBase64Image(dataUrl, maxWidth = 400, maxHeight = 400, quality = 0.70) {
  if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) {
    return dataUrl;
  }
  // Si ya es pequeño (< 45KB de caracteres), dejarlo intacto
  if (dataUrl.length <= 45000) return dataUrl;

  try {
    const img = await loadImageFromDataUrl(dataUrl);
    let result = renderCanvasToJpeg(img, maxWidth, maxHeight, quality);
    if (result.length > 45000) {
      result = renderCanvasToJpeg(img, Math.round(maxWidth * 0.75), Math.round(maxHeight * 0.75), 0.55);
    }
    return result;
  } catch (err) {
    console.warn('No se pudo recomprimir dataURL existente:', err);
    return dataUrl.length > 60000 ? '' : dataUrl;
  }
}
