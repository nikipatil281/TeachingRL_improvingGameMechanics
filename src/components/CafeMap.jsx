import React, { useMemo } from 'react';
import { createAvatar } from '@dicebear/core';
import { adventurer } from '@dicebear/collection';
import autoWalkerAssetManifest from '../generated/walker-assets.generated.js';

const seedFromString = (value) => (
    Array.from(value).reduce((seed, char, index) => seed + (char.charCodeAt(0) * (index + 1)), 0)
);

const createSeededRandom = (seed) => {
    let state = seed >>> 0;

    return () => {
        state = (1664525 * state + 1013904223) >>> 0;
        return state / 4294967296;
    };
};

const PxWrapper = ({ left, right, bottom, top, scale = 1, zIndex = 10, className = '', children, delay = 0 }) => (
    <div
        className={`absolute flex items-end justify-center ${className}`}
        style={{
            left, right, bottom, top, zIndex,
            transform: `scale(${scale})`,
            transformOrigin: bottom !== undefined ? 'bottom center' : 'top center',
            animationDelay: `${delay}s`,
            animationDuration: '4s'
        }}
    >
        {children}
    </div>
);

const getLastNumber = (value) => {
    const matches = value.match(/\d+/g);
    return matches ? Number(matches[matches.length - 1]) : 0;
};

const compareAssetPaths = (left, right) => {
    const leftNumber = getLastNumber(left);
    const rightNumber = getLastNumber(right);

    if (leftNumber !== rightNumber) {
        return leftNumber - rightNumber;
    }

    return left.localeCompare(right);
};

const WALKER_KIND_STYLES = {
    person: {
        frameBoxClass: 'w-20 h-32',
        walkDuration: 0.78,
        shadowFilter: 'drop-shadow(0px 3px 2px rgba(0,0,0,0.4))',
        baseScale: 0.42,
        durationMin: 14,
        durationRange: 2
    },
    cat: {
        frameBoxClass: 'w-12 h-12',
        walkDuration: 0.6,
        shadowFilter: 'drop-shadow(0px 2px 1.5px rgba(0,0,0,0.4))',
        baseScale: 0.56,
        durationMin: 14,
        durationRange: 2
    },
    dog: {
        frameBoxClass: 'w-14 h-14',
        walkDuration: 0.6,
        shadowFilter: 'drop-shadow(0px 2px 1.5px rgba(0,0,0,0.4))',
        baseScale: 0.62,
        durationMin: 14,
        durationRange: 2
    }
};

const buildWalkerVariants = () => {
    const lanePatternsByKind = {
        person: ['middle', 'back'],
        cat: ['frontMid', 'middle'],
        dog: ['front', 'frontMid']
    };
    const directionPatternsByKind = {
        person: [1, -1, 1],
        cat: [1, -1],
        dog: [1, -1]
    };
    const kindCounts = {
        person: 0,
        cat: 0,
        dog: 0
    };

    return autoWalkerAssetManifest
        .map((walker) => {
            const style = WALKER_KIND_STYLES[walker.kind] ?? WALKER_KIND_STYLES.person;
            const kind = walker.kind in kindCounts ? walker.kind : 'person';
            const kindIndex = kindCounts[kind];
            kindCounts[kind] += 1;
            const lanePattern = lanePatternsByKind[kind] ?? lanePatternsByKind.person;
            const directionPattern = directionPatternsByKind[kind] ?? directionPatternsByKind.person;

            return {
                ...walker,
                frames: [...walker.frames].sort(compareAssetPaths),
                laneId: lanePattern[kindIndex % lanePattern.length],
                direction: directionPattern[kindIndex % directionPattern.length],
                baseScale: style.baseScale,
                durationMin: style.durationMin,
                durationRange: style.durationRange
            };
        })
        .filter(({ frames }) => frames.length > 0);
};

const AUTO_WALKER_VARIANTS = buildWalkerVariants();

// --- Background Layers removed ---


// --- Natural Elements ---
const Cloud = ({ src = "/clouds1.png", opacity = 0.9, shadeClass = "", ...props }) => (
    <PxWrapper {...props} className={shadeClass}>
        <img
            src={src}
            alt="Cloud"
            style={{ opacity }}
            className={`w-40 h-auto object-contain pointer-events-none`}
        />
    </PxWrapper>
);

const Bird = (props) => (
    <PxWrapper {...props} className="animate-bounce">
        <div className="w-5 h-1.5 flex justify-between opacity-80">
            <div className="w-2h-1.5 bg-[#2c3e50] shadow-[1px_1px_0_rgba(0,0,0,0.3)] skew-y-12"></div>
            <div className="w-2 h-1.5 bg-[#2c3e50] shadow-[1px_1px_0_rgba(0,0,0,0.3)] -skew-y-12"></div>
        </div>
        <div className="w-2.5 h-1.5 bg-[#2c3e50] mx-auto -mt-1 shadow-[1px_1px_0_rgba(0,0,0,0.3)]"></div>
    </PxWrapper>
);

// --- Midground elements removed ---


// --- Weather Overlay Elements ---
const Rain = () => {
    const rainLines = useMemo(() => {
        const random = createSeededRandom(seedFromString('cafe-map-rain'));

        return Array.from({ length: 150 }).map((_, i) => ({
            id: i,
            left: `${random() * 120 - 10}%`,
            animationDelay: `-${random() * 2}s`,
            animationDuration: `${0.4 + random() * 0.3}s`,
            opacity: 0.2 + random() * 0.4
        }));
    }, []);

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-[45]">
            <style>
                {`
                @keyframes fall {
                    0% { transform: translate(0, -10vh) skewX(-15deg); }
                    100% { transform: translate(-20vw, 110vh) skewX(-15deg); }
                }
                `}
            </style>
            {rainLines.map((line) => (
                <div
                    key={line.id}
                    className="absolute top-0 w-[1.5px] h-20 bg-[#aed5f5]"
                    style={{
                        left: line.left,
                        opacity: line.opacity,
                        animation: `fall ${line.animationDuration} linear infinite`,
                        animationDelay: line.animationDelay
                    }}
                ></div>
            ))}
        </div>
    );
};

// --- Pixel Shadows ---
// A reusable component for jagged, pixelated shadows extending rightward
const PixelShadow = ({ width = "w-[80%]", className = "" }) => (
    <div className={`absolute bottom-[-10px] left-[15%] h-[12px] bg-black/30 z-[-1] translate-x-[20px] skew-x-[-50deg] pointer-events-none mix-blend-multiply ${width} ${className}`}>
        {/* Layered rectangles to create jagged edge */}
        <div className="absolute bottom-[100%] right-[-10px] w-6 h-[8px] bg-black/30"></div>
        <div className="absolute bottom-[200%] right-[-20px] w-8 h-[8px] bg-black/30"></div>
        <div className="absolute bottom-[300%] right-[-15px] w-4 h-[6px] bg-black/30"></div>

        <div className="absolute top-[100%] left-[10px] w-[80%] h-[10px] bg-black/30"></div>
        <div className="absolute top-[180%] left-[20px] w-[60%] h-[8px] bg-black/30"></div>
        <div className="absolute top-[260%] left-[30px] w-[40%] h-[6px] bg-black/30"></div>
        <div className="absolute top-[340%] left-[40px] w-[20%] h-[4px] bg-black/30"></div>
    </div>
);

// --- Main Buildings ---

