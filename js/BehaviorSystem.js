class BehaviorSystem {
    constructor() {
        this.maxSpeed = 100; // pixels per second
        this.randomWalkInterval = 1000; // milliseconds (reduced from 2000 for more frequent decisions)
    }

    update(pokemon, deltaTime, canvasWidth, canvasHeight, allPokemon, uiElements) {
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

        // UI element avoidance
        if (uiElements) {
            this.avoidUIElements(pokemon, uiElements);
        }

        // Apply velocity limits
        const speed = Math.sqrt(pokemon.velocity.x ** 2 + pokemon.velocity.y ** 2);
        if (speed > this.maxSpeed) {
            pokemon.velocity.x = (pokemon.velocity.x / speed) * this.maxSpeed;
            pokemon.velocity.y = (pokemon.velocity.y / speed) * this.maxSpeed;
        }
    }

    randomWalk(pokemon, canvasWidth, canvasHeight) {
        // Random chance to start moving (increased from 0.3 to 0.7 for more frequent movement)
        if (Math.random() < 0.7) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 50 + Math.random() * 50; // Speed range: 50-100 pixels per second
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

    avoidUIElements(pokemon, uiElements) {
        const turnForce = 200;
        const avoidanceRadius = 80; // Start avoiding when this close
        const pokemonRadius = pokemon.size / 2;
        
        uiElements.forEach(element => {
            // Get bounding box of UI element
            const left = element.position.x;
            const right = element.position.x + element.width;
            const top = element.position.y;
            const bottom = element.position.y + element.height;

            const px = pokemon.position.x;
            const py = pokemon.position.y;

            // Find closest point on rectangle to Pokemon center
            const closestX = Math.max(left, Math.min(px, right));
            const closestY = Math.max(top, Math.min(py, bottom));

            // Calculate distance from Pokemon center to closest point
            const dx = px - closestX;
            const dy = py - closestY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // If Pokemon is within avoidance radius (not just touching)
            if (distance < avoidanceRadius + pokemonRadius) {
                // Calculate repulsion force (stronger when closer)
                const overlap = (avoidanceRadius + pokemonRadius) - distance;
                const strength = Math.max(0, overlap / avoidanceRadius);
                
                if (distance > 0) {
                    // Normalize direction
                    const normalX = dx / distance;
                    const normalY = dy / distance;
                    
                    // Apply repulsion force
                    const force = turnForce * strength;
                    pokemon.velocity.x += normalX * force;
                    pokemon.velocity.y += normalY * force;
                }
            }
        });
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

