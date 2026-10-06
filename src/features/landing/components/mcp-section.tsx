import { McpTerminal } from '@/features/landing/components/mcp-terminal';
import { panelColumn, sectionHeading } from '@/features/landing/styles';
import { cn } from '@/lib/utils';

const CLIENTS = [
  { name: 'Claude', logo: '/landing/logos/claude.svg' },
  { name: 'ChatGPT', logo: '/landing/logos/chatgpt.svg' },
  { name: 'Cursor', logo: '/landing/logos/cursor.svg' },
];

export function McpSection() {
  return (
    <section className="flex w-full justify-center pt-20 md:pt-30">
      <div
        className={cn(
          'flex flex-col gap-10 overflow-clip rounded-[20px] bg-ink px-5 py-10 sm:rounded-[28px] sm:p-12 lg:flex-row lg:items-center lg:gap-12 xl:gap-16 xl:py-18 xl:pr-18 xl:pl-20',
          panelColumn,
        )}
      >
        <div className="flex max-w-140 flex-col gap-6 lg:w-105 lg:shrink-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <p className="text-[15px]/4.5 font-medium text-[#AEB6C0]">
              EverySub MCP server
            </p>
            <span className="flex h-6.5 items-center gap-1.5 rounded-full border border-brand-bright/35 bg-brand-bright/14 px-2.5 text-[13px]/4 font-semibold text-[#8FD0F5]">
              <span className="size-1.5 rounded-full bg-brand-bright" />
              Coming soon
            </span>
          </div>
          <h2 className={cn('text-white', sectionHeading)}>
            Ask your subscriptions anything.
          </h2>
          <p className="text-lg/7.25 text-[#AEB6C0]">
            Connect EverySub to Claude, ChatGPT, Cursor, or any MCP client. Ask
            what’s due, check your totals, or add a new subscription without
            opening the app.
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3 pt-3 text-sm/4.5 font-medium">
            <p className="text-[#7D8792]">Works with</p>
            <ul className="flex flex-wrap items-center gap-x-5 gap-y-3">
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
