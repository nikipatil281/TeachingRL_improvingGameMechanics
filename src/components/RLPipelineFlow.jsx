import React, { createContext, useContext, useState } from 'react';
import {
    BaseEdge,
    Background,
    Controls,
    Handle,
    MarkerType,
    Position,
    ReactFlow,
} from '@xyflow/react';
import {
    Bot,
    BrainCircuit,
    CalendarDays,
    CloudSun,
    Compass,
    Crosshair,
    DollarSign,
    Package,
    PartyPopper,
    RefreshCw,
    ShieldAlert,
    Store,
    TrendingUp,
} from 'lucide-react';
import '@xyflow/react/dist/style.css';

const TONE_STYLES = {
    amber: {
        shell: 'border-amber-400/35 bg-amber-500/10 shadow-xl shadow-amber-950/20',
        eyebrow: 'text-amber-200/85',
        title: 'text-amber-100',
        body: 'text-amber-50/85',
        iconWrap: 'border-amber-400/25 bg-amber-400/10 text-amber-200',
        pill: 'border-amber-400/30 bg-amber-400/10 text-amber-100',
    },
    orange: {
        shell: 'border-orange-400/35 bg-orange-500/10 shadow-xl shadow-orange-950/20',
        eyebrow: 'text-orange-200/85',
        title: 'text-orange-100',
        body: 'text-orange-50/85',
        iconWrap: 'border-orange-400/25 bg-orange-400/10 text-orange-200',
        pill: 'border-orange-400/30 bg-orange-400/10 text-orange-100',
    },
    sky: {
        shell: 'border-sky-400/35 bg-sky-500/10 shadow-xl shadow-sky-950/20',
        eyebrow: 'text-sky-200/85',
        title: 'text-sky-100',
        body: 'text-sky-50/85',
        iconWrap: 'border-sky-400/25 bg-sky-400/10 text-sky-200',
        pill: 'border-sky-400/30 bg-sky-400/10 text-sky-100',
    },
    violet: {
        shell: 'border-violet-400/35 bg-violet-500/10 shadow-xl shadow-violet-950/20',
        eyebrow: 'text-violet-200/85',
        title: 'text-violet-100',
        body: 'text-violet-50/85',
        iconWrap: 'border-violet-400/25 bg-violet-400/10 text-violet-200',
        pill: 'border-violet-400/30 bg-violet-400/10 text-violet-100',
    },
    violetStrong: {
        shell: 'border-violet-200/85 bg-violet-400/30 shadow-[0_0_0_1px_rgba(196,181,253,0.22),0_0_56px_rgba(139,92,246,0.4),0_28px_72px_rgba(76,29,149,0.44)]',
        eyebrow: 'text-violet-100/90',
        title: 'text-violet-50',
        body: 'text-violet-50/90',
        iconWrap: 'border-violet-100/55 bg-violet-300/24 text-violet-50',
        pill: 'border-violet-300/35 bg-violet-300/12 text-violet-50',
    },
    pink: {
        shell: 'border-pink-400/35 bg-pink-500/10 shadow-xl shadow-pink-950/20',
        eyebrow: 'text-pink-200/85',
        title: 'text-pink-100',
        body: 'text-pink-50/85',
        iconWrap: 'border-pink-400/25 bg-pink-400/10 text-pink-200',
        pill: 'border-pink-400/30 bg-pink-400/10 text-pink-100',
    },
    emerald: {
        shell: 'border-emerald-400/35 bg-emerald-500/10 shadow-xl shadow-emerald-950/20',
        eyebrow: 'text-emerald-200/85',
        title: 'text-emerald-100',
        body: 'text-emerald-50/85',
        iconWrap: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200',
        pill: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100',
    },
    emeraldStrong: {
        shell: 'border-emerald-200/82 bg-emerald-400/30 shadow-[0_0_0_1px_rgba(167,243,208,0.2),0_0_56px_rgba(16,185,129,0.36),0_28px_72px_rgba(6,95,70,0.42)]',
        eyebrow: 'text-emerald-50/90',
        title: 'text-emerald-50',
        body: 'text-emerald-50/90',
        iconWrap: 'border-emerald-100/55 bg-emerald-300/24 text-emerald-50',
        pill: 'border-emerald-300/35 bg-emerald-300/12 text-emerald-50',
    },
    teal: {
        shell: 'border-teal-400/35 bg-teal-500/10 shadow-xl shadow-teal-950/20',
        eyebrow: 'text-teal-200/85',
        title: 'text-teal-100',
        body: 'text-teal-50/85',
        iconWrap: 'border-teal-400/25 bg-teal-400/10 text-teal-200',
        pill: 'border-teal-400/30 bg-teal-400/10 text-teal-100',
    },
    red: {
        shell: 'border-red-400/35 bg-red-500/10 shadow-xl shadow-red-950/20',
        eyebrow: 'text-red-200/85',
        title: 'text-red-100',
        body: 'text-red-50/85',
        iconWrap: 'border-red-400/25 bg-red-400/10 text-red-200',
        pill: 'border-red-400/30 bg-red-400/10 text-red-100',
    },
    stone: {
        shell: 'border-coffee-400/35 bg-coffee-500/10 shadow-xl shadow-coffee-950/20',
        eyebrow: 'text-coffee-200/85',
        title: 'text-coffee-50',
        body: 'text-coffee-100/85',
        iconWrap: 'border-coffee-400/25 bg-coffee-400/10 text-coffee-100',
        pill: 'border-coffee-400/30 bg-coffee-400/10 text-coffee-50',
    },
};

