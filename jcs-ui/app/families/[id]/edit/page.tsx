"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Member = {
  id?: number;
  name: string;
  relationship: string;
  gender_id: string;
  birth_date: string;
  marital_status_id: string;
  education_id: string;
  occupation: string;
  monthly_income: string;
  health_status: string;
  notes: string;
  father_name: string;
  mother_name: string;
};
type Option = { id: number; name: string };
const defaultOptions = {
  relationships: [
    { id: 1, name: "زوج" },
    { id: 2, name: "زوجة" },
    { id: 3, name: "ابن" },
    { id: 4, name: "ابنة" },
    { id: 5, name: "أب" },
    { id: 6, name: "أم" },
  ],
  genders: [
    { id: 1, name: "ذكر" },
    { id: 2, name: "أنثى" },
  ],
  maritalStatuses: [
    { id: 1, name: "أعزب" },
    { id: 2, name: "متزوج" },
    { id: 3, name: "مطلق" },
    { id: 4, name: "أرمل" },
  ],
  educationLevels: [
    { id: 1, name: "أمي" },
    { id: 2, name: "اعدادي" },
    { id: 3, name: "ثانوي" },
    { id: 4, name: "معهد" },
    { id: 5, name: "جامعي" },
    { id: 6, name: "ابتدائي" },
  ],
};
type Housing = {
  id?: number;
  ownership_id: string;
  housing_type: string;
  room_count: string;
  bathroom_count: string;
  condition: string;
  monthly_rent: string;
  notes: string;
};
const emptyMember = (): Member => ({
  name: "",
  relationship: "",
  gender_id: "",
  birth_date: "",
  marital_status_id: "",
  education_id: "",
  occupation: "",
  monthly_income: "",
  health_status: "",
  notes: "",
  father_name: "",
  mother_name: "",
});
const emptyHousing: Housing = {
  ownership_id: "",
  housing_type: "",
  room_count: "",
  bathroom_count: "",
  condition: "",
  monthly_rent: "",
  notes: "",
};

