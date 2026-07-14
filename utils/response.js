const ok = (res, message, data = null) => res.json({ state: true, message, data });
const fail = (res, message, data = null) => res.json({ state: false, message, data });

module.exports = { ok, fail };
