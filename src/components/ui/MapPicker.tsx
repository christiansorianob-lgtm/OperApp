"use client"

import { useState, useRef, useMemo, useEffect } from "react"
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"

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

interface MapPickerProps {
    value?: { lat: number, lng: number }
    onChange: (coords: { lat: number, lng: number }) => void
}

function LocationMarker({ value, onChange }: MapPickerProps) {
    const [position, setPosition] = useState(value || null)
    const map = useMapEvents({
        click(e) {
            setPosition(e.latlng)
            onChange(e.latlng)
        },
    })

    // Update map view if external value changes (optional)
    useEffect(() => {
        if (value && (value.lat !== position?.lat || value.lng !== position?.lng)) {
            setPosition(value)
            map.flyTo(value, map.getZoom())
        }
    }, [value, map])

    return position === null ? null : (
        <Marker position={position}></Marker>
    )
}

export default function MapPicker({ value, onChange }: MapPickerProps) {
    const center = value || { lat: 4.6097, lng: -74.0817 } // Bogota default

    return (
        <div className="h-[300px] w-full rounded-md border overflow-hidden">
            <MapContainer center={center} zoom={13} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationMarker value={value} onChange={onChange} />
            </MapContainer>
        </div>
    )
}
