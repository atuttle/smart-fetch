const { fetch, wrapFetch } = require('./smart-fetch');

describe('smart-fetch', () => {
	it('returns js primitives for json responses', async () => {
		const fact = await fetch('https://uselessfacts.jsph.pl/random.json?language=en');

		console.log(`Here\'s a useless fact: ${fact.text}`);

		expect(fact).toMatchObject({
			id: expect.any(String),
			text: expect.any(String),
			source: expect.any(String),
			source_url: expect.any(String),
			language: expect.any(String),
			permalink: expect.any(String)
		});
	});

	it('rejects if !response.ok', async () => {
		const req = fetch('https://uselessfacts.jsph.pl/random.json?language=en', { method: 'POST' });
		expect(req).rejects.toContain('something went wrong');
	});

	it('throws on timeout', async () => {
		const req = fetch('https://uselessfacts.jsph.pl/random.json?language=en', { timeout: 1 });
		expect(req).rejects.toThrow('user aborted a request');
	});

	describe('micro-clients', () => {
		it('remembers the baseurl', async () => {
			const api = wrapFetch('http://api.open-notify.org');
			const currentAstronauts = await api('/astros.json');
			expect(currentAstronauts).toMatchObject({
				message: 'success',
				number: expect.any(Number),
				people: expect.any(Array)
			});
			console.log('People currently in space: ', currentAstronauts.people);
		});
	});
});