const PlayerCafe = (props) => (
    <PxWrapper {...props} zIndex={40}>
        <div className="relative w-80 h-[300px] flex flex-col items-center justify-end group overflow-visible font-mono text-xs">
            {/* Custom shadow image (adjust bottom, left, width and opacity as needed) */}
            <img
                src="/Gemini_Generated_userShop_closed_shadow.png"
                alt="Player Shop Shadow"
                className="absolute bottom-[-3px] left-[11.3%] w-[120%] max-w-none opacity-40 pointer-events-none z-20 mix-blend-multiply"
            />

            <img
                src="/Gemini_Generated_userShop_open.png"
                alt="Player Shop"
                className="w-[90%] h-auto object-contain relative z-10"
            />
        </div>
    </PxWrapper>
);

const CompetitorCafe = (props) => (
    <PxWrapper {...props} zIndex={35}>
        <div className="relative w-80 h-[300px] flex flex-col items-center justify-end group overflow-visible font-mono text-xs">
            {/* Small shaded shadow below the shop */}
            <div className="absolute bottom-6 w-[85%] h-8 bg-black/25 rounded-[100%] blur-[6px] pointer-events-none z-0"></div>

            <img
                src="/Gemini_Generated_compShop.png"
                alt="Competitor Shop"
                className="w-full h-auto object-contain drop-shadow-xl relative z-10"
            />

            {/* LED Status Sign */}
            <div className="absolute top-[54px] left-1/2 -translate-x-1/2 w-20 h-10 bg-[#111822] border-[3px] border-[#0a0e14] flex items-center justify-center shadow-lg z-30 px-1">
                {props.isPresent ? (
                    <span className="text-[18px] text-[#4ade80] font-mono font-black uppercase tracking-wider animate-pulse drop-shadow-[0_0_6px_rgba(74,222,128,0.8)]">OPEN</span>
                ) : (
                    <span className="text-[15px] text-[#ef4444] font-mono font-black uppercase tracking-wider drop-shadow-[0_0_4px_rgba(239,68,68,0.6)]">CLOSED</span>
                )}
            </div>
        </div>
    </PxWrapper>
);

// --- Pedestrian / People Overlay Elements ---
const shadeColor = (color, percent) => {
    if (!color) return "#000";
    let hex = color.replace('#', '');
    if (hex.length === 3) hex = hex.replace(/(.)/g, '$1$1');
    let R = parseInt(hex.substring(0, 2), 16);
    let G = parseInt(hex.substring(2, 4), 16);
    let B = parseInt(hex.substring(4, 6), 16);

    R = Math.max(0, Math.min(255, R * (100 + percent) / 100 | 0));
    G = Math.max(0, Math.min(255, G * (100 + percent) / 100 | 0));
    B = Math.max(0, Math.min(255, B * (100 + percent) / 100 | 0));

    const Rstr = (R < 16 ? "0" : "") + R.toString(16);
    const Gstr = (G < 16 ? "0" : "") + G.toString(16);
    const Bstr = (B < 16 ? "0" : "") + B.toString(16);

    return `#${Rstr}${Gstr}${Bstr}`;
};

const getPixelPaths = (frames) => {
    return frames.map(frame => {
        const paths = {};
        frame.forEach((row, y) => {
            for (let x = 0; x < row.length; x++) {
                const char = row[x];
                if (char && char !== ' ') {
                    if (!paths[char]) paths[char] = [];
                    paths[char].push(`M${x},${y}h1v1h-1z`);
                }
            }
        });
        return paths;
    });
};

const manFrames = [
    [ // 1 (Contact, Right leg Forward, Right arm Back)
        "      HH      ",
        "     HHHH     ",
        "     HSSS     ",
        "      SS      ",
        "    a TTT     ",
        "   aa TTT     ",
        "   a  TTT A   ",
        "      TTT AA  ",
        "      PPP  A  ",
        "     PP pp A  ",
        "    PP   pp   ",
        "   PP    pp   ",
        "   P      p   ",
        "   P      p   ",
        "  DD      dd  ",
        "              ",
        "              ",
        "              ",
    ],
    [ // 2 (Down)
        "              ",
        "      HH      ",
        "     HHHH     ",
        "     HSSS     ",
        "      SS      ",
        "      TTT     ",
        "    a TTT A   ",
        "    aaTTTAA   ",
        "   a  PPP  A  ",
        "   a PPP pp   ",
        "     PP   p   ",
        "     P    p   ",
        "     P     pp ",
        "    DD      d ",
        "              ",
        "              ",
        "              ",
        "              ",
    ],
    [ // 3 (Pass)
        "      HH      ",
        "     HHHH     ",
        "     HSSS     ",
        "      SS      ",
        "      TTT     ",
        "      TTA     ",
        "     aTTA     ",
        "     aTTA     ",
        "      PPP     ",
        "      PPP     ",
        "      Ppp     ",
        "      Ppp     ",
        "      P pp    ",
        "     DD d     ",
        "              ",
        "              ",
        "              ",
        "              ",
    ],
    [ // 4 (Up)
        "      HH      ",
        "     HHHH     ",
        "     HSSS     ",
        "      SS      ",
        "      TTT     ",
        "     ATTa     ",
        "    AA TTa    ",
        "    A  TT a   ",
        "    A PPP a   ",
        "      PPP     ",
        "      PPp     ",
        "     P  pp    ",
        "     P  pp    ",
        "    DD   d    ",
        "              ",
        "              ",
        "              ",
        "              ",
    ],
    [ // 5 (Contact 2, Right leg Back, Right arm Forward)
        "      HH      ",
        "     HHHH     ",
        "     HSSS     ",
        "      SS      ",
        "     TTT a    ",
        "   A TTT aa   ",
        "  AA TTT  a   ",
        "  A  TTT      ",
        "  A  PPPP     ",
        "    pp  PP    ",
        "   pp    PP   ",
        "   p      PP  ",
        "   p       P  ",
        "  dd       DD ",
        "              ",
        "              ",
        "              ",
        "              ",
    ],
    [ // 6 (Down 2)
        "              ",
        "      HH      ",
        "     HHHH     ",
        "     HSSS     ",
        "      SS      ",
        "      TTT     ",
        "   A  TTT a   ",
        "   AA TTTaa   ",
        "  A  PPPP  a  ",
        "   pp PPP  a  ",
        "   p   PP     ",
        "   p    P     ",
        "  pp    P     ",
        "  d      DD   ",
        "              ",
        "              ",
        "              ",
        "              ",
    ],
    [ // 7 (Pass 2)
        "      HH      ",
        "     HHHH     ",
        "     HSSS     ",
        "      SS      ",
        "      TTT     ",
        "      ATT     ",
        "      ATTa    ",
        "      ATTa    ",
        "      PPP     ",
        "      PPP     ",
        "      ppP     ",
        "      ppP     ",
        "      pp P    ",
        "       d DD   ",
        "              ",
        "              ",
        "              ",
        "              ",
    ],
    [ // 8 (Up 2)
        "      HH      ",
        "     HHHH     ",
        "     HSSS     ",
        "      SS      ",
        "      TTT     ",
        "     aTTA     ",
        "    a TTAA    ",
        "   a  TT  A   ",
        "   a PPP  A   ",
        "      PPP     ",
        "      pPP     ",
        "    pp  P     ",
        "    pp  P     ",
        "    d   DD    ",
        "              ",
        "              ",
        "              ",
        "              ",
    ]
];

