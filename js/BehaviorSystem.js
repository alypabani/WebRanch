class BehaviorSystem {
    constructor() {
        this.maxSpeed = 50; // pixels per second
        this.randomWalkInterval = 2000; // milliseconds
    }

    update(pokemon, deltaTime, canvasWidth, canvasHeight, allPokemon) {
        // Skip behavior updates if Pokemon is in an interaction
        if (pokemon.state === 'interacting') {
            return;
        }

        // Random walk behavior (deltaTime is in seconds, idleTimer in milliseconds)
        if (pokemon.state === 'idle' || pokemon.idleTimer <= 0) {
            this.randomWalk(pokemon, canvasWidth, canvasHeight);
            pokemon.idleTimer = this.randomWalkInterval + Math.random() * 2000;
        } else {
            pokemon.idleTimer -= deltaTime * 1000;
        }

        // Edge avoidance
        this.avoidEdges(pokemon, canvasWidth, canvasHeight);

        // Apply velocity limits
        const speed = Math.sqrt(pokemon.velocity.x ** 2 + pokemon.velocity.y ** 2);
        if (speed > this.maxSpeed) {
            pokemon.velocity.x = (pokemon.velocity.x / speed) * this.maxSpeed;
            pokemon.velocity.y = (pokemon.velocity.y / speed) * this.maxSpeed;
        }
    }

    randomWalk(pokemon, canvasWidth, canvasHeight) {
        // Random chance to start moving
        if (Math.random() < 0.3) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 20 + Math.random() * 30;
            pokemon.velocity.x = Math.cos(angle) * speed;
            pokemon.velocity.y = Math.sin(angle) * speed;
            pokemon.setState('moving');
        } else {
            pokemon.setState('idle');
        }
    }

    avoidEdges(pokemon, canvasWidth, canvasHeight) {
        const margin = 50;
        const turnForce = 100;

        // Left edge
        if (pokemon.position.x < margin) {
            pokemon.velocity.x += turnForce;
        }
        // Right edge
        if (pokemon.position.x > canvasWidth - margin) {
            pokemon.velocity.x -= turnForce;
        }
        // Top edge
        if (pokemon.position.y < margin) {
            pokemon.velocity.y += turnForce;
        }
        // Bottom edge
        if (pokemon.position.y > canvasHeight - margin) {
            pokemon.velocity.y -= turnForce;
        }
    }

    seek(pokemon, target, strength = 1.0) {
        const dx = target.x - pokemon.position.x;
        const dy = target.y - pokemon.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
            const force = (this.maxSpeed * strength) / Math.max(distance, 1);
            pokemon.velocity.x += (dx / distance) * force;
            pokemon.velocity.y += (dy / distance) * force;
        }
    }

    flee(pokemon, target, strength = 1.0) {
        const dx = pokemon.position.x - target.x;
        const dy = pokemon.position.y - target.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
            const force = (this.maxSpeed * strength) / Math.max(distance, 1);
            pokemon.velocity.x += (dx / distance) * force;
            pokemon.velocity.y += (dy / distance) * force;
        }
    }
}

