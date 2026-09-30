/**
 * schemas.ts
 * Typed helper functions for building Schema.org JSON-LD objects.
 * Each function returns a plain object — pass it to <Schema item={...} />
 *
 * Supported types:
 *   - localBusiness()     → LocalBusiness (restaurants, shops, nonprofits, etc.)
 *   - organization()      → Organization (nonprofits, companies)
 *   - article()           → Article / BlogPosting
 *   - faqPage()           → FAQPage (renders FAQ dropdowns in Google)
 *   - breadcrumb()        → BreadcrumbList (shows path in search results)
 *   - product()           → Product (ecommerce items)
 *   - event()             → Event (games, fundraisers, etc.)
 *   - person()            → Person (team members, coaches, etc.)
 *   - menu()              → Menu (restaurant/bakery menus, for AI agents & search)
 */

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export interface Address {
    street: string
    city: string
    state: string
    zip: string
    country?: string // defaults to 'US'
}

export interface GeoCoords {
    lat: number
    lng: number
}

// ---------------------------------------------------------------------------
// LocalBusiness
// Use for: restaurants, retail, nonprofits with a physical location
// ---------------------------------------------------------------------------

export interface LocalBusinessOptions {
    name: string
    description?: string
    url: string
    telephone?: string
    email?: string
    address: Address
    geo?: GeoCoords
    /** e.g. ['Mo-Fr 09:00-17:00', 'Sa 10:00-14:00'] */
    openingHours?: string[]
    /** Absolute URL to logo image */
    logo?: string
    /** Absolute URL to a photo of the location */
    image?: string
    /** Schema.org business type — defaults to 'LocalBusiness'
     *  Common values: 'Restaurant', 'SportsClub', 'NonprofitOrganization',
     *  'Store', 'HealthAndBeautyBusiness', 'AutoDealer'
     *  Full list: https://schema.org/LocalBusiness
     */
    type?: string
    /** Average rating e.g. 4.5 */
    ratingValue?: number
    /** Total number of reviews */
    reviewCount?: number
    priceRange?: string // e.g. '$$'
    /** Social profile URLs */
    sameAs?: string[]
    /** Absolute URL to a menu page — schema.org allows a plain URL here */
    hasMenu?: string
}

const DAY_ABBREVIATIONS: Record<string, string> = {
    sunday: 'Su',
    monday: 'Mo',
    tuesday: 'Tu',
    wednesday: 'We',
    thursday: 'Th',
    friday: 'Fr',
    saturday: 'Sa',
}

function parseDayRange(days: string): string | undefined {
    const parts = days.split(/[-–—]/).map((d) => DAY_ABBREVIATIONS[d.trim().toLowerCase()])
    if (parts.some((d) => !d)) return undefined
    return parts.join('-')
}

function parseTimeRange(hours: string): string | undefined {
    const toIsoTime = (time: string): string | undefined => {
        const match = time.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/i)
        if (!match) return undefined
        let [, hour, minute = '00', meridiem] = match
        let h = parseInt(hour, 10)
        if (meridiem.toLowerCase() === 'pm' && h !== 12) h += 12
        if (meridiem.toLowerCase() === 'am' && h === 12) h = 0
        return `${String(h).padStart(2, '0')}:${minute}`
    }

    const parts = hours.split(/[-–—]/).map(toIsoTime)
    if (parts.some((t) => !t)) return undefined
    return parts.join('-')
}

/**
 * Converts human-readable hours (e.g. "Wednesday - Sunday" / "8am - 8pm")
 * into the schema.org openingHours format (e.g. "We-Su 08:00-20:00").
 * Rows that don't parse cleanly are skipped rather than emitting bad data.
 */
export function parseOpeningHours(hours: readonly { days: string; hours: string }[]): string[] {
    return hours
        .map((row) => {
            const days = parseDayRange(row.days)
            const time = parseTimeRange(row.hours)
            return days && time ? `${days} ${time}` : undefined
        })
        .filter((row): row is string => Boolean(row))
}

