document.addEventListener('DOMContentLoaded', () => {
  // Application State
  // Application State
  const state = {
    username: null,
    uuid: null,
    balance: 0,
    online: false,
    rank: 'MEMBER',
    catalog: {}
  };

  // Cart State
  const cart = {};

  // DOM Elements
  const els = {
    usernameInput: document.getElementById('username-input'),
    connectBtn: document.getElementById('connect-btn'),
    connectError: document.getElementById('connect-error'),
    connectForm: document.getElementById('connect-form'),
    profileDisplay: document.getElementById('profile-display'),
    playerAvatar: document.getElementById('player-avatar'),
    playerUsername: document.getElementById('player-username'),
    playerStatus: document.getElementById('player-status'),
    playerRank: document.getElementById('player-rank'),
    playerBalance: document.getElementById('player-balance'),
    disconnectBtn: document.getElementById('disconnect-btn'),
    itemsGrid: document.getElementById('items-grid'),
    
    // Modal Elements
    modalOverlay: document.getElementById('modal-overlay'),
    receiptItemName: document.getElementById('receipt-item-name'),
    receiptItemPrice: document.getElementById('receipt-item-price'),
    receiptNewBalance: document.getElementById('receipt-new-balance'),
    modalCloseBtn: document.getElementById('modal-close-btn'),
    
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
    checkoutBtn: document.getElementById('checkout-btn')
  };

  // Initialize
  initCatalog();
  restoreSession();

  // Event Listeners
  els.connectBtn.addEventListener('click', handleConnect);
  els.usernameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleConnect();
  });
  els.disconnectBtn.addEventListener('click', handleDisconnect);
  els.modalCloseBtn.addEventListener('click', () => {
    els.modalOverlay.classList.add('hide');
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

  // Restore player session from localStorage if present
  function restoreSession() {
    const savedUser = localStorage.getItem('ocean_smp_username');
    if (savedUser) {
      els.usernameInput.value = savedUser;
      handleConnect();
    }
  }

  // Handle Account Connection
  async function handleConnect() {
    const username = els.usernameInput.value.trim();
    if (!username) return;

    els.connectBtn.disabled = true;
    els.connectBtn.innerText = 'Verifying...';
    els.connectError.classList.add('hide');

    try {
      const res = await fetch(`/api/player-check?username=${encodeURIComponent(username)}`);
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to find player');
      }

      const player = await res.json();
      
      if (player.verified === false) {
        showVerifyModal(player.username, player.code);
        return;
      }

      completeSignIn(player);

    } catch (err) {
      console.error(err);
      els.connectError.innerText = err.message || 'Player verification failed.';
      els.connectError.classList.remove('hide');
      handleDisconnect();
    } finally {
      els.connectBtn.disabled = false;
      els.connectBtn.innerText = 'Connect';
    }
  }

  let pollingInterval = null;

  function showVerifyModal(username, code) {
    const verifyModal = document.getElementById('verify-modal-overlay');
    const verifyCommandText = document.getElementById('verify-command-text');
    const verifyCancelBtn = document.getElementById('verify-cancel-btn');
    const copyCommandBtn = document.getElementById('copy-command-btn');

    verifyCommandText.innerText = `/storeauth ${code}`;
    verifyModal.classList.remove('hide');

    copyCommandBtn.onclick = () => {
      navigator.clipboard.writeText(`/storeauth ${code}`);
      copyCommandBtn.innerText = 'Copied!';
      setTimeout(() => {
        copyCommandBtn.innerText = 'Copy';
      }, 2000);
    };

    verifyCancelBtn.onclick = () => {
      stopPolling();
      verifyModal.classList.add('hide');
      els.connectBtn.disabled = false;
      els.connectBtn.innerText = 'Connect';
    };

    stopPolling();
    pollingInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/player-check?username=${encodeURIComponent(username)}`);
        if (res.ok) {
          const player = await res.json();
          if (player.verified === true) {
            stopPolling();
            verifyModal.classList.add('hide');
            completeSignIn(player);
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 3000);
  }

  function stopPolling() {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }
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
    els.usernameInput.value = '';

    els.profileDisplay.classList.add('hide');
    els.connectForm.classList.remove('hide');

    document.querySelectorAll('.buy-btn').forEach(btn => {
      btn.disabled = true;
    });

    // Clear cart on disconnect
    Object.keys(cart).forEach(k => delete cart[k]);
    updateCartBadge();

    renderCatalog();
    renderCart();
    stopPolling();
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

  // MediaWiki exact hash paths to load textures correctly without 404
  const ITEM_ICONS = {
    'void_totem': 'https://minecraft.wiki/images/2/2e/Totem_of_Undying_JE2_BE2.png',
    'netherite_ingot': 'https://assets.mcasset.cloud/1.21/assets/minecraft/textures/item/netherite_ingot.png',
    'elytra': 'https://assets.mcasset.cloud/1.21/assets/minecraft/textures/item/elytra.png',
    'healing_potion': 'https://minecraft.wiki/images/e/e8/Hardcore_Heart_JE1_BE1.png',
    'haste_potion': 'https://assets.mcasset.cloud/1.21/assets/minecraft/textures/item/potion.png',
    'strength_potion': 'https://assets.mcasset.cloud/1.21/assets/minecraft/textures/item/potion.png',
    'piglin_head': 'https://minecraft.wiki/images/b/b6/Piglin_Head_JE2_BE1.png',
    'dragon_head': 'https://minecraft.wiki/images/0/01/Dragon_Head_JE2_BE1.png'
  };

  const ITEM_FILTERS = {
    'haste_potion': 'hue-rotate(50deg) saturate(3.5)',
    'strength_potion': 'hue-rotate(320deg) saturate(3)'
  };

  // Render Items Grid
  function renderCatalog() {
    els.itemsGrid.innerHTML = '';
    
    Object.entries(state.catalog).forEach(([id, item]) => {
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
          <button class="remove-item-btn" data-id="${id}" title="Remove">🗑️</button>
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

      // Success! Update local balance
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
