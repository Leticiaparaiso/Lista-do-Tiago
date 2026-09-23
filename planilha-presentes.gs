/**
 * Planilha de presentes – lista do Tiago
 * Recebe os presentes e recados que os convidados deixam no site
 * e guarda tudo na aba "Reservas" desta planilha.
 *
 * ANTES DE PUBLICAR: troque a senha abaixo por uma senha só sua.
 * É com ela que você vê os nomes e recados na página de edição do site.
 */
const ADMIN_KEY = 'TROQUE-ESTA-SENHA';
const LISTA_URL = 'https://lista-do-tiago.onrender.com/lista.json';

const SHEET = 'Reservas';
const HEAD = ['id', 'data', 'itemId', 'item', 'quantidade', 'valor', 'nome', 'mensagem', 'status'];

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET);
  if (!sh) {
    sh = ss.insertSheet(SHEET);
    sh.appendRow(HEAD);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, HEAD.length).setFontWeight('bold');
  }
  return sh;
}

function rows_() {
  const values = sheet_().getDataRange().getValues();
  values.shift();
  return values.filter(r => r[0] !== '').map(r => ({
    id: String(r[0]),
    date: r[1] instanceof Date ? r[1].toISOString() : String(r[1]),
    itemId: String(r[2]),
    item: String(r[3]).replace(/^'/, ''),
    qty: Number(r[4]) || 0,
    amount: Number(r[5]) || 0,
    name: String(r[6]).replace(/^'/, ''),
    message: String(r[7]).replace(/^'/, ''),
    status: String(r[8] || 'ativa')
  }));
}

function summary_() {
  const counts = {}, amounts = {};
  rows_().forEach(r => {
    if (r.status === 'cancelada') return;
    counts[r.itemId] = (counts[r.itemId] || 0) + r.qty;
    amounts[r.itemId] = (amounts[r.itemId] || 0) + r.amount;
  });
  return { ok: true, counts: counts, amounts: amounts };
}

function out_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function clean_(s, max) {
  return String(s == null ? '' : s).replace(/[\u0000-\u0009\u000B-\u001F]/g, ' ').trim().slice(0, max);
}

// evita que um texto seja interpretado como fórmula na planilha
function safe_(s) {
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

// Público: só devolve quantas unidades / quanto dinheiro já foi reservado por item (sem nomes).
function doGet() {
  return out_(summary_());
}

function doPost(e) {
  let body = {};
  try {
    body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  } catch (err) {
    return out_({ ok: false, error: 'Pedido inválido.' });
  }

  if (body.action === 'reserve') return reserve_(body);

  if (body.action === 'list' || body.action === 'cancel' || body.action === 'restore') {
    if (String(body.key || '') !== ADMIN_KEY) return out_({ ok: false, error: 'Senha incorreta.' });
    if (body.action === 'list') return out_({ ok: true, rows: rows_() });
    return setStatus_(String(body.id || ''), body.action === 'cancel' ? 'cancelada' : 'ativa');
  }

  return out_({ ok: false, error: 'Ação desconhecida.' });
}

function reserve_(b) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const name = clean_(b.name, 60);
    const message = clean_(b.message, 500);
    const itemId = clean_(b.itemId, 80);
    let itemName = clean_(b.itemName, 150);
    let qty = Math.max(0, Math.floor(Number(b.qty) || 0));
    const amount = Math.max(0, Math.round((Number(b.amount) || 0) * 100) / 100);

    if (!name) return out_({ ok: false, error: 'Escreva seu nome, por favor.' });
    if (!itemId) return out_({ ok: false, error: 'Item inválido.' });

    if (itemId !== 'pix') {
      let item = null;
      try {
        const data = JSON.parse(UrlFetchApp.fetch(LISTA_URL + '?v=' + Date.now(), { muteHttpExceptions: true }).getContentText());
        item = (data.items || []).find(x => x.id === itemId) || null;
        if (!item) return out_({ ok: false, error: 'Item não encontrado. Atualize a página.' });
      } catch (err) {
        item = null; // se o site estiver fora do ar, registra mesmo assim
      }
      if (item) {
        itemName = String(item.name || itemName);
        const s = summary_();
        if (item.taken) return out_(Object.assign(s, { ok: false, error: 'Este presente já foi escolhido por outra pessoa.' }));
        const meta = (item.meta && Number(item.units) > 0) ? (data.metas || []).find(m => m.id === item.meta) : null;
        if (item.pool) {
          qty = 0;
        } else if (meta) {
          // meta por quantidade (ex.: fraldas): soma as unidades de todos os pacotes da mesma meta
          if (qty < 1) qty = 1;
          let usado = Number(meta.have) || 0;
          (data.items || []).forEach(x => {
            if (x.meta === meta.id && Number(x.units) > 0) usado += (s.counts[x.id] || 0) * Number(x.units);
          });
          const faltam = (Number(meta.min) || 0) - usado;
          if (faltam <= 0) return out_(Object.assign(s, { ok: false, error: 'A meta de ' + meta.name + ' já foi completada. Obrigada!' }));
          const maxPacotes = Math.ceil(faltam / Number(item.units));
          if (qty > maxPacotes) return out_(Object.assign(s, { ok: false, error: 'Agora faltam só ' + faltam + ' ' + (meta.unit || 'unidades') + '. Escolha até ' + maxPacotes + (maxPacotes > 1 ? ' pacotes.' : ' pacote.') }));
        } else {
          if (qty < 1) qty = 1;
          const falta = (Number(item.qty) || 1) - (Number(item.got) || 0) - (s.counts[itemId] || 0);
          if (falta <= 0) return out_(Object.assign(s, { ok: false, error: 'Este presente já foi escolhido por outra pessoa.' }));
          if (qty > falta) return out_(Object.assign(s, { ok: false, error: 'Agora só ' + (falta > 1 ? 'faltam ' : 'falta ') + falta + '. Ajuste a quantidade.' }));
        }
      }
    }

    const id = Utilities.getUuid().slice(0, 8);
    sheet_().appendRow([id, new Date(), itemId, safe_(itemName), qty, amount, safe_(name), safe_(message), 'ativa']);
    return out_(Object.assign(summary_(), { ok: true, id: id }));
  } finally {
    lock.releaseLock();
  }
}

function setStatus_(id, status) {
  const sh = sheet_();
  const ids = sh.getRange(1, 1, sh.getLastRow(), 1).getValues();
  for (let i = 1; i < ids.length; i++) {
    if (String(ids[i][0]) === id) {
      sh.getRange(i + 1, 9).setValue(status);
      return out_({ ok: true });
    }
  }
  return out_({ ok: false, error: 'Registro não encontrado.' });
}
