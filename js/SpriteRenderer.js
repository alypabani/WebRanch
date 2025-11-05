class SpriteRenderer {
    constructor() {
        this.spriteCache = new Map();
        this.placeholderSize = 30;
    }

    async loadSprite(spritePath) {
        if (this.spriteCache.has(spritePath)) {
            return this.spriteCache.get(spritePath);
        }

        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                this.spriteCache.set(spritePath, img);
                resolve(img);
            };
            img.onerror = () => {
                // Sprite failed to load, return null to use placeholder
                resolve(null);
            };
            img.src = spritePath;
            // Note: Animated GIFs are supported - the browser handles animation automatically
            // The canvas will redraw on each frame, so GIF animations will play
        });
    }

    render(ctx, pokemon) {
        const { x, y } = pokemon.position;
        const size = pokemon.size;

        // Try to load and render sprite if available
        const sprite = this.spriteCache.get(pokemon.spritePath);
        
        if (sprite) {
            // Render loaded sprite (supports animated GIFs - animation plays automatically)
            ctx.save();
            ctx.translate(x, y);
            
            // Draw sprite centered
            // Animated GIFs will animate automatically when drawn to canvas
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

        // Draw name label below sprite
        ctx.save();
        ctx.font = '12px Arial';
        ctx.fillStyle = '#333';
        ctx.textAlign = 'center';
        ctx.fillText(pokemon.name, x, y + size + 15);
        ctx.restore();
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

