import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import * as Battery from 'expo-battery';
import { DeviceEventEmitter } from 'react-native';
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

            // 1. Accuracy Filter: discard if accuracy > 25m (Strict for urban areas)
            if (accuracy && accuracy > 25) {
                console.log(`[GPS] Skipped (Low Accuracy: ${accuracy}m)`);
                continue;
            }

            // 2. Smart Filtering (Stationary Filter)
            // If speed is very low (< 0.5 m/s) AND distance from last saved point is small,
            // consider it "noise" or "still at same spot".
            if (lastSavedPoint) {
                const dist = getDistanceFromLatLonInMeters(
                    lastSavedPoint.latitude,
                    lastSavedPoint.longitude,
                    latitude,
                    longitude
                );

                const currentSpeed = speed || 0;
                // STRICTER FILTER: Reduce noise when stationary (office/traffic)
                // If moving slowly (< 1.0 m/s), ignore movements < 20 meters (GPS drift)
                if (currentSpeed < 1.0 && dist < 20) {
                    console.log(`[GPS] Skipped (Stationary/Drift: ${currentSpeed.toFixed(2)}m/s, Dist: ${dist.toFixed(1)}m)`);
                    continue;
                }

                // Even if speed is reported as higher (sometimes GPS jumps), 
                // ensure we moved at least 5 meters absolute distance to avoid "spiderweb"
                if (dist < 5) {
                    console.log(`[GPS] Skipped (Micro-movement: Dist: ${dist.toFixed(1)}m)`);
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

            // Emit event for UI Pulse
            DeviceEventEmitter.emit('GPS_POINT_SAVED', { timestamp, latitude: cleanLat, longitude: cleanLng });
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
        accuracy: Location.Accuracy.Highest, // CHANGED: Balanced -> Highest (Reduce drift)
        timeInterval: 5000,      // Check every 5 seconds (Relaxed from 2s)
        distanceInterval: 15,    // UPDATE: Increased to 15m minimum movement
        activityType: Location.ActivityType.AutomotiveNavigation,
        foregroundService: {
            notificationTitle: "OperApp Tracking",
            notificationBody: "Registrando actividad...",
            notificationColor: "#16a34a",
        },
        showsBackgroundLocationIndicator: true,
        pausesUpdatesAutomatically: true, // Allow pausing if stationary
    });

    console.log('[GPS] Service started in Optimal Mode');
    return true;
};

export const stopBackgroundUpdate = async () => {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
    if (isRegistered) {
        await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
        console.log('[GPS] Service stopped');
    }
};
