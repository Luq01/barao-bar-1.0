/* ========================================
   JAVASCRIPT - PÁGINA GARÇOM (OPERACIONAL)
   Sistema de Restaurante Barão - v2.0
   ======================================== */

const API = "http://localhost:8080";

// ============================================
// ESTADO DA APLICAÇÃO
// ============================================
let selectedTable = null;
let menuItemsData = []; // Dados vindos do Banco
let cartItems = {};     // Carrinho (Chave: ID da Variação)

// ============================================
// INICIALIZAÇÃO
// ============================================
document.addEventListener('DOMContentLoaded', function () {
    initializeApp();
});

async function initializeApp() {
    console.log('Iniciando sistema do garçom...');

    // Forçar a exibição da tela principal
    const mainScreen = document.getElementById('main-screen');
    if (mainScreen) mainScreen.classList.add('active');

    setupEventListeners();
    await carregarCardapio();
    await loadTables();
}

// ============================================
// INTEGRAÇÃO COM A API
// ============================================

async function carregarCardapio() {
    try {
        const response = await fetch(`${API}/menu/cardapio`);
        const data = await response.json();
        console.log("Cardápio recebido:", data);
        menuItemsData = data;

        // Renderiza "Todos" por padrão ao carregar
        renderMenuItems(menuItemsData);
    } catch (error) {
        console.error('Erro ao carregar o cardápio:', error);
    }
}

async function loadTables() {
    try {
        const response = await fetch(`${API}/comanda/abertas`);
        const tables = response.ok ? await response.json() : [];
        renderTables(tables);
    } catch (error) {
        console.error("Erro ao carregar mesas:", error);
        renderTables([]);
    }
}

// ============================================
// RENDERIZAÇÃO DE INTERFACE
// ============================================

function renderTables(tables) {
    const grid = document.getElementById('tables-grid');
    if (!grid) return;
    grid.innerHTML = '';

    // Botão "+" para abrir mesa
    const addCard = document.createElement('div');
    addCard.className = 'table-card add-table-card';
    addCard.innerHTML = `<div class="add-icon"><i class="fas fa-plus"></i></div><div class="table-status">Nova Mesa</div>`;
    addCard.onclick = () => document.getElementById('modal-container').classList.remove('hide');
    grid.appendChild(addCard);

    tables.forEach(table => {
        const card = document.createElement('div');
        card.className = 'table-card occupied';
        card.innerHTML = `
            <div class="table-number">${table.mesa}</div>
            <div class="table-status">Ocupada</div>
        `;
        card.onclick = () => {
            selectedTable = table;
            document.getElementById('bill-table-number').textContent = table.mesa;
            comanda();
            openModal('bill-modal');
        };
        grid.appendChild(card);
    });
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

        // Mapeamento correto do Banco de Dados
        const lista = item.variacaoProduto || [];

        let variationsHtml = lista.map(v => {
            const qtd = cartItems[v.id]?.quantity || 0;
            return `
            <div class="variation-row" style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px; background: rgba(255,255,255,0.05); padding: 8px; border-radius: 5px; border: 1px solid rgba(212,175,55,0.3);">
                <span style="color: #fff; font-size: 0.9rem;">${v.tamanho} - R$ ${v.valor.toFixed(2)}</span>
                <div class="quantity-controls" style="display: flex; align-items: center; gap: 10px;">
                    <button class="btn-qty" onclick='changeQty(${v.id}, -1, "${item.nome}", "${v.tamanho}")' style="background: #c0392b; color: white; border: none; width: 28px; height: 28px; border-radius: 4px; cursor: pointer;">-</button>
                    <span id="qty-${v.id}" style="color: #d4af37; font-weight: bold; min-width: 20px; text-align: center;">${qtd}</span>
                    <button class="btn-qty" onclick='changeQty(${v.id}, 1, "${item.nome}", "${v.tamanho}")' style="background: #27ae60; color: white; border: none; width: 28px; height: 28px; border-radius: 4px; cursor: pointer;">+</button>
                </div>
            </div>
        `}).join('');

        itemDiv.innerHTML = `
            <div class="menu-item-card" style="background: rgba(0,0,0,0.4); border-left: 4px solid #d4af37; padding: 12px; border-radius: 8px; margin-bottom: 12px;">
                <h3 style="color: #d4af37; font-family: 'Rye', cursive; margin: 0; font-size: 1.1rem;">${item.nome}</h3>
                <div class="variations-list">
                    ${variationsHtml}
                </div>
            </div>
        `;
        container.appendChild(itemDiv);
    });
}

// ============================================
// LÓGICA DO CARRINHO
// ============================================

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

    updateCartBadge();
}

function updateCartBadge() {
    const total = Object.values(cartItems).reduce((acc, i) => acc + i.quantity, 0);
    const badge = document.getElementById('cart-count'); // Certifique-se que este ID existe no HTML se quiser o contador
    if (badge) badge.innerText = total;
}

