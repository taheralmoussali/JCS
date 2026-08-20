import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabaseServer } from "@/lib/supabase-server";

export default async function FamilyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await supabaseServer();
  const [{ data: family }, { data: members }, { data: housing }, { data: aid }, { data: visits }] = await Promise.all([
    supabase.from("families").select("*, family_categories(name)").eq("id", id).single(),
    supabase.from("family_members").select("*").eq("family_id", id).order("id"),
    supabase.from("housing").select("*").eq("family_id", id).maybeSingle(),
    supabase.from("aid").select("*").eq("family_id", id).order("aid_date", { ascending: false }),
    supabase.from("visits").select("*").eq("family_id", id).order("visit_date", { ascending: false }),
  ]);
  if (!family) notFound();

  const basicComplete = Boolean(family.file_number && family.beneficiary_name && family.address && family.phone && family.study_date && family.assessment_score);
  const complete = basicComplete && Boolean(members?.length) && Boolean(housing);
  const value = (item: unknown) => item === null || item === undefined || item === "" ? "—" : String(item);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div><p className="text-sm text-muted-foreground">العائلات / ملف الأسرة</p><h1 className="mt-1 text-3xl font-bold">{family.beneficiary_name}</h1><p className="text-muted-foreground">رقم الملف #{family.file_number}</p></div>
        <Link href={`/families/${id}/edit`} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">تعديل المعلومات</Link>
      </div>
      <div className={`rounded-lg border p-3 text-sm ${complete ? "border-green-200 bg-green-50 text-green-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
        {complete ? "ملف الأسرة مكتمل" : "الملف يحتاج إلى استكمال بعض المعلومات"}
        {!basicComplete && " - المعلومات الأساسية ناقصة"}{!members?.length && " - لا يوجد أفراد مسجلون"}{!housing && " - لا توجد معلومات سكن"}
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2"><CardHeader><CardTitle>المعلومات الأساسية</CardTitle></CardHeader><CardContent><div className="grid gap-4 md:grid-cols-3">{[["الاسم", family.beneficiary_name], ["الرقم الوطني", family.national_id], ["دفتر العائلة", family.family_book], ["العنوان", family.address], ["الهاتف", family.phone], ["الهاتف الأرضي", family.landline_number], ["التصنيف", family.family_categories?.name], ["تاريخ الدراسة", family.study_date], ["درجة التقييم", family.assessment_score]].map(([label, item]) => <div key={String(label)}><div className="text-xs text-muted-foreground">{label}</div><div className="mt-1 font-medium">{value(item)}</div></div>)}</div></CardContent></Card>
        <Card><CardHeader><CardTitle>ملخص</CardTitle></CardHeader><CardContent><div className="text-center"><div className="text-5xl font-bold text-primary">{value(family.assessment_score)}</div><div className="mt-2 text-sm text-muted-foreground">درجة التقييم</div></div></CardContent></Card>
      </div>
      <Card><CardHeader><CardTitle>أفراد الأسرة ({members?.length ?? 0})</CardTitle></CardHeader><CardContent>{members?.length ? <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b"><th className="px-3 py-2 text-right">الاسم</th><th className="px-3 py-2 text-right">صلة القرابة</th><th className="px-3 py-2 text-right">تاريخ الميلاد</th><th className="px-3 py-2 text-right">المهنة</th><th className="px-3 py-2 text-right">الدخل</th></tr></thead><tbody>{members.map((member) => <tr key={member.id} className="border-b last:border-0"><td className="px-3 py-2 font-medium">{value(member.name)}</td><td className="px-3 py-2">{value(member.relationship)}</td><td className="px-3 py-2">{value(member.birth_date)}</td><td className="px-3 py-2">{value(member.occupation)}</td><td className="px-3 py-2">{value(member.monthly_income)}</td></tr>)}</tbody></table></div> : <p className="text-sm text-muted-foreground">لم تتم إضافة أفراد الأسرة بعد.</p>}</CardContent></Card>
      <Card><CardHeader><CardTitle>السكن</CardTitle></CardHeader><CardContent>{housing ? <div className="grid gap-4 md:grid-cols-3">{[["نوع السكن", housing.housing_type], ["عدد الغرف", housing.room_count], ["عدد الحمامات", housing.bathroom_count], ["حالة السكن", housing.condition], ["الإيجار الشهري", housing.monthly_rent], ["ملاحظات", housing.notes]].map(([label, item]) => <div key={String(label)}><div className="text-xs text-muted-foreground">{label}</div><div className="mt-1 font-medium">{value(item)}</div></div>)}</div> : <p className="text-sm text-muted-foreground">لم تتم إضافة معلومات السكن بعد.</p>}</CardContent></Card>
      <div className="grid gap-5 lg:grid-cols-2"><Card><CardHeader><CardTitle>المساعدات ({aid?.length ?? 0})</CardTitle></CardHeader><CardContent>{aid?.length ? <div className="space-y-2 text-sm">{aid.map((item) => <div key={item.id} className="flex justify-between border-b pb-2"><span>{value(item.description)}</span><span>{value(item.amount)} - {value(item.aid_date)}</span></div>)}</div> : <p className="text-sm text-muted-foreground">لا توجد مساعدات مسجلة.</p>}</CardContent></Card><Card><CardHeader><CardTitle>الزيارات ({visits?.length ?? 0})</CardTitle></CardHeader><CardContent>{visits?.length ? <div className="space-y-2 text-sm">{visits.map((item) => <div key={item.id} className="border-b pb-2"><span>{value(item.visit_date)}</span><span className="mr-3 text-muted-foreground">{value(item.notes)}</span></div>)}</div> : <p className="text-sm text-muted-foreground">لا توجد زيارات مسجلة.</p>}</CardContent></Card></div>
    </div>
  );
}
