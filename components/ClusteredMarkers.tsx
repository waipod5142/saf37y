"use client";

import { useEffect, ReactNode } from "react";
import { useMap } from "react-leaflet";
import { useRouter } from "next/navigation";
import L from "leaflet";
import "leaflet.markercluster";
import { formatRelativeDateTime } from "@/components/ui/date-utils";

interface ClusteredMarkersProps {
  children?: ReactNode;
  locations: Array<{
    id: string;
    latitude: number;
    longitude: number;
    hasDefects: boolean;
    inspectionDate: string;
    inspector: string;
  }>;
  createIcon: (hasDefects: boolean) => any;
  bu: string;
  type: string;
}

export default function ClusteredMarkers({
  children,
  locations,
  createIcon,
  bu,
  type,
}: ClusteredMarkersProps) {
  const map = useMap();
  const router = useRouter();

  // Handle navigation messages from popup content
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "navigate-to-machine" && event.data.machineId) {
        // Capitalize first letter of type
        const capitalizedType = type.charAt(0).toUpperCase() + type.slice(1);
        // Navigate to machine detail page
        router.push(
          `/Machine/${bu}/${capitalizedType}/${encodeURIComponent(event.data.machineId)}`
        );
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [router, bu, type]);

  useEffect(() => {
    if (!map || !locations.length) return;

    // Create marker cluster group
    const markerClusterGroup = L.markerClusterGroup({
      maxClusterRadius: 80,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount();

        // Check if any markers in cluster have defects
        const markers = cluster.getAllChildMarkers();
        const hasDefects = markers.some((marker: any) => {
          return (
            marker.options.title && marker.options.title.includes("defect")
          );
        });

        const color = hasDefects ? "#ef4444" : "#22c55e";

        return L.divIcon({
          html: `<div style="
            background-color: ${color};
            color: white;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 14px;
          ">${count}</div>`,
          className: "marker-cluster",
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        });
      },
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      disableClusteringAtZoom: 15,
    });

    // Create markers and add to cluster group
    locations.forEach((location) => {
      const marker = L.marker([location.latitude, location.longitude], {
        icon: createIcon(location.hasDefects),
        title: location.hasDefects ? "defect-marker" : "pass-marker",
      });

      // Create popup content with navigation

      const popupContent = `
        <div style="padding: 8px; min-width: 200px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <div style="width: 12px; height: 12px; border-radius: 50%; background-color: ${location.hasDefects ? "#ef4444" : "#22c55e"};"></div>
            <span 
              onclick="window.parent.postMessage({type: 'navigate-to-machine', machineId: '${location.id}'}, '*')"
              style="font-weight: bold; color: #2563eb; cursor: pointer; text-decoration: underline;"
              title="Click to view machine details"
            >${location.id}</span>
            <span style="padding: 2px 8px; border-radius: 4px; font-size: 12px; background-color: ${location.hasDefects ? "#ef4444" : "#22c55e"}; color: white;">
              ${location.hasDefects ? "Defects" : "Pass"}
            </span>
          </div>
          <div style="font-size: 14px; color: #4b5563; line-height: 1.4;">
            <div>📅 ${formatRelativeDateTime(location.inspectionDate)}</div>
            <div>👤 Inspector: ${location.inspector}</div>
            <div>📍 ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}</div>
          </div>
          <div style="margin-top: 12px; display: flex; gap: 8px;">
            <button 
              onclick="window.parent.postMessage({type: 'navigate-to-machine', machineId: '${location.id}'}, '*')"
              style="flex: 1; padding: 8px; border: 1px solid #2563eb; border-radius: 4px; background: #2563eb; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px;"
            >
              📋 View Details
            </button>
            <button 
              onclick="window.open('https://www.google.com/maps?q=${location.latitude},${location.longitude}', '_blank')"
              style="flex: 1; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; background: white; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px;"
            >
              🗺️ Maps
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, {
        maxWidth: 300,
        className: "custom-popup",
      });

      markerClusterGroup.addLayer(marker);
    });

    // Add cluster group to map
    map.addLayer(markerClusterGroup);

    // Cleanup
    return () => {
      if (map && markerClusterGroup) {
        map.removeLayer(markerClusterGroup);
      }
    };
  }, [map, locations, createIcon]);

  return null; // This component doesn't render anything directly
}
