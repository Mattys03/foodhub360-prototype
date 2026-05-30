/* FoodHub 360 - Engine com Permissoes, Menu Engineering Dinamico e Campos Condicionais */

const MAX_STOCK = 1000;
const MAX_ORDER_QTY = 100;

let currentRole = null;

let catalog = JSON.parse(localStorage.getItem("foodhub360_catalog")) || [
    { id: 1, name: "Hamburgao Gourmet", price: 32.00, stock: 20, cost: 10.24, salesCount: 125, color: '#22c55e', colorVar: 'var(--accent-green)' },
    { id: 2, name: "Combo Pizza + Refri", price: 48.00, stock: 15, cost: 42.24, salesCount: 350, color: '#ef4444', colorVar: 'var(--accent-red)' },
    { id: 3, name: "Torta de Limao", price: 15.00, stock: 8, cost: 4.20, salesCount: 18, color: '#06b6d4', colorVar: 'var(--accent-cyan)' },
    { id: 4, name: "Bife a Milanesa", price: 28.00, stock: 10, cost: 12.00, salesCount: 45, color: '#f59e0b', colorVar: 'var(--accent-orange)' }
];
catalog = catalog.map(item => {
    const defaults = { 
        1: { cost: 10.24, sc: 125, color: '#22c55e', colorVar: 'var(--accent-green)' }, 
        2: { cost: 42.24, sc: 350, color: '#ef4444', colorVar: 'var(--accent-red)' }, 
        3: { cost: 4.20, sc: 18, color: '#06b6d4', colorVar: 'var(--accent-cyan)' }, 
        4: { cost: 12.00, sc: 45, color: '#f59e0b', colorVar: 'var(--accent-orange)' } 
    };
    const d = defaults[item.id];
    if (d) { 
        item.cost = item.cost || d.cost; 
        item.salesCount = item.salesCount || d.sc; 
        item.color = item.color || d.color;
        item.colorVar = item.colorVar || d.colorVar;
    }
    return item;
});

let totalRevenue = parseFloat(localStorage.getItem("foodhub360_revenue")) || 0;
let ordersList = JSON.parse(localStorage.getItem("foodhub360_orders")) || [];
let kdsCount = parseInt(localStorage.getItem("foodhub360_kds_count")) || 0;
let profitChartInstance = null;

function saveLocal() {
    localStorage.setItem("foodhub360_catalog", JSON.stringify(catalog));
    localStorage.setItem("foodhub360_revenue", totalRevenue.toString());
    localStorage.setItem("foodhub360_orders", JSON.stringify(ordersList));
    localStorage.setItem("foodhub360_kds_count", kdsCount);
}

// DOM
const loginOverlay = document.getElementById("login-overlay");
const appMain = document.getElementById("app-main");
const userRoleLabel = document.getElementById("user-role-label");
const productSelect = document.getElementById("product-select");
const customerName = document.getElementById("customer-name");
const productQuantity = document.getElementById("product-quantity");
const orderSource = document.getElementById("order-source");
const deliveryTypeGroup = document.getElementById("delivery-type-group");
const deliveryType = document.getElementById("delivery-type");
const addressGroup = document.getElementById("address-group");
const deliveryAddress = document.getElementById("delivery-address");
const pdvForm = document.getElementById("pdv-form");
const inventoryTbody = document.getElementById("inventory-tbody");
const totalRevenueBadge = document.getElementById("total-revenue");
const kdsContainer = document.getElementById("kds-container");
const kdsCountBadge = document.getElementById("kds-count");
const toast = document.getElementById("toast");
const btnSupplyStock = document.getElementById("btn-supply-stock");
const btnCreateCoupon = document.getElementById("btn-create-coupon");
const couponDisplay = document.getElementById("coupon-display");
const couponCode = document.getElementById("coupon-code");
const couponDiscount = document.getElementById("coupon-discount");
const btnResetSystem = document.getElementById("btn-reset-system");
const btnBackLogin = document.getElementById("btn-back-login");
const replenishForm = document.getElementById("replenish-form");
const replenishProductSelect = document.getElementById("replenish-product-select");
const replenishQuantity = document.getElementById("replenish-quantity");
const couponModal = document.getElementById("coupon-modal");
const btnCouponCancel = document.getElementById("btn-coupon-cancel");
const btnCouponConfirm = document.getElementById("btn-coupon-confirm");
const engineeringGrid = document.getElementById("engineering-grid-dynamic");