const womanFrames = [
    [ // 1
        "      HH      ",
        "     HHHH     ",
        "    HHSSS     ",
        "    H  S      ",
        "    a TTT     ",
        "   aa TTT     ",
        "   a  TTT A   ",
        "      TTT AA  ",
        "      PPP  A  ",
        "     PP pp A  ",
        "    PP   pp   ",
        "   PP    pp   ",
        "   P      p   ",
        "   P      p   ",
        "  DD      dd  ",
        "              ",
        "              ",
        "              ",
    ],
    [ // 2
        "              ",
        "      HH      ",
        "     HHHH     ",
        "    HHSSS     ",
        "    H  S      ",
        "      TTT     ",
        "    a TTT A   ",
        "    aaTTTAA   ",
        "   a  PPP  A  ",
        "   a PPP pp   ",
        "     PP   p   ",
        "     P    p   ",
        "     P     pp ",
        "    DD      d ",
        "              ",
        "              ",
        "              ",
        "              ",
    ],
    [ // 3
        "      HH      ",
        "     HHHH     ",
        "    HHSSS     ",
        "    H  S      ",
        "      TTT     ",
        "      TTA     ",
        "     aTTA     ",
        "     aTTA     ",
        "      PPP     ",
        "      PPP     ",
        "      Ppp     ",
        "      Ppp     ",
        "      P pp    ",
        "     DD d     ",
        "              ",
        "              ",
        "              ",
        "              ",
    ],
    [ // 4
        "      HH      ",
        "     HHHH     ",
        "    HHSSS     ",
        "    H  S      ",
        "      TTT     ",
        "     ATTa     ",
        "    AA TTa    ",
        "    A  TT a   ",
        "    A PPP a   ",
        "      PPP     ",
        "      PPp     ",
        "     P  pp    ",
        "     P  pp    ",
        "    DD   d    ",
        "              ",
        "              ",
        "              ",
        "              ",
    ],
    [ // 5
        "      HH      ",
        "     HHHH     ",
        "    HHSSS     ",
        "    H  S      ",
        "     TTT a    ",
        "   A TTT aa   ",
        "  AA TTT  a   ",
        "  A  TTT      ",
        "  A  PPPP     ",
        "    pp  PP    ",
        "   pp    PP   ",
        "   p      PP  ",
        "   p       P  ",
        "  dd       DD ",
        "              ",
        "              ",
        "              ",
        "              ",
    ],
    [ // 6
        "              ",
        "      HH      ",
        "     HHHH     ",
        "    HHSSS     ",
        "    H  S      ",
        "      TTT     ",
        "   A  TTT a   ",
        "   AA TTTaa   ",
        "  A  PPPP  a  ",
        "   pp PPP  a  ",
        "   p   PP     ",
        "   p    P     ",
        "  pp    P     ",
        "  d      DD   ",
        "              ",
        "              ",
        "              ",
        "              ",
    ],
    [ // 7
        "      HH      ",
        "     HHHH     ",
        "    HHSSS     ",
        "    H  S      ",
        "      TTT     ",
        "      ATT     ",
        "      ATTa    ",
        "      ATTa    ",
        "      PPP     ",
        "      PPP     ",
        "      ppP     ",
        "      ppP     ",
        "      pp P    ",
        "       d DD   ",
        "              ",
        "              ",
        "              ",
        "              ",
    ],
    [ // 8
        "      HH      ",
        "     HHHH     ",
        "    HHSSS     ",
        "    H  S      ",
        "      TTT     ",
        "     aTTA     ",
        "    a TTAA    ",
        "   a  TT  A   ",
        "   a PPP  A   ",
        "      PPP     ",
        "      pPP     ",
        "    pp  P     ",
        "    pp  P     ",
        "    d   DD    ",
        "              ",
        "              ",
        "              ",
        "              ",
    ]
];

const dogFrames = [
    [ // 1
        "          cc  ",
        "         CCCC ",
        " C      CCCCCc",
        " CC    CCCCCCS",
        " CCCCCCCCCCS  ",
        " CCCCCCCCC    ",
        " C   c  C  c  ",
        " C   c  C  c  "
    ],
    [ // intermediate
        "          cc  ",
        "         CCCC ",
        "  C     CCCCCc",
        "  CC   CCCCCCS",
        " CCCCCCCCCCS  ",
        " CCCCCCCCC    ",
        " C  c    C c  ",
        " C  c    C c  "
    ],
    [ // 2
        "          cc  ",
        "         CCCC ",
        "  C     CCCCCc",
        "  CC   CCCCCCS",
        " CCCCCCCCCCS  ",
        " CCCCCCCCC    ",
        "  c  C   c C  ",
        "  c  C   c C  "
    ],
    [ // 3
        "          cc  ",
        "         CCCC ",
        " C      CCCCCc",
        " CC    CCCCCCS",
        " CCCCCCCCCCS  ",
        " CCCCCCCCC    ",
        " c   C  c  C  ",
        " c   C  c  C  "
    ],
    [ // intermediate 2
        "          cc  ",
        "         CCCC ",
        "  C     CCCCCc",
        "  CC   CCCCCCS",
        " CCCCCCCCCCS  ",
        " CCCCCCCCC    ",
        " c C    c  C  ",
        " c C    c  C  "
    ],
    [ // 4
        "          cc  ",
        "         CCCC ",
        "  C     CCCCCc",
        "  CC   CCCCCCS",
        " CCCCCCCCCCS  ",
        " CCCCCCCCC    ",
        "  C  c   C c  ",
        "  C  c   C c  "
    ]
];

const catFrames = [
    [ // 1 apart (Low)
        "           ",
        "           ", // bob down
        "       c c ",
        "      C C C",
        " c    CCCCC",
        " cc CCCCCCC",
        "  CCCCCCCCC",
        "  C   c C  c"
    ],
    [ // 1b mid (Up)
        "           ", // bob up
        "       c c ",
        "      C C C",
        " c    CCCCC",
        "  c CCCCCCC",
        "  CCCCCCCCC",
        "  C  c  C c ",
        "            "
    ],
    [ // 2 together (Low)
        "           ",
        "           ", // bob down
        "       c c ",
        "      C C C",
        "  c   CCCCC",
        "  ccCCCCCCC",
        "   CCCCCCCC",
        "   c C   c C"
    ],
    [ // 3 reversed apart (Up)
        "           ", // bob up
        "       c c ",
        "      C C C",
        " c    CCCCC",
        " cc CCCCCCC",
        "  CCCCCCCCC",
        "  c   C  c C",
        "            "
    ],
    [ // 3b reversed mid (Low)
        "           ",
        "           ", // bob down
        "       c c ",
        "      C C C",
        " c    CCCCC",
        "  c CCCCCCC",
        "  CCCCCCCCC",
        "  c C   c  C"
    ],
    [ // 4 reversed together (Up)
        "           ", // bob up
        "       c c ",
        "      C C C",
        "  c   CCCCC",
        "  ccCCCCCCC",
        "   CCCCCCCC",
        "   C c   C c",
        "            "
    ]
];