const LIGHT_TONE_OVERRIDES = {
    amber: {
        shell: 'border-amber-700/50 bg-amber-100/96 shadow-[0_14px_32px_rgba(120,53,15,0.14)]',
        eyebrow: 'text-amber-900/85',
        title: 'text-amber-950',
        body: 'text-amber-950/92',
        iconWrap: 'border-amber-700/25 bg-amber-50/92 text-amber-900',
        pill: 'border-amber-700/25 bg-amber-50/95 text-amber-950',
    },
    orange: {
        shell: 'border-orange-700/50 bg-orange-100/96 shadow-[0_14px_32px_rgba(154,52,18,0.14)]',
        eyebrow: 'text-orange-900/85',
        title: 'text-orange-950',
        body: 'text-orange-950/92',
        iconWrap: 'border-orange-700/25 bg-orange-50/92 text-orange-900',
        pill: 'border-orange-700/25 bg-orange-50/95 text-orange-950',
    },
    sky: {
        shell: 'border-sky-700/48 bg-sky-100/97 shadow-[0_14px_32px_rgba(3,105,161,0.13)]',
        eyebrow: 'text-sky-900/85',
        title: 'text-sky-950',
        body: 'text-sky-950/92',
        iconWrap: 'border-sky-700/25 bg-sky-50/92 text-sky-900',
        pill: 'border-sky-700/25 bg-sky-50/95 text-sky-950',
    },
    violet: {
        shell: 'border-violet-700/48 bg-violet-100/97 shadow-[0_14px_32px_rgba(109,40,217,0.13)]',
        eyebrow: 'text-violet-900/85',
        title: 'text-violet-950',
        body: 'text-violet-950/92',
        iconWrap: 'border-violet-700/25 bg-violet-50/92 text-violet-900',
        pill: 'border-violet-700/25 bg-violet-50/95 text-violet-950',
    },
    violetStrong: {
        shell: 'border-violet-700/62 bg-violet-100/98 shadow-[0_0_0_1px_rgba(124,58,237,0.14),0_0_28px_rgba(139,92,246,0.18),0_22px_42px_rgba(91,33,182,0.14)]',
        eyebrow: 'text-violet-900/85',
        title: 'text-violet-950',
        body: 'text-violet-950/93',
        iconWrap: 'border-violet-700/25 bg-violet-50/92 text-violet-900',
        pill: 'border-violet-700/25 bg-violet-50/95 text-violet-950',
    },
    pink: {
        shell: 'border-pink-700/48 bg-pink-100/97 shadow-[0_14px_32px_rgba(190,24,93,0.13)]',
        eyebrow: 'text-pink-900/85',
        title: 'text-pink-950',
        body: 'text-pink-950/92',
        iconWrap: 'border-pink-700/25 bg-pink-50/92 text-pink-900',
        pill: 'border-pink-700/25 bg-pink-50/95 text-pink-950',
    },
    emerald: {
        shell: 'border-emerald-700/48 bg-emerald-100/97 shadow-[0_14px_32px_rgba(5,150,105,0.13)]',
        eyebrow: 'text-emerald-900/85',
        title: 'text-emerald-950',
        body: 'text-emerald-950/92',
        iconWrap: 'border-emerald-700/25 bg-emerald-50/92 text-emerald-900',
        pill: 'border-emerald-700/25 bg-emerald-50/95 text-emerald-950',
    },
    emeraldStrong: {
        shell: 'border-emerald-700/62 bg-emerald-100/98 shadow-[0_0_0_1px_rgba(5,150,105,0.14),0_0_28px_rgba(16,185,129,0.18),0_22px_42px_rgba(6,95,70,0.14)]',
        eyebrow: 'text-emerald-900/85',
        title: 'text-emerald-950',
        body: 'text-emerald-950/93',
        iconWrap: 'border-emerald-700/25 bg-emerald-50/92 text-emerald-900',
        pill: 'border-emerald-700/25 bg-emerald-50/95 text-emerald-950',
    },
    teal: {
        shell: 'border-teal-700/48 bg-teal-100/97 shadow-[0_14px_32px_rgba(13,148,136,0.13)]',
        eyebrow: 'text-teal-900/85',
        title: 'text-teal-950',
        body: 'text-teal-950/92',
        iconWrap: 'border-teal-700/25 bg-teal-50/92 text-teal-900',
        pill: 'border-teal-700/25 bg-teal-50/95 text-teal-950',
    },
    red: {
        shell: 'border-red-700/48 bg-red-100/97 shadow-[0_14px_32px_rgba(185,28,28,0.13)]',
        eyebrow: 'text-red-900/85',
        title: 'text-red-950',
        body: 'text-red-950/92',
        iconWrap: 'border-red-700/25 bg-red-50/92 text-red-900',
        pill: 'border-red-700/25 bg-red-50/95 text-red-950',
    },
    stone: {
        shell: 'border-coffee-700/52 bg-coffee-100/97 shadow-[0_14px_32px_rgba(120,53,15,0.14)]',
        eyebrow: 'text-coffee-900/82',
        title: 'text-coffee-950',
        body: 'text-coffee-950/92',
        iconWrap: 'border-coffee-600/20 bg-coffee-50/92 text-coffee-900',
        pill: 'border-coffee-600/20 bg-coffee-50/94 text-coffee-950',
    },
};

