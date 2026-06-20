const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Security Check: Read API configurations from environment variables or use fallbacks
const API_BASE_URL = process.env.API_BASE_URL || 'http://15.235.215.108:14989';
const API_KEY = process.env.API_KEY || 'osmp_dJaTx1JyHLtOrrTGRDlgA9sBovyv3WvQ';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Item configuration with prices, names, and command delivery logic
const ITEMS = {
  'void_totem': {
    name: 'Void Totem',
    price: 10000000,
    icon: 'totem_of_undying',
    description: 'Mystical totem of undying that protects you from void damage.',
    giveCommand: 'give {username} totem_of_undying[custom_name=\'"§d§lVoid Totem"\',lore=[\'"§7Saves you from the void!"\']] 1'
  },
  'haste_potion': {
    name: 'Netherite Haste Potion',
    price: 20000000,
    icon: 'potion',
    description: 'Grants Haste II for 2 minutes (120 seconds). Great for mining!',
    giveCommand: 'give {username} potion[potion_contents={custom_effects:[{id:"minecraft:haste",duration:2400,amplifier:1}]},custom_name=\'"§6§lNetherite Haste Potion"\'] 1'
  },
  'strength_potion': {
    name: 'Netherite Strength Potion',
    price: 25000000,
    icon: 'potion',
    description: 'Grants Strength III for 1 minute (60 seconds). Unleash raw power!',
    giveCommand: 'give {username} potion[potion_contents={custom_effects:[{id:"minecraft:strength",duration:1200,amplifier:2}]},custom_name=\'"§6§lNetherite Strength Potion"\'] 1'
  },
  'healing_potion': {
    name: 'Netherite Healing Potion',
    price: 20000000,
    icon: 'splash_potion',
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

// Expose Item Catalog to Frontend
app.get('/api/catalog', (req, res) => {
  res.json(ITEMS);
});

// Proxy Player Info Fetching (hides API Key)
app.get('/api/player-check', async (req, res) => {
  const username = req.query.username;
  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  try {
    const url = `${API_BASE_URL}/api/player?name=${encodeURIComponent(username)}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        return res.status(404).json({ error: 'Player has never played on Ocean SMP' });
      }
      return res.status(response.status).json({ error: 'Failed to verify player status' });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error checking player:', error);
    res.status(500).json({ error: 'Server error connecting to Minecraft server API' });
  }
});

// Process Purchase Transaction
app.post('/api/purchase', async (req, res) => {
  const { username, itemId } = req.body;

  if (!username || !itemId) {
    return res.status(400).json({ error: 'Username and Item ID are required' });
  }

  const item = ITEMS[itemId];
  if (!item) {
    return res.status(400).json({ error: 'Invalid item selected' });
  }

  try {
    // 1. Fetch current player state
    const playerUrl = `${API_BASE_URL}/api/player?name=${encodeURIComponent(username)}`;
    const playerResponse = await fetch(playerUrl, {
      headers: { 'Authorization': `Bearer ${API_KEY}` }
    });

    if (!playerResponse.ok) {
      return res.status(400).json({ error: 'Player validation failed. Are you sure they played before?' });
    }

    const player = await playerResponse.json();

    // 2. Validate online status (required for instant in-game item delivery)
    if (!player.online) {
      return res.status(400).json({ error: 'You must be online on Ocean SMP to receive your purchase!' });
    }

    // 3. Validate player balance
    if (player.balance < item.price) {
      const needed = item.price - player.balance;
      return res.status(400).json({ 
        error: `Insufficient balance! You have $${player.balance.toLocaleString()}, but need $${item.price.toLocaleString()} (Short by $${needed.toLocaleString()}).` 
      });
    }

    // Helper to run execute commands
    const runCommand = async (cmd) => {
      const response = await fetch(`${API_BASE_URL}/api/execute`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ command: cmd })
      });
      return response.ok;
    };

    // 4. Deduct in-game money
    const deductOk = await runCommand(`eco take ${username} ${item.price}`);
    if (!deductOk) {
      return res.status(500).json({ error: 'Failed to process payment on the server.' });
    }

    // Pay notzour
    const payOwnerOk = await runCommand(`eco give notzour ${item.price}`);

    // 5. Deliver Item Instantly
    const deliverCommand = item.giveCommand.replace('{username}', username);
    const deliverOk = await runCommand(deliverCommand);
    if (!deliverOk) {
      // Revert payment if delivery fails
      await runCommand(`eco give ${username} ${item.price}`);
      if (payOwnerOk) {
        await runCommand(`eco take notzour ${item.price}`);
      }
      return res.status(500).json({ error: 'Failed to deliver the item on the server. Payment reverted.' });
    }

    // 6. Broadcast notification & message in game
    await runCommand(`say §5§lOcean Packs §8» §f${username} bought §d${item.name} §ffor §a$${item.price.toLocaleString()}§f!`);
    await runCommand(`msg ${username} §5§lOcean Packs §8» §aSuccessfully purchased §e${item.name} §afor §e$${item.price.toLocaleString()}§a!`);

    res.json({
      success: true,
      message: `Successfully purchased ${item.name}!`,
      newBalance: player.balance - item.price
    });
  } catch (error) {
    console.error('Error during purchase:', error);
    res.status(500).json({ error: 'An error occurred while communicating with the game server.' });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Ocean Packs store running securely on port ${PORT}`);
});
