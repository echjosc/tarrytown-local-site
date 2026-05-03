// keystatic.config.ts
import { config, fields, collection, singleton } from '@keystatic/core';

export default config({
    storage: {
        kind: 'local',
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
                content: fields.markdoc({ label: 'Content' }),
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
                hero: fields.object({
                    headline: fields.text({ label: 'Headline' }),
                    subheadline: fields.text({ label: 'Subheadline' }),
                    description: fields.text({ label: 'Description' }),
                    buttonText: fields.text({ label: 'Button Text' }),
                    buttonUrl: fields.text({ label: 'Button URL' }),
                }, {
                    label: 'Hero Section',
                    layout: [6, 6, 12, 6, 6], // optional: grid layout for fields
                }),

                featuresSection: fields.object({
                    features: fields.array(
                        fields.object({
                            title: fields.text({ label: 'Feature Title' }),
                            description: fields.text({ label: 'Feature Description' }),
                            iconUrl: fields.text({ label: 'Feature Icon URL' }),
                        }),
                        {
                            label: 'Features',
                            itemLabel: (props) => props.fields.title.value || 'New Feature',
                        }
                    ),
                }, { label: 'Features Section' }),

                aboutUsPreview: fields.object({
                    title: fields.text({ label: 'About Us Title' }),
                    description: fields.text({ label: 'About Us Description' }),
                    imageUrl: fields.text({ label: 'About Us Image URL' }),
                }, { label: 'About Us Preview Section' }),

                cta: fields.object({
                    headline: fields.text({ label: 'CTA Headline' }),
                    subheadline: fields.text({ label: 'CTA Subheadline' }),
                    buttonText: fields.text({ label: 'CTA Button Text' }),
                    buttonUrl: fields.text({ label: 'CTA Button URL' }),
                }, { label: 'Call to Action Section' }),
            },
        }),
    }
});