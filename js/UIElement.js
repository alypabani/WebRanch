// Base class for UI elements that can be added to the ranch
class UIElement {
    constructor(id, type, x, y) {
        this.id = id;
        this.type = type; // 'timer', 'note'
        this.position = { x, y };
        this.width = 200;
        this.height = 150;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
    }

    startDrag(mouseX, mouseY) {
        this.isDragging = true;
        this.dragOffset.x = mouseX - this.position.x;
        this.dragOffset.y = mouseY - this.position.y;
    }

    updateDrag(mouseX, mouseY) {
        if (this.isDragging) {
            this.position.x = mouseX - this.dragOffset.x;
            this.position.y = mouseY - this.dragOffset.y;
            
            // Update input position if editing
            if (this.type === 'note') {
                this.updateInputPosition();
            }
        }
    }
    
    updateInputPosition() {
        // Base implementation - override in subclasses if needed
    }

    stopDrag() {
        this.isDragging = false;
    }

    isPointInside(x, y) {
        return x >= this.position.x &&
               x <= this.position.x + this.width &&
               y >= this.position.y &&
               y <= this.position.y + this.height;
    }

    render(ctx) {
        // Base rendering - override in subclasses
    }
}

// Timer element (Countdown Timer)
class TimerElement extends UIElement {
    constructor(id, x, y) {
        super(id, 'timer', x, y);
        this.setTime = 0; // Set time in milliseconds
        this.remainingTime = 0; // Remaining time in milliseconds
        this.isRunning = false;
        this.startTime = null;
        this.pausedTime = 0; // Time when paused
        this.isFinished = false;
        this.audio = null; // Audio element for jingle
        this.jinglePath = 'sounds/timer-jingle.MP3'; // Default path - user can add their jingle here
        this.width = 200;
        this.height = 140;
    }

    loadAudio() {
        if (!this.audio) {
            this.audio = new Audio(this.jinglePath);
            this.audio.volume = 0.7;
        }
    }

    start() {
        if (this.setTime <= 0) {
            // Can't start without setting time
            return;
        }
        if (!this.isRunning && !this.isFinished) {
            this.isRunning = true;
            if (this.pausedTime > 0) {
                // Resume from paused time
                this.startTime = Date.now() - (this.setTime - this.remainingTime);
            } else {
                // Start from set time
                this.startTime = Date.now();
                this.remainingTime = this.setTime;
            }
            this.isFinished = false;
        }
    }

    stop() {
        if (this.isRunning) {
            this.isRunning = false;
            this.pausedTime = this.remainingTime;
        }
    }

    reset() {
        this.isRunning = false;
        this.isFinished = false;
        this.remainingTime = this.setTime;
        this.pausedTime = 0;
        this.startTime = null;
        if (this.audio) {
            this.audio.pause();
            this.audio.currentTime = 0;
        }
    }

    setTimerTime(minutes, seconds) {
        this.setTime = (minutes * 60 + seconds) * 1000;
        this.remainingTime = this.setTime;
        this.reset();
    }

    getRemainingTime() {
        if (this.isFinished) {
            return 0;
        }
        if (this.isRunning && this.startTime) {
            const elapsed = Date.now() - this.startTime;
            this.remainingTime = Math.max(0, this.setTime - elapsed);
            
            // Check if timer finished
            if (this.remainingTime <= 0 && !this.isFinished) {
                this.isFinished = true;
                this.isRunning = false;
                this.remainingTime = 0;
                this.playJingle();
            }
            return this.remainingTime;
        }
        return this.pausedTime > 0 ? this.pausedTime : this.remainingTime;
    }

    playJingle() {
        this.loadAudio();
        if (this.audio) {
            this.audio.play().catch(err => {
                console.log('Could not play timer jingle:', err);
            });
        }
    }

