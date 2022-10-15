const d = (e) => e.replace(/\0+$/, ""), b = (e, t) => {
  const n = e.indexOf(t);
  return [e.substring(0, n), e.substring(n + 1)];
}, l = (e) => {
  if (e instanceof Uint8Array && (e = e.buffer.slice(0)), !(e instanceof ArrayBuffer))
    throw new Error("Expected instance of Buffer or ArrayBuffer");
  return new DataView(e);
}, T = (e, t, n) => new Uint8Array(e.buffer).slice(t, t + n), h = (e) => (t, n, r) => new TextDecoder(e).decode(t.buffer.slice(n, n + r)), u = h("ascii"), v = h(), L = h("utf16be"), y = (e, t) => {
  if (e.byteLength < t + 27)
    return;
  const n = e.getUint8(t + 26), r = T(e, t + 27, n), i = 27 + n;
  if (!r.length)
    return;
  const c = i + r.reduce((a, s) => a + s), o = i + 7;
  return { pageSize: c, packet: l(T(e, t + o, c - o)) };
}, p = (e) => {
  try {
    const t = e.getUint32(0, !0), n = e.getUint32(4 + t, !0), r = {}, i = { tracknumber: "track" };
    for (let c = 0, o = 8 + t; c < n; c++) {
      const a = e.getUint32(o, !0), s = v(e, o + 4, a), [g, m] = b(s, "="), f = g.toLowerCase();
      r[i[f] || f] = r[f] = d(m), o += 4 + a;
    }
    return r;
  } catch {
    return;
  }
}, S = (e) => {
  const t = l(e), n = y(t, 0);
  if (!n)
    return;
  const r = y(t, n.pageSize);
  if (r)
    return p(r.packet);
}, k = (e) => u(e, e.byteLength - 128, 3) === "TAG", z = (e) => {
  const t = l(e);
  try {
    if (!k(t))
      return;
    const n = t.byteLength - 128, r = t.getUint8(n + 125) === 0, i = d(u(t, n + 3, 30)), c = d(u(t, n + 33, 30)), o = d(u(t, n + 63, 30)), a = d(u(t, n + 93, 4)), s = d(u(t, n + 97, r ? 28 : 30)), g = r ? t.getUint8(n + 126) : void 0, m = t.getUint8(n + 127);
    return { title: i, artist: c, album: o, year: a, comment: s, track: g, genre: m };
  } catch {
    return;
  }
}, U = (e, t) => T(e, t, 4).reduce((n, r) => n << 7 | r & 268435455, 0), x = (e) => {
  switch (e) {
    case 1:
      return (t, n, r) => t.getUint16(n) === 65279 ? L(t, n, r) : h("utf16le")(t, n, r);
    case 2:
      return h("utf16be");
    case 3:
      return v;
    case 0:
    default:
      return u;
  }
}, w = {
  TALB: "album",
  TCOM: "composer",
  TIT1: "title",
  TIT2: "title",
  TPE1: "artist",
  TRCK: "track",
  TSSE: "encoder",
  TDRC: "year",
  TCON: "genre"
}, A = (e, t) => {
  try {
    const n = u(e, t, 4), r = 10 + U(e, t + 4), i = n[0] === "T" ? d(x(e.getUint8(t + 9))(e, t + 11, r - 11)) : void 0;
    return { id: n, size: r, content: i };
  } catch {
    return;
  }
}, E = (e) => {
  const t = l(e);
  if (u(t, 0, 3) !== "ID3")
    return;
  const n = t.getUint8(5), r = U(t, 6), i = !!(n & 128), c = {}, o = i ? U(t, 10) : 0;
  for (let a = 10 + o; a < 10 + o + r; ) {
    const s = A(t, a);
    if (!s)
      break;
    if (a += s.size, !s.content)
      continue;
    const g = w[s.id] || s.id;
    if (g === "TXXX") {
      const [m, f] = b(s.content, "\0");
      c[m] = f;
    } else
      c[g] = c[s.id] = s.content;
  }
  return c;
}, C = (e) => u(e, 0, 4) === "fLaC", M = (e) => {
  const t = l(e);
  if (!C(t))
    return;
  let n = 4, r = !1, i = {};
  for (; !r; ) {
    const c = t.getUint8(n), o = t.getUint16(n + 1) * 2 ** 16 + t.getUint8(n + 3);
    r = c > 127, (c & 127) == 4 && (i = Object.assign(i, p(l(T(t, n + 4, o))))), n += 4 + o;
  }
  return i;
};
export {
  M as flac,
  z as id3v1,
  E as id3v2,
  S as ogg
};
