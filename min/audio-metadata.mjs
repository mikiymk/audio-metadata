const m = (e) => e.replace(/\0+$/, ""), L = (e, t) => {
  const n = e.indexOf(t);
  return [e.substring(0, n), e.substring(n + 1)];
}, p = (e) => {
  if (e instanceof Uint8Array && (e = e.buffer.slice(0)), !(e instanceof ArrayBuffer))
    throw new Error("Expected instance of Buffer or ArrayBuffer");
  return new DataView(e);
}, C = (e, t, n) => new Uint8Array(e.buffer).slice(t, t + n), U = (e) => (t, n, r) => new TextDecoder(e).decode(t.buffer.slice(n, n + r)), d = U("ascii"), T = U(), B = U("utf-16be"), l = U("utf-16le"), y = (e, t) => {
  if (e.byteLength < t + 27)
    return;
  const n = e.getUint8(t + 26), r = C(e, t + 27, n), c = 27 + n;
  if (!r.length)
    return;
  const a = c + r.reduce((o, s) => o + s), i = c + 7;
  return { pageSize: a, packet: p(C(e, t + i, a - i)) };
}, E = (e) => {
  try {
    const t = e.getUint32(0, !0), n = e.getUint32(4 + t, !0), r = {}, c = { tracknumber: "track" };
    for (let a = 0, i = 8 + t; a < n; a++) {
      const o = e.getUint32(i, !0), s = T(e, i + 4, o), [u, g] = L(s, "="), h = u.toLowerCase();
      r[c[h] || h] = r[h] = m(g), i += 4 + o;
    }
    return r;
  } catch {
    return;
  }
}, H = (e) => {
  const t = p(e), n = y(t, 0);
  if (!n)
    return;
  const r = y(t, n.pageSize);
  if (r)
    return E(r.packet);
}, D = (e) => d(e, e.byteLength - 128, 3) === "TAG", I = (e) => {
  const t = p(e);
  try {
    if (!D(t))
      return;
    const n = t.byteLength - 128, r = t.getUint8(n + 125) === 0, c = m(d(t, n + 3, 30)), a = m(d(t, n + 33, 30)), i = m(d(t, n + 63, 30)), o = m(d(t, n + 93, 4)), s = m(d(t, n + 97, r ? 28 : 30)), u = r ? t.getUint8(n + 126) : void 0, g = t.getUint8(n + 127);
    return { title: c, artist: a, album: i, year: o, comment: s, track: u, genre: g };
  } catch {
    return;
  }
}, b = (e, t) => C(e, t, 4).reduce((n, r) => n << 7 | r & 268435455, 0), S = (e) => {
  switch (e) {
    case 1:
      return (t, n, r) => t.getUint16(n) === 65279 ? B(t, n, r) : U("utf16le")(t, n, r);
    case 2:
      return U("utf16be");
    case 3:
      return T;
    case 0:
    default:
      return d;
  }
}, x = {
  TALB: "album",
  TCOM: "composer",
  TIT1: "title",
  TIT2: "title",
  TPE1: "artist",
  TRCK: "track",
  TSSE: "encoder",
  TDRC: "year",
  TCON: "genre"
}, F = (e, t) => {
  try {
    const n = d(e, t, 4), r = 10 + b(e, t + 4), c = n[0] === "T" ? m(S(e.getUint8(t + 9))(e, t + 11, r - 11)) : void 0;
    return { id: n, size: r, content: c };
  } catch {
    return;
  }
}, N = (e) => {
  const t = p(e);
  if (d(t, 0, 3) !== "ID3")
    return;
  const n = t.getUint8(5), r = b(t, 6), c = !!(n & 128), a = {}, i = c ? b(t, 10) : 0;
  for (let o = 10 + i; o < 10 + i + r; ) {
    const s = F(t, o);
    if (!s)
      break;
    if (o += s.size, !s.content)
      continue;
    const u = x[s.id] || s.id;
    if (u === "TXXX") {
      const [g, h] = L(s.content, "\0");
      a[g] = h;
    } else
      a[u] = a[s.id] = s.content;
  }
  return a;
}, $ = (e) => d(e, 0, 4) === "fLaC", P = (e) => {
  const t = p(e);
  if (!$(t))
    return;
  let n = 4, r = !1, c = {};
  for (; !r; ) {
    const a = t.getUint8(n), i = t.getUint16(n + 1) * 2 ** 16 + t.getUint8(n + 3);
    r = a > 127, (a & 127) == 4 && (c = Object.assign(c, E(p(C(t, n + 4, i))))), n += 4 + i;
  }
  return c;
}, A = (e, t) => {
  let n = "";
  for (let r = 0; r < 2; r++)
    n += e.getBigUint64(t + r * 8).toString(16).padStart(16, "0").toUpperCase();
  return n;
}, z = (e, t) => {
  const n = e.getUint16(t, !0), r = e.getUint16(t + 2, !0), c = e.getUint16(t + 4, !0), a = e.getUint16(t + 6, !0), i = e.getUint16(t + 8, !0);
  return {
    title: l(e, t += 10, n).replace(/\0$/, ""),
    artist: l(e, t += n, r).replace(/\0$/, ""),
    copyright: l(e, t += r, c).replace(/\0$/, ""),
    comment: l(e, t += c, a).replace(/\0$/, ""),
    rating: l(e, t += a, i).replace(/\0$/, "")
  };
}, k = {
  "wm/albumtitle": "album"
}, M = (e, t) => {
  const n = {}, r = e.getUint16(t, !0);
  t += 2;
  for (let c = 0; c < r; c++) {
    const a = e.getUint16(t, !0), i = l(e, t += 2, a).replace(/\0$/, "").toLowerCase(), o = i.startsWith("wm/") ? i.slice(3) : i, s = k[i] || i, u = e.getUint16(t += a, !0), g = e.getUint16(t += 2, !0);
    switch (u) {
      case 0:
        n[o] = n[s] = l(e, t += 2, g).replace(/\0$/, "");
        break;
    }
    t += g;
  }
  return n;
}, O = (e, t) => {
  const n = e.getUint32(t + 18), r = {};
  for (t += 22; t < n; ) {
    switch (A(e, t)) {
      case "EACBF8C5AF5B48778467AA8C44FA4CCA":
      case "941C23449894D149A1411D134E457054":
        Object.assign(r, j(e, t + 24));
        break;
    }
    t += Number(e.getBigUint64(t + 16, !0));
  }
  return r;
}, j = (e, t) => {
  const n = {}, r = e.getUint16(t, !0);
  t += 2;
  for (let c = 0; c < r; c++) {
    t += 4;
    const a = e.getUint16(t, !0), i = e.getUint16(t += 2, !0), o = e.getUint16(t += 2, !0), s = l(e, t += 2, a).replace(/\0$/, "").toLowerCase(), u = s.startsWith("wm/") ? s.slice(3) : s, g = k[s] || s;
    switch (i) {
      case 0:
        n[u] = n[g] = l(e, t += a, o).replace(/\0$/, "");
        break;
    }
    t += o;
  }
  return n;
}, X = (e) => {
  const t = p(e);
  if (A(t, 0) === "3026B2758E66CF11A6D900AA0062CE6C")
    try {
      const n = t.getBigUint64(16, !0), r = {};
      let c = 30;
      for (; c < n; ) {
        switch (A(t, c)) {
          case "3326B2758E66CF11A6D900AA0062CE6C":
            Object.assign(r, z(t, c + 24));
            break;
          case "40A4D0D207E3D21197F000A0C95EA850":
            Object.assign(r, M(t, c + 24));
            break;
          case "B503BF5F2EA9CF118EE300C00C205365":
            Object.assign(r, O(t, c + 24));
            break;
          default:
        }
        c += Number(t.getBigUint64(c + 16, !0));
      }
      return r;
    } catch {
      return;
    }
};
export {
  P as flac,
  I as id3v1,
  N as id3v2,
  H as ogg,
  X as wma
};