const Pedestrian = ({
    left, bottom, scale = 1, delay = 0, zIndex = 1,
    direction = 1,
    skin = "#fcd5ce", hair = "#3e2723", shirt = "#4ade80", pants = "#1e3a8a",
    shoes = "#1f2937", hatType = "none", isWalking = true, className = "", duration = 15
}) => {
    const animId = React.useId().replace(/:/g, '');
    const startX = left ? left : (direction === 1 ? '-10%' : '110%');
    const endX = direction === 1 ? '110%' : '-10%';

    const isWoman = hatType === "longhair";
    const frames = isWoman ? womanFrames : manFrames;
    const framePaths = React.useMemo(() => getPixelPaths(frames), [frames]);

    const colorMap = {
        'H': hatType === 'cap' || hatType === 'hardhat' ? shadeColor(hair, 20) : hair,
        'h': shadeColor(hair, -20),
        'S': skin,
        's': shadeColor(skin, -20),
        'T': shirt,
        't': shadeColor(shirt, -20),
        'A': shadeColor(shirt, -30),
        'a': shadeColor(shirt, -50),
        'P': pants,
        'p': shadeColor(pants, -20),
        'D': shoes,
        'd': shadeColor(shoes, -20)
    };

    if (hatType === 'cap') {
        colorMap['H'] = '#1f2937';
        colorMap['h'] = '#111827';
    } else if (hatType === 'hardhat') {
        colorMap['H'] = '#f59e0b';
        colorMap['h'] = '#d97706';
    }

    const frameCount = frames.length;
    const walkDuration = 1.2;
    const framePct = 100 / frameCount;

    return (
        <div
            className={`absolute flex items-end justify-center ${className}`}
            style={{
                left: startX, bottom, zIndex,
                transform: `scale(${scale * direction}, ${scale})`,
                transformOrigin: 'bottom center',
                animation: `walkAcross_${animId} ${duration}s linear infinite`,
                animationDelay: `${delay}s`
            }}
        >
            <style>
                {`
                @keyframes walkAcross_${animId} {
                    from { left: ${startX}; }
                    to { left: ${endX}; }
                }
                .sprite-frame-${animId} { opacity: 0; }
                @keyframes sprite-play-${animId} {
                    0%, ${framePct - 0.0001}% { opacity: 1; }
                    ${framePct}%, 100% { opacity: 0; }
                }
                `}
            </style>

            <svg
                width="54" height="54"
                viewBox="0 0 14 18"
                style={{
                    overflow: 'visible',
                    shapeRendering: 'crispEdges',
                    filter: "drop-shadow(0px 3px 2px rgba(0,0,0,0.4))"
                }}
            >
                {framePaths.map((paths, idx) => (
                    <g key={idx} className={isWalking ? `sprite-frame-${animId}` : ''} style={isWalking ? {
                        animation: `sprite-play-${animId} ${walkDuration}s infinite`,
                        animationDelay: `-${delay + (frameCount - idx) * (walkDuration / frameCount)}s`
                    } : { opacity: idx === 0 ? 1 : 0 }}>
                        {Object.entries(paths).map(([char, dArray]) => (
                            <path key={char} d={dArray.join('')} fill={colorMap[char]} />
                        ))}
                    </g>
                ))}
            </svg>
        </div >
    );
};

const Pet = ({
    left, bottom, scale = 1, delay = 0, zIndex = 1,
    direction = 1, duration = 15, type = "dog"
}) => {
    const animId = React.useId().replace(/:/g, '');
    const startX = left ? left : (direction === 1 ? '-10%' : '110%');
    const endX = direction === 1 ? '110%' : '-10%';

    const frames = type === "dog" ? dogFrames : catFrames;
    const framePaths = React.useMemo(() => getPixelPaths(frames), [frames]);

    const baseColor = type === "dog" ? "#d97706" : "#4b5563";
    const highlightColor = type === "dog" ? shadeColor(baseColor, 15) : shadeColor(baseColor, 15);
    const snoutColor = type === "dog" ? "#fcd34d" : baseColor;

    const colorMap = {
        'C': highlightColor,
        'c': shadeColor(baseColor, -20),
        'S': snoutColor
    };

    const frameCount = frames.length;
    const walkDuration = type === "dog" ? 0.9 : 0.75;
    const framePct = 100 / frameCount;

    return (
        <div
            className="absolute flex items-end justify-center"
            style={{
                left: startX, bottom, zIndex,
                transform: `scale(${scale * direction}, ${scale})`,
                transformOrigin: 'bottom center',
                animation: `walkAcross_${animId} ${duration}s linear infinite`,
                animationDelay: `${delay}s`
            }}
        >
            <style>
                {`
                @keyframes walkAcross_${animId} {
                    from { left: ${startX}; }
                    to { left: ${endX}; }
                }
                .sprite-frame-${animId} { opacity: 0; }
                @keyframes sprite-play-${animId} {
                    0%, ${framePct - 0.0001}% { opacity: 1; }
                    ${framePct}%, 100% { opacity: 0; }
                }
                `}
            </style>
            <svg
                width="34" height="26"
                viewBox="0 0 14 10"
                style={{
                    overflow: 'visible',
                    shapeRendering: 'crispEdges',
                    filter: "drop-shadow(0px 2px 2px rgba(0,0,0,0.4))"
                }}
            >
                {framePaths.map((paths, idx) => (
                    <g key={idx} className={`sprite-frame-${animId}`} style={{
                        animation: `sprite-play-${animId} ${walkDuration}s infinite`,
                        animationDelay: `-${delay + (frameCount - idx) * (walkDuration / frameCount)}s`
                    }}>
                        {Object.entries(paths).map(([char, dArray]) => (
                            <path key={char} d={dArray.join('')} fill={colorMap[char]} />
                        ))}
                    </g>
                ))}
            </svg>
        </div >
    );
};

const Cyclist = ({
    left, bottom, scale = 1, delay = 0, zIndex = 1,
    direction = 1, duration = 8, shirt = "#ef4444"
}) => {
    const animId = React.useId().replace(/:/g, '');
    const startX = left ? left : (direction === 1 ? '-10%' : '110%');
    const endX = direction === 1 ? '110%' : '-10%';

    return (
        <div
            className={`absolute flex items-end justify-center`}
            style={{
                left: startX, bottom, zIndex,
                transform: `scale(${scale})`,
                transformOrigin: 'bottom center',
                animation: `walkAcross${animId} ${duration}s linear infinite`,
                animationDelay: `${delay}s`
            }}
        >
            <style>
                {`
                @keyframes walkAcross${animId} {
                    from { left: ${startX}; }
                    to { left: ${endX}; }
                }
                .wheel-spin { animation: spin 0.5s linear infinite; transform-origin: center center; }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                `}
            </style>
            <svg
                width="48" height="48"
                viewBox="0 0 24 24"
                className={`${direction === -1 ? '-scale-x-100' : ''}`}
                style={{
                    overflow: 'visible',
                    shapeRendering: 'crispEdges',
                    filter: "drop-shadow(0px 4px 3px rgba(0,0,0,0.4))"
                }}
            >
                {/* Wheels */}
                <g className="wheel-spin" style={{ transformOrigin: "6px 18px" }}>
                    <circle cx="6" cy="18" r="4" fill="transparent" stroke="#374151" strokeWidth="1.5" />
                    <line x1="6" y1="14" x2="6" y2="22" stroke="#9ca3af" strokeWidth="0.5" />
                    <line x1="2" y1="18" x2="10" y2="18" stroke="#9ca3af" strokeWidth="0.5" />
                </g>
                <g className="wheel-spin" style={{ transformOrigin: "18px 18px" }}>
                    <circle cx="18" cy="18" r="4" fill="transparent" stroke="#374151" strokeWidth="1.5" />
                    <line x1="18" y1="14" x2="18" y2="22" stroke="#9ca3af" strokeWidth="0.5" />
                    <line x1="14" y1="18" x2="22" y2="18" stroke="#9ca3af" strokeWidth="0.5" />
                </g>

                {/* Bike Frame */}
                <line x1="6" y1="18" x2="10" y2="12" stroke="#eab308" strokeWidth="1.5" />
                <line x1="10" y1="12" x2="16" y2="12" stroke="#eab308" strokeWidth="1.5" />
                <line x1="16" y1="12" x2="18" y2="18" stroke="#eab308" strokeWidth="1.5" />
                <line x1="6" y1="18" x2="16" y2="12" stroke="#eab308" strokeWidth="1.5" />

                {/* Handlebar & Seat */}
                <line x1="16" y1="12" x2="15" y2="9" stroke="#d1d5db" strokeWidth="1.5" />
                <rect x="14" y="8" width="3" height="1" fill="#111827" />
                <line x1="10" y1="12" x2="9" y2="10" stroke="#d1d5db" strokeWidth="1.5" />
                <rect x="7" y="9" width="4" height="2" fill="#111827" rx="1" />

                {/* Rider */}
                {/* Torso leaning forward */}
                <rect x="8" y="4" width="6" height="6" fill={shirt} transform="rotate(30 11 7)" />
                {/* Arm reaching for handlebar */}
                <line x1="11" y1="6" x2="15" y2="8" stroke={shirt} strokeWidth="2" />
                {/* Leg on pedal */}
                <line x1="10" y1="10" x2="12" y2="15" stroke="#1e3a8a" strokeWidth="2.5" />
                <line x1="12" y1="15" x2="14" y2="17" stroke="#fbbf24" strokeWidth="1" /> {/* Calf */}
                {/* Head */}
                <rect x="12" y="2" width="4" height="4" fill="#fcd5ce" />
                <rect x="12" y="1" width="4" height="2" fill="#3b82f6" /> {/* Helmet */}
            </svg>
        </div>
    );
};