const sectionPdv = document.getElementById("section-pdv");
const sectionInventory = document.getElementById("section-inventory");
const sectionKds = document.getElementById("section-kds");
const sectionAnalyst = document.getElementById("section-analyst");

// Role Selection
window.selectRole = function(role) {
    const passwords = {
        balconista: "",
        gerente: "gerente123",
        admin: "admin123"
    };

    if (passwords[role]) {
        const psw = prompt(`Digite a senha para acessar como ${role} (Dica: ${passwords[role]}):`);
        if (psw !== passwords[role]) {
            alert("Senha incorreta!");
            return;
        }
    }

    currentRole = role;
    loginOverlay.style.display = "none";
    appMain.style.display = "block";
    const roleLabels = { balconista: "Balconista", gerente: "Gerente", admin: "Administrador" };
    userRoleLabel.textContent = roleLabels[role] || role;
    applyPermissions();
    init();
};

// Back to login
btnBackLogin.addEventListener("click", () => {
    appMain.style.display = "none";
    loginOverlay.style.display = "flex";
    currentRole = null;
});

function applyPermissions() {
    sectionPdv.style.display = "";
    sectionKds.style.display = "";
    sectionInventory.style.display = "";
    sectionAnalyst.style.display = "";
    btnResetSystem.style.display = "";
    btnSupplyStock.style.display = "";

    if (currentRole === "balconista") {
        // Balconista: ONLY PDV and KDS
        sectionInventory.style.display = "none";
        sectionAnalyst.style.display = "none";
        btnResetSystem.style.display = "none";
    } else if (currentRole === "gerente") {
        // Gerente: PDV, KDS, Stock, Analyst (view graphs + coupons)
        // BUT: cannot reset system, cannot supply forecast, cannot adjust prices
        btnResetSystem.style.display = "none";
        btnSupplyStock.style.display = "none";
    }
    // Admin: everything including supply forecast, price adjust, reset
}

// Toast
function showToast(msg) {
    toast.textContent = msg;
    toast.className = "toast";
    toast.classList.remove("hidden");
    setTimeout(() => toast.classList.add("hidden"), 3500);
}

// Conditional Fields
orderSource.addEventListener("change", handleSourceChange);
if (deliveryType) deliveryType.addEventListener("change", handleDeliveryTypeChange);

function handleSourceChange() {
    const source = orderSource.value;
    if (source === "App") {
        deliveryTypeGroup.classList.add("visible");
        handleDeliveryTypeChange();
    } else if (source === "Delivery") {
        deliveryTypeGroup.classList.remove("visible");
        addressGroup.classList.add("visible");
    } else {
        deliveryTypeGroup.classList.remove("visible");
        addressGroup.classList.remove("visible");
    }
}

function handleDeliveryTypeChange() {
    if (deliveryType && deliveryType.value === "entrega") {
        addressGroup.classList.add("visible");
    } else {
        addressGroup.classList.remove("visible");
    }
}

// Inventory
function renderInventory() {
    inventoryTbody.innerHTML = "";
    catalog.forEach(item => {
        let statusHtml;
        if (item.stock <= 0) statusHtml = '<span class="badge orange">Esgotado</span>';
        else if (item.stock <= 5) statusHtml = '<span class="badge orange">Baixo</span>';
        else statusHtml = '<span class="badge green">OK</span>';
        inventoryTbody.innerHTML += `<tr><td>${item.name}</td><td>R$ ${item.price.toFixed(2)}</td><td>${item.stock}</td><td>${statusHtml}</td></tr>`;
    });
}

function updateRevenue() {
    totalRevenueBadge.textContent = `R$ ${totalRevenue.toFixed(2)}`;
}

