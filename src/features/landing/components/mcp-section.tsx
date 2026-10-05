import { McpTerminal } from '@/features/landing/components/mcp-terminal';

const CLIENTS = [
  { name: 'Claude', logo: '/landing/logos/claude.svg' },
  { name: 'ChatGPT', logo: '/landing/logos/chatgpt.svg' },
  { name: 'Cursor', logo: '/landing/logos/cursor.svg' },
];

export function McpSection() {
  return (
    <section className="flex w-full justify-center pt-30">
      <div className="flex w-300 shrink-0 items-center gap-16 overflow-clip rounded-[28px] bg-ink py-18 pr-18 pl-20">
        <div className="flex w-105 shrink-0 flex-col gap-6">
          <div className="flex items-center gap-2.5">
            <p className="text-[15px]/4.5 font-medium text-[#AEB6C0]">
              EverySub MCP server
            </p>
            <span className="flex h-6.5 items-center gap-1.5 rounded-full border border-brand-bright/35 bg-brand-bright/14 px-2.5 text-[13px]/4 font-semibold text-[#8FD0F5]">
              <span className="size-1.5 rounded-full bg-brand-bright" />
              Coming soon
            </span>
          </div>
          <h2 className="text-[56px]/15 tracking-[-0.04em] text-white">
            Ask your subscriptions anything.
          </h2>
          <p className="text-lg/7.25 text-[#AEB6C0]">
            Connect EverySub to Claude, ChatGPT, Cursor, or any MCP client. Ask
            what’s due, check your totals, or add a new subscription without
            opening the app.
          </p>
          <div className="flex items-center gap-5 pt-3 text-sm/4.5 font-medium">
            <p className="text-[#7D8792]">Works with</p>
            <ul className="flex items-center gap-5">
              {CLIENTS.map((client) => (
                <li
                  key={client.name}
                  className="flex shrink-0 items-center gap-1.75 text-[#E4E8EC]"
                >
                  <img src={client.logo} alt="" className="size-4" />
                  {client.name}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <McpTerminal />
      </div>
    </section>
  );
}
