import type { StatisticItem } from ".";

export const Statistics: Array<StatisticItem> = [
	{
		description: "cost per week",
		getResult: (subscriptions) => {
			const frequencyMultipliers = new Map([
				["weekly", 1],
				["bi-weekly", 1 / 2.0],
				["monthly", 1 / 4.3], // around 4.3 weeks in a month
				["bi-monthly", 1 / (4.3 * 2)],
				["yearly", 1 / 52.0], // around 52 weeks in a year
				["bi-yearly", 1 / (52.0 * 2)],
			]);

			return subscriptions.reduce((result, subscription) => {
				const multiplier = frequencyMultipliers.get(subscription.frequency) ?? 0;
				return result + subscription.amount * multiplier;
			}, 0.0);
		},
	},
	{
		description: "cost per month",
		getResult: (subscriptions) => {
			const frequencyMultipliers = new Map([
				["weekly", 4.3], // around 4.3 weeks in a month
				["bi-weekly", 4.3 / 2.0],
				["monthly", 1],
				["bi-monthly", 1 / 2.0],
				["yearly", 1 / 12.0], // 12 months in a year
				["bi-yearly", 1 / (12.0 * 2)],
			]);

			return subscriptions.reduce((result, subscription) => {
				const multiplier = frequencyMultipliers.get(subscription.frequency) ?? 0;
				return result + subscription.amount * multiplier;
			}, 0.0);
		},
	},
	{
		description: "cost per year",
		getResult: (subscriptions) => {
			const frequencyMultipliers = new Map([
				["weekly", 52.0], // around 52 weeks in a year
				["bi-weekly", 52.0 / 2.0],
				["monthly", 12.0], // 12 months in a year
				["bi-monthly", 12.0 / 2.0],
				["yearly", 1],
				["bi-yearly", 1 / 2.0],
			]);

			return subscriptions.reduce((result, subscription) => {
				const multiplier = frequencyMultipliers.get(subscription.frequency) ?? 0;
				return result + subscription.amount * multiplier;
			}, 0.0);
		},
	},
];