function renderOrderSummary() {
    const modalResume = document.getElementById('resume-modal');
    modalResume.classList.remove('hide');
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
        itemDiv.className = 'summary-item-row'; // Apenas a classe principal

        itemDiv.innerHTML = `
    <div class="summary-item-name">${i.nome}</div>
    
    <div class="summary-controls">
        <div class="qty-wrapper">
            <button onclick="updateSummaryQty(${i.id}, -1)" class="btn-qty btn-minus">-</button>
            <span class="qty-number">${i.quantity}</span>
            <button onclick="updateSummaryQty(${i.id}, 1)" class="btn-qty btn-plus">+</button>
        </div>

        <button onclick="removeFromCart(${i.id})" class="btn-remove">
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
    updateCartBadge();
    renderOrderSummary();
}

function closeOrderSummaryReturnMenu() {
    const modalResume = document.getElementById('resume-modal');
    modalResume.classList.add('hide');
}

function pedidoEnviado() {
    const toast = document.getElementById('toast-container');
    toast.classList.remove('hide');

    setTimeout(() => {
        toast.classList.add('hide');

        // Função para voltar à tela inicial (ajuste conforme seu código)
        voltarParaTelaInicial();
    }, 3500);
}

function voltarParaTelaInicial() {
    // Esconde todos os modais ativos
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));

    // Se você tiver uma lógica de troca de telas:
    // document.getElementById('main-screen').classList.add('active');
}


async function comanda() {
    const itensConsumidos = document.getElementById('bill-items');

    try {
        const response = await fetch(`${API}/comanda/calcular/${selectedTable.id}`);
        const data = await response.json();

        let html = '';

        data.itens.forEach(item => { // Acessamos .itens e chamamos cada um de 'item'
            html += `
        <div class="bill-item">
            <span class="item-name">${item.nomeProduto}</span>
            <span class="item-qty">x${item.quantidade}</span>
        </div>
            `;
        });

        itensConsumidos.innerHTML = html;


    } catch (error) {
        console.error('Erro ao calcular comanda:', error);
    }


}
// ============================================
// EVENT LISTENERS E NAVEGAÇÃO
// ============================================

function setupEventListeners() {
    // Botões de Modal
    document.querySelector('#menu-modal .modal-close').onclick = () => closeModal('menu-modal');
    document.querySelector('#select-table-modal .modal-close').onclick = () => closeModal('select-table-modal');
    document.querySelector('#bill-modal .modal-close').onclick = () => closeModal('bill-modal');
    document.getElementById('cancel-add-table-btn').onclick = () => document.getElementById('modal-container').classList.add('hide');

    // Realizar Pedido (Abre seleção de mesa)
    document.getElementById('new-order-btn').onclick = async () => {
        openModal('select-table-modal');
        await loadTablesForSelection();
    };

    // Abrir Mesa (Botão do Modal de input)
    document.querySelector('#add-new-table .btn-primary').onclick = openMesa;

    // Filtros de Categoria
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.onclick = (e) => {
            // 1. Visual: Troca a classe active entre os botões
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');

            // 2. Lógica: Pega a categoria do botão
            const categoriaSelecionada = e.currentTarget.getAttribute('data-category');

            console.log("Filtrando por:", categoriaSelecionada);

            if (categoriaSelecionada === 'TODOS') {
                renderMenuItems(menuItemsData);
            } else {
                // Filtra comparando o item.tipo do banco com a categoria do botão
                const filtrados = menuItemsData.filter(item => {
                    // Garantimos que ambos estão em maiúsculo para comparar
                    return item.tipo === categoriaSelecionada.toUpperCase();
                });

                renderMenuItems(filtrados);
            }
        };
    });
}

async function openMesa(e) {
    if (e) e.preventDefault();
    const input = document.querySelector('#add-new-table input');
    const tableNumber = parseInt(input.value);

    if (isNaN(tableNumber) || tableNumber <= 0) return;

    try {
        const response = await fetch(`${API}/comanda/abrirMesa`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mesa: tableNumber })
        });

        if (response.ok) {
            input.value = '';
            document.getElementById('modal-container').classList.add('hide');
            await loadTables();
        }
    } catch (error) { console.error(error); }
}

async function addOrderToTable() {
    const orderItems = Object.values(cartItems);
    if (orderItems.length === 0 || !selectedTable) {
        alert("Adicione itens ou selecione a mesa.");
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
        const response = await fetch(`${API}/pedido/novoPedido`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {

            cartItems = {};
            updateCartBadge();
            closeOrderSummaryReturnMenu();
            closeModal('menu-modal');
            // Opcional: Resetar os contadores visuais do menu
            renderMenuItems(menuItemsData);
            pedidoEnviado();

        }
    } catch (error) { console.error(error); }
}

async function loadTablesForSelection() {
    const response = await fetch(`${API}/comanda/abertas`);
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
}

// Utilitários
function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }