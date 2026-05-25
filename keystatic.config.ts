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
            'Pages': ['homepage', 'aboutpage', 'farmersPage', 'contactPage'],
            'Global': ['businessInfo', 'team'],
            'Blog': ['posts'],
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
                    directory: 'public/images/posts',
                    publicPath: '/images/posts/',
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
                    directory: 'public/images/business',
                    publicPath: '/images/business/',
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
                        label: 'Hours',
                        itemLabel: (props) => props.fields.days.value || 'New Hours Row',
                    }
                ),
                mapEmbedUrl: fields.text({ label: 'Google Maps Embed URL', description: 'Paste the full embed URL from Google Maps → Share → Embed a map' }),
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
                storefrontImage: fields.image({
                    label: 'Storefront Photo',
                    directory: 'public/images/contact',
                    publicPath: '/images/contact/',
                    description: 'Photo shown next to the map at the bottom of the page',
                }),
                storefrontImageAlt: fields.text({ label: 'Storefront Photo Alt Text' }),
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
                            directory: 'public/images/farmers/locations',
                            publicPath: '/images/farmers/locations/',
                        }),
                    }),
                    {
                        label: 'Map Locations',
                        itemLabel: (props) => props.fields.title.value || 'New Location',
                    }
                ),
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
                            directory: 'public/images/team',
                            publicPath: '/images/team/',
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
                    headline: fields.text({ label: 'Headline' }),
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
                        directory: 'public/images/homepage/hero',
                        publicPath: '/images/homepage/hero/',
                        description: 'Hero image for the homepage',
                    })
                }, {
                    label: 'Hero Section',
                    layout: [6, 6, 12, 12, 12],
                }),
                // Featured Section
                offerings: fields.object({
                    sectionTitle: fields.text({ label: 'Section Title', defaultValue: 'What We Do' }),
                    featured: fields.object({
                        eyebrow: fields.text({ label: 'Eyebrow', description: 'Small label above the title' }),
                        title: fields.text({ label: 'Title' }),
                        description: fields.text({ label: 'Description', multiline: true }),
                        image: fields.image({
                            label: 'Image',
                            directory: 'public/images/homepage/offerings/featured',
                            publicPath: '/images/homepage/offerings/featured/',
                        }),
                        imageAlt: fields.text({ label: 'Image Alt Text' }),
                        linkText: fields.text({ label: 'Link Text' }),
                        linkUrl: fields.text({ label: 'Link URL' }),
                    }, { label: 'Featured Card' }),
                    cards: fields.array(
                        fields.object({
                            title: fields.text({ label: 'Title' }),
                            description: fields.text({ label: 'Description', multiline: true }),
                            linkText: fields.text({ label: 'Link Text' }),
                            linkUrl: fields.text({ label: 'Link URL' }),
                        }),
                        {
                            label: 'Cards',
                            itemLabel: (props) => props.fields.title.value || 'New Card',
                        }
                    ),
                }, { label: 'Offerings Section' }),

                // Newsletter Section
                newsletter: fields.object({
                    title: fields.text({ label: 'Title', defaultValue: 'Stay in the Loop' }),
                    description: fields.text({ label: 'Description', multiline: true }),
                    placeholder: fields.text({ label: 'Input Placeholder', defaultValue: 'Enter your email address' }),
                    buttonText: fields.text({ label: 'Button Text', defaultValue: 'Subscribe' }),
                }, { label: 'Newsletter Section' }),

                // Location Section (address, phone, hours & map come from Business Info)
                location: fields.object({
                    title: fields.text({ label: 'Section Title', defaultValue: 'Find Us' }),
                    hoursTitle: fields.text({ label: 'Hours Heading', defaultValue: 'Hours of Operation' }),
                    directionsUrl: fields.text({ label: 'Directions URL', description: 'Link for the "Get Directions" button' }),
                    directionsText: fields.text({ label: 'Directions Link Text', defaultValue: 'Get Directions' }),
                    mapLabel: fields.text({ label: 'Map Accessibility Label', defaultValue: 'Our location on the map' }),
                }, { label: 'Location Section' }),

                // Commitments Section
                commitments: fields.object({
                    sectionTitle: fields.text({ label: 'Section Title', defaultValue: 'Our Commitments' }),
                    sectionSubtitle: fields.text({ label: 'Section Subtitle', multiline: true }),
                    quote: fields.text({ label: 'Quote', multiline: true, description: 'Large italic quote displayed at the top of the section' }),
                    ctaText: fields.text({ label: 'CTA Button Text', defaultValue: 'Explore Our Commitments' }),
                    ctaUrl: fields.text({ label: 'CTA Button URL', defaultValue: '/about' }),
                    items: fields.array(
                        fields.object({
                            title: fields.text({ label: 'Title' }),
                            description: fields.text({ label: 'Description', multiline: true }),
                            tagline: fields.text({ label: 'Tagline', description: 'Optional italic accent line shown at the bottom of the card' }),
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
                            label: 'Commitment Items',
                            description: 'First 2 items appear in a larger 2-column row; remaining items fill a 3-column row',
                            itemLabel: (props) => props.fields.title.value || 'New Item',
                        }
                    ),
                }, { label: 'Commitments Section' }),

                // Sourcing Standards Section
                sourcingStandards: fields.object({
                    title: fields.text({ label: 'Section Title', defaultValue: 'Our sourcing standards' }),
                    watermarkText: fields.text({ label: 'Watermark Text', description: 'Large decorative text displayed behind the heading' }),
                    body: fields.text({ label: 'Body Text', multiline: true }),
                    image: fields.object({
                        src: fields.image({
                            label: 'Photo',
                            directory: 'public/images/homepage/sourcing',
                            publicPath: '/images/homepage/sourcing/',
                        }),
                        alt: fields.text({ label: 'Image Alt Text' }),
                        caption: fields.text({ label: 'Caption', description: 'Optional caption shown below the photo' }),
                    }, { label: 'Photo' }),
                    items: fields.array(
                        fields.object({
                            title: fields.text({ label: 'Standard Title' }),
                            description: fields.text({ label: 'Description', multiline: true }),
                        }),
                        {
                            label: 'Standards',
                            itemLabel: (props) => props.fields.title.value || 'New Standard',
                        }
                    ),
                }, { label: 'Sourcing Standards Section' }),

            },
        }),
        aboutpage: singleton({
            label: 'About Page',
            path: 'src/content/aboutpage/',
            schema: {
                seoTitle: fields.text({ label: 'Page Title' }),
                seoDescription: fields.text({ label: 'Meta Description', multiline: true }),

                // Hero
                hero: fields.object({
                    eyebrow: fields.text({ label: 'Eyebrow' }),
                    headline: fields.text({ label: 'Headline' }),
                    description: fields.text({ label: 'Description', multiline: true }),
                    image: fields.image({
                        label: 'Hero Image',
                        directory: 'public/images/about/hero',
                        publicPath: '/images/about/hero/',
                    }),
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
                }, { label: 'Hero Section' }),

                // Commitments
                commitments: fields.object({
                    sectionTitle: fields.text({ label: 'Section Title', defaultValue: 'Our Commitments' }),
                    sectionSubtitle: fields.text({ label: 'Section Subtitle', multiline: true }),
                    items: fields.array(
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
                            label: 'Commitment Items',
                            description: 'First 2 items appear in a larger 2-column row; remaining items fill a 3-column row',
                            itemLabel: (props) => props.fields.title.value || 'New Item',
                        }
                    ),
                }, { label: 'Commitments Section' }),

                // Sourcing Standards
                sourcingStandards: fields.object({
                    title: fields.text({ label: 'Section Title', defaultValue: 'Our sourcing standards' }),
                    watermarkText: fields.text({ label: 'Watermark Text', description: 'Large decorative text displayed behind the heading' }),
                    body: fields.text({ label: 'Body Text', multiline: true }),
                    image: fields.object({
                        src: fields.image({
                            label: 'Photo',
                            directory: 'public/images/about/sourcing',
                            publicPath: '/images/about/sourcing/',
                        }),
                        alt: fields.text({ label: 'Image Alt Text' }),
                        caption: fields.text({ label: 'Caption', description: 'Optional caption shown below the photo' }),
                    }, { label: 'Photo' }),
                    items: fields.array(
                        fields.object({
                            title: fields.text({ label: 'Standard Title' }),
                            description: fields.text({ label: 'Description', multiline: true }),
                        }),
                        {
                            label: 'Standards',
                            itemLabel: (props) => props.fields.title.value || 'New Standard',
                        }
                    ),
                }, { label: 'Sourcing Standards Section' }),

                // Team section display (members live in the Team singleton)
                team: fields.object({
                    sectionTitle: fields.text({ label: 'Section Title', defaultValue: 'Meet the Team' }),
                    subtitle: fields.text({ label: 'Subtitle', multiline: true }),
                }, { label: 'Team Section' }),

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