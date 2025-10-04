// Website Notes Extension - Popup Script

class NotesPopup {
  constructor() {
    this.currentUrl = '';
    this.notesEnabled = true;
    this.noteCount = 0;
    this.allSites = [];
    this.noteColor = '#fffbf0';
    this.noteOpacity = 100;
    
    this.init();
  }
  
  async init() {
    await this.loadCurrentTab();
    await this.loadSettings();
    await this.loadNoteCount();
    await this.loadNoteCustomization();
    this.setupEventListeners();
    this.updateUI();
  }
  
  async loadCurrentTab() {
    try {
      const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
      this.currentUrl = tab.url;
    } catch (error) {
      console.error('Error loading current tab:', error);
      this.currentUrl = 'Unable to access current page';
    }
  }
  
  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get(['notesEnabled']);
      this.notesEnabled = result.notesEnabled !== false; // Default to true
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }
  
  async loadNoteCount() {
    try {
      const result = await chrome.storage.local.get([this.currentUrl]);
      const notes = result[this.currentUrl] || [];
      this.noteCount = notes.length;
    } catch (error) {
      console.error('Error loading note count:', error);
      this.noteCount = 0;
    }
  }

  async loadNoteCustomization() {
    try {
      const key = `noteStyle_${this.currentUrl}`;
      const result = await chrome.storage.local.get([key]);
      if (result[key]) {
        this.noteColor = result[key].color || '#fffbf0';
        this.noteOpacity = result[key].opacity || 100;
      }
    } catch (error) {
      console.error('Error loading note customization:', error);
    }
  }

  async saveNoteCustomization() {
    try {
      const key = `noteStyle_${this.currentUrl}`;
      await chrome.storage.local.set({
        [key]: {
          color: this.noteColor,
          opacity: this.noteOpacity
        }
      });

      // Note: This now sets the DEFAULT color for NEW notes on this site
      // Existing notes keep their individual colors
    } catch (error) {
      console.error('Error saving note customization:', error);
    }
  }

  async loadAllSites() {
    try {
      const allData = await chrome.storage.local.get(null);
      this.allSites = [];

      for (const [key, value] of Object.entries(allData)) {
        // Skip style settings
        if (key.startsWith('noteStyle_')) continue;

        if (Array.isArray(value) && value.length > 0) {
          this.allSites.push({
            url: key,
            noteCount: value.length
          });
        }
      }

      // Sort by note count (descending)
      this.allSites.sort((a, b) => b.noteCount - a.noteCount);
      
      this.displayAllSites();
    } catch (error) {
      console.error('Error loading all sites:', error);
    }
  }
  
  setupEventListeners() {
    const toggle = document.getElementById('notesToggle');
    const clearBtn = document.getElementById('clearNotes');
    const expandBtn = document.getElementById('expandBtn');
    const colorPicker = document.getElementById('noteColor');
    const opacitySlider = document.getElementById('noteOpacity');
    
    toggle.addEventListener('click', () => {
      this.toggleNotes();
    });
    
    clearBtn.addEventListener('click', () => {
      this.clearNotesForCurrentSite();
    });

    expandBtn.addEventListener('click', () => {
      this.toggleSitesList();
    });

    colorPicker.addEventListener('input', (e) => {
      this.noteColor = e.target.value;
      this.saveNoteCustomization();
    });

    opacitySlider.addEventListener('input', (e) => {
      this.noteOpacity = parseInt(e.target.value);
      document.getElementById('opacityValue').textContent = this.noteOpacity + '%';
      this.saveNoteCustomization();
    });
  }
  
  async toggleNotes() {
    this.notesEnabled = !this.notesEnabled;
    
    try {
      // Save setting
      await chrome.storage.sync.set({notesEnabled: this.notesEnabled});
      
      // Send message to content script
      const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
      chrome.tabs.sendMessage(tab.id, {
        type: 'toggleNotes',
        enabled: this.notesEnabled
      });
      
      this.updateUI();
    } catch (error) {
      console.error('Error toggling notes:', error);
    }
  }
  
  async clearNotesForCurrentSite() {
    if (!confirm('Are you sure you want to delete all notes for this website?')) {
      return;
    }
    
    try {
      await chrome.storage.local.remove([this.currentUrl]);
      
      // Also remove style settings
      const styleKey = `noteStyle_${this.currentUrl}`;
      await chrome.storage.local.remove([styleKey]);
      
      this.noteCount = 0;
      this.updateUI();
      
      // Reload the page to remove displayed notes
      const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
      chrome.tabs.reload(tab.id);
      
      // Refresh the all sites list
      await this.loadAllSites();
      
      // Show confirmation
      this.showNotification('All notes cleared for this website');
    } catch (error) {
      console.error('Error clearing notes:', error);
    }
  }

  async toggleSitesList() {
    const sitesList = document.getElementById('sitesList');
    const expandBtn = document.getElementById('expandBtn');
    
    if (sitesList.style.display === 'none') {
      sitesList.style.display = 'block';
      expandBtn.textContent = 'Hide ▲';
      await this.loadAllSites();
    } else {
      sitesList.style.display = 'none';
      expandBtn.textContent = 'Show ▼';
    }
  }

  displayAllSites() {
    const sitesList = document.getElementById('sitesList');
    
    if (this.allSites.length === 0) {
      sitesList.innerHTML = '<div class="empty-state">No notes saved on any website yet</div>';
      return;
    }

    let html = '';
    this.allSites.forEach(site => {
      const displayUrl = this.truncateUrl(site.url);
      const isCurrent = site.url === this.currentUrl;
      
      html += `
        <div class="site-item" data-url="${this.escapeHtml(site.url)}">
          <div class="site-info">
            <div class="site-url" title="${this.escapeHtml(site.url)}">
              ${isCurrent ? '★ ' : ''}${this.escapeHtml(displayUrl)}
            </div>
            <div class="site-count">${site.noteCount} note${site.noteCount !== 1 ? 's' : ''}</div>
          </div>
          <div class="site-actions">
            <button class="site-action-btn visit" data-url="${this.escapeHtml(site.url)}">Visit</button>
            <button class="site-action-btn delete" data-url="${this.escapeHtml(site.url)}">Delete</button>
          </div>
        </div>
      `;
    });

    sitesList.innerHTML = html;

    // Add event listeners to buttons
    sitesList.querySelectorAll('.site-action-btn.visit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const url = e.target.dataset.url;
        this.visitSite(url);
      });
    });

    sitesList.querySelectorAll('.site-action-btn.delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const url = e.target.dataset.url;
        this.deleteSiteNotes(url);
      });
    });
  }

  async visitSite(url) {
    try {
      await chrome.tabs.create({ url: url });
    } catch (error) {
      console.error('Error visiting site:', error);
    }
  }

  async deleteSiteNotes(url) {
    if (!confirm(`Delete all notes for this website?\n\n${url}`)) {
      return;
    }

    try {
      await chrome.storage.local.remove([url]);
      const styleKey = `noteStyle_${url}`;
      await chrome.storage.local.remove([styleKey]);
      
      // Refresh the list
      await this.loadAllSites();
      
      // If it's the current site, update the count
      if (url === this.currentUrl) {
        this.noteCount = 0;
        this.updateUI();
      }
      
      this.showNotification('Notes deleted successfully');
    } catch (error) {
      console.error('Error deleting site notes:', error);
    }
  }

  truncateUrl(url) {
    if (url.length <= 50) return url;
    
    try {
      const urlObj = new URL(url);
      let display = urlObj.hostname + urlObj.pathname;
      if (display.length > 50) {
        display = display.substring(0, 47) + '...';
      }
      return display;
    } catch {
      return url.substring(0, 47) + '...';
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  updateUI() {
    const toggle = document.getElementById('notesToggle');
    const noteCountEl = document.getElementById('noteCount');
    const currentUrlEl = document.getElementById('currentUrl');
    const clearBtn = document.getElementById('clearNotes');
    const colorPicker = document.getElementById('noteColor');
    const opacitySlider = document.getElementById('noteOpacity');
    const opacityValue = document.getElementById('opacityValue');
    
    // Update toggle
    if (this.notesEnabled) {
      toggle.classList.add('active');
    } else {
      toggle.classList.remove('active');
    }
    
    // Update note count
    noteCountEl.textContent = this.noteCount;
    
    // Update current URL display
    const displayUrl = this.currentUrl.length > 50 
      ? this.currentUrl.substring(0, 50) + '...'
      : this.currentUrl;
    currentUrlEl.textContent = displayUrl;
    
    // Update clear button
    clearBtn.disabled = this.noteCount === 0;
    if (this.noteCount === 0) {
      clearBtn.textContent = 'No notes to clear';
      clearBtn.style.opacity = '0.6';
    } else {
      clearBtn.textContent = `Clear all ${this.noteCount} notes for this site`;
      clearBtn.style.opacity = '1';
    }

    // Update color picker and opacity
    colorPicker.value = this.noteColor;
    opacitySlider.value = this.noteOpacity;
    opacityValue.textContent = this.noteOpacity + '%';
  }
  
  showNotification(message) {
    // Create temporary notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 10px;
      left: 50%;
      transform: translateX(-50%);
      background: #4285f4;
      color: white;
      padding: 8px 16px;
      border-radius: 4px;
      font-size: 12px;
      z-index: 1000;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 2000);
  }
}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new NotesPopup();
});