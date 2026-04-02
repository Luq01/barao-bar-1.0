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

// ============================================
// 2. INICIALIZAÇÃO E ROTEAMENTO
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    checkSession();
});

function checkSession() {
    document.getElementById('login-screen').classList.add('active');
    document.getElementById('admin-screen').classList.add('hide');
    document.getElementById('garcom-screen').classList.add('hide');
}

async function handleLogin(e) {
    e.preventDefault();
    const nome = document.getElementById('username').value;
    const senha = document.getElementById('password').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/gerente/login`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, senha })
        });
        const data = await response.json();
        
        if (data.nome && data.role) {
            currentUser = data;
            document.getElementById('login-screen').classList.remove('active');
            document.getElementById('login-form').reset();
            
            if (data.role === 'admin' || data.role === 'GERENTE') {
                document.getElementById('admin-screen').classList.remove('hide');
                document.getElementById('admin-screen').classList.add('active');
                loadDashboardData();
            } else {
                document.getElementById('garcom-screen').classList.remove('hide');
                document.getElementById('garcom-screen').classList.add('active');
                carregarCardapio();
            }
            loadTables();
        } else {
            alert('Usuário ou senha inválidos');
        }
    } catch (error) {
        console.error('Erro no login:', error);
    }
}

function handleLogout() {
    currentUser = null;
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
    if(!input) return;
    
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
    selectedTable = table;
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
            <div class="variation-row" style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px; background: rgba(255,255,255,0.05); padding: 8px; border-radius: 5px; border: 1px solid rgba(212,175,55,0.3);">
                <span style="color: #fff; font-size: 0.9rem;">${v.tamanho} - R$ ${v.valor.toFixed(2)}</span>
                <div class="quantity-controls" style="display: flex; align-items: center; gap: 10px;">
                    <button class="btn-qty" onclick='changeQty(${v.id}, -1, "${item.nome}", "${v.tamanho}")' style="background: #c0392b; color: white; border: none; width: 28px; height: 28px; border-radius: 4px; cursor: pointer;">-</button>
                    <span id="qty-${v.id}" style="color: #d4af37; font-weight: bold; min-width: 20px; text-align: center;">${qtd}</span>
                    <button class="btn-qty" onclick='changeQty(${v.id}, 1, "${item.nome}", "${v.tamanho}")' style="background: #27ae60; color: white; border: none; width: 28px; height: 28px; border-radius: 4px; cursor: pointer;">+</button>
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
    renderOrderSummary();
}

function closeOrderSummaryReturnMenu() {
    const modalResume = document.getElementById('resume-modal');
    if(modalResume) modalResume.classList.add('hide');
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
    } catch(err) { console.error(err); }
}

// ============================================
// 6. GESTÃO DE CARDÁPIO (LÓGICA ADMIN)
// ============================================
function loadDashboardData() {
    console.log("Carregando dados do Admin...");
    // Suas requisições de dashboard virão aqui
}

function handleEditMenu() {
    const menuSection = document.getElementById('menu-management-section');
    if(!menuSection) return;
    
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
    if(!container) return;
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
                <button class="btn btn-secondary btn-sm btn-edit" onclick="alert('Edição em breve!')">
                    <i class="fas fa-edit"></i> Editar
                </button>
            </div>
        `;
        container.appendChild(itemDiv);
    });
}

// ============================================
// 7. UTILITÁRIOS E EVENTOS GERAIS
// ============================================



function alterarPainel() {
    const adminScreen = document.getElementById('admin-screen');
    const loginScreen = document.getElementById('login-screen');
    const garcomScreen = document.getElementById('garcom-screen');
    if (adminScreen.classList.contains('active')) {
        adminScreen.classList.remove('active');
        adminScreen.classList.add('hide');
        garcomScreen.classList.remove('hide');
        garcomScreen.classList.add('active');
    } else {
        garcomScreen.classList.remove('active');
        garcomScreen.classList.add('hide');
        loginScreen.classList.remove('hide');
        loginScreen.classList.add('active');
    }
}


function openModal(id) { 
    const modal = document.getElementById(id);
    if(modal) modal.classList.add('active'); 
}

function closeModal(id) { 
    const modal = document.getElementById(id);
    if(modal) modal.classList.remove('active'); 
}

function mostrarToastPermanente(id) {
    const toast = document.getElementById(id);
    if(toast) toast.classList.remove('hide');
}

function setupEventListeners() {
    // Fechar modais ao clicar no X
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.onclick = (e) => {
            const modal = e.target.closest('.modal');
            if(modal) closeModal(modal.id);
        }
    });

    const cancelAddTableBtn = document.getElementById('cancel-add-table-btn');
    if (cancelAddTableBtn) {
        cancelAddTableBtn.onclick = () => document.getElementById('modal-container').classList.add('hide');
    }

    // Login e Logout
    const loginForm = document.getElementById('login-form');
    if(loginForm) loginForm.addEventListener('submit', handleLogin);
    
    const logoutBtnAdmin = document.getElementById('logout-btn');
    if(logoutBtnAdmin) logoutBtnAdmin.addEventListener('click', handleLogout);

    const logoutBtnGarcom = document.getElementById('logout-btn-garcom');
    if(logoutBtnGarcom) logoutBtnGarcom.addEventListener('click', handleLogout);
    
    // Ações do Admin
    const editMenuBtn = document.getElementById('edit-menu-btn');
    if(editMenuBtn) editMenuBtn.addEventListener('click', handleEditMenu);

    // Ações do Garçom
    const newOrderBtn = document.getElementById('new-order-btn');
    if(newOrderBtn) {
        newOrderBtn.addEventListener('click', async () => {
            openModal('select-table-modal');
            await loadTablesForSelection();
        });
    }

    const btnAbrirMesa = document.querySelector('#add-new-table .btn-primary');
    if(btnAbrirMesa) btnAbrirMesa.addEventListener('click', openMesa);

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