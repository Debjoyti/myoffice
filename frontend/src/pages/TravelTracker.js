import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import {
    MapPin, Play, Square, Share2, Trash2, Navigation, Clock,
    Route, ChevronRight, Plus, X, Activity, Wifi, WifiOff, Eye
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '';

// ─────────────────── Google Maps Loader ───────────────────
let googleMapsLoaded = false;
let googleMapsCallbacks = [];
const loadGoogleMaps = (callback) => {
    if (window.google && window.google.maps) { callback(); return; }
    googleMapsCallbacks.push(callback);
    if (googleMapsLoaded) return;
    googleMapsLoaded = true;
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=geometry`;
    script.async = true;
    script.defer = true;
    script.onload = () => googleMapsCallbacks.forEach(cb => cb());
    document.head.appendChild(script);
};

// ─────────────────── Map Component ───────────────────
const TripMap = ({ locations = [], isLive = false }) => {
    const mapRef = useRef(null);
    const [mapInstance, setMapInstance] = useState(null);
    const polylineRef = useRef(null);
    const markerRef = useRef(null);

    useEffect(() => {
        loadGoogleMaps(() => {
            if (!mapRef.current) return;
            const map = new window.google.maps.Map(mapRef.current, {
                center: locations.length > 0
                    ? { lat: locations[0].lat, lng: locations[0].lng }
                    : { lat: 20.5937, lng: 78.9629 },
                zoom: locations.length > 0 ? 14 : 5,
                styles: darkMapStyles,
                disableDefaultUI: true,
                zoomControl: true,
            });
            setMapInstance(map);
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [// eslint-disable-next-line react-hooks/exhaustive-deps
]);

    useEffect(() => {
        if (!mapInstance || locations.length === 0) return;

        // Draw polyline
        if (polylineRef.current) polylineRef.current.setMap(null);
        polylineRef.current = new window.google.maps.Polyline({
            path: locations,
            geodesic: true,
            strokeColor: '#3b82f6',
            strokeOpacity: 0.9,
            strokeWeight: 4,
            map: mapInstance,
        });

        // Live marker at latest position
        const latest = locations[locations.length - 1];
        if (markerRef.current) markerRef.current.setMap(null);
        markerRef.current = new window.google.maps.Marker({
            position: latest,
            map: mapInstance,
            title: isLive ? 'Live Position' : 'Last Position',
            icon: {
                path: window.google.maps.SymbolPath.CIRCLE,
                fillColor: isLive ? '#22c55e' : '#3b82f6',
                fillOpacity: 1,
                strokeColor: '#fff',
                strokeWeight: 3,
                scale: 10,
            },
        });

        // Pan to latest
        mapInstance.panTo(latest);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [locations, mapInstance, isLive// eslint-disable-next-line react-hooks/exhaustive-deps
// eslint-disable-next-line react-hooks/exhaustive-deps

]);

    return (
        <div ref={mapRef} style={{ width: '100%', height: '100%', borderRadius: '20px' }}>
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                height: '100%', color: '#475569', fontWeight: 600, fontSize: '14px',
                background: '#0f172a', borderRadius: '20px'
            }}>
                Loading Map...
            </div>
        </div>
    );
};

// ─────────────────── Main Page ───────────────────
const TravelTracker = ({ user, onLogout }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [trips, setTrips] = useState([// eslint-disable-next-line react-hooks/exhaustive-deps
// eslint-disable-next-line react-hooks/exhaustive-deps

]);
    const [activeTrip, setActiveTrip] = useState(null);
    const [liveLocations, setLiveLocations] = useState([// eslint-disable-next-line react-hooks/exhaustive-deps
// eslint-disable-next-line react-hooks/exhaustive-deps

]);
    const [viewTrip, setViewTrip] = useState(null);
    const [viewLocations, setViewLocations] = useState([// eslint-disable-next-line react-hooks/exhaustive-deps
// eslint-disable-next-line react-hooks/exhaustive-deps

]);
    const [isTracking, setIsTracking] = useState(false);
    const [isLive, setIsLive] = useState(false);
    const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, ok, error
    const [newTripTitle, setNewTripTitle] = useState('');
    const [showNewTripModal, setShowNewTripModal] = useState(false);
    const watchIdRef = useRef(null);
    const pollRef = useRef(null);

    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    // ── Fetch trip list
    const fetchTrips = useCallback(async () => {
        try {
            const res = await axios.get(`${API}/trips`, { headers });
            setTrips(res.data);
        } catch (e) { console.error(e); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [// eslint-disable-next-line react-hooks/exhaustive-deps
]);

    useEffect(() => { fetchTrips(); }, [fetchTrips// eslint-disable-next-line react-hooks/exhaustive-deps
// eslint-disable-next-line react-hooks/exhaustive-deps

]);

    // ── Start a new trip
    const startTrip = async () => {
        const title = newTripTitle.trim() || 'My Trip';
        try {
            const res = await axios.post(`${API}/trips`, { title }, { headers });
            setActiveTrip(res.data);
            setLiveLocations([// eslint-disable-next-line react-hooks/exhaustive-deps
// eslint-disable-next-line react-hooks/exhaustive-deps

]);
            setIsTracking(true);
            setShowNewTripModal(false);
            setNewTripTitle('');
            fetchTrips();
            startWatching(res.data.id);
        } catch (e) { alert('Failed to start trip'); }
    };

    // ── Geolocation watcher
    const startWatching = (tripId) => {
        if (!navigator.geolocation) { alert('Geolocation not supported'); return; }
        watchIdRef.current = navigator.geolocation.watchPosition(
            async (pos) => {
                const { latitude: lat, longitude: lng } = pos.coords;
                setSyncStatus('syncing');
                try {
                    await axios.post(`${API}/location`, { trip_id: tripId, lat, lng }, { headers });
                    setLiveLocations(prev => [...prev, { lat, lng }// eslint-disable-next-line react-hooks/exhaustive-deps
// eslint-disable-next-line react-hooks/exhaustive-deps

]);
                    setSyncStatus('ok');
                } catch {
                    setSyncStatus('error');
                }
            },
            (err) => { console.error(err); setSyncStatus('error'); },
            { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
        );
    };

    // ── Stop trip
    const stopTrip = async () => {
        if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
        try {
            await axios.post(`${API}/trip/${activeTrip.id}/end`, {}, { headers });
        } catch (e) { console.error(e); }
        setIsTracking(false);
        setSyncStatus('idle');
        setActiveTrip(null);
        fetchTrips();
    };

    // ── View a trip on the map
    const viewTripOnMap = async (trip) => {
        setViewTrip(trip);
        setIsLive(trip.status === 'active');
        try {
            const res = await axios.get(`${API}/trip/${trip.id}`, { headers });
            setViewLocations(res.data.locations.map(l => ({ lat: l.lat, lng: l.lng })));
        } catch (e) { console.error(e); }
    };

    // ── Live polling for viewed trip
    useEffect(() => {
        if (pollRef.current) clearInterval(pollRef.current);
        if (viewTrip && isLive) {
            pollRef.current = setInterval(async () => {
                try {
                    const res = await axios.get(`${API}/trip/${viewTrip.id}`, { headers });
                    setViewLocations(res.data.locations.map(l => ({ lat: l.lat, lng: l.lng })));
                } catch (e) { console.error(e); }
            }, 5000);
        }
        return () => { if (pollRef.current) clearInterval(pollRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [viewTrip, isLive// eslint-disable-next-line react-hooks/exhaustive-deps
// eslint-disable-next-line react-hooks/exhaustive-deps

]);

    // ── Delete trip
    const deleteTrip = async (tripId) => {
        if (!window.confirm('Delete this trip?')) return;
        try {
            await axios.delete(`${API}/trip/${tripId}`, { headers });
            if (viewTrip?.id === tripId) setViewTrip(null);
            fetchTrips();
        } catch (e) { alert('Failed to delete'); }
    };

    // ── Share link
    const shareTrip = (tripId) => {
        const url = `${window.location.origin}/travel-tracker?view=${tripId}`;
        navigator.clipboard.writeText(url);
        alert('Shareable link copied! (Viewer needs to log in)');
    };

    const getDuration = (start, end) => {
        const s = new Date(start);
        const e = end ? new Date(end) : new Date();
        const diff = Math.floor((e - s) / 1000);
        const h = Math.floor(diff / 3600);
        const m = Math.floor((diff % 3600) / 60);
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
    };

    const syncColors = { idle: '#475569', syncing: '#f59e0b', ok: '#22c55e', error: '#ef4444' };
    const syncLabels = { idle: 'Idle', syncing: 'Syncing...', ok: 'Live', error: 'Error' };

    return (
        <div style={{ display: 'flex', fontFamily: "'Inter', sans-serif", minHeight: '100vh', background: '#0f172a' }}>
            <Sidebar
                user={user} onLogout={onLogout}
                activePage="travel-tracker"
                setActivePage={() => { }}
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
            />

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

                {/* ── Header */}
                <div style={{
                    padding: '24px 32px', borderBottom: '1px solid rgba(255,255,255,0.06)',
                    background: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(12px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    flexShrink: 0
                }}>
                    <div>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', margin: '0 0 2px' }}>Track & Explore</p>
                        <h1 style={{ color: '#fff', fontSize: '26px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                            Travel Tracker 🌍
                        </h1>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {isTracking && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', padding: '8px 16px', borderRadius: '50px' }}>
                                {syncStatus === 'ok' || syncStatus === 'syncing'
                                    ? <Wifi size={16} color={syncColors[syncStatus]} />
                                    : <WifiOff size={16} color={syncColors[syncStatus]} />
                                }
                                <span style={{ color: syncColors[syncStatus], fontSize: '13px', fontWeight: 700 }}>{syncLabels[syncStatus]}</span>
                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: syncColors[syncStatus], animation: 'pulse 2s infinite' }} />
                            </div>
                        )}
                        <button
                            onClick={() => setShowNewTripModal(true)}
                            disabled={isTracking}
                            style={{
                                background: isTracking ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #3b82f6, #6366f1)',
                                color: isTracking ? '#475569' : '#fff',
                                border: 'none', padding: '10px 20px', borderRadius: '12px',
                                fontWeight: 700, fontSize: '14px', cursor: isTracking ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', gap: '8px',
                                boxShadow: isTracking ? 'none' : '0 4px 20px rgba(59,130,246,0.3)',
                                transition: 'all 0.2s'
                            }}
                        >
                            <Plus size={18} /> New Trip
                        </button>
                    </div>
                </div>

                {/* ── Active trip banner */}
                {isTracking && activeTrip && (
                    <div style={{
                        background: 'rgba(59,130,246,0.08)', borderBottom: '1px solid rgba(59,130,246,0.2)',
                        padding: '12px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Activity size={18} color="#3b82f6" />
                            <span style={{ color: '#fff', fontWeight: 700 }}>{activeTrip.title}</span>
                            <span style={{ color: '#475569', fontSize: '13px' }}>·</span>
                            <span style={{ color: '#64748b', fontSize: '13px' }}>{liveLocations.length} points tracked</span>
                        </div>
                        <button
                            onClick={stopTrip}
                            style={{
                                background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)',
                                color: '#ef4444', padding: '8px 16px', borderRadius: '10px',
                                fontWeight: 700, fontSize: '13px', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '8px'
                            }}
                        >
                            <Square size={14} fill="#ef4444" /> End Trip
                        </button>
                    </div>
                )}

                {/* ── Main Content */}
                <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

                    {/* Left: Trip List */}
                    <div style={{
                        width: '340px', minWidth: '340px', borderRight: '1px solid rgba(255,255,255,0.06)',
                        overflowY: 'auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '8px'
                    }}>
                        <p style={{ color: '#475569', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 8px', margin: '4px 0 8px' }}>
                            {trips.length} Trip{trips.length !== 1 ? 's' : ''}
                        </p>

                        {trips.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '48px 20px', color: '#334155' }}>
                                <Route size={40} style={{ margin: '0 auto 12px' }} />
                                <p style={{ fontWeight: 700, marginBottom: 4 }}>No trips yet</p>
                                <p style={{ fontSize: '13px' }}>Start a new trip to begin tracking.</p>
                            </div>
                        )}

                        {trips.map(trip => (
                            <div
                                key={trip.id}
                                onClick={() => viewTripOnMap(trip)}
                                style={{
                                    background: viewTrip?.id === trip.id ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.03)',
                                    border: `1px solid ${viewTrip?.id === trip.id ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.06)'}`,
                                    borderRadius: '14px', padding: '14px 16px', cursor: 'pointer',
                                    transition: 'all 0.15s'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ color: '#fff', fontWeight: 700, fontSize: '14px', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {trip.title}
                                        </p>
                                        <p style={{ color: '#475569', fontSize: '11px', margin: '2px 0 0' }}>
                                            {new Date(trip.start_time).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                    <span style={{
                                        padding: '3px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 700,
                                        background: trip.status === 'active' ? 'rgba(34,197,94,0.15)' : 'rgba(100,116,139,0.15)',
                                        color: trip.status === 'active' ? '#22c55e' : '#64748b',
                                        textTransform: 'uppercase', whiteSpace: 'nowrap', marginLeft: '8px'
                                    }}>
                                        {trip.status === 'active' ? 'Live' : 'Done'}
                                    </span>
                                </div>

                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                    <span style={{ background: 'rgba(255,255,255,0.05)', padding: '3px 10px', borderRadius: '6px', fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Clock size={11} /> {getDuration(trip.start_time, trip.end_time)}
                                    </span>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); viewTripOnMap(trip); }}
                                        style={{ background: 'rgba(59,130,246,0.1)', border: 'none', padding: '3px 10px', borderRadius: '6px', fontSize: '11px', color: '#3b82f6', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                    >
                                        <Eye size={11} /> View
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); shareTrip(trip.id); }}
                                        style={{ background: 'rgba(99,102,241,0.1)', border: 'none', padding: '3px 10px', borderRadius: '6px', fontSize: '11px', color: '#818cf8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                    >
                                        <Share2 size={11} /> Share
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); deleteTrip(trip.id); }}
                                        style={{ background: 'rgba(239,68,68,0.08)', border: 'none', padding: '3px 10px', borderRadius: '6px', fontSize: '11px', color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                    >
                                        <Trash2 size={11} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Right: Map */}
                    <div style={{ flex: 1, position: 'relative', padding: '20px' }}>
                        {viewTrip ? (
                            <TripMap locations={viewLocations} isLive={isLive} />
                        ) : isTracking ? (
                            <TripMap locations={liveLocations} isLive={true} />
                        ) : (
                            <div style={{
                                height: '100%', display: 'flex', flexDirection: 'column',
                                alignItems: 'center', justifyContent: 'center', color: '#334155',
                                gap: '16px', userSelect: 'none'
                            }}>
                                <div style={{ width: '80px', height: '80px', background: 'rgba(59,130,246,0.08)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <MapPin size={36} color="#1e40af" />
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <p style={{ color: '#475569', fontWeight: 700, fontSize: '18px', margin: '0 0 6px' }}>No Trip Selected</p>
                                    <p style={{ color: '#334155', fontSize: '14px', margin: 0 }}>Start a new trip or click a trip from the list to view its route.</p>
                                </div>
                            </div>
                        )}

                        {/* Map overlays */}
                        {viewTrip && (
                            <div style={{ position: 'absolute', top: '36px', right: '36px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div style={{ background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '12px 16px' }}>
                                    <p style={{ color: '#475569', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 4px' }}>Viewing Trip</p>
                                    <p style={{ color: '#fff', fontWeight: 700, fontSize: '14px', margin: 0 }}>{viewTrip.title}</p>
                                    <p style={{ color: '#64748b', fontSize: '11px', margin: '2px 0 0' }}>{viewLocations.length} route points</p>
                                    {isLive && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
                                            <span style={{ width: 7, height: 7, background: '#22c55e', borderRadius: '50%', animation: 'pulse 2s infinite' }} />
                                            <span style={{ color: '#22c55e', fontSize: '11px', fontWeight: 700 }}>Auto-refreshing every 5s</span>
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={() => { setViewTrip(null); setViewLocations([]); }}
                                    style={{ background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#94a3b8', padding: '8px 14px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
                                >
                                    <X size={14} /> Close
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── New Trip Modal */}
            {showNewTripModal && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
                }}>
                    <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '36px', width: '440px', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '28px' }}>
                            <h2 style={{ color: '#fff', fontWeight: 800, margin: 0, fontSize: '20px' }}>🚀 Start New Trip</h2>
                            <button onClick={() => setShowNewTripModal(false)} style={{ background: 'transparent', border: 'none', color: '#475569', cursor: 'pointer' }}>
                                <X size={22} />
                            </button>
                        </div>

                        <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Trip Name</label>
                        <input
                            autoFocus
                            value={newTripTitle}
                            onChange={e => setNewTripTitle(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && startTrip()}
                            placeholder="e.g. Road Trip to Manali"
                            style={{
                                display: 'block', width: '100%', marginTop: '8px', marginBottom: '24px',
                                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                color: '#fff', padding: '12px 16px', borderRadius: '12px', fontSize: '15px',
                                outline: 'none', boxSizing: 'border-box',
                            }}
                        />

                        <div style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '12px', padding: '12px 16px', marginBottom: '24px' }}>
                            <p style={{ color: '#93c5fd', fontSize: '13px', margin: 0 }}>
                                📍 Your GPS location will be tracked every ~5–10 seconds and stored securely. Share the trip link for real-time viewing.
                            </p>
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={() => setShowNewTripModal(false)}
                                style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', padding: '12px', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', fontSize: '14px' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={startTrip}
                                style={{ flex: 2, background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: '#fff', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 800, cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 20px rgba(59,130,246,0.3)' }}
                            >
                                <Navigation size={18} /> Start Tracking
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.4; }
                }
            `}</style>
        </div>
    );
};

export default TravelTracker;
