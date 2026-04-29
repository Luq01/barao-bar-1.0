/* ========================================
   JAVASCRIPT - SISTEMA BARÃO (SPA)
   Integração: Administrador + Garçom
   ======================================== */

const API_BASE_URL = 'http://localhost:8080';

// ============================================
// 1. ESTADO GLOBAL DA APLICAÇÃO
// ============================================
let currentUser = null;
let menuItemsData = [];
let cartItems = {};
let selectedTable = null;
let pedidosNaTela = {};
let veioDoHistorico = false;
let isComandaAberta = true;
let dadosComandaAtual = null; // Guarda os itens e o total da mesa aberta no momento
let rascunhoComanda = {};

// ============================================
// 2. INICIALIZAÇÃO E ROTEAMENTO
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    checkSession();
});

function checkSession() {
    const auth = sessionStorage.getItem('auth');
    const userStr = sessionStorage.getItem('user');

    // Capturamos os elementos uma única vez
    const loginScreen = document.getElementById('login-screen');
    const adminScreen = document.getElementById('admin-screen');
    const garcomScreen = document.getElementById('garcom-screen');

    if (auth && userStr) {
        currentUser = JSON.parse(userStr);

        // Só remove/adiciona classes se o elemento existir na página atual
        if (loginScreen) {
            loginScreen.classList.remove('active');
            loginScreen.classList.add('hide');
        }

        if (currentUser.role === 'admin' || currentUser.role === 'GERENTE') {
            if (adminScreen) {
                adminScreen.classList.remove('hide');
                adminScreen.classList.add('active');
                loadDashboardData(); // Chama as métricas se estiver na tela de admin
            }
            carregarPedidosExistentes();
            pedidosCozinhaBar();
        } else {
            if (garcomScreen) {
                garcomScreen.classList.remove('hide');
                garcomScreen.classList.add('active');
                carregarCardapio();
            }
        }
        loadTables();
        conectarWebSocket();
    } else {
        // Se não houver sessão, só tenta mostrar o login se ele existir na página
        if (loginScreen) {
            loginScreen.classList.add('active');
        }
        if (adminScreen) adminScreen.classList.add('hide');
        if (garcomScreen) garcomScreen.classList.add('hide');

        // Se estivermos no balance.html sem login, redireciona para o login principal
        if (!loginScreen && window.location.pathname.includes('balance.html')) {
            window.location.href = '../Gerencia_html/admin.html'; // Ajuste o caminho se necessário
        }
    }
}

async function handleLogin(e) {
    if (e) e.preventDefault(); // ✅ Impede o recarregamento da página e dados na URL

    const nomeInput = document.getElementById('username');
    const senhaInput = document.getElementById('password');

    if (!nomeInput.value || !senhaInput.value) {
        alert("Preencha usuário e senha");
        return;
    }

    const nome = nomeInput.value;
    const senha = senhaInput.value;

    try {
        const response = await fetch(`${API_BASE_URL}/gerente/login`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, senha })
        });

        if (!response.ok) {
            alert('Usuário ou senha inválidos no servidor.');
            return;
        }

        const data = await response.json();

        if (data.nome && data.role) {
            currentUser = data;

            // ✅ Salva no cache para evitar erro 401 e limpa a URL
            sessionStorage.setItem('auth', btoa(nome + ":" + senha));
            sessionStorage.setItem('user', JSON.stringify(data));
            window.history.replaceState({}, document.title, window.location.pathname);

            document.getElementById('login-screen').classList.remove('active');
            document.getElementById('login-form').reset();

            if (data.role === 'admin' || data.role === 'GERENTE') {
                document.getElementById('admin-screen').classList.remove('hide');
                document.getElementById('admin-screen').classList.add('active');
                loadDashboardData();
                carregarPedidosExistentes();
                pedidosCozinhaBar();
            } else {
                document.getElementById('garcom-screen').classList.remove('hide');
                document.getElementById('garcom-screen').classList.add('active');
                carregarCardapio();
            }
            loadTables();
            conectarWebSocket();
        } else {
            alert('Usuário ou senha inválidos');
        }
    } catch (error) {
        console.error('Erro no login:', error);
    }
}

function handleLogout() {
    currentUser = null;
    sessionStorage.clear(); // Limpa o cache
    document.getElementById('login-form').reset();
    document.getElementById('admin-screen').classList.add('hide');
    document.getElementById('garcom-screen').classList.add('hide');
    document.getElementById('admin-screen').classList.remove('active');
    document.getElementById('garcom-screen').classList.remove('active');
    checkSession();
}

// ============================================
// 3. MESAS (ADMIN E GARÇOM)
// ============================================
async function loadTables() {
    try {
        const response = await fetch(`${API_BASE_URL}/comanda/abertas`);
        const tables = response.ok ? await response.json() : [];
        renderAdminTables(tables);
        renderGarcomTables(tables);
        if (document.getElementById('active-tables')) {
            document.getElementById('active-tables').textContent = tables.length;
        }
    } catch (error) {
        console.error('Erro ao carregar mesas:', error);
    }
}

function renderAdminTables(tables) {
    const grid = document.getElementById('admin-tables-grid');
    if (!grid) return;
    grid.innerHTML = tables.length ? '' : '<p style="text-align: center; color: var(--color-beige); grid-column: 1/-1;">Nenhuma mesa em atendimento</p>';
    tables.forEach(table => {
        const card = document.createElement('div');
        card.className = 'table-card occupied';
        card.innerHTML = `<div class="table-number">${table.mesa}</div><div class="table-status">Ocupada</div>`;
        card.onclick = () => openTableDetailsModal(table);
        grid.appendChild(card);
    });
}

function renderGarcomTables(tables) {
    const grid = document.getElementById('garcom-tables-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const addCard = document.createElement('div');
    addCard.className = 'table-card add-table-card';
    addCard.innerHTML = `<div class="add-icon"><i class="fas fa-plus"></i></div><div class="table-status">Nova Mesa</div>`;
    addCard.onclick = () => document.getElementById('modal-container').classList.remove('hide');
    grid.appendChild(addCard);

    tables.forEach(table => {
        const card = document.createElement('div');
        card.className = 'table-card occupied';
        card.innerHTML = `<div class="table-number">${table.mesa}</div><div class="table-status">Ocupada</div>`;
        card.onclick = () => openTableDetailsModal(table);
        grid.appendChild(card);
    });
}

async function openMesa(e) {
    if (e) e.preventDefault();
    const input = document.querySelector('#add-new-table input');
    if (!input) return;

    const tableNumber = parseInt(input.value);
    if (isNaN(tableNumber) || tableNumber <= 0) return;

    try {
        const response = await fetch(`${API_BASE_URL}/comanda/abrirMesa`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mesa: tableNumber })
        });

        if (response.ok) {
            input.value = '';
            document.getElementById('modal-container').classList.add('hide');
            await loadTables();
        }
    } catch (error) { console.error('Erro ao abrir mesa:', error); }
}

// ============================================
// 4. COMANDA E PAGAMENTO
// ============================================
function openTableDetailsModal(table) {
    veioDoHistorico = false;
    selectedTable = table;
    selectedTable.aberta = true;
    const numberSpan = document.getElementById('bill-table-number');
    if (numberSpan) numberSpan.textContent = table.mesa;
    comanda(table);
    openModal('bill-modal');
}

