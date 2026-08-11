const acceptedImageTypes = new Set(['image/jpeg', 'image/png', 'image/mpo']);
const acceptedImageExtensions = new Set(['.jpg', '.jpeg', '.png', '.mpo']);

export type SupportedImageFileType = 'jpeg' | 'png' | 'mpo';

function getFileExtension(file: File): string {
  const lastDot = file.name.lastIndexOf('.');
  return lastDot === -1 ? '' : file.name.slice(lastDot).toLowerCase();
}

export function getSupportedImageFileType(
  file: File,
): SupportedImageFileType | null {
  const extension = getFileExtension(file);

  if (file.type === 'image/mpo' || extension === '.mpo') {
    return 'mpo';
  }

  if (file.type === 'image/png' || extension === '.png') {
    return 'png';
  }

  if (file.type === 'image/jpeg' || extension === '.jpg' || extension === '.jpeg') {
    return 'jpeg';
  }

  return null;
}

export function isAcceptedImageFile(file: File): boolean {
  return acceptedImageTypes.has(file.type) || acceptedImageExtensions.has(getFileExtension(file));
}

export function isMpoFile(file: File): boolean {
  return getSupportedImageFileType(file) === 'mpo';
}

export function isMpoFileName(name: string, type = ''): boolean {
  return type === 'image/mpo' || /\.mpo$/i.test(name);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const kilobytes = bytes / 1024;
  if (kilobytes < 1024) {
    return `${kilobytes.toFixed(1)} KB`;
  }

  return `${(kilobytes / 1024).toFixed(1)} MB`;
}