const GROUP_STYLES = {
    stone: {
        shell: 'border-coffee-500/45 bg-coffee-900/30',
        label: 'border-coffee-400/30 bg-coffee-950/65 text-coffee-50',
        title: 'text-coffee-50',
        eyebrow: 'text-coffee-300/80',
        body: 'text-coffee-200/80',
        iconWrap: 'border-coffee-400/25 bg-coffee-400/10 text-coffee-100',
    },
    emerald: {
        shell: 'border-emerald-400/30 bg-emerald-500/[0.05]',
        label: 'border-emerald-400/25 bg-emerald-950/35 text-emerald-50',
        title: 'text-emerald-50',
        eyebrow: 'text-emerald-200/80',
        body: 'text-emerald-100/80',
        iconWrap: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200',
    },
};

const LIGHT_GROUP_OVERRIDES = {
    stone: {
        shell: 'border-coffee-700/58 bg-white/90 shadow-[inset_0_0_0_1px_rgba(120,53,15,0.06)]',
        label: 'border-coffee-700/50 bg-coffee-950/88 text-coffee-50 shadow-[0_16px_34px_rgba(41,28,20,0.16)]',
        title: 'text-coffee-50',
        eyebrow: 'text-coffee-100/88',
        body: 'text-coffee-100/90',
        iconWrap: 'border-coffee-300/28 bg-coffee-100/12 text-coffee-50',
    },
    emerald: {
        shell: 'border-emerald-700/56 bg-emerald-50/88 shadow-[inset_0_0_0_1px_rgba(5,150,105,0.06)]',
        label: 'border-emerald-700/35 bg-emerald-50/98 text-emerald-950',
        title: 'text-emerald-950',
        eyebrow: 'text-emerald-900/82',
        body: 'text-emerald-950/92',
        iconWrap: 'border-emerald-700/28 bg-white/88 text-emerald-950',
    },
};

