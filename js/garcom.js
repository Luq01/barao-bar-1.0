/* ========================================
   JAVASCRIPT - PÁGINA GARÇOM
   Sistema de Restaurante Barão
   ======================================== */

// ============================================
// VARIÁVEIS GLOBAIS E ESTADO DA APLICAÇÃO
// ============================================

let currentUser = null;
let currentDate = new Date();
let selectedTable = null;
let menuItems = [];
let cartItems = {};
let tableOrders = {}; // Armazena o histórico de pedidos por mesa

// Dados mockados para exemplo visual (substituir por dados do backend)
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

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    console.log('Inicializando sistema do garçom...');
    
    // Carregar dados mockados (substituir por chamadas ao backend)
    menuItems = MOCK_MENU_ITEMS;
    
    // Setup de event listeners
    setupEventListeners();
    
    // Verificar se há sessão ativa
    checkSession();
}

// ============================================
// GERENCIAMENTO DE SESSÃO
// ============================================

function checkSession() {
    // TODO: BACKEND - Verificar se há token de autenticação válido
    // Exemplo:
    // const token = localStorage.getItem('authToken');
    // if (token) {
    //     fetch('/api/auth/verify', {
    //         headers: { 'Authorization': `Bearer ${token}` }
    //     })
    //     .then(response => {
    //         if (response.ok) {
    //             showMainScreen();
    //         } else {
    //             showLoginScreen();
    //         }
    //     });
    // }
    
    showLoginScreen();
}

function showLoginScreen() {
    document.getElementById('login-screen').classList.add('active');
    document.getElementById('main-screen').classList.remove('active');
}

function showMainScreen() {
    console.log('Showing main screen');
    document.getElementById('login-screen').classList.remove('active');
    document.getElementById('main-screen').classList.add('active');
    console.log('Screen classes updated');
    
    updateDateDisplay();
    loadTables();
    console.log('Main screen loaded completely');
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
    // Login
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    
    // Register modal
    document.querySelector('#register-modal .modal-close').addEventListener('click', () => closeModal('register-modal'));
    document.getElementById('cancel-register-btn').addEventListener('click', () => closeModal('register-modal'));
    document.getElementById('submit-register-btn').addEventListener('click', handleRegister);
    
    // Date navigation
    document.getElementById('prev-date').addEventListener('click', () => changeDate(-1));
    document.getElementById('next-date').addEventListener('click', () => changeDate(1));
    
    // Action buttons
    document.getElementById('view-orders-btn').addEventListener('click', handleViewOrders);
    document.getElementById('new-order-btn').addEventListener('click', handleNewOrder);
    document.getElementById('kitchen-btn').addEventListener('click', openKitchenModal);
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    
    // Menu modal
    document.querySelector('#menu-modal .modal-close').addEventListener('click', () => closeModal('menu-modal'));
    document.getElementById('add-to-order-btn').addEventListener('click', handleAddToOrder);
    
    // Bill modal
    document.querySelector('#bill-modal .modal-close').addEventListener('click', () => closeModal('bill-modal'));
    document.getElementById('finalize-bill-btn').addEventListener('click', handleFinalizeBill);

    // Payment entries (inside bill modal)
    document.getElementById('add-payment-method-btn').addEventListener('click', addPaymentMethodEntry);
    document.getElementById('payment-entries').addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-remove-payment')) {
            removePaymentEntry(e.target);
        }
    });

    // Alert modals
    document.getElementById('close-success-btn').addEventListener('click', () => {
        closeModal('success-alert-modal');
        loadTables();
    });
    document.getElementById('close-error-btn').addEventListener('click', () => closeModal('error-alert-modal'));
    document.getElementById('close-kitchen-preparing-btn').addEventListener('click', () => closeModal('kitchen-preparing-alert-modal'));
    document.getElementById('close-kitchen-completed-btn').addEventListener('click', () => closeModal('kitchen-completed-alert-modal'));
    
    
    // Select Table modal
    document.querySelector('#select-table-modal .modal-close').addEventListener('click', () => closeModal('select-table-modal'));

    // Kitchen modal
    document.querySelector('#kitchen-modal .modal-close').addEventListener('click', () => closeModal('kitchen-modal'));

    // Category buttons
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', handleCategoryChange);
    });
}

