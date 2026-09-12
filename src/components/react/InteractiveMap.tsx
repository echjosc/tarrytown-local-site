import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import clsx from 'clsx';
import styles from './InteractiveMap.module.scss';

type LocationType = 'home' | 'produce' | 'meat' | 'farm';

const ICON_CONFIG: Record<LocationType, { color: string; path: string }> = {
    home: {
        color: '#2D3A5D',
        path: 'M12 2L2 12h3v9h5v-6h4v6h5v-9h3z',
    },
    produce: {
        color: '#2D6A4F',
        path: 'M12 22L12 13C9 10 5 9 4 6C7 5 11 8 12 13M12 13C15 10 19 9 20 6C17 5 13 8 12 13',
    },
    meat: {
        color: '#7B3A3A',
        path: 'M7 3C5 3 3 5 3 7c0 2 1 3 2 4l5 5 7-7-5-5C11 3 9 3 7 3z M15 12l1 1 3-3-1-1z',
    },
    farm: {
        color: '#7D5A2C',
        path: 'M20 9L12 2 4 9v12h5v-6h6v6h5z',
    },
};

const createTypedIcon = (type: LocationType, isActive: boolean) => {
    const { color, path } = ICON_CONFIG[type];
    return L.divIcon({
        html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 8.5 12 24 12 24S24 20.5 24 12C24 5.37 18.63 0 12 0z" fill="${isActive ? '#0FA4C7' : color}"/>
            <g transform="translate(4,4) scale(0.7)" fill="white">
                <path d="${path}"/>
            </g>
        </svg>`,
        className: '',
        iconSize: [24, 36],
        iconAnchor: [12, 36],
        popupAnchor: [0, -36],
    });
};

const DEFAULT_COORDINATES: { lat: number; lng: number; title: string; description: string; type: LocationType }[] = [
    {
        lat: 41.0785,
        lng: -73.8579,
        title: 'Tarrytown Local',
        description: 'Your one-stop shop for local produce and goods in Tarrytown, NY',
        type: 'home',
    },
    {
        lat: 41.5182,
        lng: -73.8231,
        title: 'Fishkill Farms',
        description: 'A family-owned farm in the Hudson Valley offering a wide variety of fruits, vegetables, and flowers.',
        type: 'produce',
    },
    {
        lat: 41.6653,
        lng: -74.5609,
        title: 'Majestic Farm',
        description: 'A sustainable farm in the Hudson Valley specializing in organic produce and pasture-raised meats.',
        type: 'farm',
    },
];

const FlyToMarker = ({ coordinates, activeMarker }: { coordinates: { lat: number; lng: number }[]; activeMarker: number | null }) => {
    const map = useMap();
    const coordsRef = useRef(coordinates);
    coordsRef.current = coordinates;

    useEffect(() => {
        if (activeMarker === null) {
            const coords = coordsRef.current;
            if (coords.length > 1) {
                map.flyToBounds(L.latLngBounds(coords.map(c => [c.lat, c.lng])), { padding: [40, 40], duration: 1 });
            }
            return;
        }
        const coord = coordsRef.current[activeMarker];
        if (coord) {
            map.flyTo([coord.lat, coord.lng], 9, { duration: 1 });
        }
    }, [activeMarker, map]);
    return null;
};

const TYPE_LABELS: Record<LocationType, string> = {
    home: 'Home Base',
    produce: 'Produce',
    meat: 'Meat',
    farm: 'Farm',
};

const TYPE_COLORS: Record<LocationType, string> = {
    home: '#2D3A5D',
    produce: '#2D6A4F',
    meat: '#7B3A3A',
    farm: '#7D5A2C',
};

export type InteractiveMapProps = {
    coordinates?: {
        lat: number;
        lng: number;
        title?: string;
        description?: string;
        offerings?: string[];
        type?: LocationType;
        url?: string;
        image?: string;
    }[];
}

const InteractiveMap = ({ coordinates = DEFAULT_COORDINATES }: InteractiveMapProps) => {
    const [activeMarker, setActiveMarker] = useState<number | null>(null);

    const averageLat = coordinates.reduce((sum, coord) => sum + coord.lat, 0) / coordinates.length;
    const averageLng = coordinates.reduce((sum, coord) => sum + coord.lng, 0) / coordinates.length;

    useEffect(() => {
        if (coordinates.length === 0) {
            setActiveMarker(null);
        } else if (activeMarker !== null && activeMarker >= coordinates.length) {
            setActiveMarker(0);
        }
    }, [coordinates, activeMarker]);

    return (
        <div className={clsx(styles.wrapper, 'container')}>
            <div className={styles.map}>
                <MapContainer center={[averageLat, averageLng]} zoom={5} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    />
                    <FlyToMarker coordinates={coordinates} activeMarker={activeMarker} />
                    {coordinates.map((coord, index) => (
                        <Marker
                            key={index}
                            position={[coord.lat, coord.lng]}
                            icon={createTypedIcon(coord.type ?? 'farm', activeMarker === index)}
                            eventHandlers={{ click: () => setActiveMarker(index) }}
                        />
                    ))}
                </MapContainer>
            </div>
            {activeMarker !== null && coordinates[activeMarker] ? (() => {
                const coord = coordinates[activeMarker];
                const type = coord.type ?? 'farm';
                return (
                    <div className={styles.detail} data-lenis-prevent style={{ '--item-color': TYPE_COLORS[type] } as CSSProperties}>
                        <button className={styles.detailBack} onClick={() => setActiveMarker(null)}>
                            <span aria-hidden="true">←</span> Back to all locations
                        </button>
                        {coord.image && (
                            <img className={styles.detailImage} src={coord.image} alt={coord.title} />
                        )}
                        <span className={styles.detailType}>{TYPE_LABELS[type]}</span>
                        <h2 className={styles.detailTitle}>{coord.title}</h2>
                        <p className={styles.detailDescription}>{coord.description}</p>
                        {coord.offerings && coord.offerings.length > 0 && (
                            <ul className={styles.detailTags}>
                                {coord.offerings.map((offering) => (
                                    <li key={offering} className={styles.detailTag}>{offering}</li>
                                ))}
                            </ul>
                        )}
                        {coord.url && (
                            <div className={styles.detailActions}>
                                <a
                                    className={styles.detailLink}
                                    href={coord.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Visit Website →
                                </a>
                            </div>
                        )}
                    </div>
                );
            })() : (
                <div className={styles.list} data-lenis-prevent>
                    {coordinates.map((coord, index) => {
                        const type = coord.type ?? 'farm';
                        return (
                            <div
                                key={index}
                                className={clsx(styles.listItem, { [styles['listItem--active']]: activeMarker === index })}
                                style={{ '--item-color': TYPE_COLORS[type] } as CSSProperties}
                                onClick={() => setActiveMarker(index)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        setActiveMarker(index);
                                    }
                                }}
                            >
                                <div className={styles.listItemBody}>
                                    <span className={styles.listItemType}>{TYPE_LABELS[type]}</span>
                                    <strong className={styles.listItemTitle}>{coord.title}</strong>
                                    <p className={styles.listItemDesc}>{coord.description}</p>
                                </div>
                                <span className={styles.listItemArrow} aria-hidden="true">→</span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default InteractiveMap;
