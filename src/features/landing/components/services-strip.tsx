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
    <div className="flex w-full max-w-280 flex-col items-center gap-7 pt-18">
      <p className="text-[15px]/4.5 font-medium text-ink-muted">
        Track anything you pay for, from streaming to software
      </p>
      <ul className="flex w-full items-center justify-between px-6">
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
