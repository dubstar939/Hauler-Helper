import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import { useGlobal } from '../context/GlobalContext';
import { useDatabase } from '../context/DatabaseContext';
import { Hauler, HaulerStatus, HaulerType } from '../../types';

interface HaulerMapProps {
  onDraft: (h: Hauler) => void;
  onAddTask: (h: Hauler) => void;
}

export const HaulerMap: React.FC<HaulerMapProps> = ({ onDraft, onAddTask }) => {
  const { isDarkMode } = useGlobal();
  const { haulers } = useDatabase();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const clusterGroupRef = useRef<any>(null);

  useEffect(() => {
    if (mapContainerRef.current && !mapInstanceRef.current) {
      const initialLat = 39.8283; 
      const initialLng = -98.5795;
      
      const map = L.map(mapContainerRef.current).setView([initialLat, initialLng], 4);
      
      const tileUrl = isDarkMode 
        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

      L.tileLayer(tileUrl, {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      }).addTo(map);

      const clusterGroup = (L as any).markerClusterGroup({
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        spiderfyOnMaxZoom: true,
        chunkedLoading: true
      });
      map.addLayer(clusterGroup);
      clusterGroupRef.current = clusterGroup;

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (mapInstanceRef.current) {
      const tileUrl = isDarkMode 
        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
      
      mapInstanceRef.current.eachLayer((layer) => {
        if (layer instanceof L.TileLayer) {
          layer.setUrl(tileUrl);
        }
      });
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (mapInstanceRef.current && clusterGroupRef.current) {
      clusterGroupRef.current.clearLayers();

      const bounds = L.latLngBounds([]);
      let hasPoints = false;

      haulers.forEach(h => {
        if (h.coordinates) {
          hasPoints = true;
          const marker = L.marker(h.coordinates, {
            icon: L.divIcon({
              className: 'custom-marker',
              html: `<div class="bg-indigo-600 w-8 h-8 rounded-full border-4 border-white shadow-xl flex items-center justify-center text-white"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></div>`,
              iconSize: [32, 32],
              iconAnchor: [16, 32]
            })
          });

          const popupContent = document.createElement('div');
          popupContent.className = "p-4 min-w-[200px] font-sans";
          popupContent.innerHTML = `
            <div class="flex items-center gap-2 mb-2">
              <div class="w-2 h-2 rounded-full bg-indigo-500"></div>
              <h4 class="font-black text-sm text-gray-900">${h.name}</h4>
            </div>
            <p class="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-3">${h.location || 'Location Unknown'}</p>
            <div class="space-y-2">
              <button id="draft-${h.id}" class="w-full py-2 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-lg hover:bg-indigo-700 transition shadow-sm">Draft Email</button>
              <button id="task-${h.id}" class="w-full py-2 bg-gray-100 text-gray-700 text-[10px] font-black uppercase rounded-lg hover:bg-gray-200 transition">Add Task</button>
            </div>
            <div class="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
              <span class="text-[9px] font-bold text-gray-400 uppercase">${h.type} Partner</span>
              <span class="text-[9px] font-bold text-indigo-600 uppercase">${h.status}</span>
            </div>
          `;

          marker.bindPopup(popupContent, {
            className: 'custom-leaflet-popup',
            maxWidth: 300
          });

          marker.on('popupopen', () => {
            document.getElementById(`draft-${h.id}`)?.addEventListener('click', () => onDraft(h));
            document.getElementById(`task-${h.id}`)?.addEventListener('click', () => onAddTask(h));
          });

          clusterGroupRef.current.addLayer(marker);
          bounds.extend(h.coordinates);
        }
      });

      if (hasPoints) {
        mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [haulers]);

  return (
    <div className="h-[calc(100vh-200px)] relative overflow-hidden rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xl m-6">
      <div ref={mapContainerRef} className="w-full h-full z-0" />
    </div>
  );
};
