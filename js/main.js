// Main game initialization and game loop
class Game {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.pokemon = [];
        this.uiElements = [];
        this.spriteRenderer = null;
        this.behaviorSystem = null;
        this.interactionSystem = null;
        this.uiManager = null;
        this.lastTime = 0;
        this.isRunning = false;
        this.draggingElement = null;
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

        this.uiManager.onAddUIElement = (type) => {
            this.addUIElement(type);
        };

        // Set up canvas mouse handlers for dragging UI elements
        this.setupCanvasMouseHandlers();

        // Handle window resize
        window.addEventListener('resize', () => {
            this.resizeCanvas();
        });


        // Listen for timer updates to trigger re-render
        window.addEventListener('timerUpdated', () => {
            this.render();
        });

        // Listen for note updates to trigger re-render
        window.addEventListener('noteUpdated', () => {
            this.render();
        });

        // Listen for UI element removal
        window.addEventListener('removeUIElement', (e) => {
            const elementId = e.detail.id;
            this.removeUIElement(elementId);
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
            // Behavior update (pass UI elements for collision avoidance)
            this.behaviorSystem.update(
                pokemon,
                deltaTime,
                this.canvas.width,
                this.canvas.height,
                this.pokemon,
                this.uiElements
            );

            // Pokemon update (pass UI elements for collision detection)
            pokemon.update(
                deltaTime,
                this.canvas.width,
                this.canvas.height,
                this.pokemon,
                this.uiElements
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

        // Render all UI elements
        this.uiElements.forEach(element => {
            // Initialize canvas reference for elements that need it
            if (!element.canvasRef && element.type === 'note') {
                element.canvasRef = this.canvas;
            }
            element.render(this.ctx);
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

    addUIElement(type) {
        // Random starting position
        const x = Math.random() * (this.canvas.width - 250) + 50;
        const y = Math.random() * (this.canvas.height - 300) + 50;

        let element;
        const id = Date.now() + Math.random();

        switch(type) {
            case 'timer':
                element = new TimerElement(id, x, y);
                break;
            case 'note':
                element = new NoteElement(id, x, y);
                break;
            default:
                return null;
        }

        this.uiElements.push(element);
        return element;
    }

    removeUIElement(elementId) {
        const index = this.uiElements.findIndex(el => el.id === elementId);
        if (index !== -1) {
            const element = this.uiElements[index];
            
            // Clean up any DOM elements
            if (element.type === 'note' && element.container) {
                element.container.remove();
            }
            
            this.uiElements.splice(index, 1);
            this.render();
        }
    }

    setupCanvasMouseHandlers() {
        let mouseDown = false;
        let lastClickTime = 0;
        let lastClickElement = null;
        let mouseDownX = 0;
        let mouseDownY = 0;
        let potentialDragElement = null;

        this.canvas.addEventListener('mousedown', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            mouseDownX = x;
            mouseDownY = y;

            // Check UI elements first (they're on top)
            for (let i = this.uiElements.length - 1; i >= 0; i--) {
                const element = this.uiElements[i];
                if (element.isPointInside(x, y)) {
                    // Check for double-click
                    const currentTime = Date.now();
                    if (lastClickElement === element && currentTime - lastClickTime < 300) {
                        // Double click detected
                        this.handleUIElementDoubleClick(element, x, y);
                        lastClickTime = 0;
                        lastClickElement = null;
                        return;
                    }

                    // Check if clicking on a control button or interactive area FIRST
                    // This prevents dragging when clicking on interactive elements
                    if (element.handleClick) {
                        const handled = element.handleClick(x, y, this.canvas);
                        if (handled) {
                            e.preventDefault(); // Prevent default behavior
                            e.stopPropagation(); // Stop event propagation
                            this.render();
                            lastClickTime = currentTime;
                            lastClickElement = element;
                            return; // Don't start dragging if click was handled
                        }
                    }

                    // Store element for potential drag, but don't start dragging yet
                    // We'll start dragging only if mouse moves significantly
                    potentialDragElement = element;
                    
                    // Move to front
                    this.uiElements.splice(i, 1);
                    this.uiElements.push(element);
                    
                    lastClickTime = currentTime;
                    lastClickElement = element;
                    mouseDown = true;
                    return;
                }
            }
        });

        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Check for resize first
            if (mouseDown && potentialDragElement && potentialDragElement.type === 'note' && potentialDragElement.isResizing) {
                potentialDragElement.handleResize(x, y);
                this.render();
                return;
            }

            if (mouseDown && potentialDragElement) {
                // Only start dragging if mouse moved more than 5 pixels
                // This allows clicks to work without triggering drag
                const dx = x - mouseDownX;
                const dy = y - mouseDownY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance > 5 && !potentialDragElement.isResizing) {
                    // Start dragging
                    if (!this.draggingElement) {
                        potentialDragElement.startDrag(mouseDownX, mouseDownY);
                        this.draggingElement = potentialDragElement;
                    }
                    
                    if (this.draggingElement) {
                        this.draggingElement.updateDrag(x, y);
                        this.render();
                    }
                }
            } else if (mouseDown && this.draggingElement) {
                // Continue dragging
                this.draggingElement.updateDrag(x, y);
                this.render();
            }
        });

        this.canvas.addEventListener('mouseup', () => {
            if (this.draggingElement) {
                this.draggingElement.stopDrag();
                this.draggingElement = null;
            }
            if (potentialDragElement && potentialDragElement.type === 'note' && potentialDragElement.isResizing) {
                potentialDragElement.stopResize();
            }
            potentialDragElement = null;
            mouseDown = false;
        });

        this.canvas.addEventListener('mouseleave', () => {
            if (this.draggingElement) {
                this.draggingElement.stopDrag();
                this.draggingElement = null;
            }
            if (potentialDragElement && potentialDragElement.type === 'note' && potentialDragElement.isResizing) {
                potentialDragElement.stopResize();
            }
            potentialDragElement = null;
            mouseDown = false;
        });
    }

    handleUIElementDoubleClick(element, x, y) {
        // Double-click on note title to change color
        if (element.type === 'note') {
            const relX = x - element.position.x;
            const relY = y - element.position.y;
            // Check if double-clicking on title area
            if (relX >= 10 && relX <= element.width - 10 && 
                relY >= 10 && relY <= 30) {
                element.cycleColor();
                this.render();
            }
        }
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

