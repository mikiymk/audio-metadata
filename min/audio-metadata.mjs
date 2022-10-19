const p = (e) => e.replace(/\0+$/, ""), E = (e, t) => {
  const n = e.indexOf(t);
  return [e.substring(0, n), e.substring(n + 1)];
}, l = (e) => {
  if (e instanceof Uint8Array && (e = e.buffer.slice(0)), !(e instanceof ArrayBuffer))
    throw new Error("Expected instance of Buffer or ArrayBuffer");
  return new DataView(e);
}, b = (e, t, n) => new Uint8Array(e.buffer).slice(t, t + n), h = (e) => (t, n, r) => new TextDecoder(e).decode(t.buffer.slice(n, n + r)), u = h("ascii"), L = h(), B = h("utf-16be"), m = h("utf-16le"), T = (e, t) => {
  if (e.byteLength < t + 27)
    return;
  const n = e.getUint8(t + 26), r = b(e, t + 27, n), c = 27 + n;
  if (!r.length)
    return;
  const a = c + r.reduce((o, i) => o + i), s = c + 7;
  return { pageSize: a, packet: l(b(e, t + s, a - s)) };
}, S = (e) => {
  try {
    const t = e.getUint32(0, !0), n = e.getUint32(4 + t, !0), r = {}, c = { tracknumber: "track" };
    for (let a = 0, s = 8 + t; a < n; a++) {
      const o = e.getUint32(s, !0), i = L(e, s + 4, o), [g, d] = E(i, "="), U = g.toLowerCase();
      r[c[U] || U] = r[U] = p(d), s += 4 + o;
    }
    return r;
  } catch {
    return;
  }
}, V = (e) => {
  const t = l(e), n = T(t, 0);
  if (!n)
    return;
  const r = T(t, n.pageSize);
  if (r)
    return S(r.packet);
}, O = (e) => u(e, e.byteLength - 128, 3) === "TAG", W = (e) => {
  const t = l(e);
  try {
    if (!O(t))
      return;
    const n = t.byteLength - 128, r = t.getUint8(n + 125) === 0, c = p(u(t, n + 3, 30)), a = p(u(t, n + 33, 30)), s = p(u(t, n + 63, 30)), o = p(u(t, n + 93, 4)), i = p(u(t, n + 97, r ? 28 : 30)), g = r ? t.getUint8(n + 126) : void 0, d = t.getUint8(n + 127);
    return { title: c, artist: a, album: s, year: o, comment: i, track: g, genre: d };
  } catch {
    return;
  }
}, y = (e, t) => b(e, t, 4).reduce((n, r) => n << 7 | r & 268435455, 0), z = (e) => {
  switch (e) {
    case 1:
      return (t, n, r) => t.getUint16(n) === 65279 ? B(t, n, r) : h("utf16le")(t, n, r);
    case 2:
      return h("utf16be");
    case 3:
      return L;
    case 0:
    default:
      return u;
  }
}, F = {
  TALB: "album",
  TCOM: "composer",
  TIT1: "title",
  TIT2: "title",
  TPE1: "artist",
  TRCK: "track",
  TSSE: "encoder",
  TDRC: "year",
  TCON: "genre"
}, j = (e, t) => {
  try {
    const n = u(e, t, 4), r = 10 + y(e, t + 4), c = n[0] === "T" ? p(z(e.getUint8(t + 9))(e, t + 11, r - 11)) : void 0;
    return { id: n, size: r, content: c };
  } catch {
    return;
  }
}, G = (e) => {
  const t = l(e);
  if (u(t, 0, 3) !== "ID3")
    return;
  const n = t.getUint8(5), r = y(t, 6), c = !!(n & 128), a = {}, s = c ? y(t, 10) : 0;
  for (let o = 10 + s; o < 10 + s + r; ) {
    const i = j(t, o);
    if (!i)
      break;
    if (o += i.size, !i.content)
      continue;
    const g = F[i.id] || i.id;
    if (g === "TXXX") {
      const [d, U] = E(i.content, "\0");
      a[d] = U;
    } else
      a[g] = a[i.id] = i.content;
  }
  return a;
}, $ = (e) => u(e, 0, 4) === "fLaC", q = (e) => {
  const t = l(e);
  if (!$(t))
    return;
  let n = 4, r = !1, c = {};
  for (; !r; ) {
    const a = t.getUint8(n), s = t.getUint16(n + 1) * 2 ** 16 + t.getUint8(n + 3);
    r = a > 127, (a & 127) == 4 && (c = Object.assign(c, S(l(b(t, n + 4, s))))), n += 4 + s;
  }
  return c;
}, A = (e, t) => {
  let n = "";
  for (let r = 0; r < 2; r++)
    n += e.getBigUint64(t + r * 8).toString(16).padStart(16, "0").toUpperCase();
  return n;
}, M = (e, t) => {
  const n = e.getUint16(t, !0), r = e.getUint16(t + 2, !0), c = e.getUint16(t + 4, !0), a = e.getUint16(t + 6, !0), s = e.getUint16(t + 8, !0);
  return {
    title: m(e, t += 10, n).replace(/\0$/, ""),
    artist: m(e, t += n, r).replace(/\0$/, ""),
    copyright: m(e, t += r, c).replace(/\0$/, ""),
    comment: m(e, t += c, a).replace(/\0$/, ""),
    rating: m(e, t += a, s).replace(/\0$/, "")
  };
}, D = {
  "wm/albumtitle": "album"
}, I = (e, t) => {
  const n = {}, r = e.getUint16(t, !0);
  t += 2;
  for (let c = 0; c < r; c++) {
    const a = e.getUint16(t, !0), s = m(e, t += 2, a).replace(/\0$/, "").toLowerCase(), o = s.startsWith("wm/") ? s.slice(3) : s, i = D[s] || s, g = e.getUint16(t += a, !0), d = e.getUint16(t += 2, !0);
    switch (g) {
      case 0:
        n[o] = n[i] = m(e, t += 2, d).replace(/\0$/, "");
        break;
    }
    t += d;
  }
  return n;
}, H = (e, t) => {
  const n = e.getUint32(t + 18), r = {};
  for (t += 22; t < n; ) {
    switch (A(e, t)) {
      case "EACBF8C5AF5B48778467AA8C44FA4CCA":
      case "941C23449894D149A1411D134E457054":
        Object.assign(r, N(e, t + 24));
        break;
    }
    t += Number(e.getBigUint64(t + 16, !0));
  }
  return r;
}, N = (e, t) => {
  const n = {}, r = e.getUint16(t, !0);
  t += 2;
  for (let c = 0; c < r; c++) {
    t += 4;
    const a = e.getUint16(t, !0), s = e.getUint16(t += 2, !0), o = e.getUint16(t += 2, !0), i = m(e, t += 2, a).replace(/\0$/, "").toLowerCase(), g = i.startsWith("wm/") ? i.slice(3) : i, d = D[i] || i;
    switch (s) {
      case 0:
        n[g] = n[d] = m(e, t += a, o).replace(/\0$/, "");
        break;
    }
    t += o;
  }
  return n;
}, J = (e) => {
  const t = l(e);
  if (A(t, 0) === "3026B2758E66CF11A6D900AA0062CE6C")
    try {
      const n = t.getBigUint64(16, !0), r = {};
      let c = 30;
      for (; c < n; ) {
        switch (A(t, c)) {
          case "3326B2758E66CF11A6D900AA0062CE6C":
            Object.assign(r, M(t, c + 24));
            break;
          case "40A4D0D207E3D21197F000A0C95EA850":
            Object.assign(r, I(t, c + 24));
            break;
          case "B503BF5F2EA9CF118EE300C00C205365":
            Object.assign(r, H(t, c + 24));
            break;
          default:
        }
        c += Number(t.getBigUint64(c + 16, !0));
      }
      return r;
    } catch {
      return;
    }
}, P = (e, t) => {
  try {
    const n = e.getUint32(t), r = n === 1 ? Number(e.getBigUint64(t + 8)) : n || e.byteLength - t, c = n === 1 ? 16 : 8;
    return {
      size: r,
      type: u(e, t + 4, 4).toLowerCase(),
      data: l(b(e, t + c, r - c))
    };
  } catch {
    return;
  }
}, k = function* (e) {
  var c;
  let t, n = 0, r = 0;
  for (; (t = P(e, n += (c = t == null ? void 0 : t.size) != null ? c : 0)) && !(r++ > 100); )
    yield t;
}, X = {
  "\xA9alb": "album",
  "\xA9wrt": "composer",
  "\xA9nam": "title",
  "\xA9art": "artist",
  aart: "albumartist",
  "\xA9cmt": "comment",
  trkn: "track",
  "\xA9too": "encoder",
  "\xA9day": "year",
  "\xA9gen": "genre",
  gnre: "genre"
}, x = (e) => {
  const t = [...k(e)].find((n) => n.type === "data");
  if (t)
    switch (t.data.getUint32(0)) {
      case 1:
      case 4:
        return L(t.data, 8, t.data.byteLength - 8);
      case 2:
      case 5:
        return B(t.data, 8, t.data.byteLength - 8);
    }
}, K = (e) => {
  const t = {};
  for (const n of k(e))
    Object.assign(t, {
      [n.type]: x(n.data),
      [X[n.type] || n.type]: x(n.data)
    });
  return t;
}, C = (e) => {
  const t = {};
  for (const n of k(e))
    switch (n.type) {
      case "moov":
      case "trak":
      case "mdia":
      case "udta":
        Object.assign(t, C(n.data));
        break;
      case "meta":
        Object.assign(t, C(R(n.data)));
        break;
      case "ilst":
        Object.assign(t, K(n.data));
        break;
    }
  return t;
}, R = (e) => {
  const t = u(e, 4, 4), n = u(e, 16, 4);
  return t === "hdlr" && n === "mdta" ? e : l(b(e, 4, e.byteLength - 4));
}, Q = (e) => {
  const t = l(e), n = C(t);
  return Object.keys(n).length === 0 ? void 0 : n;
};
export {
  q as flac,
  W as id3v1,
  G as id3v2,
  Q as mp4,
  V as ogg,
  J as wma
};
