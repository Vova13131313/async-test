const cartIdInput = document.getElementById('cart-id-input');
const loadCartBtn = document.getElementById('load-cart-btn');
const statusDiv = document.getElementById('status');
const cartDataContainer = document.querySelector('.cart-data-container');
const errorContainer = document.querySelector('.error-container');
const testFailCheckbox = document.getElementById('test-fail-checkbox');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function requestWithRetry(url, maxRetries = 2, isTestMode = false) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            statusDiv.textContent = `Завандаження кошика... Спроба ${attempt} із ${maxRetries}`

            if (isTestMode && attempt === 1) {
                throw new Error(`Симуляція збою`);
            }

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP помилка, статус: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            lastError = error;

            if (attempt < maxRetries) {
                statusDiv.textContent = `Спроба ${attempt} із ${maxRetries} невдала (${error.message})`;
                await sleep(800);
            }
        }
    }

    throw lastError;
}

async function loadCart(cartId) {
    cartDataContainer.innerHTML = '';
    errorContainer.textContent = '';

    if (!cartId) {
        statusDiv.textContent = 'Стан запиту: помилка валідації';
        errorContainer.textContent = 'Введіть ID кошика';
        return;
    }

    statusDiv.textContent = 'Стан запиту: завантаження...';
    loadCartBtn.disabled = true;
    cartIdInput.disabled = true;
    testFailCheckbox.disabled = true;
    loadCartBtn.textContent = 'Завантаження...';

    const url = `https://dummyjson.com/carts/${cartId}?delay=1500`;
    const isTestMode = testFailCheckbox.checked;

    try {
        const data = await requestWithRetry(url, 2, isTestMode);
        statusDiv.textContent = 'Стан запиту: успішно завантажено';
        renderCart(data);
    } catch (error) {
        statusDiv.textContent = 'Стан запиту: усі спроби вичерпано';
        errorContainer.textContent = `Помилка: ${error.message}`;
    } finally {
        loadCartBtn.disabled = false;
        cartIdInput.disabled = false;
        testFailCheckbox.disabled = false;
        loadCartBtn.textContent = 'Завантажити кошик';
    }
}

function renderCart(cart) {
    const productsHtml = cart.products.map(product => `
        <li>
            <strong>${product.title}</strong><br>
            Ціна: $${product.price.toFixed(2)} | 
            Кількість: ${product.quantity} шт. | 
            Вартість: <strong>$${product.total.toFixed(2)}</strong>
        </li>
    `).join('');

    cartDataContainer.innerHTML = `
        <h2>Кошик #${cart.id}</h2>
        <ul>
            ${productsHtml}
        </ul>
        <hr>
        <p><strong>Загальна сума кошика: $${cart.total.toFixed(2)}</strong></p>
    `;
}

loadCartBtn.addEventListener('click', () => {
    const id = cartIdInput.value.trim();
    loadCart(id);
});