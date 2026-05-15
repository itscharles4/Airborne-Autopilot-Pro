# 🚀 Airspace Visualizer - Quick Start Guide

## 5-Minute Setup

### 1. Install Dependencies
```bash
npm install
```

This will install:
- `three` (3D library)
- `@react-three/fiber` (React-Three integration)
- `@googlemaps/js-api-loader` (Google Maps)
- All other required packages

### 2. Verify API Key
The Google Maps API key is already in `.env.local`:
```env
VITE_GOOGLE_MAPS_KEY=AIzaSyDEpy_UKoOH2NSjpNf_RfJFXjpYDXGQs5U
```

### 3. Start Development Server
```bash
npm run dev
```

### 4. Navigate to Airspace Visualizer
Visit `http://localhost:5173` and click on "Airspace Visualizer" in the navigation menu.

## First-Time Usage

### Step 1: Grant Location Permission
When you first load the component, your browser may ask to share your location.
- **Click "Allow"** to enable geolocation

### Step 2: Click "Live Location Scan"
- Blue button in the top-left with a location icon
- You'll see an "Establishing Uplink" animation
- This typically takes 2-5 seconds

### Step 3: View Results
After scanning completes:
- **3D Map Appears**: Shows buildings of nearby places
- **Sector Manifest Panel Opens**: Lists all discovered places
- **Statistics Display**: Total assets, categories, clusters, density
- **Buildings Organized by Color**:
  - 🔴 Red buildings = Dining/Restaurants
  - 💗 Pink buildings = Medical/Hospitals
  - 🔵 Blue buildings = Finance/Banks
  - 🩵 Cyan buildings = Services/Emergency
  - 🟣 Purple buildings = Education/Schools
  - 💚 Green buildings = Parks/Recreation

### Step 4: Interact with the Map

#### Click on a Building
- Highlights it with green glow
- Shows details in the manifest panel
- Name, rating, and address appear

#### Filter by Category
- In the Sector Manifest panel
- Click any category button
- Shows only places in that category

#### Change Camera View
- **Orbit**: Default rotating view (top button)
- **Top**: Bird's eye view (middle button)
- **1P**: First-person immersive (right button)

#### Pause/Play Animation
- Right side controls
- Play icon resumes, Pause pauses camera rotation

## Understanding the Interface

### Main 3D Viewport (Center)
- **Dark space** = Sky
- **Grid lines** = Ground reference
- **Colored buildings** = Discovered places
- **Rotating camera** = Automatic orbit in default mode

### Left Top Controls
1. **"Sector Manifest"** Button
   - Shows/hides the information panel
   - Green when open, gray when closed

2. **"Live Location Scan"** Button
   - Initiates new scan
   - Shows spinner while scanning
   - Requires location permission

### Right Top Controls
1. **Camera Mode Buttons** (3 small buttons)
   - Orbit, Top-Down, First-Person
   - Click to switch modes

2. **Play/Pause** Button
   - Blue = Paused
   - Yellow = Playing

### Left Sidebar Panel

#### Header
- Shows "Sector Manifest" title
- Real-time Infrastructure Scan subtitle

#### Statistics Section
Four boxes showing:
- **Total Assets**: Number of places found
- **Categories**: Different types of establishments
- **Clusters**: Grouped zones of similar places
- **Density**: Places per square meter

#### Asset Categories Section
Shows each type with:
- 📍 Category icon
- Category name
- Count of places
- Click to filter

#### Places Section
Lists individual places showing:
- 🔴 Color dot (category indicator)
- 🏪 Place name
- ⭐ Star rating (if available)
- Address (truncated)
- "POSITION LOCKED" when highlighted

## Common Scenarios

### Scenario 1: Explore Nearby Restaurants
1. Click "Live Location Scan"
2. Wait for results
3. Look for 🔴 red buildings
4. Click category "Dining"
5. See filtered restaurants in panel
6. Click restaurant card to highlight building

### Scenario 2: Find Hospitals
1. Scan your location
2. Look for 💗 pink buildings
3. Click "Medical" category
4. Review all hospitals and pharmacies
5. Click any hospital to see details

