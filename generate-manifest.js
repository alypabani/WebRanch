// Script to generate manifest.json from all GIF files in sprites directory
// Run this with: node generate-manifest.js

const fs = require('fs');
const path = require('path');

const spritesDir = path.join(__dirname, 'sprites');
const manifestPath = path.join(spritesDir, 'manifest.json');

try {
    // Read all files in sprites directory
    const files = fs.readdirSync(spritesDir);
    
    const sprites = [];
    
    files.forEach(file => {
        // Only include GIF files (ignore manifest.json)
        if (file.endsWith('.gif') && file !== 'manifest.json') {
            const filePath = `sprites/${file}`;
            
            // Extract name from filename
            // e.g., "pikachu.gif" -> "Pikachu"
            // e.g., "charizard-megax.gif" -> "Charizard Megax"
            // e.g., "eevee-gmax.gif" -> "Eevee Gmax"
            const nameWithoutExt = file.replace(/\.gif$/i, '');
            const name = nameWithoutExt
                .split('-')
                .map(word => {
                    // Handle special cases like "gmax", "mega", etc.
                    const upper = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
                    // Capitalize special abbreviations
                    if (upper === 'Gmax') return 'G-Max';
                    if (upper === 'Mega') return 'Mega';
                    if (upper === 'F') return '♀';
                    if (upper === 'M') return '♂';
                    return upper;
                })
                .join(' ');
            
            sprites.push({
                name: name,
                path: filePath
            });
        }
    });
    
    // Sort sprites alphabetically by name
    sprites.sort((a, b) => a.name.localeCompare(b.name));
    
    // Create manifest object
    const manifest = {
        sprites: sprites
    };
    
    // Write manifest file
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    
    console.log(`✅ Generated manifest.json with ${sprites.length} sprites!`);
    console.log(`   Manifest saved to: ${manifestPath}`);
    
} catch (error) {
    console.error('❌ Error generating manifest:', error);
    process.exit(1);
}

