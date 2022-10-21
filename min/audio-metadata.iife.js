var AudioMetadata=function(g){"use strict";const A=t=>{let e;if(ArrayBuffer.isView(t))e=new DataView(t.buffer,t.byteOffset,t.byteLength);else if(t instanceof ArrayBuffer||t instanceof SharedArrayBuffer)e=new DataView(t);else throw new Error("Expected instance of TypedArray, DataView or ArrayBuffer");return[e,0]},i=(t,e)=>{const[n,r]=t;return t[1]+=e,[n,r]},H=(t,e)=>{const[n,r]=t;return t[1]=e<0?n.byteLength+e:e,[n,r]},D=([t,e])=>t.byteLength-e,c=(t,e,n=!1)=>{const[r,o]=i(t,e);return Number(r[{1:"getUint8",2:"getUint16",4:"getUint32",8:"getBigUint64"}[e]](o,n))},S=(t,e)=>{const[n,r]=i(t,e);return n.buffer.slice(r,r+e)},m="ascii",L="utf-8",T="utf-16be",f="utf-16le",a=(t,e,n=L)=>new TextDecoder(n).decode(S(t,e)),k=(t,e)=>new Uint8Array(S(t,e)),b=(t,e)=>A(S(t,e)),E=(t,e=0)=>(...n)=>{const[[r,o],...s]=n;return t([r,o+e],...s)},d=t=>t.replace(/\0+$/,""),F=(t,e)=>{const n=t.indexOf(e);return[t.substring(0,n),t.substring(n+1)]},M=t=>{if(D(t)<27)return;const e=(i(t,26),c(t,1)),n=k(t,e);if(!n.length)return;const r=n.reduce((o,s)=>o+s);return i(t,7),{pageSize:r+27+e,packet:b(t,r-7)}},G=t=>{try{const e=c(t,4,!0),n=(i(t,e),c(t,4,!0)),r={},o={tracknumber:"track"};for(let s=0;s<n;s++){const l=c(t,4,!0),u=a(t,l),[p,y]=F(u,"="),C=p.toLowerCase();r[o[C]||C]=r[C]=d(y)}return r}catch{return}},O=t=>{const e=A(t);if(!M(e))return;const r=M(e);if(r)return G(r.packet)},R=t=>(H(t,-128),a(t,3,m)==="TAG"),j=t=>{const e=A(t);try{if(!R(e))return;const n=E(c,122)(e,1)===0;return{title:d(a(e,30,m)),artist:d(a(e,30,m)),album:d(a(e,30,m)),year:d(a(e,4,m)),comment:d(a(e,n?28:30,m)),track:n?c(e,2):void 0,genre:c(e,1)}}catch{return}},B=t=>k(t,4).reduce((e,n)=>e<<7|n&127,0),v=(t,e)=>{var n;return a(t,e-1,(n={0:m,1:E(c)(t,2)===65279?T:f,2:T}[c(t,1)])!=null?n:L)},N={TALB:"album",TCOM:"composer",TIT1:"title",TIT2:"title",TPE1:"artist",TRCK:"track",TSSE:"encoder",TDRC:"year",TCON:"genre"},X=t=>{try{const e=a(t,4,m),n=B(t);i(t,2);const r=e[0]==="T"?d(v(t,n)):(i(t,n),void 0);return{id:e,content:r}}catch{return}},K=t=>{const e=A(t);if(a(e,3,m)!=="ID3")return;const n=(i(e,2),c(e,1)),r=B(e),o=!!(n&128),s={},l=o?B(e):0;for(i(e,l);e[1]<10+l+r;){const u=X(e);if(!u)break;if(!u.content)continue;const p=N[u.id]||u.id;if(p==="TXXX"){const[y,C]=F(u.content,"\0");s[y]=C}else s[p]=s[u.id]=u.content}return s},W=t=>{const e=A(t);if(a(e,4,m)!=="fLaC")return;let n=!1,r={};for(;!n;){const o=c(e,1),s=c(e,2)*2**8+c(e,1);n=o>127,(o&127)==4?r={...r,...G(b(e,s))}:i(e,s)}return r},_=t=>"G"+k(t,16).reduce((e,n)=>e+n.toString(16).padStart(2,"0").toUpperCase(),""),x=t=>{try{const e=_(t),n=c(t,8,!0),r=b(t,n-24);return{guid:e,size:n,data:r}}catch{return}},$=t=>{const e=c(t,2,!0),n=c(t,2,!0),r=c(t,2,!0),o=c(t,2,!0),s=c(t,2,!0);return{title:d(a(t,e,f)),artist:d(a(t,n,f)),copyright:d(a(t,r,f)),comment:d(a(t,o,f)),rating:d(a(t,s,f))}},I={"wm/albumtitle":"album"},q=t=>{const e={},n=c(t,2,!0);for(let r=0;r<n;r++){const o=c(t,2,!0),s=d(a(t,o,f)).toLowerCase(),l=s.startsWith("wm/")?s.slice(3):s,u=I[s]||s,p=c(t,2,!0),y=c(t,2,!0);switch(p){case 0:e[l]=e[u]=d(a(t,y,f));break;default:i(t,y)}}return e},J=t=>{var r;i(t,22);let e={},n;for(;n=x(t);){const o={GEACBF8C5AF5B48778467AA8C44FA4CCA:V,G941C23449894D149A1411D134E457054:V};e={...e,...(r=o[n.guid])==null?void 0:r.call(o,n.data)}}return e},V=t=>{const e={},n=c(t,2,!0);for(let r=0;r<n;r++){i(t,4);const o=c(t,2,!0),s=c(t,2,!0),l=c(t,2,!0),u=d(a(t,o,f)).toLowerCase(),p=u.startsWith("wm/")?u.slice(3):u,y=I[u]||u;switch(s){case 0:e[p]=e[y]=d(a(t,l,f));break;default:i(t,l)}}return e},P=t=>{var n;const e=A(t);try{const r=x(e);if(!r||r.guid!=="G3026B2758E66CF11A6D900AA0062CE6C")return;i(r.data,6);let o,s={};for(;o=x(r.data);){const l={G3326B2758E66CF11A6D900AA0062CE6C:$,G40A4D0D207E3D21197F000A0C95EA850:q,GB503BF5F2EA9CF118EE300C00C205365:J};s={...s,...(n=l[o.guid])==null?void 0:n.call(l,o.data)}}return s}catch{return}},Q=t=>{try{const e=c(t,4),n=a(t,4,m).toLowerCase(),r=e===1?c(t,8):e||D(t);return{size:r,type:n,data:b(t,r-(e===1?16:8))}}catch{return}},U=function*(t){let e,n=0;for(;(e=Q(t))&&!(n++>100);)yield e},Y={"\xA9alb":"album","\xA9wrt":"composer","\xA9nam":"title","\xA9art":"artist",aart:"albumartist","\xA9cmt":"comment",trkn:"track","\xA9too":"encoder","\xA9day":"year","\xA9gen":"genre",gnre:"genre"},Z=t=>{const e=[...U(t)].find(n=>n.type==="data");if(e){const n=e.data,r=c(n,4);i(n,4);const o={1:L,2:T,4:L,5:T}[r];return o&&a(n,D(n),o)}},w=t=>{let e={};for(const{data:n,type:r}of U(t)){const o=Z(n);o&&(e={...e,[r]:o,[Y[r]||r]:o})}return e},h=t=>{var n;let e={};for(const{type:r,data:o}of U(t))e={...e,...(n=z[r])==null?void 0:n.call(z,o)};return e},z={moov:h,trak:h,mdia:h,udta:h,meta:t=>h(tt(t)),ilst:w},tt=t=>{const e=E(a,4)(t,4,m),n=E(a,16)(t,4,m);return e==="hdlr"&&n==="mdta"||i(t,4),t},et=t=>{const e=A(t),n=h(e);return Object.keys(n).length===0?void 0:n};return g.flac=W,g.id3v1=j,g.id3v2=K,g.mp4=et,g.ogg=O,g.wma=P,Object.defineProperties(g,{__esModule:{value:!0},[Symbol.toStringTag]:{value:"Module"}}),g}({});
