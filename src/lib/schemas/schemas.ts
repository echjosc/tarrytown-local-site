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
    if (opts.openingHours) base.openingHours = opts.openingHours
    if (opts.logo) base.logo = { '@type': 'ImageObject', url: opts.logo }
    if (opts.image) base.image = opts.image
    if (opts.priceRange) base.priceRange = opts.priceRange
    if (opts.sameAs) base.sameAs = opts.sameAs

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

export function faqPage(items: FAQItem[]) {
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