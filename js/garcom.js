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
    document.getElementById('login-screen').classList.remove('active');
    document.getElementById('main-screen').classList.add('active');
    
    updateDateDisplay();
    loadTables();
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
    document.getElementById('edit-menu-btn').addEventListener('click', handleEditMenu);
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    
    // Menu modal
    document.querySelector('#menu-modal .modal-close').addEventListener('click', () => closeModal('menu-modal'));
    document.getElementById('add-to-order-btn').addEventListener('click', handleAddToOrder);
    
    // Bill modal
    document.querySelector('#bill-modal .modal-close').addEventListener('click', () => closeModal('bill-modal'));
    document.getElementById('finalize-bill-btn').addEventListener('click', handleFinalizeBill);
    
    // Edit menu modal
    document.querySelector('#edit-menu-modal .modal-close').addEventListener('click', () => closeModal('edit-menu-modal'));
    document.getElementById('add-menu-item-btn').addEventListener('click', handleAddMenuItem);
    
    // Select Table modal
    document.querySelector('#select-table-modal .modal-close').addEventListener('click', () => closeModal('select-table-modal'));

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
    
    const username = document.getElementById('username').value;
    
    // Simulação temporária
    if (username) {
        currentUser = { username, role: 'waiter' };
        showMainScreen();
    } else {
        alert('Por favor, digite seu nome');
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

function handleEditMenu() {
    openEditMenuModal();
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
        
        itemDiv.innerHTML = `
            <div class="menu-item-image">
                <img src="${item.image}" alt="${item.name}">
            </div>
            <div class="menu-item-name">${item.name}</div>
            <div class="menu-item-description">${item.description}</div>
            <div class="menu-item-price">R$ ${item.price.toFixed(2)}</div>
            <div class="menu-item-quantity">
                <button class="quantity-btn" data-action="decrease" data-testid="decrease-${item.id}">-</button>
                <span class="quantity-value" data-testid="quantity-${item.id}">0</span>
                <button class="quantity-btn" data-action="increase" data-testid="increase-${item.id}">+</button>
            </div>
        `;
        
        container.appendChild(itemDiv);
    });
    
    // Add event listeners para os botões de quantidade
    container.querySelectorAll('.quantity-btn').forEach(btn => {
        btn.addEventListener('click', handleQuantityChange);
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
        cartItems[itemId] = { ...item, quantity: currentQuantity };
        e.target.closest('.menu-item').classList.add('selected');
    } else {
        delete cartItems[itemId];
        e.target.closest('.menu-item').classList.remove('selected');
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
    
    openModal('bill-modal');
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
    const paymentMethod = document.getElementById('payment-method').value;
    
    if (!paymentMethod) {
        alert('Selecione uma forma de pagamento');
        return;
    }
    
    // TODO: BACKEND - Finalizar comanda no banco de dados
    // const billData = {
    //     tableNumber: selectedTable.number,
    //     paymentMethod: paymentMethod,
    //     total: calculateTotal(),
    //     closedBy: currentUser.id,
    //     closedAt: new Date().toISOString()
    // };
    // 
    // fetch('/api/orders/close', {
    //     method: 'POST',
    //     headers: {
    //         'Content-Type': 'application/json',
    //         'Authorization': `Bearer ${localStorage.getItem('authToken')}`
    //     },
    //     body: JSON.stringify(billData)
    // })
    // .then(response => response.json())
    // .then(data => {
    //     if (data.success) {
    //         // Imprimir nota fiscal
    //         printReceipt(data.orderId);
    //         
    //         if (requestFeedback) {
    //             closeModal('bill-modal');
    //             openModal('feedback-modal');
    //         } else {
    //             closeModal('bill-modal');
    //             alert('Mesa liberada com sucesso!');
    //             loadTables();
    //         }
    //     }
    // });
    
    console.log('Finalizando comanda:', { paymentMethod });
    closeModal('bill-modal');
    
    alert('Mesa liberada com sucesso!');
    loadTables();
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

// ============================================
// MODAL DE EDIÇÃO DE CARDÁPIO
// ============================================

function openEditMenuModal() {
    // TODO: BACKEND - Buscar todos os itens do cardápio
    // fetch('/api/menu', {
    //     headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
    // })
    // .then(response => response.json())
    // .then(data => {
    //     renderEditMenuItems(data.items);
    // });
    
    renderEditMenuItems(menuItems);
    openModal('edit-menu-modal');
}

function renderEditMenuItems(items) {
    const container = document.getElementById('edit-menu-list');
    container.innerHTML = '';
    
    items.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'edit-menu-item';
        itemDiv.setAttribute('data-testid', `edit-item-${item.id}`);
        
        itemDiv.innerHTML = `
            <div class="edit-menu-item-image">
                <img src="${item.image}" alt="${item.name}">
            </div>
            <div class="edit-menu-item-info">
                <div class="edit-menu-item-name">${item.name}</div>
                <div class="edit-menu-item-description">${item.description}</div>
                <div class="edit-menu-item-price">R$ ${item.price.toFixed(2)}</div>
            </div>
            <div class="edit-menu-item-actions">
                <button class="btn-edit-item" data-item-id="${item.id}" data-testid="edit-item-btn-${item.id}">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="btn-delete-item" data-item-id="${item.id}" data-testid="delete-item-btn-${item.id}">
                    <i class="fas fa-trash"></i> Excluir
                </button>
            </div>
        `;
        
        container.appendChild(itemDiv);
    });
    
    // Add event listeners
    container.querySelectorAll('.btn-edit-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const itemId = e.target.closest('.btn-edit-item').getAttribute('data-item-id');
            handleEditMenuItem(itemId);
        });
    });
    
    container.querySelectorAll('.btn-delete-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const itemId = e.target.closest('.btn-delete-item').getAttribute('data-item-id');
            handleDeleteMenuItem(itemId);
        });
    });
}

function handleAddMenuItem() {
    // TODO: BACKEND - Criar formulário para adicionar novo item
    // Coletar: nome, descrição, preço, categoria, imagem
    // POST /api/menu
    
    alert('Formulário para adicionar produto será implementado');
}

function handleEditMenuItem(itemId) {
    // TODO: BACKEND - Abrir formulário de edição preenchido com dados do item
    // PUT /api/menu/:id
    
    alert(`Editar item ${itemId} - implementar formulário`);
}

function handleDeleteMenuItem(itemId) {
    if (!confirm('Tem certeza que deseja excluir este item?')) {
        return;
    }
    
    // TODO: BACKEND - Deletar item do banco de dados
    // fetch(`/api/menu/${itemId}`, {
    //     method: 'DELETE',
    //     headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
    // })
    // .then(response => response.json())
    // .then(data => {
    //     if (data.success) {
    //         alert('Item excluído com sucesso!');
    //         openEditMenuModal(); // Recarregar lista
    //     }
    // });
    
    alert(`Item ${itemId} excluído!`);
    openEditMenuModal();
}

// ============================================
// FUNÇÕES UTILITÁRIAS
// ============================================

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
