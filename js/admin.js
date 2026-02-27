/* ========================================
   JAVASCRIPT - PÁGINA ADMINISTRADOR
   Sistema de Restaurante Barão
   ======================================== */

// ============================================
// VARIÁVEIS GLOBAIS E ESTADO DA APLICAÇÃO
// ============================================

let currentUser = null;
let currentDate = new Date();
let dashboardData = {
    totalSales: 0,
    totalOrders: 0,
    activeTables: 0
};

// Dados mockados para visualização
const MOCK_MENU_ITEMS = [
    {
        id: 1,
        name: 'Filé de Tilápia',
        description: 'Acompanha molho de alho (6 Unidades).',
        price: 60.00,
        category: 'destaques',
        image: 'https://images.unsplash.com/photo-1485921325833-c519f76c4927?w=400'
    },
    {
        id: 2,
        name: 'Costelinha Suína ao Barbecue',
        description: 'Com Mandioca ou Fritas (Serve até 4 Pessoas).',
        price: 70.00,
        category: 'destaques',
        image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400'
    }
];

// ============================================
// INICIALIZAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    console.log('Inicializando sistema do administrador...');
    
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
    loadDashboardData();
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
    // Login
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('show-register-btn').addEventListener('click', handleShowRegister);
    
    // Register modal
    document.querySelector('#register-modal .modal-close').addEventListener('click', () => closeModal('register-modal'));
    document.getElementById('cancel-register-btn').addEventListener('click', () => closeModal('register-modal'));
    document.getElementById('submit-register-btn').addEventListener('click', handleRegister);
    
    // Date navigation
    document.getElementById('prev-date').addEventListener('click', () => changeDate(-1));
    document.getElementById('next-date').addEventListener('click', () => changeDate(1));
    
    // Action buttons
    document.getElementById('view-tables-btn').addEventListener('click', handleViewTables);
    document.getElementById('view-payments-btn').addEventListener('click', handleViewPayments);
    document.getElementById('edit-menu-btn').addEventListener('click', handleEditMenu);
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    
    // Modal close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            closeModal(modal.id);
        });
    });
    
    // Edit menu modal
    document.getElementById('add-menu-item-btn').addEventListener('click', handleAddMenuItem);
}

// ============================================
// AUTENTICAÇÃO
// ============================================

function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    // TODO: BACKEND - Implementar autenticação
    // Exemplo:
    // fetch('/api/auth/login', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ username, password, role: 'admin' })
    // })
    // .then(response => response.json())
    // .then(data => {
    //     if (data.success) {
    //         localStorage.setItem('authToken', data.token);
    //         currentUser = data.user;
    //         showMainScreen();
    //     } else {
    //         alert('Usuário ou senha inválidos');
    //     }
    // })
    // .catch(error => {
    //     console.error('Erro ao fazer login:', error);
    //     alert('Erro ao conectar com o servidor');
    // });
    
    // Simulação temporária
    if (username && password) {
        currentUser = { username, role: 'admin' };
        showMainScreen();
    } else {
        alert('Por favor, preencha todos os campos');
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
    
    // TODO: BACKEND - Implementar cadastro de administrador
    // Exemplo:
    // fetch('/api/auth/register', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ name, username, password, role: 'admin' })
    // })
    // .then(response => response.json())
    // .then(data => {
    //     if (data.success) {
    //         alert('Cadastro realizado com sucesso!');
    //         closeModal('register-modal');
    //         document.getElementById('register-form').reset();
    //     } else {
    //         alert(data.message || 'Erro ao cadastrar administrador');
    //     }
    // })
    // .catch(error => {
    //     console.error('Erro ao cadastrar:', error);
    //     alert('Erro ao conectar com o servidor');
    // });
    
    // Simulação temporária
    console.log('Cadastro:', { name, username, role: 'admin' });
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
    loadDashboardData();
}

function formatDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

// ============================================
// DASHBOARD
// ============================================

