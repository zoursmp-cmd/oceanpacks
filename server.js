const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Security Check: Read API configurations from environment variables or use fallbacks
const API_BASE_URL = process.env.API_BASE_URL || 'http://15.235.215.108:14989';
const API_KEY = process.env.API_KEY || 'osmp_dJaTx1JyHLtOrrTGRDlgA9sBovyv3WvQ';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-Memory Store for verification sessions
const pendingCodes = new Map(); // username -> 6-digit code
const verifiedSessions = new Set(); // usernames verified in current session

// Item configuration with prices, names, and command delivery logic
const ITEMS = {
  'void_totem': {
    name: 'Void Totem',
    price: 10000000,
    icon: 'void_totem',
    description: 'Mystical totem of undying that protects you from void damage.',
    giveCommand: 'give {username} totem_of_undying[custom_name=\'"§d§lVoid Totem"\',lore=[\'"§7Saves you from the void!"\']] 1'
  },
  'haste_potion': {
    name: 'Netherite Haste Potion',
    price: 20000000,
    icon: 'haste_potion',
    description: 'Grants Haste II for 2 minutes (120 seconds). Great for mining!',
    giveCommand: 'give {username} potion[potion_contents={custom_effects:[{id:"minecraft:haste",duration:2400,amplifier:1}]},custom_name=\'"§6§lNetherite Haste Potion"\'] 1'
  },
  'strength_potion': {
    name: 'Netherite Strength Potion',
    price: 25000000,
    icon: 'strength_potion',
    description: 'Grants Strength III for 1 minute (60 seconds). Unleash raw power!',
    giveCommand: 'give {username} potion[potion_contents={custom_effects:[{id:"minecraft:strength",duration:1200,amplifier:2}]},custom_name=\'"§6§lNetherite Strength Potion"\'] 1'
  },
  'healing_potion': {
    name: 'Netherite Healing Potion',
    price: 20000000,
    icon: 'healing_potion',
    description: 'Splash potion of Instant Health III. Instant full recovery.',
    giveCommand: 'give {username} splash_potion[potion_contents={custom_effects:[{id:"minecraft:instant_health",duration:1,amplifier:2}]},custom_name=\'"§6§lNetherite Healing Potion"\'] 1'
  },
  'netherite_ingot': {
    name: '1x Netherite Ingot',
    price: 3500000,
    icon: 'netherite_ingot',
    description: 'Essential raw material for upgrading armor and tools.',
    giveCommand: 'give {username} netherite_ingot 1'
  },
  'elytra': {
    name: 'Elytra',
    price: 32000000,
    icon: 'elytra',
    description: 'Vanilla wings to soar across the skies of Ocean SMP.',
    giveCommand: 'give {username} elytra 1'
  },
  'piglin_head': {
    name: 'Piglin Head',
    price: 10000000,
    icon: 'piglin_head',
    description: 'Extremely rare head decoration. Wiggle those pig ears!',
    giveCommand: 'give {username} piglin_head 1'
  },
  'dragon_head': {
    name: 'Dragon Head',
    price: 25000000,
    icon: 'dragon_head',
    description: 'The ultimate decorative dragon head with an opening jaw.',
    giveCommand: 'give {username} dragon_head 1'
  }
};

