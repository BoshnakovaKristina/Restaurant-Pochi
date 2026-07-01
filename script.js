const header = document.querySelector('.site-header');
const menuToggle = document.querySelector('#menuToggle');
const nav = document.querySelector('#nav');
const toast = document.querySelector('#toast');
const ORDER_KEY = 'pochi_demo_order';
const DELIVERY_PRICE = 3;

function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3200);
}

function getOrder() {
    try {
        return JSON.parse(localStorage.getItem(ORDER_KEY)) || [];
    } catch (error) {
        return [];
    }
}

function saveOrder(order) {
    localStorage.setItem(ORDER_KEY, JSON.stringify(order));
    updateOrderBadges();
}

function getOrderCount() {
    return getOrder().reduce((sum, item) => sum + item.qty, 0);
}

function formatPrice(value) {
    return `${Number(value || 0).toFixed(2)} euro`;
}

function updateOrderBadges() {
    const count = getOrderCount();
    document.querySelectorAll('[data-order-count]').forEach((badge) => {
        badge.textContent = count > 0 ? count : '';
        badge.classList.toggle('show', count > 0);
        badge.setAttribute('aria-hidden', count > 0 ? 'false' : 'true');
    });
}

window.addEventListener('scroll', () => {
    if (!header) return;
    if (window.scrollY > 24) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});

if (menuToggle && nav) {
    const setMobileMenuState = (isOpen) => {
        nav.classList.toggle('open', isOpen);
        menuToggle.classList.toggle('open', isOpen);
        document.body.classList.toggle('nav-open', isOpen);
        menuToggle.setAttribute('aria-label', isOpen ? 'Затвори меню' : 'Отвори меню');
        menuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    };

    menuToggle.setAttribute('aria-expanded', 'false');

    menuToggle.addEventListener('click', () => {
        setMobileMenuState(!nav.classList.contains('open'));
    });

    nav.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => {
            setMobileMenuState(false);
        });
    });
}

document.querySelectorAll('[data-filter]').forEach((button) => {
    button.addEventListener('click', () => {
        const filter = button.dataset.filter;
        const group = button.closest('[data-filter-group]');
        if (!group) return;
        const itemSelector = group.dataset.filterGroup === 'gallery' ? '.gallery-item' : '.menu-item';

        group.querySelectorAll('[data-filter]').forEach((item) => item.classList.remove('active'));
        button.classList.add('active');

        document.querySelectorAll(itemSelector).forEach((item) => {
            const match = filter === 'all' || item.dataset.category === filter;
            item.classList.toggle('hide', !match);
        });
    });
});

document.querySelectorAll('.add-to-order').forEach((button) => {
    button.addEventListener('click', () => {
        const card = button.closest('.menu-item, .special-card');
        if (!card) return;
        const item = {
            id: (card.dataset.name || '').toLowerCase().replace(/\s+/g, '-'),
            name: card.dataset.name,
            price: Number(card.dataset.price || 0),
            image: card.dataset.image,
            qty: 1,
        };
        const order = getOrder();
        const existing = order.find((entry) => entry.id === item.id);
        if (existing) {
            existing.qty += 1;
        } else {
            order.push(item);
        }
        saveOrder(order);
        renderOrderPage();
        showToast(`${item.name} е добавено към вашите поръчки.`);
    });
});

function changeQuantity(id, delta) {
    const order = getOrder();
    const item = order.find((entry) => entry.id === id);
    if (!item) return;
    item.qty += delta;
    const nextOrder = order.filter((entry) => entry.qty > 0);
    saveOrder(nextOrder);
    renderOrderPage();
}

function removeItem(id) {
    saveOrder(getOrder().filter((entry) => entry.id !== id));
    renderOrderPage();
}