// ============================================
// AUTENTICAÇÃO
// ============================================

function handleLogin(e) {
    e.preventDefault();
    console.log('Login form submitted');
    
    const username = document.getElementById('username').value;
    console.log('Username entered:', username);
    
    // Simulação temporária
    if (username && username.trim()) {
        currentUser = { username, role: 'waiter' };
        console.log('User logged in:', currentUser);
        showMainScreen();
    } else {
        alert('Por favor, digite seu nome');
        console.log('Empty username');
    }
}

function handleShowRegister() {
    // Abrir modal de cadastro
    openModal('register-modal');
}

function handleRegister() {
    const name = document.getElementById('register-name').value;
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    
    // Validações
    if (!name || !username || !password || !confirmPassword) {
        alert('Por favor, preencha todos os campos');
        return;
    }
    
    if (password !== confirmPassword) {
        alert('As senhas não coincidem');
        return;
    }
    
    if (password.length < 6) {
        alert('A senha deve ter pelo menos 6 caracteres');
        return;
    }
    
    // TODO: BACKEND - Implementar cadastro de usuário
    // Exemplo:
    // fetch('/api/auth/register', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ name, username, password, role: 'waiter' })
    // })
    // .then(response => response.json())
    // .then(data => {
    //     if (data.success) {
    //         alert('Cadastro realizado com sucesso!');
    //         closeModal('register-modal');
    //         // Limpar formulário
    //         document.getElementById('register-form').reset();
    //     } else {
    //         alert(data.message || 'Erro ao cadastrar usuário');
    //     }
    // })
    // .catch(error => {
    //     console.error('Erro ao cadastrar:', error);
    // });
        //     alert('Erro ao conectar com o servidor');
    // });
    
    // Simulação temporária
    console.log('Cadastro:', { name, username, role: 'waiter' });
    alert('Cadastro realizado com sucesso! Agora você pode fazer login.');
    closeModal('register-modal');
    document.getElementById('register-form').reset();
}

