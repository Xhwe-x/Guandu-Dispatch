import type { PortraitCharacterId } from './dialogueCharacters';

interface CharacterPortraitProps {
  character: string;
  mood?: 'neutral' | 'thinking' | 'guarded' | 'denial' | 'pressured' | 'resolved';
  label: string;
}

const portraitAssets: Partial<Record<PortraitCharacterId, string>> = {
  caocao: '/assets/portraits/caocao.jpg',
  zhao: '/assets/portraits/zhao.jpg',
  lu: '/assets/portraits/lu.webp',
  zheng: '/assets/portraits/zheng.webp',
  du: '/assets/portraits/du.webp',
};

const palettes = {
  commander: { robe0: '#313a39', robe1: '#151f20', sleeve: '#242c2a', collar: '#7a2e25', headwear: '#2b2c28' },
  caocao: { robe0: '#202b2a', robe1: '#0d1516', sleeve: '#17201f', collar: '#7f2d24', headwear: '#171c1b' },
  officer: { robe0: '#4a4134', robe1: '#24201b', sleeve: '#302a22', collar: '#66533a', headwear: '#25211c' },
  zhao: { robe0: '#5e5748', robe1: '#302b24', sleeve: '#3b352c', collar: '#6a5d45', headwear: '#27211d' },
  lu: { robe0: '#435052', robe1: '#1f292b', sleeve: '#2d3738', collar: '#76563d', headwear: '#242b2b' },
  zheng: { robe0: '#554632', robe1: '#2b231a', sleeve: '#3a2f22', collar: '#815b35', headwear: '#2c261e' },
  du: { robe0: '#39443b', robe1: '#1b251f', sleeve: '#29342c', collar: '#6d5537', headwear: '#252b24' },
} as const;