function loadDashboardData() {
    // TODO: BACKEND - Buscar dados do dashboard para a data selecionada
    // fetch(`/api/dashboard?date=${currentDate.toISOString()}`, {
    //     headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
    // })
    // .then(response => response.json())
    // .then(data => {
    //     updateDashboardCards(data);
    //     loadTables(data.tables);
    //     loadTopProducts(data.topProducts);
    // });
    
    // Simulação temporária
    const mockData = {
        totalSales: 1450.00,
        totalOrders: 12,
        activeTables: 3,
        tables: [
            { number: 2, status: 'occupied', waiter: 'João Silva', total: 70.00 },
            { number: 4, status: 'occupied', waiter: 'Maria Santos', total: 135.00 },
            { number: 7, status: 'occupied', waiter: 'João Silva', total: 95.00 }
        ],
        topProducts: [
            { name: 'Costelinha Suína ao Barbecue', quantity: 5, revenue: 350.00, image: MOCK_MENU_ITEMS[1].image },
            { name: 'Filé de Tilápia', quantity: 4, revenue: 240.00, image: MOCK_MENU_ITEMS[0].image }
        ]
    };
    
    updateDashboardCards(mockData);
    loadTables(mockData.tables);
    loadTopProducts(mockData.topProducts);
}

function updateDashboardCards(data) {
    document.getElementById('total-sales').textContent = `R$ ${data.totalSales.toFixed(2)}`;
    document.getElementById('total-orders').textContent = data.totalOrders;
    document.getElementById('active-tables').textContent = data.activeTables;
}

// ============================================
// GERENCIAMENTO DE MESAS
// ============================================

function loadTables(tables) {
    const grid = document.getElementById('tables-grid');
    grid.innerHTML = '';
    
    if (tables.length === 0) {
        grid.innerHTML = '<p style="text-align: center; color: var(--color-beige); grid-column: 1/-1;">Nenhuma mesa em atendimento no momento</p>';
        return;
    }
    
    tables.forEach(table => {
        const card = document.createElement('div');
        card.className = 'table-card occupied';
        card.setAttribute('data-testid', `table-${table.number}`);
        card.innerHTML = `
            <div class="table-number">${table.number}</div>
            <div class="table-status">R$ ${table.total.toFixed(2)}</div>
        `;
        card.addEventListener('click', () => openTableDetailsModal(table));
        grid.appendChild(card);
    });
}

function handleViewTables() {
    // Scroll para a seção de mesas
    document.querySelector('.section').scrollIntoView({ behavior: 'smooth' });
}

function openTableDetailsModal(table) {
    document.getElementById('table-number').textContent = table.number;
    document.getElementById('table-waiter').textContent = table.waiter;
    document.getElementById('table-open-time').textContent = '14:30';
    
    // TODO: BACKEND - Buscar pedidos da mesa
    // fetch(`/api/orders/table/${table.number}`, {
    //     headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
    // })
    // .then(response => response.json())
    // .then(data => {
    //     renderTableOrders(data.orders);
    // });
    
    // Simulação
    const mockOrders = [
        {
            time: '14:35',
            items: [
                { name: 'Costelinha Suína ao Barbecue', quantity: 1, price: 70.00 }
            ]
        }
    ];
    
    renderTableOrders(mockOrders);
    document.getElementById('table-total-value').textContent = `R$ ${table.total.toFixed(2)}`;
    
    openModal('table-details-modal');
}

function renderTableOrders(orders) {
    const container = document.getElementById('table-orders');
    container.innerHTML = '';
    
    orders.forEach((order, index) => {
        const orderDiv = document.createElement('div');
        orderDiv.className = 'order-item';
        orderDiv.setAttribute('data-testid', `order-${index}`);
        
        const itemsList = order.items.map(item => 
            `<li>${item.quantity}x ${item.name} - R$ ${(item.quantity * item.price).toFixed(2)}</li>`
        ).join('');
        
        orderDiv.innerHTML = `
            <div class="order-item-header">
                <strong>Pedido #${index + 1}</strong>
                <span class="order-time">${order.time}</span>
            </div>
            <ul class="order-items-list">
                ${itemsList}
            </ul>
        `;
        
        container.appendChild(orderDiv);
    });
}

