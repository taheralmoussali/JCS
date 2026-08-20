"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Header } from "./header";

export function AppLayout({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();

	if (pathname === "/login") {
		return children;
	}

	return (
		<div dir="rtl" className="flex min-h-screen min-w-0 overflow-x-hidden bg-slate-50">
			<Sidebar />
			<div className="flex min-w-0 flex-1 flex-col">
				<Header />
				<main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-5 md:p-8">
					{children}
				</main>
			</div>
		</div>
	);
}
