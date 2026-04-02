const API = '/api/pedidos/';
let filaAtual = [];

// --- UTILITÁRIOS ---
// Ajustado para usar o servidor de imagens direto do YT (Grátis e sem API)
const getThumb = (id) => id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : 'https://via.placeholder.com/120x68?text=Sem+Video';
const esc = (s) => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function dbg(msg, tipo = 'info') {
  const el = document.getElementById('content-debug');
  if (!el) return;
  const div = document.createElement('div');
  div.className = `log-line log-${tipo}`;
  div.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
  el.prepend(div);
}

function toast(icon, title) {
  const el = document.getElementById('toast');
  document.getElementById('toastIcon').textContent = icon;
  document.getElementById('toastTitle').textContent = title;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 3000);
}

// --- NAVEGAÇÃO ---
function switchQueueTab(name) {
  document.querySelectorAll('.main .queue-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  document.getElementById('pendentes-view').style.display = name === 'pendentes' ? 'block' : 'none';
  document.getElementById('fila-view').style.display = name === 'fila' ? 'block' : 'none';
}

function switchSidebarTab(name) {
  document.querySelectorAll('.sidebar .queue-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('side-tab-' + name).classList.add('active');

  // Garante que o display não mate o scroll ao alternar
  const historico = document.getElementById('content-historico');
  const debug = document.getElementById('content-debug');

  if (name === 'historico') {
    historico.style.display = 'block';
    debug.style.display = 'none';
  } else {
    historico.style.display = 'none';
    debug.style.display = 'block';
  }
}

// --- COMUNICAÇÃO & SINCRONIZAÇÃO ---
async function carregarFilaInicial() {
  try {
    const res = await fetch(API);
    if (res.ok) {
      const novosDados = await res.json();
      if (novosDados.some((p, i) => p.id !== filaAtual[i]?.id || p.status !== filaAtual[i]?.status)){
        filaAtual = novosDados;
        renderTudo();
      }
    }
  } catch (e) {
    dbg("Erro na sincronização: " + e.message, "err");
  }
}

function conectarWS() {
  const sock = new SockJS('/ws');
  const client = Stomp.over(sock);
  client.debug = null;
  client.connect({}, () => {
    document.getElementById('wsDot').className = 'ws-dot connected';
    document.getElementById('wsLabel').textContent = 'Conectado (Tempo Real)';
    client.subscribe('/topic/fila', msg => {
      filaAtual = JSON.parse(msg.body);
      renderTudo();
      dbg("Fila atualizada via WebSocket", "success");
    });
  }, () => {
    document.getElementById('wsDot').className = 'ws-dot';
    document.getElementById('wsLabel').textContent = 'Reconectando...';
    setTimeout(conectarWS, 5000);
  });
}

setInterval(carregarFilaInicial, 5000);

// --- AÇÕES ---
async function atualizarStatus(id, novoStatus) {
  try {
    const res = await fetch(`${API}${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: novoStatus })
    });
    return res.ok;
  } catch (e) { return false; }
}

async function aprovarPedido(id) {
  const pedido = filaAtual.find(p => p.id === id);
  if (!pedido) return;

  const temAlguemTocando = filaAtual.some(p => p.status === 'TOCANDO');
  const filaVazia = filaAtual.filter(p => p.status === 'APROVADO').length === 0;

  if (!temAlguemTocando && filaVazia) {
    await iniciarPlayer(pedido.id, pedido.videoId, pedido.tituloYoutube);
  } else {
    if (await atualizarStatus(id, 'APROVADO')) toast('✅', 'Pedido aprovado');
  }
}

async function rejeitarPedido(id) {
  if (confirm("Deseja remover este pedido?")) {
    await atualizarStatus(id, 'REJEITADO');
  }
}

async function iniciarPlayer(id, videoId, titulo) {
  dbg(`Comando: Tocar ${titulo}`, "success");

  // Ajustado para 'TOCADO' para bater com o Enum do Java
  filaAtual = filaAtual.map(p => {
    if (p.status === 'TOCANDO') return { ...p, status: 'TOCADO' };
    if (p.id === id) return { ...p, status: 'TOCANDO' };
    return p;
  });
  renderTudo();

  window.open(`https://www.youtube.com/watch?v=${videoId}&autoplay=1`, "_blank");

  await atualizarStatus(id, 'TOCANDO');
  toast('▶️', `Iniciando: ${titulo}`);
}

// --- RENDERIZAÇÃO ---
function renderTudo() {
  renderNowPlaying();
  renderPendentes();
  renderFila();
  renderHistorico();
  
  document.getElementById('pendentesCount').textContent = filaAtual.filter(p => p.status === 'PENDENTE').length;
  document.getElementById('filaCount').textContent = filaAtual.filter(p => p.status === 'APROVADO').length;
}

function renderNowPlaying() {
  const tocando = [...filaAtual].reverse().find(p => p.status === 'TOCANDO');
  const el = document.getElementById('nowPlaying');
  
  if (!tocando) {
    el.className = 'now-playing';
    el.innerHTML = `<div class="playing-info"><div class="card-title" style="color:var(--muted2)">Aguardando música...</div></div>`;
    return;
  }

  el.className = 'now-playing active';
  el.innerHTML = `
    <img src="${getThumb(tocando.videoId)}" class="playing-thumb">
    <div class="playing-info">
      <div class="section-title">Visualização de Áudio</div>
      <div class="card-title" style="font-size:1.1rem; margin:4px 0">${esc(tocando.tituloYoutube)}</div>
      <div style="font-size:0.85rem; color:var(--text)">👤 Cliente: ${esc(tocando.nomeCliente)}</div>
      ${tocando.observacao ? `<div style="font-size:0.75rem; color:var(--yellow); margin-top:4px; font-style:italic">"${esc(tocando.observacao)}"</div>` : ''}
    </div>`;
}

function renderPendentes() {
  const list = document.getElementById('pendentesList');
  const data = filaAtual.filter(p => p.status === 'PENDENTE');
  list.innerHTML = data.length ? '' : '<div style="color:var(--muted2); padding:20px; text-align:center">Sem pedidos pendentes</div>';
  
  data.forEach(p => {
    const d = document.createElement('div');
    d.className = 'card pending';
    d.innerHTML = `
      <img src="${getThumb(p.videoId)}" class="card-thumb">
      <div class="card-info">
        <div class="card-title">${esc(p.tituloYoutube)}</div>
        <div style="font-size:0.7rem; color:var(--muted2)">De: ${esc(p.nomeCliente)}</div>
        ${p.observacao ? `<div style="font-size:0.75rem; color:var(--yellow); font-style:italic; margin-top:4px">💬 ${esc(p.observacao)}</div>` : ''}
      </div>
      <div style="display:flex; gap:5px">
        <button class="btn btn-approve" onclick="aprovarPedido(${p.id})">🆗 APROVAR</button>
        <button class="btn btn-reject" onclick="rejeitarPedido(${p.id})">❌ NEGAR</button>
      </div>`;
    list.appendChild(d);
  });
}

function renderFila() {
  const list = document.getElementById('filaList');
  const data = filaAtual.filter(p => p.status === 'APROVADO');
  list.innerHTML = data.length ? '' : '<div style="color:var(--muted2); padding:20px; text-align:center">Fila vazia</div>';
  
  data.forEach((p, i) => {
    const isFirst = (i === 0);
    const titEscapado = esc(p.tituloYoutube).replace(/'/g, "\\'");
    const d = document.createElement('div');
    d.className = `card ${isFirst ? 'first-in-queue' : ''}`;
    d.innerHTML = `
      <span style="font-family:monospace; width:20px; color:var(--muted2)">${i + 1}</span>
      <img src="${getThumb(p.videoId)}" class="card-thumb" style="width:50px; height:30px">
      <div class="card-info">
        <div class="card-title">${esc(p.tituloYoutube)}</div>
        <div style="font-size:0.7rem; color:var(--text)">👤 Cliente: ${esc(p.nomeCliente)}</div>
        ${p.observacao ? `<div style="font-size:0.65rem; color:var(--yellow); font-style:italic">"${esc(p.observacao)}"</div>` : ''}
      </div>
      <div style="display:flex; gap:8px; align-items:center">
        ${isFirst ? `
          <button class="btn btn-play" onclick="iniciarPlayer(${p.id}, '${p.videoId}', '${titEscapado}')">
            ▶️ TOCAR
          </button>` : '<span style="font-size:0.6rem; color:var(--muted2)">AGUARDANDO</span>'}
        <button class="btn btn-reject" onclick="rejeitarPedido(${p.id})">
          ❌ APAGAR
        </button>
      </div>`;
    list.appendChild(d);
  });
}

function renderHistorico() {
  const list = document.getElementById('content-historico');
  
  // 1. Filtra apenas os finalizados (TOCADO ou REJEITADO)
  const data = filaAtual.filter(p => p.status === 'TOCADO' || p.status === 'REJEITADO');

  // 2. Ordena por data/hora (Mais recentes primeiro)
  // Garantimos a ordenação caso o array não venha perfeitamente ordenado do backend
  data.sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm));

  list.innerHTML = data.length ? '' : '<div style="color:var(--muted2); padding:10px; text-align:center">Sem histórico</div>';
  
  data.forEach(p => {
    const dataCriacao = new Date(p.criadoEm);
    // Formata data e hora: "31/03 - 17:45"
    const dataFormatada = dataCriacao.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const horaFormatada = dataCriacao.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const d = document.createElement('div');
    d.className = 'log-line';
    const corStatus = p.status === 'REJEITADO' ? 'var(--red)' : 'var(--green)';
    const obsHtml = p.observacao ? `<div style="font-size:0.65rem; color:var(--yellow); margin-top:2px; font-style:italic">"${esc(p.observacao)}"</div>` : '';
    
    d.innerHTML = `
      <div style="display:flex; gap:10px; align-items:start; padding: 5px 0">
         <img src="${getThumb(p.videoId)}" style="width:45px; height:28px; border-radius:3px; object-fit:cover; margin-top:3px">
         <div style="flex:1">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2px">
              <span style="color:${corStatus}; font-weight:bold; font-size:0.65rem; letter-spacing:0.5px">[${p.status}]</span>
              <span style="color:var(--muted2); font-size:0.6rem; font-family:monospace">${dataFormatada} | ${horaFormatada}</span>
            </div>
            <div style="color:var(--text); font-size:0.75rem; line-height:1.2; font-weight:500">${esc(p.tituloYoutube)}</div>
            <div style="color:var(--muted2); font-size:0.65rem; margin-top:2px">👤 Requisitado por: <strong>${esc(p.nomeCliente)}</strong></div>
            ${obsHtml}
         </div>
      </div>
      <hr style="border:0; border-top:1px solid #333; margin:8px 0">
    `;
    list.appendChild(d);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  carregarFilaInicial();
  conectarWS();
});