export function CharacterPortrait({ character, mood = 'neutral', label }: CharacterPortraitProps) {
  const knownCharacter = (character in palettes ? character : 'officer') as PortraitCharacterId;
  const authority = knownCharacter === 'commander' || knownCharacter === 'caocao';
  const isCaoCao = knownCharacter === 'caocao';
  const palette = palettes[knownCharacter];
  const portraitAsset = portraitAssets[knownCharacter];
  return (
    <figure className={`character-portrait character-portrait--${character}`} data-mood={mood} aria-label={`${label}立绘`}>
      {portraitAsset ? (
        <img className="character-portrait__asset" src={portraitAsset} alt="" aria-hidden="true" />
      ) : (
      <svg viewBox="0 0 360 520" role="img" aria-hidden="true">
        <defs>
          <linearGradient id={`${character}-robe`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={palette.robe0} />
            <stop offset="0.55" stopColor={palette.robe1} />
            <stop offset="1" stopColor="#0d0d0c" />
          </linearGradient>
          <radialGradient id={`${character}-skin`} cx="48%" cy="35%" r="70%">
            <stop offset="0" stopColor={isCaoCao ? '#d1a177' : '#c99c70'} />
            <stop offset="0.72" stopColor={isCaoCao ? '#926044' : '#8c5e42'} />
            <stop offset="1" stopColor="#4b2c22" />
          </radialGradient>
          <filter id={`${character}-shadow`} x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="12" stdDeviation="12" floodColor="#000" floodOpacity=".55" />
          </filter>
        </defs>
        <ellipse cx="180" cy="470" rx="125" ry="24" fill="#000" opacity=".32" />
        <g filter={`url(#${character}-shadow)`}>
          <path d={authority
            ? 'M79 442 C83 337 98 273 137 244 L223 244 C268 280 283 343 288 442 Z'
            : 'M89 442 C94 340 112 283 145 251 L216 251 C254 287 272 344 276 442 Z'} fill={`url(#${character}-robe)`} />
          <path d={authority
            ? 'M111 330 L69 407 L104 430 L153 352 Z M249 330 L291 407 L256 430 L207 352 Z'
            : 'M126 330 L90 397 L116 418 L155 353 Z M234 330 L270 397 L244 418 L205 353 Z'} fill={palette.sleeve} />
          {isCaoCao && <path d="M102 410 Q180 352 258 410 L246 448 H114Z" fill="#111918" stroke="#765a3a" strokeWidth="3" opacity=".9" />}
          <path d="M144 242 C151 226 158 215 180 215 C202 215 212 227 219 244 L205 284 L156 284 Z" fill="#754b35" />
          <ellipse cx="180" cy="170" rx={authority ? 60 : 55} ry={authority ? 73 : 69} fill={`url(#${character}-skin)`} />
          <path d={authority
            ? 'M119 167 C119 99 141 69 181 67 C223 68 246 104 240 163 C221 139 209 127 177 126 C151 126 137 139 119 167 Z'
            : 'M126 154 C127 103 144 78 179 76 C212 78 233 103 235 154 C217 133 204 124 179 124 C153 124 143 132 126 154 Z'} fill="#171411" />
          {authority && <path d={isCaoCao ? 'M139 86 L149 38 H211 L221 86 L202 104 H157 Z' : 'M145 84 L151 44 L209 44 L216 86 L201 100 L158 100 Z'} fill={palette.headwear} stroke="#7f7054" strokeWidth="4" />}
          {!authority && <path d="M148 83 Q180 50 213 84 L206 98 L154 98 Z" fill={palette.headwear} />}
          {isCaoCao && <><path d="M149 43 H211" stroke="#b39761" strokeWidth="4" /><circle cx="180" cy="43" r="7" fill="#8b3728" /></>}
          <path d="M151 162 Q164 155 174 160" stroke="#2d211b" strokeWidth={isCaoCao ? 7 : 6} strokeLinecap="round" fill="none" />
          <path d="M188 160 Q201 154 211 160" stroke="#2d211b" strokeWidth={isCaoCao ? 7 : 6} strokeLinecap="round" fill="none" />
          <circle cx="165" cy="173" r="4.5" fill="#16120f" /><circle cx="199" cy="173" r="4.5" fill="#16120f" />
          <path d="M181 176 Q176 194 182 199" stroke="#6d4936" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path className="character-portrait__mouth" d={mood === 'guarded' ? 'M160 218 Q181 211 203 218' : mood === 'thinking' ? 'M161 216 Q181 219 202 214' : 'M161 215 Q181 221 202 214'} stroke="#4d2b25" strokeWidth="5" fill="none" strokeLinecap="round" />
          {authority && <path d={isCaoCao ? 'M144 205 Q180 252 218 205 Q208 269 180 281 Q151 267 144 205 Z' : 'M146 207 Q181 248 216 207 Q207 258 180 271 Q153 258 146 207 Z'} fill="#211914" opacity=".9" />}
          {!authority && <path d="M157 222 Q180 242 203 222" stroke="#2b1b17" strokeWidth="4" fill="none" opacity=".6" />}
          <path d={authority ? 'M127 280 L180 322 L235 279 L223 252 L180 284 L138 251 Z' : 'M140 285 L180 315 L222 284 L214 257 L180 286 L147 257 Z'} fill={palette.collar} opacity=".94" />
          <path d={authority ? 'M166 283 L180 326 L194 283' : 'M169 286 L180 316 L191 286'} fill="#b59a68" opacity=".7" />
          {isCaoCao && <path d="M126 348 Q180 374 234 348" stroke="#9a7448" strokeWidth="5" fill="none" opacity=".62" />}
        </g>
      </svg>
      )}
      <figcaption><strong>{label}</strong><span>{character === 'caocao' ? '司空 · 行车骑将军事' : character === 'officer' ? '奉中军令查案' : character === 'lu' ? '邮驿主吏' : character === 'zheng' ? '军粮书佐' : character === 'du' ? '营外行商' : authority ? '中军主将' : '军书佐'}</span></figcaption>
    </figure>
  );
}