// ============================================
// PRODUTOS MAIS VENDIDOS
// ============================================

function loadTopProducts(products) {
    const container = document.getElementById('products-list');
    container.innerHTML = '';
    
    if (products.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--color-beige);">Nenhum produto vendido no dia selecionado</p>';
        return;
    }
    
    products.forEach((product, index) => {
        const productDiv = document.createElement('div');
        productDiv.className = 'product-item';
        productDiv.setAttribute('data-testid', `product-${index}`);
        
        productDiv.innerHTML = `
            <div class="product-info">
                <div class="product-image">
                    <img src="${product.image}" alt="${product.name}">
                </div>
                <div class="product-details">
                    <h4>${product.name}</h4>
                    <p>${product.quantity} unidades vendidas</p>
                </div>
            </div>
            <div class="product-stats">
                <div class="stat-item">
                    <div class="stat-label">Quantidade</div>
                    <div class="stat-value">${product.quantity}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Receita</div>
                    <div class="stat-value">R$ ${product.revenue.toFixed(2)}</div>
                </div>
            </div>
        `;
        
        container.appendChild(productDiv);
    });
}

// ============================================
// FORMAS DE PAGAMENTO
// ============================================

function handleViewPayments() {
    // TODO: BACKEND - Buscar resumo de formas de pagamento do dia
    // fetch(`/api/payments/summary?date=${currentDate.toISOString()}`, {
    //     headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
    // })
    // .then(response => response.json())
    // .then(data => {
    //     renderPaymentsSummary(data.payments);
    // });
    
    // Simulação
    const mockPayments = [
        { method: 'Dinheiro', icon: 'fa-money-bill-wave', count: 5, total: 450.00 },
        { method: 'Cartão de Crédito', icon: 'fa-credit-card', count: 4, total: 520.00, fee: 15.60 },
        { method: 'Cartão de Débito', icon: 'fa-credit-card', count: 2, total: 220.00, fee: 4.40 },
        { method: 'PIX', icon: 'fa-qrcode', count: 3, total: 260.00 }
    ];
    
    renderPaymentsSummary(mockPayments);
    openModal('payments-modal');
}

function renderPaymentsSummary(payments) {
    const container = document.getElementById('payments-summary');
    container.innerHTML = '';
    
    payments.forEach((payment, index) => {
        const paymentDiv = document.createElement('div');
        paymentDiv.className = 'payment-item';
        paymentDiv.setAttribute('data-testid', `payment-${index}`);
        
        // Calcular valor líquido (descontando taxa se houver)
        const netAmount = payment.fee ? payment.total - payment.fee : payment.total;
        
        paymentDiv.innerHTML = `
            <div class="payment-method-name">
                <div class="payment-icon">
                    <i class="fas ${payment.icon}"></i>
                </div>
                <div>
                    <h4>${payment.method}</h4>
                    ${payment.fee ? `<small style="color: var(--color-text-light);">Taxa: R$ ${payment.fee.toFixed(2)}</small>` : ''}
                </div>
            </div>
            <div class="payment-details">
                <div class="payment-count">${payment.count} transações</div>
                <div class="payment-amount">R$ ${netAmount.toFixed(2)}</div>
            </div>
        `;
        
        container.appendChild(paymentDiv);
    });
}

// ============================================
// EDIÇÃO DE CARDÁPIO
// ============================================

function handleEditMenu() {
    // TODO: BACKEND - Buscar todos os itens do cardápio
    // fetch('/api/menu', {
    //     headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
    // })
    // .then(response => response.json())
    // .then(data => {
    //     renderEditMenuItems(data.items);
    // });
    
    renderEditMenuItems(MOCK_MENU_ITEMS);
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
    //         handleEditMenu(); // Recarregar lista
    //     }
    // });
    
    alert(`Item ${itemId} excluído!`);
    handleEditMenu();
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
// export { initializeApp, handleLogin, loadDashboardData };
