class SpriteRenderer {
    constructor() {
        this.spriteCache = new Map();
        this.placeholderSize = 30;
        // Keep img elements in DOM for animated GIFs to work properly
        this.imgElements = new Map();
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
                img.style.display = 'none';
                
                img.onload = () => {
                    this.spriteCache.set(spritePath, img);
                    this.imgElements.set(spritePath, img);
                    container.appendChild(img);
                    resolve(img);
                };
                img.onerror = () => {
                    resolve(null);
                };
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

        // Try to load and render sprite if available
        const sprite = this.spriteCache.get(pokemon.spritePath);
        
        if (sprite) {
            // For animated GIFs, use the img element from DOM (which animates)
            // For static images, use the cached sprite
            let imgToDraw = sprite;
            if (pokemon.spritePath.endsWith('.gif') && this.imgElements.has(pokemon.spritePath)) {
                imgToDraw = this.imgElements.get(pokemon.spritePath);
            }
            
            // Render loaded sprite (supports animated GIFs)
            ctx.save();
            ctx.translate(x, y);
            
            // Draw sprite centered
            // For animated GIFs, drawing from a DOM img element allows animation
            ctx.drawImage(
                imgToDraw,
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
        
        // Names are not displayed in the ranch
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