const PipelineThemeContext = createContext({ isLight: false });

const HANDLE_CLASS = '!h-3 !w-3 !border-0 !bg-transparent !opacity-0 !pointer-events-none';

const STATE_VARIABLES = [
    { label: 'DayOfWeek', icon: CalendarDays },
    { label: 'Weather', icon: CloudSun },
    { label: 'Inventory', icon: Package },
    { label: 'Event', icon: PartyPopper },
    { label: 'Competitor', icon: Store },
];

const NET_REWARD_DETAILS = [
    {
        title: 'Reward',
        description: 'A good outcome gives the agent a positive signal, so similar choices become more attractive next time.',
        icon: TrendingUp,
        tone: 'teal',
    },
    {
        title: 'Penalty',
        description: 'A poor outcome reduces the final score, so the agent learns to avoid that choice in similar situations.',
        icon: ShieldAlert,
        tone: 'red',
    },
];

const ACTION_DETAILS = [
    {
        title: 'Exploration',
        description: 'Trying a less-certain option to discover whether a different price could lead to a better result.',
        icon: Compass,
        tone: 'amber',
    },
    {
        title: 'Exploitation',
        description: 'Using the option that already seems strongest, based on what the agent has learned from past experience.',
        icon: Crosshair,
        tone: 'orange',
    },
];

const DESKTOP_NODES = [
    {
        id: 'sequential-learning',
        type: 'groupBox',
        position: { x: 40, y: 24 },
        data: {
            title: 'Sequential Learning',
            description: 'The agent improves by repeating this learning loop over many decisions and outcomes.',
            tone: 'stone',
            icon: RefreshCw,
        },
        style: { width: 1620, height: 1120 },
    },
    {
        id: 'environment',
        type: 'groupBox',
        parentId: 'sequential-learning',
        extent: 'parent',
        position: { x: 40, y: 128 },
        data: {
            title: 'Environment',
            description: 'The environment is the world the agent interacts with while making pricing decisions.',
            tone: 'emerald',
            icon: Store,
        },
        style: { width: 1540, height: 690 },
    },
    {
        id: 'feedback',
        type: 'card',
        parentId: 'environment',
        extent: 'parent',
        position: { x: 1185, y: 330 },
        data: {
            title: 'Feedback from environment',
            description: 'After an action is taken, the environment sends back the outcome of that decision.',
            tone: 'emeraldStrong',
            icon: RefreshCw,
        },
        style: { width: 280, height: 138 },
    },
    {
        id: 'agent',
        type: 'card',
        parentId: 'environment',
        extent: 'parent',
        position: { x: 85, y: 330 },
        data: {
            title: 'Agent',
            description: 'The agent is the decision-maker that observes the state and chooses what action to take.',
            tone: 'violetStrong',
            icon: Bot,
        },
        style: { width: 285, height: 136 },
    },
    {
        id: 'state',
        type: 'stateCard',
        parentId: 'environment',
        extent: 'parent',
        position: { x: 345, y: 123 },
        data: {
            title: 'State',
            tone: 'sky',
            icon: null,
        },
        style: { width: 320, height: 128 },
    },
    {
        id: 'net-rewards',
        type: 'interactiveCard',
        parentId: 'environment',
        extent: 'parent',
        position: { x: 770, y: 210 },
        data: {
            title: 'NetRewards',
            description: 'This is the final learning signal, after positive rewards and negative penalties are combined.',
            tone: 'teal',
            icon: TrendingUp,
            details: NET_REWARD_DETAILS,
            detailLayout: 'right-stack',
        },
        style: { width: 310, height: 124 },
    },
    {
        id: 'action',
        type: 'interactiveCard',
        parentId: 'environment',
        extent: 'parent',
        position: { x: 520, y: 470 },
        data: {
            title: 'Action',
            description: 'The action is the pricing decision the agent sends back to the environment.',
            tone: 'pink',
            icon: DollarSign,
            details: ACTION_DETAILS,
            detailLayout: 'bottom-split',
        },
        style: { width: 320, height: 126 },
    },
    {
        id: 'policy',
        type: 'card',
        position: { x: 1100, y: 970 },
        data: {
            title: 'Policy',
            description: 'The policy stores what the agent has learned so far about which actions work best in each state. In this app, the deployed RL system is trained with DQN by default.',
            tone: 'orange',
            icon: BrainCircuit,
        },
        style: { width: 300, height: 138 },
    },
];

