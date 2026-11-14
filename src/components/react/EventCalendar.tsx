import { useEffect, useMemo, useRef, useState, type CSSProperties, type TouchEvent } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import styles from './EventCalendar.module.scss';

export type EventCategory = 'event' | 'class' | 'live-music' | 'ordering';

export interface CalendarEvent {
    slug: string;
    title: string;
    /** YYYY-MM-DD */
    date: string;
    time?: string;
    category: EventCategory;
    location?: string;
    description?: string;
    link?: string;
    image?: string;
    repeatsWeekly?: boolean;
    /** YYYY-MM-DD, last day a weekly event happens */
    repeatUntil?: string;
    /** YYYY-MM-DD dates a weekly event does not happen */
    skipDates?: string[];
}

interface EventCalendarProps {
    events: CalendarEvent[];
}

const CATEGORIES: Record<EventCategory, { label: string; color: string }> = {
    event: { label: 'Event', color: '#7C2E28' },
    class: { label: 'Class', color: '#2D3A5D' },
    'live-music': { label: 'Live Music', color: '#2D6A4F' },
    ordering: { label: 'Ordering', color: '#7D5A2C' },
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const pad = (value: number) => String(value).padStart(2, '0');
const toIso = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const fromIso = (iso: string) => {
    const [year, month, day] = iso.split('-').map(Number);
    return new Date(year, month - 1, day);
};
const addDays = (date: Date, days: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
const startOfWeek = (date: Date) => addDays(date, -date.getDay());
const formatLongDate = (iso: string) => {
    const date = fromIso(iso);
    return `${WEEKDAYS[date.getDay()]}, ${MONTHS[date.getMonth()]} ${date.getDate()}`;
};
const REPEAT_MONTHS_AHEAD = 12;

// Turns each weekly event into one entry per occurrence. Without a repeatUntil date,
// occurrences stop REPEAT_MONTHS_AHEAD months after today.
const expandWeeklyEvents = (events: CalendarEvent[], todayIso: string): CalendarEvent[] => {
    const today = fromIso(todayIso);
    const horizonIso = toIso(new Date(today.getFullYear(), today.getMonth() + REPEAT_MONTHS_AHEAD, today.getDate()));
    return events.flatMap((event) => {
        if (!event.repeatsWeekly) return [event];
        const lastIso = event.repeatUntil && event.repeatUntil < horizonIso ? event.repeatUntil : horizonIso;
        const occurrences: CalendarEvent[] = [];
        for (let date = fromIso(event.date); toIso(date) <= lastIso; date = addDays(date, 7)) {
            if (event.skipDates?.includes(toIso(date))) continue;
            occurrences.push({ ...event, date: toIso(date) });
        }
        return occurrences;
    });
};
const categoryStyle = (category: EventCategory) => ({ '--cat': CATEGORIES[category].color }) as CSSProperties;
// How far (and how mostly-horizontal) a finger must move on the week bar to count as a swipe.
const SWIPE_MIN_DISTANCE_PX = 50;
const SWIPE_HORIZONTAL_RATIO = 1.5;
// Each event once, on its first date on or after fromIso, so a weekly event doesn't fill the whole list.
const firstOccurrencesFrom = (events: CalendarEvent[], fromIso: string): CalendarEvent[] => {
    const seenSlugs = new Set<string>();
    return events.filter((event) => {
        if (event.date < fromIso || seenSlugs.has(event.slug)) return false;
        seenSlugs.add(event.slug);
        return true;
    });
};
const eventKey = (event: CalendarEvent) => `${event.slug}-${event.date}`;

function useIsPhone() {
    const query = '(max-width: 768px)';
    const [isPhone, setIsPhone] = useState(() => window.matchMedia(query).matches);
    useEffect(() => {
        const mediaQuery = window.matchMedia(query);
        const update = () => setIsPhone(mediaQuery.matches);
        mediaQuery.addEventListener('change', update);
        return () => mediaQuery.removeEventListener('change', update);
    }, []);
    return isPhone;
}

// A shared link always has a date; it has an event slug when it points at one specific event.
const readSharedLink = (): { date: string; slug?: string } | null => {
    const params = new URLSearchParams(window.location.search);
    const date = params.get('date');
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date) || toIso(fromIso(date)) !== date) return null;
    return { date, slug: params.get('event') ?? undefined };
};

// Keeps the address bar in sync with the selected day so the page URL can be shared as is.
const updateUrlParams = (changes: Record<string, string | null>) => {
    const url = new URL(window.location.href);
    let changed = false;
    Object.entries(changes).forEach(([key, value]) => {
        if (value === null && url.searchParams.has(key)) {
            url.searchParams.delete(key);
            changed = true;
        } else if (value !== null && url.searchParams.get(key) !== value) {
            url.searchParams.set(key, value);
            changed = true;
        }
    });
    if (changed) window.history.replaceState(null, '', url);
};

