import { supabaseServer } from "@/lib/supabase-server";

export default async function AidPage() {
  const supabase = await supabaseServer();

  const { data: aid, error } = await supabase
    .from("aid")
    .select(`
      id,
      amount,
      aid_date,
      description,
      families (
        file_number,
        beneficiary_name
      )
    `)
    .order("aid_date", { ascending: false });

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <h2 className="text-lg font-semibold text-red-700">
          خطأ في تحميل المساعدات
        </h2>
        <p className="mt-2 text-sm text-red-600">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">المساعدات</h1>
        <p className="mt-1 text-muted-foreground">
          إجمالي سجلات المساعدة: {aid?.length ?? 0}
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <table className="w-full">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-right">رقم الملف</th>
              <th className="px-4 py-3 text-right">اسم المستفيد</th>
              <th className="px-4 py-3 text-right">المبلغ</th>
              <th className="px-4 py-3 text-right">التاريخ</th>
              <th className="px-4 py-3 text-right">الوصف</th>
            </tr>
          </thead>
          <tbody>
            {aid?.map((record) => (
              <tr key={record.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3">{record.families?.[0]?.file_number ?? "—"}</td>
                <td className="px-4 py-3 font-medium">{record.families?.[0]?.beneficiary_name ?? "—"}</td>
                <td className="px-4 py-3">{record.amount ?? "—"}</td>
                <td className="px-4 py-3">{record.aid_date ?? "—"}</td>
                <td className="px-4 py-3">{record.description || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!aid || aid.length === 0) && (
          <div className="p-10 text-center text-muted-foreground">
            لا توجد سجلات مساعدة.
          </div>
        )}
      </div>
    </div>
  );
}