import { createFamiliesQuery, fallbackFamilyCategories } from "@/lib/families-query";
import Link from "next/link";

type FamiliesPageProps = {
  searchParams: Promise<{
    q?: string;
    page?: string;
    minScore?: string;
    maxScore?: string;
    category?: string;
  }>;
};

const pageSize = 25;

export default async function FamiliesPage({ searchParams }: FamiliesPageProps) {
  const filters = await searchParams;
  const query = filters.q?.trim() || "";
  const currentPage = Math.max(1, Number(filters.page) || 1);
  const from = (currentPage - 1) * pageSize;
  const to = from + pageSize - 1;
  const { familiesQuery, supabase } = await createFamiliesQuery(filters);
  const [
    { data: families, count, error },
    { data: categories, error: categoriesError },
  ] = await Promise.all([
    familiesQuery.range(from, to),
    supabase.from("family_categories").select("id, name").order("id"),
  ]);
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / pageSize));
  const categoryOptions = categories?.length ? categories : fallbackFamilyCategories;
  const exportParams = new URLSearchParams();
  if (query) exportParams.set("q", query);
  if (filters.minScore) exportParams.set("minScore", filters.minScore);
  if (filters.maxScore) exportParams.set("maxScore", filters.maxScore);
  if (filters.category) exportParams.set("category", filters.category);
  const exportHref = `/api/families/export${exportParams.size ? `?${exportParams}` : ""}`;

  function pageHref(page: number) {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (filters.minScore) params.set("minScore", filters.minScore);
    if (filters.maxScore) params.set("maxScore", filters.maxScore);
    if (filters.category) params.set("category", filters.category);
    params.set("page", String(page));
    return `/families?${params.toString()}`;
  }

  const queryError = error ?? categoriesError;
  if (queryError) {
    console.error("Families page query error:", queryError);

    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <h2 className="text-lg font-semibold text-red-700">
          خطأ في تحميل العائلات
        </h2>

        <p className="mt-2 text-sm text-red-600">
          {queryError.message}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">العائلات</h1>
          <p className="mt-1 text-muted-foreground">
            عرض {count === 0 ? 0 : from + 1} إلى {Math.min(from + pageSize, count ?? 0)} من أصل {count ?? 0} عائلة
          </p>
        </div>

        <div className="flex gap-2">
          <a
            href={exportHref}
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            تصدير Excel
          </a>
          <Link
            href="/families/new"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            + إضافة عائلة
          </Link>
        </div>
      </div>

      <form method="get" className="grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-[minmax(0,1fr)_130px_130px_180px_auto_auto]">
        <input
          name="q"
          defaultValue={query}
          placeholder="بحث بالاسم أو رقم الملف أو الهاتف..."
          className="rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
        />
        <input
          name="minScore"
          type="number"
          min="0"
          placeholder="أدنى تقييم"
          defaultValue={filters.minScore}
          className="rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
        />
        <input
          name="maxScore"
          type="number"
          min="0"
          placeholder="أعلى تقييم"
          defaultValue={filters.maxScore}
          className="rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
        />
        <select
          name="category"
          defaultValue={filters.category ?? ""}
          className="rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">كل التصنيفات</option>
          {categoryOptions.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          بحث وتصفية
        </button>
        <Link href="/families" className="rounded-lg border px-4 py-2 text-center text-sm font-medium hover:bg-muted">
          إعادة ضبط
        </Link>
      </form>

      <div className="overflow-hidden rounded-xl border bg-card">
        <table className="w-full">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-right">رقم الملف</th>
              <th className="px-4 py-3 text-right">اسم المستفيد</th>
              <th className="px-4 py-3 text-right">العنوان</th>
              <th className="px-4 py-3 text-right">الهاتف</th>
              <th className="px-4 py-3 text-right">التقييم</th>
              <th className="px-4 py-3 text-right">إجراء</th>
            </tr>
          </thead>

          <tbody>
            {families?.map((family) => (
              <tr
                key={family.id}
                className="border-b last:border-0 hover:bg-muted/30"
              >
                <td className="px-4 py-3">
                  {family.file_number}
                </td>

                <td className="px-4 py-3 font-medium">
                  {family.beneficiary_name}
                </td>

                <td className="px-4 py-3">
                  {family.address || "—"}
                </td>

                <td className="px-4 py-3">
                  {family.phone || "—"}
                </td>

                <td className="px-4 py-3">
                  {family.assessment_score ?? "—"}
                </td>

                <td className="px-4 py-3">
                  <div className="flex gap-3">
                    <Link href={`/families/${family.id}`} className="text-primary hover:underline">
                      عرض
                    </Link>
                    <Link href={`/families/${family.id}/edit`} className="text-muted-foreground hover:text-primary hover:underline">
                      تعديل
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {(!families || families.length === 0) && (
          <div className="p-10 text-center text-muted-foreground">
            لا توجد عائلات.
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <nav className="flex items-center justify-center gap-2" aria-label="صفحات العائلات">
          {currentPage > 1 && (
            <Link href={pageHref(currentPage - 1)} className="rounded-lg border px-4 py-2 text-sm hover:bg-muted">
              السابق
            </Link>
          )}
          <span className="px-3 text-sm text-muted-foreground">
            صفحة {Math.min(currentPage, totalPages)} من {totalPages}
          </span>
          {currentPage < totalPages && (
            <Link href={pageHref(currentPage + 1)} className="rounded-lg border px-4 py-2 text-sm hover:bg-muted">
              التالي
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}