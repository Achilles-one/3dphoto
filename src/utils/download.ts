export function downloadBlob(blob: Blob, fileName: string) {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = objectUrl;
  link.download = fileName;
  link.rel = 'noopener';
  document.body.append(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(objectUrl);
}

export function createGifFileName(sourceName: string | undefined): string {
  const baseName = sourceName?.replace(/\.[^.]+$/, '').trim() || '3d-photo';
  return `${baseName}-wiggle.gif`;
}
