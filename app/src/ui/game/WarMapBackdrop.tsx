// 后程场景的军图纹样背景：等高线、补给路线与罗盘环，低调衬托“军图上做推演”的语境。
export function WarMapBackdrop() {
  return (
    <svg className="v095-war-map" aria-hidden="true" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
      <g fill="none" stroke="rgba(196,158,92,.6)" strokeWidth="1.2">
        <path d="M-40,210 C220,150 420,260 640,210 S1060,120 1320,190 1560,150 1660,180" opacity=".4" />
        <path d="M-40,280 C240,230 460,330 700,276 S1120,190 1380,258 1600,220 1680,248" opacity=".3" />
        <path d="M-40,360 C300,320 560,400 840,352 S1260,270 1660,330" opacity=".2" />
        <path d="M-40,660 C260,600 480,710 760,650 S1180,560 1420,640 1620,600 1700,630" opacity=".28" />
        <path d="M-40,760 C300,720 560,800 880,744 S1300,680 1660,730" opacity=".2" />
      </g>
      <g fill="none" stroke="rgba(196,158,92,.55)" strokeWidth="1.2">
        <path d="M180,-40 C240,160 300,320 430,470 S620,720 660,950" opacity=".3" />
        <path d="M1240,-40 C1180,140 1230,300 1330,450 S1470,690 1500,950" opacity=".24" />
      </g>
      <path d="M210,720 C420,640 520,470 760,430 S1140,380 1330,300" fill="none" stroke="rgba(210,170,100,.7)" strokeWidth="1.6" strokeDasharray="10 9" opacity=".5" />
      <g fill="rgba(214,174,106,.6)">
        <circle cx="210" cy="720" r="5" />
        <circle cx="760" cy="430" r="6.5" />
        <circle cx="1330" cy="300" r="5" />
      </g>
      <g fill="none" stroke="rgba(196,158,92,.55)" strokeWidth="1.4">
        <circle cx="1432" cy="676" r="58" opacity=".4" />
        <circle cx="1432" cy="676" r="40" opacity=".28" />
        <path d="M1432,606 L1432,746 M1362,676 L1502,676" opacity=".32" />
        <path d="M1432,632 L1452,676 L1432,720 L1412,676 Z" opacity=".4" />
      </g>
      <g fill="rgba(196,158,92,.5)" fontSize="15" fontFamily="serif" opacity=".38">
        <text x="196" y="752">官渡</text>
        <text x="744" y="464">粮道</text>
        <text x="1312" y="284">袁营</text>
      </g>
    </svg>
  );
}
