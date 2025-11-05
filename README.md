# Quick Site Note 🌍📝

A Chrome extension that lets you create, customize, and save notes directly on any website. Perfect for research, bookmarking important information, or keeping track of details across the web.

![Quick Site Note Icon](icons/icon128.png)

## ✨ Features

### Core Functionality
- **Create Notes Anywhere**: Ctrl + Double-click on any webpage to create a note
- **Drag & Drop**: Move notes anywhere on the page with click-and-drag
- **Resize Notes**: Adjust note size using 8 resize handles (corners and edges)
- **Full Customization**: Choose any color and opacity for each individual note
- **Persistent Storage**: Notes are saved per-website and persist across browser sessions
- **Easy Management**: Edit, delete, or reorganize notes with intuitive controls

### Advanced Features
- **Individual Note Styling**: Each note can have its own color and transparency
- **Color Picker**: Built-in color picker for custom note colors
- **Opacity Control**: Adjust transparency from 0% to 100% for each note
- **Border Effects**: Borders automatically match note color with opacity
- **Website Overview**: View all websites where you've saved notes
- **Quick Navigation**: Jump to any website with saved notes directly from the extension
- **Toggle Display**: Quickly show/hide all notes with one click
- **Bulk Delete**: Clear all notes for a specific website

## 🚀 Installation

### Install from Source

1. **Download the Extension**
   ```bash
   git clone https://github.com/Peacerk/Quick-Site-Note.git
   ```

2. **Load in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right corner)
   - Click "Load unpacked"
   - Select the `quick-site-note` folder
   - The extension is now installed! 🎉

### Install from Chrome Web Store
*Coming soon!*

## 📖 How to Use

### Creating a Note
1. Navigate to any website
2. Hold **Ctrl** (or **Cmd** on Mac) and **double-click** anywhere on the page
3. A note will appear at your cursor position
4. Type your note content
5. Customize the color and opacity using the built-in controls
6. Click "Save"

### Editing a Note
1. Hover over any note to reveal action buttons
2. Click the **✏️ Edit** button
3. Modify the text, color, or opacity
4. Click "Save" to update

### Moving a Note
- Click and drag any note to reposition it on the page
- The new position is automatically saved

### Resizing a Note
1. Hover over a note to reveal blue resize handles
2. Drag any corner handle for diagonal resizing
3. Drag any edge handle for horizontal or vertical resizing
4. Release to save the new size

### Managing Notes
- **Delete a Note**: Click the 🗑️ button on the note
- **View All Sites**: Open the extension popup → Click "Show" under "All Websites with Notes"
- **Clear Site Notes**: Click "Clear all notes for this site" in the popup
- **Toggle Visibility**: Use the toggle switch in the popup to show/hide all notes

## 🎨 Customization

### Note Appearance
Each note can be customized individually:
- **Color**: Choose from any color using the color picker
- **Opacity**: Adjust transparency from fully transparent (0%) to fully opaque (100%)
- **Size**: Resize to any dimension using drag handles
- **Position**: Place anywhere on the webpage

### Default Settings
Set default color and opacity for new notes on each website through the extension popup.

## 🛠️ Technical Details

### Built With
- **Manifest V3**: Latest Chrome extension standard
- **Vanilla JavaScript**: No frameworks, pure performance
- **Chrome Storage API**: Reliable local storage
- **CSS3**: Modern styling with flexbox and animations

### Storage
- Notes are stored locally using `chrome.storage.local`
- Each website's notes are stored separately by URL
- No data is sent to external servers
- All data stays on your device

### Permissions
- `storage`: Save notes to local browser storage
- `activeTab`: Access current webpage to inject notes
- `<all_urls>`: Allow notes on any website

## 🎯 Use Cases

- **Research**: Keep track of important information while browsing
- **Study Notes**: Annotate educational websites and articles
- **Shopping**: Save product details, prices, or comparison notes
- **Work**: Track tasks, ideas, or references on work-related sites
- **Learning**: Take notes on tutorials, documentation, or online courses
- **Bookmarking**: Add context to bookmarked pages

## 🔒 Privacy

- **No tracking**: We don't collect any user data
- **Local storage only**: All notes stay on your device
- **No external servers**: No data transmission
- **Open source**: Full transparency in code
- **No analytics**: Zero telemetry or usage tracking


## 🐛 Bug Reports & Feature Requests

Found a bug or have a feature idea?
- **Bug Reports**: Open an issue with detailed steps to reproduce
- **Feature Requests**: Open an issue describing the feature and use case
- **Questions**: Use GitHub Discussions


## 👤 Author

**Peacerk**
- Website: [www.peacerk.com](https://www.peacerk.com)
- GitHub: [@peacerk](https://github.com/peacerk)

## 🙏 Acknowledgments

- Thanks to Claude AI for development and support

## Support and Donation

If you find this extension helpful:
- ⭐ Star this repository
- 📢 Share with others who might find it useful

Donate to me if you find my work useful, and support my work
### Paypal
You can transfer to my PayPal account: paypal.me/Peacerk
### UPI
UPI address: peacerk@ibl
### Bitcoin
Bitcoin Address: 16cYmSivi3W5uEkKSSM6dGGXgYfEiQqWFf

---