function handleLogout() {
    // TODO: BACKEND - Invalidar token no servidor
    // fetch('/api/auth/logout', {
    //     method: 'POST',
    //     headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
    // });
    
    currentUser = null;
    // localStorage.removeItem('authToken');
    showLoginScreen();
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

function loadTables() {
    // TODO: BACKEND - Buscar mesas do banco de dados para a data selecionada
    // fetch(`/api/tables?date=${currentDate.toISOString()}`, {
    //     headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
    // })
    // .then(response => response.json())
    // .then(data => {
    //     renderTables(data.tables);
    // });
    
    // Simulação temporária
    const tables = [
        { number: 1, status: 'available' },
        { number: 2, status: 'occupied' },
        { number: 3, status: 'available' },
        { number: 4, status: 'occupied' },
        { number: 5, status: 'available' },
        { number: 6, status: 'available' },
        { number: 7, status: 'available' },
        { number: 8, status: 'available' },
        { number: 9, status: 'available' },
        { number: 10, status: 'available' },
        { number: 11, status: 'available' },
        { number: 12, status: 'available' },
        { number: 13, status: 'available' }
    ];
    
    renderTables(tables);
}

function renderTables(tables) {
    const grid = document.getElementById('tables-grid');
    grid.innerHTML = '';
    
    tables.forEach(table => {
        const card = document.createElement('div');
        card.className = `table-card ${table.status === 'occupied' ? 'occupied' : ''}`;
        card.setAttribute('data-testid', `table-${table.number}`);
        card.innerHTML = `
            <div class="table-number">${table.number}</div>
            <div class="table-status">${table.status === 'occupied' ? 'Ocupada' : 'Livre'}</div>
        `;
        card.addEventListener('click', () => handleTableClick(table));
        grid.appendChild(card);
    });
    
    // Botão para adicionar mesa
    const addCard = document.createElement('div');
    addCard.className = 'table-card add-table';
    addCard.setAttribute('data-testid', 'add-table-button');
    addCard.innerHTML = '<div class="table-number">+</div>';
    addCard.addEventListener('click', handleAddTable);
    grid.appendChild(addCard);
}

function handleTableClick(table) {
    selectedTable = table;
    
    // Se a mesa estiver ocupada, abre a comanda
    if (table.status === 'occupied') {
        openBillModal(table);
    }
}

function handleAddTable() {
    // TODO: BACKEND - Adicionar nova mesa ao sistema
    // fetch('/api/tables', {
    //     method: 'POST',
    //     headers: {
    //         'Content-Type': 'application/json',
    //         'Authorization': `Bearer ${localStorage.getItem('authToken')}`
    //     },
    //     body: JSON.stringify({ number: nextTableNumber })
    // });
    
    alert('Funcionalidade para adicionar mesa será implementada no backend');
}

// ============================================
// AÇÕES PRINCIPAIS
// ============================================

function handleViewOrders() {
    // TODO: BACKEND - Buscar todas as comandas abertas
    // fetch('/api/orders/active', {
    //     headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
    // })
    // .then(response => response.json())
    // .then(data => {
    //     showOrdersList(data.orders);
    // });
    
    alert('Visualizar comandas abertas - implementar no backend');
}

function handleNewOrder() {
    openTableSelectionModal();
}

function openTableSelectionModal() {
    const grid = document.getElementById('table-selection-grid');
    grid.innerHTML = '';

    // Usando os mesmos dados mockados de loadTables para consistência
    // Em produção, isso viria do backend ou de uma variável de estado global
    const tables = [
        { number: 1, status: 'available' },
        { number: 2, status: 'occupied' },
        { number: 3, status: 'available' },
        { number: 4, status: 'occupied' },
        { number: 5, status: 'available' },
        { number: 6, status: 'available' },
        { number: 7, status: 'available' },
        { number: 8, status: 'available' },
        { number: 9, status: 'available' },
        { number: 10, status: 'available' },
        { number: 11, status: 'available' },
        { number: 12, status: 'available' },
        { number: 13, status: 'available' }
    ];

    tables.forEach(table => {
        const btn = document.createElement('div');
        btn.className = `table-selection-item ${table.status === 'occupied' ? 'occupied' : ''}`;
        btn.innerHTML = `
            <i class="fas fa-chair" style="margin-bottom: 5px; font-size: 20px;"></i>
            Mesa ${table.number}
        `;
        btn.addEventListener('click', () => {
            selectedTable = table;
            closeModal('select-table-modal');
            openMenuModal();
        });
        grid.appendChild(btn);
    });

    openModal('select-table-modal');
}


// ============================================
// MODAL DE CARDÁPIO
// ============================================

function openMenuModal() {
    if (!selectedTable) {
        alert('Selecione uma mesa primeiro');
        return;
    }
    
    document.getElementById('selected-table-number').textContent = selectedTable.number;
    cartItems = {};
    
    // Carregar itens da categoria padrão
    filterMenuByCategory('entradas');
    
    openModal('menu-modal');
}

function handleCategoryChange(e) {
    const category = e.target.getAttribute('data-category');
    
    // Atualizar botão ativo
    document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
    
    filterMenuByCategory(category);
}

function filterMenuByCategory(category) {
    let filteredItems;
    
    if (category === 'todos') {
        filteredItems = menuItems;
    } else if (category === 'recentes') {
        // Filtra itens que já foram pedidos por esta mesa
        const recentIds = tableOrders[selectedTable.number] || new Set();
        filteredItems = menuItems.filter(item => recentIds.has(item.id));
    } else {
        filteredItems = menuItems.filter(item => item.category === category);
    }
    
    renderMenuItems(filteredItems);
}

function renderMenuItems(items) {
    const container = document.getElementById('menu-items');
    container.innerHTML = '';
    
    items.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'menu-item';
        itemDiv.setAttribute('data-testid', `menu-item-${item.id}`);
        itemDiv.setAttribute('data-item-id', item.id);
        
        const observations = (cartItems[item.id]?.observations || '');
        const currentQuantity = cartItems[item.id]?.quantity || 0;
        
        itemDiv.innerHTML = `
            <div class="menu-item-image">
                <img src="${item.image}" alt="${item.name}">
            </div>
            <div class="menu-item-name">${item.name}</div>
            <div class="menu-item-description">${item.description}</div>
            <div class="menu-item-price">R$ ${item.price.toFixed(2)}</div>
            <div class="menu-item-quantity">
                <button class="quantity-btn" data-action="decrease" data-testid="decrease-${item.id}">-</button>
                <span class="quantity-value" data-testid="quantity-${item.id}">${currentQuantity}</span>
                <button class="quantity-btn" data-action="increase" data-testid="increase-${item.id}">+</button>
            </div>
            ${currentQuantity > 0 ? `
                <div class="menu-item-observations">
                    <textarea class="observations-input" placeholder="Observações..." data-item-id="${item.id}" data-testid="observations-${item.id}">${observations}</textarea>
                </div>
            ` : ''}
        `;
        
        container.appendChild(itemDiv);
    });
    
    // Add event listeners para os botões de quantidade
    container.querySelectorAll('.quantity-btn').forEach(btn => {
        btn.addEventListener('click', handleQuantityChange);
    });
    
    // Add event listeners para os campos de observações
    container.querySelectorAll('.observations-input').forEach(textarea => {
        textarea.addEventListener('change', handleObservationsChange);
        textarea.addEventListener('blur', handleObservationsChange);
    });
}

