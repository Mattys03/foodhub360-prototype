const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const MAX_STOCK = 1000;
const MAX_ORDER_QTY = 100;

let catalog = [
    { id: 1, name: "Hamburgao Gourmet", price: 32.00, stock: 20, maxStock: MAX_STOCK },
    { id: 2, name: "Combo Pizza + Refri", price: 48.00, stock: 15, maxStock: MAX_STOCK },
    { id: 3, name: "Torta de Limao", price: 15.00, stock: 8, maxStock: MAX_STOCK },
    { id: 4, name: "Bife a Milanesa", price: 28.00, stock: 10, maxStock: MAX_STOCK }
];

let ordersList = [];
let totalRevenue = 0.00;

app.get('/api/products', (req, res) => {
    res.status(200).json({ success: true, data: catalog });
});

app.post('/api/orders', (req, res) => {
    const { productId, quantity, source, customerName, deliveryType, address } = req.body;

    if (!productId || !quantity || !source) {
        return res.status(400).json({
            success: false,
            message: "Parametros invalidos. E necessario informar productId, quantity e source."
        });
    }

    if (quantity > MAX_ORDER_QTY) {
        return res.status(400).json({
            success: false,
            message: `Quantidade maxima por pedido: ${MAX_ORDER_QTY} unidades.`
        });
    }

    const product = catalog.find(p => p.id === parseInt(productId));

    if (!product) {
        return res.status(404).json({
            success: false,
            message: `Produto com ID #${productId} nao encontrado.`
        });
    }

    if (product.stock <= 0) {
        return res.status(400).json({
            success: false,
            message: `Venda bloqueada! Estoque do item '${product.name}' esta esgotado.`
        });
    }

    if (product.stock < quantity) {
        return res.status(400).json({
            success: false,
            message: `Venda bloqueada! Apenas ${product.stock} unidades disponiveis em estoque.`
        });
    }

    const orderCost = product.price * quantity;
    product.stock -= quantity;
    totalRevenue += orderCost;

    const newOrder = {
        id: ordersList.length + 1,
        productName: product.name,
        quantity: quantity,
        source: source,
        customerName: customerName || "Cliente Avulso",
        deliveryType: deliveryType || null,
        address: address || null,
        cost: orderCost,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: "cooking"
    };
    ordersList.push(newOrder);

    res.status(201).json({
        success: true,
        message: "Pedido processado com sucesso!",
        data: newOrder,
        currentRevenue: totalRevenue
    });
});

app.put('/api/products/replenish', (req, res) => {
    const { productId, quantity } = req.body;

    if (!productId || !quantity || quantity <= 0) {
        return res.status(400).json({
            success: false,
            message: "Informe productId e quantity validos."
        });
    }

    if (quantity > MAX_STOCK) {
        return res.status(400).json({
            success: false,
            message: `Quantidade maxima de reabastecimento: ${MAX_STOCK} unidades.`
        });
    }

    const product = catalog.find(p => p.id === parseInt(productId));

    if (!product) {
        return res.status(404).json({
            success: false,
            message: "Produto nao encontrado."
        });
    }

    const spaceAvailable = MAX_STOCK - product.stock;
    if (spaceAvailable <= 0) {
        return res.status(400).json({
            success: false,
            message: `Estoque de '${product.name}' ja esta no limite maximo (${MAX_STOCK}).`
        });
    }

    const added = Math.min(quantity, spaceAvailable);
    product.stock += added;

    res.status(200).json({
        success: true,
        message: `+${added} unidades de '${product.name}' adicionadas ao estoque.`,
        data: catalog
    });
});

app.put('/api/products/supply-forecast', (req, res) => {
    const forecasts = [
        { id: 1, qty: 45 },
        { id: 4, qty: 30 }
    ];

    let results = [];
    forecasts.forEach(f => {
        const product = catalog.find(p => p.id === f.id);
        if (product) {
            const space = MAX_STOCK - product.stock;
            const added = Math.min(f.qty, space);
            product.stock += added;
            results.push({ name: product.name, added, newStock: product.stock });
        }
    });

    res.status(200).json({
        success: true,
        message: "Insumos previstos abastecidos com sucesso!",
        data: catalog,
        details: results
    });
});

app.put('/api/products/:id/price', (req, res) => {
    const productId = parseInt(req.params.id);
    const { newPrice } = req.body;

    if (!newPrice || isNaN(newPrice) || newPrice <= 0) {
        return res.status(400).json({ success: false, message: "Preco invalido para reajuste." });
    }

    const product = catalog.find(p => p.id === productId);
    if (!product) {
        return res.status(404).json({ success: false, message: "Produto nao encontrado." });
    }

    product.price = parseFloat(newPrice);

    res.status(200).json({ success: true, message: "Preco atualizado com sucesso!", data: product });
});

app.get('/api/dashboard', (req, res) => {
    const kdsPending = ordersList.filter(o => o.status === "cooking").length;
    res.status(200).json({
        success: true,
        data: {
            totalRevenue: totalRevenue,
            ordersCount: ordersList.length,
            kdsPendingCount: kdsPending
        }
    });
});

app.listen(PORT, () => {
    console.log(`\n========================================================`);
    console.log(`FoodHub 360 API Server rodando em: http://localhost:${PORT}`);
    console.log(`========================================================\n`);
});