function populateSelects() {
    productSelect.innerHTML = '<option disabled selected>Escolha um produto...</option>';
    replenishProductSelect.innerHTML = '<option disabled selected>Selecione...</option>';
    catalog.forEach(p => {
        productSelect.innerHTML += `<option value="${p.id}">${p.name} - R$ ${p.price.toFixed(2)}</option>`;
        replenishProductSelect.innerHTML += `<option value="${p.id}">${p.name} (Est: ${p.stock})</option>`;
    });
}

// KDS
function renderKdsCard(order) {
    const card = document.createElement("div");
    card.className = "kds-card-item";
    card.id = `kds-order-${order.id}`;
    const sourceIcons = { WhatsApp: "fa-brands fa-whatsapp", App: "fa-solid fa-mobile-screen-button", Balcao: "fa-solid fa-store", Delivery: "fa-solid fa-motorcycle" };
    const sourceIcon = sourceIcons[order.source] || "fa-solid fa-store";
    let metaTags = `<span class="kds-tag source"><i class="${sourceIcon}"></i> ${order.source}</span>`;
    if (order.customerName && order.customerName !== "Cliente Avulso") {
        metaTags += `<span class="kds-tag client"><i class="fa-solid fa-user"></i> ${order.customerName}</span>`;
    }
    if (order.address) metaTags += `<span class="kds-tag address"><i class="fa-solid fa-location-dot"></i> ${order.address}</span>`;
    if (order.deliveryType === "retirada") metaTags += `<span class="kds-tag"><i class="fa-solid fa-hand"></i> Retirada</span>`;
    card.innerHTML = `
        <div class="kds-card-header"><span>Pedido #${order.id}</span><span>${order.time}</span></div>
        <div class="kds-body"><h4>${order.quantity}x ${order.productName}</h4><div class="kds-meta">${metaTags}</div></div>
        <button class="btn-kds-finish" onclick="completeKdsOrder(${order.id})"><i class="fa-solid fa-circle-check"></i> Concluir</button>
    `;
    kdsContainer.appendChild(card);
    updateKdsCount();
}

function updateKdsCount() {
    kdsCountBadge.textContent = `${kdsCount} pendente${kdsCount !== 1 ? 's' : ''}`;
}

window.completeKdsOrder = function(id) {
    const el = document.getElementById(`kds-order-${id}`);
    if (el) {
        el.style.opacity = "0.4";
        el.style.transform = "scale(0.95)";
        setTimeout(() => {
            el.remove();
            kdsCount = Math.max(0, kdsCount - 1);
            const order = ordersList.find(o => o.id === id);
            if (order) order.status = "completed";
            saveLocal();
            updateKdsCount();
            showToast(`Pedido #${id} finalizado na cozinha`);
        }, 250);
    }
};

// Order
function handleOrder(e) {
    e.preventDefault();
    const pid = parseInt(productSelect.value);
    const qty = parseInt(productQuantity.value);
    const source = orderSource.value;
    const client = customerName.value.trim() || "Cliente Avulso";
    const product = catalog.find(p => p.id === pid);
    if (!product) return showToast("Selecione um produto");
    if (qty > MAX_ORDER_QTY) return showToast(`Quantidade maxima por pedido: ${MAX_ORDER_QTY}`);
    if (qty < 1) return showToast("Quantidade minima: 1");
    if (product.stock < qty) return showToast(`Estoque insuficiente (${product.stock} disponiveis)`);

    let delType = null, addr = null;
    if (source === "App" && deliveryType) {
        delType = deliveryType.value;
        if (delType === "entrega" && deliveryAddress) addr = deliveryAddress.value.trim() || null;
    } else if (source === "Delivery" && deliveryAddress) {
        delType = "entrega";
        addr = deliveryAddress.value.trim() || null;
    }

    product.stock -= qty;
    totalRevenue += product.price * qty;
    product.salesCount += qty;

    const newOrder = {
        id: ordersList.length + 1, productName: product.name, quantity: qty, source,
        customerName: client, deliveryType: delType, address: addr,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), status: "cooking"
    };
    ordersList.push(newOrder);
    kdsCount++;

    renderKdsCard(newOrder);
    saveLocal();
    renderInventory();
    updateRevenue();
    populateSelects();
    updateMenuEngineering();
    pdvForm.reset();
    productQuantity.value = 1;
    deliveryTypeGroup.classList.remove("visible");
    addressGroup.classList.remove("visible");
    showToast(`Pedido #${newOrder.id} registrado - R$ ${(product.price * qty).toFixed(2)} (${client})`);
}