    formatTime(ms) {
        const totalSeconds = Math.max(0, Math.floor(ms / 1000));
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    startSettingTime(canvas) {
        if (this.isRunning) return;
        
        const currentValue = this.setTime > 0 ? this.formatTime(this.setTime) : '00:00';
        const input = prompt('Set timer (format: MM:SS)', currentValue);
        
        if (input !== null && input.trim()) {
            const value = input.trim();
            const timeMatch = value.match(/^(\d{1,2}):(\d{2})$/);
            if (timeMatch) {
                const minutes = parseInt(timeMatch[1]);
                const seconds = parseInt(timeMatch[2]);
                if (minutes >= 0 && seconds >= 0 && seconds < 60) {
                    this.setTimerTime(minutes, seconds);
                    window.dispatchEvent(new CustomEvent('timerUpdated'));
                } else {
                    alert('Invalid time format. Use MM:SS (e.g., 05:30)');
                }
            } else {
                alert('Invalid time format. Use MM:SS (e.g., 05:30)');
            }
        }
    }

    render(ctx) {
        const time = this.getRemainingTime();
        const timeString = this.formatTime(time);

        // Draw background - flash red if finished
        if (this.isFinished) {
            const flash = Math.sin(Date.now() / 100) > 0;
            ctx.fillStyle = flash ? 'rgba(255, 200, 200, 0.95)' : 'rgba(255, 255, 255, 0.95)';
        } else {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        }
        ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
        
        // Draw border - red if finished
        ctx.strokeStyle = this.isFinished ? '#f44336' : '#333';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.position.x, this.position.y, this.width, this.height);

        // Draw title
        ctx.fillStyle = this.isFinished ? '#f44336' : '#333';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Countdown Timer', this.position.x + this.width / 2, this.position.y + 20);

        // Draw time - larger and red if finished
        ctx.fillStyle = this.isFinished ? '#f44336' : '#333';
        ctx.font = 'bold 24px monospace';
        ctx.fillText(timeString, this.position.x + this.width / 2, this.position.y + 55);

        // Draw "Set Time" button or "Finished!" message
        if (this.isFinished) {
            ctx.fillStyle = '#f44336';
            ctx.font = '12px Arial';
            ctx.fillText('Finished!', this.position.x + this.width / 2, this.position.y + 75);
        } else {
            // Draw "Set Time" button
            ctx.fillStyle = '#2196F3';
            ctx.fillRect(this.position.x + 10, this.position.y + 70, 70, 25);
            ctx.fillStyle = 'white';
            ctx.font = '12px Arial';
            ctx.fillText('Set Time', this.position.x + 45, this.position.y + 87);
        }

        // Draw Start/Stop button
        if (!this.isFinished) {
            ctx.fillStyle = this.isRunning ? '#f44336' : '#4CAF50';
            ctx.fillRect(this.position.x + 90, this.position.y + 70, 50, 25);
            ctx.fillStyle = 'white';
            ctx.font = '12px Arial';
            ctx.fillText(this.isRunning ? 'Stop' : 'Start', this.position.x + 115, this.position.y + 87);
        }

        // Draw Reset button
        ctx.fillStyle = '#ff9800';
        ctx.fillRect(this.position.x + 150, this.position.y + 70, 40, 25);
        ctx.fillStyle = 'white';
        ctx.fillText('Reset', this.position.x + 170, this.position.y + 87);

        // Draw remove button (X) in top-right corner
        ctx.fillStyle = '#f44336';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('×', this.position.x + this.width - 10, this.position.y + 15);

        // Draw hint if no time set
        if (this.setTime === 0 && !this.isSettingTime) {
            ctx.fillStyle = '#999';
            ctx.font = '10px Arial';
            ctx.fillText('Click "Set Time"', this.position.x + this.width / 2, this.position.y + this.height - 10);
        }
    }