const ImagePedestrian = ({
    left, bottom, scale = 1, delay = 0, zIndex = 1,
    direction = 1, duration = 15, className = ""
}) => {
    const animId = React.useId().replace(/:/g, '');
    const startX = left ? left : (direction === 1 ? '-10%' : '110%');
    const endX = direction === 1 ? '110%' : '-10%';

    const frames = [
        "/person1/Gemini_Generated_person1_1.png",
        "/person1/Gemini_Generated_person1_2.png",
        "/person1/Gemini_Generated_person1_3.png",
        "/person1/Gemini_Generated_person1_4.png",
        "/person1/Gemini_Generated_person1_5.png",
    ];

    const frameCount = frames.length;
    const walkDuration = 0.75; // Slightly faster for 5 frames
    const framePct = 100 / frameCount;

    return (
        <div
            className={`absolute flex items-end justify-center ${className}`}
            style={{
                left: startX, bottom, zIndex,
                transform: `scale(${scale * direction}, ${scale})`,
                transformOrigin: 'bottom center',
                animation: `walkAcrossImg_${animId} ${duration}s linear infinite both`,
                animationDelay: `${delay}s`
            }}
        >
            <style>
                {`
                @keyframes walkAcrossImg_${animId} {
                    from { left: ${startX}; }
                    to { left: ${endX}; }
                }
                .img-frame-${animId} { opacity: 0; position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); }
                @keyframes img-play-${animId} {
                    0%, ${framePct + 2}% { opacity: 1; }
                    ${framePct + 2.1}%, 100% { opacity: 0; }
                }
                `}
            </style>

            <div className="relative w-20 h-32">
                {frames.map((src, idx) => (
                    <img
                        key={idx}
                        src={src}
                        alt={`Walking frame ${idx + 1}`}
                        className={`img-frame-${animId} w-full h-auto object-contain pointer-events-none`}
                        style={{
                            animation: `img-play-${animId} ${walkDuration}s infinite`,
                            animationDelay: `-${idx * (walkDuration / frameCount)}s`,
                            filter: "drop-shadow(0px 3px 2px rgba(0,0,0,0.4))"
                        }}
                    />
                ))}
            </div>
        </div>
    );
};

const ImagePet = ({
    left, bottom, scale = 1, delay = 0, zIndex = 1,
    direction = 1, duration = 15, className = ""
}) => {
    const animId = React.useId().replace(/:/g, '');
    const startX = left ? left : (direction === 1 ? '-10%' : '110%');
    const endX = direction === 1 ? '110%' : '-10%';

    const frames = [
        "/cat1/Gemini_Generated_cat1_1.png",
        "/cat1/Gemini_Generated_cat1_2.png",
        "/cat1/Gemini_Generated_cat1_3.png",
        "/cat1/Gemini_Generated_cat1_4.png",
        "/cat1/Gemini_Generated_cat1_5.png"
    ];

    const frameCount = frames.length;
    const walkDuration = 0.6;
    const framePct = 100 / frameCount;

    return (
        <div
            className={`absolute flex items-end justify-center ${className}`}
            style={{
                left: startX, bottom, zIndex,
                transform: `scale(${scale * direction}, ${scale})`,
                transformOrigin: 'bottom center',
                animation: `walkAcrossImgPet_${animId} ${duration}s linear infinite both`,
                animationDelay: `${delay}s`
            }}
        >
            <style>
                {`
                @keyframes walkAcrossImgPet_${animId} {
                    from { left: ${startX}; }
                    to { left: ${endX}; }
                }
                .img-pet-frame-${animId} { opacity: 0; position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); }
                @keyframes img-pet-play-${animId} {
                    0%, ${framePct + 2}% { opacity: 1; }
                    ${framePct + 2.1}%, 100% { opacity: 0; }
                }
                `}
            </style>

            <div className="relative w-12 h-12">
                {frames.map((src, idx) => (
                    <img
                        key={idx}
                        src={src}
                        alt={`Walking frame ${idx + 1}`}
                        className={`img-pet-frame-${animId} w-full h-auto object-contain pointer-events-none`}
                        style={{
                            animation: `img-pet-play-${animId} ${walkDuration}s infinite`,
                            animationDelay: `-${idx * (walkDuration / frameCount)}s`,
                            filter: "drop-shadow(0px 2px 1.5px rgba(0,0,0,0.4))"
                        }}
                    />
                ))}
            </div>
        </div>
    );
};

const ImageDog = ({
    left, bottom, scale = 1, delay = 0, zIndex = 1,
    direction = 1, duration = 15, className = ""
}) => {
    const animId = React.useId().replace(/:/g, '');
    const startX = left ? left : (direction === 1 ? '-10%' : '110%');
    const endX = direction === 1 ? '110%' : '-10%';

    const frames = [
        "/dog1/Gemini_Generated_dog1_1.png",
        "/dog1/Gemini_Generated_dog1_2.png",
        "/dog1/Gemini_Generated_dog1_3.png",
        "/dog1/Gemini_Generated_dog1_4.png"
    ];

    const frameCount = frames.length;
    const walkDuration = 0.6;
    const framePct = 100 / frameCount;

    return (
        <div
            className={`absolute flex items-end justify-center ${className}`}
            style={{
                left: startX, bottom, zIndex,
                transform: `scale(${scale * direction}, ${scale})`,
                transformOrigin: 'bottom center',
                animation: `walkAcrossImgDog_${animId} ${duration}s linear infinite both`,
                animationDelay: `${delay}s`
            }}
        >
            <style>
                {`
                @keyframes walkAcrossImgDog_${animId} {
                    from { left: ${startX}; }
                    to { left: ${endX}; }
                }
                .img-dog-frame-${animId} { opacity: 0; position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); }
                @keyframes img-dog-play-${animId} {
                    0%, ${framePct + 2}% { opacity: 1; }
                    ${framePct + 2.1}%, 100% { opacity: 0; }
                }
                `}
            </style>

            <div className="relative w-14 h-14">
                {frames.map((src, idx) => (
                    <img
                        key={idx}
                        src={src}
                        alt={`Walking frame ${idx + 1}`}
                        className={`img-dog-frame-${animId} w-full h-auto object-contain pointer-events-none`}
                        style={{
                            animation: `img-dog-play-${animId} ${walkDuration}s infinite`,
                            animationDelay: `-${idx * (walkDuration / frameCount)}s`,
                            filter: "drop-shadow(0px 2px 1.5px rgba(0,0,0,0.4))"
                        }}
                    />
                ))}
            </div>
        </div>
    );
};

