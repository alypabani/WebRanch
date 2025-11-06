class SpriteRenderer {
    constructor() {
        this.spriteCache = new Map();
        this.placeholderSize = 30;
        // Keep img elements in DOM for animated GIFs to work properly
        this.imgElements = new Map();
        // Map of Pokemon IDs to their DOM img elements (for animated GIFs)
        this.pokemonImgElements = new Map();
        this.canvasContainer = null;
    }
    
    setCanvasContainer(canvasElement) {
        // Get the canvas container to position img elements relative to it
        this.canvasContainer = canvasElement.parentElement;
        
        // Create container for Pokemon img elements
        if (!document.getElementById('pokemon-gif-layer')) {
            const layer = document.createElement('div');
            layer.id = 'pokemon-gif-layer';
            layer.style.position = 'absolute';
            layer.style.top = '0';
            layer.style.left = '0';
            layer.style.width = '100%';
            layer.style.height = '100%';
            layer.style.pointerEvents = 'none';
            layer.style.zIndex = '10';
            this.canvasContainer.appendChild(layer);
        }
    }

    async loadSprite(spritePath) {
        if (this.spriteCache.has(spritePath)) {
            return this.spriteCache.get(spritePath);
        }

        return new Promise((resolve) => {
            // For animated GIFs, create an img element that stays in DOM
            // This allows the browser to animate the GIF properly
            if (spritePath.endsWith('.gif')) {
                // Create hidden container for GIF img elements
                if (!document.getElementById('gif-container')) {
                    const container = document.createElement('div');
                    container.id = 'gif-container';
                    container.style.position = 'absolute';
                    container.style.visibility = 'hidden';
                    container.style.width = '1px';
                    container.style.height = '1px';
                    container.style.overflow = 'hidden';
                    container.style.pointerEvents = 'none';
                    document.body.appendChild(container);
                }
                
                const container = document.getElementById('gif-container');
                const img = document.createElement('img');
                // Don't use display:none or opacity:0 - they can prevent GIF animation
                // Position off-screen but keep it "visible" to the browser so it animates
                img.style.position = 'absolute';
                img.style.left = '-9999px';
                img.style.top = '-9999px';
                img.style.width = '1px';
                img.style.height = '1px';
                img.style.zIndex = '-1';
                
                // Add to DOM first so browser can animate it
                container.appendChild(img);
                
                img.onload = () => {
                    this.spriteCache.set(spritePath, img);
                    this.imgElements.set(spritePath, img);
                    resolve(img);
                };
                img.onerror = () => {
                    container.removeChild(img);
                    resolve(null);
                };
                // Set src after adding to DOM so browser can start animating
                img.src = spritePath;
            } else {
                // For non-GIF images, use regular Image object
                const img = new Image();
                img.onload = () => {
                    this.spriteCache.set(spritePath, img);
                    resolve(img);
                };
                img.onerror = () => {
                    resolve(null);
                };
                img.src = spritePath;
            }
        });
    }

    render(ctx, pokemon) {
        const { x, y } = pokemon.position;
        const size = pokemon.size;

        // For animated GIFs, use DOM img elements positioned over canvas
        // This allows the GIF to animate naturally
        if (pokemon.spritePath.endsWith('.gif')) {
            const sprite = this.spriteCache.get(pokemon.spritePath);
            if (sprite && this.imgElements.has(pokemon.spritePath)) {
                // Sprite loaded, render as DOM element
                this.renderGifAsElement(pokemon, x, y, size);
            } else {
                // Sprite not loaded yet, render placeholder on canvas
                this.renderPlaceholder(ctx, pokemon);
            }
        } else {
            // For non-GIF images, render to canvas normally
            const sprite = this.spriteCache.get(pokemon.spritePath);
            
            if (sprite) {
                ctx.save();
                ctx.translate(x, y);
                ctx.drawImage(
                    sprite,
                    -size / 2,
                    -size / 2,
                    size,
                    size
                );
                ctx.restore();
            } else {
                // Render placeholder
                this.renderPlaceholder(ctx, pokemon);
            }
        }
    }
    
    renderGifAsElement(pokemon, x, y, size) {
        // Get or create the img element for this Pokemon
        let imgElement = this.pokemonImgElements.get(pokemon.id);
        
        // Check if sprite is loaded
        const sprite = this.spriteCache.get(pokemon.spritePath);
        const sourceImg = this.imgElements.get(pokemon.spritePath);
        
        if (!sprite || !sourceImg) {
            // Sprite not loaded yet - don't create element, will be created once loaded
            // The sprite loader will eventually create it
            return;
        }
        
        if (!imgElement) {
            // Create a new img element positioned over the canvas
            const layer = document.getElementById('pokemon-gif-layer');
            if (!layer) return;
            
            imgElement = document.createElement('img');
            imgElement.src = pokemon.spritePath;
            imgElement.style.position = 'absolute';
            imgElement.style.width = size + 'px';
            imgElement.style.height = size + 'px';
            imgElement.style.pointerEvents = 'none';
            imgElement.style.imageRendering = 'pixelated'; // Keep sprite crisp
            imgElement.dataset.pokemonId = pokemon.id;
            
            layer.appendChild(imgElement);
            this.pokemonImgElements.set(pokemon.id, imgElement);
        }
        
        // Update position to match Pokemon position
        // x and y are canvas coordinates, position img element accordingly
        imgElement.style.left = (x - size / 2) + 'px';
        imgElement.style.top = (y - size / 2) + 'px';
        imgElement.style.width = size + 'px';
        imgElement.style.height = size + 'px';
    }
    
    removePokemonElement(pokemonId) {
        // Remove the DOM element when Pokemon is removed
        const imgElement = this.pokemonImgElements.get(pokemonId);
        if (imgElement) {
            imgElement.remove();
            this.pokemonImgElements.delete(pokemonId);
        }
    }

    renderPlaceholder(ctx, pokemon) {
        const { x, y } = pokemon.position;
        const size = pokemon.size;
        const color = pokemon.color;

        ctx.save();
        
        // Draw circle as placeholder
        ctx.beginPath();
        ctx.arc(x, y, size / 2, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw a simple face/expression
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(x - size / 6, y - size / 6, size / 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + size / 6, y - size / 6, size / 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, y + size / 8, size / 8, 0, Math.PI);
        ctx.stroke();

        ctx.restore();
    }

    renderInteractionEffect(ctx, pokemon1, pokemon2, interactionType) {
        const midX = (pokemon1.position.x + pokemon2.position.x) / 2;
        const midY = (pokemon1.position.y + pokemon2.position.y) / 2;

        ctx.save();
        ctx.globalAlpha = 0.6;

        // Draw interaction indicator
        switch(interactionType) {
            case 'play':
                // Draw playful circles
                ctx.strokeStyle = '#FFD700';
                ctx.lineWidth = 2;
                for (let i = 0; i < 3; i++) {
                    ctx.beginPath();
                    ctx.arc(midX, midY, 15 + i * 5, 0, Math.PI * 2);
                    ctx.stroke();
                }
                break;
            case 'rest':
                // Draw zzz effect
                ctx.fillStyle = '#87CEEB';
                ctx.font = '16px Arial';
                ctx.fillText('z', midX - 10, midY);
                ctx.fillText('z', midX, midY - 5);
                ctx.fillText('z', midX + 10, midY - 10);
                break;
            case 'follow':
                // Draw arrow
                ctx.strokeStyle = '#FF6B6B';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(pokemon1.position.x, pokemon1.position.y);
                ctx.lineTo(pokemon2.position.x, pokemon2.position.y);
                ctx.stroke();
                break;
            case 'group':
                // Draw connection lines
                ctx.strokeStyle = '#9B59B6';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(pokemon1.position.x, pokemon1.position.y);
                ctx.lineTo(pokemon2.position.x, pokemon2.position.y);
                ctx.stroke();
                break;
            case 'avoid':
                // Draw repulsion effect
                ctx.strokeStyle = '#E74C3C';
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.moveTo(pokemon1.position.x, pokemon1.position.y);
                ctx.lineTo(pokemon2.position.x, pokemon2.position.y);
                ctx.stroke();
                ctx.setLineDash([]);
                break;
        }

        ctx.restore();
    }

    preloadSprite(spritePath) {
        if (!this.spriteCache.has(spritePath)) {
            this.loadSprite(spritePath);
        }
    }
}

