# Map Display Debugging Guide

## Current Issue
Map container initializes but tiles are not rendering in UnifiedNavigator component.

## Debugging Tools Added

### 1. Enhanced Console Logging
All map initialization steps now log with `[Map Init]` prefix:
- Container readiness check
- Container dimensions (width × height)
- Map object creation
- Tile layer configuration
- Tile loading events
- Each `invalidateSize()` call
- Geolocation requests

### 2. Test File
Open `test-mapbox.html` in a browser to verify:
- Mapbox token validity
- Tile loading capability
- Network connectivity to Mapbox API

### 3. What to Check

#### In Browser Console:
1. **Container Dimensions**
   ```
   [Map Init] Container dimensions: { width: X, height: Y }
   ```
   - If width or height is 0, the container has a CSS/layout issue

2. **Tile Events**
   ```
   [Map Init] Tiles loading started...
   [Map Init] Tiles loaded successfully!
   ```
   - If you see "Tiles loading..." but not "loaded", tiles are requested but failing
   - If you see "Tile error:", check the error message (auth, network, etc.)

3. **Map Object**
   ```
   [Map Init] ✅ Map initialized successfully
   ```
   - This confirms Leaflet map was created

#### In Network Tab:
1. Filter by "mapbox.com"
2. Look for tile requests: `https://api.mapbox.com/styles/v1/...`
3. Check status codes:
   - **200**: Success
   - **401**: Token invalid
   - **403**: Token lacks permissions
   - **404**: Style not found
   - **Failed**: Network/CORS issue

#### In Elements Tab:
1. Find the map container: `<div ref={mapContainerRef}>`
2. Check computed styles:
   - `width` and `height` should have pixel values
   - `position: absolute` should be set
   - Parent should have `position: relative`
3. Look for Leaflet-generated DOM:
   - `.leaflet-pane`
   - `.leaflet-tile-pane`
   - `<img>` elements for tiles

## Common Issues & Solutions

### Issue: Container has zero dimensions
**Cause**: Parent flexbox not allocating space
**Solution**: 
```css
.parent { display: flex; flex: 1; }
```

### Issue: Tiles return 401/403
**Cause**: Invalid Mapbox token
**Solution**: Verify token at https://account.mapbox.com/

### Issue: Tiles return 404
**Cause**: Style ID doesn't exist
**Solution**: Use valid Mapbox style IDs:
- `mapbox/navigation-day-v1`
- `mapbox/streets-v12`
- `mapbox/light-v11`
- `mapbox/dark-v11`

### Issue: CORS errors
**Cause**: Browser security blocking requests
**Solution**: Check if running on proper domain/localhost

### Issue: Map visible but tiles gray
**Cause**: Tiles loading but failing to render
**Solution**:
- Check `tileSize` and `zoomOffset` parameters
- For Mapbox: `tileSize: 512, zoomOffset: -1`

## Current Configuration

```javascript
// Token
const MAPBOX_TOKEN = "pk.eyJ1Ijoic3VyZW5hbWVzIiwiYSI6ImNta3UxenZjajF2aDUzY3NhZXNqY3JjeXkifQ.lBzScNO-wcVp0gFnExQx-w"

// Tile URL Pattern
https://api.mapbox.com/styles/v1/mapbox/navigation-day-v1/tiles/{z}/{x}/{y}?access_token={token}

// Leaflet Config
{
  tileSize: 512,
  zoomOffset: -1,
  maxZoom: 19
}
```

## Next Steps

1. **Deploy and Test**: Push changes, open app in browser
2. **Check Console**: Look for `[Map Init]` logs
3. **Check Network**: Verify tile requests in DevTools
4. **Report Findings**: Share console logs and network status

## Token Verification

Test the token directly:
```bash
curl "https://api.mapbox.com/styles/v1/mapbox/navigation-day-v1?access_token=pk.eyJ1Ijoic3VyZW5hbWVzIiwiYSI6ImNta3UxenZjajF2aDUzY3NhZXNqY3JjeXkifQ.lBzScNO-wcVp0gFnExQx-w"
```

Should return JSON with `"name": "Mapbox Navigation Day"`

## Alternative: Try OpenStreetMap

If Mapbox continues to fail, switch to OSM:

```javascript
const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
L.tileLayer(tileUrl, {
  maxZoom: 19,
  attribution: '© OpenStreetMap'
}).addTo(map);
```
