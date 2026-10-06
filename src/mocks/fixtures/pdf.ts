const lines = [
  'BT /F1 20 Tf 56 770 Td (AI CV Builder: mock mode) Tj ET',
  'BT /F1 11 Tf 56 744 Td (A static A4 page. The real PDF is rendered by the backend) Tj ET',
  'BT /F1 11 Tf 56 728 Td (from the saved draft.) Tj ET',
]
const content = lines.join('\n')

const objects = [
  '<< /Type /Catalog /Pages 2 0 R >>',
  '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
  // A4 in points.
  '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
  '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
]

/** A valid one-page PDF; the cross-reference offsets are counted, the text is ASCII. */
function buildPdf(): string {
  let pdf = '%PDF-1.4\n'
  const offsets = objects.map((body, index) => {
    const offset = pdf.length
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`
    return offset
  })
  const xref = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  pdf += offsets.map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`
  return pdf
}

/** What `GET /api/cvs/:id/pdf` returns in mock mode, for every CV. */
export const cvPdf = new TextEncoder().encode(buildPdf())
