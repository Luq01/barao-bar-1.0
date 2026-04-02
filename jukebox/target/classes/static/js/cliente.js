const API = '/api/pedidos/';
let timeoutBusca;
let ultimaBusca = '';

document.getElementById('tituloMusica').addEventListener('input', (e) => {
  clearTimeout(timeoutBusca);

  const query = e.target.value.trim();
  const container = document.getElementById('previa-container');
  const thumb = document.getElementById('previa-thumb');
  const tituloPreview = document.getElementById('previa-titulo');

  if (query.length < 5) {
    container.style.display = 'none';
    return;
  }

  // 🚀 evita repetir a mesma busca
  if (query === ultimaBusca) return;

  timeoutBusca = setTimeout(async () => {
    try {
      ultimaBusca = query;

      const res = await fetch(`/api/pedidos/youtube/buscar?query=${encodeURIComponent(query)}`);
      const dados = await res.json();

      const cleanId = (dados.id || '').replace(/[^a-zA-Z0-9_-]/g, "");

      if (cleanId) {
        const tempImg = new Image();

        tempImg.onload = () => {
          // evita atualizar UI com busca antiga
          if (document.getElementById('tituloMusica').value.trim() !== query) return;

          thumb.src = `https://i.ytimg.com/vi/${cleanId}/mqdefault.jpg`;
          tituloPreview.textContent = dados.titulo;
          container.style.display = 'flex';
        };

        tempImg.src = `https://i.ytimg.com/vi/${cleanId}/hqdefault.jpg`;
      } else {
        container.style.display = 'none';
      }

    } catch (err) {
      container.style.display = 'none';
    }
  }, 800); // ⬅️ ajuste aqui
});

async function enviarPedido() {
  const nome = document.getElementById('nomeCliente').value.trim();
  const musica = document.getElementById('tituloMusica').value.trim();
  const obs = document.getElementById('observacao').value.trim();
  const btn = document.getElementById('btnEnviar');
  const errEl = document.getElementById('errorMsg');

  errEl.style.display = 'none';
  if (!nome) return mostrarErro('Informe seu nome.');
  if (!musica) return mostrarErro('Informe a música.');

  btn.disabled = true;
  btn.textContent = 'Enviando...';

  try {
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nomeCliente: nome, tituloMusica: musica, observacao: obs || null })
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.erro || 'Erro ao enviar pedido');
    }

    const pedido = await res.json();
    document.getElementById('successMusic').textContent = `🎵 "${pedido.tituloMusica}" — ${pedido.nomeCliente}`;
    document.getElementById('formView').style.display = 'none';
    document.getElementById('successView').style.display = 'block';
  } catch (e) {
    mostrarErro(e.message.includes('fetch') ? 'Sem conexão com o servidor.' : e.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Enviar pedido →';
  }
}

function mostrarErro(msg) {
  const el = document.getElementById('errorMsg');
  el.textContent = msg;
  el.style.display = 'block';
}

function novoPedido() {
  document.getElementById('nomeCliente').value = '';
  document.getElementById('tituloMusica').value = '';
  document.getElementById('observacao').value = '';
  document.getElementById('previa-container').style.display = 'none';
  document.getElementById('successView').style.display = 'none';
  document.getElementById('formView').style.display = 'block';
  document.getElementById('nomeCliente').focus();
}

document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && document.getElementById('formView').style.display !== 'none') {
    enviarPedido();
  }
});