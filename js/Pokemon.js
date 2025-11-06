class Pokemon {
    constructor(id, name, spritePath, x, y) {
        this.id = id;
        this.name = name;
        this.spritePath = spritePath;
        this.position = { x, y };
        this.velocity = { x: 0, y: 0 };
        this.state = 'idle'; // idle, moving, interacting
        this.currentInteraction = null;
        this.interactionCooldown = 0;
        this.targetPosition = null;
        this.idleTimer = 0;
        this.color = this.generateColor();
        this.size = 56; // Size between 48px and 64px
    }

    generateColor() {
        // Generate a color based on the Pokemon name for visual distinction
        let hash = 0;
        for (let i = 0; i < this.name.length; i++) {
            hash = this.name.charCodeAt(i) + ((hash << 5) - hash);
        }
        const hue = Math.abs(hash % 360);
        return `hsl(${hue}, 70%, 60%)`;
    }

    update(deltaTime, canvasWidth, canvasHeight, allPokemon, uiElements) {
        // Update interaction cooldown (deltaTime is in seconds, cooldown in milliseconds)
        if (this.interactionCooldown > 0) {
            this.interactionCooldown -= deltaTime * 1000;
        }

        // If currently in an interaction, behavior is handled by InteractionSystem
        if (this.state === 'interacting' && this.currentInteraction) {
            return;
        }

        // Update position based on velocity
        let newX = this.position.x + this.velocity.x * deltaTime;
        let newY = this.position.y + this.velocity.y * deltaTime;

        // Check collision with UI elements and resolve
        if (uiElements && uiElements.length > 0) {
            const pokemonRadius = this.size / 2;
            
            for (const element of uiElements) {
                const left = element.position.x;
                const right = element.position.x + element.width;
                const top = element.position.y;
                const bottom = element.position.y + element.height;

                // Find closest point on rectangle to Pokemon center
                const closestX = Math.max(left, Math.min(newX, right));
                const closestY = Math.max(top, Math.min(newY, bottom));

                // Calculate distance from Pokemon center to closest point
                const dx = newX - closestX;
                const dy = newY - closestY;
                const distance = Math.sqrt(dx * dx + dy * dy);

                // Check if Pokemon (circle) overlaps with rectangle
                if (distance < pokemonRadius) {
                    // Collision detected - push Pokemon out
                    if (distance > 0) {
                        // Push Pokemon away from the closest point
                        const pushDistance = pokemonRadius - distance + 1; // +1 to ensure separation
                        newX = newX + (dx / distance) * pushDistance;
                        newY = newY + (dy / distance) * pushDistance;
                        
                        // Calculate collision normal
                        const normalX = dx / distance;
                        const normalY = dy / distance;
                        
                        // Calculate bounce coefficient (0.8 = 80% of velocity retained, creates bounce)
                        const bounceCoefficient = 0.8;
                        
                        // Reflect velocity away from collision with bounce
                        const dot = this.velocity.x * normalX + this.velocity.y * normalY;
                        this.velocity.x -= (1 + bounceCoefficient) * dot * normalX;
                        this.velocity.y -= (1 + bounceCoefficient) * dot * normalY;
                        
                        // Add extra bounce force perpendicular to surface for more visible effect
                        const bounceForce = 30;
                        this.velocity.x += normalX * bounceForce;
                        this.velocity.y += normalY * bounceForce;
                        
                        // Ensure minimum bounce velocity for visibility
                        const minBounceSpeed = 20;
                        const currentSpeed = Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2);
                        if (currentSpeed < minBounceSpeed && currentSpeed > 0) {
                            const speedMultiplier = minBounceSpeed / currentSpeed;
                            this.velocity.x *= speedMultiplier;
                            this.velocity.y *= speedMultiplier;
                        }
                    } else {
                        // If exactly at center, push in a random direction with bounce
                        const angle = Math.random() * Math.PI * 2;
                        const bounceSpeed = 40;
                        this.velocity.x = Math.cos(angle) * bounceSpeed;
                        this.velocity.y = Math.sin(angle) * bounceSpeed;
                        newX += Math.cos(angle) * pokemonRadius;
                        newY += Math.sin(angle) * pokemonRadius;
                    }
                }
            }
        }

        // Update position
        this.position.x = newX;
        this.position.y = newY;

        // Keep within canvas bounds
        this.position.x = Math.max(this.size, Math.min(canvasWidth - this.size, this.position.x));
        this.position.y = Math.max(this.size, Math.min(canvasHeight - this.size, this.position.y));

        // Apply friction
        this.velocity.x *= 0.95;
        this.velocity.y *= 0.95;

        // Stop if velocity is very small
        if (Math.abs(this.velocity.x) < 0.1 && Math.abs(this.velocity.y) < 0.1) {
            this.velocity.x = 0;
            this.velocity.y = 0;
        }
    }

    getInteractionRadius() {
        return 80; // Distance at which Pokemon can interact
    }

    getDistanceTo(other) {
        const dx = this.position.x - other.position.x;
        const dy = this.position.y - other.position.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    setVelocity(vx, vy) {
        this.velocity.x = vx;
        this.velocity.y = vy;
    }

    setState(newState) {
        this.state = newState;
    }

    startInteraction(interactionType, partner) {
        this.state = 'interacting';
        this.currentInteraction = {
            type: interactionType,
            partner: partner,
            startTime: Date.now()
        };
    }

    endInteraction() {
        this.state = 'idle';
        this.currentInteraction = null;
        this.interactionCooldown = 2000; // 2 second cooldown in milliseconds
    }

    isAvailableForInteraction() {
        return this.state !== 'interacting' && this.interactionCooldown <= 0;
    }
}

