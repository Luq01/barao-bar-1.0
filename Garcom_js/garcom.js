/* ========================================
   JAVASCRIPT - PÁGINA GARÇOM (OPERACIONAL)
   Sistema de Restaurante Barão
   ======================================== */

// ============================================
// VARIÁVEIS GLOBAIS E ESTADO DA APLICAÇÃO
// ============================================

const API = "http://localhost:8080"; // Placeholder para futuras integrações


let selectedTable = null;
let menuItems = [];
let cartItems = {};
let tableOrders = {}; // Armazena o histórico de pedidos por mesa

const MOCK_MENU_ITEMS = [
    {
        id: 1,
        name: 'Filé de Tilápia',
        description: 'Acompanha molho de alho (6 Unidades).',
        price: 60.00,
        category: 'porcoes',
        image: 'https://images.unsplash.com/photo-1485921325833-c519f76c4927?w=400'
    },
    {
        id: 2,
        name: 'Costelinha Suína ao Barbecue',
        description: 'Com Mandioca ou Fritas (Serve até 4 Pessoas).',
        price: 70.00,
        category: 'pratos',
        image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400'
    },
    {
        id: 3,
        name: 'Carne de Sol c/ Mandioca',
        description: 'Porção Inteira (Serve até 4 Pessoas).',
        price: 70.00,
        category: 'porcoes',
        image: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400'
    },
    {
        id: 4,
        name: 'Pina Rum Bacardi',
        description: 'Pina colada, Rum bacardi',
        price: 35.00,
        category: 'drinks',
        image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400'
    }
];

// ============================================
// INICIALIZAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', function () {
    initializeApp();
});

function initializeApp() {
    console.log('Inicializando sistema do garçom...');
    menuItems = MOCK_MENU_ITEMS;
    setupEventListeners();
    showMainScreen(); // Inicia direto na tela principal
}

function showMainScreen() {
    document.getElementById('main-screen').classList.add('active');

    loadTables();
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
    // Navegação de Data
    // Botões de Ação Principais
    document.getElementById('new-order-btn').addEventListener('click', handleNewOrder);
    // Adicione esta linha dentro da sua função setupEventListeners()
    document.querySelector('#add-new-table .btn-primary').addEventListener('click', openMesa);

    // Modais e Fechamento
    document.querySelector('#menu-modal .modal-close').addEventListener('click', () => closeModal('menu-modal'));
    document.getElementById('add-to-order-btn').addEventListener('click', handleAddToOrder);

    document.querySelector('#bill-modal .modal-close').addEventListener('click', () => closeModal('bill-modal'));
    document.getElementById('finalize-bill-btn').addEventListener('click', handleFinalizeBill);

    // Entradas de Pagamento
    document.getElementById('add-payment-method-btn').addEventListener('click', addPaymentMethodEntry);
    document.getElementById('payment-entries').addEventListener('click', function (e) {
        if (e.target.classList.contains('btn-remove-payment')) {
            removePaymentEntry(e.target);
        }
    });

    // Alertas
    document.getElementById('close-success-btn').addEventListener('click', () => {
        closeModal('success-alert-modal');
        loadTables();
    });
    document.getElementById('close-error-btn').addEventListener('click', () => closeModal('error-alert-modal'));

    document.querySelector('#select-table-modal .modal-close').addEventListener('click', () => closeModal('select-table-modal'));
    document.querySelector('#kitchen-modal .modal-close').addEventListener('click', () => closeModal('kitchen-modal'));

    // Filtros de Categoria
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', handleCategoryChange);
    });
}

// ============================================
// GERENCIAMENTO DE DATA
// ============================================

function updateDateDisplay() {
    const dateStr = formatDate(currentDate);
    document.getElementById('current-date').textContent = dateStr;
}

function changeDate(days) {
    currentDate.setDate(currentDate.getDate() + days);
    updateDateDisplay();
    loadTables();
}

function formatDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