export default function EditFamilyPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [options, setOptions] = useState<{
    relationships: Option[];
    genders: Option[];
    maritalStatuses: Option[];
    educationLevels: Option[];
  }>({
    ...defaultOptions,
  });
  const [form, setForm] = useState({
    file_number: "",
    beneficiary_name: "",
    national_id: "",
    family_book: "",
    address: "",
    phone: "",
    landline_number: "",
    study_date: "",
    assessment_score: "",
  });
  const [members, setMembers] = useState<Member[]>([]);
  const [originalMemberIds, setOriginalMemberIds] = useState<number[]>([]);
  const [housing, setHousing] = useState<Housing>(emptyHousing);
  const inputClass =
    "w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20";

  useEffect(() => {
    const supabase = supabaseBrowser();
    Promise.all([
      supabase.from("family_relationships").select("id, name").order("id"),
      supabase.from("genders").select("id, name").order("id"),
      supabase.from("marital_statuses").select("id, name").order("id"),
      supabase.from("education_levels").select("id, name").order("id"),
    ]).then(([relationships, genders, maritalStatuses, educationLevels]) =>
      setOptions({
        relationships: relationships.data?.length ? relationships.data : defaultOptions.relationships,
        genders: genders.data?.length ? genders.data : defaultOptions.genders,
        maritalStatuses: maritalStatuses.data?.length ? maritalStatuses.data : defaultOptions.maritalStatuses,
        educationLevels: educationLevels.data?.length ? educationLevels.data : defaultOptions.educationLevels,
      }),
    );
  }, []);

  useEffect(() => {
    async function loadData() {
      const supabase = supabaseBrowser();
      const [
        { data: family, error: familyError },
        { data: familyMembers, error: membersError },
        { data: familyHousing, error: housingError },
      ] = await Promise.all([
        supabase
          .from("families")
          .select(
            "file_number, beneficiary_name, national_id, family_book, address, phone, landline_number, study_date, assessment_score",
          )
          .eq("id", id)
          .single(),
        supabase
          .from("family_members")
          .select(
            "id, name, relationship, gender_id, birth_date, marital_status_id, education_id, occupation, monthly_income, health_status, disability, disability_details, notes, father_name, mother_name",
          )
          .eq("family_id", id)
          .order("id"),
        supabase
          .from("housing")
          .select(
            "id, ownership_id, housing_type, room_count, bathroom_count, condition, monthly_rent, notes",
          )
          .eq("family_id", id)
          .maybeSingle(),
      ]);
      const loadError = familyError || membersError || housingError;
      if (loadError) setError(loadError.message);
      if (family)
        setForm({
          file_number: String(family.file_number ?? ""),
          beneficiary_name: family.beneficiary_name ?? "",
          national_id: family.national_id ?? "",
          family_book: family.family_book ?? "",
          address: family.address ?? "",
          phone: family.phone ?? "",
          landline_number: family.landline_number ?? "",
          study_date: family.study_date ?? "",
          assessment_score: String(family.assessment_score ?? ""),
        });
      setMembers(
        (familyMembers ?? []).map((member) => ({
          id: member.id,
          name: member.name ?? "",
          relationship: String(member.relationship ?? ""),
          gender_id: String(member.gender_id ?? ""),
          birth_date: member.birth_date ?? "",
          marital_status_id: String(member.marital_status_id ?? ""),
          education_id: String(member.education_id ?? ""),
          occupation: member.occupation ?? "",
          monthly_income: String(member.monthly_income ?? ""),
          health_status: member.health_status ?? "",
          notes: member.notes ?? "",
          father_name: member.father_name ?? "",
          mother_name: member.mother_name ?? "",
        })),
      );
      setOriginalMemberIds((familyMembers ?? []).map((member) => member.id));
      if (familyHousing)
        setHousing({
          id: familyHousing.id,
          ownership_id: String(familyHousing.ownership_id ?? ""),
          housing_type: familyHousing.housing_type ?? "",
          room_count: String(familyHousing.room_count ?? ""),
          bathroom_count: String(familyHousing.bathroom_count ?? ""),
          condition: familyHousing.condition ?? "",
          monthly_rent: String(familyHousing.monthly_rent ?? ""),
          notes: familyHousing.notes ?? "",
        });
      setLoading(false);
    }
    loadData();
  }, [id]);

  async function saveFamily(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const supabase = supabaseBrowser();
    const { error: familyError } = await supabase
      .from("families")
      .update({
        file_number: Number(form.file_number),
        beneficiary_name: form.beneficiary_name.trim(),
        national_id: form.national_id || null,
        family_book: form.family_book || null,
        address: form.address || null,
        phone: form.phone || null,
        landline_number: form.landline_number || null,
        study_date: form.study_date || null,
        assessment_score: form.assessment_score
          ? Number(form.assessment_score)
          : null,
      })
      .eq("id", id);
    if (familyError) {
      setError(familyError.message);
      setSaving(false);
      return;
    }

    const originalIds = new Set(originalMemberIds);
    const currentIds = new Set(
      members.filter((member) => member.id).map((member) => member.id),
    );
    const removedIds = [...originalIds].filter(
      (memberId) => !currentIds.has(memberId),
    );
    if (removedIds.length) {
      const { error } = await supabase
        .from("family_members")
        .delete()
        .in("id", removedIds);
      if (error) {
        setError(error.message);
        setSaving(false);
        return;
      }
    }
    const memberValues = (member: Member) => ({
        family_id: Number(id),
        name: member.name.trim(),
        relationship: member.relationship ? Number(member.relationship) : null,
        gender_id: member.gender_id ? Number(member.gender_id) : null,
        birth_date: member.birth_date || null,
        marital_status_id: member.marital_status_id
          ? Number(member.marital_status_id)
          : null,
        education_id: member.education_id ? Number(member.education_id) : null,
        occupation: member.occupation || null,
        monthly_income: member.monthly_income
          ? Number(member.monthly_income)
          : null,
        health_status: member.health_status || null,
        notes: member.notes || null,
        father_name: member.father_name || null,
        mother_name: member.mother_name || null,
      });
    for (const member of members.filter((item) => item.id && item.name.trim())) {
      const result = await supabase
        .from("family_members")
        .update(memberValues(member))
        .eq("id", member.id);
      if (result.error) {
        setError(result.error.message);
        setSaving(false);
        return;
      }
    }
    const newMembers = members
      .filter((member) => !member.id && member.name.trim())
      .map(memberValues);
    if (newMembers.length) {
      const { data: insertedMembers, error: newMembersError } = await supabase
        .from("family_members")
        .insert(newMembers)
        .select("id");
      if (newMembersError) {
        setError(`تعذر حفظ أفراد الأسرة: ${newMembersError.message}`);
        setSaving(false);
        return;
      }
      if (!insertedMembers || insertedMembers.length !== newMembers.length) {
        setError("لم يتم حفظ جميع أفراد الأسرة الجدد. يرجى المحاولة مرة أخرى.");
        setSaving(false);
        return;
      }
    }

    const hasHousing = [
      housing.ownership_id,
      housing.housing_type,
      housing.room_count,
      housing.bathroom_count,
      housing.condition,
      housing.monthly_rent,
      housing.notes,
    ].some(Boolean);
    if (hasHousing) {
      const values = {
        family_id: Number(id),
        ownership_id: housing.ownership_id
          ? Number(housing.ownership_id)
          : null,
        housing_type: housing.housing_type || null,
        room_count: housing.room_count ? Number(housing.room_count) : null,
        bathroom_count: housing.bathroom_count
          ? Number(housing.bathroom_count)
          : null,
        condition: housing.condition || null,
        monthly_rent: housing.monthly_rent
          ? Number(housing.monthly_rent)
          : null,
        notes: housing.notes || null,
      };
      const result = housing.id
        ? await supabase.from("housing").update(values).eq("id", housing.id)
        : await supabase.from("housing").insert(values);
      if (result.error) {
        setError(result.error.message);
        setSaving(false);
        return;
      }
    }
    router.replace(`/families/${id}`);
    router.refresh();
  }

  if (loading)
    return (
      <div className="p-8 text-muted-foreground">
        جاري تحميل بيانات العائلة...
      </div>
    );
  const memberFields = [
    ["birth_date", "تاريخ الميلاد", "date"],
    ["occupation", "المهنة", "text"],
    ["monthly_income", "الدخل الشهري", "number"],
    ["health_status", "الحالة الصحية", "text"],
    ["notes", "ملاحظات", "text"],
  ] as const;
  const housingFields = [
    ["ownership_id", "رقم نوع الملكية", "number"],
    ["housing_type", "نوع السكن", "text"],
    ["room_count", "عدد الغرف", "number"],
    ["bathroom_count", "عدد الحمامات", "number"],
    ["condition", "حالة السكن", "text"],
    ["monthly_rent", "الإيجار الشهري", "number"],
    ["notes", "ملاحظات السكن", "text"],
  ] as const;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            العائلات / تعديل الملف
          </p>
          <h1 className="mt-1 text-3xl font-bold">تعديل ملف الأسرة</h1>
        </div>
        <Link
          href={`/families/${id}`}
          className="rounded-lg border px-4 py-2 text-sm hover:bg-muted"
        >
          إلغاء
        </Link>
      </div>
      <form onSubmit={saveFamily} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>1. المعلومات الأساسية</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-5 md:grid-cols-3">
              {[
                ["file_number", "رقم الملف *", "number"],
                ["beneficiary_name", "اسم المستفيد *", "text"],
                ["national_id", "الرقم الوطني", "text"],
                ["family_book", "دفتر العائلة", "text"],
                ["address", "العنوان", "text"],
                ["phone", "الهاتف", "tel"],
                ["landline_number", "الهاتف الأرضي", "tel"],
                ["study_date", "تاريخ الدراسة", "date"],
                ["assessment_score", "درجة التقييم", "number"],
              ].map(([field, label, type]) => (
                <label key={field} className="space-y-2 text-sm">
                  <span>{label}</span>
                  <input
                    required={
                      field === "file_number" || field === "beneficiary_name"
                    }
                    type={type}
                    value={form[field as keyof typeof form]}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        [field]: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </label>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>2. أفراد الأسرة</CardTitle>
              <button
                type="button"
                onClick={() =>
                  setMembers((current) => [...current, emptyMember()])
                }
                className="rounded-lg border px-3 py-2 text-sm hover:bg-muted"
              >
                + إضافة فرد
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {members.map((member, index) => (
              <div
                key={member.id ?? `new-${index}`}
                className="rounded-lg border p-4"
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="font-medium">فرد {index + 1}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setMembers((current) =>
                        current.filter((_, i) => i !== index),
                      )
                    }
                    className="text-sm text-red-600"
                  >
                    حذف
                  </button>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <label className="space-y-2 text-sm">
                    <span>الاسم الكامل</span>
                    <input
                      required
                      type="text"
                      value={member.name}
                      onChange={(event) =>
                        setMembers((current) =>
                          current.map((item, i) =>
                            i === index
                              ? { ...item, name: event.target.value }
                              : item,
                          ),
                        )
                      }
                      className={inputClass}
                    />
                  </label>
                  {[
                    ["father_name", "اسم الأب"],
                    ["mother_name", "اسم الأم"],
                  ].map(([field, label]) => (
                    <label key={field} className="space-y-2 text-sm">
                      <span>{label}</span>
                      <input
                        type="text"
                        value={member[field as keyof Member] as string}
                        onChange={(event) =>
                          setMembers((current) =>
                            current.map((item, i) =>
                              i === index
                                ? { ...item, [field]: event.target.value }
                                : item,
                            ),
                          )
                        }
                        className={inputClass}
                      />
                    </label>
                  ))}
                  {[
                    ["relationship", "صلة القرابة", options.relationships],
                    ["gender_id", "الجنس", options.genders],
                    [
                      "marital_status_id",
                      "الحالة الاجتماعية",
                      options.maritalStatuses,
                    ],
                    [
                      "education_id",
                      "المستوى التعليمي",
                      options.educationLevels,
                    ],
                  ].map(([field, label, values]) => (
                    <label key={field as string} className="space-y-2 text-sm">
                      <span>{label as string}</span>
                      <select
                        value={member[field as keyof Member] as string}
                        onChange={(event) =>
                          setMembers((current) =>
                            current.map((item, i) =>
                              i === index
                                ? {
                                    ...item,
                                    [field as string]: event.target.value,
                                  }
                                : item,
                            ),
                          )
                        }
                        className={inputClass}
                      >
                        <option value="">اختر</option>
                        {(values as Option[]).map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                  {memberFields.map(([field, label, type]) => (
                    <label key={field} className="space-y-2 text-sm">
                      <span>{label}</span>
                      <input
                        type={type}
                        value={member[field]}
                        onChange={(event) =>
                          setMembers((current) =>
                            current.map((item, i) =>
                              i === index
                                ? { ...item, [field]: event.target.value }
                                : item,
                            ),
                          )
                        }
                        className={inputClass}
                      />
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>3. معلومات السكن</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-5 md:grid-cols-3">
              {housingFields.map(([field, label, type]) => (
                <label key={field} className="space-y-2 text-sm">
                  <span>{label}</span>
                  <input
                    type={type}
                    value={housing[field]}
                    onChange={(event) =>
                      setHousing((current) => ({
                        ...current,
                        [field]: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </label>
              ))}
            </div>
          </CardContent>
        </Card>
        {error && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </p>
        )}
        <div className="flex justify-end">
          <button
            disabled={saving}
            className="rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground disabled:opacity-50"
          >
            {saving ? "جاري حفظ التعديلات..." : "حفظ كل التعديلات"}
          </button>
        </div>
      </form>
    </div>
  );
}
