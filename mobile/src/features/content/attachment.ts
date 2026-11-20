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

/**
 * A document's name as a person would write it: a file name's underscores &
 * runs of dashes as spaces — "Erasmus_Final_Poster" as "Erasmus Final Poster".
 */
export function attachmentName(name: string): string {
  const tidy = name
    .replace(/_+/g, ' ')
    // A single hyphen joins words ("Ε-Μ"); a file name's runs of them part them.
    .replace(/-{2,}/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return tidy || name;
}

/** A short label for the document type, e.g. "PDF", shown on the card. */
export function attachmentLabel(format: AttachmentFormat): string {
  return labels[format];
}