// ============================================
// GERENCIAMENTO DE MESAS
// ============================================
async function loadTables() {
    // 1. Primeiro, desenhamos o grid apenas com o botão de "+"
    renderTables([]);

    try {
        // 2. Tentamos buscar as mesas da API
        const response = await fetch(`${API}/comanda/abertas`);
        if (response.ok) {
            const tables = await response.json();
            // 3. Se deu certo, redesenhamos incluindo as mesas da API
            renderTables(tables);
        }
    } catch (error) {
        console.error("A API ainda não está respondendo, mas o botão '+' deve aparecer.", error);
    }
}
function renderTables(tables) {
    const grid = document.getElementById('tables-grid');
    grid.innerHTML = ''; // Limpa tudo

    // CRIA O CARD DE "+" (Sempre executa)
    const addCard = document.createElement('div');
    addCard.className = 'table-card add-table-card';
    addCard.innerHTML = `
        <div class="add-icon"><i class="fas fa-plus"></i></div>
        <div class="table-status">Nova Mesa</div>
    `;
    addCard.addEventListener('click', openAddNewTableModal);
    grid.appendChild(addCard);

    // CRIA AS MESAS DA API (Só executa se houver dados)
    if (tables && tables.length > 0) {
        tables.forEach(table => {
            const card = document.createElement('div');
            card.className = 'table-card occupied';
            card.innerHTML = `
                <div class="table-number">${table.mesa}</div>
                <div class="table-status">Ocupada</div>
            `;
            card.addEventListener('click', () => handleTableClick(table));
            grid.appendChild(card);
        });
    }
}

function newPedido(tables) {
    // CORREÇÃO: Remova o 't' extra
    const grid = document.getElementById('table-selection-grid'); 

    // É sempre bom limpar o grid antes de renderizar para não duplicar itens visualmente
    if (grid) {
        grid.innerHTML = ''; 
    } else {
        console.error("Elemento 'table-selection-grid' não encontrado no DOM.");
        return;
    }

    if (tables && tables.length > 0) {
        tables.forEach(table => {
            const card = document.createElement('div');
            card.className = 'table-card occupied';
            card.innerHTML = `
                <div class="table-number">${table.mesa}</div>
                <div class="table-status">Ocupada</div>
            `;
            card.addEventListener('click', () => handleTableSelection(table));
            grid.appendChild(card);
        });
    }
}
function openAddNewTableModal() {

    document.getElementById('modal-container').classList.remove('hide');
}


document.getElementById('cancel-add-table-btn').addEventListener('click', () => {
    document.getElementById('modal-container').classList.add('hide');
});

async function openMesa(e) {
    // 1. Previne que o formulário recarregue a página ou dispare duas vezes
    if (e) e.preventDefault();

    const input = document.querySelector('#add-new-table input');
    const tableNumber = parseInt(input.value);

    if (isNaN(tableNumber) || tableNumber <= 0) {
        alert('Por favor, insira um número de mesa válido.');
        return;
    }

    // Opcional: Desativar o botão temporariamente para evitar múltiplos cliques
    const btn = e.target;
    btn.disabled = true;

    try {
        const response = await fetch(`${API}/comanda/abrirMesa`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mesa: tableNumber })
        });

        if (response.ok) {
            alert(`Mesa ${tableNumber} aberta com sucesso!`);
            input.value = '';
            document.getElementById('modal-container').classList.add('hide');
            loadTables();
        } else {
            const errorMsg = await response.text();
            alert(errorMsg || 'Erro ao abrir mesa.');
        }
    } catch (error) {
        console.error('Erro ao conectar com a API:', error);
        alert('Não foi possível conectar ao servidor.');
    } finally {
        // Reativar o botão após a resposta da API
        btn.disabled = false;
    }
}

// Função essencial para o evento de clique nas mesas renderizadas
function handleTableClick(table) {
    selectedTable = table;
    // Como você só quer exibir ocupadas, aqui abriria a comanda (bill-modal)
    document.getElementById('bill-table-number').textContent = table.number;
    openModal('bill-modal');
}

// Funções chamadas no setupEventListeners que precisam existir para o código rodar:
function handleCategoryChange(e) {
    document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
    e.currentTarget.classList.add('active');
    filterMenuByCategory(e.currentTarget.getAttribute('data-category'));
}

async function handleNewOrder() {
    openModal('select-table-modal');
    
    // Precisamos buscar as mesas atuais para mostrar no modal
    try {
        const response = await fetch(`${API}/comanda/abertas`);
        if (response.ok) {
            const tables = await response.json();
            newPedido(tables); // Renderiza as mesas no grid do modal
        }
    } catch (error) {
        console.error("Erro ao carregar mesas para o pedido:", error);
    }
}

