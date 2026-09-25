import type { ReactNode } from 'react';

type Props = {
  title: string;
  subtitle: string;
  image?: ReactNode;
};

export default function FeatureCard(props: Props) {
  return (
    <div className="flex flex-col">
      <h3 className="text-center font-semibold text-2xl md:text-3xl">
        {props.title}
      </h3>
      <span className="mt-0.5 text-center font-light text-muted-foreground text-sm md:text-base">
        {props.subtitle}
      </span>

      {!props.image && (
        <div className="mt-4 h-80 w-full rounded-2xl bg-slate-300" />
      )}

      {props.image && (
        <div className="mt-4 flex h-80 w-full items-center justify-center rounded-2xl bg-slate-300 p-4">
          {props.image}
        </div>
      )}
    </div>
  );
}
