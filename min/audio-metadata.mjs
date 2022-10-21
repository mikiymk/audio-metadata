const y = (t) => {
  let e;
  if (ArrayBuffer.isView(t))
    e = new DataView(t.buffer, t.byteOffset, t.byteLength);
  else if (t instanceof ArrayBuffer || t instanceof SharedArrayBuffer)
    e = new DataView(t);
  else
    throw new Error("Expected instance of TypedArray, DataView or ArrayBuffer");
  return [e, 0];
}, u = (t, e) => {
  const [n, r] = t;
  return t[1] += e, [n, r];
}, V = (t, e) => {
  const [n, r] = t;
  return t[1] = e < 0 ? n.byteLength + e : e, [n, r];
}, k = ([t, e]) => t.byteLength - e, s = (t, e, n = !1) => {
  const [r, o] = u(t, e);
  return Number(
    r[{
      1: "getUint8",
      2: "getUint16",
      4: "getUint32",
      8: "getBigUint64"
    }[e]](o, n)
  );
}, B = (t, e) => {
  const [n, r] = u(t, e);
  return n.buffer.slice(r, r + e);
}, l = "ascii", C = "utf-8", L = "utf-16be", f = "utf-16le", a = (t, e, n = C) => new TextDecoder(n).decode(B(t, e)), S = (t, e) => new Uint8Array(B(t, e)), T = (t, e) => y(B(t, e)), E = (t, e = 0) => (...n) => {
  const [[r, o], ...c] = n;
  return t([r, o + e], ...c);
}, d = (t) => t.replace(/\0+$/, ""), G = (t, e) => {
  const n = t.indexOf(e);
  return [t.substring(0, n), t.substring(n + 1)];
}, z = (t) => {
  if (k(t) < 27)
    return;
  const e = (u(t, 26), s(t, 1)), n = S(t, e);
  if (!n.length)
    return;
  const r = n.reduce((o, c) => o + c);
  return u(t, 7), { pageSize: r + 27 + e, packet: T(t, r - 7) };
}, I = (t) => {
  try {
    const e = s(t, 4, !0), n = (u(t, e), s(t, 4, !0)), r = {}, o = { tracknumber: "track" };
    for (let c = 0; c < n; c++) {
      const m = s(t, 4, !0), i = a(t, m), [g, p] = G(i, "="), h = g.toLowerCase();
      r[o[h] || h] = r[h] = d(p);
    }
    return r;
  } catch {
    return;
  }
}, Z = (t) => {
  const e = y(t);
  if (!z(e))
    return;
  const r = z(e);
  if (r)
    return I(r.packet);
}, H = (t) => (V(t, -128), a(t, 3, l) === "TAG"), _ = (t) => {
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
      1: E(s)(t, 2) === 65279 ? L : f,
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
    const r = e[0] === "T" ? d(O(t, n)) : (u(t, n), void 0);
    return { id: e, content: r };
  } catch {
    return;
  }
}, P = (t) => {
  const e = y(t);
  if (a(e, 3, l) !== "ID3")
    return;
  const n = (u(e, 2), s(e, 1)), r = x(e), o = !!(n & 128), c = {}, m = o ? x(e) : 0;
  for (u(e, m); e[1] < 10 + m + r; ) {
    const i = N(e);
    if (!i)
      break;
    if (!i.content)
      continue;
    const g = R[i.id] || i.id;
    if (g === "TXXX") {
      const [p, h] = G(i.content, "\0");
      c[p] = h;
    } else
      c[g] = c[i.id] = i.content;
  }
  return c;
}, v = (t) => {
  const e = y(t);
  if (a(e, 4, l) !== "fLaC")
    return;
  let n = !1, r = {};
  for (; !n; ) {
    const o = s(e, 1), c = s(e, 2) * 2 ** 8 + s(e, 1);
    n = o > 127, (o & 127) == 4 ? r = { ...r, ...I(T(e, c)) } : u(e, c);
  }
  return r;
}, X = (t) => "G" + S(t, 16).reduce((e, n) => e + n.toString(16).padStart(2, "0").toUpperCase(), ""), D = (t) => {
  try {
    const e = X(t), n = s(t, 8, !0), r = T(t, n - 24);
    return { guid: e, size: n, data: r };
  } catch {
    return;
  }
}, j = (t) => {
  const e = s(t, 2, !0), n = s(t, 2, !0), r = s(t, 2, !0), o = s(t, 2, !0), c = s(t, 2, !0);
  return {
    title: d(a(t, e, f)),
    artist: d(a(t, n, f)),
    copyright: d(a(t, r, f)),
    comment: d(a(t, o, f)),
    rating: d(a(t, c, f))
  };
}, M = {
  "wm/albumtitle": "album"
}, K = (t) => {
  const e = {}, n = s(t, 2, !0);
  for (let r = 0; r < n; r++) {
    const o = s(t, 2, !0), c = d(a(t, o, f)).toLowerCase(), m = c.startsWith("wm/") ? c.slice(3) : c, i = M[c] || c, g = s(t, 2, !0), p = s(t, 2, !0);
    switch (g) {
      case 0:
        e[m] = e[i] = d(a(t, p, f));
        break;
      default:
        u(t, p);
    }
  }
  return e;
}, W = (t) => {
  var r;
  u(t, 22);
  let e = {}, n;
  for (; n = D(t); ) {
    const o = {
      GEACBF8C5AF5B48778467AA8C44FA4CCA: F,
      G941C23449894D149A1411D134E457054: F
    };
    e = { ...e, ...(r = o[n.guid]) == null ? void 0 : r.call(o, n.data) };
  }
  return e;
}, F = (t) => {
  const e = {}, n = s(t, 2, !0);
  for (let r = 0; r < n; r++) {
    u(t, 4);
    const o = s(t, 2, !0), c = s(t, 2, !0), m = s(t, 2, !0), i = d(a(t, o, f)).toLowerCase(), g = i.startsWith("wm/") ? i.slice(3) : i, p = M[i] || i;
    switch (c) {
      case 0:
        e[g] = e[p] = d(a(t, m, f));
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
    const r = D(e);
    if (!r || r.guid !== "G3026B2758E66CF11A6D900AA0062CE6C")
      return;
    u(r.data, 6);
    let o, c = {};
    for (; o = D(r.data); ) {
      const m = {
        G3326B2758E66CF11A6D900AA0062CE6C: j,
        G40A4D0D207E3D21197F000A0C95EA850: K,
        GB503BF5F2EA9CF118EE300C00C205365: W
      };
      c = { ...c, ...(n = m[o.guid]) == null ? void 0 : n.call(m, o.data) };
    }
    return c;
  } catch {
    return;
  }
}, $ = (t) => {
  try {
    const e = s(t, 4), n = a(t, 4, l).toLowerCase(), r = e === 1 ? s(t, 8) : e || k(t);
    return {
      size: r,
      type: n,
      data: T(t, r - (e === 1 ? 16 : 8))
    };
  } catch {
    return;
  }
}, U = function* (t) {
  let e, n = 0;
  for (; (e = $(t)) && !(n++ > 100); )
    yield e;
}, q = {
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
}, J = (t) => {
  const e = [...U(t)].find((n) => n.type === "data");
  if (e) {
    const n = e.data, r = s(n, 4);
    u(n, 4);
    const o = {
      1: C,
      2: L,
      4: C,
      5: L
    }[r];
    return o && a(n, k(n), o);
  }
}, Q = (t) => {
  let e = {};
  for (const { data: n, type: r } of U(t)) {
    const o = J(n);
    o && (e = { ...e, [r]: o, [q[r] || r]: o });
  }
  return e;
}, A = (t) => {
  var n;
  let e = {};
  for (const { type: r, data: o } of U(t))
    e = { ...e, ...(n = b[r]) == null ? void 0 : n.call(b, o) };
  return e;
}, b = {
  moov: A,
  trak: A,
  mdia: A,
  udta: A,
  meta: (t) => A(Y(t)),
  ilst: Q
}, Y = (t) => {
  const e = E(a, 4)(t, 4, l), n = E(a, 16)(t, 4, l);
  return e === "hdlr" && n === "mdta" || u(t, 4), t;
}, tt = (t) => {
  const e = y(t), n = A(e);
  return Object.keys(n).length === 0 ? void 0 : n;
};
export {
  v as flac,
  _ as id3v1,
  P as id3v2,
  tt as mp4,
  Z as ogg,
  w as wma
};
