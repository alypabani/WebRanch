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

// Timer element
class TimerElement extends UIElement {
    constructor(id, x, y) {
        super(id, 'timer', x, y);
        this.startTime = null;
        this.isRunning = false;
        this.elapsedTime = 0; // in milliseconds
        this.width = 180;
        this.height = 100;
    }

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.startTime = Date.now() - this.elapsedTime;
        }
    }

    stop() {
        if (this.isRunning) {
            this.elapsedTime = Date.now() - this.startTime;
            this.isRunning = false;
        }
    }

    reset() {
        this.elapsedTime = 0;
        this.isRunning = false;
        this.startTime = null;
    }

    getCurrentTime() {
        if (this.isRunning) {
            return Date.now() - this.startTime;
        }
        return this.elapsedTime;
    }

    formatTime(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const centiseconds = Math.floor((ms % 1000) / 10);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
    }

    render(ctx) {
        const time = this.getCurrentTime();
        const timeString = this.formatTime(time);

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
        ctx.fillText('Timer', this.position.x + this.width / 2, this.position.y + 20);

        // Draw time
        ctx.font = '20px monospace';
        ctx.fillText(timeString, this.position.x + this.width / 2, this.position.y + 55);

        // Draw control buttons area
        ctx.fillStyle = this.isRunning ? '#f44336' : '#4CAF50';
        ctx.fillRect(this.position.x + 10, this.position.y + 70, 50, 25);
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.isRunning ? 'Stop' : 'Start', this.position.x + 35, this.position.y + 87);

        ctx.fillStyle = '#ff9800';
        ctx.fillRect(this.position.x + 70, this.position.y + 70, 50, 25);
        ctx.fillStyle = 'white';
        ctx.fillText('Reset', this.position.x + 95, this.position.y + 87);
    }

    handleClick(x, y) {
        const relX = x - this.position.x;
        const relY = y - this.position.y;

        // Start/Stop button
        if (relX >= 10 && relX <= 60 && relY >= 70 && relY <= 95) {
            if (this.isRunning) {
                this.stop();
            } else {
                this.start();
            }
            return true;
        }

        // Reset button
        if (relX >= 70 && relX <= 120 && relY >= 70 && relY <= 95) {
            this.reset();
            return true;
        }

        return false;
    }
}

// Note element
class NoteElement extends UIElement {
    constructor(id, x, y) {
        super(id, 'note', x, y);
        this.text = 'Double click to edit';
        this.isEditing = false;
        this.width = 250;
        this.height = 200;
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

        // Draw text
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        const lines = this.wrapText(ctx, this.text, this.position.x + 10, this.position.y + 40, this.width - 20, 14);
        
        // Draw "Double click to edit" hint if not editing
        if (!this.isEditing && this.text === 'Double click to edit') {
            ctx.fillStyle = '#999';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Double click to edit', this.position.x + this.width / 2, this.position.y + this.height - 10);
        }
    }

    wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';
        let currentY = y;
        let lineCount = 0;

        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            if (testWidth > maxWidth && n > 0) {
                ctx.fillText(line, x, currentY);
                line = words[n] + ' ';
                currentY += lineHeight;
                lineCount++;
                if (lineCount > 10) break; // Limit lines
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, x, currentY);
        return lineCount + 1;
    }
}

// To-do list element
class TodoListElement extends UIElement {
    constructor(id, x, y) {
        super(id, 'todo', x, y);
        this.items = [];
        this.width = 250;
        this.height = 300;
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

            // Draw text
            ctx.fillStyle = item.completed ? '#999' : '#333';
            ctx.textDecoration = item.completed ? 'line-through' : 'none';
            const textY = itemY;
            const maxWidth = this.width - 50;
            const text = item.text.length > 30 ? item.text.substring(0, 27) + '...' : item.text;
            ctx.fillText(text, this.position.x + 30, textY);

            // Draw remove button (small X)
            ctx.fillStyle = '#f44336';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('×', this.position.x + this.width - 15, textY);
        });

        // Draw "Add item" hint
        if (this.items.length === 0) {
            ctx.fillStyle = '#999';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Double click to add items', this.position.x + this.width / 2, this.position.y + this.height - 10);
        }
    }

    handleClick(x, y) {
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
                // Checkbox area
                if (relX >= 10 && relX <= 25) {
                    this.toggleItem(i);
                    return true;
                }
                // Remove button area
                if (relX >= this.width - 25 && relX <= this.width - 5) {
                    this.removeItem(i);
                    return true;
                }
            }
        }

        return false;
    }
}

