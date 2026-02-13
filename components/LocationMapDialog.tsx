"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getInspectionLocationsAction } from "@/lib/actions/machines";

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });
// Custom clustering component using Leaflet MarkerClusterGroup directly
const ClusteredMarkers = dynamic(() => import('./ClusteredMarkers'), { ssr: false });

interface LocationMapDialogProps {
  isOpen: boolean;
  onClose: () => void;
  bu: string;
  site: string;
  type: string;
  siteName?: string;
  typeName?: string;
}

interface InspectionLocation {
  id: string;
  latitude: number;
  longitude: number;
  hasDefects: boolean;
  inspectionDate: string;
  inspector: string;
}

export function LocationMapDialog({
  isOpen,
  onClose,
  bu,
  site,
  type,
  siteName,
  typeName,
}: LocationMapDialogProps) {
  const [locations, setLocations] = useState<InspectionLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([13.7563, 100.5018]); // Default to Bangkok
  const [mapZoom, setMapZoom] = useState(10);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen && bu && site && type) {
      fetchLocations();
    }
  }, [isOpen, bu, site, type]);

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const result = await getInspectionLocationsAction(bu, site, type);
      if (result.success && result.locations) {
        setLocations(result.locations);
        
        // Calculate map center from locations
        if (result.locations.length > 0) {
          const avgLat = result.locations.reduce((sum, loc) => sum + loc.latitude, 0) / result.locations.length;
          const avgLng = result.locations.reduce((sum, loc) => sum + loc.longitude, 0) / result.locations.length;
          setMapCenter([avgLat, avgLng]);
          
          // Set zoom based on location spread
          const latSpread = Math.max(...result.locations.map(l => l.latitude)) - Math.min(...result.locations.map(l => l.latitude));
          const lngSpread = Math.max(...result.locations.map(l => l.longitude)) - Math.min(...result.locations.map(l => l.longitude));
          const maxSpread = Math.max(latSpread, lngSpread);
          
          if (maxSpread > 0.1) setMapZoom(8);
          else if (maxSpread > 0.01) setMapZoom(12);
          else setMapZoom(15);
        }
      } else {
        console.error("Error fetching locations:", result.error);
        setLocations([]);
      }
    } catch (error) {
      console.error("Error in fetchLocations:", error);
      setLocations([]);
    } finally {
      setLoading(false);
    }
  };

  const openInGoogleMaps = (location: InspectionLocation) => {
    const url = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
    window.open(url, '_blank');
  };

  // Fix Leaflet default markers
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('leaflet').then(L => {
        // Fix default marker icons
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });
      });
    }
  }, []);

  const createCustomIcon = (hasDefects: boolean) => {
    if (typeof window === 'undefined') return null;
    
    // Dynamic import to avoid require()
    const L = (window as any).L;
    
    // Create colored markers using divIcon
    const color = hasDefects ? '#ef4444' : '#22c55e';
    
    return L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="
        width: 30px;
        height: 30px;
        border-radius: 50%;
        background-color: ${color};
        border: 3px solid white;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 16px;
      ">●</div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      popupAnchor: [0, -15],
    });
  };

  const displaySiteName = siteName || site.toUpperCase();
  const displayTypeName = typeName || type.charAt(0).toUpperCase() + type.slice(1);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold flex items-center gap-2">
            📍 Inspection Locations - {displayTypeName} at {displaySiteName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="text-gray-600">Loading inspection locations...</div>
            </div>
          ) : locations.length === 0 ? (
            <div className="flex justify-center items-center py-8">
              <div className="text-gray-500">No inspection locations found with GPS data.</div>
            </div>
          ) : (
            <div>
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-2">
                  Total locations: {locations.length} | 
                  With defects: {locations.filter(l => l.hasDefects).length} | 
                  Passed: {locations.filter(l => !l.hasDefects).length}
                </div>
                <div className="flex gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span>Has Defects</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>Passed</span>
                  </div>
                </div>
              </div>

              <div className="h-[500px] w-full border border-gray-200 rounded-lg overflow-hidden">
                {typeof window !== 'undefined' && (
                  <MapContainer
                    center={mapCenter}
                    zoom={mapZoom}
                    style={{ height: '100%', width: '100%' }}
                    ref={mapRef}
                    key={`map-${locations.length}-${mapCenter[0]}-${mapCenter[1]}`}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <ClusteredMarkers 
                      locations={locations}
                      createIcon={createCustomIcon}
                      bu={bu}
                      type={type}
                    >
                      {/* This component handles all markers and clustering internally */}
                    </ClusteredMarkers>
                  </MapContainer>
                )}
              </div>

              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="text-sm text-blue-800">
                  💡 Click on markers to see details, or click numbered clusters to zoom in and expand
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-6 flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}