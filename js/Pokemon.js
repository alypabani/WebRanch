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
        this.size = 32; // Size matches sprite dimensions (32px)
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

    update(deltaTime, canvasWidth, canvasHeight, allPokemon) {
        // Update interaction cooldown (deltaTime is in seconds, cooldown in milliseconds)
        if (this.interactionCooldown > 0) {
            this.interactionCooldown -= deltaTime * 1000;
        }

        // If currently in an interaction, behavior is handled by InteractionSystem
        if (this.state === 'interacting' && this.currentInteraction) {
            return;
        }

        // Update position based on velocity
        this.position.x += this.velocity.x * deltaTime;
        this.position.y += this.velocity.y * deltaTime;

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