function filterMenuByCategory(category) {
    let filteredItems = category === 'todos' ? menuItems : menuItems.filter(item => item.category === category);
    renderMenuItems(filteredItems);
}

function renderMenuItems(items) {
    const container = document.getElementById('menu-items');
    container.innerHTML = '';

    items.forEach(item => {
        const currentQuantity = cartItems[item.id]?.quantity || 0;
        const itemDiv = document.createElement('div');
        itemDiv.className = 'menu-item';
        itemDiv.innerHTML = `
            <div class="menu-item-image"><img src="${item.image}"></div>
            <div class="menu-item-name">${item.name}</div>
            <div class="menu-item-price">R$ ${item.price.toFixed(2)}</div>
            <div class="menu-item-quantity">
                <button class="quantity-btn" data-action="decrease" data-id="${item.id}">-</button>
                <span class="quantity-value">${currentQuantity}</span>
                <button class="quantity-btn" data-action="increase" data-id="${item.id}">+</button>
            </div>
        `;
        container.appendChild(itemDiv);
    });

    container.querySelectorAll('.quantity-btn').forEach(btn => {
        btn.addEventListener('click', handleQuantityChange);
    });
}

function handleQuantityChange(e) {
    const action = e.target.getAttribute('data-action');
    const itemId = parseInt(e.target.getAttribute('data-id'));
    const item = menuItems.find(i => i.id === itemId);

    if (!cartItems[itemId]) cartItems[itemId] = { ...item, quantity: 0 };

    if (action === 'increase') cartItems[itemId].quantity++;
    else if (action === 'decrease' && cartItems[itemId].quantity > 0) cartItems[itemId].quantity--;

    if (cartItems[itemId].quantity === 0) delete cartItems[itemId];

    const currentCategory = document.querySelector('.category-btn.active').getAttribute('data-category');
    filterMenuByCategory(currentCategory);
}

function handleAddToOrder() {
    if (Object.keys(cartItems).length === 0) {
        alert('Adicione pelo menos um item');
        return;
    }
    alert(`Pedido adicionado à mesa ${selectedTable.number}!`);
    closeModal('menu-modal');
    loadTables();
}

// ============================================
// COZINHA E UTILITÁRIOS
// ============================================

function openKitchenModal() {
    renderKitchenOrders('queue', [
        { id: 1, tableNumber: 3, items: [{ name: 'Burger', quantity: 2 }], timestamp: new Date() }
    ]);
    openModal('kitchen-modal');
}

function renderKitchenOrders(status, orders) {
    const container = document.getElementById(`${status}-orders`);
    container.innerHTML = orders.length ? '' : '<div class="empty-state">Vazio</div>';

    orders.forEach(order => {
        const card = document.createElement('div');
        card.className = 'kitchen-order-card';
        card.innerHTML = `
            <div class="order-header">Mesa ${order.tableNumber}</div>
            <div class="order-items">${order.items.map(i => `<div>${i.quantity}x ${i.name}</div>`).join('')}</div>
        `;
        container.appendChild(card);
    });
}

// Modais Genéricos
function openModal(modalId) { document.getElementById(modalId).classList.add('active'); }
function closeModal(modalId) { document.getElementById(modalId).classList.remove('active'); }

// Funções de suporte para pagamentos (mantidas conforme original)
function parseCurrency(str) {
    let value = str.replace(/[^0-9,.-]/g, '').replace('.', ',');
    return parseFloat(value.replace(',', '.')) || 0;
}

function addPaymentMethodEntry() {
    const container = document.getElementById('payment-entries');
    const entry = document.createElement('div');
    entry.className = 'payment-entry';
    entry.innerHTML = `
        <select class="payment-select">
            <option value="pix">PIX</option>
            <option value="dinheiro">Dinheiro</option>
            <option value="cartao">Cartão</option>
        </select>
        <input type="text" class="payment-amount" placeholder="Valor">
        <button class="btn-remove-payment">&times;</button>
    `;
    container.appendChild(entry);
}

function removePaymentEntry(btn) {
    btn.closest('.payment-entry').remove();
}

function handleViewOrders() { alert('Funcionalidade de visualizar comandas abertas'); }
function handleFinalizeBill() {
    alert(`Mesa ${selectedTable.number} finalizada!`);
    closeModal('bill-modal');
    loadTables();
}