function handleQuantityChange(e) {
    const action = e.target.getAttribute('data-action');
    const itemId = parseInt(e.target.getAttribute('data-testid').split('-')[1]);
    const quantitySpan = e.target.parentElement.querySelector('.quantity-value');
    let currentQuantity = parseInt(quantitySpan.textContent);
    
    if (action === 'increase') {
        currentQuantity++;
    } else if (action === 'decrease' && currentQuantity > 0) {
        currentQuantity--;
    }
    
    quantitySpan.textContent = currentQuantity;
    
    // Atualizar carrinho
    if (currentQuantity > 0) {
        const item = menuItems.find(i => i.id === itemId);
        const existingObservations = cartItems[itemId]?.observations || '';
        cartItems[itemId] = { ...item, quantity: currentQuantity, observations: existingObservations };
        e.target.closest('.menu-item').classList.add('selected');
    } else {
        delete cartItems[itemId];
        e.target.closest('.menu-item').classList.remove('selected');
    }
    
    // Re-render para mostrar/ocultar campo de observações
    const currentCategory = document.querySelector('.category-btn.active').getAttribute('data-category');
    filterMenuByCategory(currentCategory);
}

function handleObservationsChange(e) {
    const itemId = parseInt(e.target.getAttribute('data-item-id'));
    if (cartItems[itemId]) {
        cartItems[itemId].observations = e.target.value;
    }
}

function handleAddToOrder() {
    const itemCount = Object.keys(cartItems).length;
    
    if (itemCount === 0) {
        alert('Adicione pelo menos um item ao pedido');
        return;
    }
    
    // TODO: BACKEND - Salvar pedido no banco de dados
    // const orderData = {
    //     tableNumber: selectedTable.number,
    //     items: Object.values(cartItems),
    //     waiterId: currentUser.id,
    //     date: new Date().toISOString(),
    //     status: 'active'
    // };
    // 
    // fetch('/api/orders', {
    //     method: 'POST',
    //     headers: {
    //         'Content-Type': 'application/json',
    //         'Authorization': `Bearer ${localStorage.getItem('authToken')}`
    //     },
    //     body: JSON.stringify(orderData)
    // })
    // .then(response => response.json())
    // .then(data => {
    //     if (data.success) {
    //         alert('Pedido adicionado com sucesso!');
    //         closeModal('menu-modal');
    //         loadTables();
    //     }
    // });
    
    // Salvar no histórico da mesa para a categoria "Recentes"
    if (!tableOrders[selectedTable.number]) {
        tableOrders[selectedTable.number] = new Set();
    }
    Object.keys(cartItems).forEach(id => tableOrders[selectedTable.number].add(parseInt(id)));

    console.log('Pedido a ser salvo:', cartItems);
    alert(`Pedido de ${itemCount} item(s) adicionado à mesa ${selectedTable.number}!`);
    closeModal('menu-modal');
    loadTables();
}

