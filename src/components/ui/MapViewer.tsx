"use client"

import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"
import { useEffect, useState } from "react"

// Fix Leaflet Default Icon in Next.js
const iconRetinaUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png'
const iconUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png'
const shadowUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png'

const DefaultIcon = L.icon({
    iconRetinaUrl,
    iconUrl,
    shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
})

L.Marker.prototype.options.icon = DefaultIcon

interface TracePoint {
    lat: number
    lng: number
    timestamp: Date
}

interface MapViewerProps {
    points: TracePoint[]
}

export default function MapViewer({ points }: MapViewerProps) {
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    if (!isMounted) return <div className="h-[400px] w-full bg-slate-100 animate-pulse rounded-md" />
    if (!points || points.length === 0) return <div className="h-[400px] w-full flex items-center justify-center bg-slate-100 text-slate-500 rounded-md">No hay datos de GPS registrados.</div>

    const center = { lat: points[0].lat, lng: points[0].lng }
    const polylinePositions = points.map(p => ({ lat: p.lat, lng: p.lng }))

    return (
        <div className="h-[400px] w-full rounded-md border overflow-hidden shadow-sm">
            <MapContainer center={center} zoom={15} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Start Marker */}
                <Marker position={points[0]}>
                    <Popup>
                        <b>Inicio</b><br />
                        {new Date(points[0].timestamp).toLocaleString()}
                    </Popup>
                </Marker>

                {/* End Marker (if different) */}
                {points.length > 1 && (
                    <Marker position={points[points.length - 1]}>
                        <Popup>
                            <b>Fin</b><br />
                            {new Date(points[points.length - 1].timestamp).toLocaleString()}
                        </Popup>
                    </Marker>
                )}

                <Polyline positions={polylinePositions} color="blue" />
            </MapContainer>
        </div>
    )
}
