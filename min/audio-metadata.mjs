const u = (t) => t.replace(/\0+$/, ""), b = (t, e) => {
  const n = t.indexOf(e);
  return [t.substring(0, n), t.substring(n + 1)];
}, f = (t) => {
  if (t instanceof Uint8Array && (t = t.buffer.slice(0)), !(t instanceof ArrayBuffer))
    throw new Error("Expected instance of Buffer or ArrayBuffer");
  return new DataView(t);
}, h = (t, e, n) => new Uint8Array(t.buffer).slice(e, e + n), T = (t) => (e, n, r) => new TextDecoder(t).decode(e.buffer.slice(n, n + r)), d = T("ascii"), p = T(), v = T("utf16be"), U = (t, e) => {
  if (t.byteLength < e + 27)
    return;
  const n = t.getUint8(e + 26), r = h(t, e + 27, n), s = 27 + n;
  if (!r.length)
    return;
  const i = s + r.reduce((a, c) => a + c), o = s + 7;
  return { pageSize: i, packet: f(h(t, e + o, i - o)) };
}, L = (t) => {
  try {
    const e = t.getUint32(0, !0), n = t.getUint32(4 + e, !0), r = {}, s = { tracknumber: "track" };
    for (let i = 0, o = 8 + e; i < n; i++) {
      const a = t.getUint32(o, !0), c = p(t, o + 4, a), [g, m] = b(c, "="), l = g.toLowerCase();
      r[s[l] || l] = r[l] = u(m), o += 4 + a;
    }
    return r;
  } catch {
    return;
  }
}, z = (t) => {
  const e = f(t), n = U(e, 0);
  if (!n)
    return;
  const r = U(e, n.pageSize);
  if (r)
    return L(r.packet);
}, k = (t) => d(t, t.byteLength - 128, 3) === "TAG", C = (t) => {
  const e = f(t);
  try {
    if (!k(e))
      return;
    const n = e.byteLength - 128, r = e.getUint8(n + 125) === 0, s = u(d(e, n + 3, 30)), i = u(d(e, n + 33, 30)), o = u(d(e, n + 63, 30)), a = u(d(e, n + 93, 4)), c = u(d(e, n + 97, r ? 28 : 30)), g = r ? e.getUint8(n + 126) : void 0, m = e.getUint8(n + 127);
    return { title: s, artist: i, album: o, year: a, comment: c, track: g, genre: m };
  } catch {
    return;
  }
}, y = (t, e) => h(t, e, 4).reduce((n, r) => n << 7 | r & 268435455, 0), x = (t) => {
  switch (t) {
    case 1:
      return (e, n, r) => e.getUint16(n) === 65279 ? v(e, n, r) : T("utf16le")(e, n, r);
    case 2:
      return T("utf16be");
    case 3:
      return p;
    case 0:
    default:
      return d;
  }
}, A = {
  TALB: "album",
  TCOM: "composer",
  TIT1: "title",
  TIT2: "title",
  TPE1: "artist",
  TRCK: "track",
  TSSE: "encoder",
  TDRC: "year",
  TCON: "genre"
}, S = (t, e) => {
  try {
    const n = d(t, e, 4), r = 10 + y(t, e + 4), s = n[0] === "T" ? u(x(t.getUint8(e + 9))(t, e + 11, r - 11)) : void 0;
    return { id: n, size: r, content: s };
  } catch {
    return;
  }
}, w = (t) => {
  const e = f(t);
  if (d(e, 0, 3) !== "ID3")
    return;
  const n = e.getUint8(5), r = y(e, 6), s = !!(n & 128), i = {}, o = s ? y(e, 10) : 0;
  for (let a = 10 + o; a < 10 + o + r; ) {
    const c = S(e, a);
    if (!c)
      break;
    if (a += c.size, !c.content)
      continue;
    const g = A[c.id] || c.id;
    if (g === "TXXX") {
      const [m, l] = b(c.content, "\0");
      i[m] = l;
    } else
      i[g] = i[c.id] = c.content;
  }
  return i;
};
export {
  C as id3v1,
  w as id3v2,
  z as ogg
};
