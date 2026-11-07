/**
 * Ornaments: the shared SVG defs (watercolor filters, hatch patterns, herb and Art Nouveau symbols)
 * from the approved style board v3. Mounted once; screens use them with <use href="#id">.
 */
export class Ornaments {
  /** @param {HTMLElement} root */
  static mount(root) {
    const d = document.createElement('div');
    d.innerHTML = Ornaments.DEFS;
    root.prepend(d.firstElementChild);
  }
}

Ornaments.DEFS = `<svg width="0" height="0" style="position:absolute">
 <defs>
  <filter id="wc" x="-25%" y="-25%" width="150%" height="150%">
   <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="4" seed="4" result="n"/>
   <feDisplacementMap in="SourceGraphic" in2="n" scale="60" xChannelSelector="R" yChannelSelector="G" result="d"/>
   <feGaussianBlur in="d" stdDeviation="3.5" result="b"/>
   <feMorphology in="b" operator="erode" radius="3" result="e"/>
   <feComposite in="b" in2="e" operator="out" result="edge"/>
   <feGaussianBlur in="edge" stdDeviation="1.1" result="edgeB"/>
   <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="2" seed="9" result="g"/>
   <feColorMatrix in="g" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -1.4 0 0 0 1.45" result="ga"/>
   <feComposite in="b" in2="ga" operator="in" result="gran"/>
   <feTurbulence type="fractalNoise" baseFrequency="0.028" numOctaves="3" seed="2" result="m"/>
   <feColorMatrix in="m" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1.8 0 0 0 -0.3" result="ma"/>
   <feComposite in="gran" in2="ma" operator="in" result="mott"/>
   <feMerge><feMergeNode in="mott"/><feMergeNode in="edgeB"/><feMergeNode in="edgeB"/></feMerge>
  </filter>
  <filter id="wc2" x="-25%" y="-25%" width="150%" height="150%">
   <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" seed="11" result="n"/>
   <feDisplacementMap in="SourceGraphic" in2="n" scale="28" xChannelSelector="R" yChannelSelector="G" result="d"/>
   <feGaussianBlur in="d" stdDeviation="1.6" result="b"/>
   <feMorphology in="b" operator="erode" radius="2" result="e"/>
   <feComposite in="b" in2="e" operator="out" result="edge"/>
   <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="2" seed="3" result="g"/>
   <feColorMatrix in="g" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -1.2 0 0 0 1.4" result="ga"/>
   <feComposite in="b" in2="ga" operator="in" result="gran"/>
   <feMerge><feMergeNode in="gran"/><feMergeNode in="edge"/><feMergeNode in="edge"/></feMerge>
  </filter>
  <filter id="paperF"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="3"/><feColorMatrix values="0 0 0 0 .4 0 0 0 0 .3 0 0 0 0 .2 0 0 0 .3 0"/></filter>
  <filter id="grunge"><feTurbulence type="fractalNoise" baseFrequency=".012" numOctaves="5" seed="7"/><feColorMatrix values="0 0 0 0 .45 0 0 0 0 .33 0 0 0 0 .18 0 0 0 -2.2 1.25"/></filter>
  <filter id="speck"><feTurbulence type="fractalNoise" baseFrequency=".09" numOctaves="2" seed="21"/><feColorMatrix values="0 0 0 0 .3 0 0 0 0 .22 0 0 0 0 .12 0 0 0 -9 5.6"/></filter>
  <filter id="rough"><feTurbulence type="fractalNoise" baseFrequency=".05" numOctaves="2" seed="1" result="t"/><feDisplacementMap in="SourceGraphic" in2="t" scale="3"/></filter>
  <filter id="darkwc"><feTurbulence type="fractalNoise" baseFrequency=".0035 .005" numOctaves="3" seed="8"/><feColorMatrix values="0 0 0 0 .1 0 0 0 0 .22 0 0 0 0 .23 1.4 0 0 0 -.45"/></filter>
  <pattern id="hx" width="4.5" height="4.5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="4.5" stroke="#1F3A3D" stroke-width=".9"/></pattern>
  <pattern id="hx2" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)"><line x1="0" y1="0" x2="0" y2="5" stroke="#1F3A3D" stroke-width=".8"/></pattern>
  <linearGradient id="bam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#B9CF85"/><stop offset=".25" stop-color="#8FAE55"/><stop offset=".6" stop-color="#6B8A3A"/><stop offset="1" stop-color="#4A6127"/></linearGradient>
  <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F0C866"/><stop offset=".5" stop-color="#D9A326"/><stop offset="1" stop-color="#A8771A"/></linearGradient>
  <symbol id="leaf" viewBox="0 0 20 40"><path d="M10 0 C20 12 18 30 10 40 C2 30 0 12 10 0Z" fill="#7FA678" stroke="#2E5A56" stroke-width="1"/><path d="M10 0 C20 12 18 30 10 40 C11 26 12 14 10 0Z" fill="url(#hx)" opacity=".55"/><path d="M10 2 V38" stroke="#2E5A56" stroke-width=".8"/></symbol>
  <symbol id="bloom" viewBox="-20 -20 40 40"><g stroke="#5a3b1c" stroke-width="1"><ellipse rx="6" ry="13" cy="-9" fill="#D9A326"/><ellipse rx="6" ry="13" cy="9" fill="#D9A326"/><ellipse rx="13" ry="6" cx="-9" fill="#E8C060"/><ellipse rx="13" ry="6" cx="9" fill="#E8C060"/></g><ellipse rx="13" ry="6" cx="9" fill="url(#hx)" opacity=".5"/><ellipse rx="6" ry="13" cy="9" fill="url(#hx)" opacity=".35"/><circle r="4" fill="#1F3A3D" stroke="#F2E9D8"/><circle r="1.4" fill="#F2E9D8"/></symbol>
  <symbol id="moon" viewBox="0 0 24 24"><path d="M15 2 A10 10 0 1 0 22 16 A8 8 0 1 1 15 2Z" fill="#F2E9D8" stroke="#D9A326" stroke-width="1.2"/></symbol>
  <symbol id="sprig" viewBox="0 0 80 140">
   <path d="M40 138 C38 100 46 60 40 6" fill="none" stroke="#2E5A56" stroke-width="2.2"/>
   <use href="#leaf" x="40" y="12" width="14" height="28" transform="rotate(35 40 26)"/><use href="#leaf" x="26" y="20" width="14" height="28" transform="rotate(-35 33 34)"/>
   <use href="#leaf" x="42" y="44" width="16" height="32" transform="rotate(40 42 60)"/><use href="#leaf" x="24" y="52" width="16" height="32" transform="rotate(-40 32 68)"/>
   <use href="#leaf" x="42" y="80" width="17" height="34" transform="rotate(42 42 97)"/><use href="#leaf" x="22" y="88" width="17" height="34" transform="rotate(-42 31 105)"/>
   <use href="#leaf" x="33" y="-2" width="14" height="26"/>
  </symbol>
  <symbol id="nouveau" viewBox="0 0 120 120">
   <g fill="none" stroke-linecap="round">
    <path d="M8 116 C8 52 40 10 116 8" stroke="#5a3b1c" stroke-width="6"/><path d="M8 116 C8 52 40 10 116 8" stroke="url(#gold)" stroke-width="3.5"/>
    <path d="M22 116 C22 70 44 40 72 34 C92 30 100 44 90 54 C82 62 70 56 74 48" stroke="#D9A326" stroke-width="2.2"/>
    <path d="M116 22 C76 22 50 40 42 66 C36 86 50 96 60 88 C68 82 62 72 56 76" stroke="#D9A326" stroke-width="2.2"/>
   </g>
   <use href="#leaf" x="56" y="58" width="12" height="24" transform="rotate(130 62 70)"/><use href="#leaf" x="80" y="40" width="10" height="20" transform="rotate(70 85 50)"/>
   <use href="#bloom" x="12" y="12" width="40" height="40"/>
  </symbol>
  <symbol id="divider" viewBox="0 0 400 20">
   <path d="M0 10 C60 10 80 2 130 6 C160 9 170 16 190 12" fill="none" stroke="#C8955A" stroke-width="1.6"/><path d="M400 10 C340 10 320 2 270 6 C240 9 230 16 210 12" fill="none" stroke="#C8955A" stroke-width="1.6"/>
   <use href="#bloom" x="190" y="0" width="20" height="20"/>
  </symbol>
  <symbol id="house" viewBox="0 0 100 90">
   <path d="M10 88 V40 L50 14 L90 40 V88Z" fill="#EDE5D2" fill-opacity=".85" stroke="#2D3B3A" stroke-width="1.6"/>
   <path d="M62 22 L90 40 V88 H66Z" fill="url(#hx)" opacity=".55"/>
   <path d="M2 42 L50 8 L98 42" fill="#6E9690" fill-opacity=".8" stroke="#2D3B3A" stroke-width="1.6"/>
   <path d="M50 8 L98 42 L84 42 Z" fill="url(#hx2)" opacity=".6"/>
   <path d="M40 88 V62 C40 52 60 52 60 62 V88" fill="#A57A49" fill-opacity=".8" stroke="#2D3B3A" stroke-width="1.4"/>
   <circle cx="50" cy="32" r="6" fill="#A9B8E8" stroke="#2D3B3A"/>
  </symbol>
  <symbol id="tree" viewBox="0 0 80 100">
   <path d="M40 98 V60" stroke="#5a3b1c" stroke-width="5"/>
   <path d="M40 4 C60 4 76 20 72 40 C80 56 66 72 48 68 C36 76 14 70 12 54 C0 44 8 20 24 18 C28 8 34 4 40 4Z" fill="#7FA678" fill-opacity=".75" stroke="#2E5A56" stroke-width="1.6"/>
   <path d="M56 12 C70 20 78 40 70 52 C64 64 54 66 48 68 C60 56 64 32 56 12Z" fill="url(#hx)" opacity=".6"/>
  </symbol>
 </defs>
</svg>`;
