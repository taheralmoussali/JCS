import { supabaseServer } from "@/lib/supabase-server";

export type FamilyFilters = {
  q?: string;
  minScore?: string;
  maxScore?: string;
  category?: string;
};

export const fallbackFamilyCategories = [
  { id: 1, name: "فقراء" },
  { id: 2, name: "ارملة" },
  { id: 3, name: "ايتام" },
  { id: 4, name: "مريض" },
  { id: 5, name: "ذوو إعاقة" },
  { id: 6, name: "شهداء" },
];

export async function createFamiliesQuery(filters: FamilyFilters) {
  const supabase = await supabaseServer();
  const query = filters.q?.trim() || "";
  const minScore = Number(filters.minScore);
  const maxScore = Number(filters.maxScore);
  const hasMinScore = Number.isFinite(minScore) && filters.minScore !== "";
  const hasMaxScore = Number.isFinite(maxScore) && filters.maxScore !== "";
  const categoryId = Number(filters.category);
  const hasCategory = Number.isInteger(categoryId) && categoryId > 0 && filters.category !== "";

  let familiesQuery = supabase
    .from("families")
    .select(`
      id,
      file_number,
      beneficiary_name,
      national_id,
      family_book,
      address,
      phone,
      landline_number,
      field_supervisor_1,
      field_supervisor_2,
      study_writer,
      evaluator_1,
      evaluator_2,
      reviewer,
      study_date,
      assessment_score,
      family_category
    `, { count: "exact" })
    .order("file_number", { ascending: true });

  if (query) {
    const fileNumber = Number(query);
    if (Number.isInteger(fileNumber)) {
      familiesQuery = familiesQuery.or(
        `beneficiary_name.ilike.%${query}%,national_id.ilike.%${query}%,phone.ilike.%${query}%,address.ilike.%${query}%,file_number.eq.${fileNumber}`
      );
    } else {
      familiesQuery = familiesQuery.or(
        `beneficiary_name.ilike.%${query}%,national_id.ilike.%${query}%,phone.ilike.%${query}%,address.ilike.%${query}%`
      );
    }
  }

  if (hasMinScore) familiesQuery = familiesQuery.gte("assessment_score", minScore);
  if (hasMaxScore) familiesQuery = familiesQuery.lte("assessment_score", maxScore);
  if (hasCategory) familiesQuery = familiesQuery.eq("family_category", categoryId);

  return { familiesQuery, supabase };
}