const ImagePedestrian2 = ({
    left, bottom, scale = 1, delay = 0, zIndex = 1,
    direction = 1, duration = 15, className = ""
}) => {
    const animId = React.useId().replace(/:/g, '');
    const startX = left ? left : (direction === 1 ? '-10%' : '110%');
    const endX = direction === 1 ? '110%' : '-10%';

    const frames = [
        "/person2/Gemini_Generated_person2_1.png",
        "/person2/Gemini_Generated_person2_2.png",
        "/person2/Gemini_Generated_person2_3.png",
        "/person2/Gemini_Generated_person2_4.png",
        "/person2/Gemini_Generated_person2_5.png"
    ];

    const frameCount = frames.length;
    const walkDuration = 0.8;
    const framePct = 100 / frameCount;

    return (
        <div
            className={`absolute flex items-end justify-center ${className}`}
            style={{
                left: startX, bottom, zIndex,
                transform: `scale(${scale * direction}, ${scale})`,
                transformOrigin: 'bottom center',
                animation: `walkAcrossImg2_${animId} ${duration}s linear infinite both`,
                animationDelay: `${delay}s`
            }}
        >
            <style>
                {`
                @keyframes walkAcrossImg2_${animId} {
                    from { left: ${startX}; }
                    to { left: ${endX}; }
                }
                .img-frame2-${animId} { opacity: 0; position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); }
                @keyframes img-play2-${animId} {
                    0%, ${framePct + 2}% { opacity: 1; }
                    ${framePct + 2.1}%, 100% { opacity: 0; }
                }
                `}
            </style>

            <div className="relative w-20 h-32">
                {frames.map((src, idx) => (
                    <img
                        key={idx}
                        src={src}
                        alt={`Walking frame ${idx + 1}`}
                        className={`img-frame2-${animId} w-full h-auto object-contain pointer-events-none`}
                        style={{
                            animation: `img-play2-${animId} ${walkDuration}s infinite`,
                            animationDelay: `-${idx * (walkDuration / frameCount)}s`,
                            filter: "drop-shadow(0px 3px 2px rgba(0,0,0,0.4))"
                        }}
                    />
                ))}
            </div>
        </div>
    );
};

const ImagePedestrian3 = ({
    left, bottom, scale = 1, delay = 0, zIndex = 1,
    direction = 1, duration = 15, className = ""
}) => {
    const animId = React.useId().replace(/:/g, '');
    const startX = left ? left : (direction === 1 ? '-10%' : '110%');
    const endX = direction === 1 ? '110%' : '-10%';

    const frames = [
        "/person3/Gemini_Generated_person3_1.png",
        "/person3/Gemini_Generated_person3_2.png",
        "/person3/Gemini_Generated_person3_3.png",
        "/person3/Gemini_Generated_person3_4.png",
        "/person3/Gemini_Generated_person3_5.png"
    ];

    const frameCount = frames.length;
    const walkDuration = 0.8;
    const framePct = 100 / frameCount;

    return (
        <div
            className={`absolute flex items-end justify-center ${className}`}
            style={{
                left: startX, bottom, zIndex,
                transform: `scale(${scale * direction}, ${scale})`,
                transformOrigin: 'bottom center',
                animation: `walkAcrossImg3_${animId} ${duration}s linear infinite both`,
                animationDelay: `${delay}s`
            }}
        >
            <style>
                {`
                @keyframes walkAcrossImg3_${animId} {
                    from { left: ${startX}; }
                    to { left: ${endX}; }
                }
                .img-frame3-${animId} { opacity: 0; position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); }
                @keyframes img-play3-${animId} {
                    0%, ${framePct + 2}% { opacity: 1; }
                    ${framePct + 2.1}%, 100% { opacity: 0; }
                }
                `}
            </style>

            <div className="relative w-20 h-32">
                {frames.map((src, idx) => (
                    <img
                        key={idx}
                        src={src}
                        alt={`Walking frame ${idx + 1}`}
                        className={`img-frame3-${animId} w-full h-auto object-contain pointer-events-none`}
                        style={{
                            animation: `img-play3-${animId} ${walkDuration}s infinite`,
                            animationDelay: `-${idx * (walkDuration / frameCount)}s`,
                            filter: "drop-shadow(0px 3px 2px rgba(0,0,0,0.4))"
                        }}
                    />
                ))}
            </div>
        </div>
    );
};

const ImagePedestrian4 = ({
    left, bottom, scale = 1, delay = 0, zIndex = 1,
    direction = 1, duration = 15, className = ""
}) => {
    const animId = React.useId().replace(/:/g, '');
    const startX = left ? left : (direction === 1 ? '-10%' : '110%');
    const endX = direction === 1 ? '110%' : '-10%';

    const frames = [
        "/person4/Gemini_Generated_person2_1.png",
        "/person4/Gemini_Generated_person2_2.png",
        "/person4/Gemini_Generated_person2_4.png",
        "/person4/Gemini_Generated_person2_6.png"
    ];

    const frameCount = frames.length;
    const walkDuration = 0.72;
    const framePct = 100 / frameCount;

    return (
        <div
            className={`absolute flex items-end justify-center ${className}`}
            style={{
                left: startX, bottom, zIndex,
                transform: `scale(${scale * direction}, ${scale})`,
                transformOrigin: 'bottom center',
                animation: `walkAcrossImg4_${animId} ${duration}s linear infinite both`,
                animationDelay: `${delay}s`
            }}
        >
            <style>
                {`
                @keyframes walkAcrossImg4_${animId} {
                    from { left: ${startX}; }
                    to { left: ${endX}; }
                }
                .img-frame4-${animId} { opacity: 0; position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); }
                @keyframes img-play4-${animId} {
                    0%, ${framePct + 2}% { opacity: 1; }
                    ${framePct + 2.1}%, 100% { opacity: 0; }
                }
                `}
            </style>

            <div className="relative w-20 h-32">
                {frames.map((src, idx) => (
                    <img
                        key={idx}
                        src={src}
                        alt={`Walking frame ${idx + 1}`}
                        className={`img-frame4-${animId} w-full h-auto object-contain pointer-events-none`}
                        style={{
                            animation: `img-play4-${animId} ${walkDuration}s infinite`,
                            animationDelay: `-${idx * (walkDuration / frameCount)}s`,
                            filter: "drop-shadow(0px 3px 2px rgba(0,0,0,0.4))"
                        }}
                    />
                ))}
            </div>
        </div>
    );
};

