'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap, LayersControl, CircleMarker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with Next.js/Webpack
const iconRetinaUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png';
const iconUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl,
    iconRetinaUrl,
    shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface Point {
    lat: number;
    lng: number;
    timestamp: string | Date;
    accuracy?: number;
    speed?: number;
}

interface TrackingMapProps {
    points: Point[];
}

function ChangeView({ points }: { points: Point[] }) {
    const map = useMap();

    useEffect(() => {
        if (points && points.length > 0) {
            const bounds = L.latLngBounds(points.map(p => [p.lat, p.lng]));
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [points, map]);

    return null;
}

export default function TrackingMap({ points }: TrackingMapProps) {
    // Helper for Haversine Distance (Meters)
    const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371e3; // metres
        const φ1 = lat1 * Math.PI / 180; // φ, λ in radians
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }

    // Filter and Sort points to ensure trace validity
    const validPoints = React.useMemo(() => {
        if (!points || points.length === 0) return [];

        // 1. Strict Parsing & Basic Validation
        let cleanPoints = points
            .map(p => ({
                ...p,
                lat: Number(p.lat),
                lng: Number(p.lng)
            }))
            .filter(p =>
                !isNaN(p.lat) && !isNaN(p.lng) &&
                p.lat !== 0 && p.lng !== 0 &&
                p.lat >= -90 && p.lat <= 90 &&
                p.lng >= -180 && p.lng <= 180
            );

        if (cleanPoints.length === 0) return [];

        // 2. Sort by Timestamp FIRST (Crucial for sequence)
        cleanPoints.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        // 3. Spike / Jitter Filter (The "V" shape fixer)
        // We look for points that jump away and immediately return to near the start
        const smoothedPoints = [];
        if (cleanPoints.length > 0) smoothedPoints.push(cleanPoints[0]);

        for (let i = 1; i < cleanPoints.length - 1; i++) {
            const prev = smoothedPoints[smoothedPoints.length - 1]; // Use last accepted point as prev
            const curr = cleanPoints[i];
            const next = cleanPoints[i + 1];

            const d1 = getDistance(prev.lat, prev.lng, curr.lat, curr.lng);
            const d2 = getDistance(curr.lat, curr.lng, next.lat, next.lng);
            const base = getDistance(prev.lat, prev.lng, next.lat, next.lng);

            // SPIKE DETECTION:
            // If the point moves far away (d1 > 10m) and comes back (d2 > 10m)
            // AND the base is small relative to the legs (legs are much longer than the direct path i-1 to i+1)
            // e.g. Triangle inequality is always true, but if d1+d2 >> base, it's a detour.
            // If it's a valid detour (walking around a tree), base might be small but we want to keep it?
            // User complaint is a SHARP V.
            // Rule: If (d1 > 20m) AND (d2 > 20m) AND (base < 10m) -> It's a glitch. We skip 'curr'.
            // Adjustment: logic

            const isSpike = d1 > 15 && d2 > 15 && base < 15;

            if (!isSpike) {
                smoothedPoints.push(curr);
            } else {
                // console.log("Filtered Spike:", curr);
            }
        }

        // Always add last point if different
        if (cleanPoints.length > 1) {
            smoothedPoints.push(cleanPoints[cleanPoints.length - 1]);
        }

        return smoothedPoints;
    }, [points]);

    if (!validPoints || validPoints.length === 0) {
        return (
            <div className="flex items-center justify-center h-[300px] bg-muted/20 border rounded-lg text-muted-foreground">
                No hay datos de trazabilidad válidos.
            </div>
        );
    }

    // const pathOptions = { color: 'red', weight: 4 };
    // const polylinePositions = validPoints.map(p => [p.lat, p.lng] as [number, number]);

    const startPoint = validPoints[0];
    const endPoint = validPoints[validPoints.length - 1];

    return (
        <MapContainer
            center={[startPoint.lat, startPoint.lng]}
            zoom={13}
            maxZoom={22}
            scrollWheelZoom={false}
            style={{ height: "400px", width: "100%", borderRadius: "0.5rem", zIndex: 0 }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                maxZoom={20}
            />

            {/* <Polyline pathOptions={pathOptions} positions={polylinePositions} /> */}

            {validPoints.map((point, index) => (
                <CircleMarker
                    key={index}
                    center={[point.lat, point.lng]}
                    pathOptions={{ color: 'red', fillColor: '#ef4444', fillOpacity: 0.8, weight: 1 }}
                    radius={4}
                >
                    <Popup>
                        <div className="text-xs">
                            <strong>Punto #{index + 1}</strong><br />
                            {new Date(point.timestamp).toLocaleString()}<br />
                            <a
                                href={`https://www.google.com/maps?q=${point.lat},${point.lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 underline mt-1 block"
                            >
                                Ver en Google Maps
                            </a>
                        </div>
                    </Popup>
                </CircleMarker>
            ))}

            <Marker position={[startPoint.lat, startPoint.lng]}>
                <Tooltip permanent direction="bottom" offset={[0, 20]} className="font-bold text-sm">
                    <span>Inicio: {new Date(startPoint.timestamp).toLocaleTimeString()}</span>
                </Tooltip>
                <Popup>
                    <div className="text-center">
                        <strong>Punto de Inicio</strong><br />
                        {new Date(startPoint.timestamp).toLocaleString()}<br />
                        <a
                            href={`https://www.google.com/maps?q=${startPoint.lat},${startPoint.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline mt-1 block font-bold"
                        >
                            Ver en Google Maps
                        </a>
                    </div>
                </Popup>
            </Marker>

            {validPoints.length > 1 && (
                <Marker position={[endPoint.lat, endPoint.lng]}>
                    <Tooltip permanent direction="top" offset={[0, -20]} className="font-bold text-sm">
                        <span>Fin: {new Date(endPoint.timestamp).toLocaleTimeString()}</span>
                    </Tooltip>
                    <Popup>
                        <div className="text-center">
                            <strong>Punto Final</strong><br />
                            {new Date(endPoint.timestamp).toLocaleString()}<br />
                            <a
                                href={`https://www.google.com/maps?q=${endPoint.lat},${endPoint.lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 underline mt-1 block font-bold"
                            >
                                Ver en Google Maps
                            </a>
                        </div>
                    </Popup>
                </Marker>
            )}

            <ChangeView points={validPoints} />
        </MapContainer>
    );
}
