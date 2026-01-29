import * as ImagePicker from 'expo-image-picker';
import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Image, Linking, Platform, Modal, SafeAreaView, TextInput } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTracking } from '../context/TrackingContext';
import { captureRef } from 'react-native-view-shot';
import * as Location from 'expo-location';
import * as Network from 'expo-network';
import { getItem, setItem } from '../services/db';
import { API_BASE } from '../config';


interface TaskDetailScreenProps {
    task: any;
    onBack: () => void;
    onUpdate: () => void;
    onStartExecution: () => void;
    onTaskUpdate?: (task: any) => void;
}

export default function TaskDetailScreen({ task, onBack, onUpdate, onStartExecution, onTaskUpdate }: TaskDetailScreenProps) {
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [evidences, setEvidences] = useState<string[]>(
        task.evidencias ? task.evidencias.split('\n').filter(Boolean) : []
    );
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    // Watermarking Refs & State
    const viewShotRef = useRef(null);
    const [processingPhoto, setProcessingPhoto] = useState<{ uri: string, meta: string } | null>(null);

    const { startTracking } = useTracking();

    const [reportDetails, setReportDetails] = useState<any[]>([]);
    const [isReportModalVisible, setReportModalVisible] = useState(false);
    const [tempReport, setTempReport] = useState<{ fotoAntes: string | null, fotoDespues: string | null, comentario: string }>({ fotoAntes: null, fotoDespues: null, comentario: '' });
    const [processingType, setProcessingType] = useState<'ANTES' | 'DESPUES' | null>(null);

    // Fetch Report Details
    useEffect(() => {
        const fetchReport = async () => {
            try {
                const res = await fetch(`${API_BASE}/tareas/${task.id}/reporte-fotografico`);
                if (res.ok) {
                    const data = await res.json();
                    setReportDetails(data);
                }
            } catch (e) {
                console.warn("Failed to fetch report details", e);
            }
        };
        fetchReport();
    }, [task.id]); // Reload when task ID changes

    // Update processingPhoto effect to handle report photos
    useEffect(() => {
        if (processingPhoto && viewShotRef.current) {
            const processAndUpload = async () => {
                try {
                    // Wait for render
                    await new Promise(r => setTimeout(r, 500));

                    const uri = await captureRef(viewShotRef, {
                        format: "jpg",
                        quality: 0.2, // Low quality as requested
                        result: "tmpfile"
                    });

                    // Logic branch: If we are in "Report Mode" (processingType is set), save to Temp State
                    // Else, it's a standard Evidence Upload
                    if (processingType) {
                        setTempReport(prev => ({
                            ...prev,
                            [processingType === 'ANTES' ? 'fotoAntes' : 'fotoDespues']: uri
                        }));
                        setProcessingType(null); // Reset
                    } else {
                        // Standard Evidence Upload
                        await uploadEvidence(uri);
                    }

                } catch (e) {
                    console.error("Watermark/Upload failed", e);
                    Alert.alert("Error", "Falló el procesamiento de la foto");
                } finally {
                    setProcessingPhoto(null);
                    setUploading(false);
                }
            };
            processAndUpload();
        }
    }, [processingPhoto]);

    const takeReportPhoto = async (type: 'ANTES' | 'DESPUES') => {
        try {
            // Permissions
            const permission = await ImagePicker.requestCameraPermissionsAsync();
            if (!permission.granted) return Alert.alert("Error", "Se requiere cámara");

            const { status } = await Location.getForegroundPermissionsAsync();
            if (status !== 'granted') return Alert.alert("Error", "Se requiere ubicación");

            setUploading(true);
            setProcessingType(type); // Set tracking mode

            // Location
            let locationText = "";
            try {
                const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
                locationText = `LAT: ${loc.coords.latitude.toFixed(6)} | LNG: ${loc.coords.longitude.toFixed(6)}`;
            } catch (e) {
                const last = await Location.getLastKnownPositionAsync();
                if (last) locationText = `LAT: ${last.coords.latitude.toFixed(6)} | LNG: ${last.coords.longitude.toFixed(6)} (Last)`;
                else {
                    setUploading(false);
                    setProcessingType(null);
                    return Alert.alert("Error", "No GPS");
                }
            }

            const meta = `${new Date().toLocaleString()}\n${locationText}`;

            // Camera
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.2,
                allowsEditing: false,
            });

            if (!result.canceled && result.assets[0]) {
                setProcessingPhoto({ uri: result.assets[0].uri, meta });
                // Effect will trigger next
            } else {
                setUploading(false);
                setProcessingType(null);
            }

        } catch (e) {
            console.error(e);
            setUploading(false);
            setProcessingType(null);
        }
    };

    const saveReportDetail = async () => {
        if (!tempReport.fotoAntes || !tempReport.fotoDespues) {
            return Alert.alert("Incompleto", "Debes tomar ambas fotos (Antes y Después).");
        }

        setUploading(true);
        try {
            // Need to convert files to base64 to send in JSON (since we stored them as string in DB)
            // Or use FormData. The API expects JSON with Base64 strings based on my route code:
            // "const { fotoAntes, fotoDespues, comentario } = body"

            // Helper to convert URI to Base64
            // Expo FileSystem is needed.
            // Since we don't have FileSystem imported, we might fail.
            // Wait, we are in Expo. We need expo-file-system. 
            // I should check if it's installed. Checking package.json...
            // It's not in the visible package.json lines. 
            // I'll assume standard upload logic is safer if I don't confirm FileSystem.
            // But my API expects JSON body. 
            // LET'S USE FormData and change API? No, I wrote the API to expect generic body.
            // Actually, my API `const body = await request.json()` implies JSON.
            // So I MUST send Base64.

            // I'll try to use fetch to getting blob then reader.
            const toBase64 = async (uri: string) => {
                const response = await fetch(uri);
                const blob = await response.blob();
                return new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const base64data = reader.result as string;
                        // reader.result includes "data:image/jpeg;base64,..."
                        // My API might just store that string directly.
                        resolve(base64data.split(',')[1]); // Send just the data, or full string?
                        // Schema says "String". Best to send raw base64 or full data URI.
                        // Let's send full data URI to be safe for <img> tags src.
                        // Actually, if I split, I lose generic type. 
                        // Reader result is perfect.
                        resolve(base64data);
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });
            };

            const fotoAntesBase64 = await toBase64(tempReport.fotoAntes);
            const fotoDespuesBase64 = await toBase64(tempReport.fotoDespues);

            const payload = {
                fotoAntes: fotoAntesBase64,
                fotoDespues: fotoDespuesBase64,
                comentario: tempReport.comentario
            };

            const res = await fetch(`${API_BASE}/tareas/${task.id}/reporte-fotografico`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const responseData = await res.json().catch(async () => {
                const text = await res.text();
                return { error: text || "Error desconocido" };
            });

            if (res.ok) {
                const data = responseData.data || {};
                setReportDetails(prev => [data, ...prev]);
                setReportModalVisible(false);
                setTempReport({ fotoAntes: null, fotoDespues: null, comentario: '' });
                Alert.alert("Guardado", "Registro añadido.");
            } else {
                const detail = responseData.details || responseData.error || "Error desconocido";
                throw new Error(`Error ${res.status}: ${detail}`);
            }

        } catch (e: any) {
            console.error(e);
            Alert.alert("Error", e.message || "No se pudo guardar el registro.");
        } finally {
            setUploading(false);
        }
    };

    const handleShare = async () => {
        try {
            const message = `*Nueva Tarea Asignada*\n\n` +
                `🔹 *Tipo:* ${task.tipo}\n` +
                `📍 *Ubicación:* ${task.proyecto?.nombre || 'Sin Proyecto'}\n` +
                `📅 *Fecha:* ${new Date(task.fechaProgramada).toLocaleDateString()}\n` +
                `📝 *Prioridad:* ${task.prioridad || 'Normal'}\n` +
                `📌 *Estado:* ${task.estado}\n\n` +
                `Obs: ${task.observaciones || 'Sin observaciones'}`;

            const encodedMessage = encodeURIComponent(message);
            const url = `whatsapp://send?text=${encodedMessage}`;
            const webUrl = `https://wa.me/?text=${encodedMessage}`;

            const canOpen = await Linking.canOpenURL(url);

            if (canOpen) {
                await Linking.openURL(url);
            } else {
                await Linking.openURL(webUrl);
            }
        } catch (error) {
            Alert.alert("Error", "No se pudo abrir WhatsApp");
        }
    };

    const handleStartTask = () => {
        Alert.alert(
            "Iniciar Tarea",
            "¿Estás seguro de que deseas iniciar esta actividad?",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Iniciar",
                    onPress: async () => {
                        setLoading(true);
                        try {
                            const response = await fetch(`${API_BASE}/tareas/${task.id}`, {
                                method: 'PUT',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    estado: 'EN_PROCESO',
                                    fechaInicioReal: new Date() // Corrected field name
                                }),
                            });



                            if (response.ok) {
                                if (task.requiereTrazabilidad) {
                                    startTracking(task.id);
                                }
                                if (onTaskUpdate) {
                                    onTaskUpdate({ ...task, estado: 'EN_PROCESO' });
                                }
                                onBack();
                            } else {
                                Alert.alert("Error", "No se pudo iniciar la tarea.");
                            }
                        } catch (error) {
                            console.error(error);
                            Alert.alert("Error", "Error de conexión.");
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const takeEvidence = async () => {
        try {
            // 1. Check Permissions
            const permission = await ImagePicker.requestCameraPermissionsAsync();
            if (!permission.granted) {
                Alert.alert("Permiso Denegado", `Se necesita acceso a la cámara.`);
                return;
            }

            const { status } = await Location.getForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert("Permiso Denegado", "Se requiere permiso de ubicación para tomar fotos georreferenciadas.");
                return;
            }

            // 2. Get Location (MANDATORY)
            setUploading(true); // Reuse spinner to indicate "Working..."
            let locationText = "";

            try {
                // Try to get high accuracy first
                const loc = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.High
                    // timeout: 10000 // default is usually fine, but avoid hanging forever
                });

                locationText = `LAT: ${loc.coords.latitude.toFixed(6)} | LNG: ${loc.coords.longitude.toFixed(6)}`;
            } catch (gpsError) {
                console.warn("GPS Error", gpsError);
                // Fallback? No, User said Mandatory.
                // But maybe try 'LAST KNOWN' if current fails? 
                const lastLoc = await Location.getLastKnownPositionAsync();
                if (lastLoc) {
                    locationText = `LAT: ${lastLoc.coords.latitude.toFixed(6)} | LNG: ${lastLoc.coords.longitude.toFixed(6)} (Ultima conocida)`;
                } else {
                    setUploading(false);
                    Alert.alert("Error GPS", "No se pudo obtener la ubicación. Es obligatorio georreferenciar la evidencia.");
                    return;
                }
            }

            const dateText = new Date().toLocaleString();
            const meta = `${dateText}\n${locationText}`;

            setUploading(false); // Stop spinner before opening camera UI

            // 3. Launch Camera
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.2,
                allowsEditing: false,
            });

            if (!result.canceled && result.assets[0]) {
                setUploading(true); // Restart spinner for processing
                setProcessingPhoto({ uri: result.assets[0].uri, meta });
            }

        } catch (error: any) {
            console.error("Camera/GPS Error:", error);
            Alert.alert("Error", error?.message || String(error));
            setUploading(false);
        }
    };

    // Effect to process watermark and upload
    useEffect(() => {
        if (processingPhoto && viewShotRef.current) {
            const processAndUpload = async () => {
                try {
                    // Wait for render
                    await new Promise(r => setTimeout(r, 500));

                    const uri = await captureRef(viewShotRef, {
                        format: "jpg",
                        quality: 0.2,
                        result: "tmpfile"
                    });

                    // Proceed to upload the WATERMARKED uri
                    await uploadEvidence(uri);

                } catch (e) {
                    console.error("Watermark/Upload failed", e);
                    Alert.alert("Error", "Falló el procesamiento de la foto");
                    setUploading(false);
                } finally {
                    setProcessingPhoto(null);
                }
            };
            processAndUpload();
        }
    }, [processingPhoto]);

    const uploadEvidence = async (uri: string) => {
        try {
            const formData = new FormData();
            const filename = uri.split('/').pop() || "evidence.jpg";
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : `image/jpeg`;

            // @ts-ignore
            formData.append('file', { uri, name: filename, type });

            const response = await fetch(`${API_BASE}/tareas/${task.id}/evidence`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                body: formData,
            });

            // Read response once
            let json;
            let textBody;
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                json = await response.json();
            } else {
                textBody = await response.text();
            }

            if (response.ok) {
                const data = json || {};
                Alert.alert("Éxito", "Evidencia subida correctamente.");
                if (data.url) {
                    const fullUrl = data.url.startsWith('http') ? data.url : `${API_BASE.replace('/api/v1/tareas', '')}${data.url}`;
                    setEvidences(prev => [...prev, fullUrl]);
                }
            } else {
                let errorMessage = "Error del servidor: " + response.status;
                if (json) {
                    if (json.details) errorMessage += `\n${json.details}`;
                    else if (json.error) errorMessage += `\n${json.error}`;
                } else if (textBody) {
                    errorMessage += `\n${textBody.substring(0, 50)}`;
                }
                throw new Error(errorMessage);
            }
        } catch (error: any) {
            console.warn("Upload Error:", error);

            // Check if it's a network error (Offline) or Server Error (Online but failed)
            const isNetworkError = error.message && (
                error.message.includes('Network request failed') ||
                error.message.includes('Network Error') ||
                error.message === 'Network error'
            );

            if (isNetworkError) {
                // Offline Fallback: Save to Draft
                try {
                    const DRAFT_KEY = `DRAFT_TASK_${task.id}`;
                    const draftStr = await getItem(DRAFT_KEY);
                    const draft = draftStr ? JSON.parse(draftStr) : {};

                    // Add to draft photos
                    const currentPhotos = draft.photos || [];
                    const exists = currentPhotos.some((p: any) => p.uri === uri);
                    if (!exists) {
                        draft.photos = [...currentPhotos, { uri, meta: null }];
                        await setItem(DRAFT_KEY, JSON.stringify(draft));
                        Alert.alert(
                            "Guardado Offline",
                            "Sin conexión. La foto se guardó en el borrador. Podrás enviarla desde 'Registrar Datos / Finalizar'."
                        );
                    } else {
                        Alert.alert("Aviso", "Esta foto ya está guardada.");
                    }
                } catch (draftError) {
                    console.error("Draft Save Error:", draftError);
                    Alert.alert("Fallo Total", "No se pudo subir ni guardar offline.");
                }
            } else {
                // Server Error (Online but rejected)
                Alert.alert("Error de Servidor", `No se pudo guardar la evidencia. Intenta nuevamente. (${error.message})`);
            }
        } finally {
            setUploading(false);
        }
    };



    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PROGRAMADA': return '#fbbf24';
            case 'EN_PROCESO': return '#3b82f6';
            case 'EJECUTADA': return '#10b981';
            case 'CANCELADA': return '#ef4444';
            default: return '#9ca3af';
        }
    };

    return (
        <View style={styles.container}>
            {/* Hidden View for Watermarking */}
            {processingPhoto && (
                <View style={{ position: 'absolute', left: -9999, top: 0 }}>
                    <View
                        ref={viewShotRef}
                        collapsable={false}
                        style={{ width: 600, height: 800, backgroundColor: 'black' }}
                    >
                        <Image
                            source={{ uri: processingPhoto.uri }}
                            style={{ width: '100%', height: '100%', resizeMode: 'cover' }}
                        />
                        <View style={{
                            position: 'absolute', bottom: 20, right: 20,
                            backgroundColor: 'rgba(0,0,0,0.6)', padding: 10, borderRadius: 8
                        }}>
                            <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold', textAlign: 'right' }}>
                                {processingPhoto.meta}
                            </Text>
                        </View>
                    </View>
                </View>
            )}

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Detalle de Tarea</Text>

                <TouchableOpacity onPress={handleShare} style={styles.backButton}>
                    <Feather name="share-2" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content}>


                {/* Title & Status */}
                <View style={styles.statusRow}>
                    <View style={[styles.badge, { backgroundColor: getStatusColor(task.estado) }]}>
                        <Text style={styles.badgeText}>{task.estado}</Text>
                    </View>
                    {task.prioridad && (
                        <View style={[styles.badge, { backgroundColor: task.prioridad === 'ALTA' ? '#ef4444' : '#6b7280', marginLeft: 8 }]}>
                            <Text style={styles.badgeText}>{task.prioridad}</Text>
                        </View>
                    )}
                </View>

                <Text style={styles.title}>{task.descripcion || task.tipo}</Text>

                {task.estado === 'EN_PROCESO' && (
                    <View style={{ marginBottom: 20 }}>
                        {/* Timer or Status Indicator - Use Real Start Date if available, else update time */}
                        <TaskTimer startDate={task.fechaInicioReal || task.updatedAt} />
                    </View>
                )}

                {/* Info Card */}
                <View style={styles.infoCard}>
                    <View style={styles.row}>
                        <Feather name="calendar" size={20} color="#6b7280" />
                        <Text style={styles.infoText}>
                            {new Date(task.fechaProgramada).toLocaleDateString()}
                        </Text>
                    </View>

                    <View style={styles.row}>
                        <Feather name="map-pin" size={20} color="#6b7280" />
                        <View>
                            <Text style={styles.infoText}>{task.proyecto?.nombre || 'Sin Proyecto'}</Text>
                        </View>
                    </View>

                    {task.responsable && (
                        <View style={styles.row}>
                            <Feather name="user" size={20} color="#6b7280" />
                            <Text style={styles.infoText}>{task.responsable.nombre}</Text>
                        </View>
                    )}
                </View>

                {/* Execution Summary (Details after completion) */}
                {task.estado === 'EJECUTADA' && (
                    <View style={styles.infoCard}>
                        <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>Resumen de Ejecución</Text>

                        <View style={styles.row}>
                            <Feather name="play-circle" size={20} color="#16a34a" />
                            <View>
                                <Text style={styles.fieldLabel}>Inicio</Text>
                                <Text style={styles.infoText}>
                                    {task.fechaInicioReal ? new Date(task.fechaInicioReal).toLocaleString() : 'N/A'}
                                </Text>
                            </View>
                        </View>

                        <View style={[styles.row, { marginTop: 12 }]}>
                            <Feather name="stop-circle" size={20} color="#ef4444" />
                            <View>
                                <Text style={styles.fieldLabel}>Fin</Text>
                                <Text style={styles.infoText}>
                                    {task.fechaEjecucion ? new Date(task.fechaEjecucion).toLocaleString() : 'N/A'}
                                </Text>
                            </View>
                        </View>

                        <View style={[styles.row, { marginTop: 12, borderTopWidth: 1, borderColor: '#f3f4f6', paddingTop: 12 }]}>
                            <Feather name="clock" size={20} color="#3b82f6" />
                            <View>
                                <Text style={styles.fieldLabel}>Duración Total</Text>
                                <Text style={[styles.infoText, { fontWeight: 'bold', color: '#1f2937' }]}>
                                    {formatDuration(task.fechaInicioReal, task.fechaEjecucion)}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Observaciones */}
                {task.observaciones && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Observaciones</Text>
                        <Text style={styles.sectionText}>{task.observaciones}</Text>
                    </View>
                )}

                {/* Reporte Fotográfico Section */}
                {(task.estado === 'EN_PROCESO' || reportDetails.length > 0) && (
                    <View style={styles.section}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                            <Text style={styles.sectionTitle}>Reporte Fotográfico ({reportDetails.length})</Text>
                            {task.estado === 'EN_PROCESO' && (
                                <TouchableOpacity onPress={() => setReportModalVisible(true)} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#dcfce7', padding: 6, borderRadius: 8 }}>
                                    <Feather name="plus-circle" size={16} color="#16a34a" style={{ marginRight: 4 }} />
                                    <Text style={{ color: '#16a34a', fontWeight: 'bold' }}>Agregar</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {reportDetails.map((item, idx) => (
                            <View key={item.id || idx} style={{ marginBottom: 15, padding: 10, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb' }}>
                                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 8 }}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 10, color: '#6b7280', marginBottom: 4 }}>ANTES</Text>
                                        <TouchableOpacity onPress={() => setSelectedImage(item.fotoAntes.startsWith('http') ? item.fotoAntes : `${API_BASE.replace('/api/v1/tareas', '')}${item.fotoAntes}`)}>
                                            <Image
                                                source={{ uri: item.fotoAntes.startsWith('http') ? item.fotoAntes : `${API_BASE.replace('/api/v1/tareas', '')}${item.fotoAntes}` }}
                                                style={{ width: '100%', height: 100, borderRadius: 6, backgroundColor: '#f3f4f6' }}
                                                resizeMode="cover"
                                            />
                                        </TouchableOpacity>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 10, color: '#6b7280', marginBottom: 4 }}>DESPUÉS</Text>
                                        <TouchableOpacity onPress={() => setSelectedImage(item.fotoDespues.startsWith('http') ? item.fotoDespues : `${API_BASE.replace('/api/v1/tareas', '')}${item.fotoDespues}`)}>
                                            <Image
                                                source={{ uri: item.fotoDespues.startsWith('http') ? item.fotoDespues : `${API_BASE.replace('/api/v1/tareas', '')}${item.fotoDespues}` }}
                                                style={{ width: '100%', height: 100, borderRadius: 6, backgroundColor: '#f3f4f6' }}
                                                resizeMode="cover"
                                            />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                {item.comentario && <Text style={{ fontStyle: 'italic', color: '#374151', fontSize: 12 }}>"{item.comentario}"</Text>}
                            </View>
                        ))}
                    </View>
                )}

                {/* Evidences Section */}
                {(evidences.length > 0 || task.estado === 'EN_PROCESO') && (
                    <View style={styles.section}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={styles.sectionTitle}>Evidencias Generales ({evidences.length})</Text>
                            {task.estado === 'EN_PROCESO' && (
                                <View style={{ alignItems: 'center' }}>
                                    <TouchableOpacity onPress={takeEvidence} disabled={uploading}>
                                        {uploading && !processingType ? <ActivityIndicator size="small" color="#16a34a" /> : <Feather name="camera" size={20} color="#16a34a" />}
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>

                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.evidenceRow}>
                            {evidences.map((url, index) => (
                                <TouchableOpacity key={index} style={styles.evidenceItem} onPress={() => setSelectedImage(url.startsWith('http') ? url : `${API_BASE.replace('/api/v1/tareas', '')}${url}`)}>
                                    <Image
                                        source={{ uri: url.startsWith('http') ? url : `${API_BASE.replace('/api/v1/tareas', '')}${url}` }}
                                        style={styles.evidenceImage}
                                        resizeMode="cover"
                                    />
                                </TouchableOpacity>
                            ))}
                            {evidences.length === 0 && (
                                <Text style={{ color: '#9ca3af', fontStyle: 'italic' }}>Sin evidencias generales</Text>
                            )}
                        </ScrollView>
                    </View>
                )}

                {/* Actions */}
                <View style={styles.actionContainer}>
                    {task.estado === 'PROGRAMADA' && (
                        <TouchableOpacity
                            style={[styles.button, { backgroundColor: '#16a34a' }]}
                            onPress={handleStartTask}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Feather name="play" size={24} color="#fff" style={{ marginRight: 8 }} />
                                    <Text style={styles.buttonText}>Iniciar Tarea</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}

                    {task.estado === 'EN_PROCESO' && (
                        <>
                            <TouchableOpacity
                                style={[styles.button, { backgroundColor: '#3b82f6' }]}
                                onPress={onStartExecution}
                            >
                                <Feather name="edit-3" size={24} color="#fff" style={{ marginRight: 8 }} />
                                <Text style={styles.buttonText}>Registrar Datos / Finalizar</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>

                {/* Spacer for bottom */}
                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Image Viewer Modal */}
            <Modal
                visible={!!selectedImage}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setSelectedImage(null)}
            >
                <View style={styles.modalContainer}>
                    <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedImage(null)}>
                        <Feather name="x" size={32} color="#fff" />
                    </TouchableOpacity>
                    {selectedImage && (
                        <Image
                            source={{ uri: selectedImage }}
                            style={styles.fullImage}
                            resizeMode="contain"
                        />
                    )}
                    <Image
                        source={require('../../assets/logo-ravelo-transparent.png')}
                        style={{
                            position: 'absolute',
                            top: 90,
                            right: 20,
                            width: 100,
                            height: 50,
                            opacity: 0.5,
                            zIndex: 10
                        }}
                        resizeMode="contain"
                    />
                </View>
            </Modal>

            {/* Report Form Modal */}
            <Modal
                visible={isReportModalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setReportModalVisible(false)}
            >
                <View style={{ flex: 1, backgroundColor: '#f9fafb', padding: 20 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Nuevo Registro Fotográfico</Text>
                        <TouchableOpacity
                            onPress={() => setReportModalVisible(false)}
                            style={{ padding: 10 }}
                            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                        >
                            <Feather name="x" size={24} color="#374151" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView>
                        {/* Foto Antes */}
                        <Text style={styles.fieldLabel}>1. Foto Antes</Text>
                        <TouchableOpacity
                            onPress={() => takeReportPhoto('ANTES')}
                            style={{
                                height: 150, backgroundColor: '#e5e7eb', borderRadius: 8,
                                justifyContent: 'center', alignItems: 'center', marginBottom: 20,
                                borderWidth: 1, borderColor: '#d1d5db', borderStyle: 'dashed'
                            }}
                        >
                            {tempReport.fotoAntes ? (
                                <Image source={{ uri: tempReport.fotoAntes }} style={{ width: '100%', height: '100%', borderRadius: 8 }} />
                            ) : (
                                <View style={{ alignItems: 'center' }}>
                                    <Feather name="camera" size={30} color="#9ca3af" />
                                    <Text style={{ color: '#6b7280', marginTop: 8 }}>Tomar Foto Antes</Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        {/* Foto Despues */}
                        <Text style={styles.fieldLabel}>2. Foto Después</Text>
                        <TouchableOpacity
                            onPress={() => takeReportPhoto('DESPUES')}
                            style={{
                                height: 150, backgroundColor: '#e5e7eb', borderRadius: 8,
                                justifyContent: 'center', alignItems: 'center', marginBottom: 20,
                                borderWidth: 1, borderColor: '#d1d5db', borderStyle: 'dashed'
                            }}
                        >
                            {tempReport.fotoDespues ? (
                                <Image source={{ uri: tempReport.fotoDespues }} style={{ width: '100%', height: '100%', borderRadius: 8 }} />
                            ) : (
                                <View style={{ alignItems: 'center' }}>
                                    <Feather name="camera" size={30} color="#9ca3af" />
                                    <Text style={{ color: '#6b7280', marginTop: 8 }}>Tomar Foto Después</Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        {/* Comentario */}
                        <Text style={styles.fieldLabel}>3. Observación</Text>
                        <View style={{ backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db', padding: 10, height: 100, marginBottom: 20 }}>
                            <TextInput
                                placeholder="Escribe una observación..."
                                multiline
                                value={tempReport.comentario}
                                onChangeText={t => setTempReport({ ...tempReport, comentario: t })}
                                style={{ flex: 1, textAlignVertical: 'top' }}
                            />
                        </View>

                        {/* Save Button */}
                        <TouchableOpacity
                            style={[styles.button, { backgroundColor: uploading ? '#9ca3af' : '#16a34a' }]}
                            onPress={saveReportDetail}
                            disabled={uploading}
                        >
                            {uploading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Guardar Registro</Text>}
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </Modal>
        </View >
    );
}

// Helper Component for Timer
function TaskTimer({ startDate }: { startDate: string }) {
    const [elapsed, setElapsed] = React.useState("");

    React.useEffect(() => {
        if (!startDate) return;

        const start = new Date(startDate).getTime();
        const interval = setInterval(() => {
            const now = new Date().getTime();
            const diff = now - start;

            // If diff is unreasonably large (e.g. > 1 year) or negative, just show 'Initiated'
            if (diff > 31536000000) {
                setElapsed("Fecha inválida");
            } else if (diff >= 0) {
                const hours = Math.floor(diff / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000); // Optional: add seconds
                setElapsed(`${hours}h ${minutes}m ${seconds}s`);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [startDate]);

    return (
        <View style={styles.timerContainer}>
            <Feather name="clock" size={20} color="#ef4444" />
            <Text style={styles.timerText}>En curso: {elapsed || "0h 0m"}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        backgroundColor: '#16a34a',
        paddingTop: 50,
        paddingBottom: 20,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    backButton: {
        padding: 4,
    },
    content: {
        flex: 1,
        padding: 20,
    },
    statusRow: {
        flexDirection: 'row',
        marginBottom: 10,
        alignItems: 'center'
    },
    timerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#fee2e2',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#fca5a5',
        alignSelf: 'flex-start'
    },
    timerText: {
        color: '#b91c1c',
        fontWeight: 'bold',
        fontSize: 14
    },
    badge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        alignSelf: 'flex-start'
    },
    badgeText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 20,
    },
    infoCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        gap: 12,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    infoText: {
        fontSize: 16,
        color: '#4b5563',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#374151',
        marginBottom: 8,
    },
    sectionText: {
        fontSize: 15,
        color: '#6b7280',
        lineHeight: 22,
    },
    actionContainer: {
        gap: 16,
        marginTop: 20,
    },
    button: {
        flexDirection: 'row',
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    evidenceRow: {
        flexDirection: 'row',
        marginTop: 8,
    },
    evidenceItem: {
        marginRight: 10,
        borderRadius: 8,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    evidenceImage: {
        width: 100,
        height: 100,
    },
    fieldLabel: {
        fontSize: 12,
        color: '#6b7280',
        fontWeight: 'bold',
        marginBottom: 2
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.95)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 10,
        padding: 10,
    },
    fullImage: {
        width: '100%',
        height: '90%',
    }
});

// Helper function
function formatDuration(start?: string, end?: string) {
    if (!start || !end) return "No calculable";
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const diff = endTime - startTime;

    if (diff < 0) return "--";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes} min`;
}