function renderOrderPage() {
    const list = document.querySelector('#orderItems');
    const empty = document.querySelector('#emptyOrder');
    const summary = document.querySelector('#orderSummary');
    const checkout = document.querySelector('#checkoutForm');
    if (!list) return;

    const order = getOrder();
    const hasItems = order.length > 0;
    list.innerHTML = '';
    empty?.classList.toggle('show', !hasItems);
    if (summary) summary.style.display = hasItems ? 'grid' : 'none';
    if (checkout) checkout.style.display = hasItems ? 'block' : 'none';

    order.forEach((item) => {
        const row = document.createElement('div');
        row.className = 'order-row';
        row.innerHTML = `
            <img src="${item.image}" alt="${item.name}">
            <div>
                <h3>${item.name}</h3>
                <p>${formatPrice(item.price)} / бр.</p>
                <div class="quantity-controls">
                    <button class="qty-btn" type="button" aria-label="Намали количество">−</button>
                    <strong>${item.qty}</strong>
                    <button class="qty-btn" type="button" aria-label="Увеличи количество">+</button>
                    <button class="remove-item" type="button">Премахни</button>
                </div>
            </div>
            <div class="order-line-total">${formatPrice(item.price * item.qty)}</div>
        `;
        const [minus, plus] = row.querySelectorAll('.qty-btn');
        const remove = row.querySelector('.remove-item');
        minus.addEventListener('click', () => changeQuantity(item.id, -1));
        plus.addEventListener('click', () => changeQuantity(item.id, 1));
        remove.addEventListener('click', () => removeItem(item.id));
        list.appendChild(row);
    });

    const subtotal = order.reduce((sum, item) => sum + item.price * item.qty, 0);
    const delivery = hasItems ? DELIVERY_PRICE : 0;
    document.querySelector('[data-subtotal]')?.replaceChildren(document.createTextNode(formatPrice(subtotal)));
    document.querySelector('[data-delivery]')?.replaceChildren(document.createTextNode(formatPrice(delivery)));
    document.querySelector('[data-total]')?.replaceChildren(document.createTextNode(formatPrice(subtotal + delivery)));
}

document.querySelector('.clear-order')?.addEventListener('click', () => {
    saveOrder([]);
    renderOrderPage();
    showToast('Поръчката е изчистена.');
});

const checkoutForm = document.querySelector('#checkoutForm');
if (checkoutForm) {
    checkoutForm.addEventListener('submit', (event) => {
        event.preventDefault();
        if (getOrder().length === 0) {
            showToast('Добавете поне едно ястие, преди да завършите поръчката.');
            return;
        }
        checkoutForm.reset();
        saveOrder([]);
        renderOrderPage();
        showToast('Демо поръчката е завършена успешно. Данните не се изпращат към сървър.');
    });
}

document.querySelectorAll('form:not(#checkoutForm)').forEach((form) => {
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        form.reset();
        showToast('Благодарим! Заявката е изпратена успешно.');
    });
});

updateOrderBadges();
renderOrderPage();


function initScrollAnimations() {
    const animatedSelectors = [
        ".hero-content",
        ".page-hero .container",
        ".section-kicker",
        "h1",
        "h2",
        ".lead",
        ".special-card",
        ".menu-item",
        ".gallery-item",
        ".story-card",
        ".about-copy",
        ".about-image",
        ".about-panel",
        ".reservation-wrap",
        ".notice-card",
        ".contact-card",
        ".contact-form",
        ".map-card",
        ".direction-copy",
        ".direction-photo",
        ".cta-band .container",
        ".footer-grid > div"
    ];

    const elements = document.querySelectorAll(animatedSelectors.join(","));

    elements.forEach((element, index) => {
        element.classList.add("animate-on-scroll");

        if (element.matches(".about-image, .direction-photo, .gallery-item:nth-child(even)")) {
            element.classList.add("animate-from-right");
        } else if (element.matches(".about-copy, .direction-copy, .gallery-item:nth-child(odd)")) {
            element.classList.add("animate-from-left");
        } else if (element.matches("h1, .page-hero .container")) {
            element.classList.add("animate-from-top");
        } else {
            element.classList.add("animate-from-bottom");
        }

        element.style.transitionDelay = `${Math.min(index * 35, 350)}ms`;
    });

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("is-visible");
                    observer.unobserve(entry.target);
                }
            });
        },
        {
            threshold: 0.15,
            rootMargin: "0px 0px -60px 0px"
        }
    );

    elements.forEach((element) => observer.observe(element));
}

document.addEventListener("DOMContentLoaded", initScrollAnimations);