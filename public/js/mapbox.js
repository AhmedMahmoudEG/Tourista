/* eslint-disable */
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export const displayMap = locations => {
  // Wait for DOM to be fully ready and container to have dimensions
  const mapContainer = document.getElementById('map');
  if (!mapContainer) {
    console.error('Map container not found');
    return;
  }

  // Wait a bit for CSS to load and container to be sized
  setTimeout(() => {
    // Check if container has dimensions
    const containerHeight = mapContainer.offsetHeight;
    const containerWidth = mapContainer.offsetWidth;

    if (containerHeight === 0 || containerWidth === 0) {
      console.error('Map container has no dimensions');
      return;
    }

    // ----------------------------------------------
    // Create the map with better initial settings
    // ----------------------------------------------
    const map = L.map('map', {
      zoomControl: true,
      preferCanvas: false,
      attributionControl: true,
      // Set reasonable zoom limits
      minZoom: 3,
      maxZoom: 16,
    });

    // ----------------------------------------------
    // Add a tile layer with better settings
    // ----------------------------------------------
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18,
      tileSize: 256,
    }).addTo(map);

    // ----------------------------------------------
    // Create icon using the image provided
    // ----------------------------------------------
    var greenIcon = L.icon({
      iconUrl: '/img/pin.png',
      iconSize: [32, 40],
      iconAnchor: [16, 40],
      popupAnchor: [0, -45],
    });

    // ----------------------------------------------
    // Add locations to the map
    // ----------------------------------------------
    const points = [];
    locations.forEach((loc, index) => {
      // Validate coordinates
      const lat = parseFloat(loc.coordinates[1]);
      const lng = parseFloat(loc.coordinates[0]);

      if (isNaN(lat) || isNaN(lng)) {
        return;
      }

      points.push([lat, lng]);

      // Add markers
      const marker = L.marker([lat, lng], { icon: greenIcon }).addTo(map);

      // Add popup with better formatting
      const popupContent = `
        <div style="text-align: center; padding: 8px; min-width: 120px;">
          <h3 style="margin: 0 0 8px 0; color: #16a34a; font-size: 1.4rem; font-weight: 600;">
            Day ${loc.day}
          </h3>
          <p style="margin: 0; font-size: 1.2rem; color: #64748b; line-height: 1.4;">
            ${loc.description}
          </p>
        </div>
      `;

      marker.bindPopup(popupContent, {
        autoClose: false,
        closeButton: true,
        className: 'custom-popup',
        maxWidth: 250,
        minWidth: 150,
      });

      // Add hover events
      marker.on('mouseover', function (e) {
        this.openPopup();
      });

      marker.on('mouseout', function (e) {
        // Don't close popup on mouseout to make it more user-friendly
        // this.closePopup();
      });
    });

    // ----------------------------------------------
    // Set map bounds with proper scaling
    // ----------------------------------------------
    if (points.length > 0) {
      // Create bounds from all points
      const bounds = L.latLngBounds(points);

      // Calculate appropriate zoom level and center
      if (points.length === 1) {
        // Single point - center on it with reasonable zoom
        map.setView(points[0], 12);
      } else {
        // Multiple points - fit all with proper padding
        const padding = Math.max(containerHeight, containerWidth) * 0.1; // 10% of container size

        map.fitBounds(bounds, {
          padding: [padding, padding],
          maxZoom: 13, // Limit max zoom when fitting bounds
        });
      }

      // Add a small delay then adjust zoom if it's too close
      setTimeout(() => {
        const currentZoom = map.getZoom();

        // If zoom is too high (too close), reduce it
        if (currentZoom > 15) {
          map.setZoom(13);
        }
        // If zoom is too low (too far), increase it
        else if (currentZoom < 6) {
          map.setZoom(8);
        }
      }, 500);
    } else {
      console.warn('No valid points found, using default view');
      // Default view - Cairo, Egypt
      map.setView([30.0444, 31.2357], 10);
    }

    // ----------------------------------------------
    // Force map to recalculate its size multiple times
    // ----------------------------------------------
    const invalidateSizes = () => {
      map.invalidateSize(true);
    };

    // Invalidate immediately
    setTimeout(invalidateSizes, 100);
    setTimeout(invalidateSizes, 300);
    setTimeout(invalidateSizes, 500);

    // Handle window resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        invalidateSizes();
      }, 250);
    });

    // Disable scroll zoom initially but allow click to enable
    map.scrollWheelZoom.disable();

    // Add interaction feedback
    map.on('click', function () {
      if (!map.scrollWheelZoom.enabled()) {
        map.scrollWheelZoom.enable();

        // Show temporary message (optional)
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = 'Scroll zoom enabled';
        tempDiv.style.cssText = `
          position: absolute; 
          top: 10px; 
          left: 50%; 
          transform: translateX(-50%);
          background: rgba(22, 163, 74, 0.9); 
          color: white; 
          padding: 5px 15px; 
          border-radius: 20px; 
          font-size: 12px; 
          z-index: 1000;
          pointer-events: none;
        `;
        mapContainer.appendChild(tempDiv);

        setTimeout(() => {
          if (tempDiv.parentNode) {
            tempDiv.parentNode.removeChild(tempDiv);
          }
          map.scrollWheelZoom.disable();
        }, 3000);
      }
    });
  }, 200); // Reduced initial delay
};
