// Lê o gabarito do fim de um PDF de questões, no próprio aparelho (o gabarito não vai para o repositório).
// Formatos: "108 – Falso / Art. 339, § 2º.", "156- A. Art. 347, CP. explicação...", "1497 - D", "252) E", "01- Verdadeiro".
// Devolve { n: { r: 'A'..'E' | 'V' | 'F', ref: texto depois da resposta (artigo, explicação) } }.

const LIXO = /Esse material está protegido|Quaisquer reproduç|Licenciado para|Licensed to|Protegido por Eduzz|@|\d{3}\.?\d{3}\.?\d{3}-?\d{2}/;
const GAB = /^\s*0*(\d{1,4})\s*(?:[-–)]|\s)\s*(Verdadeir[oa]|Fals[oa]|Certo|Errado|[A-E](?=\s*$|\s*[./–-]|\s+Art))\b\s*[./-]?\s*(.*)$/;
const resp = s => (/^(Verdadeir[oa]|Certo)$/.test(s) ? 'V' : /^(Fals[oa]|Errado)$/.test(s) ? 'F' : s);

async function linhas(doc, p) {
  const tc = await (await doc.getPage(p)).getTextContent();
  return tc.items.map(o => o.str + (o.hasEOL ? '\n' : '')).join('').split('\n').map(l => l.trim()).filter(l => l && !LIXO.test(l));
}

// procura de trás para frente as páginas com respostas; para quando uma página não tem nenhuma depois de já ter achado
export async function lerGabarito(doc, { maxPag = 120 } = {}) {
  // a última página pode ter só 1 ou 2 respostas: vale enquanto o bloco principal (3 ou mais por página) não apareceu
  const pags = []; let bloco = false;
  for (let p = doc.numPages; p >= Math.max(1, doc.numPages - maxPag); p--) {
    const ls = await linhas(doc, p); const n = ls.filter(l => GAB.test(l)).length;
    if (n >= 3 || (n >= 1 && !bloco)) { pags.unshift(ls); if (n >= 3) bloco = true; continue; }
    if (bloco) break;
  }
  const g = {}; let atual = null;
  for (const ls of pags) for (const l of ls) {
    const m = GAB.exec(l);
    if (m && !g[+m[1]]) { atual = +m[1]; g[atual] = { r: resp(m[2]), ref: m[3] }; continue; }
    if (atual && !/^\d/.test(l) && g[atual].ref.length < 600) g[atual].ref += ' ' + l;
  }
  return g;
}
