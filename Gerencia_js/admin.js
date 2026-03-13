/* ========================================
   JAVASCRIPT - PÁGINA ADMINISTRADOR
   Sistema de Restaurante Barão
   ======================================== */

// ============================================
// VARIÁVEIS GLOBAIS E ESTADO DA APLICAÇÃO
// ============================================

let currentUser = null;
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
        type: 'comida',
        price: 60.00,
        sizes: [],
        category: 'destaques',
        image: 'https://images.unsplash.com/photo-1485921325833-c519f76c4927?w=400',
        stock: 20
    },
    {
        id: 2,
        name: 'Costelinha Suína ao Barbecue',
        description: 'Com Mandioca ou Fritas (Serve até 4 Pessoas).',
        type: 'comida',
        price: 70.00,
        sizes: [
            { label: 'Individual', price: 49.90 },
            { label: 'Compartilhar', price: 89.90 }
        ],
        category: 'destaques',
        image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400',
        stock: 15
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
    
    loadDashboardData();
}

// ============================================
// EVENT LISTENERS
// ============================================

function createSizeRowHtml(label = '', price = '', labelClass = 'new-size-label', priceClass = 'new-size-price') {
    return `
        <div class="form-group-row size-row">
            <input type="text" class="${labelClass}" value="${label}" placeholder="Tamanho (ex: 300ml, P, G)">
            <input type="number" class="${priceClass}" value="${price}" placeholder="Preço (R$)" step="0.01" min="0">
            <button type="button" class="btn btn-danger btn-sm size-remove-btn" title="Remover tamanho">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
}

function addNewProductSizeRow(label = '', price = '') {
    const container = document.getElementById('new-product-sizes');
    container.insertAdjacentHTML('beforeend', createSizeRowHtml(label, price, 'new-size-label', 'new-size-price'));
}

function setupEventListeners() {
    // Login
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('show-register-btn').addEventListener('click', handleShowRegister);
    
    // Register modal
    document.querySelector('#register-modal .modal-close').addEventListener('click', () => closeModal('register-modal'));
    document.getElementById('cancel-register-btn').addEventListener('click', () => closeModal('register-modal'));
    document.getElementById('submit-register-btn').addEventListener('click', handleRegister);
    
    
    
    // Action buttons
    document.getElementById('view-tables-btn').addEventListener('click', handleViewTables);
    document.getElementById('view-payments-btn').addEventListener('click', handleViewPayments);
    document.getElementById('kitchen-btn').addEventListener('click', openKitchenModal);
    document.getElementById('edit-menu-btn').addEventListener('click', handleEditMenu);
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    
    // Modal close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            closeModal(modal.id);
        });
    });
    
    // Kitchen alert modals
    const kitchenPreparingBtn = document.getElementById('close-kitchen-preparing-btn');
    const kitchenCompletedBtn = document.getElementById('close-kitchen-completed-btn');
    
    if (kitchenPreparingBtn) {
        kitchenPreparingBtn.addEventListener('click', () => closeModal('kitchen-preparing-alert-modal'));
    }
    if (kitchenCompletedBtn) {
        kitchenCompletedBtn.addEventListener('click', () => closeModal('kitchen-completed-alert-modal'));
    }

    // New menu management form
    document.getElementById('add-product-form').addEventListener('submit', handleAddProductSubmit);

    const addNewSizeBtn = document.getElementById('add-new-size-btn');
    if (addNewSizeBtn) {
        addNewSizeBtn.addEventListener('click', () => addNewProductSizeRow());
    }

    const newSizesContainer = document.getElementById('new-product-sizes');
    if (newSizesContainer) {
        newSizesContainer.addEventListener('click', (e) => {
            const removeBtn = e.target.closest('.size-remove-btn');
            if (removeBtn) {
                removeBtn.closest('.size-row')?.remove();
            }
        });
    }

    // Linha inicial de tamanho
    addNewProductSizeRow();
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
// EDIÇÃO DE CARDÁPIO (NOVA VERSÃO)
// ============================================

function handleEditMenu() {
    const menuSection = document.getElementById('menu-management-section');
    const isVisible = menuSection.style.display !== 'none';

    if (isVisible) {
        menuSection.style.display = 'none';
    } else {
        menuSection.style.display = 'block';
        // TODO: BACKEND - Buscar todos os itens do cardápio
        // fetch('/api/menu', { headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` } })
        // .then(response => response.json())
        // .then(data => {
        //     renderEditableMenuItems(data.items);
        // });
        
        // Simulação
        renderEditableMenuItems(MOCK_MENU_ITEMS);
        menuSection.scrollIntoView({ behavior: 'smooth' });
    }
}

