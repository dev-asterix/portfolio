export type DemoContentBlock =
  | { type: 'text'; title?: string; content: string }
  | { type: 'image'; src: string; alt: string; caption?: string }
  | { type: 'video'; src: string; caption?: string }
  | { type: 'gif'; src: string; alt: string; caption?: string }
  | { type: 'button'; label: string; url: string; external?: boolean }
  | {
      type: 'readme-section';
      title?: string;
      sectionHeading: string;
      repoOwner: string;
      repoName: string;
      fallback?: string;
    }
  | {
      type: 'use-cases';
      title?: string;
      cases: { emoji: string; title: string; description: string }[];
    }
  | {
      type: 'user-stories';
      title?: string;
      stories: { persona: string; need: string; outcome: string }[];
    }
  | {
      type: 'callout';
      variant: 'info' | 'tip' | 'warning' | 'quote';
      content: string;
      attribution?: string;
    };

export interface RepoDemoData {
  id: string;
  name: string;
  subtitle: string;
  description?: string;
  heroImage?: string;
  iconUrl?: string;
  liveDemoUrl?: string;
  blocks: DemoContentBlock[];
  githubUrl: string;
}

export const DEMO_CONTENT: Record<string, RepoDemoData> = {
  NexQL: {
    id: 'NexQL',
    name: 'NexQL',
    subtitle: 'The PostgreSQL workbench for developers and AI agents.',
    description: 'NexQL (formerly PgStudio) brings connection management, schema exploration, SQL notebooks, query intelligence, safe database operations, and AI-native workflows into VS Code — the editor where you already build software.',
    iconUrl: 'https://raw.githubusercontent.com/NexQL-OSS/core/HEAD/resources/postgres-explorer.png',
    heroImage: 'https://raw.githubusercontent.com/NexQL-OSS/core/HEAD/resources/postgres-explorer.png',
    liveDemoUrl: 'https://nexql.astrx.dev',
    githubUrl: 'https://github.com/NexQL-OSS/core',
    blocks: [
      {
        type: 'callout',
        variant: 'info',
        content: 'One workbench for every database moment — connect, explore, query, understand, operate and extend, without leaving VS Code.',
      },
      {
        type: 'readme-section',
        title: 'Capabilities',
        sectionHeading: '✨ Capability map',
        repoOwner: 'NexQL-OSS',
        repoName: 'core',
        fallback: 'Secure connections with SSL and SSH tunnels, a fast database explorer, native .pgsql notebooks, EXPLAIN CodeLens and table intelligence, guarded CRUD/DDL workflows, and AI + MCP tooling that keeps execution human-approved.',
      },
      {
        type: 'use-cases',
        title: 'Built for real database work',
        cases: [
          { emoji: '🔍', title: 'Schema exploration', description: 'A fast tree for schemas, tables, views, functions, types, roles, extensions and foreign data wrappers.' },
          { emoji: '📓', title: 'SQL notebooks', description: 'Native .pgsql notebooks with completion, saved queries, result streaming and export.' },
          { emoji: '⚡', title: 'Performance engineering', description: 'EXPLAIN workflows, plan inspection, index usage and query history close to the code that caused it.' },
          { emoji: '🚨', title: 'Production investigation', description: 'Environment signals, activity and lock inspection, and table profiling to diagnose regressions.' },
          { emoji: '🤖', title: 'AI and MCP', description: 'Schema-grounded AI help and MCP tools for compatible agents — with human-approved execution.' },
          { emoji: '🛠️', title: 'Safe operations', description: 'Guarded CRUD and DDL, maintenance commands, transactions and object definition viewers.' },
        ],
      },
      {
        type: 'user-stories',
        title: 'Who uses NexQL?',
        stories: [
          { persona: 'Backend Developer', need: 'inspect schemas and iterate on queries while writing API code', outcome: 'moves from a failing query to a tested fix without leaving VS Code' },
          { persona: 'DBA / SRE', need: 'investigate production safely', outcome: 'sees the environment at a glance and inspects activity, locks and plans before touching anything' },
          { persona: 'AI-assisted engineer', need: 'let an agent reason about a real database', outcome: 'connects it through MCP with schema context and keeps every execution approved' },
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        content: 'Label each connection with its environment (PROD / STAGING / DEV). NexQL surfaces it everywhere so a destructive query never lands on the wrong database.',
      },
      {
        type: 'readme-section',
        title: 'Getting Started',
        sectionHeading: '🚀 Quick start',
        repoOwner: 'NexQL-OSS',
        repoName: 'core',
        fallback: 'Install from the VS Code Marketplace: `ext install ric-v.postgres-explorer`, then open the PostgreSQL view and add a connection.',
      },
      {
        type: 'button',
        label: 'Get it on the VS Code Marketplace',
        url: 'https://marketplace.visualstudio.com/items?itemName=ric-v.postgres-explorer',
        external: true,
      },
    ],
  },
  drawdown: {
    id: 'drawdown',
    name: 'drawdown',
    subtitle: 'Track your trading performance with clarity and precision.',
    description: 'drawdown is a professional-grade PnL tracker for traders. Visualize your equity curve, analyze drawdowns, manage transactions, and understand your performance patterns — all in a clean, modern interface.',
    iconUrl: 'https://raw.githubusercontent.com/dev-asterix/drawdown/main/public/logo.png',
    heroImage: 'https://raw.githubusercontent.com/dev-asterix/drawdown/main/public/logo.png',
    liveDemoUrl: 'https://drawdown.astrx.dev',
    githubUrl: 'https://github.com/dev-asterix/drawdown',
    blocks: [
      {
        type: 'callout',
        variant: 'info',
        content: 'Most traders lose money not because of bad entries, but because they never analyze their patterns. drawdown makes that analysis effortless.',
      },
      {
        type: 'readme-section',
        title: 'Key Features',
        sectionHeading: '✨ Key Features',
        repoOwner: 'dev-asterix',
        repoName: 'drawdown',
        fallback: 'Real-time KPI dashboard, interactive equity curve, advanced transaction management, fund tracking, and performance calendar.',
      },
      {
        type: 'use-cases',
        title: 'What you can do',
        cases: [
          { emoji: '📈', title: 'Equity curve analysis', description: 'See your account growth over time. Identify winning streaks and drawdown periods at a glance.' },
          { emoji: '📅', title: 'Performance calendar', description: 'Color-coded daily P&L on a calendar view. Spot patterns in your trading schedule.' },
          { emoji: '💰', title: 'Multi-fund tracking', description: 'Manage multiple trading accounts or strategies. Compare performance across funds.' },
          { emoji: '📋', title: 'Transaction journal', description: 'Log every trade with notes, tags, and screenshots. Build a searchable trading diary.' },
        ],
      },
      {
        type: 'user-stories',
        title: 'Built for traders who care about data',
        stories: [
          { persona: 'Day Trader', need: 'review daily performance without spreadsheets', outcome: 'uses the KPI dashboard to see win rate, average R, and profit factor in real-time' },
          { persona: 'Swing Trader', need: 'understand which setups work over weeks and months', outcome: 'uses the equity curve and calendar to identify profitable patterns' },
          { persona: 'Fund Manager', need: 'track multiple strategies and report to investors', outcome: 'uses multi-fund tracking to generate performance reports per strategy' },
        ],
      },
      {
        type: 'image',
        src: 'https://raw.githubusercontent.com/dev-asterix/drawdown/main/public/logo.png',
        alt: 'drawdown dashboard',
        caption: 'Your trading performance, visualized.',
      },
      {
        type: 'callout',
        variant: 'tip',
        content: 'Tag your trades by setup type (breakout, pullback, reversal) to discover which strategies actually make you money.',
      },
      {
        type: 'readme-section',
        title: 'Getting Started',
        sectionHeading: '🚀 Getting Started',
        repoOwner: 'dev-asterix',
        repoName: 'drawdown',
        fallback: 'Clone the repository, install dependencies with `npm install`, and run `npm run dev` to start the development server.',
      },
      {
        type: 'button',
        label: 'Try drawdown',
        url: 'https://github.com/dev-asterix/drawdown',
        external: true,
      },
    ],
  },
  'and-the-time-is': {
    id: 'and-the-time-is',
    name: 'and the time is',
    subtitle: 'A developer-focused timezone and time-tracking utility.',
    description: 'Working across timezones shouldn\'t require mental math. "and the time is" gives you a clean, customizable view of time across the world — designed for remote teams and global developers.',
    iconUrl: 'https://raw.githubusercontent.com/dev-asterix/and-the-time-is/main/public/favicon.ico',
    heroImage: 'https://raw.githubusercontent.com/dev-asterix/and-the-time-is/main/public/favicon.ico',
    liveDemoUrl: 'https://timeis.astrx.dev',
    githubUrl: 'https://github.com/dev-asterix/and-the-time-is',
    blocks: [
      {
        type: 'callout',
        variant: 'quote',
        content: 'I keep this open all day. It\'s the fastest way to check if my colleague in Tokyo is still awake before pinging them.',
        attribution: 'A remote developer',
      },
      {
        type: 'readme-section',
        title: 'Features',
        sectionHeading: 'Features',
        repoOwner: 'dev-asterix',
        repoName: 'and-the-time-is',
        fallback: 'Display current time in local timezone, search and add other timezones, change UI layout, modify date format, and view historical times across timezones.',
      },
      {
        type: 'use-cases',
        title: 'Everyday scenarios',
        cases: [
          { emoji: '🌍', title: 'Team standup scheduling', description: 'Find the overlap window where your distributed team can all meet without anyone waking at 5am.' },
          { emoji: '🕐', title: 'Historical time lookup', description: 'Check what time it was in another timezone at a specific moment. Great for debugging production incidents across regions.' },
          { emoji: '🎨', title: 'Customizable layouts', description: 'Arrange timezone clocks in rows, columns, or a compact grid. Pick the view that fits your workflow.' },
          { emoji: '📅', title: 'Date format flexibility', description: 'Switch between 12h/24h, DD/MM/YYYY or MM/DD/YYYY. Respects your locale preferences.' },
        ],
      },
      {
        type: 'user-stories',
        title: 'Who finds this useful?',
        stories: [
          { persona: 'Remote Engineer', need: 'coordinate with teammates in 4 different timezones', outcome: 'pins their team\'s cities and sees everyone\'s local time at a glance' },
          { persona: 'DevOps Engineer', need: 'correlate log timestamps from servers in different regions', outcome: 'uses historical time lookup to map UTC timestamps to local times during incident reviews' },
          { persona: 'Freelancer', need: 'schedule client calls across continents without confusion', outcome: 'shares a link showing the proposed meeting time in both timezones' },
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        content: 'Bookmark the app with your most-used timezones pre-loaded. The URL stores your configuration, so it\'s always one click away.',
      },
      {
        type: 'readme-section',
        title: 'Getting Started',
        sectionHeading: 'Getting Started',
        repoOwner: 'dev-asterix',
        repoName: 'and-the-time-is',
        fallback: 'Run `npm run dev` or `yarn dev` to start the development server, then open http://localhost:3000.',
      },
      {
        type: 'button',
        label: 'View Repository',
        url: 'https://github.com/dev-asterix/and-the-time-is',
        external: true,
      },
    ],
  },
};