async function comanda(mesa) {
    const itensConsumidos = document.getElementById('table-orders');
    const total = document.getElementById('table-total-value');

    try {
        const response = await fetch(`${API_BASE_URL}/comanda/calcular/${mesa.id}`);
        const data = await response.json();

        dadosComandaAtual = data; // Guarda os dados da comanda para usar no pagamento

        let html = data.itens.map(item => `
            <div class="bill-item" style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #444;">
                <div class="item-info">
                    <span class="item-name"><strong>${item.nomeProduto}</strong></span>
                    <span class="item-variation" style="color: #d4af37; font-size: 0.8rem;"> (${item.variacaoProduto})</span>
                 </div>
                <div class="item-details">
                    <span class="item-qty">${item.quantidade}x </span>
                    <span class="item-price">R$ ${item.valorUnitario.toFixed(2)}</span>
                </div>
            </div>`).join('');

        itensConsumidos.innerHTML = html;
        total.textContent = `R$ ${data.valor.toFixed(2)}`;
    } catch (e) {
        console.error(e);
        itensConsumidos.innerHTML = '<p style="color:red;">Erro ao carregar itens.</p>';
        total.textContent = 'R$ 0.00';
    }
}

async function payment() {
    const totalContaTexto = document.getElementById('table-total-value').textContent;
    const totalConta = parseFloat(totalContaTexto.replace('R$ ', '').replace(',', '.').trim());

    let pagamentosRealizados = [];
    let totalPago = 0;

    document.querySelectorAll('.payment-entry').forEach(linha => {
        const select = linha.querySelector('.payment-select');
        const inputValor = linha.querySelector('.payment-amount');
        const metodo = select.value;
        const valor = parseFloat(inputValor.value.replace(',', '.'));
        if (metodo && !isNaN(valor) && valor > 0) {
            pagamentosRealizados.push({ metodo, valor });
            totalPago += valor;
        }
    });

    let saldoDevedor = parseFloat((totalConta - totalPago).toFixed(2));

    if (saldoDevedor === 0) {
        try {
            const response = await fetch(`${API_BASE_URL}/comanda/${selectedTable.id}/fecharMesa`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pagamentos: pagamentosRealizados })
            });
            if (response.ok) {
                mostrarToastPermanente('toast-container-payment-ok');
                setTimeout(() => {
                    document.getElementById('toast-container-payment-ok').classList.add('hide');
                    closeModal('bill-modal');
                    loadTables();
                }, 1000);
            }
        } catch (error) { console.error('Erro ao fechar mesa:', error); }

    } else if (saldoDevedor < 0) {
        try {
            const response = await fetch(`${API_BASE_URL}/comanda/${selectedTable.id}/fecharMesa`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pagamentos: pagamentosRealizados })
            });
            if (response.ok) {
                const troco = Math.abs(saldoDevedor).toFixed(2);
                document.getElementById('troco-amount').textContent = `R$ ${troco}`;
                mostrarToastPermanente('toast-container-payment-troco');
                setTimeout(() => {
                    document.getElementById('toast-container-payment-troco').classList.add('hide');
                    closeModal('bill-modal');
                    loadTables();
                }, 5000);
            }
        } catch (error) { console.error('Erro ao fechar mesa:', error); }

    } else {
        const faltante = saldoDevedor.toFixed(2);
        document.getElementById('faltante-amount-value').textContent = faltante;
        mostrarToastPermanente('toast-container-payment-insufficient');
        setTimeout(() => {
            document.getElementById('toast-container-payment-insufficient').classList.add('hide');
        }, 2000);
    }
}

function addPaymentEntry() {
    const container = document.getElementById('payment-entries');
    const entryDiv = document.createElement('div');
    entryDiv.className = 'payment-entry';
    entryDiv.style.display = 'flex';
    entryDiv.style.gap = '10px';
    entryDiv.style.marginBottom = '10px';
    entryDiv.innerHTML = `
        <select class="payment-select" name="paymentMethod[]" required>
            <option value="">Selecione...</option>
            <option value="dinheiro">Dinheiro</option>
            <option value="credito">Cartão de Crédito</option>
            <option value="debito">Cartão de Débito</option>
            <option value="pix">PIX</option>
            <option value="outro">Outro</option>
        </select>
        <input type="number" class="payment-amount" name="paymentMethod[]" placeholder="Valor (R$)" required>
        <button onclick="this.parentElement.remove()" style="background: #c0392b; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Remover</button>
    `;
    container.appendChild(entryDiv);
}

// ============================================
// 5. CARDÁPIO E PEDIDOS (GARÇOM)
// ============================================
async function carregarCardapio() {
    try {
        const response = await fetch(`${API_BASE_URL}/menu/cardapio`);
        const data = await response.json();
        menuItemsData = data;
        renderMenuItems(menuItemsData);
    } catch (error) { console.error('Erro ao carregar cardápio:', error); }
}

function renderMenuItems(items) {
    const container = document.getElementById('menu-items');
    if (!container) return;
    container.innerHTML = '';

    if (!items || items.length === 0) {
        container.innerHTML = '<p style="color: #d4af37; text-align: center; width: 100%; margin-top: 20px;">Nenhum item encontrado.</p>';
        return;
    }

    items.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'menu-item';
        const lista = item.variacaoProduto || [];

        let variationsHtml = lista.map(v => {
            const qtd = cartItems[v.id]?.quantity || 0;
            return `
            <div class="variation-row" style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px; background: rgba(255,255,255,0.05); padding: 8px; border-radius: 5px; border: 1px solid rgba(212,175,55,0.3); flex-wrap: wrap; gap: 10px;">
                
                <span style="color: #fff; font-size: 0.9rem; flex: 1; min-width: 100px; word-break: break-word;">
                    ${v.tamanho} - R$ ${v.valor.toFixed(2)}
                </span>
                
                <div class="quantity-controls" style="display: flex; align-items: center; gap: 10px; flex-shrink: 0;">
                    <button type="button" class="btn-qty" onclick='changeQty(${v.id}, -1, "${item.nome}", "${v.tamanho}")' style="background: #c0392b; color: white; border: none; width: 28px; height: 28px; border-radius: 4px; cursor: pointer;">-</button>
                    <span id="qty-${v.id}" style="color: #d4af37; font-weight: bold; min-width: 20px; text-align: center;">${qtd}</span>
                    <button type="button" class="btn-qty" onclick='changeQty(${v.id}, 1, "${item.nome}", "${v.tamanho}")' style="background: #27ae60; color: white; border: none; width: 28px; height: 28px; border-radius: 4px; cursor: pointer;">+</button>
                </div>
            </div>`;
        }).join('');

        itemDiv.innerHTML = `
            <div class="menu-item-card" style="background: rgba(0,0,0,0.4); border-left: 4px solid #d4af37; padding: 12px; border-radius: 8px; margin-bottom: 12px;">
                <h3 style="color: #d4af37; font-family: 'Rye', cursive; margin: 0; font-size: 1.1rem;">${item.nome}</h3>
                <div class="variations-list">${variationsHtml}</div>
            </div>
        `;
        container.appendChild(itemDiv);
    });
}

function changeQty(varId, delta, pNome, vTam) {
    if (!cartItems[varId]) {
        cartItems[varId] = { id: varId, nome: `${pNome} (${vTam})`, quantity: 0 };
    }
    cartItems[varId].quantity += delta;

    if (cartItems[varId].quantity <= 0) {
        delete cartItems[varId];
        const span = document.getElementById(`qty-${varId}`);
        if (span) span.innerText = 0;
    } else {
        const span = document.getElementById(`qty-${varId}`);
        if (span) span.innerText = cartItems[varId].quantity;
    }
}

