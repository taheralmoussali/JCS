"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, LogOut, Search } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase";

export function Header() {
	const router = useRouter();
	const [loggingOut, setLoggingOut] = useState(false);

	async function handleLogout() {
		setLoggingOut(true);
		await supabaseBrowser().auth.signOut();
		router.replace("/login");
		router.refresh();
	}

	return (
		<header className="flex h-16 items-center justify-between border-b bg-white px-5">
			<div className="relative w-full max-w-md">
				<Search className="absolute right-3 top-2.5 text-muted-foreground" size={18} />
				<input
					dir="rtl"
					placeholder="بحث سريع..."
					className="w-full rounded-lg border bg-slate-50 py-2 pl-3 pr-10 text-sm outline-none focus:ring-2 focus:ring-primary/20"
				/>
			</div>
			<div className="mr-4 flex items-center gap-1">
				<button aria-label="الإشعارات" className="rounded-full p-2 hover:bg-slate-100">
					<Bell size={20} />
				</button>
				<button
					type="button"
					onClick={handleLogout}
					disabled={loggingOut}
					aria-label="تسجيل الخروج"
					title="تسجيل الخروج"
					className="rounded-full p-2 text-slate-600 hover:bg-slate-100 hover:text-red-600 disabled:opacity-50"
				>
					<LogOut size={20} />
				</button>
			</div>
		</header>
	);
}
