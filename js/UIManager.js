class UIManager {
    constructor() {
        this.pokemonRoster = [];
        this.onAddPokemon = null;
        this.onRemovePokemon = null;
        this.availableSprites = [];
        this.spriteDetectionInProgress = false;
    }

    initialize(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Create UI structure
        container.innerHTML = `
            <div class="ui-panel">
                <h2>Pokemon Ranch</h2>
                <div class="add-pokemon-section">
                    <h3>Add Pokemon</h3>
                    <select id="pokemon-sprite-select" class="sprite-select">
                        <option value="">Loading sprites...</option>
                    </select>
                    <button id="add-pokemon-btn">Add Pokemon</button>
                </div>
                <div class="roster-section">
                    <h3>Roster (${this.pokemonRoster.length}/25)</h3>
                    <div id="pokemon-list" class="pokemon-list"></div>
                </div>
            </div>
        `;

        // Set up event listeners
        const addBtn = document.getElementById('add-pokemon-btn');
        const spriteSelect = document.getElementById('pokemon-sprite-select');

        addBtn.addEventListener('click', () => {
            const selectedOption = spriteSelect.options[spriteSelect.selectedIndex];
            if (selectedOption.value && this.pokemonRoster.length < 25) {
                const spritePath = selectedOption.value;
                const pokemonName = this.extractPokemonNameFromPath(spritePath);
                this.addPokemon(pokemonName, spritePath);
                // Don't reset dropdown - keep selection so user can easily add the same Pokemon again
                // spriteSelect.selectedIndex = 0;
            }
        });

        // Fetch sprites from server
        this.fetchAvailableSprites();
    }

    addPokemon(name, spritePath) {
        if (this.pokemonRoster.length >= 25) {
            alert('Maximum of 25 Pokemon allowed!');
            return null;
        }

        const pokemon = {
            id: Date.now() + Math.random(),
            name: name,
            spritePath: spritePath
        };

        this.pokemonRoster.push(pokemon);
        this.updateRosterDisplay();

        if (this.onAddPokemon) {
            this.onAddPokemon(pokemon);
        }

        return pokemon;
    }

    removePokemon(pokemonId) {
        const index = this.pokemonRoster.findIndex(p => p.id === pokemonId);
        if (index !== -1) {
            this.pokemonRoster.splice(index, 1);
            this.updateRosterDisplay();

            if (this.onRemovePokemon) {
                this.onRemovePokemon(pokemonId);
            }
        }
    }

    updateRosterDisplay() {
        const listContainer = document.getElementById('pokemon-list');
        const rosterHeader = document.querySelector('.roster-section h3');
        
        if (!listContainer) return;

        rosterHeader.textContent = `Roster (${this.pokemonRoster.length}/25)`;

        listContainer.innerHTML = '';

        this.pokemonRoster.forEach(pokemon => {
            const item = document.createElement('div');
            item.className = 'pokemon-item';

            item.innerHTML = `
                <span class="pokemon-item-name">${pokemon.name}</span>
                <button class="remove-btn" data-id="${pokemon.id}">×</button>
            `;

            const removeBtn = item.querySelector('.remove-btn');
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.removePokemon(pokemon.id);
            });

            listContainer.appendChild(item);
        });
    }

    getRoster() {
        return this.pokemonRoster;
    }

    async fetchAvailableSprites() {
        if (this.spriteDetectionInProgress) return;
        this.spriteDetectionInProgress = true;

        const spriteSelect = document.getElementById('pokemon-sprite-select');
        if (!spriteSelect) return;

        spriteSelect.innerHTML = '<option value="">Loading sprites...</option>';

        try {
            // Try to fetch from server endpoint first
            let sprites = await this.fetchFromServer();
            
            // If server fetch fails, try manifest file
            if (!sprites || sprites.length === 0) {
                sprites = await this.fetchFromManifest();
            }

            // If manifest also fails, fall back to detection
            if (!sprites || sprites.length === 0) {
                sprites = await this.detectSprites();
            }

            // Populate dropdown
            spriteSelect.innerHTML = '<option value="">Select a Pokemon...</option>';
            
            if (sprites && sprites.length > 0) {
                sprites.forEach(sprite => {
                    const option = document.createElement('option');
                    option.value = sprite.path;
                    option.textContent = sprite.name;
                    option.dataset.spritePath = sprite.path;
                    spriteSelect.appendChild(option);
                });
            } else {
                spriteSelect.innerHTML = '<option value="">No sprites available</option>';
            }

            // Setup sprite preview
            this.setupSpritePreview();
            
            this.availableSprites = sprites || [];
        } catch (error) {
            console.error('Error fetching sprites:', error);
            spriteSelect.innerHTML = '<option value="">Error loading sprites</option>';
        }

        this.spriteDetectionInProgress = false;
    }

    async fetchFromServer() {
        try {
            // Try to fetch from server endpoint
            const response = await fetch('/api/sprites');
            if (response.ok) {
                const data = await response.json();
                return data.sprites || [];
            }
        } catch (error) {
            // Server endpoint doesn't exist, try manifest
            console.log('Server endpoint not available, trying manifest...');
        }
        return [];
    }

    async fetchFromManifest() {
        try {
            // Try to fetch from manifest file
            const response = await fetch('sprites/manifest.json');
            if (response.ok) {
                const data = await response.json();
                return data.sprites || [];
            }
        } catch (error) {
            // Manifest doesn't exist, try detection
            console.log('Manifest not found, trying detection...');
        }
        return [];
    }

    async detectSprites() {
        // Fallback: detect common Pokemon sprites (supports animated GIFs)
        const commonPokemon = [
            'pikachu', 'charizard', 'blastoise', 'venusaur', 'eevee', 'squirtle', 
            'charmander', 'bulbasaur', 'mewtwo', 'mew', 'snorlax', 'gengar',
            'dragonite', 'gyarados', 'lapras', 'arcanine', 'alakazam', 'machamp',
            'golem', 'onix', 'hitmonlee', 'hitmonchan', 'lickitung', 'koffing',
            'weezing', 'rhyhorn', 'chansey', 'tangela', 'kangaskhan', 'horsea',
            'seadra', 'goldeen', 'seaking', 'staryu', 'starmie', 'mr-mime',
            'scyther', 'jynx', 'electabuzz', 'magmar', 'pinsir', 'tauros',
            'magikarp', 'ditto', 'vaporeon', 'jolteon', 'flareon', 'porygon',
            'omanyte', 'kabuto', 'aerodactyl', 'articuno', 'zapdos', 'moltres'
        ];

        const detectedSprites = [];
        const checkPromises = commonPokemon.map(pokemonName => {
            return this.checkSpriteExists(`sprites/${pokemonName}.gif`).then(exists => {
                if (exists) {
                    detectedSprites.push({
                        name: this.capitalizeName(pokemonName),
                        path: `sprites/${pokemonName}.gif`
                    });
                }
            });
        });

        await Promise.all(checkPromises);
        return detectedSprites;
    }

    async checkSpriteExists(spritePath) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = spritePath;
        });
    }

    capitalizeName(name) {
        return name.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    setupSpritePreview() {
        const spriteSelect = document.getElementById('pokemon-sprite-select');
        if (!spriteSelect) return;

        // Create preview container if it doesn't exist
        let previewContainer = document.getElementById('sprite-preview-container');
        if (!previewContainer) {
            previewContainer = document.createElement('div');
            previewContainer.id = 'sprite-preview-container';
            previewContainer.className = 'sprite-preview';
            spriteSelect.parentNode.insertBefore(previewContainer, spriteSelect.nextSibling);
        }

        spriteSelect.addEventListener('change', () => {
            const selectedOption = spriteSelect.options[spriteSelect.selectedIndex];
            const spritePath = selectedOption.dataset.spritePath;

            if (spritePath) {
                previewContainer.innerHTML = `<img src="${spritePath}" alt="Sprite preview" class="sprite-preview-img" />`;
                previewContainer.style.display = 'block';
            } else {
                previewContainer.style.display = 'none';
            }
        });
    }

    extractPokemonNameFromPath(spritePath) {
        // Extract Pokemon name from sprite path
        // e.g., "sprites/pikachu.png" -> "Pikachu"
        // e.g., "sprites/charizard-sprite.png" -> "Charizard Sprite"
        const filename = spritePath.split('/').pop(); // Get filename
        const nameWithoutExt = filename.replace(/\.(png|jpg|jpeg|gif)$/i, ''); // Remove extension
        return this.capitalizeName(nameWithoutExt);
    }
}