function renderOrderSummary() {
    const modalResume = document.getElementById('resume-modal');
    if (modalResume) modalResume.classList.remove('hide');
    const summaryContainer = document.getElementById('order-summary');
    if (!summaryContainer) return;

    summaryContainer.innerHTML = '';

    const items = Object.values(cartItems);
    if (items.length === 0) {
        summaryContainer.innerHTML = '<p style="color: #d4af37; text-align: center;">Nenhum item adicionado.</p>';
        return;
    }

    items.forEach(i => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'summary-item-row';
        itemDiv.innerHTML = `
            <div class="summary-item-name">${i.nome}</div>
            <div class="summary-controls">
                <div class="qty-wrapper">
                    <button type="button" onclick="updateSummaryQty(${i.id}, -1)" class="btn-qty btn-minus">-</button>
                    <span class="qty-number">${i.quantity}</span>
                    <button type="button" onclick="updateSummaryQty(${i.id}, 1)" class="btn-qty btn-plus">+</button>
                </div>
                <button type="button" onclick="removeFromCart(${i.id})" class="btn-remove">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `;
        summaryContainer.appendChild(itemDiv);
    });
}

function updateSummaryQty(varId, delta) {
    changeQty(varId, delta);
    renderOrderSummary();
}

function removeFromCart(varId) {
    delete cartItems[varId];
    renderOrderSummary();
}

function closeOrderSummaryReturnMenu() {
    const modalResume = document.getElementById('resume-modal');
    if (modalResume) modalResume.classList.add('hide');
}

async function addOrderToTable() {
    const orderItems = Object.values(cartItems);
    if (orderItems.length === 0 || !selectedTable) {
        alert("Adicione itens ou selecione uma mesa.");
        return;
    }

    const payload = {
        comanda: { mesa: selectedTable.mesa },
        itens: orderItems.map(i => ({
            variacaoProduto: { id: i.id },
            quantidade: i.quantity
        }))
    };

    try {
        const response = await fetch(`${API_BASE_URL}/pedido/novoPedido`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            // ✅ LIMPA O CARRINHO E O CARDÁPIO VISUALMENTE
            cartItems = {};
            closeOrderSummaryReturnMenu();
            closeModal('menu-modal');
            renderMenuItems(menuItemsData);

            mostrarToastPermanente('toast-container');
            setTimeout(() => {
                document.getElementById('toast-container').classList.add('hide');
            }, 1500);
        }
    } catch (error) { console.error(error); }
}

async function loadTablesForSelection() {
    try {
        const response = await fetch(`${API_BASE_URL}/comanda/abertas`);
        const tables = await response.json();
        const grid = document.getElementById('table-selection-grid');
        if (!grid) return;
        grid.innerHTML = '';

        tables.forEach(table => {
            const card = document.createElement('div');
            card.className = 'table-card occupied';
            card.innerHTML = `<div class="table-number">${table.mesa}</div>`;
            card.onclick = () => {
                selectedTable = table;
                document.getElementById('selected-table-number').textContent = table.mesa;
                closeModal('select-table-modal');
                openModal('menu-modal');
            };
            grid.appendChild(card);
        });
    } catch (err) { console.error(err); }
}

// ============================================
// 6. PERSISTÊNCIA E WEBSOCKET
// ============================================

async function carregarPedidosExistentes() {
    const auth = sessionStorage.getItem('auth');
    if (!auth) return; // 🛑 Impede execução se não estiver logado

    try {
        const response = await fetch(`${API_BASE_URL}/pedido/recebidos`, {
            headers: { 'Authorization': 'Basic ' + auth }
        });

        if (!response.ok) return;

        const orders = await response.json();
        const ordersSection = document.getElementById('orders-section');
        if (ordersSection) ordersSection.innerHTML = '';

        if (orders && orders.length > 0) {
            orders.forEach(order => {
                // O 'order' que vem do backend agora já é o NotificacaoPedidoDTO perfeito!
                renderizarNovoPedido(order);
            });
        }
    } catch (error) {
        console.error('Erro ao processar os dados:', error);
    }
}

// Função original (corrigida para usar cache e não dar 401)
async function pedidosCozinhaBar() {
    const ordersSection = document.getElementById('orders-section');

    const auth = sessionStorage.getItem('auth');
    if (!auth) return; // 🛑 Impede execução se não estiver logado

    try {
        const response = await fetch(`${API_BASE_URL}/pedido/recebidos`, {
            headers: { 'Authorization': 'Basic ' + auth }
        });

        if (!response.ok) return;

        const orders = await response.json();
        if (ordersSection) ordersSection.innerHTML = '';

        if (orders && orders.length > 0) {
            orders.forEach(order => {
                // O 'order' que vem do backend agora já é o NotificacaoPedidoDTO perfeito!
                renderizarNovoPedido(order);
            });
        }
    } catch (error) {
        console.error('Erro ao carregar pedidos:', error);
    }
}

function conectarWebSocket() {
    if (typeof SockJS === 'undefined') {
        console.warn("SockJS não carregado. Pulando conexão WebSocket.");
        return;
    }
    const auth = sessionStorage.getItem('auth');
    if (!auth) return; // 🛑 Impede execução se não estiver logado

    let socket = new SockJS(`${API_BASE_URL}/ws-pvd`);
    let stompClient = Stomp.over(socket);

    const headers = {
        Authorization: "Basic " + auth
    };

    stompClient.connect(headers, function (frame) {
        console.log("Conectado ao WebSocket!");
        stompClient.subscribe('/topic/pedido', function (mensagem) {
            let notificacao = JSON.parse(mensagem.body);
            renderizarNovoPedido(notificacao);
        });
    }, function (error) {
        console.log("Erro na conexão WebSocket: ", error);
    });
}

