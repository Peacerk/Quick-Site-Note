// Website Notes Extension - Content Script
class WebsiteNotes {
  constructor() {
    this.notes = [];
    this.notesEnabled = true;
    this.currentUrl = window.location.href;
    this.noteCounter = 0;
    this.noteColor = '#fffbf0';
    this.noteOpacity = 100;
    
    this.init();
  }
  
  async init() {
    // Load settings and notes
    await this.loadSettings();
    await this.loadNoteCustomization();
    await this.loadNotes();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Display notes if enabled
    if (this.notesEnabled) {
      this.displayNotes();
    }
  }
  
  async loadSettings() {
    const result = await chrome.storage.sync.get(['notesEnabled']);
    this.notesEnabled = result.notesEnabled !== false; // Default to true
  }

  async loadNoteCustomization() {
    const key = `noteStyle_${this.currentUrl}`;
    const result = await chrome.storage.local.get([key]);
    if (result[key]) {
      this.noteColor = result[key].color || '#fffbf0';
      this.noteOpacity = result[key].opacity || 100;
    }
  }
  
  async loadNotes() {
    const result = await chrome.storage.local.get([this.currentUrl]);
    this.notes = result[this.currentUrl] || [];
  }
  
  async saveNotes() {
    try {
      // Check if extension context is still valid
      if (!chrome.storage) {
        return; // Extension was reloaded, skip saving
      }
      
      await chrome.storage.local.set({
        [this.currentUrl]: this.notes
      });
    } catch (error) {
      // Silently ignore errors when extension context is invalidated
      if (error.message && !error.message.includes('Extension context invalidated')) {
        console.error('Error saving notes:', error);
      }
    }
  }
  
