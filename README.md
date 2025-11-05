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

1. Enter a Pokemon name in the "Pokemon name" field
2. (Optional) Enter a sprite path in the "Sprite path" field, or leave blank to use default path
3. Click "Add Pokemon" button
4. The Pokemon will appear in the ranch and start moving autonomously

### Selecting Pokemon

- Click on a Pokemon in the roster list on the left panel
- Or click directly on a Pokemon in the canvas
- Selected Pokemon will be highlighted with a golden ring

### Removing Pokemon

- Click the "×" button next to a Pokemon in the roster list

## Sprite System

The game is ready for sprite images. To add sprites:

1. Place your sprite images in the `sprites/` directory
2. When adding a Pokemon, specify the sprite path (e.g., `sprites/pikachu.png`)
3. If no sprite path is provided, the game will try to load `sprites/{pokemon_name}.png`
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
├── sprites/                # Directory for Pokemon sprites (add your sprites here)
└── README.md               # This file
```

## Deployment

This is a static web application that can be deployed to any free hosting service:

- **GitHub Pages**: Push to a GitHub repository and enable Pages
- **Netlify**: Drag and drop the folder or connect a Git repository
- **Vercel**: Deploy via CLI or GitHub integration

No server-side code is required - everything runs in the browser!

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