const buildEdge = ({ id, source, target, sourceHandle, targetHandle, color, dashed = false, animated = false, type = 'smoothstep' }) => ({
    id,
    source,
    target,
    sourceHandle,
    targetHandle,
    type,
    animated,
    style: {
        stroke: color,
        strokeWidth: 2.75,
        strokeDasharray: dashed ? '8 8' : undefined,
    },
    markerEnd: {
        type: MarkerType.ArrowClosed,
        color,
        width: 22,
        height: 22,
    },
});

const DESKTOP_EDGES = [
    buildEdge({
        id: 'feedback-to-net-rewards',
        source: 'feedback',
        target: 'net-rewards',
        sourceHandle: 'source-top',
        targetHandle: 'target-right',
        color: '#34d399',
        animated: true,
    }),
    buildEdge({
        id: 'feedback-to-state',
        source: 'feedback',
        target: 'state',
        sourceHandle: 'source-top',
        targetHandle: 'target-right',
        color: '#5eead4',
        animated: true,
    }),
    buildEdge({
        id: 'net-rewards-to-agent',
        source: 'net-rewards',
        target: 'agent',
        sourceHandle: 'source-left',
        targetHandle: 'target-top',
        color: '#34d399',
        animated: true,
    }),
    buildEdge({
        id: 'state-to-agent',
        source: 'state',
        target: 'agent',
        sourceHandle: 'source-left',
        targetHandle: 'target-top',
        color: '#7dd3fc',
        animated: true,
    }),
    buildEdge({
        id: 'agent-to-action',
        source: 'agent',
        target: 'action',
        sourceHandle: 'source-bottom',
        targetHandle: 'target-left',
        color: '#f9a8d4',
        animated: true,
    }),
    buildEdge({
        id: 'action-to-feedback',
        source: 'action',
        target: 'feedback',
        sourceHandle: 'source-right',
        targetHandle: 'target-bottom',
        color: '#fdba74',
        animated: true,
    }),
    buildEdge({
        id: 'environment-to-policy',
        source: 'environment',
        target: 'policy',
        sourceHandle: 'source-bottom-left',
        targetHandle: 'target-left',
        color: '#d6bcaa',
        animated: true,
    }),
    buildEdge({
        id: 'policy-to-environment',
        source: 'policy',
        target: 'environment',
        sourceHandle: 'source-right',
        targetHandle: 'target-bottom-right',
        color: '#d6bcaa',
        animated: true,
        type: 'singleBend',
    }),
];

const SingleBendEdge = ({ sourceX, sourceY, targetX, targetY, markerEnd, style }) => {
    const edgePath = `M ${sourceX} ${sourceY} H ${targetX} V ${targetY}`;

    return <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />;
};

const renderHandles = () => (
    <>
        <Handle id="target-top" type="target" position={Position.Top} className={HANDLE_CLASS} />
        <Handle id="target-right" type="target" position={Position.Right} className={HANDLE_CLASS} />
        <Handle id="target-bottom" type="target" position={Position.Bottom} className={HANDLE_CLASS} />
        <Handle id="target-left" type="target" position={Position.Left} className={HANDLE_CLASS} />
        <Handle id="target-bottom-left" type="target" position={Position.Bottom} className={HANDLE_CLASS} style={{ left: '34%' }} />
        <Handle id="target-bottom-right" type="target" position={Position.Bottom} className={HANDLE_CLASS} style={{ left: '92%' }} />
        <Handle id="source-top" type="source" position={Position.Top} className={HANDLE_CLASS} />
        <Handle id="source-right" type="source" position={Position.Right} className={HANDLE_CLASS} />
        <Handle id="source-bottom" type="source" position={Position.Bottom} className={HANDLE_CLASS} />
        <Handle id="source-left" type="source" position={Position.Left} className={HANDLE_CLASS} />
        <Handle id="source-bottom-left" type="source" position={Position.Bottom} className={HANDLE_CLASS} style={{ left: '52%' }} />
        <Handle id="source-bottom-right" type="source" position={Position.Bottom} className={HANDLE_CLASS} style={{ left: '92%' }} />
    </>
);

