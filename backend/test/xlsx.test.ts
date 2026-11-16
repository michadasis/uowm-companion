import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';

import { xlsxToBlocks } from '../src/documents/xlsx.js';

// A minimal workbook: two sheets, one hidden, shared & inline strings.
async function workbook(): Promise<Uint8Array> {
  const zip = new JSZip();
  zip.file(
    'xl/workbook.xml',
    '<workbook xmlns:r="r"><sheets>' +
      '<sheet name="Α εξάμηνο" r:id="rId1"/><sheet name="Κρυφό" state="hidden" r:id="rId2"/>' +
      '<sheet name="Γ εξάμηνο" r:id="rId3"/></sheets></workbook>',
  );
  zip.file(
    'xl/_rels/workbook.xml.rels',
    '<Relationships>' +
      '<Relationship Id="rId1" Target="worksheets/sheet1.xml"/>' +
      '<Relationship Id="rId2" Target="worksheets/sheet2.xml"/>' +
      '<Relationship Id="rId3" Target="/xl/worksheets/sheet3.xml"/></Relationships>',
  );
  zip.file('xl/sharedStrings.xml', '<sst><si><t>ΩΡΑ</t></si><si><r><t>ΔΕΥ</t></r><r><t>ΤΕΡΑ</t></r></si></sst>');
  zip.file(
    'xl/worksheets/sheet1.xml',
    '<worksheet><sheetData>' +
      '<row r="1"><c r="A1" t="s"><v>0</v></c><c r="C1" t="s"><v>1</v></c></row>' +
      '<row r="2"></row>' +
      '<row r="3"><c r="A3" t="inlineStr"><is><t>09:00 - 10:00</t></is></c><c r="C3" t="str"><v>Φυσική</v></c></row>' +
      '</sheetData></worksheet>',
  );
  zip.file('xl/worksheets/sheet2.xml', '<worksheet><sheetData><row><c r="A1" t="inlineStr"><is><t>κρυφό</t></is></c></row></sheetData></worksheet>');
  zip.file('xl/worksheets/sheet3.xml', '<worksheet><sheetData><row><c r="B1"><v>42</v></c></row></sheetData></worksheet>');
  return zip.generateAsync({ type: 'uint8array' });
}

describe('xlsxToBlocks', () => {
  it('reads each visible sheet as a table headed by its name, dropping empty rows & columns', async () => {
    expect(await xlsxToBlocks(await workbook())).toEqual([
      { type: 'heading', level: 3, content: [{ text: 'Α εξάμηνο' }] },
      {
        type: 'table',
        header: null,
        rows: [
          [[{ text: 'ΩΡΑ' }], [{ text: 'ΔΕΥΤΕΡΑ' }]],
          [[{ text: '09:00 - 10:00' }], [{ text: 'Φυσική' }]],
        ],
      },
      { type: 'heading', level: 3, content: [{ text: 'Γ εξάμηνο' }] },
      { type: 'table', header: null, rows: [[[{ text: '42' }]]] },
    ]);
  });
});
