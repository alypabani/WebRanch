class InteractionSystem {
    constructor() {
        this.interactionTypes = ['play', 'rest', 'follow', 'group', 'avoid'];
        this.activeInteractions = new Map();
        this.interactionDurations = {
            'play': 3000,
            'rest': 4000,
            'follow': 5000,
            'group': 3500,
            'avoid': 2000
        };
    }

    update(allPokemon, deltaTime, behaviorSystem, spriteRenderer, canvas) {
        // Update existing interactions
        this.updateActiveInteractions(allPokemon, deltaTime, behaviorSystem);

        // Check for new interaction opportunities
        this.checkForNewInteractions(allPokemon, behaviorSystem);
    }

    updateActiveInteractions(allPokemon, deltaTime, behaviorSystem) {
        const interactionsToRemove = [];

        this.activeInteractions.forEach((interaction, key) => {
            const pokemon1 = interaction.pokemon1;
            const pokemon2 = interaction.pokemon2;
            const elapsed = Date.now() - interaction.startTime;

            if (elapsed >= interaction.duration) {
                // End interaction
                pokemon1.endInteraction();
                pokemon2.endInteraction();
                interactionsToRemove.push(key);
            } else {
                // Continue interaction behavior
                this.executeInteraction(interaction, behaviorSystem);
            }
        });

        interactionsToRemove.forEach(key => this.activeInteractions.delete(key));
    }

    checkForNewInteractions(allPokemon, behaviorSystem) {
        for (let i = 0; i < allPokemon.length; i++) {
            for (let j = i + 1; j < allPokemon.length; j++) {
                const pokemon1 = allPokemon[i];
                const pokemon2 = allPokemon[j];

                // Skip if either Pokemon is unavailable
                if (!pokemon1.isAvailableForInteraction() || !pokemon2.isAvailableForInteraction()) {
                    continue;
                }

                // Check if already interacting with each other
                const interactionKey = this.getInteractionKey(pokemon1, pokemon2);
                if (this.activeInteractions.has(interactionKey)) {
                    continue;
                }

                // Check proximity
                const distance = pokemon1.getDistanceTo(pokemon2);
                const interactionRadius = pokemon1.getInteractionRadius();

                if (distance < interactionRadius && Math.random() < 0.01) {
                    // Random chance to start interaction
                    const interactionType = this.selectRandomInteraction();
                    this.startInteraction(pokemon1, pokemon2, interactionType);
                }
            }
        }
    }

    selectRandomInteraction() {
        return this.interactionTypes[Math.floor(Math.random() * this.interactionTypes.length)];
    }

    startInteraction(pokemon1, pokemon2, interactionType) {
        pokemon1.startInteraction(interactionType, pokemon2);
        pokemon2.startInteraction(interactionType, pokemon1);

        const interactionKey = this.getInteractionKey(pokemon1, pokemon2);
        this.activeInteractions.set(interactionKey, {
            pokemon1,
            pokemon2,
            type: interactionType,
            startTime: Date.now(),
            duration: this.interactionDurations[interactionType]
        });
    }

    executeInteraction(interaction, behaviorSystem) {
        const { pokemon1, pokemon2, type } = interaction;

        switch (type) {
            case 'play':
                // Move in playful circular patterns
                const angle = (Date.now() - interaction.startTime) / 100;
                const radius = 40;
                const centerX = (pokemon1.position.x + pokemon2.position.x) / 2;
                const centerY = (pokemon1.position.y + pokemon2.position.y) / 2;
                
                pokemon1.position.x = centerX + Math.cos(angle) * radius;
                pokemon1.position.y = centerY + Math.sin(angle) * radius;
                pokemon2.position.x = centerX + Math.cos(angle + Math.PI) * radius;
                pokemon2.position.y = centerY + Math.sin(angle + Math.PI) * radius;
                break;

            case 'rest':
                // Stop moving and stay close
                pokemon1.velocity.x = 0;
                pokemon1.velocity.y = 0;
                pokemon2.velocity.x = 0;
                pokemon2.velocity.y = 0;
                break;

            case 'follow':
                // pokemon1 follows pokemon2
                behaviorSystem.seek(pokemon1, pokemon2.position, 0.5);
                // pokemon2 moves slowly
                if (Math.random() < 0.1) {
                    const angle = Math.random() * Math.PI * 2;
                    pokemon2.velocity.x = Math.cos(angle) * 20;
                    pokemon2.velocity.y = Math.sin(angle) * 20;
                }
                break;

            case 'group':
                // Move toward each other and stay close
                behaviorSystem.seek(pokemon1, pokemon2.position, 0.3);
                behaviorSystem.seek(pokemon2, pokemon1.position, 0.3);
                break;

            case 'avoid':
                // Move away from each other
                behaviorSystem.flee(pokemon1, pokemon2.position, 0.8);
                behaviorSystem.flee(pokemon2, pokemon1.position, 0.8);
                break;
        }
    }

    getInteractionKey(pokemon1, pokemon2) {
        // Create unique key for interaction pair
        const ids = [pokemon1.id, pokemon2.id].sort();
        return `${ids[0]}-${ids[1]}`;
    }

    getActiveInteractions() {
        return Array.from(this.activeInteractions.values());
    }

    renderInteractionEffects(ctx, spriteRenderer) {
        this.activeInteractions.forEach((interaction) => {
            spriteRenderer.renderInteractionEffect(
                ctx,
                interaction.pokemon1,
                interaction.pokemon2,
                interaction.type
            );
        });
    }
}