// Replenish
function handleReplenish(e) {
    e.preventDefault();
    const pid = parseInt(replenishProductSelect.value);
    const qty = parseInt(replenishQuantity.value);
    const product = catalog.find(p => p.id === pid);
    if (!product || qty <= 0) return showToast("Selecione produto e quantidade valida");
    if (qty > MAX_STOCK) return showToast(`Quantidade maxima: ${MAX_STOCK}`);
    const space = MAX_STOCK - product.stock;
    if (space <= 0) return showToast(`Estoque de '${product.name}' ja no limite (${MAX_STOCK})`);
    const added = Math.min(qty, space);
    product.stock += added;
    saveLocal();
    renderInventory();
    populateSelects();
    updateMenuEngineering();
    showToast(`+${added} un. de ${product.name} (Estoque: ${product.stock})`);
}

// ==========================================
// MENU ENGINEERING - FULLY DYNAMIC
// ==========================================
// Classifica cada item do catalogo em Star/Puzzle/Workhorse/Dog
// baseado na margem percentual e no volume de vendas relativo ao catalogo.
// Recalcula a cada venda, mudanca de preco, etc.
function updateMenuEngineering() {
    if (!engineeringGrid) return;

    // Calcula margem e lucro absoluto de cada item
    let sumTotalProfit = 0;
    const analysis = catalog.map(item => {
        const margin = ((item.price - item.cost) / item.price) * 100;
        const profitPerUnit = item.price - item.cost;
        const totalProfit = Math.max(0, profitPerUnit * item.salesCount);
        sumTotalProfit += totalProfit;
        return { ...item, margin, profitPerUnit, totalProfit };
    });

    // Calcula media de margem e media de vendas para classificar
    const avgMargin = analysis.reduce((s, i) => s + i.margin, 0) / analysis.length;
    const avgSales = analysis.reduce((s, i) => s + i.salesCount, 0) / analysis.length;

    // Classifica cada item
    const classified = analysis.map(item => {
        const highMargin = item.margin >= avgMargin;
        const highSales = item.salesCount >= avgSales;
        let category, categoryLabel, categoryIcon;

        if (highMargin && highSales) {
            category = "star";
            categoryLabel = "Estrela (Vende + / Lucra +)";
            categoryIcon = "fa-solid fa-star";
        } else if (highMargin && !highSales) {
            category = "puzzle";
            categoryLabel = "Quebra-Cabeca (Vende - / Lucra +)";
            categoryIcon = "fa-solid fa-puzzle-piece";
        } else if (!highMargin && highSales) {
            category = "workhorse";
            categoryLabel = "Cavalo de Batalha (Vende + / Lucra -)";
            categoryIcon = "fa-solid fa-horse";
        } else {
            category = "dog";
            categoryLabel = "Peso Morto (Vende - / Lucra -)";
            categoryIcon = "fa-solid fa-circle-xmark";
        }

        const profitShare = sumTotalProfit > 0 ? (item.totalProfit / sumTotalProfit) * 100 : 0;

        return { ...item, category, categoryLabel, categoryIcon, profitShare };
    });

    // Ordena pelo id para manter as cores na mesma ordem do grafico de pizza
    classified.sort((a, b) => a.id - b.id);

    // Render
    let html = '';
    classified.forEach(item => {
        const canAdjust = currentRole === "admin" && item.id === 2 && item.price < 53;
        html += `
            <div class="eng-box" style="border-top: 3px solid ${item.colorVar};">
                <div class="eng-title" style="color: ${item.colorVar}; opacity: 0.9;"><i class="${item.categoryIcon}" style="margin-right:4px;"></i> ${item.categoryLabel}</div>
                <div class="eng-item">${item.name} (Fatia: ${item.profitShare.toFixed(1)}% | Vendas: ${item.salesCount})</div>
                <div style="font-size:10px; color:var(--text-muted); margin-top:2px;">Lucro gerado: R$ ${item.totalProfit.toFixed(2)} (Margem: ${item.margin.toFixed(0)}%)</div>
                ${canAdjust ? '<button class="btn-action" onclick="adjustComboPrice()" style="margin-top:6px;">Ajustar Preco (+R$ 5,00)</button>' : ''}
            </div>
        `;
    });

    engineeringGrid.innerHTML = html;
    updateProfitChart();
}

