"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Member = { id?: number; name: string; relationship: string; birth_date: string; occupation: string; monthly_income: string; health_status: string; disability: boolean; disability_details: string; notes: string };
type Housing = { id?: number; ownership_id: string; housing_type: string; room_count: string; bathroom_count: string; condition: string; monthly_rent: string; notes: string };
const emptyMember = (): Member => ({ name: "", relationship: "", birth_date: "", occupation: "", monthly_income: "", health_status: "", disability: false, disability_details: "", notes: "" });
const emptyHousing: Housing = { ownership_id: "", housing_type: "", room_count: "", bathroom_count: "", condition: "", monthly_rent: "", notes: "" };

export default function EditFamilyPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ file_number: "", beneficiary_name: "", national_id: "", family_book: "", address: "", phone: "", landline_number: "", study_date: "", assessment_score: "" });
  const [members, setMembers] = useState<Member[]>([]);
  const [originalMemberIds, setOriginalMemberIds] = useState<number[]>([]);
  const [housing, setHousing] = useState<Housing>(emptyHousing);
  const inputClass = "w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20";

  useEffect(() => {
    async function loadData() {
      const supabase = supabaseBrowser();
      const [{ data: family, error: familyError }, { data: familyMembers, error: membersError }, { data: familyHousing, error: housingError }] = await Promise.all([
        supabase.from("families").select("file_number, beneficiary_name, national_id, family_book, address, phone, landline_number, study_date, assessment_score").eq("id", id).single(),
        supabase.from("family_members").select("id, name, relationship, birth_date, occupation, monthly_income, health_status, disability, disability_details, notes").eq("family_id", id).order("id"),
        supabase.from("housing").select("id, ownership_id, housing_type, room_count, bathroom_count, condition, monthly_rent, notes").eq("family_id", id).maybeSingle(),
      ]);
      const loadError = familyError || membersError || housingError;
      if (loadError) setError(loadError.message);
      if (family) setForm({ file_number: String(family.file_number ?? ""), beneficiary_name: family.beneficiary_name ?? "", national_id: family.national_id ?? "", family_book: family.family_book ?? "", address: family.address ?? "", phone: family.phone ?? "", landline_number: family.landline_number ?? "", study_date: family.study_date ?? "", assessment_score: String(family.assessment_score ?? "") });
      setMembers((familyMembers ?? []).map((member) => ({ id: member.id, name: member.name ?? "", relationship: String(member.relationship ?? ""), birth_date: member.birth_date ?? "", occupation: member.occupation ?? "", monthly_income: String(member.monthly_income ?? ""), health_status: member.health_status ?? "", disability: Boolean(member.disability), disability_details: member.disability_details ?? "", notes: member.notes ?? "" })));
      setOriginalMemberIds((familyMembers ?? []).map((member) => member.id));
      if (familyHousing) setHousing({ id: familyHousing.id, ownership_id: String(familyHousing.ownership_id ?? ""), housing_type: familyHousing.housing_type ?? "", room_count: String(familyHousing.room_count ?? ""), bathroom_count: String(familyHousing.bathroom_count ?? ""), condition: familyHousing.condition ?? "", monthly_rent: String(familyHousing.monthly_rent ?? ""), notes: familyHousing.notes ?? "" });
      setLoading(false);
    }
    loadData();
  }, [id]);

  async function saveFamily(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError("");
    const supabase = supabaseBrowser();
    const { error: familyError } = await supabase.from("families").update({ file_number: Number(form.file_number), beneficiary_name: form.beneficiary_name.trim(), national_id: form.national_id || null, family_book: form.family_book || null, address: form.address || null, phone: form.phone || null, landline_number: form.landline_number || null, study_date: form.study_date || null, assessment_score: form.assessment_score ? Number(form.assessment_score) : null }).eq("id", id);
    if (familyError) { setError(familyError.message); setSaving(false); return; }

    const originalIds = new Set(originalMemberIds);
    const currentIds = new Set(members.filter((member) => member.id).map((member) => member.id));
    const removedIds = [...originalIds].filter((memberId) => !currentIds.has(memberId));
    if (removedIds.length) { const { error } = await supabase.from("family_members").delete().in("id", removedIds); if (error) { setError(error.message); setSaving(false); return; } }
    for (const member of members) {
      const values = { family_id: Number(id), name: member.name.trim(), relationship: member.relationship ? Number(member.relationship) : null, birth_date: member.birth_date || null, occupation: member.occupation || null, monthly_income: member.monthly_income ? Number(member.monthly_income) : null, health_status: member.health_status || null, disability: member.disability, disability_details: member.disability_details || null, notes: member.notes || null };
      const result = member.id ? await supabase.from("family_members").update(values).eq("id", member.id) : await supabase.from("family_members").insert(values);
      if (result.error) { setError(result.error.message); setSaving(false); return; }
    }

    const hasHousing = [housing.ownership_id, housing.housing_type, housing.room_count, housing.bathroom_count, housing.condition, housing.monthly_rent, housing.notes].some(Boolean);
    if (hasHousing) {
      const values = { family_id: Number(id), ownership_id: housing.ownership_id ? Number(housing.ownership_id) : null, housing_type: housing.housing_type || null, room_count: housing.room_count ? Number(housing.room_count) : null, bathroom_count: housing.bathroom_count ? Number(housing.bathroom_count) : null, condition: housing.condition || null, monthly_rent: housing.monthly_rent ? Number(housing.monthly_rent) : null, notes: housing.notes || null };
      const result = housing.id ? await supabase.from("housing").update(values).eq("id", housing.id) : await supabase.from("housing").insert(values);
      if (result.error) { setError(result.error.message); setSaving(false); return; }
    }
    router.push(`/families/${id}`); router.refresh();
  }

  if (loading) return <div className="p-8 text-muted-foreground">جاري تحميل بيانات العائلة...</div>;
  const memberFields = [["name", "الاسم", "text"], ["relationship", "صلة القرابة (رقم)", "number"], ["birth_date", "تاريخ الميلاد", "date"], ["occupation", "المهنة", "text"], ["monthly_income", "الدخل الشهري", "number"], ["health_status", "الحالة الصحية", "text"], ["disability_details", "تفاصيل الإعاقة", "text"], ["notes", "ملاحظات", "text"]] as const;
  const housingFields = [["ownership_id", "رقم نوع الملكية", "number"], ["housing_type", "نوع السكن", "text"], ["room_count", "عدد الغرف", "number"], ["bathroom_count", "عدد الحمامات", "number"], ["condition", "حالة السكن", "text"], ["monthly_rent", "الإيجار الشهري", "number"], ["notes", "ملاحظات السكن", "text"]] as const;

  return <div className="mx-auto max-w-5xl space-y-6"><div className="flex items-start justify-between gap-4"><div><p className="text-sm text-muted-foreground">العائلات / تعديل الملف</p><h1 className="mt-1 text-3xl font-bold">تعديل ملف الأسرة</h1></div><Link href={`/families/${id}`} className="rounded-lg border px-4 py-2 text-sm hover:bg-muted">إلغاء</Link></div><form onSubmit={saveFamily} className="space-y-6">
    <Card><CardHeader><CardTitle>1. المعلومات الأساسية</CardTitle></CardHeader><CardContent><div className="grid gap-5 md:grid-cols-3">{[["file_number", "رقم الملف *", "number"], ["beneficiary_name", "اسم المستفيد *", "text"], ["national_id", "الرقم الوطني", "text"], ["family_book", "دفتر العائلة", "text"], ["address", "العنوان", "text"], ["phone", "الهاتف", "tel"], ["landline_number", "الهاتف الأرضي", "tel"], ["study_date", "تاريخ الدراسة", "date"], ["assessment_score", "درجة التقييم", "number"]].map(([field, label, type]) => <label key={field} className="space-y-2 text-sm"><span>{label}</span><input required={field === "file_number" || field === "beneficiary_name"} type={type} value={form[field as keyof typeof form]} onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.value }))} className={inputClass} /></label>)}</div></CardContent></Card>
    <Card><CardHeader><div className="flex items-center justify-between"><CardTitle>2. أفراد الأسرة</CardTitle><button type="button" onClick={() => setMembers((current) => [...current, emptyMember()])} className="rounded-lg border px-3 py-2 text-sm hover:bg-muted">+ إضافة فرد</button></div></CardHeader><CardContent className="space-y-5">{members.map((member, index) => <div key={member.id ?? `new-${index}`} className="rounded-lg border p-4"><div className="mb-4 flex items-center justify-between"><span className="font-medium">فرد {index + 1}</span><button type="button" onClick={() => setMembers((current) => current.filter((_, i) => i !== index))} className="text-sm text-red-600">حذف</button></div><div className="grid gap-4 md:grid-cols-3">{memberFields.map(([field, label, type]) => <label key={field} className="space-y-2 text-sm"><span>{label}</span><input type={type} value={member[field]} onChange={(event) => setMembers((current) => current.map((item, i) => i === index ? { ...item, [field]: event.target.value } : item))} className={inputClass} /></label>)}<label className="flex items-center gap-2 pt-7 text-sm"><input type="checkbox" checked={member.disability} onChange={(event) => setMembers((current) => current.map((item, i) => i === index ? { ...item, disability: event.target.checked } : item))} /> لديه إعاقة</label></div></div>)}</CardContent></Card>
    <Card><CardHeader><CardTitle>3. معلومات السكن</CardTitle></CardHeader><CardContent><div className="grid gap-5 md:grid-cols-3">{housingFields.map(([field, label, type]) => <label key={field} className="space-y-2 text-sm"><span>{label}</span><input type={type} value={housing[field]} onChange={(event) => setHousing((current) => ({ ...current, [field]: event.target.value }))} className={inputClass} /></label>)}</div></CardContent></Card>
    {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}<div className="flex justify-end"><button disabled={saving} className="rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground disabled:opacity-50">{saving ? "جاري حفظ التعديلات..." : "حفظ كل التعديلات"}</button></div>
  </form></div>;
}
