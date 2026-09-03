"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Member = {
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
const newMember = (): Member => ({
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

export default function NewFamily() {
  const router = useRouter();
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
  const [members, setMembers] = useState<Member[]>([newMember()]);
  const [housing, setHousing] = useState({
    ownership_id: "",
    housing_type: "",
    room_count: "",
    bathroom_count: "",
    condition: "",
    monthly_rent: "",
    notes: "",
  });
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

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const supabase = supabaseBrowser();
    const { data: family, error: familyError } = await supabase
      .from("families")
      .insert({
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
      .select("id")
      .single();
    if (familyError || !family) {
      setError(familyError?.message || "تعذر إنشاء ملف الأسرة");
      setSaving(false);
      return;
    }
    const validMembers = members
      .filter((member) => member.name.trim())
      .map((member) => ({
        family_id: family.id,
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
      }));
    if (validMembers.length) {
      const { error: membersError } = await supabase
        .from("family_members")
        .insert(validMembers);
      if (membersError) {
        setError(membersError.message);
        setSaving(false);
        return;
      }
    }
    if (Object.values(housing).some(Boolean)) {
      const { error: housingError } = await supabase
        .from("housing")
        .insert({
          family_id: family.id,
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
        });
      if (housingError) {
        setError(housingError.message);
        setSaving(false);
        return;
      }
    }
    router.push(`/families/${family.id}`);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">إضافة ملف أسرة</h1>
        <p className="text-muted-foreground">
          أدخل المعلومات الأساسية وأفراد الأسرة والسكن في ملف واحد.
        </p>
      </div>
      <form onSubmit={submit} className="space-y-6">
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
                  setMembers((current) => [...current, newMember()])
                }
                className="rounded-lg border px-3 py-2 text-sm hover:bg-muted"
              >
                + إضافة فرد
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {members.map((member, index) => (
              <div key={index} className="rounded-lg border p-4">
                <div className="mb-4 flex items-center justify-between">
                  <span className="font-medium">فرد {index + 1}</span>
                  {members.length > 1 && (
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
                  )}
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
                  {[
                    ["birth_date", "تاريخ الميلاد", "date"],
                    ["occupation", "المهنة", "text"],
                    ["monthly_income", "الدخل الشهري", "number"],
                    ["health_status", "الحالة الصحية", "text"],
                    ["notes", "ملاحظات", "text"],
                  ].map(([field, label, type]) => (
                    <label key={field} className="space-y-2 text-sm">
                      <span>{label}</span>
                      <input
                        type={type}
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
              {[
                ["ownership_id", "رقم نوع الملكية", "number"],
                ["housing_type", "نوع السكن", "text"],
                ["room_count", "عدد الغرف", "number"],
                ["bathroom_count", "عدد الحمامات", "number"],
                ["condition", "حالة السكن", "text"],
                ["monthly_rent", "الإيجار الشهري", "number"],
                ["notes", "ملاحظات السكن", "text"],
              ].map(([field, label, type]) => (
                <label key={field} className="space-y-2 text-sm">
                  <span>{label}</span>
                  <input
                    type={type}
                    value={housing[field as keyof typeof housing]}
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
            {saving ? "جاري حفظ الملف..." : "حفظ ملف الأسرة"}
          </button>
        </div>
      </form>
    </div>
  );
}
