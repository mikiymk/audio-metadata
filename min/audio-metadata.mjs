const T = (t) => {
  let e;
  if (ArrayBuffer.isView(t))
    e = new DataView(t.buffer, t.byteOffset, t.byteLength);
  else if (t instanceof ArrayBuffer || t instanceof SharedArrayBuffer)
    e = new DataView(t);
  else
    throw new Error("Expected instance of TypedArray, DataView or ArrayBuffer");
  return [e, 0];
}, X = (t) => {
  const [e, n] = t;
  t[1] = n < 0 ? e.byteLength + n : n;
}, u = (t, e) => {
  const [n, r] = t;
  return t[1] += e, X(t), [n, r];
}, S = ([t, e]) => t.byteLength - e, s = (t, e, n = !1) => {
  const [r, c] = u(t, e);
  return Number(
    r[{
      1: "getUint8",
      2: "getUint16",
      4: "getUint32",
      8: "getBigUint64"
    }[e]](c, n)
  );
}, x = (t, e) => {
  const [n, r] = u(t, e);
  return n.buffer.slice(r, r + e);
}, a = "ascii", y = "utf-8", k = "utf-16be", p = "utf-16le", o = (t, e, n = y) => new TextDecoder(n).decode(x(t, e)), D = (t, e) => new Uint8Array(x(t, e)), C = (t, e) => T(x(t, e)), g = (t, e = 0) => (...n) => {
  const [[r, c], ...i] = n;
  return t([r, c + e], ...i);
}, b = (t, e, n, r) => {
  e[n] && (t[e[n]] = r), t[n] = r;
}, m = (t) => t.replace(/\0+$/, ""), v = (t, e) => {
  const n = t.indexOf(e);
  return [t.substring(0, n), t.substring(n + 1)];
}, R = (t) => {
  if (S(t) < 27)
    return;
  const e = (u(t, 26), s(t, 1)), n = D(t, e);
  if (!n.length)
    return;
  const r = n.reduce((c, i) => c + i);
  return u(t, 7), { pageSize: r + 27 + e, packet: C(t, r - 7) };
}, U = (t) => {
  try {
    const e = s(t, 4, !0), n = (u(t, e), s(t, 4, !0)), r = {}, c = { tracknumber: "track" };
    for (let i = 0; i < n; i++) {
      const d = s(t, 4, !0), l = o(t, d), [f, h] = v(l, "=");
      b(r, c, f.toLowerCase(), m(h));
    }
    return r;
  } catch {
    return;
  }
}, st = (t) => {
  const e = T(t);
  if (!R(e))
    return;
  const r = R(e);
  if (r)
    return U(r.packet);
}, G = (t) => g(o, -128)(t, 3, a) === "TAG", O = (t) => g(o, -128)(t, 3, a) === "EXT", P = (t) => g(o, -128)(t, 4, a) === "TAG+", at = (t) => {
  var n, r, c, i;
  const e = T(t);
  try {
    if (!G(e))
      return;
    u(e, -128);
    let d = {}, l = {};
    O(e) && (u(e, -125), d = {
      ttl: o(e, 30, a),
      ast: o(e, 30, a),
      alb: o(e, 30, a),
      com: o(e, 15, a)
    }, l = {
      subgenre: m(o(e, 20, a))
    }), P(e) && (u(e, -223), d = {
      ttl: o(e, 60, a),
      ast: o(e, 60, a),
      alb: o(e, 60, a)
    }, l = {
      speed: s(e, 1),
      subgenre: m(o(e, 30, a)),
      startTime: m(o(e, 6, a)),
      endTime: m(o(e, 6, a))
    }), u(e, 3);
    const f = g(s, 122)(e, 1) === 0;
    return {
      title: m(o(e, 30, a) + ((n = d.ttl) != null ? n : "")),
      artist: m(o(e, 30, a) + ((r = d.ast) != null ? r : "")),
      album: m(o(e, 30, a) + ((c = d.alb) != null ? c : "")),
      year: m(o(e, 4, a)),
      comment: m(o(e, f ? 28 : 30, a) + ((i = d.com) != null ? i : "")),
      track: f ? s(e, 2) : void 0,
      genre: s(e, 1),
      ...l
    };
  } catch {
    return;
  }
}, L = (t) => D(t, 4).reduce((e, n) => e << 7 | n & 127, 0), K = (t, e) => {
  var n;
  return o(
    t,
    e - 1,
    (n = {
      0: a,
      1: g(s, 1)(t, 2) === 65279 ? k : p,
      2: k
    }[s(t, 1)]) != null ? n : y
  );
}, j = {
  TT1: "title",
  TT2: "title",
  TIT1: "title",
  TIT2: "title",
  TAL: "album",
  TALB: "album",
  TP1: "artist",
  TPE1: "artist",
  TP2: "albumartist",
  TPE2: "albumartist",
  TCM: "composer",
  TCOM: "composer",
  TRK: "track",
  TRCK: "track",
  TPS: "disc",
  TPOS: "disc",
  TYE: "year",
  TYER: "year",
  TDRC: "year",
  TSS: "encoder",
  TSSE: "encoder",
  TCO: "genre",
  TCON: "genre",
  COM: "comment",
  COMM: "comment"
}, W = (t) => {
  try {
    const e = o(t, 4, a), n = L(t);
    u(t, 2);
    const r = e[0] === "T" ? m(K(t, n)) : (u(t, n), void 0);
    return { id: e, content: r };
  } catch {
    return;
  }
}, V = (t) => {
  const e = T(t);
  if (o(e, 3, a) !== "ID3")
    return;
  const n = (u(e, 2), s(e, 1)), r = L(e), c = !!(n & 128), i = {}, d = c ? L(e) : 0;
  for (u(e, d); e[1] < 10 + d + r; ) {
    const l = W(e);
    if (!l)
      break;
    if (!!l.content)
      if (l.id === "TXXX") {
        const [f, h] = v(l.content, "\0");
        i[f] = h;
      } else
        b(i, j, l.id, l.content);
  }
  return i;
}, it = (t) => {
  const e = T(t);
  if (o(e, 4, a) !== "fLaC")
    return;
  let n = !1, r = {};
  for (; !n; ) {
    const c = s(e, 1), i = s(e, 2) * 2 ** 8 + s(e, 1);
    n = c > 127, (c & 127) == 4 ? r = { ...r, ...U(C(e, i)) } : u(e, i);
  }
  return r;
}, Y = (t) => "G" + D(t, 16).reduce((e, n) => e + n.toString(16).padStart(2, "0").toUpperCase(), ""), I = (t) => {
  try {
    const e = Y(t), n = s(t, 8, !0), r = C(t, n - 24);
    return { guid: e, size: n, data: r };
  } catch {
    return;
  }
}, $ = (t) => {
  const e = s(t, 2, !0), n = s(t, 2, !0), r = s(t, 2, !0), c = s(t, 2, !0), i = s(t, 2, !0);
  return {
    title: m(o(t, e, p)),
    artist: m(o(t, n, p)),
    copyright: m(o(t, r, p)),
    comment: m(o(t, c, p)),
    rating: m(o(t, i, p))
  };
}, q = {
  albumtitle: "album",
  tracknumber: "track",
  partofset: "disc",
  toolname: "encoder",
  comments: "comment"
}, N = (t, e, n, r) => {
  switch (n = m(n).toLowerCase(), n = n.startsWith("wm/") ? n.slice(3) : n, e) {
    case 0:
      b(t, q, n, m(r));
      break;
  }
}, J = (t) => {
  const e = {}, n = s(t, 2, !0);
  for (let r = 0; r < n; r++) {
    const c = s(t, 2, !0), i = o(t, c, p), d = s(t, 2, !0), l = s(t, 2, !0), f = o(t, l, p);
    N(e, d, i, f);
  }
  return e;
}, Q = (t) => {
  var r;
  u(t, 22);
  let e = {}, n;
  for (; n = I(t); ) {
    const c = {
      GEACBF8C5AF5B48778467AA8C44FA4CCA: z,
      G941C23449894D149A1411D134E457054: z
    };
    e = { ...e, ...(r = c[n.guid]) == null ? void 0 : r.call(c, n.data) };
  }
  return e;
}, z = (t) => {
  const e = {}, n = s(t, 2, !0);
  for (let r = 0; r < n; r++) {
    u(t, 4);
    const c = s(t, 2, !0), i = s(t, 2, !0), d = s(t, 2, !0), l = o(t, c, p), f = o(t, d, p);
    N(e, i, l, f);
  }
  return e;
}, ut = (t) => {
  var n;
  const e = T(t);
  try {
    const r = I(e);
    if (!r || r.guid !== "G3026B2758E66CF11A6D900AA0062CE6C")
      return;
    u(r.data, 6);
    let c, i = {};
    for (; c = I(r.data); ) {
      const d = {
        G3326B2758E66CF11A6D900AA0062CE6C: $,
        G40A4D0D207E3D21197F000A0C95EA850: J,
        GB503BF5F2EA9CF118EE300C00C205365: Q
      };
      i = { ...i, ...(n = d[c.guid]) == null ? void 0 : n.call(d, c.data) };
    }
    return i;
  } catch {
    return;
  }
}, Z = (t) => {
  try {
    const e = s(t, 4), n = o(t, 4, a), r = e === 1 ? s(t, 8) : e || S(t);
    return {
      size: r,
      type: n,
      data: C(t, r - (e === 1 ? 16 : 8))
    };
  } catch {
    return;
  }
}, M = function* (t) {
  let e, n = 0;
  for (; (e = Z(t)) && !(n++ > 100); )
    yield e;
}, _ = {
  "\xA9nam": "title",
  "\xA9alb": "album",
  "\xA9ART": "artist",
  aART: "albumartist",
  "\xA9wrt": "composer",
  "\xA9com": "composer",
  trkn: "track",
  disk: "disc",
  "\xA9day": "year",
  "\xA9too": "encoder",
  "\xA9gen": "genre",
  gnre: "genre",
  "\xA9cmt": "comment"
}, w = (t) => {
  const e = [...M(t)].find((n) => n.type === "data");
  if (e) {
    const n = e.data, r = s(n, 4);
    u(n, 4);
    const c = {
      1: y,
      2: k,
      4: y,
      5: k
    }[r];
    return c && o(n, S(n), c);
  }
}, tt = (t) => {
  const e = {};
  for (const { data: n, type: r } of M(t)) {
    const c = w(n);
    c && b(e, _, r, c);
  }
  return e;
}, A = (t) => {
  var n;
  let e = {};
  for (const { type: r, data: c } of M(t))
    e = { ...e, ...(n = E[r]) == null ? void 0 : n.call(E, c) };
  return e;
}, E = {
  moov: A,
  trak: A,
  mdia: A,
  udta: A,
  meta: (t) => A(et(t)),
  ilst: tt
}, et = (t) => {
  const e = g(o, 4)(t, 4, a), n = g(o, 16)(t, 4, a);
  return e === "hdlr" && n === "mdta" || u(t, 4), t;
}, dt = (t) => {
  const e = T(t), n = A(e);
  return Object.keys(n).length === 0 ? void 0 : n;
}, nt = (t) => g(o, -32)(t, 8, a) === "APETAGEX", rt = {
  "album artist": "albumartist"
}, lt = (t) => {
  const e = T(t);
  try {
    if (G(e) && u(e, -128), O(e) && u(e, -128), P(e) && u(e, -227), !nt(e))
      return;
    const n = g(s, -20)(e, 4, !0), r = g(s, -16)(e, 4, !0), c = {};
    u(e, -n);
    for (let i = 0; i < r; i++) {
      const d = s(e, 4, !0);
      u(e, 4);
      let l = "";
      for (; ; ) {
        const h = o(e, 1, a);
        if (h === "\0")
          break;
        l += h;
      }
      const f = o(e, d, y);
      b(c, rt, l.toLowerCase(), f);
    }
    return c;
  } catch {
    return;
  }
}, B = (t) => {
  try {
    const e = o(t, 4, a), n = s(t, 4), r = C(t, n);
    return n % 2 && u(t, 1), { id: e, size: n, data: r };
  } catch {
    return;
  }
}, mt = (t) => {
  const e = T(t), n = B(e);
  if (!n || n.id !== "FORM")
    return;
  const r = o(n.data, 4, a);
  if (r !== "AIFF" && r !== "AIFC")
    return;
  let c;
  for (; c = B(n.data); )
    if (c.id === "ID3 ")
      return V(c.data[0]);
}, F = (t) => {
  try {
    const e = o(t, 4, a), n = s(t, 4, !0), r = C(t, n);
    return n % 2 && u(t, 1), { id: e, size: n, data: r };
  } catch {
    return;
  }
}, ot = {
  INAM: "title",
  IPRD: "album",
  IART: "artist",
  IMUS: "composer",
  IPRT: "track",
  ITRK: "track",
  IFRM: "totaltracks",
  ISFT: "encoder",
  IGNR: "genre",
  ICMT: "comment"
}, ct = (t) => {
  const e = {};
  let n;
  for (; n = F(t); )
    b(e, ot, n.id, m(o(n.data, n.size, y)));
  return e;
}, H = (t) => {
  let e, n = {};
  for (; e = F(t); )
    switch (e.id) {
      case "id3 ":
        n = { ...n, ...V(e.data[0]) };
        break;
      case "LIST":
        o(e.data, 4, a) === "INFO" ? n = { ...n, ...ct(e.data) } : n = { ...n, ...H(e.data) };
        break;
    }
  return n;
}, ft = (t) => {
  const e = T(t), n = F(e);
  if (!(!n || n.id !== "RIFF") && o(n.data, 4, a) === "WAVE")
    return H(n.data);
};
export {
  mt as aiff,
  lt as apev2,
  it as flac,
  at as id3v1,
  V as id3v2,
  dt as mp4,
  st as ogg,
  ft as wav,
  ut as wma
};
