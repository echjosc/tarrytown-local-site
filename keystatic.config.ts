// keystatic.config.ts
import { config, fields, collection, singleton } from '@keystatic/core';


import {
    inline,
    wrapper,
} from '@keystatic/core/content-components';

// {% footnote-ref id="1" /%}
export const FootnoteRef = inline({
    label: 'Footnote reference',
    schema: {
        id: fields.text({ label: 'Footnote ID' }),
    },
});

// {% footnote id="1" %}...{% /footnote %}
export const Footnote = wrapper({
    label: 'Footnote',
    schema: {
        id: fields.text({ label: 'Footnote ID' }),
    },
});

// {% footnotes %}{% footnote ... %}...{% /footnote %}{% /footnotes %}
export const Footnotes = wrapper({
    label: 'Footnotes block',
    schema: {},
});

// Lets editors pick how a page's hero renders — shared across the interior pages below.
const heroStyleField = (defaultValue: 'background' | 'split' | 'none') => fields.select({
    label: 'Hero Style',
    description: 'Background Image: full-width photo behind the headline. Image on Right: text with a framed photo beside it. No Image: text-only, centered.',
    options: [
        { label: 'Background Image', value: 'background' },
        { label: 'Image on Right', value: 'split' },
        { label: 'No Image', value: 'none' },
    ],
    defaultValue,
});