function renderizarNovoPedido(notificacao) {
    const itensPreparo = notificacao.itensParaPreparo || [];
    const pedidoCompleto = notificacao.pedidoCompleto || [];
    const mesa = notificacao.numeroMesa;
    const ordersSection = document.getElementById('orders-section');

    // Adicionamos um número aleatório de 0 a 9999 no final do ID
    const cardId = `pedido-mesa-${mesa}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    pedidosNaTela[cardId] = notificacao;

    // Note o flex-shrink: 0 no título e no botão para evitar que eles sejam esmagados caso o conteúdo seja muito grande
    let cardHtml = `
        <div class="card-pedido" id="${cardId}">
            <h2 style="color: #d4af37; margin: 0 0 10px 0; flex-shrink: 0;">
                📍 Mesa ${mesa} <span style="font-size: 0.8rem; color: #aaa;">(⏱️ ${notificacao.horaPedido || 'Sem hora'})</span>
            </h2>
            
            <div class="scroll-conteudo">
                <div class="item-info-container">
                    <div style="width: 100%;">
                        <h4 style="margin: 0 0 5px 0; color: #fff;">🔥 ITENS PARA PREPARO</h4>
                        <ul style="list-style: none; padding: 0; margin: 0;">`;

    itensPreparo.forEach(item => {
        cardHtml += `<li style="margin-bottom: 8px;"><strong>${item.quantidade}x</strong> ${item.nomeProduto} - <small>(${item.variacaoProduto})</small></li>`;
    });

    cardHtml += `       </ul>
                    </div>
                </div>

                <div class="item-complete-container">
                    <h4 style="margin: 0 0 5px 0; color: #bbb;">📋 PEDIDO COMPLETO</h4>
                    <ul style="list-style: none; padding: 0; margin: 0; font-size: 0.9rem; color: #ccc;">`;

    pedidoCompleto.forEach(item => {
        cardHtml += `<li style="margin-bottom: 5px;">${item.quantidade}x ${item.nomeProduto} - <small>(${item.variacaoProduto})</small></li>`;
    });

    cardHtml += `       </ul>
                </div>
            </div>
            <div style="margin-top: auto; text-align: right; flex-shrink: 0; border-top: 1px solid #333; padding-top: 10px;">
            <button type="button" onclick="imprimirPedido('${cardId}')" style="cursor:pointer; background:#27ae; color:white; border:none; padding:8px 12px; border-radius:4px; font-weight: bold;"><i class="fa-solid fa-print"></i></button>
            <button type="button" onclick="marcarComoLido(this)" style="cursor:pointer; background:#27ae60; color:white; border:none; padding:8px 12px; border-radius:4px; font-weight: bold;">Visto</button>
            </div>
        </div>`;

    if (ordersSection && ordersSection.innerHTML.includes("Nenhum pedido")) {
        ordersSection.innerHTML = "";
    }

    if (ordersSection) {
        ordersSection.innerHTML += cardHtml;
    }
}

function marcarComoLido(button) {
    const card = button.closest('.card-pedido');

    if (card) {
        // 1. Adiciona a classe que muda a cor e joga o card pro final da tela
        card.classList.add("read");

        // 2. Desativa APENAS o botão de "Visto", e não o card inteiro
        button.disabled = true;
        button.innerText = "Lido";
        button.style.opacity = 0.5;
        button.style.cursor = 'default';

        // Removemos o setTimeout(() => card.remove(), 1000);
        // Removemos o delete pedidosNaTela[idDoCard];
    }
}


function renderizarNovoPedido(notificacao) {
    const itensPreparo = notificacao.itensParaPreparo || [];
    const pedidoCompleto = notificacao.pedidoCompleto || [];
    const mesa = notificacao.numeroMesa;
    const ordersSection = document.getElementById('orders-section');

    // 1. Pega o ID verdadeiro do banco que o Java mandou
    const idReal = notificacao.idPedido;
    const cardId = idReal ? `pedido-${idReal}` : `pedido-mesa-${mesa}-${Date.now()}`;
    pedidosNaTela[cardId] = notificacao;

    // 2. Verifica se o Java informou que já foi "Visto"
    const isVisto = notificacao.visto === true;

    // Se já foi visto, aplica a classe CSS "read" pra ficar cinza
    const classeCss = isVisto ? "card-pedido read" : "card-pedido";

    // 3. Monta o botão: se for visto, já vem desativado. Senão, vem clicável passando o ID pro JS.
    const btnVistoProps = isVisto
        ? `disabled style="opacity: 0.5; cursor: default; background:#27ae60; color:white; border:none; padding:8px 12px; border-radius:4px; font-weight: bold;"`
        : `onclick="marcarComoLido(this, ${idReal})" style="cursor:pointer; background:#27ae60; color:white; border:none; padding:8px 12px; border-radius:4px; font-weight: bold;"`;

    const textoBotao = isVisto ? "Lido" : "Visto";

    let cardHtml = `
        <div class="${classeCss}" id="${cardId}">
            <h2 style="color: #d4af37; margin: 0 0 10px 0; flex-shrink: 0;">
                📍 Mesa ${mesa} <span style="font-size: 0.8rem; color: #aaa;">(⏱️ ${notificacao.horaPedido || 'Sem hora'})</span>
            </h2>
            
            <div class="scroll-conteudo">
                <div class="item-info-container">
                    <div style="width: 100%;">
                        <h4 style="margin: 0 0 5px 0; color: #fff;">🔥 ITENS PARA PREPARO</h4>
                        <ul style="list-style: none; padding: 0; margin: 0;">`;

    itensPreparo.forEach(item => {
        cardHtml += `<li style="margin-bottom: 8px;"><strong>${item.quantidade}x</strong> ${item.nomeProduto} - <small>(${item.variacaoProduto})</small></li>`;
    });

    cardHtml += `       </ul>
                    </div>
                </div>

                <div class="item-complete-container">
                    <h4 style="margin: 0 0 5px 0; color: #bbb;">📋 PEDIDO COMPLETO</h4>
                    <ul style="list-style: none; padding: 0; margin: 0; font-size: 0.9rem; color: #ccc;">`;

    pedidoCompleto.forEach(item => {
        cardHtml += `<li style="margin-bottom: 5px;">${item.quantidade}x ${item.nomeProduto} - <small>(${item.variacaoProduto})</small></li>`;
    });

    cardHtml += `       </ul>
                </div>
            </div>
            <div style="margin-top: auto; text-align: right; flex-shrink: 0; border-top: 1px solid #333; padding-top: 10px;">
                <button type="button" onclick="imprimirPedido('${cardId}')" style="cursor:pointer; background:#27ae; color:white; border:none; padding:8px 12px; border-radius:4px; font-weight: bold;"><i class="fa-solid fa-print"></i></button>
                <button type="button" ${btnVistoProps}>${textoBotao}</button>
            </div>
        </div>`;

    if (ordersSection && ordersSection.innerHTML.includes("Nenhum pedido")) {
        ordersSection.innerHTML = "";
    }

    if (ordersSection) {
        ordersSection.innerHTML += cardHtml;
    }
}

async function marcarComoLido(button, idPedido) {
    const card = button.closest('.card-pedido');

    if (card) {
        // 1. Muda a interface na hora pro usuário não perceber demora (UX)
        card.classList.add("read");
        button.disabled = true;
        button.innerText = "Lido";
        button.style.opacity = 0.5;
        button.style.cursor = 'default';

        // 2. Chama a API do Java pra salvar isso no banco de dados
        if (idPedido) {
            const auth = sessionStorage.getItem('auth');
            try {
                const response = await fetch(`${API_BASE_URL}/pedido/${idPedido}/visto`, {
                    method: 'PUT',
                    headers: { 'Authorization': 'Basic ' + auth }
                });

                if (!response.ok) {
                    console.error("Erro no servidor ao marcar pedido como visto.");
                }
            } catch (erro) {
                console.error("Erro de conexão ao salvar status de Visto no banco:", erro);
            }
        }
    }
}

function imprimirPedido(cardId) {
    // 1. Criamos a div que será o fundo escuro (Overlay)
    const dadosPedido = pedidosNaTela[cardId];
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    // 2. Injetamos o conteúdo HTML dentro desse fundo
    overlay.innerHTML = `
        <div class="modal-content-print">
            <h3 style="color: #d4af37; margin-top: 0;">🖨️ Opções de Impressão</h3>
            <p style="font-size: 0.9rem; margin-bottom: 20px;">O que você deseja imprimir para este pedido?</p>
            
            <button class="modal-btn btn-preparo" id="btn-imp-preparo">🔥 Itens para Preparo</button>
            <button class="modal-btn btn-completo" id="btn-imp-completo">📋 Pedido Completo</button>
            <button class="modal-btn btn-cancelar" id="btn-cancelar">Cancelar</button>
        </div>
    `;

    // 3. Adicionamos o modal inteiro na tela (no body do documento)
    document.body.appendChild(overlay);

    // 4. Capturamos os botões que acabamos de criar para dar ações a eles
    const btnPreparo = overlay.querySelector('#btn-imp-preparo');
    const btnCompleto = overlay.querySelector('#btn-imp-completo');
    const btnCancelar = overlay.querySelector('#btn-cancelar');


    btnCancelar.onclick = () => {
        fecharModal(overlay);
    };

    btnPreparo.onclick = () => {
        prepararImpressao(dadosPedido, 'preparo');
        fecharModal(overlay);
    };

    btnCompleto.onclick = () => {
        prepararImpressao(dadosPedido, 'completo');
        fecharModal(overlay);
    };
}

// Função auxiliar para remover o modal da tela
function fecharModal(elementoOverlay) {
    // Remove o elemento HTML completamente da página
    elementoOverlay.remove();
}

function fecharModalConta() {
    // 1. Sempre fecha o modal de conta
    closeModal('bill-modal');

    // 2. Se a origem for o histórico, abre ele de volta!
    if (veioDoHistorico) {
        abrirModalTodasComandas();
    }
}

async function alterarTaxas() {
    document.getElementById('taxas-modal').classList.remove('hide');
    openModal('taxas-modal');
    const auth = sessionStorage.getItem('auth');

    try {
        const response = await fetch(`${API_BASE_URL}/gerente/taxas`, {
            method: 'GET',
            headers: {
                'Authorization': 'Basic ' + auth,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            document.getElementById('taxas-atuais').innerHTML = `
                <p><strong>Taxa de Crédito:</strong> <span style="color:red;">${data.taxaCredito}%</span></p>
                <p><strong>Taxa de Débito:</strong> <span style="color:red;">${data.taxaDebito}%</span></p>
            `;
        }
    } catch (error) {
        console.error('Erro ao carregar taxas:', error);
        document.getElementById('taxas-atuais').innerHTML = '<p style="color:red;">Erro ao conectar com o servidor.</p>';
    }
}

async function salvarTaxas(event) {
    event.preventDefault();
    const auth = sessionStorage.getItem('auth');
    const novaTaxaCredito = parseFloat(document.getElementById('taxa-credito').value);
    const novaTaxaDebito = parseFloat(document.getElementById('taxa-debito').value);

    try {
        const response = await fetch(`${API_BASE_URL}/gerente/novaTaxa`, {
            method: 'PUT',
            headers: {
                'Authorization': 'Basic ' + auth,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                taxaCredito: novaTaxaCredito,
                taxaDebito: novaTaxaDebito
            })
        });

        if (response.ok) {
            alert('Taxas atualizadas com sucesso!');
            closeModal('taxas-modal');
            document.getElementById('taxas-form').reset();
        } else {
            alert('Erro ao atualizar taxas.');
        }
    } catch (error) {
        console.error('Erro ao salvar taxas:', error);
        alert('Erro ao conectar com o servidor.');
    }
}

//IMPRESSORAAAAAA
// A impressora do Windows que vimos no seu print se chama "POS-58"
const NOME_IMPRESSORA_WINDOWS = "BARAO-PRINTER";

function prepararImpressao(pedido, tipo) {
    const horaFormatada = pedido.horaPedido || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    let listaItens = tipo === 'preparo' ? (pedido.itensParaPreparo || []) : (pedido.pedidoCompleto || []);

    // 1. Inicia a conexão com o QZ Tray rodando no PC
    if (!qz.websocket.isActive()) {
        qz.websocket.connect().then(() => {
            executarImpressaoQZ(pedido, tipo, listaItens, horaFormatada);
        }).catch(err => {
            console.error("Erro ao conectar no QZ Tray. Ele está aberto no Windows?", err);
            alert("Abra o QZ Tray no computador para imprimir!");
        });
    } else {
        executarImpressaoQZ(pedido, tipo, listaItens, horaFormatada);
    }
}

function executarImpressaoQZ(pedido, tipo, listaItens, horaFormatada) {
    qz.printers.find(NOME_IMPRESSORA_WINDOWS).then((printer) => {
        let config = qz.configs.create(printer);

        // --- 1. DICIONÁRIO DE COMANDOS ESC/POS ---
        const ESC_INIT = '\x1B' + '\x40';                 // Reset

        // NOVO: Comando GS L (Margem Esquerda). \x1E significa 30 pontos (aprox. 3.7 milímetros)
        const MARGEM_ESQUERDA = '\x1D' + '\x4C' + '\x1E' + '\x00';

        const ALINHA_CENTRO = '\x1B' + '\x61' + '\x31';   // Centralizado
        const ALINHA_ESQUERDA = '\x1B' + '\x61' + '\x30'; // Esquerda
        const NEGRITO_ON = '\x1B' + '\x45' + '\x01';      // Liga Negrito
        const NEGRITO_OFF = '\x1B' + '\x45' + '\x00';     // Desliga Negrito

        const TAMANHO_NORMAL = '\x1D' + '\x21' + '\x00';  // Fonte padrão
        const ALTURA_DUPLA = '\x1D' + '\x21' + '\x01';    // Mais alto
        const TAMANHO_DUPLO = '\x1D' + '\x21' + '\x11';   // Alto e Largo

        // IMPORTANTE: Reduzimos de 32 para 29 traços. 
        // Como empurramos o texto para a direita, se mantivermos 32 ele pula de linha.
        const TRACEJADO = '-----------------------------\n';

        // --- 2. CABEÇALHO DO CUPOM ---
        let dadosImpressao = [
            ESC_INIT,
            MARGEM_ESQUERDA, // <-- APLICA A MARGEM LOGO APÓS INICIALIZAR
            ALINHA_CENTRO,
            TAMANHO_DUPLO,
            NEGRITO_ON,
            `MESA ${pedido.numeroMesa}\n`,
            TAMANHO_NORMAL,
            NEGRITO_OFF,
            `HORA: ${horaFormatada}\n`,
            NEGRITO_ON,
            `IMPRESSO: ${tipo.toUpperCase()}\n`,
            NEGRITO_OFF,
            TRACEJADO,
            ALINHA_ESQUERDA
        ];

        // --- 3. ITENS DO PEDIDO ---
        listaItens.forEach(item => {
            dadosImpressao.push(ALTURA_DUPLA);
            dadosImpressao.push(NEGRITO_ON);
            dadosImpressao.push(`${item.quantidade}x ${item.nomeProduto}\n`);
            dadosImpressao.push(NEGRITO_OFF);
            dadosImpressao.push(TAMANHO_NORMAL);

            if (item.variacaoProduto) {
                dadosImpressao.push(`  (${item.variacaoProduto})\n`);
            }
            dadosImpressao.push('\x0A'); // Pula uma linha
        });

        // --- 4. RODAPÉ ---
        dadosImpressao.push(
            ALINHA_CENTRO,
            TRACEJADO,
            NEGRITO_ON,
            'BARAO - SISTEMA INTEGRADO\n',
            NEGRITO_OFF,
            '\n\n\n\n\n' // Avanço de papel para rasgo
        );

        return qz.print(config, dadosImpressao);

    }).then(() => {
        console.log("Impressão enviada com Margem Ajustada!");
    }).catch((e) => {
        console.error("Erro na impressão:", e);
    });
}

function imprimirResumoFechamento() {
    if (!dadosComandaAtual || !selectedTable) return;

    // 1. Garante que o QZ Tray está conectado
    if (!qz.websocket.isActive()) {
        qz.websocket.connect().then(() => {
            enviarResumoParaImpressora();
        }).catch(err => {
            console.error("Erro no QZ Tray. Ele está aberto?", err);
            alert("Abra o QZ Tray no computador para imprimir!");
        });
    } else {
        enviarResumoParaImpressora();
    }
}

function enviarResumoParaImpressora() {
    const printerName = "BARAO-PRINTER";

    qz.printers.find(printerName).then((printer) => {
        let config = qz.configs.create(printer);

        const ESC_INIT = '\x1B' + '\x40';
        const MARGEM_ESQUERDA = '\x1D' + '\x4C' + '\x1E' + '\x00';
        const ALINHA_CENTRO = '\x1B' + '\x61' + '\x31';
        const ALINHA_ESQUERDA = '\x1B' + '\x61' + '\x30';
        const NEGRITO_ON = '\x1B' + '\x45' + '\x01';
        const NEGRITO_OFF = '\x1B' + '\x45' + '\x00';
        const TAM_DUPLO = '\x1D' + '\x21' + '\x11';
        const TAM_NORMAL = '\x1D' + '\x21' + '\x00';
        const TRACEJADO = '-----------------------------\n';

        let dados = [
            ESC_INIT,
            MARGEM_ESQUERDA,
            ALINHA_CENTRO,
            NEGRITO_ON, TAM_DUPLO, `MESA ${selectedTable.mesa}\n`, NEGRITO_OFF, TAM_NORMAL,

            // MÁGICA 3: Lê o status diretamente da mesa selecionada!
            `CONTA: ${selectedTable.aberta ? 'EM ABERTO' : 'FECHADA'}\n`,

            TRACEJADO,
            ALINHA_ESQUERDA
        ];

        // Listagem dos itens
        dadosComandaAtual.itens.forEach(item => {
            dados.push(`${item.quantidade}x ${item.nomeProduto.substring(0, 20)}\n`);
            dados.push(ALINHA_CENTRO, `R$ ${item.valorUnitario.toFixed(2)} -> R$ ${(item.quantidade * item.valorUnitario).toFixed(2)}\n`, ALINHA_ESQUERDA);
        });

        // Total e Rodapé
        dados.push(
            TRACEJADO,
            ALINHA_CENTRO,
            NEGRITO_ON, TAM_DUPLO, `TOTAL: R$ ${dadosComandaAtual.valor.toFixed(2)}\n`, NEGRITO_OFF, TAM_NORMAL,
            TRACEJADO,
            'BARAO - SISTEMA INTEGRADO\n',
            '\n\n\n\n\n'
        );

        return qz.print(config, dados);
    }).then(() => {
        console.log("Resumo impresso com sucesso!");
    }).catch(err => console.error(err));
}
// ============================================
// 7. GESTÃO DE CARDÁPIO (LÓGICA ADMIN)
// ============================================
function loadDashboardData() {
    console.log("Carregando dados do Admin...");
}

function handleEditMenu() {
    const menuSection = document.getElementById('menu-management-section');
    if (!menuSection) return;

    if (!menuSection.classList.contains('hide')) {
        menuSection.classList.add('hide');
    } else {
        menuSection.classList.remove('hide');
        carregarCardapioAdmin();
        menuSection.scrollIntoView({ behavior: 'smooth' });
    }
}

async function carregarCardapioAdmin() {
    try {
        const response = await fetch(`${API_BASE_URL}/menu/cardapio`);
        const data = await response.json();
        menuItemsData = data;
        renderEditableMenuItems(menuItemsData);
    } catch (error) {
        console.error('Erro ao carregar o cardápio no admin:', error);
    }
}

function renderEditableMenuItems(items) {
    const container = document.getElementById('editable-menu-items');
    if (!container) return;
    container.innerHTML = '';

    if (!items || items.length === 0) {
        container.innerHTML = '<p style="color: var(--color-text-light);">Nenhum item no cardápio.</p>';
        return;
    }

    items.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'editable-item';

        const lista = item.variacaoProduto || [];
        const pricesHtml = lista.map(size => `<span>${size.tamanho}: R$ ${size.valor.toFixed(2)}</span>`).join(' | ');

        itemDiv.innerHTML = `
            <div class="item-info-container">
                <div class="item-info">
                    <strong>${item.nome}</strong>
                    ${pricesHtml}
                    <p>${item.tipo}</p>
                </div>
            </div>
            <div class="item-actions">
                <button type="button" class="btn btn-secondary btn-sm btn-edit" onclick="alert('Edição em breve!')">
                    <i class="fas fa-edit"></i> Editar
                </button>
            </div>
        `;
        container.appendChild(itemDiv);
    });
}

// ============================================
// 8. UTILITÁRIOS E EVENTOS GERAIS
// ============================================

//metricas
// ============================================
// LÓGICA DO DASHBOARD DE MÉTRICAS
// ============================================

// Função auxiliar para formatar dinheiro (Ex: 1500.5 -> R$ 1.500,50)
function formatarMoedaBRL(valor) {
    if (!valor) return "R$ 0,00";
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

async function loadDashboardData() {
    // 1. Pega o valor do filtro (hoje, semana, mes, ano)
    const filtroDropdown = document.getElementById('filtro-tempo');
    const periodo = filtroDropdown ? filtroDropdown.value : 'hoje';

    // 2. Mostra a tela de métricas (caso esteja escondida)
    const metricsSection = document.getElementById('dashboard-metrics');
    if (metricsSection) metricsSection.classList.remove('hide');

    // 3. Pega a autorização da gerente
    const auth = sessionStorage.getItem('auth');
    if (!auth) return;

    try {
        // 4. Chama a API do backend passando o período na URL
        // (Nós vamos criar essa rota no Java no próximo passo!)
        const response = await fetch(`${API_BASE_URL}/gerente/resumoFinanceiro?periodo=${periodo}`, {
            method: 'GET',
            headers: { 'Authorization': 'Basic ' + auth }
        });

        if (!response.ok) throw new Error("Erro ao carregar métricas");

        // 5. O Java vai nos devolver o DTO prontinho
        const dados = await response.json();

        // 6. Atualiza o HTML com os números formatados
        document.getElementById('metric-total-bruto').textContent = formatarMoedaBRL(dados.faturamentoBruto);
        document.getElementById('metric-total-liquido').textContent = formatarMoedaBRL(dados.faturamentoLiquido);
        document.getElementById('metric-ticket-medio').textContent = formatarMoedaBRL(dados.ticketMedio);
        document.getElementById('metric-qtd-mesas').textContent = dados.mesasFechadas || 0;

        document.getElementById('metric-pix').textContent = formatarMoedaBRL(dados.totalPix);
        document.getElementById('metric-credito').textContent = formatarMoedaBRL(dados.totalCredito);
        document.getElementById('metric-debito').textContent = formatarMoedaBRL(dados.totalDebito);
        document.getElementById('metric-dinheiro').textContent = formatarMoedaBRL(dados.totalDinheiro);
        document.getElementById('metric-taxas-pagas').textContent = formatarMoedaBRL(dados.totalTaxas);

        atualizarGraficos(dados);
    } catch (error) {
        console.error("Erro no Dashboard:", error);
        // Opcional: Mostrar um toast de erro para a gerente
    }
}

// Variáveis para controlar as instâncias dos gráficos
let graficoMetodos = null;
let graficoPerformance = null;

function atualizarGraficos(dados) {
    const ctxMetodos = document.getElementById('chartMetodos').getContext('2d');
    const ctxPerformance = document.getElementById('chartPerformance').getContext('2d');

    // Destruir gráficos existentes para evitar o bug de "fantasma" ao passar o mouse
    if (graficoMetodos) graficoMetodos.destroy();
    if (graficoPerformance) graficoPerformance.destroy();

    // 1. Gráfico de Pizza (Métodos de Pagamento)
    graficoMetodos = new Chart(ctxMetodos, {
        type: 'doughnut',
        data: {
            labels: ['PIX', 'Crédito', 'Débito', 'Dinheiro'],
            datasets: [{
                data: [dados.totalPix, dados.totalCredito, dados.totalDebito, dados.totalDinheiro],
                backgroundColor: ['#27ae60', '#3498db', '#9b59b6', '#f1c40f'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, // 👈 Faz o gráfico respeitar a altura do container
            plugins: {
                legend: {
                    position: 'bottom', // Coloca a legenda embaixo para sobrar espaço pro círculo
                    labels: { color: '#fff', font: { size: 12 } }
                }
            }
        }
    });

    // 2. Gráfico de Barras (Bruto vs Líquido)
    graficoPerformance = new Chart(ctxPerformance, {
        type: 'bar',
        data: {
            labels: ['Hoje'], // Você pode mudar para 'Período' se quiser
            datasets: [
                {
                    label: 'Bruto',
                    data: [dados.faturamentoBruto],
                    backgroundColor: '#3498db',
                    borderRadius: 5
                },
                {
                    label: 'Líquido',
                    data: [dados.faturamentoLiquido],
                    backgroundColor: '#27ae60',
                    borderRadius: 5
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, // 👈 Fundamental para não ficar gigante
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: '#aaa' },
                    grid: { color: 'rgba(255,255,255,0.05)' }
                },
                x: {
                    ticks: { color: '#aaa' },
                    grid: { display: false }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: { color: '#fff' }
                }
            }
        }
    });
}


function abrirModalTodasComandas() {
    // 1. Usa a função padrão do sistema para abrir (ela já trava o scroll de fundo!)
    openModal('modal-todas-comandas');

    // 2. Chama a função para buscar os dados
    carregarHistoricoComandas();
}

async function verDetalhesHistorico(idComanda, numeroMesa, isAberta) {
    veioDoHistorico = true;

    // MÁGICA 2: A mesa selecionada memoriza se era verde (true) ou vermelha (false)
    selectedTable = { id: idComanda, mesa: numeroMesa, aberta: isAberta };

    // Atualiza o título do modal
    const numberSpan = document.getElementById('bill-table-number');
    if (numberSpan) numberSpan.textContent = numeroMesa;

    // Busca os itens na API
    await comanda(selectedTable);

    // Lógica de Proteção: Mostra ou esconde os botões
    const paymentSection = document.querySelector('.payment-section');
    const btnFinalizar = document.querySelector('.modal-footer .btn-success');

    if (!isAberta) {
        // Fechada (Vermelha)
        if (paymentSection) paymentSection.style.display = 'none';
        if (btnFinalizar) btnFinalizar.style.display = 'none';
        document.getElementById('table-total-value').style.color = '#c0392b';
    } else {
        // Aberta (Verde)
        if (paymentSection) paymentSection.style.display = 'block';
        if (btnFinalizar) btnFinalizar.style.display = 'block';
        document.getElementById('table-total-value').style.color = 'var(--color-primary)';
    }

    closeModal('modal-todas-comandas');
    openModal('bill-modal');
}

async function carregarHistoricoComandas() {
    const container = document.getElementById('lista-geral-comandas');

    // 1. Pega o crachá do cofre do navegador
    const auth = sessionStorage.getItem('auth');
    if (!auth) {
        console.error("Usuário não autenticado");
        return;
    }

    try {
        // 2. Manda a requisição levando o crachá no cabeçalho (Headers)
        const response = await fetch(`${API_BASE_URL}/comanda/historicoComandas`, {
            headers: { 'Authorization': 'Basic ' + auth }
        });

        if (!response.ok) throw new Error("Erro ao buscar comandas");

        // ... resto do seu código (JSON, forEach, HTML) ...
        const comandas = await response.json();

        if (comandas.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #aaa;">Nenhuma comanda registrada hoje.</p>';
            return;
        }

        // Limpa o "Carregando..."
        container.innerHTML = '';

        comandas.forEach(comanda => {
            // Lógica visual: Aberta (Verde) vs Fechada (Vermelho/Cinza)
            const statusCor = comanda.aberta ? '#27ae60' : '#c0392b';
            const statusTexto = comanda.aberta ? 'EM ABERTO' : 'FECHADA';

            // Tratamento de datas (formatação)
            const horaAbertura = formatarHora(comanda.horaAbertura);
            const horaFechamento = comanda.horaFechamento ? formatarHora(comanda.horaFechamento) : '--:--';

            const cardHtml = `
                <div onclick="verDetalhesHistorico(${comanda.id}, ${comanda.mesa}, ${comanda.aberta})" 
                    style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.05); border-left: 4px solid ${statusCor}; padding: 20px; border-radius: 8px; margin-bottom: 10px; cursor: pointer; transition: 0.2s;">
                    <div>
                         <h3 style="margin: 0 0 5px 0; color: #fff;">Mesa ${comanda.mesa}</h3>
                         <span style="font-size: 0.8rem; color: #aaa;">Abertura: ${horaAbertura} | Fechamento: ${horaFechamento}</span>
                    </div>
                    <div>
                        <span style="background: ${statusCor}; color: white; padding: 5px 10px; border-radius: 15px; font-size: 0.8rem; font-weight: bold;">
                         ${statusTexto}
                        </span>
                    </div>
                </div>
            `;
            container.innerHTML += cardHtml;
        });

    } catch (error) {
        console.error(error);
        container.innerHTML = '<p style="text-align: center; color: #e74c3c;">Erro ao carregar o histórico.</p>';
    }
}

// Função utilitária de formatação (caso o backend mande LocalDateTime)
function formatarHora(dataString) {
    if (!dataString) return '';
    const data = new Date(dataString);
    return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

// 1. A função que abre o modal e monta o rascunho
function editComanda() {
    closeModal('bill-modal');
    rascunhoComanda = {};

    if (dadosComandaAtual && dadosComandaAtual.itens) {
        dadosComandaAtual.itens.forEach((item) => {
            // Cria uma chave única (mesmo se o back não mandar o ID, não quebra)
            const chaveItem = item.variacaoProdutoId || item.id || item.nomeProduto;

            if (rascunhoComanda[chaveItem]) {
                rascunhoComanda[chaveItem].quantity += item.quantidade;
            } else {
                rascunhoComanda[chaveItem] = {
                    idInterno: chaveItem, // Usado apenas no JS para os botões funcionarem
                    idProJava: item.variacaoProdutoId || item.id, // O ID verdadeiro para salvar depois
                    nome: item.nomeProduto,
                    quantity: item.quantidade,
                    valorUnitario: item.valorUnitario
                };
            }
        });
    }

    const spanMesa = document.getElementById('edit-table-number');
    if (spanMesa && selectedTable) spanMesa.textContent = selectedTable.mesa;

    renderEdicaoComanda();
    openModal('edit-comanda-modal');
}

// 2. A função que desenha o HTML na tela
function renderEdicaoComanda() {
    const container = document.getElementById('edit-comanda-items');
    if (!container) return;

    container.innerHTML = '';
    const items = Object.values(rascunhoComanda);

    if (items.length === 0) {
        container.innerHTML = '<p style="color: #d4af37; text-align: center;">Nenhum item.</p>';
        return;
    }

    items.forEach(i => {
        container.innerHTML += `
            <div class="summary-item-row" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #444;">
                <div class="summary-item-name" style="flex: 1;">${i.nome}</div>
                <div class="summary-controls" style="display: flex; gap: 15px; align-items: center;">
                    <button type="button" onclick="alterarQtdEdicao('${i.idInterno}', -1)" style="background: #c0392b; color: white; border: none; width: 30px; height: 30px; border-radius: 4px; cursor: pointer; font-weight: bold;">-</button>
                    <span class="qty-number" style="font-weight: bold; min-width: 20px; text-align: center;">${i.quantity}</span>
                    <button type="button" onclick="alterarQtdEdicao('${i.idInterno}', 1)" style="background: #27ae60; color: white; border: none; width: 30px; height: 30px; border-radius: 4px; cursor: pointer; font-weight: bold;">+</button>
                </div>
            </div>
        `;
    });
}

// 3. A função dos botões de + e - (A que tinha sumido!)
function alterarQtdEdicao(idItem, delta) {
    if (rascunhoComanda[idItem]) {
        rascunhoComanda[idItem].quantity += delta;

        // Se a gerente zerar, remove do rascunho
        if (rascunhoComanda[idItem].quantity <= 0) {
            delete rascunhoComanda[idItem];
        }

        // Atualiza a tela na mesma hora
        renderEdicaoComanda();
    }
}

// 4. A função que manda pro Java
async function salvarEdicaoComanda() {
    const orderItems = Object.values(rascunhoComanda);

    const payload = {
        comanda: { mesa: selectedTable.mesa },
        itens: orderItems.map(i => ({
            variacaoProduto: { id: i.idProJava }, // Manda pro Java apenas o ID real
            quantidade: i.quantity
        }))
    };

    const auth = sessionStorage.getItem('auth');

    try {
        const response = await fetch(`${API_BASE_URL}/pedido/sobrescreverComanda/${selectedTable.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + auth
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            closeModal('edit-comanda-modal');
            comanda(selectedTable);
            openModal('bill-modal');
        }
    } catch (error) { console.error(error); }
}
function alterarPainel() {
    const adminScreen = document.getElementById('admin-screen');
    const garcomScreen = document.getElementById('garcom-screen');

    if (adminScreen.classList.contains('active')) {
        adminScreen.classList.remove('active');
        adminScreen.classList.add('hide');
        garcomScreen.classList.remove('hide');
        garcomScreen.classList.add('active');
        carregarCardapio();
    } else {
        garcomScreen.classList.remove('active');
        garcomScreen.classList.add('hide');
        adminScreen.classList.remove('hide');
        adminScreen.classList.add('active');
        pedidosCozinhaBar();
    }
}

