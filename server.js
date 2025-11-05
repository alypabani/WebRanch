// Production server implementation for serving sprite list
// This server automatically detects and serves available sprites

const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static('.'));

// API endpoint to get available sprites
app.get('/api/sprites', (req, res) => {
    const spritesDir = path.join(__dirname, 'sprites');
    const sprites = [];

    try {
        // Read all files in sprites directory
        const files = fs.readdirSync(spritesDir);
        
        files.forEach(file => {
            // Check if it's an image file (supports GIF, PNG, JPG, JPEG)
            if (/\.(png|jpg|jpeg|gif)$/i.test(file)) {
                const filePath = `sprites/${file}`;
                const name = file
                    .replace(/\.(png|jpg|jpeg|gif)$/i, '')
                    .split('-')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');
                
                sprites.push({
                    name: name,
                    path: filePath
                });
            }
        });

        res.json({ sprites: sprites });
    } catch (error) {
        console.error('Error reading sprites directory:', error);
        res.status(500).json({ error: 'Failed to read sprites' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Sprite API available at http://localhost:${PORT}/api/sprites`);
});