// Helper to run console commands via Minecraft API
const runCommand = async (cmd) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/execute`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ command: cmd })
    });
    return response.ok;
  } catch (err) {
    console.error('Error executing console command:', err);
    return false;
  }
};

// Expose Item Catalog to Frontend
app.get('/api/catalog', (req, res) => {
  res.json(ITEMS);
});

// Verification by 6-digit in-game code
app.post('/api/verify-code', async (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'Verification code is required' });
  }
  
  const enteredCode = parseInt(code, 10);
  if (isNaN(enteredCode) || enteredCode < 100000 || enteredCode > 999999) {
    return res.status(400).json({ error: 'Verification code must be a 6-digit number.' });
  }

  // Dev Test Bypass: Code 777777 immediately logs in notzour
  if (enteredCode === 777777) {
    verifiedSessions.add('notzour');
    await runCommand('scoreboard players set notzour storeauth 777777');
    await runCommand('scoreboard players set notzour storeverified 1');
    return res.json({
      success: true,
      player: {
        username: 'notzour',
        uuid: '1878baea-8bfb-389a-97ca-cef603993849',
        online: true,
        rank: 'Owner',
        balance: 1001039651.5,
        verified: true
      }
    });
  }

  try {
    // 1. Get all online players from the server
    const serverRes = await fetch(`${API_BASE_URL}/api/server`, {
      headers: { 'Authorization': `Bearer ${API_KEY}` }
    });
    if (!serverRes.ok) {
      return res.status(500).json({ error: 'Failed to fetch online players from the game server.' });
    }
    const serverInfo = await serverRes.json();
    const onlinePlayers = serverInfo.players || [];

    // 2. Fetch profile data for all online players to find who has this code
    const playerChecks = await Promise.all(
      onlinePlayers.map(async (name) => {
        try {
          const playerRes = await fetch(`${API_BASE_URL}/api/player?name=${encodeURIComponent(name)}`, {
            headers: { 'Authorization': `Bearer ${API_KEY}` }
          });
          if (playerRes.ok) {
            const pData = await playerRes.json();
            return pData;
          }
        } catch (e) {
          console.error(`Error checking player ${name}:`, e);
        }
        return null;
      })
    );

    // 3. Match code
    const matchingPlayer = playerChecks.find(p => p && p.auth_code === enteredCode);
    if (!matchingPlayer) {
      return res.status(400).json({ error: 'Invalid or expired code. Please run /storeauth in-game and try again.' });
    }

    const username = matchingPlayer.username;
    const normalizedUser = username.toLowerCase();

    // 4. Mark verified on server and local session
    await runCommand(`scoreboard players set ${username} storeverified 1`);
    verifiedSessions.add(normalizedUser);

    // Send notifications in-game
    await runCommand(`msg ${username} §5§lOcean SMP §8» §aYour account has been successfully linked to the website!`);
    await runCommand(`playsound entity.player.levelup voice ${username}`);

    res.json({
      success: true,
      player: {
        username: matchingPlayer.username,
        uuid: matchingPlayer.uuid,
        online: matchingPlayer.online,
        rank: matchingPlayer.rank,
        balance: matchingPlayer.balance,
        verified: true
      }
    });

  } catch (error) {
    console.error('Error verifying code:', error);
    res.status(500).json({ error: 'Internal server error during verification' });
  }
});

// Proxy Leaderboard data from game server
app.get('/api/leaderboard', async (req, res) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/leaderboard`, {
      headers: { 'Authorization': `Bearer ${API_KEY}` }
    });
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch leaderboard data' });
    }
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error proxying leaderboard:', error);
    res.status(500).json({ error: 'Server error fetching leaderboard data' });
  }
});

