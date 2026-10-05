// Minimal Nhost (Hasura GraphQL) client: plain fetch for queries/mutations,
// graphql-ws protocol for live subscriptions, automatic fallback to polling.
(function () {
  const cfg = window.APP_CONFIG;

  async function gql(query, variables = {}, headers = {}) {
    const res = await fetch(cfg.graphqlUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({ query, variables })
    });
    if (!res.ok) throw new Error("Server answered with status " + res.status);
    const json = await res.json();
    if (json.errors && json.errors.length) {
      const err = new Error(json.errors[0].message);
      err.errors = json.errors;
      throw err;
    }
    return json.data;
  }

  // live(query, variables, headers, onData, onStatus) -> stop()
  // onStatus receives "live" | "reconnecting" | "polling" | "error"
  function live(query, variables, headers, onData, onStatus = () => {}) {
    let stopped = false, ws = null, pollTimer = null, failedAttempts = 0;
    const pollQuery = query.replace(/^\s*subscription/, "query");

    function startPolling() {
      onStatus("polling");
      const tick = async () => {
        if (stopped) return;
        try { onData(await gql(pollQuery, variables, headers)); }
        catch (e) { onStatus("error", e); }
        pollTimer = setTimeout(tick, cfg.pollIntervalMs || 2000);
      };
      tick();
    }

    function connect() {
      if (stopped) return;
      let acked = false;
      try {
        ws = new WebSocket(cfg.graphqlUrl.replace(/^http/, "ws"), "graphql-transport-ws");
      } catch (e) { return startPolling(); }

      const ackTimer = setTimeout(() => { if (!acked) try { ws.close(); } catch (e) {} }, 6000);

      ws.onopen = () => ws.send(JSON.stringify({ type: "connection_init", payload: { headers } }));
      ws.onmessage = (ev) => {
        const msg = JSON.parse(ev.data);
        if (msg.type === "connection_ack") {
          acked = true; failedAttempts = 0; clearTimeout(ackTimer);
          onStatus("live");
          ws.send(JSON.stringify({ id: "1", type: "subscribe", payload: { query, variables } }));
        } else if (msg.type === "next") {
          if (msg.payload.errors) onStatus("error", new Error(msg.payload.errors[0].message));
          else onData(msg.payload.data);
        } else if (msg.type === "ping") {
          ws.send(JSON.stringify({ type: "pong" }));
        } else if (msg.type === "error") {
          onStatus("error", new Error(JSON.stringify(msg.payload)));
        }
      };
      ws.onclose = () => {
        clearTimeout(ackTimer);
        if (stopped) return;
        failedAttempts++;
        // Never got a working connection twice in a row: use polling instead.
        if (!acked && failedAttempts >= 2) return startPolling();
        onStatus("reconnecting");
        setTimeout(connect, Math.min(1000 * failedAttempts, 8000));
      };
    }

    connect();
    return function stop() {
      stopped = true;
      clearTimeout(pollTimer);
      if (ws) {
        try { if (ws.readyState === 1) ws.send(JSON.stringify({ id: "1", type: "complete" })); } catch (e) {}
        try { ws.close(); } catch (e) {}
      }
    };
  }

  // Random UUID v4, with a fallback for older browsers.
  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    const b = crypto.getRandomValues(new Uint8Array(16));
    b[6] = (b[6] & 0x0f) | 0x40;
    b[8] = (b[8] & 0x3f) | 0x80;
    const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
  }

  function isConfigured() {
    return cfg.graphqlUrl && !cfg.graphqlUrl.includes("YOUR-SUBDOMAIN");
  }

  window.Nhost = { gql, live, uuid, isConfigured };
})();
