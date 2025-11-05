# Pokemon Ranch Web Game

A web-based Pokemon ranch game where Pokemon sprites autonomously move and interact with each other, similar to My Pokemon Ranch for the Wii.

## Features

- **Autonomous Behavior**: Pokemon move around independently with random walk patterns
- **Interactions**: Pokemon can interact with each other through 5 different interaction types:
  - **Play**: Pokemon move together in playful circular patterns
  - **Rest**: Pokemon stop and rest near each other
  - **Follow**: One Pokemon follows another
  - **Group**: Multiple Pokemon form temporary clusters
  - **Avoid**: Pokemon move away from each other (personal space)
- **Pokemon Management**: Add up to 25 Pokemon and select them to observe
- **Visual Feedback**: Color-coded placeholders and interaction effects
- **Sprite Support**: Ready for sprite images (uses placeholders until sprites are added)

## Getting Started

### Local Development

1. Clone or download this repository
2. Open `index.html` in a web browser
3. Start adding Pokemon!

### Adding Pokemon

1. Select a Pokemon sprite from the dropdown menu
2. Click "Add Pokemon" button
3. The Pokemon will appear in the ranch and start moving autonomously
4. The Pokemon name is automatically derived from the sprite filename

### Selecting Pokemon

- Click on a Pokemon in the roster list on the left panel
- Or click directly on a Pokemon in the canvas
- Selected Pokemon will be highlighted with a golden ring

### Removing Pokemon

- Click the "×" button next to a Pokemon in the roster list

## Sprite System

The game automatically detects and loads available sprites. The system tries three methods in order:

### Method 1: Server-Side API (Recommended)
If you have a server, create an endpoint at `/api/sprites` that returns:
```json
{
  "sprites": [
    { "name": "Pikachu", "path": "sprites/pikachu.png" },
    { "name": "Charizard", "path": "sprites/charizard.png" }
  ]
}
```

See `server-example.js` for a Node.js/Express implementation.

### Method 2: Manifest File
Create a `sprites/manifest.json` file listing your sprites:
```json
{
  "sprites": [
    { "name": "Pikachu", "path": "sprites/pikachu.png" },
    { "name": "Charizard", "path": "sprites/charizard.png" }
  ]
}
```

### Method 3: Auto-Detection (Fallback)
If neither server nor manifest is available, the game will attempt to detect common Pokemon sprites in the `sprites/` directory.

### Adding Sprites
1. Place your sprite images in the `sprites/` directory
2. Either:
   - Update the manifest file with your sprites
   - Or set up the server endpoint to scan the directory automatically
3. The sprite dropdown will populate with available sprites
4. If a sprite fails to load, the game will use a colorful placeholder circle

## File Structure

```
WebRanch/
├── index.html              # Main entry point
├── css/
│   └── style.css           # UI styling
├── js/
│   ├── main.js             # Game initialization and main loop
│   ├── Pokemon.js           # Pokemon class with state and behavior
│   ├── SpriteRenderer.js   # Handles sprite loading and animation
│   ├── BehaviorSystem.js   # Autonomous movement and AI
│   ├── InteractionSystem.js # Manages Pokemon-to-Pokemon interactions
│   └── UIManager.js        # Handles UI controls for adding/selecting Pokemon
├── sprites/                # Directory for Pokemon sprites
│   └── manifest.json       # Optional sprite manifest file
├── server-example.js       # Example server implementation (optional)
└── README.md               # This file
```

## Deployment

This is a static web application that can be deployed to any hosting service. See **[DEPLOYMENT.md](DEPLOYMENT.md)** for detailed instructions.

### Quick Deploy Options:

**Static Site (No Server):**
- **GitHub Pages**: Push to a GitHub repository and enable Pages
- **Netlify**: Drag and drop the folder or connect a Git repository
- **Vercel**: Deploy via CLI or GitHub integration
- **Render Static**: Free static site hosting
- **DigitalOcean App Platform**: Static site option

**With Server (API Endpoint):**
- **Render**: Free tier available (sleeps after inactivity)
- **DigitalOcean App Platform**: $5/month for reliable hosting
- **DigitalOcean Droplet**: $6/month for full VPS control

See [DEPLOYMENT.md](DEPLOYMENT.md) for step-by-step instructions for Render and DigitalOcean.

## Technical Details

- **Technology**: Vanilla JavaScript, HTML5 Canvas, CSS3
- **No Dependencies**: Pure JavaScript, no frameworks or libraries required
- **Performance**: Optimized for 5-25 Pokemon with efficient interaction detection
- **Browser Compatibility**: Works in all modern browsers that support Canvas API

## Future Enhancements

- Sprite sheet animation support
- Sound effects
- Camera/zoom controls
- More interaction types
- Pokemon statistics and history
- Save/load functionality

## License

Feel free to use and modify this project as you wish!

