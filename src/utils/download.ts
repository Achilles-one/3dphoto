export function downloadBlob(blob: Blob, fileName: string) {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = objectUrl;
  link.download = fileName;
  link.rel = 'noopener';
  document.body.append(link);
  link.click();
  link.remove();

  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
}

export function createGifFileName(sourceName: string | undefined): string {
  const baseName = sourceName?.replace(/\.[^.]+$/, '').trim() || '3d-photo';
  return `${baseName}-wiggle.gif`;
}

export function createMp4FileName(sourceName: string | undefined): string {
  const baseName = sourceName?.replace(/\.[^.]+$/, '').trim() || '3d-photo';
  return `${baseName}-wiggle.mp4`;
}

export function createSbsFileName(sourceName: string | undefined): string {
  const baseName = sourceName?.replace(/\.[^.]+$/, '').trim() || '3d-photo';
  return `${baseName}-sbs.png`;
}