// Proxy Player Info (for session restore)
app.get('/api/player-info', async (req, res) => {
  const username = req.query.username;
  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }
  const normalizedUser = username.trim().toLowerCase();
  try {
    const url = `${API_BASE_URL}/api/player?name=${encodeURIComponent(username)}`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${API_KEY}` }
    });
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch player info' });
    }
    const data = await response.json();
    
    // Auto-verify if the scoreboard storeverified is 1 (player.verified is true)
    // and they are online
    if (data.verified === true && data.online === true) {
      verifiedSessions.add(normalizedUser);
    } else {
      verifiedSessions.delete(normalizedUser);
    }
    
    res.json(data);
  } catch (error) {
    console.error('Error proxying player info:', error);
    res.status(500).json({ error: 'Server error fetching player info' });
  }
});

// Reset verification (used when switching accounts)
app.post('/api/disconnect', (req, res) => {
  const { username } = req.body;
  if (username) {
    const normalizedUser = username.toLowerCase();
    verifiedSessions.delete(normalizedUser);
    pendingCodes.delete(normalizedUser);
    runCommand(`scoreboard players set ${username} storeverified 0`);
    runCommand(`scoreboard players set ${username} storeauth 0`);
  }
  res.json({ success: true });
});

// Process Checkout (Batch Purchases & Gifting)
app.post('/api/checkout', async (req, res) => {
  const { username, recipient, items } = req.body;

  if (!username || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Purchaser username and items are required' });
  }

  const purchaser = username.trim();
  const giftTo = (recipient && recipient.trim()) ? recipient.trim() : purchaser;
  const isGift = purchaser.toLowerCase() !== giftTo.toLowerCase();

  const normalizedPurchaser = purchaser.toLowerCase();
  if (!verifiedSessions.has(normalizedPurchaser)) {
    return res.status(403).json({ error: 'Account not verified. Please connect and run /storeauth <6-digit-code> in-game.' });
  }

  // Calculate total price and compile list of reward commands
  let totalCost = 0;
  const rewardCommands = [];
  const itemsSummary = [];

  for (const cartItem of items) {
    const itemConfig = ITEMS[cartItem.id];
    if (!itemConfig) {
      return res.status(400).json({ error: `Invalid item ID: ${cartItem.id}` });
    }
    const qty = parseInt(cartItem.quantity);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ error: `Invalid quantity for item: ${cartItem.id}` });
    }
    totalCost += itemConfig.price * qty;
    
    // Add give commands
    for (let i = 0; i < qty; i++) {
      rewardCommands.push(itemConfig.giveCommand.replace('{username}', giftTo));
    }
    itemsSummary.push(`${qty}x ${itemConfig.name}`);
  }

  try {
    // 1. Fetch current purchaser state
    const purchaserUrl = `${API_BASE_URL}/api/player?name=${encodeURIComponent(purchaser)}`;
    const purchaserResponse = await fetch(purchaserUrl, {
      headers: { 'Authorization': `Bearer ${API_KEY}` }
    });

    if (!purchaserResponse.ok) {
      return res.status(400).json({ error: 'Purchaser account validation failed.' });
    }

    const purchaserData = await purchaserResponse.json();


    // 2. Validate online status of purchaser
    if (!purchaserData.online) {
      return res.status(400).json({ error: 'You must be online on play.oceansmp.online to checkout!' });
    }

    // 3. If gifting, validate that the recipient exists and is online
    if (isGift) {
      const recipientUrl = `${API_BASE_URL}/api/player?name=${encodeURIComponent(giftTo)}`;
      const recipientResponse = await fetch(recipientUrl, {
        headers: { 'Authorization': `Bearer ${API_KEY}` }
      });
      if (!recipientResponse.ok) {
        return res.status(400).json({ error: `Gift recipient "${giftTo}" does not exist or has never played on the server.` });
      }
      const recipientData = await recipientResponse.json();
      if (!recipientData.online) {
        return res.status(400).json({ error: `Gift recipient "${giftTo}" must be online on play.oceansmp.online to receive the gift!` });
      }
    }

    // 4. Validate purchaser balance
    if (purchaserData.balance < totalCost) {
      const needed = totalCost - purchaserData.balance;
      return res.status(400).json({ 
        error: `Insufficient balance! You have $${purchaserData.balance.toLocaleString()}, but need $${totalCost.toLocaleString()} (Short by $${needed.toLocaleString()}).` 
      });
    }

    // 5. Deduct in-game money from purchaser
    const deductOk = await runCommand(`eco take ${purchaser} ${totalCost}`);
    if (!deductOk) {
      return res.status(500).json({ error: 'Failed to process payment on the server.' });
    }

    // Pay notzour
    const payOwnerOk = await runCommand(`eco give notzour ${totalCost}`);

    // 6. Deliver all items to recipient
    const failedCommands = [];
    for (const cmd of rewardCommands) {
      const ok = await runCommand(cmd);
      if (!ok) {
        failedCommands.push(cmd);
      }
    }

    if (failedCommands.length > 0) {
      // Revert payment if any delivery fails
      await runCommand(`eco give ${purchaser} ${totalCost}`);
      if (payOwnerOk) {
        await runCommand(`eco take notzour ${totalCost}`);
      }
      return res.status(500).json({ error: 'Failed to deliver some items on the server. Transaction reverted.' });
    }

    // 7. Broadcast notification & message in game
    const summaryStr = itemsSummary.join(', ');
    if (isGift) {
      await runCommand(`say §5§lOcean Packs §8» §f${purchaser} gifted §d${summaryStr} §fto §d${giftTo} §ffor §a$${totalCost.toLocaleString()}§f!`);
      await runCommand(`msg ${purchaser} §5§lOcean Packs §8» §aSuccessfully gifted §e${summaryStr} §ato §e${giftTo}§a!`);
      await runCommand(`msg ${giftTo} §5§lOcean Packs §8» §f${purchaser} §agifted you §e${summaryStr}§a!`);
    } else {
      await runCommand(`say §5§lOcean Packs §8» §f${purchaser} bought §d${summaryStr} §ffor §a$${totalCost.toLocaleString()}§f!`);
      await runCommand(`msg ${purchaser} §5§lOcean Packs §8» §aSuccessfully purchased §e${summaryStr} §afor §e$${totalCost.toLocaleString()}§a!`);
    }

    res.json({
      success: true,
      message: `Successfully purchased!`,
      newBalance: purchaserData.balance - totalCost
    });
  } catch (error) {
    console.error('Error during checkout:', error);
    res.status(500).json({ error: 'An error occurred while communicating with the game server.' });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Ocean Packs store running securely on port ${PORT}`);
});
