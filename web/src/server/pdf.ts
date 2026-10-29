// Generador mínimo de PDF de una página con texto (Helvetica, WinAnsi para tildes). Sin dependencias.
// shortcut: solo texto y una página; para plantillas con diseño usar una librería (pdf-lib / react-pdf).

function wrap(text: string, width = 88) {
  const out: string[] = []
  for (const para of text.split('\n')) {
    let line = ''
    for (const word of para.split(' ')) {
      if ((line + ' ' + word).trim().length > width) { out.push(line); line = word } else line = (line + ' ' + word).trim()
    }
    out.push(line)
  }
  return out
}

// Escapa caracteres especiales de PDF y codifica en Latin-1 (WinAnsiEncoding cubre á é í ó ú ñ).
const esc = (s: string) => s.replace(/[\\()]/g, (c) => `\\${c}`)

export function simplePdf(lines: string[]): Buffer {
  const body = lines.flatMap((l) => wrap(l))
  const content = ['BT', '/F1 11 Tf', '14 TL', '56 780 Td', ...body.map((l, i) => (i === 0 ? `/F1 15 Tf (${esc(l)}) Tj T* /F1 11 Tf` : `(${esc(l)}) Tj T*`)), 'ET'].join('\n')
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${Buffer.byteLength(content, 'latin1')} >>\nstream\n${content}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
  ]
  let pdf = '%PDF-1.4\n'
  const offsets: number[] = []
  objects.forEach((o, i) => { offsets.push(Buffer.byteLength(pdf, 'latin1')); pdf += `${i + 1} 0 obj\n${o}\nendobj\n` })
  const xref = Buffer.byteLength(pdf, 'latin1')
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')}`
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`
  return Buffer.from(pdf, 'latin1')
}