const BaseCard = ({ tone, icon: Icon, eyebrow, title, description, children, className = '', compact = false }) => {
    const { isLight } = useContext(PipelineThemeContext);
    const styles = isLight
        ? { ...TONE_STYLES[tone], ...(LIGHT_TONE_OVERRIDES[tone] || {}) }
        : TONE_STYLES[tone];

    return (
        <div className={`h-full w-full rounded-[22px] border px-3.5 py-3.5 backdrop-blur-md ${styles.shell} ${className}`}>
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    {eyebrow ? (
                        <div className={`break-words text-[10px] font-bold uppercase tracking-[0.2em] ${styles.eyebrow}`}>
                            {eyebrow}
                        </div>
                    ) : null}
                    <div className={`${eyebrow ? 'mt-1' : ''} break-words text-[15px] font-bold ${styles.title}`}>{title}</div>
                </div>
                {Icon ? (
                    <div className={`rounded-2xl border p-1.5 ${styles.iconWrap}`}>
                        <Icon className="h-4.5 w-4.5" />
                    </div>
                ) : null}
            </div>
            {description ? (
                <p className={`mt-2.5 break-words leading-relaxed ${compact ? 'text-[11px]' : 'text-[11px]'} ${styles.body}`}>
                    {description}
                </p>
            ) : null}
            {children ? <div className="mt-3">{children}</div> : null}
        </div>
    );
};

const DetailMiniCard = ({ detail }) => {
    const { isLight } = useContext(PipelineThemeContext);
    const styles = isLight
        ? { ...TONE_STYLES[detail.tone], ...(LIGHT_TONE_OVERRIDES[detail.tone] || {}) }
        : TONE_STYLES[detail.tone];
    const Icon = detail.icon;

    return (
        <div className={`rounded-2xl border px-3 py-3 ${styles.shell}`}>
            <div className="flex items-center gap-2">
                <div className={`rounded-xl border p-1.5 ${styles.iconWrap}`}>
                    <Icon className="h-4 w-4" />
                </div>
                <div className={`text-xs font-bold ${styles.title}`}>{detail.title}</div>
            </div>
            <p className={`mt-2 text-[11px] leading-relaxed ${styles.body}`}>{detail.description}</p>
        </div>
    );
};

const DottedConnector = ({ className = '' }) => (
    <div className={`absolute border-coffee-400/45 border-dashed ${className}`} />
);

const CurvedConnector = () => (
    <svg
        className="pointer-events-none absolute left-1/2 top-full z-20 h-[96px] w-[320px] -translate-x-[82%]"
        viewBox="0 0 320 96"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M210 0 C210 24 194 40 164 50 C124 62 82 72 24 90"
            stroke="rgba(214,188,170,0.55)"
            strokeWidth="2"
            strokeDasharray="6 6"
            strokeLinecap="round"
        />
    </svg>
);

const CurvedConnectorTopRight = () => (
    <svg
        className="pointer-events-none absolute left-1/2 bottom-full z-20 h-[180px] w-[430px] -translate-x-1/2"
        viewBox="0 0 430 180"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M215 174 C228 138 260 102 300 72 C336 46 370 28 406 18"
            stroke="rgba(214,188,170,0.55)"
            strokeWidth="2"
            strokeDasharray="6 6"
            strokeLinecap="round"
        />
    </svg>
);

const GroupNode = ({ data }) => {
    const { isLight } = useContext(PipelineThemeContext);
    const styles = isLight
        ? { ...GROUP_STYLES[data.tone], ...(LIGHT_GROUP_OVERRIDES[data.tone] || {}) }
        : GROUP_STYLES[data.tone];
    const Icon = data.icon;

    return (
        <div className={`relative h-full w-full overflow-visible rounded-[34px] border ${styles.shell}`}>
            {renderHandles()}
            <div className={`absolute left-5 top-4 max-w-xs rounded-[18px] border px-3.5 py-2.5 shadow-xl backdrop-blur ${styles.label}`}>
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <div className={`text-sm font-bold ${styles.title}`}>{data.title}</div>
                    </div>
                    <div className={`rounded-2xl border p-1.5 ${styles.iconWrap}`}>
                        <Icon className="h-4 w-4" />
                    </div>
                </div>
                <p className={`mt-1.5 text-[11px] leading-relaxed ${styles.body}`}>{data.description}</p>
            </div>
        </div>
    );
};