function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.remove('hide'); // Garante que tira a invisibilidade
        modal.classList.add('active');

        document.body.style.overflow = 'hidden';
    }
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        // 1. Esconde o modal e devolve o scroll
        modal.classList.remove('active');
        modal.classList.add('hide'); 
        document.body.style.overflow = 'auto';

        // 2. Limpa os formulários padrão (taxas, login, etc)
        const forms = modal.querySelectorAll('form');
        forms.forEach(form => form.reset());

        // 3. Limpa os campos soltos de pagamento (A MESA FANTASMA 👻)
        const paymentContainer = modal.querySelector('#payment-entries');
        if (paymentContainer) {
            const firstEntry = paymentContainer.firstElementChild; // Guarda a 1ª linha
            paymentContainer.innerHTML = ''; // Apaga tudo da tela
            
            if (firstEntry) {
                // ✨ O CÓDIGO QUE FALTAVA ✨
                // Encontra o select e o input numérico DENTRO da primeira linha e zera eles
                const selectField = firstEntry.querySelector('.payment-select');
                if (selectField) selectField.value = '';
                
                const inputField = firstEntry.querySelector('.payment-amount');
                if (inputField) inputField.value = '';

                // Agora sim, devolve a linha limpinha para a tela
                paymentContainer.appendChild(firstEntry); 
            }
        }
    }
}

