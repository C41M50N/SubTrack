import MainLayout from "@/layouts/main";
import SettingsLayout from "@/layouts/settings";
import { UserProfile } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import React from "react";

export default function AccountSettingsPage() {
	const router = useRouter();

	return (
		<MainLayout title="Account Settings | SubTrack">
			<SettingsLayout>
				<UserProfile routing="hash" />
			</SettingsLayout>
		</MainLayout>
	);
}
