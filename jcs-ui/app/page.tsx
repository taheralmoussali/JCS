import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, HandHeart, TrendingUp, Users } from "lucide-react";
import { supabaseServer } from "@/lib/supabase-server";

function startOfMonth() {
	const date = new Date();
	return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)).toISOString();
}

function startOfNextMonth() {
	const date = new Date();
	return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1)).toISOString();
}

export default async function Dashboard() {
	const supabase = await supabaseServer();
	const monthStart = startOfMonth();
	const nextMonthStart = startOfNextMonth();
	const today = new Date().toISOString().slice(0, 10);

	const [familiesResult, aidResult, visitsResult, scoresResult, categoriesResult, recentAidResult, recentVisitsResult] = await Promise.all([
		supabase.from("families").select("id", { count: "exact", head: true }),
		supabase.from("aid").select("amount").gte("aid_date", monthStart).lt("aid_date", nextMonthStart),
		supabase.from("visits").select("id", { count: "exact", head: true }).gte("visit_date", today),
		supabase.from("families").select("assessment_score").not("assessment_score", "is", null),
		supabase.from("families").select("assessment_score"),
		supabase.from("aid").select("id, aid_date, families(file_number)").order("aid_date", { ascending: false }).limit(3),
		supabase.from("visits").select("id, visit_date, families(file_number)").order("visit_date", { ascending: false }).limit(3),
	]);

	const aidTotal = (aidResult.data ?? []).reduce((sum, record) => sum + Number(record.amount ?? 0), 0);
	const scores = scoresResult.data ?? [];
	const averageScore = scores.length
		? scores.reduce((sum, record) => sum + Number(record.assessment_score), 0) / scores.length
		: 0;
	const categoryRows = [
		["حالة حرجة", (categoriesResult.data ?? []).filter((family) => Number(family.assessment_score) >= 80).length],
		["شديدة الاحتياج", (categoriesResult.data ?? []).filter((family) => Number(family.assessment_score) >= 60 && Number(family.assessment_score) < 80).length],
		["محتاجة", (categoriesResult.data ?? []).filter((family) => Number(family.assessment_score) >= 40 && Number(family.assessment_score) < 60).length],
		["متوسطة", (categoriesResult.data ?? []).filter((family) => Number(family.assessment_score) < 40).length],
	] as const;
	const maxCategoryCount = Math.max(1, ...categoryRows.map(([, count]) => count));
	const activities = [
		...(recentAidResult.data ?? []).map((record) => ({ id: `aid-${record.id}`, text: `تم تسجيل مساعدة جديدة للعائلة #${record.families?.[0]?.file_number ?? "—"}`, date: record.aid_date })),
		...(recentVisitsResult.data ?? []).map((record) => ({ id: `visit-${record.id}`, text: `تم تسجيل زيارة للعائلة #${record.families?.[0]?.file_number ?? "—"}`, date: record.visit_date })),
	].sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 5);
	const stats = [
		["إجمالي العائلات", familiesResult.count ?? 0, "ملف مسجل", Users],
		["المساعدات هذا الشهر", `${aidTotal.toLocaleString()} ل.س`, "حسب السجلات الحالية", HandHeart],
		["الزيارات القادمة", visitsResult.count ?? 0, "من اليوم فصاعداً", CalendarDays],
		["متوسط التقييم", averageScore.toFixed(1), "للعائلات المقيمة", TrendingUp],
	] as const;

	return (
		<div className="space-y-7">
			<div><h1 className="text-3xl font-bold">لوحة التحكم</h1><p className="mt-1 text-muted-foreground">نظرة عامة مباشرة من قاعدة بيانات الجمعية</p></div>
			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				{stats.map(([title, value, caption, Icon]) => <Card key={title}><CardContent className="flex items-center justify-between pt-5"><div><p className="text-sm text-muted-foreground">{title}</p><p className="mt-2 text-3xl font-bold">{value}</p><p className="mt-1 text-xs text-primary">{caption}</p></div><div className="rounded-xl bg-primary/10 p-3 text-primary"><Icon size={24} /></div></CardContent></Card>)}
			</div>
			<div className="grid gap-5 lg:grid-cols-2">
				<Card><CardHeader><CardTitle>العائلات حسب درجة التقييم</CardTitle></CardHeader><CardContent><div className="space-y-4">{categoryRows.map(([name, count]) => <div key={name}><div className="mb-1 flex justify-between text-sm"><span>{name}</span><span>{count}</span></div><div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-primary" style={{ width: `${(count / maxCategoryCount) * 100}%` }} /></div></div>)}</div></CardContent></Card>
				<Card><CardHeader><CardTitle>آخر النشاطات</CardTitle></CardHeader><CardContent><div className="space-y-4 text-sm">{activities.length ? activities.map((activity) => <p key={activity.id}>{activity.text} <span className="text-muted-foreground">{activity.date}</span></p>) : <p className="text-muted-foreground">لا توجد نشاطات مسجلة.</p>}</div></CardContent></Card>
			</div>
		</div>
	);
}