    handleClick(x, y, canvas) {
        const relX = x - this.position.x;
        const relY = y - this.position.y;

        // Remove button (X) - check first, highest priority
        if (relX >= this.width - 20 && relX <= this.width && relY >= 0 && relY <= 20) {
            window.dispatchEvent(new CustomEvent('removeUIElement', { detail: { id: this.id } }));
            return true;
        }

        // Set Time button
        if (relX >= 10 && relX <= 80 && relY >= 70 && relY <= 95 && !this.isFinished) {
            this.startSettingTime(canvas);
            return true;
        }

        // Start/Stop button
        if (relX >= 90 && relX <= 140 && relY >= 70 && relY <= 95 && !this.isFinished) {
            if (this.isRunning) {
                this.stop();
            } else {
                this.start();
            }
            return true;
        }

        // Reset button
        if (relX >= 150 && relX <= 190 && relY >= 70 && relY <= 95) {
            this.reset();
            return true;
        }

        // Click on time display to set time
        if (relX >= 10 && relX <= this.width - 10 && relY >= 30 && relY <= 65 && !this.isFinished && !this.isRunning) {
            this.startSettingTime(canvas);
            return true;
        }

        return false;
    }
}

// Note element
class NoteElement extends UIElement {
    constructor(id, x, y) {
        super(id, 'note', x, y);
        this.text = 'Click to edit';
        this.width = 250;
        this.height = 200;
        this.textElement = null;
        this.canvasRef = null;
        this.container = null;
        this.color = '#fffacd'; // Default yellow sticky note color
        this.colors = ['#fffacd', '#ffb3ba', '#bae1ff', '#baffc9', '#ffffba', '#ffdfba']; // Yellow, Pink, Blue, Green, Light Yellow, Peach
        this.isResizing = false;
        this.resizeHandleSize = 10;
        this.minWidth = 150;
        this.minHeight = 100;
    }

    getColorName() {
        const colorMap = {
            '#fffacd': 'Yellow',
            '#ffb3ba': 'Pink',
            '#bae1ff': 'Blue',
            '#baffc9': 'Green',
            '#ffffba': 'Light Yellow',
            '#ffdfba': 'Peach'
        };
        return colorMap[this.color] || 'Yellow';
    }

    cycleColor() {
        const currentIndex = this.colors.indexOf(this.color);
        const nextIndex = (currentIndex + 1) % this.colors.length;
        this.color = this.colors[nextIndex];
        window.dispatchEvent(new CustomEvent('noteUpdated'));
    }

    initializeEditable(canvas) {
        if (this.textElement) return; // Already initialized

        this.canvasRef = canvas;
        
        // Create container for the editable area
        this.container = document.createElement('div');
        this.container.style.position = 'absolute';
        this.container.style.pointerEvents = 'none'; // Allow clicks to pass through when not editing
        this.container.style.zIndex = '1000';
        
        // Create contenteditable text area
        this.textElement = document.createElement('div');
        this.textElement.contentEditable = true;
        this.textElement.textContent = this.text === 'Click to edit' ? '' : this.text;
        this.textElement.style.position = 'absolute';
        this.textElement.style.width = (this.width - 20) + 'px';
        this.textElement.style.height = (this.height - 60) + 'px';
        this.textElement.style.fontSize = '12px';
        this.textElement.style.fontFamily = 'Arial';
        this.textElement.style.border = 'none';
        this.textElement.style.outline = 'none';
        this.textElement.style.padding = '5px';
        this.textElement.style.backgroundColor = 'transparent';
        this.textElement.style.color = '#333';
        this.textElement.style.overflow = 'auto';
        this.textElement.style.resize = 'none';
        this.textElement.style.pointerEvents = 'auto';
        this.textElement.style.cursor = 'text';
        this.textElement.style.minHeight = '20px';

        this.container.appendChild(this.textElement);
        document.body.appendChild(this.container);

        // Update text on input
        this.textElement.addEventListener('input', () => {
            this.text = this.textElement.textContent || 'Click to edit';
            window.dispatchEvent(new CustomEvent('noteUpdated'));
        });

        // Update text on blur
        this.textElement.addEventListener('blur', () => {
            this.text = this.textElement.textContent.trim() || 'Click to edit';
            this.container.style.pointerEvents = 'none'; // Disable editing
            window.dispatchEvent(new CustomEvent('noteUpdated'));
        });

        // Prevent drag when clicking on text
        this.textElement.addEventListener('mousedown', (e) => {
            e.stopPropagation();
        });

        this.updateTextPosition();
    }