function CategoryTag({ category }: { category: EventCategory }) {
    return (
        <span className={styles.tag} style={categoryStyle(category)}>
            {CATEGORIES[category].label}
        </span>
    );
}

function ShareButton({ event }: { event: CalendarEvent }) {
    const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle');

    useEffect(() => {
        if (status === 'idle') return;
        const timeout = window.setTimeout(() => setStatus('idle'), 2500);
        return () => window.clearTimeout(timeout);
    }, [status]);

    const share = async () => {
        const url = new URL(window.location.pathname, window.location.origin);
        url.searchParams.set('event', event.slug);
        url.searchParams.set('date', event.date);

        if (navigator.share) {
            try {
                await navigator.share({ title: event.title, url: url.href });
                return;
            } catch (error) {
                // Closing the share sheet is not a failure; anything else falls back to copying.
                if ((error as DOMException).name === 'AbortError') return;
            }
        }
        try {
            await navigator.clipboard.writeText(url.href);
            setStatus('copied');
        } catch {
            setStatus('failed');
        }
    };

    return (
        <button type="button" className={styles.shareButton} onClick={share} aria-live="polite">
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" />
                <path d="M16 6l-4-4-4 4" />
                <path d="M12 2v13" />
            </svg>
            {status === 'copied' ? 'Link copied' : status === 'failed' ? "Couldn't copy" : 'Share'}
        </button>
    );
}

function EventDetails({ event }: { event: CalendarEvent }) {
    return (
        <article className={styles.details} style={categoryStyle(event.category)}>
            <CategoryTag category={event.category} />
            <h3 className={styles.detailsTitle}>{event.title}</h3>
            <p className={styles.detailsWhen}>
                {formatLongDate(event.date)}
                {event.time && ` · ${event.time}`}
                {event.location && ` · ${event.location}`}
                {event.repeatsWeekly && ' · Weekly'}
            </p>
            {event.description && <p className={styles.detailsText}>{event.description}</p>}
            {event.image && <img className={styles.detailsImage} src={event.image} alt={`Poster for ${event.title}`} />}
            <div className={styles.actions}>
                {event.link && (
                    <a className={styles.button} href={event.link} target="_blank" rel="noopener noreferrer">
                        Reserve
                    </a>
                )}
                <ShareButton event={event} />
            </div>
        </article>
    );
}

interface ViewProps {
    eventsByDate: Map<string, CalendarEvent[]>;
    upcoming: CalendarEvent[];
    /** Every occurrence of every event, sorted by date */
    allEvents: CalendarEvent[];
    todayIso: string;
    selectedIso: string;
    onSelectDate: (iso: string) => void;
    /** The event a shared link points to, if it exists */
    sharedEvent?: CalendarEvent;
}

