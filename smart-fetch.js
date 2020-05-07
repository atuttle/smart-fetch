const debug = require('debug')('smart-fetch');
const fetch = require('isomorphic-fetch');
const AbortController = require('abort-controller');

const wrapFetch = (baseUrl, defaultOptions = {}, ...future) => {
	const { headers, timeout, ...otherDefaults } = defaultOptions;
	return async (uri, options = {}) => {
		const { body, ...customizations } = options;
		const finalTimeout = 'timeout' in customizations ? customizations.timeout : timeout;
		const defaultHeaders = {
			'Content-Type': 'application/json',
			...headers
		};
		const method = body ? 'POST' : 'GET';
		const config = {
			method, //override in options if you need to
			...otherDefaults,
			...customizations,
			headers: {
				...defaultHeaders,
				...customizations.headers
			}
		};
		if (body) {
			if (typeof body === 'string') {
				config.body = body;
			} else {
				config.body = JSON.stringify(body);
			}
		}

		debug({ URL: `${baseUrl || ''}${uri}`, ...config });
		let response, txt;
		if (finalTimeout) {
			const abortController = new AbortController();
			const signal = abortController.signal;
			//start the clock on the timeout
			const timer = setTimeout(() => {
				abortController.abort();
			}, finalTimeout);
			response = await fetch(`${baseUrl || ''}${uri}`, { signal, ...config }, ...future);
			//request completed, kill the timeout clock
			clearTimeout(timer);
			txt = await response.text();
		} else {
			response = await fetch(`${baseUrl || ''}${uri}`, config, ...future);
			txt = await response.text();
		}

		let data;
		try {
			data = JSON.parse(txt);
		} catch {
			data = txt;
		}

		//by default fetch only rejects on network errors, not if status > 299.
		//this will reject if status > 299, too.
		if (!response.ok) {
			return Promise.reject(data);
		}

		//status was ok, try to parse response as json and return that
		try {
			const data = JSON.parse(txt);
			return data;
		} catch (e) {
			//status was good but body wasn't json, so return text
			return txt;
		}
	};
};

const smartFetch = wrapFetch();

module.exports = { fetch: smartFetch, smartFetch, wrapFetch };
