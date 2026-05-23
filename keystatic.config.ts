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
                address: fields.text({ label: 'Business Address' }),
                phone: fields.text({ label: 'Business Phone' }),
                email: fields.text({ label: 'Business Email' }),
                hours: fields.object({
                    monday: fields.text({ label: 'Monday Hours' }),
                    tuesday: fields.text({ label: 'Tuesday Hours' }),
                    wednesday: fields.text({ label: 'Wednesday Hours' }),
                    thursday: fields.text({ label: 'Thursday Hours' }),
                    friday: fields.text({ label: 'Friday Hours' }),
                    saturday: fields.text({ label: 'Saturday Hours' }),
                    sunday: fields.text({ label: 'Sunday Hours' }),
                }, { label: 'Business Hours' })
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
                        directory: 'src/assets/images/homepage',
                        publicPath: '/src/assets/images/homepage/',
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
                            directory: 'src/assets/images/homepage',
                            publicPath: '/src/assets/images/homepage/',
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

            },
        }),
    }
});