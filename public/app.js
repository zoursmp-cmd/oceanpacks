document.addEventListener('DOMContentLoaded', () => {
  // Application State
  const state = {
    username: null,
    uuid: null,
    balance: 0,
    online: false,
    rank: 'MEMBER',
    catalog: {}
  };

  // SVG Icons lookup table
  const SVGS = {
    'totem_of_undying': `<svg class="item-icon-svg" viewBox="0 0 24 24"><path d="M12 2C10.9 2 10 2.9 10 4V7H7C5.9 7 5 7.9 5 9V12C5 13.1 5.9 14 7 14H10V20C10 21.1 10.9 22 12 22C13.1 22 14 21.1 14 20V14H17C18.1 14 19 13.1 19 12V9C19 7.9 18.1 7 17 7H14V4C14 2.9 13.1 2 12 2M12 6C12.6 6 13 6.4 13 7C13 7.6 12.6 8 12 8C11.4 8 11 7.6 11 7C11 6.4 11.4 6 12 6M12 10C13.1 10 14 10.9 14 12C14 13.1 13.1 14 12 14C10.9 14 10 13.1 10 12C10 10.9 10.9 10 12 10Z"/></svg>`,
    'potion': `<svg class="item-icon-svg" viewBox="0 0 24 24"><path d="M19.58 6.54L18 8.12V19C18 20.1 17.1 21 16 21H8C6.9 21 6 20.1 6 19V8.12L4.42 6.54C4.16 6.28 4 5.92 4 5.54V3C4 2.45 4.45 2 5 2H19C19.55 2 20 2.45 20 3V5.54C20 5.92 19.84 6.28 19.58 6.54M9 8V19H15V8H9M11 4V6H13V4H11Z"/></svg>`,
    'splash_potion': `<svg class="item-icon-svg" viewBox="0 0 24 24"><path d="M19.58 6.54L18 8.12V19C18 20.1 17.1 21 16 21H8C6.9 21 6 20.1 6 19V8.12L4.42 6.54C4.16 6.28 4 5.92 4 5.54V3C4 2.45 4.45 2 5 2H19C19.55 2 20 2.45 20 3V5.54C20 5.92 19.84 6.28 19.58 6.54M12 8L15 11.5L13.5 13L15 15.5L12.5 18L10 15L11.5 13.5L9.5 11L12 8Z"/></svg>`,
    'netherite_ingot': `<svg class="item-icon-svg" viewBox="0 0 24 24"><path d="M4 5H20V9H4V5M4 11H20V15H4V11M4 17H20V21H4V17Z"/></svg>`,
    'elytra': `<svg class="item-icon-svg" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2M12 4C13.2 4 14.3 4.4 15.2 5.1L12 11L8.8 5.1C9.7 4.4 10.8 4 12 4M4 12C4 10.1 4.7 8.3 5.9 7L10.5 15.5H5.4C4.5 14.5 4 13.3 4 12M12 20C10.8 20 9.7 19.6 8.8 18.9L12 13L15.2 18.9C14.3 19.6 13.2 20 12 20M20 12C20 13.9 19.3 15.7 18.1 17H13L17.6 8.5C18.5 9.5 19 10.7 19 12Z"/></svg>`,
    'piglin_head': `<svg class="item-icon-svg" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2M12 18C8.69 18 6 15.31 6 12S8.69 6 12 6 18 8.69 18 12 15.31 18 12 18M10 10.5C10 11.33 9.33 12 8.5 12S7 11.33 7 10.5 7.67 9 8.5 9 10 9.67 10 10.5M17 10.5C17 11.33 16.33 12 15.5 12S14 11.33 14 10.5 14.67 9 15.5 9 17 9.67 17 10.5M9 14.5H15V16H9V14.5Z"/></svg>`,
    'dragon_head': `<svg class="item-icon-svg" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12C2 16.84 5.44 20.87 10 21.75V15H8V13H10V11H7V9H10V7H12V9H14V7H16V9H17V11H14V13H16V15H14V21.75C18.56 20.87 22 16.84 22 12C22 6.48 17.52 2 12 2M12 18C11.17 18 10.5 17.33 10.5 16.5S11.17 15 12 15 13.5 15.67 13.5 16.5 12.83 18 12 18Z"/></svg>`
  };

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
    toastMessage: document.getElementById('toast-message')
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
      
      // Update State
      state.username = player.username;
      state.uuid = player.uuid;
      state.balance = player.balance;
      state.online = player.online;
      state.rank = player.rank;

      // Save session
      localStorage.setItem('ocean_smp_username', player.username);

      // Render Profile
      els.playerUsername.innerText = player.username;
      els.playerAvatar.src = `https://crafatar.com/renders/body/${player.uuid}?overlay=true`;
      
      els.playerStatus.innerText = player.online ? 'Online' : 'Offline';
      if (player.online) {
        els.playerStatus.classList.remove('offline');
      } else {
        els.playerStatus.classList.add('offline');
      }

      els.playerRank.innerText = player.rank.toUpperCase();
      els.playerBalance.innerText = formatMoney(player.balance);

      // Switch views
      els.connectForm.classList.add('hide');
      els.profileDisplay.classList.remove('hide');

      // Enable purchase buttons
      document.querySelectorAll('.buy-btn').forEach(btn => {
        btn.disabled = false;
      });

    } catch (err) {
      console.error(err);
      els.connectError.innerText = err.message || 'Player verification failed.';
      els.connectError.classList.remove('hide');
      handleDisconnect();
    } finally {
      els.connectBtn.disabled = false;
      els.connectBtn.innerText = 'Connect Account';
    }
  }

  // Handle Disconnect
  function handleDisconnect() {
    state.username = null;
    state.uuid = null;
    state.balance = 0;
    state.online = false;
    state.rank = 'MEMBER';

    localStorage.removeItem('ocean_smp_username');
    els.usernameInput.value = '';

    els.profileDisplay.classList.add('hide');
    els.connectForm.classList.remove('hide');

    // Disable purchase buttons
    document.querySelectorAll('.buy-btn').forEach(btn => {
      btn.disabled = true;
    });
  }

  // Render Items Grid
  function renderCatalog() {
    els.itemsGrid.innerHTML = '';
    
    Object.entries(state.catalog).forEach(([id, item]) => {
      const card = document.createElement('div');
      card.className = 'item-card';
      
      const svgIcon = SVGS[item.icon] || SVGS['totem_of_undying'];
      const isButtonDisabled = !state.username;

      card.innerHTML = `
        <div class="card-top">
          <div class="icon-container">
            ${svgIcon}
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
            Unlock Instantly
          </button>
        </div>
      `;

      card.querySelector('.buy-btn').addEventListener('click', () => handlePurchase(id));
      els.itemsGrid.appendChild(card);
    });
  }

  // Process purchase click
  async function handlePurchase(itemId) {
    if (!state.username) {
      showToast('You must connect your account first!');
      return;
    }

    const item = state.catalog[itemId];
    if (!item) return;

    // Check balance client-side first
    if (state.balance < item.price) {
      showToast(`Insufficient balance! You need ${formatMoney(item.price)}.`);
      return;
    }

    const buyBtn = document.querySelector(`.buy-btn[data-id="${itemId}"]`);
    const originalText = buyBtn.innerText;
    buyBtn.disabled = true;
    buyBtn.innerText = 'Processing...';

    try {
      const res = await fetch('/api/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: state.username, itemId })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Purchase failed');
      }

      // Success! Update local state
      state.balance = data.newBalance;
      els.playerBalance.innerText = formatMoney(state.balance);

      // Open Success Modal
      els.receiptItemName.innerText = item.name;
      els.receiptItemPrice.innerText = formatMoney(item.price);
      els.receiptNewBalance.innerText = formatMoney(data.newBalance);
      els.modalOverlay.classList.remove('hide');

    } catch (err) {
      console.error(err);
      showToast(err.message || 'Transaction failed. Please try again.');
    } finally {
      buyBtn.disabled = false;
      buyBtn.innerText = originalText;
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