const ImagePedestrian5 = ({
    left, bottom, scale = 1, delay = 0, zIndex = 1,
    direction = 1, duration = 15, className = ""
}) => {
    const animId = React.useId().replace(/:/g, '');
    const startX = left ? left : (direction === 1 ? '-10%' : '110%');
    const endX = direction === 1 ? '110%' : '-10%';

    const frames = [
        "/person5/Gemini_Generated_person5_1.png",
        "/person5/Gemini_Generated_person5_2.png",
        "/person5/Gemini_Generated_person5_3.png",
        "/person5/Gemini_Generated_person5_4.png",
        "/person5/Gemini_Generated_person5_5.png"
    ];

    const frameCount = frames.length;
    const walkDuration = 0.78;
    const framePct = 100 / frameCount;

    return (
        <div
            className={`absolute flex items-end justify-center ${className}`}
            style={{
                left: startX, bottom, zIndex,
                transform: `scale(${scale * direction}, ${scale})`,
                transformOrigin: 'bottom center',
                animation: `walkAcrossImg5_${animId} ${duration}s linear infinite both`,
                animationDelay: `${delay}s`
            }}
        >
            <style>
                {`
                @keyframes walkAcrossImg5_${animId} {
                    from { left: ${startX}; }
                    to { left: ${endX}; }
                }
                .img-frame5-${animId} { opacity: 0; position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); }
                @keyframes img-play5-${animId} {
                    0%, ${framePct + 2}% { opacity: 1; }
                    ${framePct + 2.1}%, 100% { opacity: 0; }
                }
                `}
            </style>

            <div className="relative w-20 h-32">
                {frames.map((src, idx) => (
                    <img
                        key={idx}
                        src={src}
                        alt={`Walking frame ${idx + 1}`}
                        className={`img-frame5-${animId} w-full h-auto object-contain pointer-events-none`}
                        style={{
                            animation: `img-play5-${animId} ${walkDuration}s infinite`,
                            animationDelay: `-${idx * (walkDuration / frameCount)}s`,
                            filter: "drop-shadow(0px 3px 2px rgba(0,0,0,0.4))"
                        }}
                    />
                ))}
            </div>
        </div>
    );
};

const ImageWalker = ({
    frames, kind, left, bottom, scale = 1, delay = 0, zIndex = 1,
    direction = 1, duration = 15, className = ""
}) => {
    const animId = React.useId().replace(/:/g, '');
    const startX = left ? left : (direction === 1 ? '-10%' : '110%');
    const endX = direction === 1 ? '110%' : '-10%';
    const frameCount = frames.length;
    const framePct = 100 / frameCount;
    const walkerStyle = WALKER_KIND_STYLES[kind] ?? WALKER_KIND_STYLES.person;

    if (frameCount === 0) {
        return null;
    }

    return (
        <div
            className={`absolute flex items-end justify-center ${className}`}
            style={{
                left: startX, bottom, zIndex,
                transform: `scale(${scale * direction}, ${scale})`,
                transformOrigin: 'bottom center',
                animation: `walkAcrossAuto_${animId} ${duration}s linear infinite both`,
                animationDelay: `${delay}s`
            }}
        >
            <style>
                {`
                @keyframes walkAcrossAuto_${animId} {
                    from { left: ${startX}; }
                    to { left: ${endX}; }
                }
                .img-auto-frame-${animId} { opacity: 0; position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); }
                @keyframes img-auto-play-${animId} {
                    0%, ${framePct + 2}% { opacity: 1; }
                    ${framePct + 2.1}%, 100% { opacity: 0; }
                }
                `}
            </style>

            <div className={`relative ${walkerStyle.frameBoxClass}`}>
                {frames.map((src, idx) => (
                    <img
                        key={src}
                        src={src}
                        alt={`${kind} walking frame ${idx + 1}`}
                        className={`img-auto-frame-${animId} w-full h-auto object-contain pointer-events-none`}
                        style={{
                            animation: `img-auto-play-${animId} ${walkerStyle.walkDuration}s infinite`,
                            animationDelay: `-${idx * (walkerStyle.walkDuration / frameCount)}s`,
                            filter: walkerStyle.shadowFilter
                        }}
                    />
                ))}
            </div>
        </div>
    );
};

// Bottom baselines for the walking lanes.
// Move these `bottom` values if you want to manually raise/lower each invisible line.
const WALK_LANES = [
    { id: 'front', bottom: '-50%', scaleMultiplier: 1.2, zIndex: 60 },
    { id: 'frontMid', bottom: '-25%', scaleMultiplier: 1.1, zIndex: 59 },
    { id: 'middle', bottom: '0%', scaleMultiplier: 1.0, zIndex: 58 },
    { id: 'back', bottom: '16%', scaleMultiplier: 1.0, zIndex: 56 },
];

const PedestriansLayer = ({ children }) => (




    <div id="pedestrians-layer" className="absolute bottom-[7%] w-full h-[11%] z-[55] pointer-events-none">
        {children}
    </div>
);

// --- Main Component Assembly ---

