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
            if (this.type === 'todo' && this.inputElement) {
                this.updateInputPosition();
            }
            if (this.type === 'note' && this.inputElement) {
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
        this.jinglePath = 'sounds/timer-jingle.mp3'; // Default path - user can add their jingle here
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
        this.isEditing = false;
        this.width = 250;
        this.height = 200;
        this.inputElement = null;
        this.canvasRef = null;
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
        
        // Draw hint if not editing
        if (!this.isEditing && this.text === 'Click to edit') {
            ctx.fillStyle = '#999';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Click to edit', this.position.x + this.width / 2, this.position.y + this.height - 10);
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

    startEditing(canvas) {
        if (this.inputElement) {
            this.inputElement.remove();
        }

        this.canvasRef = canvas;
        const input = document.createElement('textarea');
        input.value = this.text === 'Click to edit' ? '' : this.text;
        input.style.position = 'fixed'; // Use fixed instead of absolute for better positioning
        input.style.left = (canvas.getBoundingClientRect().left + this.position.x + 10) + 'px';
        input.style.top = (canvas.getBoundingClientRect().top + this.position.y + 40) + 'px';
        input.style.width = (this.width - 20) + 'px';
        input.style.height = (this.height - 60) + 'px';
        input.style.fontSize = '12px';
        input.style.fontFamily = 'Arial';
        input.style.border = '2px solid #2196F3';
        input.style.padding = '5px';
        input.style.zIndex = '10000'; // Very high z-index
        input.style.borderRadius = '2px';
        input.style.resize = 'none';
        input.style.overflow = 'auto';
        input.style.backgroundColor = 'white';
        input.style.pointerEvents = 'auto'; // Ensure it's clickable

        input.addEventListener('blur', () => {
            this.text = input.value.trim() || 'Click to edit';
            input.remove();
            this.inputElement = null;
            this.isEditing = false;
            this.canvasRef = null;
            window.dispatchEvent(new CustomEvent('noteUpdated'));
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                input.blur();
            }
        });

        document.body.appendChild(input);
        
        // Use requestAnimationFrame to ensure DOM is ready before focusing
        requestAnimationFrame(() => {
            input.focus();
        });

        this.inputElement = input;
        this.isEditing = true;
    }

    handleClick(x, y, canvas) {
        const relX = x - this.position.x;
        const relY = y - this.position.y;

        // Click anywhere in the note area (except title area) to edit
        if (relX >= 10 && relX <= this.width - 10 && 
            relY >= 35 && relY <= this.height - 10 && 
            !this.isEditing) {
            // Use setTimeout to ensure the click event completes before opening input
            setTimeout(() => {
                this.startEditing(canvas);
            }, 10);
            return true;
        }

        return false;
    }

    updateInputPosition() {
        if (this.isEditing && this.inputElement && this.canvasRef) {
            if (this.type === 'note') {
                this.inputElement.style.left = (this.canvasRef.getBoundingClientRect().left + this.position.x + 10) + 'px';
                this.inputElement.style.top = (this.canvasRef.getBoundingClientRect().top + this.position.y + 40) + 'px';
            }
        }
    }
}

// To-do list element
class TodoListElement extends UIElement {
    constructor(id, x, y) {
        super(id, 'todo', x, y);
        this.items = [];
        this.width = 250;
        this.height = 300;
        this.editingIndex = null;
        this.inputElement = null;
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
            const textY = itemY;
            const maxWidth = this.width - 50;
            const text = item.text.length > 30 ? item.text.substring(0, 27) + '...' : item.text;
            
            // Measure text width for strikethrough
            const textWidth = ctx.measureText(text).width;
            const textX = this.position.x + 30;
            
            ctx.fillText(text, textX, textY);
            
            // Draw strikethrough line if completed
            if (item.completed) {
                ctx.strokeStyle = '#999';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(textX, textY - 5);
                ctx.lineTo(textX + textWidth, textY - 5);
                ctx.stroke();
            }

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
            ctx.fillText('Click on text to add items', this.position.x + this.width / 2, this.position.y + this.height - 10);
        }
    }

    startEditing(index, canvas) {
        if (this.inputElement) {
            this.inputElement.remove();
        }

        const startY = this.position.y + 40;
        const itemHeight = 25;
        const itemY = startY + (index >= 0 ? index * itemHeight : this.items.length * itemHeight);
        const textX = this.position.x + 30;
        const textWidth = this.width - 50;

        // Create input element
        const input = document.createElement('input');
        input.type = 'text';
        input.value = (index >= 0 && this.items[index]) ? this.items[index].text : '';
        input.style.position = 'fixed'; // Use fixed instead of absolute for better positioning
        input.style.left = (canvas.getBoundingClientRect().left + textX) + 'px';
        input.style.top = (canvas.getBoundingClientRect().top + itemY - 12) + 'px';
        input.style.width = textWidth + 'px';
        input.style.height = '20px';
        input.style.fontSize = '12px';
        input.style.fontFamily = 'Arial';
        input.style.border = '2px solid #2196F3';
        input.style.padding = '2px 5px';
        input.style.zIndex = '10000'; // Very high z-index
        input.style.borderRadius = '2px';
        input.style.backgroundColor = 'white';
        input.style.pointerEvents = 'auto'; // Ensure it's clickable

        // Store canvas reference for position updates
        this.canvasRef = canvas;

        input.addEventListener('blur', () => {
            if (index !== null && index >= 0 && index < this.items.length) {
                if (input.value.trim()) {
                    this.items[index].text = input.value.trim();
                } else {
                    this.items.splice(index, 1);
                }
            } else {
                // Adding new item
                if (input.value.trim()) {
                    this.addItem(input.value.trim());
                }
            }
            input.remove();
            this.inputElement = null;
            this.editingIndex = null;
            this.canvasRef = null;
            // Trigger custom event to notify game to re-render
            window.dispatchEvent(new CustomEvent('todoListUpdated'));
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                input.blur();
            } else if (e.key === 'Escape') {
                input.remove();
                this.inputElement = null;
                this.editingIndex = null;
            }
        });

        document.body.appendChild(input);
        
        // Use requestAnimationFrame to ensure DOM is ready before focusing
        requestAnimationFrame(() => {
            input.focus();
            input.select();
        });

        this.inputElement = input;
        this.editingIndex = index;
    }

    handleClick(x, y, canvas) {
        const relX = x - this.position.x;
        const relY = y - this.position.y;

        // Don't allow editing if already editing
        if (this.inputElement) {
            return false;
        }

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
                    // Use setTimeout to ensure the click event completes before opening input
                    setTimeout(() => {
                        this.startEditing(i, canvas);
                    }, 10);
                    return true;
                }
            }
        }

        // Click below items to add new item
        if (relY >= startY + (this.items.length * itemHeight) && relY <= this.position.y + this.height - 10) {
            // Use setTimeout to ensure the click event completes before opening input
            setTimeout(() => {
                this.startEditing(-1, canvas); // -1 means new item
            }, 10);
            return true;
        }

        return false;
    }
}

