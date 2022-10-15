(function(g,a){typeof exports=="object"&&typeof module<"u"?a(exports):typeof define=="function"&&define.amd?define(["exports"],a):(g=typeof globalThis<"u"?globalThis:g||self,a(g.AudioMetadata={}))})(this,function(g){"use strict";const a=t=>t.replace(/\0+$/,""),b=(t,e)=>{const n=t.indexOf(e);return[t.substring(0,n),t.substring(n+1)]},l=t=>{if(t instanceof Uint8Array&&(t=t.buffer.slice(0)),!(t instanceof ArrayBuffer))throw new Error("Expected instance of Buffer or ArrayBuffer");return new DataView(t)},y=(t,e,n)=>new Uint8Array(t.buffer).slice(e,e+n),m=t=>(e,n,r)=>new TextDecoder(t).decode(e.buffer.slice(n,n+r)),d=m("ascii"),v=m(),k=m("utf16be"),p=(t,e)=>{if(t.byteLength<e+27)return;const n=t.getUint8(e+26),r=y(t,e+27,n),i=27+n;if(!r.length)return;const c=i+r.reduce((u,s)=>u+s),o=i+7;return{pageSize:c,packet:l(y(t,e+o,c-o))}},L=t=>{try{const e=t.getUint32(0,!0),n=t.getUint32(4+e,!0),r={},i={tracknumber:"track"};for(let c=0,o=8+e;c<n;c++){const u=t.getUint32(o,!0),s=v(t,o+4,u),[f,h]=b(s,"="),T=f.toLowerCase();r[i[T]||T]=r[T]=a(h),o+=4+u}return r}catch{return}},M=t=>{const e=l(t),n=p(e,0);if(!n)return;const r=p(e,n.pageSize);if(r)return L(r.packet)},S=t=>d(t,t.byteLength-128,3)==="TAG",A=t=>{const e=l(t);try{if(!S(e))return;const n=e.byteLength-128,r=e.getUint8(n+125)===0,i=a(d(e,n+3,30)),c=a(d(e,n+33,30)),o=a(d(e,n+63,30)),u=a(d(e,n+93,4)),s=a(d(e,n+97,r?28:30)),f=r?e.getUint8(n+126):void 0,h=e.getUint8(n+127);return{title:i,artist:c,album:o,year:u,comment:s,track:f,genre:h}}catch{return}},U=(t,e)=>y(t,e,4).reduce((n,r)=>n<<7|r&268435455,0),w=t=>{switch(t){case 1:return(e,n,r)=>e.getUint16(n)===65279?k(e,n,r):m("utf16le")(e,n,r);case 2:return m("utf16be");case 3:return v;case 0:default:return d}},C={TALB:"album",TCOM:"composer",TIT1:"title",TIT2:"title",TPE1:"artist",TRCK:"track",TSSE:"encoder",TDRC:"year",TCON:"genre"},x=(t,e)=>{try{const n=d(t,e,4),r=10+U(t,e+4),i=n[0]==="T"?a(w(t.getUint8(e+9))(t,e+11,r-11)):void 0;return{id:n,size:r,content:i}}catch{return}},z=t=>{const e=l(t);if(d(e,0,3)!=="ID3")return;const n=e.getUint8(5),r=U(e,6),i=!!(n&128),c={},o=i?U(e,10):0;for(let u=10+o;u<10+o+r;){const s=x(e,u);if(!s)break;if(u+=s.size,!s.content)continue;const f=C[s.id]||s.id;if(f==="TXXX"){const[h,T]=b(s.content,"\0");c[h]=T}else c[f]=c[s.id]=s.content}return c},E=t=>d(t,0,4)==="fLaC",B=t=>{const e=l(t);if(!E(e))return;let n=4,r=!1,i={};for(;!r;){const c=e.getUint8(n),o=e.getUint16(n+1)*2**16+e.getUint8(n+3);r=c>127,(c&127)==4&&(i=Object.assign(i,L(l(y(e,n+4,o))))),n+=4+o}return i};g.flac=B,g.id3v1=A,g.id3v2=z,g.ogg=M,Object.defineProperties(g,{__esModule:{value:!0},[Symbol.toStringTag]:{value:"Module"}})});