function DesktopView({ eventsByDate, upcoming, todayIso, selectedIso, onSelectDate, sharedEvent }: ViewProps) {
    const selectedPanelRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (sharedEvent) selectedPanelRef.current?.scrollIntoView({ block: 'center' });
    }, [sharedEvent]);

    const [monthStart, setMonthStart] = useState(() => {
        const selected = fromIso(selectedIso);
        return new Date(selected.getFullYear(), selected.getMonth(), 1);
    });

    const gridStart = startOfWeek(monthStart);
    const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
    const cellCount = Math.ceil((monthStart.getDay() + daysInMonth) / 7) * 7;
    const cells = Array.from({ length: cellCount }, (_, index) => addDays(gridStart, index));

    const shiftMonth = (delta: number) => setMonthStart(new Date(monthStart.getFullYear(), monthStart.getMonth() + delta, 1));
    const goToToday = () => {
        const today = fromIso(todayIso);
        setMonthStart(new Date(today.getFullYear(), today.getMonth(), 1));
        onSelectDate(todayIso);
    };
    const jumpToDate = (iso: string) => {
        const date = fromIso(iso);
        setMonthStart(new Date(date.getFullYear(), date.getMonth(), 1));
        onSelectDate(iso);
    };

    const selectedEvents = eventsByDate.get(selectedIso) ?? [];

    return (
        <div className={styles.desktop}>
            <div className={styles.main}>
                <div className={styles.monthHeader}>
                    <h2 className={styles.monthTitle}>
                        {MONTHS[monthStart.getMonth()]} {monthStart.getFullYear()}
                    </h2>
                    <div className={styles.nav}>
                        <button type="button" className={styles.todayButton} onClick={goToToday}>Today</button>
                        <button type="button" className={styles.navButton} onClick={() => shiftMonth(-1)} aria-label="Previous month">‹</button>
                        <button type="button" className={styles.navButton} onClick={() => shiftMonth(1)} aria-label="Next month">›</button>
                    </div>
                </div>

                <div className={styles.grid}>
                    {WEEKDAYS.map((weekday) => (
                        <div key={weekday} className={styles.weekday}>{weekday}</div>
                    ))}
                    {cells.map((date) => {
                        const iso = toIso(date);
                        const dayEvents = eventsByDate.get(iso) ?? [];
                        return (
                            <button
                                key={iso}
                                type="button"
                                className={clsx(
                                    styles.day,
                                    date.getMonth() !== monthStart.getMonth() && styles.dayOutside,
                                    iso === todayIso && styles.dayToday,
                                )}
                                aria-pressed={iso === selectedIso}
                                aria-label={`${formatLongDate(iso)}, ${dayEvents.length} ${dayEvents.length === 1 ? 'event' : 'events'}`}
                                onClick={() => onSelectDate(iso)}
                            >
                                <span className={styles.dayNumber}>{date.getDate()}</span>
                                {dayEvents.slice(0, 2).map((event) => (
                                    <span key={eventKey(event)} className={styles.pill} style={categoryStyle(event.category)}>
                                        {event.title}
                                    </span>
                                ))}
                                {dayEvents.length > 2 && <span className={styles.more}>+{dayEvents.length - 2} more</span>}
                            </button>
                        );
                    })}
                </div>

                <div ref={selectedPanelRef} className={styles.selected} aria-live="polite">
                    <h3 className={styles.selectedTitle}>{formatLongDate(selectedIso)}</h3>
                    {selectedEvents.length > 0 ? (
                        selectedEvents.map((event) => <EventDetails key={eventKey(event)} event={event} />)
                    ) : (
                        <p className={styles.empty}>Nothing scheduled this day.</p>
                    )}
                </div>
            </div>

            <aside className={styles.rail}>
                <h2 className={styles.railTitle}>Coming Up</h2>
                {upcoming.length === 0 && <p className={styles.empty}>No upcoming events yet. Check back soon.</p>}
                {upcoming.slice(0, 6).map((event) => {
                    const date = fromIso(event.date);
                    return (
                        <button key={eventKey(event)} type="button" className={styles.railItem} style={categoryStyle(event.category)} onClick={() => jumpToDate(event.date)}>
                            <span className={styles.railDate}>
                                <b>{date.getDate()}</b>
                                {MONTHS[date.getMonth()].slice(0, 3)}
                            </span>
                            <span>
                                <CategoryTag category={event.category} />
                                <span className={styles.railName}>{event.title}</span>
                                <span className={styles.railWhen}>
                                    {event.repeatsWeekly && 'Every '}
                                    {WEEKDAYS[date.getDay()]}
                                    {event.time && ` · ${event.time}`}
                                </span>
                            </span>
                        </button>
                    );
                })}
            </aside>
        </div>
    );
}

// Rendered into document.body so it stays centered on the screen. The page wraps this
// component in an animated element, and a transformed ancestor would otherwise trap a fixed popup.
function EventModal({ event, onClose }: { event: CalendarEvent; onClose: () => void }) {
    const closeButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        closeButtonRef.current?.focus();
        const closeOnEscape = (keyboardEvent: KeyboardEvent) => {
            if (keyboardEvent.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', closeOnEscape);
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', closeOnEscape);
            document.body.style.overflow = previousOverflow;
        };
    }, [onClose]);

    return createPortal(
        <div className={styles.modalLayer}>
            <button type="button" className={styles.modalBackdrop} onClick={onClose} aria-label="Close details" tabIndex={-1} />
            <div className={styles.modal} role="dialog" aria-modal="true" aria-label={event.title} style={categoryStyle(event.category)}>
                <button ref={closeButtonRef} type="button" className={styles.modalClose} onClick={onClose} aria-label="Close">✕</button>
                <EventDetails event={event} />
            </div>
        </div>,
        document.body,
    );
}

