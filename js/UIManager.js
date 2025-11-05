class UIManager {
    constructor() {
        this.pokemonRoster = [];
        this.selectedPokemon = null;
        this.onAddPokemon = null;
        this.onRemovePokemon = null;
        this.onSelectPokemon = null;
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
                    <input type="text" id="pokemon-name-input" placeholder="Pokemon name" />
                    <input type="text" id="pokemon-sprite-input" placeholder="Sprite path (optional)" />
                    <button id="add-pokemon-btn">Add Pokemon</button>
                </div>
                <div class="roster-section">
                    <h3>Roster (${this.pokemonRoster.length}/25)</h3>
                    <div id="pokemon-list" class="pokemon-list"></div>
                </div>
                <div class="selected-pokemon-section">
                    <h3>Selected Pokemon</h3>
                    <div id="selected-pokemon-info">None selected</div>
                </div>
            </div>
        `;

        // Set up event listeners
        const addBtn = document.getElementById('add-pokemon-btn');
        const nameInput = document.getElementById('pokemon-name-input');
        const spriteInput = document.getElementById('pokemon-sprite-input');

        addBtn.addEventListener('click', () => {
            const name = nameInput.value.trim();
            if (name && this.pokemonRoster.length < 25) {
                const spritePath = spriteInput.value.trim() || `sprites/${name.toLowerCase()}.png`;
                this.addPokemon(name, spritePath);
                nameInput.value = '';
                spriteInput.value = '';
            }
        });

        // Allow Enter key to add Pokemon
        nameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                addBtn.click();
            }
        });

        spriteInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                addBtn.click();
            }
        });
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

            if (pokemonId === this.selectedPokemon?.id) {
                this.selectedPokemon = null;
                this.updateSelectedDisplay();
            }

            if (this.onRemovePokemon) {
                this.onRemovePokemon(pokemonId);
            }
        }
    }

    selectPokemon(pokemonId) {
        const pokemon = this.pokemonRoster.find(p => p.id === pokemonId);
        if (pokemon) {
            this.selectedPokemon = pokemon;
            this.updateSelectedDisplay();
            this.updateRosterDisplay();

            if (this.onSelectPokemon) {
                this.onSelectPokemon(pokemon);
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
            if (this.selectedPokemon && pokemon.id === this.selectedPokemon.id) {
                item.classList.add('selected');
            }

            item.innerHTML = `
                <span class="pokemon-item-name">${pokemon.name}</span>
                <button class="remove-btn" data-id="${pokemon.id}">×</button>
            `;

            item.addEventListener('click', (e) => {
                if (!e.target.classList.contains('remove-btn')) {
                    this.selectPokemon(pokemon.id);
                }
            });

            const removeBtn = item.querySelector('.remove-btn');
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.removePokemon(pokemon.id);
            });

            listContainer.appendChild(item);
        });
    }

    updateSelectedDisplay() {
        const selectedInfo = document.getElementById('selected-pokemon-info');
        if (!selectedInfo) return;

        if (this.selectedPokemon) {
            selectedInfo.innerHTML = `
                <div class="selected-pokemon-details">
                    <strong>${this.selectedPokemon.name}</strong>
                    <div class="pokemon-sprite-path">${this.selectedPokemon.spritePath}</div>
                </div>
            `;
        } else {
            selectedInfo.textContent = 'None selected';
        }
    }

    getRoster() {
        return this.pokemonRoster;
    }
}

