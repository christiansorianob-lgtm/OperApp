import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import * as Battery from 'expo-battery';
import { insertPoint, initTrackingDB } from './db';

const LOCATION_TASK_NAME = 'BACKGROUND_GPS_TRACKING';

// State to track last saved point for smart filtering
let lastSavedPoint: { latitude: number; longitude: number; timestamp: number } | null = null;

// Helper: Haversine Distance in Meters
function getDistanceFromLatLonInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2 - lat1);
    var dLon = deg2rad(lon2 - lon1);
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in km
    return d * 1000; // Distance in meters
}

function deg2rad(deg: number) {
    return deg * (Math.PI / 180);
}

// Define the background task
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
    if (error) {
        console.error('Location Task Error:', error);
        return;
    }
    if (data) {
        const { locations } = data as { locations: Location.LocationObject[] };

        // Initialize DB if not ready (might happen in background)
        try {
            await initTrackingDB();
        } catch (e) {
            console.error("Error initializing DB in background task", e);
            return; // Exit safely
        }

        for (const location of locations) {
            const { latitude, longitude, accuracy, speed, heading } = location.coords;
            const timestamp = location.timestamp;

            // 1. Accuracy Filter: discard if accuracy > 100m
            if (accuracy && accuracy > 100) {
                console.log(`[GPS] Skipped (Low Accuracy: ${accuracy}m)`);
                continue;
            }

            // 2. Smart Filtering (Stationary Filter)
            // If speed is very low (< 0.5 m/s) AND distance from last saved point is small (< 20m),
            // consider it "noise" or "still at same spot" and skip saving to save DB space.
            if (lastSavedPoint) {
                const dist = getDistanceFromLatLonInMeters(
                    lastSavedPoint.latitude,
                    lastSavedPoint.longitude,
                    latitude,
                    longitude
                );

                // If moving very slowly or stopped, and haven't moved far enough to justify a new point
                const currentSpeed = speed || 0;
                if (currentSpeed < 0.5 && dist < 20) {
                    console.log(`[GPS] Skipped (Stationary: ${currentSpeed}m/s, Dist: ${dist.toFixed(1)}m)`);
                    continue;
                }
            }

            // 3. Save to DB
            const batteryLevel = await Battery.getBatteryLevelAsync();

            // Round to 6 decimals (~11cm precision) to save space/bandwidth
            const cleanLat = Math.round(latitude * 1000000) / 1000000;
            const cleanLng = Math.round(longitude * 1000000) / 1000000;

            await insertPoint({
                latitude: cleanLat,
                longitude: cleanLng,
                accuracy,
                batteryLevel,
                timestamp,
                speed: speed || 0,
                heading: heading || 0
                // taskId will be auto-filled by db.ts from app_state
            });

            // Update state
            lastSavedPoint = { latitude: cleanLat, longitude: cleanLng, timestamp };
            console.log(`[GPS] Saved: ${cleanLat}, ${cleanLng} (Spd: ${speed?.toFixed(1)}m/s, Hdg: ${heading?.toFixed(0)})`);
        }
    }
});

export const startBackgroundUpdate = async () => {
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    if (foregroundStatus !== 'granted') {
        console.log('Foreground permission denied');
        return false;
    }

    const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
    if (backgroundStatus !== 'granted') {
        console.log('Background permission denied');
        return false;
    }

    // Stop ensuring clean restart if it was running
    const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
    if (isRegistered) await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);

    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.High,
        timeInterval: 2000,      // Check every 2 seconds
        distanceInterval: 10,    // Only update if moved > 10 meters (Vehicle friendly)
        activityType: Location.ActivityType.AutomotiveNavigation, // Critical for vehicle tracking on iOS
        foregroundService: {
            notificationTitle: "OperApp Tracking",
            notificationBody: "Registrando ruta (Vehículo/Pie)...",
            notificationColor: "#4CAF50",
        },
        showsBackgroundLocationIndicator: true,
        pausesUpdatesAutomatically: false,
    });

    console.log('[GPS] Service started in Automotive Mode');
    return true;
};

export const stopBackgroundUpdate = async () => {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
    if (isRegistered) {
        await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
        console.log('[GPS] Service stopped');
    }
};
