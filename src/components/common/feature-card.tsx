import Image from "next/image";
import type { ReactNode } from "react";

type Props = {
	title: string;
	subtitle: string;
	image?: ReactNode;
};

export default function FeatureCard(props: Props) {
	return (
		<div className="flex flex-col">
			<h3 className="text-2xl md:text-3xl font-semibold text-center">{props.title}</h3>
			<span className="mt-0.5 text-sm md:text-base text-muted-foreground font-light text-center">
				{props.subtitle}
			</span>

			{!props.image && (
				<div className="mt-4 h-80 w-full rounded-2xl bg-slate-300" />
			)}

			{props.image && (
				<div className="mt-4 p-4 h-80 w-full flex items-center justify-center rounded-2xl bg-slate-300">
					{props.image}
				</div>
			)}
		</div>
	);
}