function PhoneView({ eventsByDate, allEvents, todayIso, selectedIso, onSelectDate, sharedEvent }: ViewProps) {
    const [weekStart, setWeekStart] = useState(() => startOfWeek(fromIso(selectedIso)));
    const [monthStart, setMonthStart] = useState<Date | null>(null);
    const [slide, setSlide] = useState<'next' | 'prev' | null>(null);
    const swipeStart = useRef<{ x: number; y: number } | null>(null);
    const [openEvent, setOpenEvent] = useState<CalendarEvent | null>(sharedEvent ?? null);

    useEffect(() => {
        if (openEvent) updateUrlParams({ event: openEvent.slug, date: openEvent.date });
        else if (new URLSearchParams(window.location.search).has('event')) updateUrlParams({ event: null, date: selectedIso });
        // Only the popup opening or closing should touch the URL here; day taps update it through onSelectDate.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [openEvent]);

    const showWeek = (iso: string) => {
        setSlide(null);
        setWeekStart(startOfWeek(fromIso(iso)));
        setMonthStart(null);
        onSelectDate(iso);
    };
    // In month view the grid stays open so several days can be checked in a row.
    const showDayInMonth = (iso: string) => {
        setSlide(null);
        const date = fromIso(iso);
        setMonthStart(new Date(date.getFullYear(), date.getMonth(), 1));
        setWeekStart(startOfWeek(date));
        onSelectDate(iso);
    };
    const goToToday = () => (monthStart ? showDayInMonth(todayIso) : showWeek(todayIso));
    const toggleMonth = () => {
        if (monthStart) {
            setWeekStart(startOfWeek(fromIso(selectedIso)));
            setMonthStart(null);
        } else {
            const selected = fromIso(selectedIso);
            setMonthStart(new Date(selected.getFullYear(), selected.getMonth(), 1));
        }
    };
    const shiftMonth = (delta: number) => {
        if (!monthStart) return;
        const nextMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + delta, 1);
        setSlide(delta > 0 ? 'next' : 'prev');
        setMonthStart(nextMonth);
        onSelectDate(toIso(nextMonth));
    };
    const shiftWeek = (delta: number) => {
        const nextStart = addDays(weekStart, delta * 7);
        const todayIsInWeek = toIso(startOfWeek(fromIso(todayIso))) === toIso(nextStart);
        showWeek(todayIsInWeek ? todayIso : toIso(nextStart));
        setSlide(delta > 0 ? 'next' : 'prev');
    };

    const handleTouchStart = (touchEvent: TouchEvent<HTMLDivElement>) => {
        const touch = touchEvent.touches[0];
        swipeStart.current = { x: touch.clientX, y: touch.clientY };
    };
    const handleTouchEnd = (touchEvent: TouchEvent<HTMLDivElement>) => {
        const start = swipeStart.current;
        swipeStart.current = null;
        if (!start) return;
        const touch = touchEvent.changedTouches[0];
        const deltaX = touch.clientX - start.x;
        const deltaY = touch.clientY - start.y;
        if (Math.abs(deltaX) < SWIPE_MIN_DISTANCE_PX || Math.abs(deltaX) < Math.abs(deltaY) * SWIPE_HORIZONTAL_RATIO) return;
        const delta = deltaX < 0 ? 1 : -1;
        if (monthStart) shiftMonth(delta);
        else shiftWeek(delta);
    };

    const weekDays = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
    const lastDay = weekDays[6];
    const monthCells = monthStart
        ? Array.from({ length: Math.ceil((monthStart.getDay() + new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate()) / 7) * 7 }, (_, index) => addDays(startOfWeek(monthStart), index))
        : [];

    const selectedEvents = eventsByDate.get(selectedIso) ?? [];
    const laterEvents = firstOccurrencesFrom(allEvents, toIso(addDays(fromIso(selectedIso), 1))).slice(0, 3);

    const renderDayButton = (date: Date, className: string) => {
        const iso = toIso(date);
        const hasEvents = eventsByDate.has(iso);
        return (
            <button
                key={iso}
                type="button"
                className={clsx(className, monthStart && date.getMonth() !== monthStart.getMonth() && styles.stripDayOutside)}
                aria-pressed={iso === selectedIso}
                aria-label={`${formatLongDate(iso)}${hasEvents ? ', has events' : ''}`}
                onClick={() => (monthStart ? showDayInMonth(iso) : showWeek(iso))}
            >
                {!monthStart && WEEKDAYS[date.getDay()].slice(0, 1)}
                <b>{date.getDate()}</b>
                <span className={clsx(styles.stripDot, hasEvents && styles.stripDotOn)} />
            </button>
        );
    };

    const renderTile = (event: CalendarEvent, showDate: boolean) => (
        <button key={eventKey(event)} type="button" className={styles.tile} style={categoryStyle(event.category)} onClick={() => setOpenEvent(event)}>
            <CategoryTag category={event.category} />
            <span className={styles.tileTitle}>{event.title}</span>
            <span className={styles.tileWhen}>
                {showDate && formatLongDate(event.date)}
                {showDate && (event.time || event.location) && ' · '}
                {event.time}
                {event.time && event.location && ' · '}
                {event.location}
            </span>
        </button>
    );

    return (
        <div className={styles.phone}>
            <div className={styles.phoneTop} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
                <div className={styles.weekNav}>
                    <button type="button" className={styles.weekNavButton} onClick={() => (monthStart ? shiftMonth(-1) : shiftWeek(-1))} aria-label={monthStart ? 'Previous month' : 'Previous week'}>‹</button>
                    <span className={styles.weekRange}>
                        {monthStart
                            ? `${MONTHS[monthStart.getMonth()].slice(0, 3)} ${monthStart.getFullYear()}`
                            : `${MONTHS[weekStart.getMonth()].slice(0, 3)} ${weekStart.getDate()} – ${MONTHS[lastDay.getMonth()].slice(0, 3)} ${lastDay.getDate()}`}
                    </span>
                    <div className={styles.nav}>
                        <button type="button" className={styles.todayButton} onClick={goToToday}>Today</button>
                        <button type="button" className={styles.todayButton} onClick={toggleMonth} aria-expanded={Boolean(monthStart)}>
                            {monthStart ? 'Week' : 'Month'}
                        </button>
                        <button type="button" className={styles.weekNavButton} onClick={() => (monthStart ? shiftMonth(1) : shiftWeek(1))} aria-label={monthStart ? 'Next month' : 'Next week'}>›</button>
                    </div>
                </div>
                {monthStart ? (
                    <div key={toIso(monthStart)} className={clsx(styles.monthStrip, slide === 'next' && styles.slideNext, slide === 'prev' && styles.slidePrev)}>
                        {WEEKDAYS.map((weekday) => (
                            <span key={weekday} className={styles.monthWeekday}>{weekday.slice(0, 1)}</span>
                        ))}
                        {monthCells.map((date) => renderDayButton(date, styles.stripDay))}
                    </div>
                ) : (
                    <div key={toIso(weekStart)} className={clsx(styles.strip, slide === 'next' && styles.slideNext, slide === 'prev' && styles.slidePrev)}>{weekDays.map((date) => renderDayButton(date, styles.stripDay))}</div>
                )}
            </div>

            <div className={styles.phoneBody} aria-live="polite">
                <h2 className={styles.phoneHeading}>{formatLongDate(selectedIso)}</h2>
                {selectedEvents.length > 0 ? selectedEvents.map((event) => renderTile(event, false)) : <p className={styles.empty}>Nothing scheduled this day.</p>}

                {laterEvents.length > 0 && (
                    <>
                        <h2 className={styles.phoneHeading}>Coming Up</h2>
                        {laterEvents.map((event) => renderTile(event, true))}
                    </>
                )}
            </div>

            {openEvent && <EventModal event={openEvent} onClose={() => setOpenEvent(null)} />}
        </div>
    );
}

export default function EventCalendar({ events }: EventCalendarProps) {
    const isPhone = useIsPhone();
    const todayIso = useMemo(() => toIso(new Date()), []);
    const sharedLink = useMemo(readSharedLink, []);
    const [selectedIso, setSelectedIso] = useState(sharedLink?.date ?? todayIso);
    const selectDate = (iso: string) => {
        setSelectedIso(iso);
        updateUrlParams({ date: iso, event: null });
    };

    const expandedEvents = useMemo(
        () => expandWeeklyEvents(events, todayIso).sort((a, b) => a.date.localeCompare(b.date)),
        [events, todayIso],
    );
    const eventsByDate = useMemo(() => {
        const grouped = new Map<string, CalendarEvent[]>();
        expandedEvents.forEach((event) => grouped.set(event.date, [...(grouped.get(event.date) ?? []), event]));
        return grouped;
    }, [expandedEvents]);
    const upcoming = useMemo(() => firstOccurrencesFrom(expandedEvents, todayIso), [expandedEvents, todayIso]);

    const sharedEvent = useMemo(
        () => (sharedLink?.slug ? expandedEvents.find((event) => event.slug === sharedLink.slug && event.date === sharedLink.date) : undefined),
        [sharedLink, expandedEvents],
    );

    const viewProps: ViewProps = { eventsByDate, upcoming, allEvents: expandedEvents, todayIso, selectedIso, onSelectDate: selectDate, sharedEvent };

    return (
        <div className={styles.wrapper}>
            {sharedLink?.slug && !sharedEvent && (
                <p className={styles.notice}>That event is no longer on the calendar. Here's what's on that day.</p>
            )}
            {isPhone ? <PhoneView {...viewProps} /> : <DesktopView {...viewProps} />}
        </div>
    );
}
