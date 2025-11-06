// Base class for UI elements that can be added to the ranch
class UIElement {
    constructor(id, type, x, y) {
        this.id = id;
        this.type = type; // 'timer', 'note', 'todo'
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
            if (this.type === 'todo') {
                this.updateInputPosition();
            }
            if (this.type === 'note') {
                this.updateInputPosition();
            }
        }
    }
    
    updateInputPosition() {
        if (this.type === 'todo' && this.inputElement && this.canvasRef) {
            const startY = this.position.y + 40;
            const itemHeight = 25;
            const itemY = startY + (this.editingIndex >= 0 ? this.editingIndex * itemHeight : this.items.length * itemHeight);
            const textX = this.position.x + 30;
            
            this.inputElement.style.left = (this.canvasRef.getBoundingClientRect().left + textX) + 'px';
            this.inputElement.style.top = (this.canvasRef.getBoundingClientRect().top + itemY - 12) + 'px';
        }
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
        }
    }

    render(ctx) {
        // Draw background
        ctx.fillStyle = '#fffacd';
        ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
        
        // Draw border
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.position.x, this.position.y, this.width, this.height);

        // Draw title
        ctx.fillStyle = '#333';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Note', this.position.x + this.width / 2, this.position.y + 20);

        // Draw placeholder text if empty
        if (!this.text || this.text === 'Click to edit') {
            ctx.fillStyle = '#999';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Click to edit', this.position.x + this.width / 2, this.position.y + this.height - 10);
        }

        // Initialize editable element if canvas is available
        if (this.canvasRef) {
            this.updateTextPosition();
        }
    }

    handleClick(x, y, canvas) {
        const relX = x - this.position.x;
        const relY = y - this.position.y;

        // Click anywhere in the note area (except title area) to edit
        if (relX >= 10 && relX <= this.width - 10 && 
            relY >= 35 && relY <= this.height - 10) {
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

    updateInputPosition() {
        this.updateTextPosition();
    }
}

// To-do list element
class TodoListElement extends UIElement {
    constructor(id, x, y) {
        super(id, 'todo', x, y);
        this.items = [];
        this.width = 250;
        this.height = 300;
        this.textElements = new Map(); // Map of index to contenteditable div
        this.canvasRef = null;
        this.container = null;
    }

    initializeEditable(canvas) {
        if (this.container) return; // Already initialized

        this.canvasRef = canvas;
        this.container = document.createElement('div');
        this.container.style.position = 'absolute';
        this.container.style.pointerEvents = 'none'; // Allow clicks to pass through when not editing
        this.container.style.zIndex = '1000';
        document.body.appendChild(this.container);
        this.updateTextPositions();
    }

    updateTextPositions() {
        if (!this.container || !this.canvasRef) return;

        const rect = this.canvasRef.getBoundingClientRect();
        const startY = this.position.y + 40;
        const itemHeight = 25;

        this.items.forEach((item, index) => {
            let textElement = this.textElements.get(index);
            if (!textElement) {
                // Create contenteditable div for this item
                textElement = document.createElement('div');
                textElement.contentEditable = true;
                textElement.textContent = item.text;
                textElement.style.position = 'absolute';
                textElement.style.width = (this.width - 50) + 'px';
                textElement.style.height = '20px';
                textElement.style.fontSize = '12px';
                textElement.style.fontFamily = 'Arial';
                textElement.style.border = 'none';
                textElement.style.outline = 'none';
                textElement.style.padding = '2px 5px';
                textElement.style.backgroundColor = 'transparent';
                textElement.style.color = item.completed ? '#999' : '#333';
                textElement.style.textDecoration = item.completed ? 'line-through' : 'none';
                textElement.style.overflow = 'hidden';
                textElement.style.pointerEvents = 'auto';
                textElement.style.cursor = 'text';
                textElement.style.whiteSpace = 'nowrap';
                textElement.style.overflow = 'hidden';
                textElement.style.textOverflow = 'ellipsis';

                // Update item text on input
                textElement.addEventListener('input', () => {
                    item.text = textElement.textContent || '';
                    window.dispatchEvent(new CustomEvent('todoListUpdated'));
                });

                // Update item text on blur
                textElement.addEventListener('blur', () => {
                    item.text = textElement.textContent.trim() || 'New item';
                    if (!item.text || item.text === 'New item') {
                        item.text = 'New item';
                    }
                    this.container.style.pointerEvents = 'none'; // Disable editing
                    window.dispatchEvent(new CustomEvent('todoListUpdated'));
                });

                // Prevent drag when clicking on text
                textElement.addEventListener('mousedown', (e) => {
                    e.stopPropagation();
                });

                this.container.appendChild(textElement);
                this.textElements.set(index, textElement);
            }

            // Update position and styling
            const itemY = startY + (index * itemHeight);
            textElement.style.left = (rect.left + this.position.x + 30) + 'px';
            textElement.style.top = (rect.top + itemY - 12) + 'px';
            textElement.style.color = item.completed ? '#999' : '#333';
            textElement.style.textDecoration = item.completed ? 'line-through' : 'none';
            textElement.textContent = item.text;
        });

        // Remove text elements for items that no longer exist
        const indicesToRemove = [];
        this.textElements.forEach((element, index) => {
            if (index >= this.items.length) {
                element.remove();
                indicesToRemove.push(index);
            }
        });
        indicesToRemove.forEach(index => this.textElements.delete(index));
    }

    addItem(text) {
        if (text && text.trim()) {
            this.items.push({ text: text.trim(), completed: false });
        }
    }

    removeItem(index) {
        if (index >= 0 && index < this.items.length) {
            this.items.splice(index, 1);
        }
    }

    toggleItem(index) {
        if (index >= 0 && index < this.items.length) {
            this.items[index].completed = !this.items[index].completed;
        }
    }

    render(ctx) {
        // Draw background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
        
        // Draw border
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.position.x, this.position.y, this.width, this.height);

        // Draw title
        ctx.fillStyle = '#333';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('To-Do List', this.position.x + this.width / 2, this.position.y + 20);

        // Draw items
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        let y = this.position.y + 40;
        const itemHeight = 25;

        this.items.forEach((item, index) => {
            const itemY = y + (index * itemHeight);
            
            // Draw checkbox
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 1;
            ctx.strokeRect(this.position.x + 10, itemY - 12, 15, 15);
            
            if (item.completed) {
                ctx.fillStyle = '#4CAF50';
                ctx.fillRect(this.position.x + 10, itemY - 12, 15, 15);
                // Draw checkmark
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(this.position.x + 13, itemY - 7);
                ctx.lineTo(this.position.x + 17, itemY - 3);
                ctx.lineTo(this.position.x + 22, itemY - 10);
                ctx.stroke();
            }

            // Draw remove button (small X)
            ctx.fillStyle = '#f44336';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('×', this.position.x + this.width - 15, itemY);
        });

        // Update text element positions if canvas is available
        if (this.canvasRef) {
            this.updateTextPositions();
        }

        // Draw "Add item" hint
        if (this.items.length === 0) {
            ctx.fillStyle = '#999';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Click on text to add items', this.position.x + this.width / 2, this.position.y + this.height - 10);
        }
    }

    startEditing(index, canvas) {
        this.initializeEditable(canvas);
        
        if (index < 0) {
            // Adding new item
            this.addItem('New item');
            index = this.items.length - 1;
            window.dispatchEvent(new CustomEvent('todoListUpdated'));
        }

        // Enable editing
        this.container.style.pointerEvents = 'auto';
        this.updateTextPositions();
        
        const textElement = this.textElements.get(index);
        if (textElement) {
            setTimeout(() => {
                textElement.focus();
                // Place cursor at end
                const range = document.createRange();
                const sel = window.getSelection();
                range.selectNodeContents(textElement);
                range.collapse(false);
                sel.removeAllRanges();
                sel.addRange(range);
            }, 10);
        }
    }

    handleClick(x, y, canvas) {
        const relX = x - this.position.x;
        const relY = y - this.position.y;

        // Check if clicking on an item
        const startY = this.position.y + 40;
        const itemHeight = 25;

        for (let i = 0; i < this.items.length; i++) {
            const itemY = startY + (i * itemHeight);
            const itemTop = itemY - 15;
            const itemBottom = itemY + 10;

            if (relY >= itemTop && relY <= itemBottom) {
                // Remove button area (check first, has highest priority)
                if (relX >= this.width - 25 && relX <= this.width - 5) {
                    this.removeItem(i);
                    // Remove text element
                    const textElement = this.textElements.get(i);
                    if (textElement) {
                        textElement.remove();
                        this.textElements.delete(i);
                    }
                    // Reindex remaining elements
                    const newMap = new Map();
                    this.textElements.forEach((element, oldIndex) => {
                        if (oldIndex < i) {
                            newMap.set(oldIndex, element);
                        } else if (oldIndex > i) {
                            newMap.set(oldIndex - 1, element);
                        }
                    });
                    this.textElements = newMap;
                    window.dispatchEvent(new CustomEvent('todoListUpdated'));
                    return true;
                }
                // Checkbox area
                if (relX >= 10 && relX <= 25) {
                    this.toggleItem(i);
                    window.dispatchEvent(new CustomEvent('todoListUpdated'));
                    return true;
                }
                // Text area - click to edit (wider area)
                if (relX >= 25 && relX <= this.width - 25) {
                    this.startEditing(i, canvas);
                    return true;
                }
            }
        }

        // Click below items to add new item
        if (relY >= startY + (this.items.length * itemHeight) && relY <= this.position.y + this.height - 10) {
            this.startEditing(-1, canvas); // -1 means new item
            return true;
        }

        return false;
    }

    updateInputPosition() {
        this.updateTextPositions();
    }
}