export function localBusiness(opts: LocalBusinessOptions) {
    const base: Record<string, unknown> = {
        '@type': opts.type ?? 'LocalBusiness',
        name: opts.name,
        url: opts.url,
        address: {
            '@type': 'PostalAddress',
            streetAddress: opts.address.street,
            addressLocality: opts.address.city,
            addressRegion: opts.address.state,
            postalCode: opts.address.zip,
            addressCountry: opts.address.country ?? 'US',
        },
    }

    if (opts.description) base.description = opts.description
    if (opts.telephone) base.telephone = opts.telephone
    if (opts.email) base.email = opts.email
    if (opts.openingHours?.length) base.openingHours = opts.openingHours
    if (opts.logo) base.logo = { '@type': 'ImageObject', url: opts.logo }
    if (opts.image) base.image = opts.image
    if (opts.priceRange) base.priceRange = opts.priceRange
    if (opts.sameAs) base.sameAs = opts.sameAs
    if (opts.hasMenu) base.hasMenu = opts.hasMenu

    if (opts.geo) {
        base.geo = {
            '@type': 'GeoCoordinates',
            latitude: opts.geo.lat,
            longitude: opts.geo.lng,
        }
    }

    if (opts.ratingValue && opts.reviewCount) {
        base.aggregateRating = {
            '@type': 'AggregateRating',
            ratingValue: opts.ratingValue,
            reviewCount: opts.reviewCount,
        }
    }

    return base
}

// ---------------------------------------------------------------------------
// Organization
// Use for: nonprofits, companies without a storefront
// ---------------------------------------------------------------------------

export interface OrganizationOptions {
    name: string
    url: string
    logo?: string
    description?: string
    email?: string
    telephone?: string
    sameAs?: string[]
    /** 'Organization' | 'NonprofitOrganization' | 'SportsOrganization' etc. */
    type?: string
}

export function organization(opts: OrganizationOptions) {
    const base: Record<string, unknown> = {
        '@type': opts.type ?? 'Organization',
        name: opts.name,
        url: opts.url,
    }

    if (opts.logo) base.logo = { '@type': 'ImageObject', url: opts.logo }
    if (opts.description) base.description = opts.description
    if (opts.email) base.email = opts.email
    if (opts.telephone) base.telephone = opts.telephone
    if (opts.sameAs) base.sameAs = opts.sameAs

    return base
}

// ---------------------------------------------------------------------------
// Article / BlogPosting
// Use for: blog posts, news articles, announcements
// ---------------------------------------------------------------------------

export interface ArticleOptions {
    headline: string
    description: string
    url: string
    /** Absolute URL to article image */
    image: string
    /** ISO date string e.g. '2025-03-15' */
    datePublished: string
    dateModified?: string
    authorName: string
    authorUrl?: string
    publisherName: string
    publisherLogo: string
    /** 'Article' | 'BlogPosting' | 'NewsArticle' */
    type?: string
}

export function article(opts: ArticleOptions) {
    return {
        '@type': opts.type ?? 'BlogPosting',
        headline: opts.headline,
        description: opts.description,
        url: opts.url,
        image: opts.image,
        datePublished: opts.datePublished,
        dateModified: opts.dateModified ?? opts.datePublished,
        author: {
            '@type': 'Person',
            name: opts.authorName,
            ...(opts.authorUrl && { url: opts.authorUrl }),
        },
        publisher: {
            '@type': 'Organization',
            name: opts.publisherName,
            logo: {
                '@type': 'ImageObject',
                url: opts.publisherLogo,
            },
        },
    }
}

// ---------------------------------------------------------------------------
// FAQPage
// Use for: any page with Q&A — renders as expandable FAQs in Google results
// ---------------------------------------------------------------------------

export interface FAQItem {
    question: string
    answer: string
}

export function faqPage(items: readonly FAQItem[]) {
    return {
        '@type': 'FAQPage',
        mainEntity: items.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: {
                '@type': 'Answer',
                text: item.answer,
            },
        })),
    }
}

// ---------------------------------------------------------------------------
// BreadcrumbList
// Use for: any page deeper than the homepage
// Renders the path in Google search results e.g. Home > Blog > Post Title
// ---------------------------------------------------------------------------

export interface BreadcrumbItem {
    name: string
    /** Absolute URL */
    url: string
}

export function breadcrumb(items: BreadcrumbItem[]) {
    return {
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: item.url,
        })),
    }
}

// ---------------------------------------------------------------------------
// Product
// Use for: ecommerce items, grocery products
// ---------------------------------------------------------------------------

export interface ProductOptions {
    name: string
    description?: string
    image: string
    /** e.g. 'USD' */
    currency: string
    price: number
    /** 'InStock' | 'OutOfStock' | 'PreOrder' */
    availability?: string
    sku?: string
    brand?: string
    ratingValue?: number
    reviewCount?: number
}

