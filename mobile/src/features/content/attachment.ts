import type { IconName } from '@/design';

import type { AttachmentFormat } from './schema';

const icons: Record<AttachmentFormat, IconName> = {
  pdf: 'filePdf',
  doc: 'fileDoc',
  docx: 'fileDoc',
  xls: 'fileXls',
  xlsx: 'fileXls',
  ppt: 'filePpt',
  pptx: 'filePpt',
  other: 'file',
};

const labels: Record<AttachmentFormat, string> = {
  pdf: 'PDF',
  doc: 'Word',
  docx: 'Word',
  xls: 'Excel',
  xlsx: 'Excel',
  ppt: 'PowerPoint',
  pptx: 'PowerPoint',
  other: '',
};

export function attachmentIcon(format: AttachmentFormat): IconName {
  return icons[format];
}

/** A short label for the document type, e.g. "PDF", shown on the card. */
export function attachmentLabel(format: AttachmentFormat): string {
  return labels[format];
}
