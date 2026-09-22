const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Keeps requests under a per-second and per-minute cap.
function createLimiter({ perSecond, perMinute }) {
  const sent = [];
  let queue = Promise.resolve();

  const waitTurn = async () => {
    for (;;) {
      const now = Date.now();
      while (sent.length && now - sent[0] > 60000) sent.shift();
      const lastSecond = sent.filter((t) => now - t < 1000).length;
      if (lastSecond < perSecond && (!perMinute || sent.length < perMinute)) {
        sent.push(now);
        return;
      }
      const waitForMinute = perMinute && sent.length >= perMinute ? 60000 - (now - sent[0]) : 0;
      await sleep(Math.max(waitForMinute, 1000 / perSecond));
    }
  };

  return () => {
    queue = queue.then(waitTurn);
    return queue;
  };
}

function createClient({ baseUrl, perSecond, perMinute, retries = 4, headers = {} }) {
  const limit = createLimiter({ perSecond, perMinute });

  return async function getJson(pathAndQuery) {
    const url = `${baseUrl}${pathAndQuery}`;
    for (let attempt = 0; ; attempt++) {
      await limit();
      let res;
      try {
        res = await fetch(url, { headers: { Accept: 'application/json', ...headers } });
      } catch (err) {
        if (attempt >= retries) throw err;
        await sleep(1000 * 2 ** attempt);
        continue;
      }
      if (res.ok) return res.json();
      if ((res.status === 429 || res.status >= 500) && attempt < retries) {
        const retryAfter = Number(res.headers.get('retry-after'));
        await sleep(retryAfter ? retryAfter * 1000 : 1000 * 2 ** (attempt + 1));
        continue;
      }
      const err = new Error(`GET ${url} failed with ${res.status}`);
      err.status = res.status;
      throw err;
    }
  };
}

module.exports = { createClient, sleep };