function mostrarToastPermanente(id) {
    const toast = document.getElementById(id);
    if (toast) toast.classList.remove('hide');
}

document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    checkSession();

    // Se estivermos na página de balanço, carrega os dados automaticamente
    if (window.location.pathname.includes('balance.html')) {
        loadDashboardData();
    }
});

function setupEventListeners() {
    // Fechar modais ao clicar no X
    // Dentro de setupEventListeners...

    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.onclick = (e) => {
            // Busca o pai mais próximo que seja o container do modal
            const modalContainer = e.target.closest('.modal-overlay') || e.target.closest('.modal');
            if (modalContainer) {
                if (modalContainer.id === 'bill-modal') {
                    fecharModalConta();
                } else {
                    // Para todos os outros modais do sistema, fechamos normalmente
                    closeModal(modalContainer.id);
                }
            }
        }
    });

    const cancelAddTableBtn = document.getElementById('cancel-add-table-btn');
    if (cancelAddTableBtn) {
        cancelAddTableBtn.onclick = () => document.getElementById('modal-container').classList.add('hide');
    }

    // Login e Logout
    const loginForm = document.getElementById('login-form');
    if (loginForm) loginForm.addEventListener('submit', handleLogin);

    const logoutBtnAdmin = document.getElementById('logout-btn');
    if (logoutBtnAdmin) logoutBtnAdmin.addEventListener('click', handleLogout);

    const logoutBtnGarcom = document.getElementById('logout-btn-garcom');
    if (logoutBtnGarcom) logoutBtnGarcom.addEventListener('click', handleLogout);

    // Alterar Painel
    document.querySelectorAll('#alter-operating').forEach(btn => {
        btn.onclick = alterarPainel;
    });

    // Ações do Admin
    const editMenuBtn = document.getElementById('edit-menu-btn');
    if (editMenuBtn) editMenuBtn.addEventListener('click', handleEditMenu);

    // Ações do Garçom
    const newOrderBtn = document.getElementById('new-order-btn');
    if (newOrderBtn) {
        newOrderBtn.addEventListener('click', async () => {
            openModal('select-table-modal');
            await loadTablesForSelection();
        });
    }

    const btnAbrirMesa = document.querySelector('#add-new-table .btn-primary');
    if (btnAbrirMesa) btnAbrirMesa.addEventListener('click', openMesa);

    // Categorias do Cardápio
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.onclick = (e) => {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');

            const categoria = e.currentTarget.getAttribute('data-category');
            if (categoria === 'TODOS') {
                renderMenuItems(menuItemsData);
            } else {
                const filtrados = menuItemsData.filter(item => item.tipo === categoria.toUpperCase());
                renderMenuItems(filtrados);
            }
        };
    });


}