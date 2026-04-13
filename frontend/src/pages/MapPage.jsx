import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, MapPin, Store, Navigation2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { locationsAPI } from '../utils/api'

export default function MapPage() {
  const navigate = useNavigate()
  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  
  const [userPos, setUserPos] = useState(null)
  const [clinics, setClinics] = useState([])
  const [stores, setStores] = useState([])
  const [nearestClinic, setNearestClinic] = useState(null)
  const [nearestStore, setNearestStore] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [locationPermission, setLocationPermission] = useState('')

  // Step 1: Get user location
  useEffect(() => {
    const getLocation = async () => {
      if (!navigator.geolocation) {
        setError('Geolocation not supported on this device.')
        setLoading(false)
        return
      }

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords
          setUserPos({ lat: latitude, lng: longitude })
          setLocationPermission('granted')
          // Geolocation successful - fetch clinics with actual location
          await fetchNearbyPlaces(latitude, longitude)
        },
        async (err) => {
          console.warn('Geolocation error:', err.code, err.message)
          
          // Fallback to IP-based location (Philippines default)
          const fallbackLat = 14.5995
          const fallbackLng = 120.9842
          setUserPos({ lat: fallbackLat, lng: fallbackLng })
          setLocationPermission('denied')
          setError('📍 Location permission denied. Showing clinics near Manila, Philippines.')
          
          // Still fetch clinics with fallback location
          await fetchNearbyPlaces(fallbackLat, fallbackLng)
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 300000 // Cache for 5 minutes
        }
      )
    }

    getLocation()
  }, [])

  // Fetch nearby places from backend
  const fetchNearbyPlaces = async (lat, lng) => {
    try {
      const response = await locationsAPI.nearby(lat, lng, 500) // 500km radius
      setClinics(response.data.clinics || [])
      setStores(response.data.stores || [])
      
      // Set nearest options
      if (response.data.clinics?.length > 0) {
        setNearestClinic(response.data.clinics[0])
      }
      if (response.data.stores?.length > 0) {
        setNearestStore(response.data.stores[0])
      }
    } catch (err) {
      console.error('Failed to fetch clinics:', err)
      setError('Could not load clinic data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Initialize map when user position is ready
  useEffect(() => {
    if (!userPos || loading) return
    
    initMap()

    return () => {
      // Cleanup
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [userPos, clinics, stores])

  const initMap = async () => {
    // Dynamically load Leaflet
    if (!window.L) {
      const leafletCss = document.createElement('link')
      leafletCss.rel = 'stylesheet'
      leafletCss.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(leafletCss)

      const leafletJs = document.createElement('script')
      leafletJs.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      leafletJs.onload = renderMap
      document.head.appendChild(leafletJs)
    } else {
      renderMap()
    }
  }

  const renderMap = () => {
    const L = window.L
    
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove()
    }

    const mapInstance = L.map('map-container').setView([userPos.lat, userPos.lng], 12)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(mapInstance)

    // User location marker
    L.marker([userPos.lat, userPos.lng], {
      icon: L.divIcon({
        className: 'custom-div-icon',
        html: '<div style="background:#3b82f6;border-radius:50%;width:20px;height:20px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      })
    }).addTo(mapInstance).bindPopup('<b>📍 Your Location</b>').openPopup()

    // Clinics markers
    clinics.forEach((clinic) => {
      const html = `
        <div style="min-width:240px;font-family:system-ui;font-size:13px;">
          <h3 style="margin:0 0 4px 0;font-weight:bold;font-size:14px;color:#1e3a8a;">${clinic.name}</h3>
          <p style="margin:4px 0;color:#666;font-size:12px;">${clinic.desc || 'Dermatology clinic'}</p>
          <p style="margin:4px 0;color:#666;font-size:12px;">📍 ${clinic.distance_km} km away</p>
          <p style="margin:4px 0;color:#666;font-size:12px;">📞 ${clinic.phone}</p>
          <div style="margin-top:8px;display:flex;gap:4px;">
            <button onclick="window.open('https://www.google.com/maps/dir/?api=1&destination=${clinic.lat},${clinic.lng}','_blank')" 
              style="background:#4285f4;color:white;border:none;padding:6px 8px;border-radius:4px;cursor:pointer;font-size:12px;flex:1;box-shadow:0 2px 4px rgba(0,0,0,0.1);">Directions</button>
            <button onclick="window.open('https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clinic.name)}','_blank')" 
              style="background:#34a853;color:white;border:none;padding:6px 8px;border-radius:4px;cursor:pointer;font-size:12px;flex:1;box-shadow:0 2px 4px rgba(0,0,0,0.1);">View</button>
          </div>
        </div>
      `
      L.marker([clinic.lat, clinic.lng], {
        icon: L.divIcon({
          className: 'clinic-marker',
          html: '<div style="background:#1e3a8a;border-radius:50%;width:16px;height:16px;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>',
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        })
      }).addTo(mapInstance).bindPopup(html)
    })

    // Stores markers
    stores.forEach((store) => {
      const html = `
        <div style="min-width:240px;font-family:system-ui;font-size:13px;">
          <h3 style="margin:0 0 4px 0;font-weight:bold;font-size:14px;color:#059669;">${store.name}</h3>
          <p style="margin:4px 0;color:#666;font-size:12px;">${store.desc || 'Skincare products available'}</p>
          <p style="margin:4px 0;color:#666;font-size:12px;">📍 ${store.distance_km} km away</p>
          <p style="margin:4px 0;color:#666;font-size:12px;">📞 ${store.phone}</p>
          <div style="margin-top:8px;display:flex;gap:4px;">
            <button onclick="window.open('https://www.google.com/maps/dir/?api=1&destination=${store.lat},${store.lng}','_blank')" 
              style="background:#4285f4;color:white;border:none;padding:6px 8px;border-radius:4px;cursor:pointer;font-size:12px;flex:1;box-shadow:0 2px 4px rgba(0,0,0,0.1);">Directions</button>
            <button onclick="window.open('https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.name)}','_blank')" 
              style="background:#34a853;color:white;border:none;padding:6px 8px;border-radius:4px;cursor:pointer;font-size:12px;flex:1;box-shadow:0 2px 4px rgba(0,0,0,0.1);">View</button>
          </div>
        </div>
      `
      L.marker([store.lat, store.lng], {
        icon: L.divIcon({
          className: 'store-marker',
          html: '<div style="background:#059669;border-radius:50%;width:12px;height:12px;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>',
          iconSize: [12, 12],
          iconAnchor: [6, 6]
        })
      }).addTo(mapInstance).bindPopup(html)
    })

    mapInstanceRef.current = mapInstance
  }

  return (
    <div className="flex flex-col bg-skin-bg app-screen">
      {/* Header */}
      <div className="px-4 sm:px-5 py-3.5 border-b border-skin-border flex items-center gap-3 bg-skin-bg sticky top-0 z-10">
        <button onClick={() => navigate('/chat')} className="w-10 h-10 rounded-xl bg-skin-card border border-skin-border flex items-center justify-center hover:bg-skin-a1/30 transition-colors">
          <ArrowLeft size={16} className="text-skin-muted" />
        </button>
        <div>
          <p className="font-semibold text-base sm:text-lg text-skin-text">Nearest Clinics & Stores</p>
          <p className="text-xs sm:text-sm text-skin-muted">Real-time locations • Tap markers for details</p>
        </div>
      </div>

      {/* Map Container */}
      <div 
        ref={mapContainerRef}
        id="map-container" 
        className="flex-1 min-h-[320px] rounded-t-3xl -mt-3 sm:-mt-4 mx-2 sm:mx-3 bg-gray-100"
      />

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-10 px-4 sm:px-5 bg-skin-bg border-t border-skin-border">
          <div className="w-12 h-12 rounded-full border-4 border-skin-a2 border-t-transparent animate-spin mb-4" />
          <p className="text-skin-text text-center font-medium">Getting your location...</p>
          <p className="text-xs text-skin-muted mt-2">Finding nearby clinics and stores</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="p-4 sm:p-5 text-center bg-skin-bg border-t border-skin-border">
          <p className="text-skin-text mb-3">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="text-xs px-4 py-2 rounded-full bg-skin-card border border-skin-border text-skin-a2 hover:bg-skin-a1/30 transition-colors"
          >
            🔄 Retry Location
          </button>
        </div>
      )}

      {/* Nearest Summary */}
      {!loading && (nearestClinic || nearestStore) && (
        <div className="px-4 sm:px-5 py-4 space-y-3 bg-skin-bg border-t border-skin-border pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <p className="text-xs text-skin-muted font-medium uppercase tracking-wide">📍 Nearest Options</p>
          
          {nearestClinic && (
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer" 
              onClick={() => window.open(`https://www.google.com/maps/place/${nearestClinic.lat},${nearestClinic.lng}`)}>
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <MapPin size={18} className="text-indigo-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-skin-text truncate">{nearestClinic.name}</p>
                <p className="text-xs text-indigo-700 mt-0.5">🏥 Dermatology Clinic</p>
                <p className="text-xs font-medium text-skin-muted mt-1">📍 {nearestClinic.distance_km} km • {nearestClinic.address}</p>
              </div>
            </div>
          )}

          {nearestStore && (
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => window.open(`https://www.google.com/maps/place/${nearestStore.lat},${nearestStore.lng}`)}>
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <Store size={18} className="text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-skin-text truncate">{nearestStore.name}</p>
                <p className="text-xs text-emerald-700 mt-0.5">🛒 Skincare & Wellness Products</p>
                <p className="text-xs font-medium text-skin-muted mt-1">📍 {nearestStore.distance_km} km • {nearestStore.address}</p>
              </div>
            </div>
          )}

          {locationPermission === 'denied' && (
            <p className="text-xs text-center text-skin-muted pt-2 border-t border-skin-border">
              💡 Enable location in your browser for the most accurate results
            </p>
          )}
        </div>
      )}
    </div>
  )
}
