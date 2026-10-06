import { contentColumn } from '@/features/landing/styles';
import { cn } from '@/lib/utils';

const SERVICES = [
  { name: 'Netflix', logo: '/landing/logos/netflix.svg' },
  { name: 'Spotify', logo: '/landing/logos/spotify.svg' },
  { name: 'YouTube', logo: '/landing/logos/youtube.svg' },
  { name: 'iCloud+', logo: '/landing/logos/icloud.svg' },
  { name: 'Notion', logo: '/landing/logos/notion.svg' },
  { name: 'GitHub', logo: '/landing/logos/github.svg' },
  { name: '1Password', logo: '/landing/logos/1password.svg' },
  { name: 'Duolingo', logo: '/landing/logos/duolingo.svg' },
];

export function ServicesStrip() {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-7 pt-14 md:pt-18',
        contentColumn,
      )}
    >
      <p className="text-center text-[15px]/5.5 font-medium text-balance text-ink-muted">
        Track anything you pay for, from streaming to software
      </p>
      <ul className="grid w-full grid-cols-2 justify-items-center gap-y-5 sm:grid-cols-4 lg:flex lg:items-center lg:justify-between lg:px-6">
        {SERVICES.map((service) => (
          <li key={service.name} className="flex items-center gap-2 opacity-72">
            <img src={service.logo} alt="" className="size-5" />
            <span className="text-[17px]/5.5 font-semibold tracking-[-0.02em] text-[#1C1F24]">
              {service.name}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