const CafeMap = ({ weather = "Sunny", competitorPresent = true, userAvatar = 'Leo' }) => {
    const isCloudy = weather === "Cloudy" || weather === "Rainy";
    const isRainy = weather === "Rainy";
    const isSunny = weather === "Sunny";

    const avatarUri = useMemo(() => {
        return createAvatar(adventurer, {
            seed: userAvatar,
            // adding nice subtle radius for styling just in case, though the parent div handles rounding
            radius: 50,
            backgroundColor: ['b6e3f4', 'c0aede', 'd1d4f9', 'ffd5dc', 'ffdfbf']
        }).toDataUri();
    }, [userAvatar]);

    return (
        <div className="w-full h-full bg-[#cbf2ff] relative overflow-hidden flex flex-col font-mono select-none">

            {/* Main Background Image */}
            <img
                src="/Gemini_Generated_background.png"
                alt="Retro Game Background"
                className="absolute inset-0 w-full h-full object-cover z-0"
            />

            {/* Interactive Clouds Layer (Keep behind foreground elements) */}
            <div className="absolute inset-0 z-[5] pointer-events-none">
                {/* --- Aesthetic Sunny Sky Base (Curated Clusters) --- */}
                {/* Extreme Edges (Off-frame volume and shading) */}
                <Cloud src="/clouds2.png" scale={0.9} top="3%" left="-15%" opacity={0.6} shadeClass="brightness-95 sepia-[.05]" />
                <Cloud src="/clouds1.png" scale={0.7} top="7%" left="-25%" opacity={0.5} shadeClass="brightness-90 sepia-[.05]" />

                <Cloud src="/clouds1.png" scale={0.8} top="5%" right="-18%" opacity={0.6} shadeClass="brightness-95 sepia-[.05]" />
                <Cloud src="/clouds3.png" scale={0.6} top="8%" right="-22%" opacity={0.5} shadeClass="brightness-90 sepia-[.05]" />

                {/* Long Cloud Left */}
                <Cloud src="/clouds1.png" scale={0.65} top="1%" left="2%" opacity={0.85} shadeClass="brightness-[0.98]" />
                <Cloud src="/clouds1.png" scale={0.55} top="2%" left="10%" opacity={0.85} />
                <Cloud src="/clouds3.png" scale={0.45} top="4%" left="18%" opacity={0.6} shadeClass="brightness-[0.96]" />

                {/* Long Cloud Mid */}
                <Cloud src="/clouds2.png" scale={0.75} top="4%" left="45%" opacity={0.8} shadeClass="brightness-[0.97]" />
                <Cloud src="/clouds1.png" scale={0.55} top="5%" left="38%" opacity={0.8} />
                <Cloud src="/clouds2.png" scale={0.65} top="3%" left="53%" opacity={0.7} shadeClass="brightness-[0.95]" />

                {/* Long Cloud Right */}
                <Cloud src="/clouds1.png" scale={0.7} top="0%" right="2%" opacity={0.9} />
                <Cloud src="/clouds1.png" scale={0.6} top="1%" right="10%" opacity={0.8} shadeClass="brightness-[0.96]" />

                {/* Scatter Whisps for Depth */}
                <Cloud src="/clouds4.png" top="4%" left="28%" scale={0.4} opacity={0.4} delay={1.2} shadeClass="brightness-95" />
                <Cloud src="/clouds3.png" top="3%" right="35%" scale={0.4} opacity={0.4} delay={3.5} />
                <Cloud src="/clouds4.png" top="1%" right="20%" scale={0.5} opacity={0.5} delay={2.1} shadeClass="brightness-90" />

                {/* --- Weather Dependent Layer --- */}
                {!isSunny && (
                    <>
                        {/* Populate more if not sunny (Moved Even Higher) */}
                        {/* Extreme Edge Volume for Cloudy/Rainy */}
                        <Cloud src="/clouds1.png" scale={2.5} top="-12%" left="-28%" opacity={0.8} shadeClass="brightness-90 sepia-[.05]" />
                        <Cloud src="/clouds2.png" scale={2.2} top="-2%" left="-18%" opacity={0.7} shadeClass="brightness-[0.85] sepia-[.05]" />

                        <Cloud src="/clouds1.png" scale={2.5} top="-5%" right="-30%" opacity={0.75} shadeClass="brightness-90 sepia-[.05]" />
                        <Cloud src="/clouds4.png" scale={1.8} top="2%" right="-20%" opacity={0.65} shadeClass="brightness-[0.85] sepia-[.05]" />

                        {/* Extra Volume Top Left for Cloudy/Rainy */}
                        <Cloud src="/clouds1.png" scale={1.8} top="-4%" left="10%" opacity={0.95} />
                        <Cloud src="/clouds2.png" scale={1.6} top="-1%" left="15%" opacity={0.95} shadeClass="brightness-[0.95]" />
                        <Cloud src="/clouds1.png" scale={1.5} top="-5%" left="22%" opacity={0.8} shadeClass="brightness-[0.92]" />
                        <Cloud src="/clouds4.png" scale={1.2} top="-7%" left="18%" opacity={0.6} />

                        {/* Heavy Cluster Left - Lower (Moved Even Higher) */}
                        <Cloud src="/clouds2.png" scale={1.3} top="3%" left="18%" opacity={0.85} shadeClass="brightness-[0.96]" />
                        <Cloud src="/clouds1.png" scale={0.9} top="6%" left="24%" opacity={0.85} />

                        {/* Heavy Overcast Cluster - Center/Right (Moved Up) */}
                        <Cloud src="/clouds1.png" scale={1.6} top="4%" left="60%" opacity={0.8} shadeClass="brightness-[0.95]" />
                        <Cloud src="/clouds2.png" scale={1.2} top="3%" left="56%" opacity={0.8} shadeClass="brightness-[0.92]" />

                        {/* Fill gaps (Moved Up) */}
                        <Cloud src="/clouds1.png" top="-5%" left="85%" scale={1.5} delay={1} opacity={0.6} shadeClass="brightness-[0.95]" />
                        <Cloud src="/clouds3.png" top="4%" left="40%" scale={1.2} delay={2.3} opacity={0.8} shadeClass="brightness-[0.98]" />
                        <Cloud src="/clouds4.png" top="8%" right="2%" scale={1.0} delay={3.1} opacity={0.7} />

                        {/* Heavy Overcast for Rainy (Moved Even Higher) */}
                        {isRainy && (
                            <>
                                <Cloud src="/clouds1.png" top="-19%" left="18%" scale={2.8} opacity={0.45} shadeClass="brightness-90 sepia-[.05]" />
                                <Cloud src="/clouds1.png" top="-19%" right="18%" scale={2.8} opacity={0.45} shadeClass="brightness-[0.85] sepia-[.05]" />

                                <Cloud src="/clouds2.png" scale={2.0} top="-1%" left="50%" opacity={0.65} shadeClass="brightness-[0.95]" />
                                <Cloud src="/clouds4.png" scale={1.4} top="3%" left="44%" opacity={0.65} />
                                <Cloud src="/clouds1.png" scale={1.5} top="-3%" left="55%" opacity={0.5} shadeClass="brightness-[0.92]" />

                                <Cloud src="/clouds3.png" top="-7%" left="60%" scale={2.2} delay={0.5} opacity={0.6} shadeClass="brightness-90" />
                            </>
                        )}
                    </>
                )}
            </div>


            {/* Main Subject: The Shops! */}
            {/* Adjusted bottom to 12% to sit on the sidewalk, cleared from trees */}
            <CompetitorCafe left="3%" bottom="8%" scale={0.65} isPresent={competitorPresent} />
            <PlayerCafe right="3%" bottom="12%" scale={0.75} />

            {/* Pedestrians overlay accurately positioned on the footpath */}
            <PedestriansLayer>
                {useMemo(() => {
                    // Seedable random generator for consistent crowd per state
                    const cyrb128 = (str) => {
                        let h1 = 1779033703, h2 = 3144134277,
                            h3 = 1013904242, h4 = 2773480762;
                        for (let i = 0, k; i < str.length; i++) {
                            k = str.charCodeAt(i);
                            h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
                            h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
                            h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
                            h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
                        }
                        return [(h1 ^ h2 ^ h3 ^ h4) >>> 0, (h2 ^ h1) >>> 0, (h3 ^ h1) >>> 0, (h4 ^ h1) >>> 0];
                    }
                    const sfc32 = (a, b, c, d) => {
                        return function () {
                            a |= 0; b |= 0; c |= 0; d |= 0;
                            let t = (a + b | 0) + d | 0;
                            d = d + 1 | 0;
                            a = b ^ b >>> 9;
                            b = c + (c << 3) | 0;
                            c = (c << 21 | c >>> 11);
                            c = c + t | 0;
                            return (t >>> 0) / 4294967296;
                        }
                    }

                    // Add unique seed parameters to change the crowd when weather, events or competitor standing changes
                    const rand = sfc32(...cyrb128(`crowd_${weather}_${competitorPresent ? "comp_y" : "comp_n"}_someEvent`));

                    return AUTO_WALKER_VARIANTS.map((walker, i) => {
                        const lane = WALK_LANES.find(({ id }) => id === walker.laneId) ?? WALK_LANES[0];
                        const scaleVariance = 0.96 + rand() * 0.08;
                        const delay = i * 0.9 + rand() * 0.25;
                        const duration = walker.durationMin + rand() * walker.durationRange;

                        return (
                            <ImageWalker
                                key={walker.id}
                                frames={walker.frames}
                                kind={walker.kind}
                                bottom={lane.bottom}
                                scale={walker.baseScale * lane.scaleMultiplier * scaleVariance}
                                direction={walker.direction}
                                delay={delay}
                                duration={duration}
                                zIndex={lane.zIndex}
                            />
                        );
                    });
                }, [weather, competitorPresent])}
            </PedestriansLayer>

            {/* Weather Overlay System */}
            {isRainy && <Rain />}

            {/* Global Weather Lighting Tint */}
            <div className={`absolute inset-0 pointer-events-none z-[48] transition-colors duration-1000 ${isRainy ? 'bg-[#1a2f42]/40 mix-blend-multiply' :
                isCloudy ? 'bg-[#708090]/25 mix-blend-multiply' :
                    'bg-transparent'
                }`}></div>

            {/* Player Avatar Placeholder */}
            {/* Sits over everything inside bottom-right corner */}
            <div className="absolute bottom-3 right-3 w-16 h-16 bg-white/40 rounded-full border-[3px] border-white/60 shadow-lg z-[60] backdrop-blur-sm flex items-center justify-center overflow-hidden">
                <img src={avatarUri} alt="Player Avatar" className="w-full h-full object-cover" />
            </div>

            {/* Overall Retro Filter (reduces harshness) */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-multiply bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAADCAYAAABS3WWCAAAAE0lEQVQIW2PAwn/MfxjA1MAAAwANJwH++eK/eQAAAABJRU5ErkJggg==')] z-[70]"></div>
            {/* Soft vignette */}
            <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_60px_rgba(0,0,0,0.2)] z-[70] mix-blend-overlay"></div>
        </div>
    );
};

export default CafeMap;