export default config({
    storage: {
        kind: 'github',
        repo: {
            name: 'tarrytown-local-site',
            owner: 'echjosc',
        },
    },
    ui: {
        navigation: {
            'Pages': ['homepage', 'menuPage', 'restaurantPage', 'bakeryPage', 'groceryPage', 'eventsPage', 'staffPage', 'commitmentsPage', 'contactPage', 'farmersPage'],
            'Global': ['businessInfo', 'team'],
            'Blog': ['posts'],
            'Legal': ['privacyPage', 'termsPage'],
        },
    },
    collections: {
        posts: collection({
            label: 'Posts',
            slugField: 'title',
            path: 'src/content/posts/*',
            format: { contentField: 'content' },
            schema: {
                title: fields.slug({ name: { label: 'Title' } }),
                excerpt: fields.text({
                    label: 'Excerpt',
                    description: 'A short summary shown on the blog listing page',
                    multiline: true,
                }),
                date: fields.date({
                    label: 'Publish Date',
                    description: 'The date this post was published',
                }),
                author: fields.text({
                    label: 'Author',
                    description: 'The author of this post',
                }),
                featuredImage: fields.image({
                    label: 'Featured Image',
                    directory: 'src/assets/images/posts',
                    publicPath: '@assets/images/posts/',
                    description: 'Hero image for the blog post',
                }),
                tags: fields.array(
                    fields.text({ label: 'Tag' }),
                    {
                        label: 'Tags',
                        itemLabel: (props) => props.value || 'New Tag',
                    }
                ),
                draft: fields.checkbox({
                    label: 'Draft',
                    description: 'Set to draft to hide from the blog listing',
                    defaultValue: false,
                }),
                content: fields.markdoc({
                    label: 'Content',
                    components: {
                        // keys must match your Markdoc tag names
                        'footnote-ref': FootnoteRef,
                        footnote: Footnote,
                        footnotes: Footnotes,
                    },
                }),

            },
        }),
    },
    singletons: {
        businessInfo: singleton({
            label: 'Business Info',
            path: 'src/content/business-info/',
            schema: {
                name: fields.text({ label: 'Business Name' }),
                logo: fields.image({
                    label: 'Logo',
                    description: 'Ideally use a transparent PNG. Recommended dimensions: 600x400px',
                    directory: 'src/assets/images/business',
                    publicPath: '@assets/images/business/',
                }),
                addressLines: fields.array(
                    fields.text({ label: 'Address Line' }),
                    {
                        label: 'Address',
                        itemLabel: (props) => props.value || 'New Line',
                    }
                ),
                phone: fields.text({ label: 'Phone Number' }),
                email: fields.text({ label: 'Email Address' }),
                hours: fields.array(
                    fields.object({
                        days: fields.text({ label: 'Days' }),
                        hours: fields.text({ label: 'Hours' }),
                    }),
                    {
                        label: 'Grocery Store Hours',
                        description: 'Hours for the grocery store only. Restaurant hours are set separately on the Restaurant Page.',
                        itemLabel: (props) => props.fields.days.value || 'New Hours Row',
                    }
                ),
                mapEmbedUrl: fields.text({ label: 'Google Maps Embed URL', description: 'Paste the full embed URL from Google Maps → Share → Embed a map' }),
                socials: fields.array(
                    fields.object({
                        platform: fields.select({
                            label: 'Platform',
                            options: [
                                { label: 'Instagram', value: 'instagram' },
                                { label: 'Facebook', value: 'facebook' },
                                { label: 'TikTok', value: 'tiktok' },
                                { label: 'Twitter / X', value: 'twitter' },
                                { label: 'Pinterest', value: 'pinterest' },
                            ],
                            defaultValue: 'instagram',
                        }),
                        url: fields.text({ label: 'Profile URL' }),
                    }),
                    {
                        label: 'Social Media Links',
                        itemLabel: (props) => props.fields.platform.value || 'New Link',
                    }
                ),
            },
        }),
        contactPage: singleton({
            label: 'Contact Page',
            path: 'src/content/contactpage/',
            schema: {
                seoTitle: fields.text({ label: 'Page Title' }),
                seoDescription: fields.text({ label: 'Meta Description', multiline: true }),
                heroTitle: fields.text({ label: 'Hero Title' }),
                heroSubtitle: fields.text({ label: 'Hero Subtitle', multiline: true }),
                comeVisit: fields.object({
                    title: fields.text({ label: 'Title', defaultValue: 'Come visit' }),
                    body: fields.text({ label: 'Body', multiline: true }),
                    closing: fields.text({ label: 'Closing line', defaultValue: 'See you soon!' }),
                }, { label: 'Come Visit Section' }),
                storefrontImage: fields.image({
                    label: 'Storefront Photo',
                    directory: 'src/assets/images/contact',
                    publicPath: '@assets/images/contact/',
                    description: 'Photo shown next to the map at the bottom of the page',
                }),
                storefrontImageAlt: fields.text({ label: 'Storefront Photo Alt Text' }),
            },
        }),
        menuPage: singleton({
            label: 'Menu Page',
            path: 'src/content/menupage/',
            schema: {
                seoTitle: fields.text({ label: 'Page Title' }),
                seoDescription: fields.text({ label: 'Meta Description', multiline: true }),
                heroTitle: fields.text({ label: 'Hero Title', defaultValue: "Today's Menu" }),
                heroSubtitle: fields.text({
                    label: 'Hero Subtitle',
                    multiline: true,
                    description: 'A short line under the title — good for the date or a quick note.',
                }),
                restaurantMenu: fields.object({
                    heading: fields.text({ label: 'Section Heading', defaultValue: 'Restaurant Menu' }),
                    note: fields.text({
                        label: 'Note',
                        multiline: true,
                        description: 'Optional note shown above this menu, e.g. today\'s specials or a sold-out item.',
                    }),
                    categories: fields.array(
                        fields.object({
                            name: fields.text({ label: 'Category Name' }),
                            items: fields.array(
                                fields.object({
                                    name: fields.text({ label: 'Dish Name' }),
                                    description: fields.text({ label: 'Description', multiline: true }),
                                    price: fields.text({ label: 'Price' }),
                                }),
                                {
                                    label: 'Items',
                                    itemLabel: (props) => props.fields.name.value || 'New Item',
                                }
                            ),
                        }),
                        {
                            label: 'Menu Categories',
                            description: 'Edit this every morning — changes go live as soon as they\'re saved.',
                            itemLabel: (props) => props.fields.name.value || 'New Category',
                        }
                    ),
                }, { label: 'Restaurant Menu' }),
                bakeryMenu: fields.object({
                    heading: fields.text({ label: 'Section Heading', defaultValue: 'Bakery Menu' }),
                    note: fields.text({
                        label: 'Note',
                        multiline: true,
                        description: 'Optional note shown above this menu, e.g. today\'s specials or a sold-out item.',
                    }),
                    categories: fields.array(
                        fields.object({
                            name: fields.text({ label: 'Category Name' }),
                            items: fields.array(
                                fields.object({
                                    name: fields.text({ label: 'Item Name' }),
                                    description: fields.text({ label: 'Description', multiline: true }),
                                    price: fields.text({ label: 'Price' }),
                                }),
                                {
                                    label: 'Items',
                                    itemLabel: (props) => props.fields.name.value || 'New Item',
                                }
                            ),
                        }),
                        {
                            label: 'Menu Categories',
                            description: 'Edit this every morning — changes go live as soon as they\'re saved.',
                            itemLabel: (props) => props.fields.name.value || 'New Category',
                        }
                    ),
                }, { label: 'Bakery Menu' }),
            },
        }),
        restaurantPage: singleton({
            label: 'Restaurant Page',
            path: 'src/content/restaurantpage/',
            schema: {
                seoTitle: fields.text({ label: 'Page Title' }),
                seoDescription: fields.text({ label: 'Meta Description', multiline: true }),
                hero: fields.object({
                    eyebrow: fields.text({ label: 'Eyebrow', defaultValue: 'Restaurant' }),
                    headline: fields.text({ label: 'Headline' }),
                    description: fields.text({ label: 'Description', multiline: true }),
                    style: heroStyleField('split'),
                    image: fields.image({
                        label: 'Hero Image',
                        directory: 'src/assets/images/restaurant/hero',
                        publicPath: '@assets/images/restaurant/hero/',
                    }),
                }, { label: 'Hero Section' }),
                intro: fields.text({
                    label: 'Intro',
                    multiline: true,
                    description: 'Separate paragraphs with a blank line',
                }),
                hours: fields.array(
                    fields.object({
                        days: fields.text({ label: 'Days' }),
                        hours: fields.text({ label: 'Hours' }),
                    }),
                    {
                        label: 'Restaurant Hours',
                        description: 'Hours for the restaurant/dining room only. Grocery store hours are set separately on Business Info.',
                        itemLabel: (props) => props.fields.days.value || 'New Hours Row',
                    }
                ),
                reservationUrl: fields.text({ label: 'Reservation URL', defaultValue: '#' }),
                reservationText: fields.text({ label: 'Reservation Link Text', defaultValue: 'Make a Reservation' }),
                dinnerNote: fields.text({ label: 'Dinner Note', multiline: true }),
                sampleMenu: fields.object({
                    heading: fields.text({ label: 'Heading' }),
                    categories: fields.array(
                        fields.object({
                            name: fields.text({ label: 'Category Name' }),
                            items: fields.array(
                                fields.object({
                                    name: fields.text({ label: 'Dish Name' }),
                                    description: fields.text({ label: 'Description', multiline: true }),
                                }),
                                {
                                    label: 'Items',
                                    itemLabel: (props) => props.fields.name.value || 'New Item',
                                }
                            ),
                        }),
                        {
                            label: 'Menu Categories',
                            itemLabel: (props) => props.fields.name.value || 'New Category',
                        }
                    ),
                }, { label: 'Sample Menu Section' }),
                suggestion: fields.object({
                    heading: fields.text({ label: 'Heading', defaultValue: 'Tell Us What You Want To Eat' }),
                    body: fields.text({ label: 'Body', multiline: true }),
                }, { label: 'Menu Suggestion Section' }),
            },
        }),
        bakeryPage: singleton({
            label: 'Bakery Page',
            path: 'src/content/bakerypage/',
            schema: {
                seoTitle: fields.text({ label: 'Page Title' }),
                seoDescription: fields.text({ label: 'Meta Description', multiline: true }),
                hero: fields.object({
                    eyebrow: fields.text({ label: 'Eyebrow', defaultValue: 'Bakery' }),
                    headline: fields.text({ label: 'Headline' }),
                    description: fields.text({ label: 'Description', multiline: true }),
                    style: heroStyleField('split'),
                    image: fields.image({
                        label: 'Hero Image',
                        directory: 'src/assets/images/bakery/hero',
                        publicPath: '@assets/images/bakery/hero/',
                    }),
                }, { label: 'Hero Section' }),
                philosophy: fields.object({
                    title: fields.text({ label: 'Section Title', defaultValue: 'Our Philosophy' }),
                    watermarkText: fields.text({ label: 'Watermark Text' }),
                    body: fields.text({ label: 'Body Text', multiline: true }),
                    items: fields.array(
                        fields.object({
                            title: fields.text({ label: 'Point Title' }),
                            description: fields.text({ label: 'Description', multiline: true }),
                        }),
                        {
                            label: 'Philosophy Points',
                            itemLabel: (props) => props.fields.title.value || 'New Point',
                        }
                    ),
                }, { label: 'Philosophy Section' }),
                workingWithGrain: fields.object({
                    title: fields.text({ label: 'Section Title', defaultValue: 'Working with the grain, not against it' }),
                    body: fields.text({ label: 'Body Text', multiline: true }),
                }, { label: 'Working With The Grain Section' }),
                grains: fields.array(
                    fields.object({
                        category: fields.text({ label: 'Grain Category', description: 'e.g. Hard Red Wheat' }),
                        varieties: fields.array(
                            fields.object({
                                name: fields.text({ label: 'Variety Name' }),
                                farm: fields.text({ label: 'Farm' }),
                                location: fields.text({ label: 'Location' }),
                            }),
                            {
                                label: 'Varieties',
                                itemLabel: (props) => props.fields.name.value || 'New Variety',
                            }
                        ),
                    }),
                    {
                        label: 'Grains on Rotation',
                        itemLabel: (props) => props.fields.category.value || 'New Grain',
                    }
                ),
                sampleMenu: fields.object({
                    heading: fields.text({ label: 'Heading' }),
                    categories: fields.array(
                        fields.object({
                            name: fields.text({ label: 'Category Name' }),
                            items: fields.array(
                                fields.object({
                                    name: fields.text({ label: 'Item Name' }),
                                    description: fields.text({ label: 'Description', multiline: true }),
                                }),
                                {
                                    label: 'Items',
                                    itemLabel: (props) => props.fields.name.value || 'New Item',
                                }
                            ),
                        }),
                        {
                            label: 'Menu Categories',
                            itemLabel: (props) => props.fields.name.value || 'New Category',
                        }
                    ),
                }, { label: 'Sample Menu Section' }),
            },
        }),
        groceryPage: singleton({
            label: 'Grocery Page',
            path: 'src/content/grocerypage/',
            schema: {
                seoTitle: fields.text({ label: 'Page Title' }),
                seoDescription: fields.text({ label: 'Meta Description', multiline: true }),
                hero: fields.object({
                    eyebrow: fields.text({ label: 'Eyebrow', defaultValue: 'Grocery' }),
                    headline: fields.text({ label: 'Headline' }),
                    description: fields.text({ label: 'Description', multiline: true }),
                    style: heroStyleField('split'),
                    image: fields.image({
                        label: 'Hero Image',
                        directory: 'src/assets/images/grocery/hero',
                        publicPath: '@assets/images/grocery/hero/',
                    }),
                }, { label: 'Hero Section' }),
                intro: fields.text({
                    label: 'Intro',
                    multiline: true,
                    description: 'Separate paragraphs with a blank line',
                }),
                categories: fields.array(
                    fields.object({
                        icon: fields.select({
                            label: 'Icon',
                            options: [
                                { label: 'Pantry', value: 'pantry' },
                                { label: 'Produce', value: 'produce' },
                                { label: 'Mill', value: 'mill' },
                                { label: 'Grab & Go', value: 'grab-and-go' },
                            ],
                            defaultValue: 'pantry',
                        }),
                        title: fields.text({ label: 'Title' }),
                        description: fields.text({ label: 'Description', multiline: true }),
                    }),
                    {
                        label: 'Categories',
                        itemLabel: (props) => props.fields.title.value || 'New Category',
                    }
                ),
                sourcingPhilosophy: fields.object({
                    title: fields.text({ label: 'Section Title', defaultValue: 'How We Source' }),
                    body: fields.text({ label: 'Body Text', multiline: true }),
                    items: fields.array(
                        fields.object({
                            title: fields.text({ label: 'Title' }),
                            description: fields.text({ label: 'Description', multiline: true }),
                        }),
                        {
                            label: 'Standards',
                            itemLabel: (props) => props.fields.title.value || 'New Standard',
                        }
                    ),
                }, { label: 'Sourcing Philosophy Section' }),
                askUs: fields.object({
                    title: fields.text({ label: 'Section Title', defaultValue: 'We Think A Grocery Store Should Help You Cook' }),
                    body: fields.text({ label: 'Body Text', multiline: true }),
                    prompts: fields.array(
                        fields.text({ label: 'Prompt' }),
                        {
                            label: 'Ask Us Prompts',
                            itemLabel: (props) => props.value || 'New Prompt',
                        }
                    ),
                }, { label: 'Ask Us Section' }),
                suggestion: fields.object({
                    heading: fields.text({ label: 'Heading', defaultValue: 'Have A Product You Want Us To Carry?' }),
                    body: fields.text({ label: 'Body', multiline: true }),
                }, { label: 'Product Suggestion Section' }),
            },
        }),
        eventsPage: singleton({
            label: 'Events & Catering Page',
            path: 'src/content/eventspage/',
            schema: {
                seoTitle: fields.text({ label: 'Page Title' }),
                seoDescription: fields.text({ label: 'Meta Description', multiline: true }),
                hero: fields.object({
                    eyebrow: fields.text({ label: 'Eyebrow', defaultValue: 'Events & Catering' }),
                    headline: fields.text({ label: 'Headline' }),
                    description: fields.text({ label: 'Description', multiline: true }),
                    style: heroStyleField('split'),
                    image: fields.image({
                        label: 'Hero Image',
                        directory: 'src/assets/images/events/hero',
                        publicPath: '@assets/images/events/hero/',
                    }),
                }, { label: 'Hero Section' }),
                examples: fields.array(
                    fields.text({ label: 'Example' }),
                    {
                        label: 'Examples',
                        description: 'Short scenarios of events/catering you can do, e.g. "A private fundraiser dinner"',
                        itemLabel: (props) => props.value || 'New Example',
                    }
                ),
                inquiry: fields.object({
                    heading: fields.text({ label: 'Heading', defaultValue: 'Planning Something? Tell Us About It!' }),
                    body: fields.text({ label: 'Body', multiline: true }),
                }, { label: 'Event Inquiry Section' }),
            },
        }),
        farmersPage: singleton({
            label: 'Farmers Page',
            path: 'src/content/farmerspage/',
            schema: {
                heroTitle: fields.text({ label: 'Hero Title' }),
                heroSubtitle: fields.text({ label: 'Hero Subtitle', multiline: true }),
                locations: fields.array(
                    fields.object({
                        lat: fields.number({ label: 'Latitude', description: 'Decimal latitude (e.g. 41.0785)' }),
                        lng: fields.number({ label: 'Longitude', description: 'Decimal longitude (e.g. -73.8579)' }),
                        title: fields.text({ label: 'Name' }),
                        description: fields.text({ label: 'Description', multiline: true }),
                        type: fields.select({
                            label: 'Type',
                            options: [
                                { label: 'Home Base', value: 'home' },
                                { label: 'Produce', value: 'produce' },
                                { label: 'Meat', value: 'meat' },
                                { label: 'Farm', value: 'farm' },
                            ],
                            defaultValue: 'farm',
                        }),
                        url: fields.text({ label: 'Website URL' }),
                        image: fields.image({
                            label: 'Photo',
                            directory: 'src/assets/images/farmers/locations',
                            publicPath: '@assets/images/farmers/locations/',
                        }),
                    }),
                    {
                        label: 'Map Locations',
                        itemLabel: (props) => props.fields.title.value || 'New Location',
                    }
                ),
            },
        }),
        privacyPage: singleton({
            label: 'Privacy Policy',
            path: 'src/content/privacypage/',
            schema: {
                seoTitle: fields.text({ label: 'Page Title', defaultValue: 'Privacy Policy' }),
                heroTitle: fields.text({ label: 'Hero Title', defaultValue: 'Privacy Policy' }),
                lastUpdated: fields.text({ label: 'Last Updated', description: 'e.g. "January 2026" — shown under the title' }),
                body: fields.text({
                    label: 'Content',
                    multiline: true,
                    description: 'Separate paragraphs with a blank line.',
                }),
            },
        }),
        termsPage: singleton({
            label: 'Terms of Service',
            path: 'src/content/termspage/',
            schema: {
                seoTitle: fields.text({ label: 'Page Title', defaultValue: 'Terms of Service' }),
                heroTitle: fields.text({ label: 'Hero Title', defaultValue: 'Terms of Service' }),
                lastUpdated: fields.text({ label: 'Last Updated', description: 'e.g. "January 2026" — shown under the title' }),
                body: fields.text({
                    label: 'Content',
                    multiline: true,
                    description: 'Separate paragraphs with a blank line.',
                }),
            },
        }),
        team: singleton({
            label: 'Team',
            path: 'src/content/team/',
            schema: {
                members: fields.array(
                    fields.object({
                        name: fields.text({ label: 'Name' }),
                        role: fields.text({ label: 'Role / Title' }),
                        bio: fields.text({
                            label: 'Bio',
                            multiline: true,
                            description: 'Separate paragraphs with a blank line',
                        }),
                        image: fields.image({
                            label: 'Photo',
                            directory: 'src/assets/images/team',
                            publicPath: '@assets/images/team/',
                        }),
                        imageAlt: fields.text({ label: 'Image Alt Text' }),
                        socials: fields.array(
                            fields.object({
                                platform: fields.select({
                                    label: 'Platform',
                                    options: [
                                        { label: 'Instagram', value: 'instagram' },
                                        { label: 'TikTok', value: 'tiktok' },
                                        { label: 'Twitter / X', value: 'twitter' },
                                        { label: 'LinkedIn', value: 'linkedin' },
                                        { label: 'Facebook', value: 'facebook' },
                                        { label: 'YouTube', value: 'youtube' },
                                        { label: 'Website', value: 'website' },
                                    ],
                                    defaultValue: 'instagram',
                                }),
                                url: fields.text({ label: 'URL' }),
                                label: fields.text({ label: 'Custom Label', description: 'Optional — overrides the default platform name' }),
                            }),
                            {
                                label: 'Social Links',
                                itemLabel: (props) => props.fields.platform.value || 'New Link',
                            }
                        ),
                    }),
                    {
                        label: 'Team Members',
                        itemLabel: (props) => props.fields.name.value || 'New Member',
                    }
                ),
            },
        }),
        homepage: singleton({
            label: 'Homepage',
            path: 'src/content/homepage/',
            schema: {
                // Hero
                hero: fields.object({
                    eyebrow: fields.text({ label: 'Eyebrow' }),
                    headline: fields.text({
                        label: 'Headline',
                        multiline: true,
                        description: 'Press Enter to force a line break.',
                    }),
                    description: fields.text({ label: 'Description' }),
                    buttons: fields.array(
                        fields.object({
                            text: fields.text({ label: 'Button Text' }),
                            url: fields.text({ label: 'Button URL' }),
                        }),
                        {
                            label: 'Buttons',
                            itemLabel: (props) => props.fields.text.value || 'New Button',
                        }
                    ),
                    image: fields.image({
                        label: 'Featured Image',
                        directory: 'src/assets/images/homepage/hero',
                        publicPath: '@assets/images/homepage/hero/',
                        description: 'Hero image for the homepage',
                    })
                }, {
                    label: 'Hero Section',
                    layout: [6, 6, 12, 12, 12],
                }),

                // Tagline (italic line shown above the pillars grid)
                tagline: fields.text({
                    label: 'Tagline',
                    description: 'Italic line shown above the four category cards',
                    multiline: true,
                }),

                // Pillars Section — the four homepage categories
                pillars: fields.array(
                    fields.object({
                        icon: fields.select({
                            label: 'Icon',
                            options: [
                                { label: 'Pantry', value: 'pantry' },
                                { label: 'Produce', value: 'produce' },
                                { label: 'Mill', value: 'mill' },
                                { label: 'Grab & Go', value: 'grab-and-go' },
                            ],
                            defaultValue: 'pantry',
                        }),
                        title: fields.text({ label: 'Title' }),
                        description: fields.text({ label: 'Description', multiline: true }),
                        linkUrl: fields.text({ label: 'Link URL', description: 'Optional — where this card links to' }),
                    }),
                    {
                        label: 'Pillars',
                        description: 'The four category cards shown below the hero (Pantry Staples, Seasonal Produce, Mill and Bakery, Grab n’ Go or Dine In)',
                        itemLabel: (props) => props.fields.title.value || 'New Pillar',
                    }
                ),

                // Statement banner ("We stock our shelves, coolers, and kitchen...")
                statement: fields.object({
                    quote: fields.text({ label: 'Quote', multiline: true }),
                    ctaText: fields.text({ label: 'CTA Button Text' }),
                    ctaUrl: fields.text({ label: 'CTA Button URL', defaultValue: '/grocery' }),
                }, { label: 'Statement Banner' }),

                // Location Section (address, phone, hours & map come from Business Info + Restaurant Page)
                location: fields.object({
                    title: fields.text({ label: 'Section Title', defaultValue: 'Find Us' }),
                    groceryHoursLabel: fields.text({ label: 'Grocery Hours Heading', defaultValue: 'Grocery Store Hours' }),
                    restaurantHoursLabel: fields.text({ label: 'Restaurant Hours Heading', defaultValue: 'Restaurant Hours' }),
                    directionsUrl: fields.text({ label: 'Directions URL', description: 'Optional — leave blank to auto-generate directions from the address in Business Info. Only fill this in if you want to link somewhere custom.' }),
                    directionsText: fields.text({ label: 'Directions Link Text', defaultValue: 'Get Directions' }),
                    mapLabel: fields.text({ label: 'Map Accessibility Label', defaultValue: 'Our location on the map' }),
                }, { label: 'Location Section' }),

                // Newsletter Section
                newsletter: fields.object({
                    title: fields.text({ label: 'Title', defaultValue: 'Stay in the Loop' }),
                    description: fields.text({ label: 'Description', multiline: true }),
                    placeholder: fields.text({ label: 'Input Placeholder', defaultValue: 'Enter your email address' }),
                    buttonText: fields.text({ label: 'Button Text', defaultValue: 'Subscribe' }),
                }, { label: 'Newsletter Section' }),
            },
        }),
        staffPage: singleton({
            label: 'Our Team Page',
            path: 'src/content/our-teampage/',
            schema: {
                seoTitle: fields.text({ label: 'Page Title' }),
                seoDescription: fields.text({ label: 'Meta Description', multiline: true }),

                // Hero
                hero: fields.object({
                    eyebrow: fields.text({ label: 'Eyebrow' }),
                    headline: fields.text({ label: 'Headline', description: 'Wrap a word in {curly braces} to render it in the accent serif style' }),
                    description: fields.text({ label: 'Description', multiline: true }),
                    style: heroStyleField('background'),
                    image: fields.image({
                        label: 'Hero Image',
                        directory: 'src/assets/images/our-team/hero',
                        publicPath: '@assets/images/our-team/hero/',
                    }),
                }, { label: 'Hero Section' }),

                // Team section display (members live in the Team singleton)
                team: fields.object({
                    sectionTitle: fields.text({ label: 'Section Title', defaultValue: 'Meet the Team' }),
                    subtitle: fields.text({ label: 'Subtitle', multiline: true }),
                }, { label: 'Team Section' }),
            },
        }),
        commitmentsPage: singleton({
            label: 'Our Story Page',
            path: 'src/content/commitmentspage/',
            schema: {
                seoTitle: fields.text({ label: 'Page Title' }),
                seoDescription: fields.text({ label: 'Meta Description', multiline: true }),

                // Hero
                hero: fields.object({
                    eyebrow: fields.text({ label: 'Eyebrow' }),
                    headline: fields.text({ label: 'Headline', description: 'Wrap a word in {curly braces} to render it in the accent serif style' }),
                    description: fields.text({ label: 'Description', multiline: true }),
                    style: heroStyleField('background'),
                    image: fields.image({
                        label: 'Hero Image',
                        directory: 'src/assets/images/our-story/hero',
                        publicPath: '@assets/images/our-story/hero/',
                    }),
                }, { label: 'Hero Section' }),

                // Story
                story: fields.object({
                    sectionTitle: fields.text({ label: 'Section Title', defaultValue: 'Our Story' }),
                    tagline: fields.text({ label: 'Tagline', multiline: true, description: 'Large italic pull-quote' }),
                    mission: fields.text({ label: 'Mission Statement', multiline: true }),
                    commitments: fields.array(
                        fields.object({
                            title: fields.text({ label: 'Title' }),
                            description: fields.text({ label: 'Description', multiline: true }),
                            tagline: fields.text({ label: 'Tagline', description: 'Optional italic accent line at the bottom of the card' }),
                            variant: fields.select({
                                label: 'Card Style',
                                options: [
                                    { label: 'Light', value: 'light' },
                                    { label: 'Dark', value: 'dark' },
                                ],
                                defaultValue: 'light',
                            }),
                        }),
                        {
                            label: 'Key Commitments',
                            description: 'First 2 items appear in a larger 2-column row; remaining items fill a 3-column row',
                            itemLabel: (props) => props.fields.title.value || 'New Commitment',
                        }
                    ),
                    sourcingStandards: fields.array(
                        fields.object({
                            title: fields.text({ label: 'Standard Title' }),
                            description: fields.text({ label: 'Description', multiline: true }),
                        }),
                        {
                            label: 'Sourcing Standards',
                            itemLabel: (props) => props.fields.title.value || 'New Standard',
                        }
                    ),
                }, { label: 'Our Story Section' }),

                // FAQ
                faqs: fields.array(
                    fields.object({
                        question: fields.text({ label: 'Question' }),
                        answer: fields.text({ label: 'Answer', multiline: true }),
                    }),
                    {
                        label: 'FAQs',
                        itemLabel: (props) => props.fields.question.value || 'New Question',
                    }
                ),

                // Newsletter
                newsletter: fields.object({
                    title: fields.text({ label: 'Title', defaultValue: 'Stay in the Loop' }),
                    description: fields.text({ label: 'Description', multiline: true }),
                    placeholder: fields.text({ label: 'Input Placeholder', defaultValue: 'Enter your email address' }),
                    buttonText: fields.text({ label: 'Button Text', defaultValue: 'Subscribe' }),
                }, { label: 'Newsletter Section' }),
            },
        }),

    }
});