    updateTextPosition() {
        if (this.container && this.canvasRef) {
            const rect = this.canvasRef.getBoundingClientRect();
            this.container.style.left = (rect.left + this.position.x + 10) + 'px';
            this.container.style.top = (rect.top + this.position.y + 40) + 'px';
            this.textElement.style.width = (this.width - 20) + 'px';
            this.textElement.style.height = (this.height - 60) + 'px';
        }
    }

    isPointInResizeHandle(x, y) {
        const relX = x - this.position.x;
        const relY = y - this.position.y;
        // Bottom-right corner resize handle
        return relX >= this.width - this.resizeHandleSize && 
               relX <= this.width &&
               relY >= this.height - this.resizeHandleSize && 
               relY <= this.height;
    }

    render(ctx) {
        // Draw background with selected color
        ctx.fillStyle = this.color;
        ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
        
        // Draw border
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.position.x, this.position.y, this.width, this.height);

        // Draw title with color name
        ctx.fillStyle = '#333';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.getColorName(), this.position.x + this.width / 2, this.position.y + 20);

        // Draw placeholder text if empty
        if (!this.text || this.text === 'Click to edit') {
            ctx.fillStyle = '#999';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Click to edit, double-click to change color', this.position.x + this.width / 2, this.position.y + this.height - 30);
        }

        // Draw remove button (X) in top-right corner
        ctx.fillStyle = '#f44336';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('×', this.position.x + this.width - 10, this.position.y + 15);

        // Draw resize handle (bottom-right corner)
        ctx.fillStyle = '#666';
        ctx.fillRect(
            this.position.x + this.width - this.resizeHandleSize,
            this.position.y + this.height - this.resizeHandleSize,
            this.resizeHandleSize,
            this.resizeHandleSize
        );
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.strokeRect(
            this.position.x + this.width - this.resizeHandleSize,
            this.position.y + this.height - this.resizeHandleSize,
            this.resizeHandleSize,
            this.resizeHandleSize
        );

        // Initialize editable element if canvas is available
        if (this.canvasRef) {
            this.updateTextPosition();
        }
    }

    handleClick(x, y, canvas) {
        const relX = x - this.position.x;
        const relY = y - this.position.y;

        // Remove button (X) - check first, highest priority
        if (relX >= this.width - 20 && relX <= this.width && relY >= 0 && relY <= 20) {
            // Clean up editable elements
            if (this.container) {
                this.container.remove();
                this.container = null;
                this.textElement = null;
            }
            window.dispatchEvent(new CustomEvent('removeUIElement', { detail: { id: this.id } }));
            return true;
        }

        // Check for resize handle
        if (this.isPointInResizeHandle(x, y)) {
            this.isResizing = true;
            return true;
        }

        // Click on title area to change color (double-click handled separately)
        if (relX >= 10 && relX <= this.width - 20 && 
            relY >= 10 && relY <= 30) {
            // Could add single-click color change here if desired
            return false;
        }

        // Click anywhere in the note area (except title and resize handle) to edit
        if (relX >= 10 && relX <= this.width - this.resizeHandleSize && 
            relY >= 35 && relY <= this.height - this.resizeHandleSize) {
            this.initializeEditable(canvas);
            this.container.style.pointerEvents = 'auto'; // Enable editing
            setTimeout(() => {
                this.textElement.focus();
                // Place cursor at end
                const range = document.createRange();
                const sel = window.getSelection();
                range.selectNodeContents(this.textElement);
                range.collapse(false);
                sel.removeAllRanges();
                sel.addRange(range);
            }, 10);
            return true;
        }

        return false;
    }

    handleResize(mouseX, mouseY) {
        if (!this.isResizing) return;

        const newWidth = Math.max(this.minWidth, mouseX - this.position.x);
        const newHeight = Math.max(this.minHeight, mouseY - this.position.y);
        
        this.width = newWidth;
        this.height = newHeight;
        
        this.updateTextPosition();
    }

    stopResize() {
        this.isResizing = false;
    }

    updateInputPosition() {
        this.updateTextPosition();
    }
}

