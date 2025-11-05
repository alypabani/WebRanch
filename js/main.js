// Main game initialization and game loop
class Game {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.pokemon = [];
        this.spriteRenderer = null;
        this.behaviorSystem = null;
        this.interactionSystem = null;
        this.uiManager = null;
        this.lastTime = 0;
        this.selectedPokemon = null;
        this.isRunning = false;
    }

    initialize() {
        // Get canvas element
        this.canvas = document.getElementById('game-canvas');
        if (!this.canvas) {
            console.error('Canvas element not found!');
            return;
        }

        this.ctx = this.canvas.getContext('2d');
        
        // Set canvas size
        this.resizeCanvas();

        // Initialize systems
        this.spriteRenderer = new SpriteRenderer();
        this.behaviorSystem = new BehaviorSystem();
        this.interactionSystem = new InteractionSystem();
        this.uiManager = new UIManager();

        // Initialize UI
        this.uiManager.initialize('ui-container');
        
        // Set up UI callbacks
        this.uiManager.onAddPokemon = (pokemonData) => {
            this.addPokemon(pokemonData.name, pokemonData.spritePath);
        };

        this.uiManager.onRemovePokemon = (pokemonId) => {
            this.removePokemon(pokemonId);
        };

        this.uiManager.onSelectPokemon = (pokemonData) => {
            this.selectPokemon(pokemonData.id);
        };

        // Set up canvas click handler for selecting Pokemon
        this.canvas.addEventListener('click', (e) => {
            this.handleCanvasClick(e);
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            this.resizeCanvas();
        });

        // Start game loop
        this.isRunning = true;
        this.gameLoop(0);
    }

    resizeCanvas() {
        const container = document.querySelector('.canvas-container');
        if (container) {
            this.canvas.width = container.clientWidth;
            this.canvas.height = container.clientHeight;
        } else {
            this.canvas.width = window.innerWidth - 300; // Account for UI panel
            this.canvas.height = window.innerHeight;
        }
    }

    addPokemon(name, spritePath) {
        if (this.pokemon.length >= 25) {
            return null;
        }

        // Random starting position
        const x = Math.random() * (this.canvas.width - 100) + 50;
        const y = Math.random() * (this.canvas.height - 100) + 50;

        const pokemon = new Pokemon(
            Date.now() + Math.random(),
            name,
            spritePath,
            x,
            y
        );

        this.pokemon.push(pokemon);

        // Preload sprite
        this.spriteRenderer.preloadSprite(spritePath);

        return pokemon;
    }

    removePokemon(pokemonId) {
        const index = this.pokemon.findIndex(p => p.id === pokemonId);
        if (index !== -1) {
            this.pokemon.splice(index, 1);
            if (this.selectedPokemon && this.selectedPokemon.id === pokemonId) {
                this.selectedPokemon = null;
            }
        }
    }

    selectPokemon(pokemonId) {
        this.selectedPokemon = this.pokemon.find(p => p.id === pokemonId);
    }

    handleCanvasClick(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Check if click is on a Pokemon
        for (let i = this.pokemon.length - 1; i >= 0; i--) {
            const pokemon = this.pokemon[i];
            const dx = x - pokemon.position.x;
            const dy = y - pokemon.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < pokemon.size + 10) {
                // Clicked on this Pokemon
                this.selectPokemon(pokemon.id);
                if (this.uiManager) {
                    this.uiManager.selectPokemon(pokemon.id);
                }
                break;
            }
        }
    }

    update(deltaTime) {
        // Update all Pokemon
        this.pokemon.forEach(pokemon => {
            // Behavior update
            this.behaviorSystem.update(
                pokemon,
                deltaTime,
                this.canvas.width,
                this.canvas.height,
                this.pokemon
            );

            // Pokemon update
            pokemon.update(
                deltaTime,
                this.canvas.width,
                this.canvas.height,
                this.pokemon
            );
        });

        // Update interactions
        this.interactionSystem.update(
            this.pokemon,
            deltaTime,
            this.behaviorSystem,
            this.spriteRenderer,
            this.canvas
        );
    }

    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw background
        this.drawBackground();

        // Render interaction effects
        this.interactionSystem.renderInteractionEffects(this.ctx, this.spriteRenderer);

        // Render all Pokemon
        this.pokemon.forEach(pokemon => {
            this.spriteRenderer.render(this.ctx, pokemon);

            // Highlight selected Pokemon
            if (this.selectedPokemon && pokemon.id === this.selectedPokemon.id) {
                this.highlightPokemon(pokemon);
            }
        });
    }

    drawBackground() {
        // Draw a simple gradient background
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#E0F6FF');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw some ground
        this.ctx.fillStyle = '#90EE90';
        this.ctx.fillRect(0, this.canvas.height - 50, this.canvas.width, 50);
    }

    highlightPokemon(pokemon) {
        const { x, y } = pokemon.position;
        const size = pokemon.size;

        this.ctx.save();
        this.ctx.strokeStyle = '#FFD700';
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.arc(x, y, size + 10, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        this.ctx.restore();
    }

    gameLoop(currentTime) {
        if (!this.isRunning) return;

        const deltaTime = (currentTime - this.lastTime) / 1000; // Convert to seconds
        this.lastTime = currentTime;

        // Cap deltaTime to prevent large jumps
        const clampedDelta = Math.min(deltaTime, 0.1);

        this.update(clampedDelta);
        this.render();

        requestAnimationFrame((time) => this.gameLoop(time));
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    game.initialize();
});