window.adjustComboPrice = function() {
    const combo = catalog.find(p => p.id === 2);
    if (combo) {
        combo.price = 53.00;
        saveLocal();
        populateSelects();
        renderInventory();
        updateMenuEngineering();
        showToast("Preco do Combo Pizza ajustado para R$53,00");
    }
};

function updateProfitChart() {
    const ctx = document.getElementById('profit-pie-chart');
    if (!ctx) return;

    const labels = [];
    const data = [];
    const colors = [];
    let totalProfit = 0;

    catalog.forEach(item => {
        const itemProfit = Math.max(0, (item.price - item.cost) * item.salesCount);
        labels.push(item.name);
        data.push(parseFloat(itemProfit.toFixed(2)));
        colors.push(item.color);
        totalProfit += itemProfit;
    });

    document.getElementById('total-profit-value').textContent = `R$ ${totalProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    if (profitChartInstance) {
        profitChartInstance.destroy();
    }

    profitChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 2, borderColor: '#10131a', hoverOffset: 6 }] },
        options: {
            responsive: true, maintainAspectRatio: false,
            layout: { padding: { left: 15, right: 15, top: 5, bottom: 5 } },
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: (ctx) => {
                    let l = ctx.label || '';
                    if (l) l += ': ';
                    if (ctx.parsed !== null) l += new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ctx.parsed);
                    return l;
                }}}
            }
        }
    });
}

// Supply Forecast (Admin only)
btnSupplyStock.addEventListener("click", () => {
    if (currentRole !== "admin") return showToast("Apenas Administrador pode abastecer insumos previstos");
    const forecasts = [{ id: 1, qty: 45 }, { id: 4, qty: 30 }];
    let totalAdded = 0, summary = [];
    forecasts.forEach(f => {
        const product = catalog.find(p => p.id === f.id);
        if (product) {
            const space = MAX_STOCK - product.stock;
            const added = Math.min(f.qty, Math.max(0, space));
            if (added > 0) { product.stock += added; totalAdded += added; summary.push(`+${added} ${product.name}`); }
        }
    });
    if (totalAdded === 0) return showToast("Estoques previstos ja no limite");
    saveLocal(); renderInventory(); populateSelects(); updateMenuEngineering();
    showToast(`Insumos abastecidos: ${summary.join(", ")}`);
});

// Coupon Modal
btnCreateCoupon.addEventListener("click", () => couponModal.classList.remove("hidden"));
btnCouponCancel.addEventListener("click", () => couponModal.classList.add("hidden"));
btnCouponConfirm.addEventListener("click", () => {
    const name = document.getElementById("coupon-name-input").value.trim().toUpperCase() || "DESCONTO10";
    const disc = document.getElementById("coupon-discount-input").value || 15;
    const channel = document.getElementById("coupon-channel").value;
    couponCode.textContent = name;
    couponDiscount.textContent = `${disc}% (${channel})`;
    couponDisplay.classList.remove("hidden");
    couponModal.classList.add("hidden");
    showToast(`Cupom ${name} gerado com ${disc}% para ${channel}`);
});

// Reset (Admin only)
btnResetSystem.addEventListener("click", () => {
    if (currentRole !== "admin") return;
    localStorage.clear();
    showToast("Sistema reiniciado! Recarregando...");
    setTimeout(() => location.reload(), 1000);
});

// Events
pdvForm.addEventListener("submit", handleOrder);
replenishForm.addEventListener("submit", handleReplenish);

function init() {
    populateSelects();
    renderInventory();
    updateRevenue();
    ordersList.filter(o => o.status === "cooking").forEach(o => renderKdsCard(o));
    updateKdsCount();
    updateMenuEngineering();
}