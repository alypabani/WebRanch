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
        this.spriteRenderer.setCanvasContainer(this.canvas);
        this.behaviorSystem = new BehaviorSystem();
        this.interactionSystem = new InteractionSystem();
        this.uiManager = new UIManager();

        // Initialize UI
        this.uiManager.initialize('ui-container');
        
        // Set up UI callbacks
        this.uiManager.onAddPokemon = (pokemonData) => {
            this.addPokemon(pokemonData.id, pokemonData.name, pokemonData.spritePath);
        };

        this.uiManager.onRemovePokemon = (pokemonId) => {
            this.removePokemon(pokemonId);
        };

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

    addPokemon(id, name, spritePath) {
        if (this.pokemon.length >= 25) {
            return null;
        }

        // Random starting position
        const x = Math.random() * (this.canvas.width - 100) + 50;
        const y = Math.random() * (this.canvas.height - 100) + 50;

        // Use the ID passed from UIManager so IDs match between both arrays
        const pokemon = new Pokemon(
            id,
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
            const pokemonToRemove = this.pokemon[index];
            
            // Clean up any active interactions involving this Pokemon
            if (this.interactionSystem) {
                this.interactionSystem.cleanupInteractionsForPokemon(pokemonToRemove);
            }
            
            // Remove from array - this will immediately stop rendering
            this.pokemon.splice(index, 1);
            
            // Remove DOM element if it's a GIF
            if (this.spriteRenderer) {
                this.spriteRenderer.removePokemonElement(pokemonId);
            }
            
            // Force immediate canvas redraw to show removal
            this.render();
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