### Scenario 3: View Entire Area
1. Scan location
2. Click "Top" camera button
3. See bird's eye view of all places
4. Buildings taller = higher rated/more important

### Scenario 4: Immersive Exploration
1. Scan location
2. Click "1P" (First-Person) button
3. Walk through the virtual city
4. Camera shows ground-level perspective

## Tips & Tricks

### 🎯 Zoom Control
- Use mouse scroll wheel to zoom
- Two-finger pan on trackpad

### 💡 Best Scan Radius
- Default: 1500 meters (1.5 km)
- Small town: Use 1000 meters
- Dense city: Use 2000+ meters
- Rural area: Might need 3000+ meters

### 🔄 Rescan an Area
- Click "Live Location Scan" again
- New data replaces previous scan
- All previous highlights cleared

### 📊 Data Interpretation
- **Tall buildings** = High ratings or important services
- **Cluster size** = Density of services
- **Building color** = Type of establishment
- **Total Assets** = Diversity of area

### ⚡ Performance
- If slow, try smaller scan radius
- Close other browser tabs
- Enable hardware acceleration in browser

## Troubleshooting

### "Location permission denied"
```
Solution:
1. Click address bar lock icon
2. Find "Location" setting
3. Change to "Allow"
4. Refresh page
5. Try scanning again
```

### "No places found"
```
Possible causes:
- Rural/unpopulated area
- Weak internet connection
- Google Places database doesn't have data
- Try scanning from a city center

Solution:
- Move to populated area
- Check internet connection
- Try again in different location
```

### "3D buildings not visible"
```
Solutions:
1. Check if buildings have rendered (wait 2-3 sec)
2. Scroll viewport to center
3. Try different camera mode
4. Refresh page
5. Check browser console for errors
```

### "Manifest panel stuck"
```
Solution:
1. Click "Sector Manifest" button again to toggle
2. Click X button in panel header
3. Refresh page if still stuck
```

### "Camera not rotating"
```
Solutions:
1. Ensure "Orbit" mode is selected
2. Click Play button if paused
3. Hover mouse over viewport
4. Try different browser
```

## Keyboard Shortcuts (Coming Soon)

| Key | Function |
|-----|----------|
| `R` | Reset camera |
| `G` | Toggle grid |
| `H` | Toggle HUD |
| `+` | Zoom in |
| `-` | Zoom out |

*Note: Shortcuts not yet implemented - for future version*

## Advanced Features

### Category Filtering
1. Click any category button
2. Only that category's buildings appear
3. Manifests panel shows filtered places
4. Click same category again to reset

### Building Information
Each building has:
- Place name
- Category type
- Star rating
- Number of reviews
- Full address
- Open now status

### Statistics Interpretation
- **Density**: Shows how concentrated places are
- **Clusters**: Major groupings of similar services
- **Categories**: Diversity of establishment types

## Next Steps

1. ✅ Explore multiple areas
2. ✅ Identify hotspots and gaps
3. ✅ Plan routes based on place types
4. ✅ Analyze urban layout
5. ✅ Make recommendations based on density

## FAQ

**Q: Can I save my scans?**
A: Coming in next version with export to PDF/image

**Q: How often is the data updated?**
A: Google Places data is typically updated within 24-48 hours

**Q: Can I scan multiple locations?**
A: Yes, just move to new location and scan again

**Q: What's the maximum scan radius?**
A: Google Places API limits to ~5000m for best results

**Q: Can I customize colors?**
A: Yes, see AIRSPACE_VISUALIZER_GUIDE.md for customization

**Q: Does this work offline?**
A: No, requires internet for Google Maps & Places API

## Need Help?

1. Check AIRSPACE_VISUALIZER_GUIDE.md for detailed docs
2. Review React component code in `components/AirspaceView.tsx`
3. Check browser console (F12) for error messages
4. Verify Google Maps API key is valid
5. Ensure location services enabled on device

---

**Happy Exploring!** 🚀

Last Updated: 2026-03-31
