const y = (t) => {
  let e;
  if (ArrayBuffer.isView(t))
    e = new DataView(t.buffer, t.byteOffset, t.byteLength);
  else if (t instanceof ArrayBuffer || t instanceof SharedArrayBuffer)
    e = new DataView(t);
  else
    throw new Error("Expected instance of TypedArray, DataView or ArrayBuffer");
  return {
    view: e,
    position: 0
  };
}, u = (t, e) => {
  const n = t.position, o = t.view;
  return t.position += e, { view: o, position: n };
}, V = (t, e) => {
  const n = t.position, o = t.view;
  return t.position = e < 0 ? o.byteLength + e : e, { view: o, position: n };
}, k = (t) => t.view.byteLength - t.position, s = (t, e, n = !1) => {
  const { view: o, position: r } = u(t, e);
  return Number(
    o[{
      1: "getUint8",
      2: "getUint16",
      4: "getUint32",
      8: "getBigUint64"
    }[e]](r, n)
  );
}, B = (t, e) => {
  const { view: n, position: o } = u(t, e);
  return n.buffer.slice(o, o + e);
}, l = "ascii", C = "utf-8", L = "utf-16be", p = "utf-16le", a = (t, e, n = C) => new TextDecoder(n).decode(B(t, e)), S = (t, e) => new Uint8Array(B(t, e)), T = (t, e) => y(B(t, e)), E = (t, e = 0) => (...n) => {
  const [{ view: o, position: r }, ...c] = n;
  return t({ view: o, position: r + e }, ...c);
}, d = (t) => t.replace(/\0+$/, ""), G = (t, e) => {
  const n = t.indexOf(e);
  return [t.substring(0, n), t.substring(n + 1)];
}, z = (t) => {
  if (k(t) < 27)
    return;
  const e = (u(t, 26), s(t, 1)), n = S(t, e);
  if (!n.length)
    return;
  const o = n.reduce((r, c) => r + c);
  return u(t, 7), { pageSize: o + 27 + e, packet: T(t, o - 7) };
}, I = (t) => {
  try {
    const e = s(t, 4, !0), n = (u(t, e), s(t, 4, !0)), o = {}, r = { tracknumber: "track" };
    for (let c = 0; c < n; c++) {
      const m = s(t, 4, !0), i = a(t, m), [f, g] = G(i, "="), h = f.toLowerCase();
      o[r[h] || h] = o[h] = d(g);
    }
    return o;
  } catch {
    return;
  }
}, Y = (t) => {
  const e = y(t);
  if (!z(e))
    return;
  const o = z(e);
  if (o)
    return I(o.packet);
}, H = (t) => (V(t, -128), a(t, 3, l) === "TAG"), Z = (t) => {
  const e = y(t);
  try {
    if (!H(e))
      return;
    const n = E(s, 122)(e, 1) === 0;
    return {
      title: d(a(e, 30, l)),
      artist: d(a(e, 30, l)),
      album: d(a(e, 30, l)),
      year: d(a(e, 4, l)),
      comment: d(a(e, n ? 28 : 30, l)),
      track: n ? s(e, 2) : void 0,
      genre: s(e, 1)
    };
  } catch {
    return;
  }
}, x = (t) => S(t, 4).reduce((e, n) => e << 7 | n & 127, 0), O = (t, e) => {
  var n;
  return a(
    t,
    e - 1,
    (n = {
      0: l,
      1: E(s)(t, 2) === 65279 ? L : p,
      2: L
    }[s(t, 1)]) != null ? n : C
  );
}, R = {
  TALB: "album",
  TCOM: "composer",
  TIT1: "title",
  TIT2: "title",
  TPE1: "artist",
  TRCK: "track",
  TSSE: "encoder",
  TDRC: "year",
  TCON: "genre"
}, N = (t) => {
  try {
    const e = a(t, 4, l), n = x(t);
    u(t, 2);
    const o = e[0] === "T" ? d(O(t, n)) : (u(t, n), void 0);
    return { id: e, content: o };
  } catch {
    return;
  }
}, _ = (t) => {
  const e = y(t);
  if (a(e, 3, l) !== "ID3")
    return;
  const n = (u(e, 2), s(e, 1)), o = x(e), r = !!(n & 128), c = {}, m = r ? x(e) : 0;
  for (u(e, m); e.position < 10 + m + o; ) {
    const i = N(e);
    if (!i)
      break;
    if (!i.content)
      continue;
    const f = R[i.id] || i.id;
    if (f === "TXXX") {
      const [g, h] = G(i.content, "\0");
      c[g] = h;
    } else
      c[f] = c[i.id] = i.content;
  }
  return c;
}, P = (t) => {
  const e = y(t);
  if (a(e, 4, l) !== "fLaC")
    return;
  let n = !1, o = {};
  for (; !n; ) {
    const r = s(e, 1), c = s(e, 2) * 2 ** 8 + s(e, 1);
    n = r > 127, (r & 127) == 4 ? o = { ...o, ...I(T(e, c)) } : u(e, c);
  }
  return o;
}, X = (t) => "G" + S(t, 16).reduce((e, n) => e + n.toString(16).padStart(2, "0").toUpperCase(), ""), D = (t) => {
  try {
    const e = X(t), n = s(t, 8, !0), o = T(t, n - 24);
    return { guid: e, size: n, data: o };
  } catch {
    return;
  }
}, j = (t) => {
  const e = s(t, 2, !0), n = s(t, 2, !0), o = s(t, 2, !0), r = s(t, 2, !0), c = s(t, 2, !0);
  return {
    title: d(a(t, e, p)),
    artist: d(a(t, n, p)),
    copyright: d(a(t, o, p)),
    comment: d(a(t, r, p)),
    rating: d(a(t, c, p))
  };
}, M = {
  "wm/albumtitle": "album"
}, K = (t) => {
  const e = {}, n = s(t, 2, !0);
  for (let o = 0; o < n; o++) {
    const r = s(t, 2, !0), c = d(a(t, r, p)).toLowerCase(), m = c.startsWith("wm/") ? c.slice(3) : c, i = M[c] || c, f = s(t, 2, !0), g = s(t, 2, !0);
    switch (f) {
      case 0:
        e[m] = e[i] = d(a(t, g, p));
        break;
      default:
        u(t, g);
    }
  }
  return e;
}, W = (t) => {
  var o;
  u(t, 22);
  let e = {}, n;
  for (; n = D(t); ) {
    const r = {
      GEACBF8C5AF5B48778467AA8C44FA4CCA: F,
      G941C23449894D149A1411D134E457054: F
    };
    e = { ...e, ...(o = r[n.guid]) == null ? void 0 : o.call(r, n.data) };
  }
  return e;
}, F = (t) => {
  const e = {}, n = s(t, 2, !0);
  for (let o = 0; o < n; o++) {
    u(t, 4);
    const r = s(t, 2, !0), c = s(t, 2, !0), m = s(t, 2, !0), i = d(a(t, r, p)).toLowerCase(), f = i.startsWith("wm/") ? i.slice(3) : i, g = M[i] || i;
    switch (c) {
      case 0:
        e[f] = e[g] = d(a(t, m, p));
        break;
      default:
        u(t, m);
    }
  }
  return e;
}, w = (t) => {
  var n;
  const e = y(t);
  try {
    const o = D(e);
    if (!o || o.guid !== "G3026B2758E66CF11A6D900AA0062CE6C")
      return;
    u(o.data, 6);
    let r, c = {};
    for (; r = D(o.data); ) {
      const m = {
        G3326B2758E66CF11A6D900AA0062CE6C: j,
        G40A4D0D207E3D21197F000A0C95EA850: K,
        GB503BF5F2EA9CF118EE300C00C205365: W
      };
      c = { ...c, ...(n = m[r.guid]) == null ? void 0 : n.call(m, r.data) };
    }
    return c;
  } catch {
    return;
  }
}, v = (t) => {
  try {
    const e = s(t, 4), n = a(t, 4, l).toLowerCase(), o = e === 1 ? s(t, 8) : e || k(t);
    return {
      size: o,
      type: n,
      data: T(t, o - (e === 1 ? 16 : 8))
    };
  } catch {
    return;
  }
}, U = function* (t) {
  let e, n = 0;
  for (; (e = v(t)) && !(n++ > 100); )
    yield e;
}, $ = {
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
}, q = (t) => {
  const e = [...U(t)].find((n) => n.type === "data");
  if (e) {
    const n = e.data, o = s(n, 4);
    u(n, 4);
    const r = {
      1: C,
      2: L,
      4: C,
      5: L
    }[o];
    return r && a(n, k(n), r);
  }
}, J = (t) => {
  let e = {};
  for (const { data: n, type: o } of U(t)) {
    const r = q(n);
    r && (e = { ...e, [o]: r, [$[o] || o]: r });
  }
  return e;
}, A = (t) => {
  var n;
  let e = {};
  for (const { type: o, data: r } of U(t))
    e = { ...e, ...(n = b[o]) == null ? void 0 : n.call(b, r) };
  return e;
}, b = {
  moov: A,
  trak: A,
  mdia: A,
  udta: A,
  meta: (t) => A(Q(t)),
  ilst: J
}, Q = (t) => {
  const e = E(a, 4)(t, 4, l), n = E(a, 16)(t, 4, l);
  return e === "hdlr" && n === "mdta" || u(t, 4), t;
}, tt = (t) => {
  const e = y(t), n = A(e);
  return Object.keys(n).length === 0 ? void 0 : n;
};
export {
  P as flac,
  Z as id3v1,
  _ as id3v2,
  tt as mp4,
  Y as ogg,
  w as wma
};
