document.addEventListener('DOMContentLoaded', () => {
  // Application State
  const state = {
    username: null,
    uuid: null,
    balance: 0,
    online: false,
    rank: 'MEMBER',
    catalog: {},
    code: null
  };

  // Cart State
  const cart = {};

  // DOM Elements
  const els = {
    // Connect widget elements
    connectUsernameInput: document.getElementById('connect-username-input'),
    btnConnectPlayer: document.getElementById('btn-connect-player'),
    connectForm: document.getElementById('connect-form'),
    profileDisplay: document.getElementById('profile-display'),
    playerAvatar: document.getElementById('player-avatar'),
    playerUsername: document.getElementById('player-username'),
    playerStatus: document.getElementById('player-status'),
    playerRank: document.getElementById('player-rank'),
    playerBalance: document.getElementById('player-balance'),
    disconnectBtn: document.getElementById('disconnect-btn'),
    itemsGrid: document.getElementById('items-grid'),
    
    // Search & Filter Elements
    searchInput: document.getElementById('search-input'),

    // Modal Elements
    modalOverlay: document.getElementById('modal-overlay'),
    receiptItemName: document.getElementById('receipt-item-name'),
    receiptItemPrice: document.getElementById('receipt-item-price'),
    receiptNewBalance: document.getElementById('receipt-new-balance'),
    modalCloseBtn: document.getElementById('modal-close-btn'),
    
    // Verification Modal
    verifyModalOverlay: document.getElementById('verify-modal-overlay'),
    verifyCommandText: document.getElementById('verify-command-text'),
    copyCommandBtn: document.getElementById('copy-command-btn'),
    verifyCancelBtn: document.getElementById('verify-cancel-btn'),

    // Toast Notification
    errorToast: document.getElementById('error-toast'),
    toastMessage: document.getElementById('toast-message'),

    // Cart Elements
    cartToggleBtn: document.getElementById('cart-toggle-btn'),
    cartCount: document.getElementById('cart-count'),
    cartSidebar: document.getElementById('cart-sidebar'),
    cartSidebarOverlay: document.getElementById('cart-sidebar-overlay'),
    cartCloseBtn: document.getElementById('cart-close-btn'),
    cartItemsContainer: document.getElementById('cart-items-container'),
    cartTotalValue: document.getElementById('cart-total-value'),
    giftCheckbox: document.getElementById('gift-checkbox'),
    giftRecipientField: document.getElementById('gift-recipient-field'),
    giftRecipientInput: document.getElementById('gift-recipient-input'),
    checkoutBtn: document.getElementById('checkout-btn'),

    // Report Modal
    btnShowReport: document.getElementById('btn-show-report'),
    reportModalOverlay: document.getElementById('report-modal-overlay'),
    reportModalCloseBtn: document.getElementById('report-modal-close-btn'),
    
    // Connect Error
    connectError: document.getElementById('connect-error')
  };

  // Initialize features
  initParticleBg();
  initCatalog();
  initFAQ();
  initLeaderboards();
  initSearchFilters();
  restoreSession();

  // Event Listeners
  els.btnConnectPlayer.addEventListener('click', handleConnect);
  els.copyCommandBtn.addEventListener('click', () => {
    if (state.code) {
      navigator.clipboard.writeText(`/storeauth ${state.code}`);
      els.copyCommandBtn.innerText = 'Copied!';
      setTimeout(() => {
        els.copyCommandBtn.innerText = 'Copy';
      }, 2000);
    }
  });
  els.verifyCancelBtn.addEventListener('click', cancelConnection);
  els.disconnectBtn.addEventListener('click', handleDisconnect);
  els.modalCloseBtn.addEventListener('click', () => {
    els.modalOverlay.classList.add('hide');
  });
  els.btnShowReport.addEventListener('click', () => {
    els.reportModalOverlay.classList.remove('hide');
  });
  els.reportModalCloseBtn.addEventListener('click', () => {
    els.reportModalOverlay.classList.add('hide');
  });

  // Cart Event Listeners
  els.cartToggleBtn.addEventListener('click', toggleCart);
  els.cartCloseBtn.addEventListener('click', closeCart);
  els.cartSidebarOverlay.addEventListener('click', closeCart);
  els.giftCheckbox.addEventListener('change', (e) => {
    if (e.target.checked) {
      els.giftRecipientField.classList.remove('hide');
    } else {
      els.giftRecipientField.classList.add('hide');
    }
  });
  els.checkoutBtn.addEventListener('click', handleCheckout);

  // Animated Particle Background Canvas
  function initParticleBg() {
    const canvas = document.getElementById('bg-particles');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let particles = [];
    const particleCount = 85;
    
    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();
    
    class Particle {
      constructor() {
        this.reset();
      }
      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height + canvas.height;
        this.size = Math.random() * 2 + 1;
        this.speedY = -(Math.random() * 0.5 + 0.2);
        this.speedX = Math.random() * 0.4 - 0.2;
        this.opacity = Math.random() * 0.5 + 0.15;
        this.angle = Math.random() * Math.PI * 2;
        this.angleSpeed = Math.random() * 0.02 + 0.005;
      }
      update() {
        this.y += this.speedY;
        this.angle += this.angleSpeed;
        this.x += this.speedX + Math.sin(this.angle) * 0.15;
        if (this.y < -20 || this.x < -20 || this.x > canvas.width + 20) {
          this.reset();
        }
      }
      draw() {
        // Outer glowing aura (cheap layout-friendly gradient-free method)
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 2.6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 45, 85, ${this.opacity * 0.28})`;
        ctx.fill();
        
        // Inner glowing core
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 45, 85, ${this.opacity * 0.95})`;
        ctx.fill();
      }
    }
    
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
      particles[i].y = Math.random() * canvas.height;
    }
    
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.update();
        p.draw();
      });
      requestAnimationFrame(animate);
    }
    animate();
  }

  // FAQ Accordion Initialization
  function initFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
      const header = item.querySelector('.faq-header');
      header.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        faqItems.forEach(i => i.classList.remove('active'));
        if (!isActive) {
          item.classList.add('active');
        }
      });
    });
  }

  // Leaderboards Section Initialization
  function initLeaderboards() {
    const tabs = document.querySelectorAll('.leaderboard-tab-btn');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        const activeTab = tab.getAttribute('data-tab');
        const panels = document.querySelectorAll('.leaderboard-panel');
        panels.forEach(panel => {
          panel.classList.remove('active');
          if (panel.id === `panel-${activeTab}`) {
            panel.classList.add('active');
          }
        });
      });
    });
    
    fetchLeaderboards();
  }

  async function fetchLeaderboards() {
    try {
      const res = await fetch('/api/leaderboard');
      if (!res.ok) throw new Error('Failed to load leaderboard');
      const data = await res.json();
      
      renderLeaderboardTable('balance', data.balance || [], '$');
      renderLeaderboardTable('kills', data.kills || [], '');
      renderLeaderboardTable('playtime', data.playtime || [], '');
    } catch (err) {
      console.error(err);
      ['balance', 'kills', 'playtime'].forEach(type => {
        const body = document.getElementById(`leaderboard-${type}-body`);
        if (body) {
          body.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--apple-red); padding: 2rem 0;">Stats temporary unavailable.</td></tr>`;
        }
      });
    }
  }

  function renderLeaderboardTable(type, list, unit) {
    const body = document.getElementById(`leaderboard-${type}-body`);
    if (!body) return;
    body.innerHTML = '';
    
    if (list.length === 0) {
      body.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--text-sub); padding: 2rem 0;">No stats available.</td></tr>`;
      return;
    }
    
    list.slice(0, 10).forEach((entry, idx) => {
      const rank = idx + 1;
      const row = document.createElement('tr');
      
      let valFormatted = entry.value;
      if (unit === '$') {
        const num = parseFloat(entry.value.replace(/,/g, ''));
        if (!isNaN(num)) {
          valFormatted = formatMoney(num);
        } else {
          valFormatted = '$' + entry.value;
        }
      }
      
      row.innerHTML = `
        <td class="leaderboard-rank rank-${rank}">${rank}</td>
        <td>
          <div class="leaderboard-player">
            <img class="leaderboard-avatar" src="https://mc-heads.net/avatar/${entry.name}" alt="${entry.name}">
            <span>${entry.name}</span>
          </div>
        </td>
        <td class="leaderboard-value">${valFormatted}</td>
      `;
      body.appendChild(row);
    });
  }

  // Search & Filters Configuration
  let activeCategory = 'all';
  let searchQuery = '';

  function initSearchFilters() {
    els.searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      renderCatalog();
    });

    const pills = document.querySelectorAll('.filter-pill');
    pills.forEach(pill => {
      pill.addEventListener('click', () => {
        pills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        activeCategory = pill.getAttribute('data-category');
        renderCatalog();
      });
    });
  }

  // Fetch and render the store items catalog
  async function initCatalog() {
    try {
      const res = await fetch('/api/catalog');
      if (!res.ok) throw new Error('Failed to load catalog');
      state.catalog = await res.json();
      renderCatalog();
    } catch (err) {
      console.error(err);
      els.itemsGrid.innerHTML = `<div class="loading-spinner">Failed to load items catalog. Please reload the page.</div>`;
    }
  }

  // Session recovery and initialization
  async function restoreSession() {
    const savedUser = localStorage.getItem('ocean_smp_username');
    if (savedUser) {
      try {
        const res = await fetch(`/api/player-check?username=${encodeURIComponent(savedUser)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.verified === true) {
            completeSignIn(data.player);
          }
        }
      } catch (err) {
        console.error('Session restore failed:', err);
      }
    }
  }

  // Handle Connect Click
  async function handleConnect() {
    const username = els.connectUsernameInput.value.trim();
    if (!username) {
      showToast('Please enter your Minecraft username!');
      return;
    }

    els.btnConnectPlayer.disabled = true;
    els.btnConnectPlayer.innerText = 'Connecting...';
    els.connectError.classList.add('hide');

    try {
      const res = await fetch(`/api/player-check?username=${encodeURIComponent(username)}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Connection failed');
      }

      if (data.verified) {
        completeSignIn(data.player);
      } else {
        state.code = data.code;
        els.verifyCommandText.innerText = `/storeauth ${data.code}`;
        els.verifyModalOverlay.classList.remove('hide');
        startConnectionPolling(username);
      }
    } catch (err) {
      console.error(err);
      els.connectError.innerText = err.message;
      els.connectError.classList.remove('hide');
    } finally {
      els.btnConnectPlayer.disabled = false;
      els.btnConnectPlayer.innerText = 'Connect Account';
    }
  }

  let connectionPollingInterval = null;

  function startConnectionPolling(username) {
    if (connectionPollingInterval) clearInterval(connectionPollingInterval);
    
    connectionPollingInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/player-check?username=${encodeURIComponent(username)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.verified && data.player) {
            clearInterval(connectionPollingInterval);
            connectionPollingInterval = null;
            els.verifyModalOverlay.classList.add('hide');
            completeSignIn(data.player);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }, 3000);
  }

  function stopConnectionPolling() {
    if (connectionPollingInterval) {
      clearInterval(connectionPollingInterval);
      connectionPollingInterval = null;
    }
  }

  function cancelConnection() {
    stopConnectionPolling();
    els.verifyModalOverlay.classList.add('hide');
  }

  function completeSignIn(player) {
    state.username = player.username;
    state.uuid = player.uuid;
    state.balance = player.balance;
    state.online = player.online;
    state.rank = player.rank;

    localStorage.setItem('ocean_smp_username', player.username);

    els.playerUsername.innerText = player.username;
    els.playerAvatar.src = `https://crafatar.com/renders/head/${player.uuid}?overlay=true`;
    
    els.playerStatus.innerText = player.online ? 'Online' : 'Offline';
    if (player.online) {
      els.playerStatus.classList.remove('offline');
    } else {
      els.playerStatus.classList.add('offline');
    }

    els.playerRank.innerText = player.rank.toUpperCase();
    els.playerBalance.innerText = formatMoney(player.balance);

    els.connectForm.classList.add('hide');
    els.profileDisplay.classList.remove('hide');

    document.querySelectorAll('.buy-btn').forEach(btn => {
      btn.disabled = false;
    });

    renderCatalog();
    renderCart();
  }

  // Handle Disconnect
  async function handleDisconnect() {
    const prevUser = state.username;

    state.username = null;
    state.uuid = null;
    state.balance = 0;
    state.online = false;
    state.rank = 'MEMBER';

    localStorage.removeItem('ocean_smp_username');

    els.profileDisplay.classList.add('hide');
    els.connectForm.classList.remove('hide');
    els.connectUsernameInput.value = '';

    document.querySelectorAll('.buy-btn').forEach(btn => {
      btn.disabled = true;
    });

    // Clear cart on disconnect
    Object.keys(cart).forEach(k => delete cart[k]);
    updateCartBadge();

    renderCatalog();
    renderCart();
    closeCart();

    if (prevUser) {
      try {
        await fetch('/api/disconnect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: prevUser })
        });
      } catch (err) {
        console.error('Error disconnecting session:', err);
      }
    }
  }

  // Local-only fast loading Minecraft item icons
  const ITEM_ICONS = {
    'void_totem': '/images/void_totem.png',
    'netherite_ingot': '/images/netherite_ingot.png',
    'elytra': '/images/elytra.png',
    'healing_potion': '/images/healing_potion.png',
    'haste_potion': '/images/potion.png',
    'strength_potion': '/images/potion.png',
    'piglin_head': '/images/piglin_head.png',
    'dragon_head': '/images/dragon_head.png'
  };

  const ITEM_FILTERS = {
    'haste_potion': 'hue-rotate(50deg) saturate(3.5)',
    'strength_potion': 'hue-rotate(320deg) saturate(3)'
  };

  // Render Items Grid with search queries and category pills
  function renderCatalog() {
    els.itemsGrid.innerHTML = '';
    
    // Category mapping for catalog items
    const categories = {
      'void_totem': 'misc',
      'netherite_ingot': 'misc',
      'elytra': 'misc',
      'healing_potion': 'potions',
      'haste_potion': 'potions',
      'strength_potion': 'potions',
      'piglin_head': 'heads',
      'dragon_head': 'heads'
    };

    let count = 0;
    Object.entries(state.catalog).forEach(([id, item]) => {
      const category = categories[id] || 'misc';
      
      // Filter by category active pill
      if (activeCategory !== 'all' && category !== activeCategory) return;
      
      // Filter by search query text
      if (searchQuery) {
        const nameMatch = item.name.toLowerCase().includes(searchQuery);
        const descMatch = item.description.toLowerCase().includes(searchQuery);
        if (!nameMatch && !descMatch) return;
      }

      count++;
      const card = document.createElement('div');
      card.className = 'item-card';
      
      const iconUrl = ITEM_ICONS[id] || ITEM_ICONS['void_totem'];
      const filterStyle = ITEM_FILTERS[id] ? `style="filter: ${ITEM_FILTERS[id]}"` : '';
      const isButtonDisabled = !state.username;

      card.innerHTML = `
        <div class="card-top">
          <div class="icon-container">
            <img class="item-icon-img" src="${iconUrl}" alt="${item.name}" ${filterStyle}>
          </div>
          <h3>${item.name}</h3>
          <p class="item-desc">${item.description}</p>
        </div>
        <div class="card-bottom">
          <div class="price-tag">
            <span class="price-label">Price</span>
            <span class="price-value">${formatMoney(item.price)}</span>
          </div>
          <button class="buy-btn" data-id="${id}" ${isButtonDisabled ? 'disabled' : ''}>
            Add to Cart
          </button>
        </div>
      `;

      card.querySelector('.buy-btn').addEventListener('click', () => addToCart(id));
      els.itemsGrid.appendChild(card);
    });

    if (count === 0) {
      els.itemsGrid.innerHTML = `<div class="loading-spinner">No items match your active filters or query.</div>`;
    }
  }

  // Cart Operations
  function updateCartBadge() {
    const totalQty = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
    els.cartCount.innerText = totalQty;
    if (totalQty > 0) {
      els.cartCount.classList.remove('hide');
    } else {
      els.cartCount.classList.add('hide');
    }
  }

  function addToCart(itemId) {
    if (!state.username) {
      showToast('You must connect your account first!');
      return;
    }
    if (cart[itemId]) {
      cart[itemId]++;
    } else {
      cart[itemId] = 1;
    }
    updateCartBadge();
    renderCart();
    openCart();
  }

  function removeFromCart(itemId) {
    delete cart[itemId];
    updateCartBadge();
    renderCart();
  }

  function updateQuantity(itemId, change) {
    if (!cart[itemId]) return;
    cart[itemId] += change;
    if (cart[itemId] <= 0) {
      delete cart[itemId];
    }
    updateCartBadge();
    renderCart();
  }

  function toggleCart() {
    if (els.cartSidebar.classList.contains('hide')) {
      openCart();
    } else {
      closeCart();
    }
  }

  function openCart() {
    els.cartSidebar.classList.remove('hide');
    els.cartSidebarOverlay.classList.remove('hide');
  }

  function closeCart() {
    els.cartSidebar.classList.add('hide');
    els.cartSidebarOverlay.classList.add('hide');
  }

  function renderCart() {
    const container = els.cartItemsContainer;
    container.innerHTML = '';
    
    const itemIds = Object.keys(cart);
    
    if (itemIds.length === 0) {
      container.innerHTML = '<div class="empty-cart-msg">Your cart is empty.</div>';
      els.cartTotalValue.innerText = formatMoney(0);
      els.checkoutBtn.disabled = true;
      els.checkoutBtn.innerText = 'Cart is Empty';
      return;
    }

    let total = 0;
    itemIds.forEach(id => {
      const item = state.catalog[id];
      if (!item) return;
      const qty = cart[id];
      const cost = item.price * qty;
      total += cost;

      const row = document.createElement('div');
      row.className = 'cart-item-row';
      
      const iconUrl = ITEM_ICONS[id] || ITEM_ICONS['void_totem'];
      const filterStyle = ITEM_FILTERS[id] ? `style="filter: ${ITEM_FILTERS[id]}"` : '';

      row.innerHTML = `
        <div class="cart-item-info">
          <div class="cart-item-icon-container">
            <img src="${iconUrl}" alt="${item.name}" ${filterStyle}>
          </div>
          <div class="cart-item-details">
            <h4>${item.name}</h4>
            <span class="item-unit-price">${formatMoney(item.price)} each</span>
          </div>
        </div>
        <div class="cart-item-actions">
          <div class="qty-control">
            <button class="qty-btn dec-btn" data-id="${id}">-</button>
            <span class="qty-val">${qty}</span>
            <button class="qty-btn inc-btn" data-id="${id}">+</button>
          </div>
          <button class="remove-item-btn" data-id="${id}" title="Remove" style="background: none; border: none; color: var(--text-sub); font-size: 1.5rem; cursor: pointer; padding: 0 4px; line-height: 1; transition: var(--transition-apple);">&times;</button>
        </div>
      `;

      row.querySelector('.dec-btn').onclick = () => updateQuantity(id, -1);
      row.querySelector('.inc-btn').onclick = () => updateQuantity(id, 1);
      row.querySelector('.remove-item-btn').onclick = () => removeFromCart(id);

      container.appendChild(row);
    });

    els.cartTotalValue.innerText = formatMoney(total);
    
    if (!state.username) {
      els.checkoutBtn.disabled = true;
      els.checkoutBtn.innerText = 'Connect to Checkout';
    } else if (state.balance < total) {
      els.checkoutBtn.disabled = true;
      els.checkoutBtn.innerText = 'Insufficient Balance';
    } else {
      els.checkoutBtn.disabled = false;
      els.checkoutBtn.innerText = 'Checkout & Unlock';
    }
  }

  async function handleCheckout() {
    if (!state.username) {
      showToast('You must connect your account first!');
      return;
    }

    const items = Object.entries(cart).map(([id, qty]) => ({ id, quantity: qty }));
    if (items.length === 0) return;

    const isGift = els.giftCheckbox.checked;
    const recipient = isGift ? els.giftRecipientInput.value.trim() : state.username;

    if (isGift && !recipient) {
      showToast("Please enter the recipient's Minecraft username!");
      return;
    }

    els.checkoutBtn.disabled = true;
    els.checkoutBtn.innerText = 'Processing...';

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: state.username,
          recipient,
          items
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Checkout failed');
      }

      state.balance = data.newBalance;
      els.playerBalance.innerText = formatMoney(state.balance);

      const itemsSummaryText = isGift ? `Gifts to ${recipient}` : `${items.map(i => `${i.quantity}x ${state.catalog[i.id].name}`).join(', ')}`;
      const totalChargeText = els.cartTotalValue.innerText;

      // Clear Cart
      Object.keys(cart).forEach(k => delete cart[k]);
      updateCartBadge();
      renderCart();
      closeCart();

      // Show receipt modal
      els.receiptItemName.innerText = itemsSummaryText;
      els.receiptItemPrice.innerText = totalChargeText;
      els.receiptNewBalance.innerText = formatMoney(data.newBalance);
      els.modalOverlay.classList.remove('hide');

    } catch (err) {
      console.error(err);
      showToast(err.message || 'Transaction failed. Please try again.');
    } finally {
      els.checkoutBtn.disabled = false;
      renderCart();
    }
  }

  // Toast Helper
  let toastTimeout = null;
  function showToast(message) {
    els.toastMessage.innerText = message;
    els.errorToast.classList.remove('hide');

    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      els.errorToast.classList.add('hide');
    }, 5000);
  }

  // Formatter Helper
  function formatMoney(amount) {
    return '$' + amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }
});