// ============================================
// MODAL DE COMANDA
// ============================================

function openBillModal(table) {
    selectedTable = table;
    document.getElementById('bill-table-number').textContent = table.number;
    
    // TODO: BACKEND - Buscar itens da comanda do banco de dados
    // fetch(`/api/orders/table/${table.number}`, {
    //     headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
    // })
    // .then(response => response.json())
    // .then(data => {
    //     renderBillItems(data.items);
    // });
    
    // Simulação temporária
    const mockBillItems = [
        { name: 'Costelinha Suína ao Barbecue', quantity: 1, price: 70.00 }
    ];
    renderBillItems(mockBillItems);
    
    // prepare payment entries
    const entriesContainer = document.getElementById('payment-entries');
    const addBtn = document.getElementById('add-payment-method-btn');
    if (entriesContainer) {
        entriesContainer.innerHTML = '';
        addPaymentMethodEntry();
    }
    if (addBtn) addBtn.disabled = false;

    openModal('bill-modal');
}

function renderBillItems(items) {
    const container = document.getElementById('bill-items');
    container.innerHTML = '';
    
    let total = 0;
}

// utility functions for payment handling
function parseCurrency(str) {
    // Aceita vírgula ou ponto como separador decimal
    let value = str.replace(/[^0-9,.-]/g, '').replace('.', ',');
    return parseFloat(value.replace(',', '.')) || 0;
}

function addPaymentMethodEntry() {
    const container = document.getElementById('payment-entries');
    const entry = document.createElement('div');
    entry.className = 'payment-entry';
    entry.innerHTML = `
        <select class="payment-select" data-testid="payment-method-select">
            <option value="">Selecione...</option>
            <option value="credito">Cartão de Crédito</option>
            <option value="debito">Cartão de Débito</option>
            <option value="dinheiro">Dinheiro</option>
            <option value="pix">PIX</option>
            <option value="outro">Outro</option>
        </select>
        <input type="text" class="payment-amount" placeholder="Valor (R$)" data-testid="payment-amount-input">
        <button type="button" class="btn-remove-payment" title="Remover" data-testid="remove-payment-btn">&times;</button>
    `;
    container.appendChild(entry);
}

function removePaymentEntry(btn) {
    const container = document.getElementById('payment-entries');
    const entry = btn.closest('.payment-entry');
    if (entry) {
        container.removeChild(entry);
    }
}

function renderBillItems(items) {
    const container = document.getElementById('bill-items');
    container.innerHTML = '';
    
    let total = 0;
    
    items.forEach((item, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'bill-item';
        itemDiv.setAttribute('data-testid', `bill-item-${index}`);
        
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        itemDiv.innerHTML = `
            <div class="bill-item-info">
                <div class="bill-item-name">${item.quantity}x ${item.name}</div>
                <div class="bill-item-quantity">R$ ${item.price.toFixed(2)} cada</div>
            </div>
            <div class="bill-item-price">R$ ${itemTotal.toFixed(2)}</div>
        `;
        
        container.appendChild(itemDiv);
    });
    
    document.getElementById('bill-total-amount').textContent = `R$ ${total.toFixed(2)}`;
}