const CardNode = ({ data }) => (
    <div className="relative h-full w-full overflow-visible">
        {renderHandles()}
        <BaseCard {...data} />
    </div>
);

const StateCardNode = ({ data }) => {
    const { isLight } = useContext(PipelineThemeContext);
    const styles = isLight
        ? { ...TONE_STYLES[data.tone], ...(LIGHT_TONE_OVERRIDES[data.tone] || {}) }
        : TONE_STYLES[data.tone];

    return (
        <div className="relative h-full w-full overflow-visible">
            {renderHandles()}
            <BaseCard {...data}>
                <div className="flex flex-wrap gap-1.5">
                    {STATE_VARIABLES.map(({ label, icon: Icon }) => (
                        <span key={label} className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${styles.pill}`}>
                            <Icon className="h-3.5 w-3.5" />
                            {label}
                        </span>
                    ))}
                </div>
            </BaseCard>
        </div>
    );
};

const InteractiveCardNode = ({ data }) => {
    const [hovered, setHovered] = useState(false);
    const [pinned, setPinned] = useState(false);
    const isOpen = hovered || pinned;

    const renderDetails = () => {
        if (!isOpen) return null;

        if (data.detailLayout === 'right-stack') {
            return (
                <>
                    <CurvedConnectorTopRight />
                    <div className="absolute left-1/2 bottom-full z-30 mb-20 w-[470px] translate-x-[26%] rounded-[26px] border border-coffee-700/70 bg-coffee-950/88 p-4 shadow-2xl backdrop-blur">
                        <div className="grid grid-cols-2 gap-4">
                            {data.details.map((detail) => (
                                <DetailMiniCard key={detail.title} detail={detail} />
                            ))}
                        </div>
                    </div>
                </>
            );
        }

        if (data.detailLayout === 'bottom-split') {
            return (
                <>
                    <CurvedConnector />
                    <div className="absolute left-1 top-full z-30 mt-20 w-[470px] -translate-x-[95%] rounded-[26px] border border-coffee-700/70 bg-coffee-950/88 p-4 shadow-2xl backdrop-blur">
                        <div className="grid grid-cols-2 gap-4">
                            {data.details.map((detail) => (
                                <DetailMiniCard key={detail.title} detail={detail} />
                            ))}
                        </div>
                    </div>
                </>
            );
        }

        return (
            <div className="absolute left-1/2 top-full z-30 mt-3 w-[260px] -translate-x-1/2 rounded-[24px] border border-coffee-700/70 bg-coffee-950/92 p-3 shadow-2xl backdrop-blur">
                <div className="grid gap-2">
                    {data.details.map((detail) => (
                        <DetailMiniCard key={detail.title} detail={detail} />
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div
            className="relative h-full w-full overflow-visible nodrag nopan nowheel"
            onPointerEnter={() => setHovered(true)}
            onPointerLeave={() => setHovered(false)}
            onFocus={() => setHovered(true)}
            onBlur={() => setHovered(false)}
            style={{ pointerEvents: 'all' }}
        >
            {renderHandles()}
            <button
                type="button"
                onClick={() => setPinned((value) => !value)}
                className="nodrag nopan nowheel block h-full w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-coffee-950"
            >
                <BaseCard {...data} />
            </button>
            {renderDetails()}
        </div>
    );
};

const nodeTypes = {
    groupBox: GroupNode,
    card: CardNode,
    stateCard: StateCardNode,
    interactiveCard: InteractiveCardNode,
};

const edgeTypes = {
    singleBend: SingleBendEdge,
};

const MOBILE_CARD_ORDER = {
    feedback: DESKTOP_NODES.find((node) => node.id === 'feedback').data,
    agent: DESKTOP_NODES.find((node) => node.id === 'agent').data,
    state: DESKTOP_NODES.find((node) => node.id === 'state').data,
    'net-rewards': DESKTOP_NODES.find((node) => node.id === 'net-rewards').data,
    action: DESKTOP_NODES.find((node) => node.id === 'action').data,
    policy: DESKTOP_NODES.find((node) => node.id === 'policy').data,
};

const MobileFlow = () => (
    <div className="grid gap-4 md:hidden">
        <div className={`rounded-[28px] border p-4 ${GROUP_STYLES.stone.shell}`}>
            <BaseCard
                tone="stone"
                icon={RefreshCw}
                title="Sequential Learning"
                description="The outer loop that contains the environment feedback process."
                className="border-coffee-400/25 bg-coffee-950/45 shadow-none"
                compact
            />

            <div className={`mt-4 rounded-[24px] border p-4 ${GROUP_STYLES.emerald.shell}`}>
                <BaseCard
                    tone="emerald"
                    icon={Store}
                    title="Environment"
                    description="Holds the feedback-agent loop along with state, reward, and action signals."
                    className="border-emerald-400/20 bg-emerald-950/25 shadow-none"
                    compact
                />

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <BaseCard {...MOBILE_CARD_ORDER.feedback} compact />
                    <BaseCard {...MOBILE_CARD_ORDER.agent} compact />
                </div>

                <div className="mt-3">
                    <BaseCard tone="sky" icon={null} title="State" compact>
                        <div className="flex flex-wrap gap-2">
                            {STATE_VARIABLES.map(({ label, icon: Icon }) => (
                                <span key={label} className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${TONE_STYLES.sky.pill}`}>
                                    <Icon className="h-3.5 w-3.5" />
                                    {label}
                                </span>
                            ))}
                        </div>
                    </BaseCard>
                </div>

                <div className="mt-3">
                    <BaseCard {...MOBILE_CARD_ORDER['net-rewards']} compact>
                        <div className="grid gap-2">
                            {NET_REWARD_DETAILS.map((detail) => (
                                <DetailMiniCard key={detail.title} detail={detail} />
                            ))}
                        </div>
                    </BaseCard>
                </div>

                <div className="mt-3">
                    <BaseCard {...MOBILE_CARD_ORDER.action} compact>
                        <div className="grid gap-2">
                            {ACTION_DETAILS.map((detail) => (
                                <DetailMiniCard key={detail.title} detail={detail} />
                            ))}
                        </div>
                    </BaseCard>
                </div>
            </div>
        </div>

        <BaseCard {...MOBILE_CARD_ORDER.policy} compact />
    </div>
);

