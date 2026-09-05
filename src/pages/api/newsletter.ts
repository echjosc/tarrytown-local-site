import type { APIRoute } from 'astro';
import { createHash } from 'node:crypto';

// This route calls the Mailchimp API at request time, so it must be
// rendered on-demand rather than baked into the static build.
export const prerender = false;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const POST: APIRoute = async ({ request }) => {
	const apiKey = import.meta.env.MAILCHIMP_API_KEY;
	const audienceId = import.meta.env.MAILCHIMP_AUDIENCE_ID;

	if (!apiKey || !audienceId) {
		console.error('Mailchimp env vars missing: MAILCHIMP_API_KEY / MAILCHIMP_AUDIENCE_ID');
		return json({ ok: false, error: 'Newsletter signup is not configured yet.' }, 500);
	}

	// The Mailchimp API key encodes its data center as a suffix, e.g. "abcd1234-us21".
	const serverPrefix = apiKey.split('-').pop();
	if (!serverPrefix) {
		return json({ ok: false, error: 'Newsletter signup is not configured yet.' }, 500);
	}

	let email: string | undefined;
	const contentType = request.headers.get('content-type') || '';
	try {
		if (contentType.includes('application/json')) {
			const body = await request.json();
			email = typeof body?.email === 'string' ? body.email : undefined;
		} else {
			const form = await request.formData();
			const value = form.get('email');
			email = typeof value === 'string' ? value : undefined;
		}
	} catch {
		return json({ ok: false, error: 'Could not read the submitted form data.' }, 400);
	}

	email = email?.trim().toLowerCase();
	if (!email || !EMAIL_RE.test(email)) {
		return json({ ok: false, error: 'Please enter a valid email address.' }, 400);
	}

	// Upsert (PUT on the member's hash) so re-subscribing an existing address
	// doesn't fail with a "Member Exists" error.
	const subscriberHash = createHash('md5').update(email).digest('hex');
	const status = import.meta.env.MAILCHIMP_DOUBLE_OPTIN === 'true' ? 'pending' : 'subscribed';

	try {
		const response = await fetch(
			`https://${serverPrefix}.api.mailchimp.com/3.0/lists/${audienceId}/members/${subscriberHash}`,
			{
				method: 'PUT',
				headers: {
					Authorization: `Basic ${Buffer.from(`anystring:${apiKey}`).toString('base64')}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					email_address: email,
					status_if_new: status,
				}),
			}
		);

		if (!response.ok) {
			const detail = await response.json().catch(() => null);
			console.error('Mailchimp error', response.status, detail);

			if (detail?.title === 'Member In Compliance State') {
				return json(
					{ ok: false, error: 'This address can’t be re-subscribed automatically. Please contact us directly.' },
					400
				);
			}

			return json({ ok: false, error: 'Something went wrong. Please try again in a moment.' }, 502);
		}

		return json({ ok: true, message: 'Thanks for subscribing!' }, 200);
	} catch (err) {
		console.error('Mailchimp request failed', err);
		return json({ ok: false, error: 'Something went wrong. Please try again in a moment.' }, 502);
	}
};

function json(data: unknown, status: number) {
	return new Response(JSON.stringify(data), {
		status,
		headers: { 'Content-Type': 'application/json' },
	});
}