export function product(opts: ProductOptions) {
    const base: Record<string, unknown> = {
        '@type': 'Product',
        name: opts.name,
        image: opts.image,
        offers: {
            '@type': 'Offer',
            price: opts.price,
            priceCurrency: opts.currency,
            availability: `https://schema.org/${opts.availability ?? 'InStock'}`,
        },
    }

    if (opts.description) base.description = opts.description
    if (opts.sku) base.sku = opts.sku
    if (opts.brand) base.brand = { '@type': 'Brand', name: opts.brand }

    if (opts.ratingValue && opts.reviewCount) {
        base.aggregateRating = {
            '@type': 'AggregateRating',
            ratingValue: opts.ratingValue,
            reviewCount: opts.reviewCount,
        }
    }

    return base
}

// ---------------------------------------------------------------------------
// Event
// Use for: matches, games, fundraisers, tournaments
// ---------------------------------------------------------------------------

export interface EventOptions {
    name: string
    description?: string
    /** ISO datetime string e.g. '2025-06-14T10:00:00' */
    startDate: string
    endDate?: string
    locationName: string
    address: Address
    /** Absolute URL to event image */
    image?: string
    url?: string
    /** 'EventScheduled' | 'EventCancelled' | 'EventPostponed' */
    status?: string
    /** 'OfflineEventAttendanceMode' | 'OnlineEventAttendanceMode' | 'MixedEventAttendanceMode' */
    attendanceMode?: string
    organizerName?: string
    organizerUrl?: string
}

export function event(opts: EventOptions) {
    const base: Record<string, unknown> = {
        '@type': 'Event',
        name: opts.name,
        startDate: opts.startDate,
        eventStatus: `https://schema.org/${opts.status ?? 'EventScheduled'}`,
        eventAttendanceMode: `https://schema.org/${opts.attendanceMode ?? 'OfflineEventAttendanceMode'}`,
        location: {
            '@type': 'Place',
            name: opts.locationName,
            address: {
                '@type': 'PostalAddress',
                streetAddress: opts.address.street,
                addressLocality: opts.address.city,
                addressRegion: opts.address.state,
                postalCode: opts.address.zip,
                addressCountry: opts.address.country ?? 'US',
            },
        },
    }

    if (opts.description) base.description = opts.description
    if (opts.endDate) base.endDate = opts.endDate
    if (opts.image) base.image = opts.image
    if (opts.url) base.url = opts.url

    if (opts.organizerName) {
        base.organizer = {
            '@type': 'Organization',
            name: opts.organizerName,
            ...(opts.organizerUrl && { url: opts.organizerUrl }),
        }
    }

    return base
}

// ---------------------------------------------------------------------------
// Person
// Use for: team members, coaches, staff
// ---------------------------------------------------------------------------

export interface PersonOptions {
    name: string
    url?: string
    image?: string
    jobTitle?: string
    email?: string
    /** e.g. ['https://twitter.com/handle'] */
    sameAs?: string[]
}

export function person(opts: PersonOptions) {
    const base: Record<string, unknown> = {
        '@type': 'Person',
        name: opts.name,
    }

    if (opts.url) base.url = opts.url
    if (opts.image) base.image = opts.image
    if (opts.jobTitle) base.jobTitle = opts.jobTitle
    if (opts.email) base.email = opts.email
    if (opts.sameAs) base.sameAs = opts.sameAs

    return base
}

// ---------------------------------------------------------------------------
// Menu
// Use for: restaurant/bakery menus — lets AI agents answer "what's on the
// menu" and "how much is X" without crawling the rendered page
// ---------------------------------------------------------------------------

export interface MenuItemOptions {
    name: string
    description?: string
    /** e.g. '12' or '12.50' — left as a display string since menus often use '$12' or 'MP' */
    price?: string
}

export interface MenuSectionOptions {
    name: string
    description?: string
    items: MenuItemOptions[]
}

export interface MenuOptions {
    name: string
    description?: string
    sections: MenuSectionOptions[]
}

export function menu(opts: MenuOptions) {
    const base: Record<string, unknown> = {
        '@type': 'Menu',
        name: opts.name,
        hasMenuSection: opts.sections.map((section) => ({
            '@type': 'MenuSection',
            name: section.name,
            ...(section.description && { description: section.description }),
            hasMenuItem: section.items.map((item) => {
                const menuItem: Record<string, unknown> = {
                    '@type': 'MenuItem',
                    name: item.name,
                }
                if (item.description) menuItem.description = item.description
                if (item.price) {
                    menuItem.offers = {
                        '@type': 'Offer',
                        price: item.price.replace(/^\$/, ''),
                        priceCurrency: 'USD',
                    }
                }
                return menuItem
            }),
        })),
    }

    if (opts.description) base.description = opts.description

    return base
}