const RLPipelineFlow = ({ theme }) => {
    const isLight = theme === 'theme-latte';

    return (
        <PipelineThemeContext.Provider value={{ isLight }}>
            <div className="w-full">
                <MobileFlow />

                <div className={`rl-pipeline-surface rl-pipeline-flow relative hidden h-[750px] w-full overflow-hidden rounded-[28px] border md:block ${isLight ? 'border-coffee-500/45' : 'border-coffee-700/60'}`}>
                    <ReactFlow
                        nodes={DESKTOP_NODES}
                        edges={DESKTOP_EDGES}
                        nodeTypes={nodeTypes}
                        edgeTypes={edgeTypes}
                        fitView
                        fitViewOptions={{ padding: 0.1, maxZoom: 0.95 }}
                        nodesDraggable={false}
                        nodesConnectable={false}
                        elementsSelectable={false}
                        preventScrolling={false}
                        zoomOnDoubleClick={false}
                        colorMode={isLight ? 'light' : 'dark'}
                        className="h-full w-full bg-transparent"
                        style={{ width: '100%', height: '100%' }}
                    >
                        <Background gap={24} size={1} color={isLight ? 'rgba(62,39,35,0.08)' : 'rgba(255,255,255,0.05)'} />
                        <Background gap={120} size={1.2} color={isLight ? 'rgba(62,39,35,0.12)' : 'rgba(255,255,255,0.08)'} />
                        <Controls className="rl-pipeline-controls" />
                    </ReactFlow>
                </div>
            </div>
        </PipelineThemeContext.Provider>
    );
};

export default RLPipelineFlow;