function handleFinalizeBill() {
    // collect all payment entries and validate values
    const entries = Array.from(document.querySelectorAll('.payment-entry'));
    if (entries.length === 0) {
        showErrorAlert('Adicione pelo menos uma forma de pagamento');
        return;
    }

    let sum = 0;
    const payments = [];
    for (const entry of entries) {
        const method = entry.querySelector('.payment-select').value;
        const amountStr = entry.querySelector('.payment-amount').value;
        const amount = parseCurrency(amountStr);
        if (!method) {
            showErrorAlert('Selecione uma forma de pagamento em todas as entradas');
            return;
        }
        if (isNaN(amount) || amount <= 0) {
            showErrorAlert('Digite um valor válido para cada forma de pagamento');
            return;
        }
        payments.push({ method, amount });
        sum += amount;
    }

    const totalText = document.getElementById('bill-total-amount').textContent;
    const total = parseCurrency(totalText);
    // Allow a small rounding difference
    if (Math.abs(sum - total) > 0.01) {
        showErrorAlert('Os valores informados não somam o total da conta');
        return;
    }
    
    console.log('Finalizando comanda com pagamentos:', payments);
    closeModal('bill-modal');
    showSuccessAlert(`Mesa ${selectedTable.number} liberada com sucesso!`);
}

function printReceipt(orderId) {
    // TODO: BACKEND - Gerar e enviar nota fiscal para impressora
    // fetch(`/api/orders/${orderId}/receipt`, {
    //     headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
    // })
    // .then(response => response.blob())
    // .then(blob => {
    //     // Enviar para impressora ou abrir janela de impressão
    //     const url = window.URL.createObjectURL(blob);
    //     window.open(url, '_blank');
    // });
    
    console.log('Imprimindo nota fiscal...');
}


// Alert modal functions
function showSuccessAlert(message) {
    document.getElementById('success-message').textContent = message;
    openModal('success-alert-modal');
    // Auto close and reload after 2 seconds
    setTimeout(() => {
        closeModal('success-alert-modal');
        loadTables();
    }, 2000);
}

function showErrorAlert(message) {
    document.getElementById('error-message').textContent = message;
    openModal('error-alert-modal');
}

function showKitchenPreparingAlert(tableNumber) {
    document.getElementById('kitchen-preparing-message').textContent = `Pedido da mesa ${tableNumber} movido para preparação`;
    openModal('kitchen-preparing-alert-modal');
    setTimeout(() => {
        closeModal('kitchen-preparing-alert-modal');
    }, 2000);
}

function showKitchenCompletedAlert(tableNumber) {
    document.getElementById('kitchen-completed-message').textContent = `Pedido da mesa ${tableNumber} está pronto para entrega`;
    openModal('kitchen-completed-alert-modal');
    setTimeout(() => {
        closeModal('kitchen-completed-alert-modal');
    }, 2000);
}

// ============================================
// MODAL DE COZINHA
// ============================================

function openKitchenModal() {
    // TODO: BACKEND - Buscar pedidos do banco de dados para todas as status
    // fetch('/api/kitchen/orders', {
    //     headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
    // })
    // .then(response => response.json())
    // .then(data => {
    //     renderKitchenOrders('queue', data.queue);
    //     renderKitchenOrders('preparing', data.preparing);
    //     renderKitchenOrders('completed', data.completed);
    // })
    // .catch(error => console.error('Erro ao carregar pedidos da cozinha:', error));
    
    // Dados de exemplo - remova quando implementar backend
    renderKitchenOrders('queue', [
        {
            id: 1,
            tableNumber: 3,
            items: [
                { name: 'Burger', quantity: 2 },
                { name: 'Batata Frita', quantity: 1 }
            ],
            timestamp: new Date()
        },
        {
            id: 2,
            tableNumber: 5,
            items: [
                { name: 'Pizza', quantity: 1 }
            ],
            timestamp: new Date()
        }
    ]);
    renderKitchenOrders('preparing', []);
    renderKitchenOrders('completed', []);
    
    openModal('kitchen-modal');
}