  setupEventListeners() {
    // Ctrl + Double-click to create note
    document.addEventListener('dblclick', (e) => {
      if (!this.notesEnabled) return;
      
      // Check if Ctrl key (or Cmd on Mac) is pressed
      if (!e.ctrlKey && !e.metaKey) return;
      
      // Don't create notes on existing notes
      if (e.target.closest('.website-note')) return;
      
      this.createNote(e.clientX, e.clientY);
    });
    
    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'toggleNotes') {
        this.notesEnabled = message.enabled;
        if (this.notesEnabled) {
          this.displayNotes();
        } else {
          this.hideNotes();
        }
      }
    });
  }
  
  createNote(x, y) {
    const noteId = 'note_' + Date.now() + '_' + this.noteCounter++;
    
    const noteData = {
      id: noteId,
      content: '',
      x: x + window.scrollX,
      y: y + window.scrollY,
      timestamp: new Date().toISOString(),
      color: this.noteColor,
      opacity: this.noteOpacity,
      width: 200,
      height: 150
    };
    
    this.notes.push(noteData);
    this.displayNote(noteData, true); // true = start in edit mode
    this.saveNotes();
  }
  
  displayNote(noteData, editMode = false) {
    const noteElement = document.createElement('div');
    noteElement.className = 'website-note';
    noteElement.dataset.noteId = noteData.id;
    
    noteElement.style.position = 'absolute';
    noteElement.style.left = noteData.x + 'px';
    noteElement.style.top = noteData.y + 'px';
    noteElement.style.zIndex = '10000';
    noteElement.style.width = (noteData.width || 200) + 'px';
    noteElement.style.height = (noteData.height || 150) + 'px';
    
    // Apply custom background color and opacity for this specific note
    const noteColor = noteData.color || this.noteColor;
    const noteOpacity = noteData.opacity !== undefined ? noteData.opacity : this.noteOpacity;
    const rgbaColor = this.hexToRgba(noteColor, noteOpacity / 100);
    const darkerColor = this.adjustBrightness(noteColor, -30); // Darker shade for border
    const borderColor = this.hexToRgba(darkerColor, noteOpacity / 100); // Border with same opacity
    
    noteElement.style.backgroundColor = rgbaColor;
    noteElement.style.borderColor = borderColor;
    
    const noteContent = document.createElement('div');
    noteContent.className = 'note-content';
    
    if (editMode || !noteData.content) {
      this.createEditableNote(noteElement, noteContent, noteData);
    } else {
      this.createDisplayNote(noteElement, noteContent, noteData);
    }
    
    // Add resize handles
    this.addResizeHandles(noteElement, noteData);
    
    document.body.appendChild(noteElement);
  }

  hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  adjustBrightness(hex, percent) {
    // Convert hex to RGB
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
    
    // Adjust brightness
    r = Math.max(0, Math.min(255, r + percent));
    g = Math.max(0, Math.min(255, g + percent));
    b = Math.max(0, Math.min(255, b + percent));
    
    // Convert back to hex
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }

  updateAllNoteStyles() {
    // This function is no longer needed for global updates
    // Each note maintains its own color
  }
  
  createEditableNote(noteElement, noteContent, noteData) {
    const textarea = document.createElement('textarea');
    textarea.className = 'note-textarea';
    textarea.value = noteData.content;
    textarea.placeholder = 'Enter your note...';
    
    // Color picker section
    const colorSection = document.createElement('div');
    colorSection.className = 'note-color-picker-section';
    
    const colorLabel = document.createElement('label');
    colorLabel.textContent = 'Color: ';
    colorLabel.style.fontSize = '11px';
    colorLabel.style.marginRight = '6px';
    
    const colorPicker = document.createElement('input');
    colorPicker.type = 'color';
    colorPicker.className = 'note-color-picker';
    colorPicker.value = noteData.color || this.noteColor;
    
    const opacityLabel = document.createElement('label');
    opacityLabel.textContent = 'Opacity: ';
    opacityLabel.style.fontSize = '11px';
    opacityLabel.style.marginLeft = '8px';
    opacityLabel.style.marginRight = '4px';
    
    const opacitySlider = document.createElement('input');
    opacitySlider.type = 'range';
    opacitySlider.className = 'note-opacity-slider';
    opacitySlider.min = '0';
    opacitySlider.max = '100';
    opacitySlider.value = noteData.opacity !== undefined ? noteData.opacity : this.noteOpacity;
    
    const opacityValue = document.createElement('span');
    opacityValue.className = 'note-opacity-value';
    opacityValue.textContent = opacitySlider.value + '%';
    
    // Update note appearance when color/opacity changes
    colorPicker.addEventListener('input', (e) => {
      const color = e.target.value;
      const opacity = parseInt(opacitySlider.value);
      const rgbaColor = this.hexToRgba(color, opacity / 100);
      const darkerColor = this.adjustBrightness(color, -30);
      const borderColor = this.hexToRgba(darkerColor, opacity / 100);
      noteElement.style.backgroundColor = rgbaColor;
      noteElement.style.borderColor = borderColor;
    });
    
    opacitySlider.addEventListener('input', (e) => {
      const opacity = parseInt(e.target.value);
      const color = colorPicker.value;
      const rgbaColor = this.hexToRgba(color, opacity / 100);
      const darkerColor = this.adjustBrightness(color, -30);
      const borderColor = this.hexToRgba(darkerColor, opacity / 100);
      opacityValue.textContent = opacity + '%';
      noteElement.style.backgroundColor = rgbaColor;
      noteElement.style.borderColor = borderColor;
    });
    
    colorSection.appendChild(colorLabel);
    colorSection.appendChild(colorPicker);
    colorSection.appendChild(opacityLabel);
    colorSection.appendChild(opacitySlider);
    colorSection.appendChild(opacityValue);
    
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'note-buttons';
    
    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Save';
    saveBtn.className = 'note-save-btn';
    
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.className = 'note-cancel-btn';
    
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.className = 'note-delete-btn';
    
    saveBtn.onclick = () => {
      noteData.content = textarea.value.trim();
      noteData.color = colorPicker.value;
      noteData.opacity = parseInt(opacitySlider.value);
      
      if (noteData.content) {
        this.updateNote(noteData);
        noteElement.remove();
        this.displayNote(noteData, false);
      } else {
        this.deleteNote(noteData.id);
        noteElement.remove();
      }
    };
    
    cancelBtn.onclick = () => {
      if (!noteData.content) {
        this.deleteNote(noteData.id);
      }
      noteElement.remove();
      if (noteData.content) {
        this.displayNote(noteData, false);
      }
    };
    
    deleteBtn.onclick = () => {
      this.deleteNote(noteData.id);
      noteElement.remove();
    };
    
    buttonContainer.appendChild(saveBtn);
    buttonContainer.appendChild(cancelBtn);
    if (noteData.content) {
      buttonContainer.appendChild(deleteBtn);
    }
    
    noteContent.appendChild(textarea);
    noteContent.appendChild(colorSection);
    noteContent.appendChild(buttonContainer);
    noteElement.appendChild(noteContent);
    
    // Focus and select text
    setTimeout(() => {
      textarea.focus();
      if (noteData.content) {
        textarea.select();
      }
    }, 10);
  }
  
  createDisplayNote(noteElement, noteContent, noteData) {
    const textDiv = document.createElement('div');
    textDiv.className = 'note-text';
    textDiv.textContent = noteData.content;
    
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'note-actions';
    
    const editBtn = document.createElement('button');
    editBtn.textContent = '✏️';
    editBtn.className = 'note-action-btn';
    editBtn.title = 'Edit note';
    
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '🗑️';
    deleteBtn.className = 'note-action-btn';
    deleteBtn.title = 'Delete note';
    
    editBtn.onclick = (e) => {
      e.stopPropagation();
      noteElement.remove();
      this.displayNote(noteData, true);
    };
    
    deleteBtn.onclick = (e) => {
      e.stopPropagation();
      this.deleteNote(noteData.id);
      noteElement.remove();
    };
    
    actionsDiv.appendChild(editBtn);
    actionsDiv.appendChild(deleteBtn);
    
    noteContent.appendChild(textDiv);
    noteContent.appendChild(actionsDiv);
    noteElement.appendChild(noteContent);
    
    // Make note draggable
    this.makeDraggable(noteElement, noteData);
  }
  
  makeDraggable(noteElement, noteData) {
    let isDragging = false;
    let startX, startY, initialX, initialY;
    
    const noteHeader = noteElement.querySelector('.note-content');
    
    noteElement.onmousedown = (e) => {
      // Don't drag if clicking on buttons, resize handles, or textarea
      if (e.target.tagName === 'BUTTON' || 
          e.target.classList.contains('resize-handle') ||
          e.target.tagName === 'TEXTAREA' ||
          e.target.tagName === 'INPUT') {
        return;
      }
      
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      initialX = noteElement.offsetLeft;
      initialY = noteElement.offsetTop;
      
      noteElement.style.cursor = 'grabbing';
      
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      
      e.preventDefault();
    };
    
    const onMouseMove = (e) => {
      if (!isDragging) return;
      
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      noteElement.style.left = (initialX + deltaX) + 'px';
      noteElement.style.top = (initialY + deltaY) + 'px';
    };
    
    const onMouseUp = () => {
      if (isDragging) {
        isDragging = false;
        noteElement.style.cursor = 'move';
        noteData.x = parseInt(noteElement.style.left);
        noteData.y = parseInt(noteElement.style.top);
        this.updateNote(noteData);
      }
      
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }

  addResizeHandles(noteElement, noteData) {
    // Create resize handles for all 8 positions
    const positions = [
      { name: 'nw', cursor: 'nw-resize', top: -5, left: -5 },
      { name: 'n', cursor: 'n-resize', top: -5, left: '50%', transform: 'translateX(-50%)' },
      { name: 'ne', cursor: 'ne-resize', top: -5, right: -5 },
      { name: 'e', cursor: 'e-resize', top: '50%', right: -5, transform: 'translateY(-50%)' },
      { name: 'se', cursor: 'se-resize', bottom: -5, right: -5 },
      { name: 's', cursor: 's-resize', bottom: -5, left: '50%', transform: 'translateX(-50%)' },
      { name: 'sw', cursor: 'sw-resize', bottom: -5, left: -5 },
      { name: 'w', cursor: 'w-resize', top: '50%', left: -5, transform: 'translateY(-50%)' }
    ];

    positions.forEach(pos => {
      const handle = document.createElement('div');
      handle.className = `resize-handle resize-${pos.name}`;
      handle.style.cursor = pos.cursor;
      
      // Position the handle
      if (pos.top !== undefined) handle.style.top = typeof pos.top === 'number' ? pos.top + 'px' : pos.top;
      if (pos.bottom !== undefined) handle.style.bottom = pos.bottom + 'px';
      if (pos.left !== undefined) handle.style.left = typeof pos.left === 'number' ? pos.left + 'px' : pos.left;
      if (pos.right !== undefined) handle.style.right = pos.right + 'px';
      if (pos.transform) handle.style.transform = pos.transform;
      
      // Add resize functionality
      handle.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        this.startResize(e, noteElement, noteData, pos.name);
      });
      
      noteElement.appendChild(handle);
    });
  }

  startResize(e, noteElement, noteData, direction) {
    e.preventDefault();
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = noteElement.offsetWidth;
    const startHeight = noteElement.offsetHeight;
    const startLeft = noteElement.offsetLeft;
    const startTop = noteElement.offsetTop;
    
    const onMouseMove = (e) => {
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      let newWidth = startWidth;
      let newHeight = startHeight;
      let newLeft = startLeft;
      let newTop = startTop;
      
      // Handle horizontal resizing
      if (direction.includes('e')) {
        newWidth = Math.max(150, startWidth + deltaX);
      } else if (direction.includes('w')) {
        newWidth = Math.max(150, startWidth - deltaX);
        newLeft = startLeft + (startWidth - newWidth);
      }
      
      // Handle vertical resizing
      if (direction.includes('s')) {
        newHeight = Math.max(100, startHeight + deltaY);
      } else if (direction.includes('n')) {
        newHeight = Math.max(100, startHeight - deltaY);
        newTop = startTop + (startHeight - newHeight);
      }
      
      noteElement.style.width = newWidth + 'px';
      noteElement.style.height = newHeight + 'px';
      noteElement.style.left = newLeft + 'px';
      noteElement.style.top = newTop + 'px';
    };
    
    const onMouseUp = () => {
      noteData.width = noteElement.offsetWidth;
      noteData.height = noteElement.offsetHeight;
      noteData.x = noteElement.offsetLeft;
      noteData.y = noteElement.offsetTop;
      this.updateNote(noteData);
      
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }
  
  updateNote(noteData) {
    const index = this.notes.findIndex(note => note.id === noteData.id);
    if (index !== -1) {
      this.notes[index] = noteData;
      this.saveNotes();
    }
  }
  
  deleteNote(noteId) {
    this.notes = this.notes.filter(note => note.id !== noteId);
    this.saveNotes();
  }
  
  displayNotes() {
    this.notes.forEach(noteData => {
      this.displayNote(noteData, false);
    });
  }
  
  hideNotes() {
    const existingNotes = document.querySelectorAll('.website-note');
    existingNotes.forEach(note => note.remove());
  }
}

// Initialize the extension when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new WebsiteNotes();
  });
} else {
  new WebsiteNotes();
}