function renderEditableMenuItems(items) {
    const container = document.getElementById('editable-menu-items');
    container.innerHTML = '';

    if (!items || items.length === 0) {
        container.innerHTML = '<p class="text-center" style="color: var(--color-text-light);">Nenhum item no cardápio para editar.</p>';
        return;
    }

    items.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'editable-item';
        itemDiv.setAttribute('data-item-id', item.id);
        itemDiv.setAttribute('data-testid', `editable-item-${item.id}`);

        const hasSizes = Array.isArray(item.sizes) && item.sizes.length > 0;
        const pricesHtml = hasSizes
            ? item.sizes.map(size => `<span>${size.label}: R$ ${size.price.toFixed(2)}</span>`).join('')
            : `<span>R$ ${item.price.toFixed(2)}</span>`;

        itemDiv.innerHTML = `
            <div class="item-info-container">
                <img src="${item.image}" alt="${item.name}" class="item-thumbnail">
                <div class="item-info">
                    <strong>${item.name}</strong>
                    ${pricesHtml}
                    <p>${item.description}</p>
                </div>
            </div>
            <div class="item-actions">
                <button class="btn btn-secondary btn-sm btn-edit">
                    <i class="fas fa-edit"></i> Editar
                </button>
            </div>
        `;
        container.appendChild(itemDiv);
    });

    // Add event listeners for edit buttons
    container.querySelectorAll('.btn-edit').forEach(button => {
        button.addEventListener('click', (e) => {
            const itemDiv = e.currentTarget.closest('.editable-item');
            toggleEditMode(itemDiv);
        });
    });
}

function toggleEditMode(itemDiv) {
    const itemId = itemDiv.getAttribute('data-item-id');
    const item = MOCK_MENU_ITEMS.find(i => i.id == itemId);

    if (!item) return;

    // Change to edit mode
    itemDiv.classList.add('editing');
    const sizes = Array.isArray(item.sizes) && item.sizes.length
        ? item.sizes
        : [{ label: '', price: '' }, { label: '', price: '' }, { label: '', price: '' }];

    const sizesInputs = sizes.map(size =>
        createSizeRowHtml(size.label ?? '', size.price !== '' ? size.price : '', 'edit-size-label', 'edit-size-price')
    ).join('');

    itemDiv.innerHTML = `
        <div class="item-info-edit">
            <div class="form-group">
                <label>Nome</label>
                <input type="text" class="edit-name" value="${item.name}">
            </div>
            <div class="form-group">
                <label>Descrição</label>
                <textarea class="edit-description" rows="2">${item.description}</textarea>
            </div>
            <div class="form-group-row">
                <div class="form-group">
                    <label>Tipo</label>
                    <select class="edit-type">
                        <option value="comida" ${item.type === 'comida' ? 'selected' : ''}>Comida</option>
                        <option value="bebida" ${item.type === 'bebida' ? 'selected' : ''}>Bebida</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Valor Base (R$)</label>
                    <input type="number" class="edit-price" value="${item.price.toFixed(2)}" step="0.01">
                </div>
                <div class="form-group">
                    <label>Estoque</label>
                    <input type="number" class="edit-stock" value="${item.stock || 0}" min="0">
                </div>
            </div>
            <div class="form-group">
                <label>Opções de tamanho (opcional)</label>
                <div class="edit-sizes-container">
                    ${sizesInputs}
                </div>
                <button type="button" class="btn btn-secondary btn-sm add-edit-size-btn">
                    <i class="fas fa-plus"></i> Adicionar tamanho
                </button>
            </div>
        </div>
        <div class="item-photo-edit">
            <img src="${item.image}" alt="Preview" class="item-preview">
            <label for="edit-photo-${itemId}" class="btn btn-secondary btn-sm">Trocar Foto</label>
            <input type="file" id="edit-photo-${itemId}" class="edit-photo" accept="image/*" style="display: none;">
        </div>
        <div class="item-actions-edit">
            <button class="btn btn-primary btn-sm btn-save">
                <i class="fas fa-save"></i> Salvar
            </button>
            <button class="btn btn-danger btn-sm btn-delete">
                <i class="fas fa-trash"></i> Excluir
            </button>
        </div>
    `;
    
    const editPhotoInput = itemDiv.querySelector('.edit-photo');
    const previewImg = itemDiv.querySelector('.item-preview');
    const editSizesContainer = itemDiv.querySelector('.edit-sizes-container');
    const addEditSizeBtn = itemDiv.querySelector('.add-edit-size-btn');

    editPhotoInput.addEventListener('change', () => {
        if (editPhotoInput.files && editPhotoInput.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                previewImg.src = e.target.result;
            }
            reader.readAsDataURL(editPhotoInput.files[0]);
        }
    });

    if (addEditSizeBtn) {
        addEditSizeBtn.addEventListener('click', () => {
            editSizesContainer.insertAdjacentHTML('beforeend', createSizeRowHtml('', '', 'edit-size-label', 'edit-size-price'));
        });
    }

    if (editSizesContainer) {
        editSizesContainer.addEventListener('click', (e) => {
            const removeBtn = e.target.closest('.size-remove-btn');
            if (removeBtn) {
                removeBtn.closest('.size-row')?.remove();
            }
        });
    }

    itemDiv.querySelector('.btn-save').addEventListener('click', () => {
        const newName = itemDiv.querySelector('.edit-name').value;
        const newDescription = itemDiv.querySelector('.edit-description').value;
        const newType = itemDiv.querySelector('.edit-type').value;
        const newPrice = parseFloat(itemDiv.querySelector('.edit-price').value);
        const newStock = parseInt(itemDiv.querySelector('.edit-stock').value);

        const sizeLabels = [...itemDiv.querySelectorAll('.edit-size-label')].map(input => input.value.trim());
        const sizePrices = [...itemDiv.querySelectorAll('.edit-size-price')].map(input => input.value.trim());

        const newSizes = sizeLabels.map((label, index) => ({
            label,
            price: sizePrices[index] !== '' ? parseFloat(sizePrices[index]) : NaN
        })).filter(size => size.label && !Number.isNaN(size.price));

        // Update mock data
        item.name = newName;
        item.description = newDescription;
        item.type = newType;
        item.price = Number.isNaN(newPrice) ? 0 : newPrice;
        item.sizes = newSizes;
        item.stock = Number.isNaN(newStock) ? 0 : newStock;

        const photoFile = editPhotoInput.files[0];
        if (photoFile) {
            item.image = URL.createObjectURL(photoFile);
        }
        
        // TODO: BACKEND - Send updated item data to server
        console.log(`Item ${itemId} salvo:`, item);
        alert(`Item "${item.name}" atualizado com sucesso! (Simulação)`);

        // Re-render the list to show the updated item in view mode
        renderEditableMenuItems(MOCK_MENU_ITEMS);
    });

    itemDiv.querySelector('.btn-delete').addEventListener('click', () => {
        if (confirm(`Tem certeza que deseja excluir o item "${item.name}"?`)) {
            // Remove from mock data
            const itemIndex = MOCK_MENU_ITEMS.findIndex(i => i.id == itemId);
            if (itemIndex > -1) {
                MOCK_MENU_ITEMS.splice(itemIndex, 1);
            }
            
            // TODO: BACKEND - Send delete request to server
            console.log(`Item ${itemId} excluído.`);
            alert(`Item "${item.name}" excluído com sucesso! (Simulação)`);

            // Re-render the list
            renderEditableMenuItems(MOCK_MENU_ITEMS);
        }
    });
}

function handleAddProductSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('new-product-name').value;
    const description = document.getElementById('new-product-description').value;
    const type = document.getElementById('new-product-type').value;
    const price = document.getElementById('new-product-price').value;
    const photoFile = document.getElementById('new-product-photo').files[0];

    const sizeLabels = [...document.querySelectorAll('.new-size-label')].map(input => input.value.trim());
    const sizePrices = [...document.querySelectorAll('.new-size-price')].map(input => input.value.trim());
    const sizes = sizeLabels.map((label, index) => ({
        label,
        price: sizePrices[index] !== '' ? parseFloat(sizePrices[index]) : NaN
    })).filter(size => size.label && !Number.isNaN(size.price));

    if (!name || !price) {
        alert('Nome e valor base são obrigatórios.');
        return;
    }

    let imageUrl = 'https://via.placeholder.com/150';
    if (photoFile) {
        imageUrl = URL.createObjectURL(photoFile);
    }

    const newProduct = {
        id: Date.now(), // ID temporário
        name,
        description,
        type,
        price: parseFloat(price),
        sizes,
        stock: 0,
        image: imageUrl
    };

    // TODO: BACKEND - Adicionar o novo produto via API
    // fetch('/api/menu', { method: 'POST', body: JSON.stringify(newProduct), ... })

    console.log('Novo produto:', newProduct);
    alert(`Produto "${name}" adicionado com sucesso! (Simulação)`);
    
    // Adiciona na lista mockada e renderiza novamente
    MOCK_MENU_ITEMS.push(newProduct);
    renderEditableMenuItems(MOCK_MENU_ITEMS);

    document.getElementById('add-product-form').reset();
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
