import { supabaseServer } from "@/lib/supabase-server";

export default async function VisitsPage() {
  const supabase = await supabaseServer();

  const { data: visits, error } = await supabase
    .from("visits")
    .select(`
      *,
      families (
        file_number,
        beneficiary_name
      )
    `)
    .order("visit_date", { ascending: false });

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <h2 className="text-lg font-semibold text-red-700">
          خطأ في تحميل الزيارات
        </h2>
        <p className="mt-2 text-sm text-red-600">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">الزيارات</h1>
        <p className="mt-1 text-muted-foreground">
          إجمالي الزيارات: {visits?.length ?? 0}
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <table className="w-full">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-right">رقم الملف</th>
              <th className="px-4 py-3 text-right">اسم المستفيد</th>
              <th className="px-4 py-3 text-right">تاريخ الزيارة</th>
              <th className="px-4 py-3 text-right">الملاحظات</th>
            </tr>
          </thead>
          <tbody>
            {visits?.map((visit) => (
              <tr key={visit.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3">{visit.families?.file_number ?? "—"}</td>
                <td className="px-4 py-3 font-medium">{visit.families?.beneficiary_name ?? "—"}</td>
                <td className="px-4 py-3">{visit.visit_date ?? "—"}</td>
                <td className="px-4 py-3">{visit.notes || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!visits || visits.length === 0) && (
          <div className="p-10 text-center text-muted-foreground">
            لا توجد زيارات.
          </div>
        )}
      </div>
    </div>
  );
}