function renderKitchenOrders(status, orders) {
    const container = document.getElementById(`${status}-orders`);
    container.innerHTML = '';
    
    if (!orders || orders.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon"><i class="fas fa-inbox"></i></div>
                <div class="empty-state-text">Nenhum pedido nesta seção</div>
            </div>
        `;
        return;
    }
    
    orders.forEach(order => {
        const card = document.createElement('div');
        card.className = 'kitchen-order-card';
        card.setAttribute('data-testid', `kitchen-order-${order.id}`);
        
        const itemsHTML = order.items.map(item => `
            <div class="order-item">
                <span class="order-item-quantity">${item.quantity}x</span>
                <span class="order-item-name">${item.name}</span>
                ${item.observations ? `<div class="order-item-note"><i class="fas fa-sticky-note"></i> ${item.observations}</div>` : ''}
            </div>
        `).join('');
        
        const timeString = order.timestamp instanceof Date 
            ? order.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
            : order.timestamp;
        
        let actionButtonsHTML = '';
        if (status === 'queue') {
            actionButtonsHTML = `
                <button class="btn-start-preparing" data-order-id="${order.id}" data-table-number="${order.tableNumber}" data-testid="btn-start-${order.id}">
                    <i class="fas fa-fire"></i> Começar
                </button>
            `;
        } else if (status === 'preparing') {
            actionButtonsHTML = `
                <button class="btn-mark-ready" data-order-id="${order.id}" data-table-number="${order.tableNumber}" data-testid="btn-ready-${order.id}">
                    <i class="fas fa-check"></i> Pronto
                </button>
            `;
        }
        
        card.innerHTML = `
            <div class="order-header">
                <div class="order-table">Mesa ${order.tableNumber}</div>
                <div class="order-time">${timeString}</div>
            </div>
            <div class="order-items">${itemsHTML}</div>
            <div class="order-actions">${actionButtonsHTML}</div>
        `;
        
        container.appendChild(card);
    });
    
    // Add event listeners para os botões de ação
    container.querySelectorAll('.btn-start-preparing').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const button = e.target.closest('button');
            const orderId = parseInt(button.getAttribute('data-order-id'));
            const tableNumber = button.getAttribute('data-table-number');
            moveOrderToPreparing(orderId, tableNumber);
        });
    });
    
    container.querySelectorAll('.btn-mark-ready').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const button = e.target.closest('button');
            const orderId = parseInt(button.getAttribute('data-order-id'));
            const tableNumber = button.getAttribute('data-table-number');
            moveOrderToCompleted(orderId, tableNumber);
        });
    });
}

function moveOrderToPreparing(orderId, tableNumber = 'Mesa') {
    // TODO: BACKEND - Atualizar status do pedido no banco de dados
    // fetch(`/api/kitchen/orders/${orderId}/prepare`, {
    //     method: 'PATCH',
    //     headers: {
    //         'Content-Type': 'application/json',
    //         'Authorization': `Bearer ${localStorage.getItem('authToken')}`
    //     },
    //     body: JSON.stringify({ status: 'preparing' })
    // })
    // .then(response => response.json())
    // .then(data => {
    //     if (data.success) {
    //         openKitchenModal(); // Recarregar
    //     }
    // })
    // .catch(error => console.error('Erro:', error));
    
    console.log('Movendo pedido', orderId, 'para preparação');
    openKitchenModal();
}

function moveOrderToCompleted(orderId, tableNumber = 'Mesa') {
    // TODO: BACKEND - Atualizar status do pedido no banco de dados
    // fetch(`/api/kitchen/orders/${orderId}/complete`, {
    //     method: 'PATCH',
    //     headers: {
    //         'Content-Type': 'application/json',
    //         'Authorization': `Bearer ${localStorage.getItem('authToken')}`
    //     },
    //     body: JSON.stringify({ status: 'completed' })
    // })
    // .then(response => response.json())
    // .then(data => {
    //     if (data.success) {
    //         openKitchenModal(); // Recarregar
    //     }
    // })
    // .catch(error => console.error('Erro:', error));
    
    console.log('Pedido', orderId, 'finalizado');
    openKitchenModal();
}

function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// ============================================
// EXPORTAÇÕES (se necessário)
// ============================================

// Para uso em módulos ES6, se necessário:
// export { initializeApp, handleLogin, loadTables };
