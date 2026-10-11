import { createFamiliesQuery, fallbackFamilyCategories } from "@/lib/families-query";
import JSZip from "jszip";

const batchSize = 1000;
const columns = [
  { header: "رقم الملف", key: "file_number", width: 18 },
  { header: "اسم المستفيد", key: "beneficiary_name", width: 28 },
  { header: "الرقم الوطني", key: "national_id", width: 20 },
  { header: "دفتر العائلة", key: "family_book", width: 20 },
  { header: "العنوان", key: "address", width: 30 },
  { header: "الهاتف", key: "phone", width: 18 },
  { header: "الهاتف الأرضي", key: "landline_number", width: 18 },
  { header: "التصنيف", key: "category", width: 20 },
  { header: "مشرف الكشف (1)", key: "field_supervisor_1", width: 24 },
  { header: "مشرف الكشف (2)", key: "field_supervisor_2", width: 24 },
  { header: "محرر الدراسة", key: "study_writer", width: 24 },
  { header: "المقيّم الأول", key: "evaluator_1", width: 24 },
  { header: "المقيّم الثاني", key: "evaluator_2", width: 24 },
  { header: "المدقق", key: "reviewer", width: 24 },
  { header: "تاريخ الدراسة", key: "study_date", width: 18 },
  { header: "درجة التقييم", key: "assessment_score", width: 18 },
] as const;

type FamilyExportRow = {
  file_number: number;
  beneficiary_name: string;
  national_id: string;
  family_book: string;
  address: string;
  phone: string;
  landline_number: string;
  category: string;
  field_supervisor_1: string;
  field_supervisor_2: string;
  study_writer: string;
  evaluator_1: string;
  evaluator_2: string;
  reviewer: string;
  study_date: string;
  assessment_score: number | "";
};

function xmlEscape(value: string) {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function columnName(index: number) {
  let name = "";
  for (let value = index + 1; value > 0; value = Math.floor((value - 1) / 26)) {
    name = String.fromCharCode(((value - 1) % 26) + 65) + name;
  }
  return name;
}

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const { familiesQuery, supabase } = await createFamiliesQuery({
    q: searchParams.get("q") ?? "",
    minScore: searchParams.get("minScore") ?? "",
    maxScore: searchParams.get("maxScore") ?? "",
    category: searchParams.get("category") ?? "",
  });
  const { data: categories, error: categoriesError } = await supabase
    .from("family_categories")
    .select("id, name");

  if (categoriesError) {
    console.error("Family categories export query error:", categoriesError);
    return Response.json({ error: "تعذر تحميل تصنيفات العائلات." }, { status: 500 });
  }

  const categoryNames = new Map(
    fallbackFamilyCategories.map((category) => [category.id, category.name])
  );
  categories?.forEach((category) => categoryNames.set(category.id, category.name));

  const families = [];
  for (let from = 0; ; from += batchSize) {
    const { data, error } = await familiesQuery.range(from, from + batchSize - 1);

    if (error) {
      console.error("Families export query error:", error);
      return Response.json({ error: "تعذر تصدير بيانات العائلات." }, { status: 500 });
    }

    families.push(...data);
    if (data.length < batchSize) break;
  }

  const rows: FamilyExportRow[] = families.map((family) => ({
    file_number: family.file_number,
    beneficiary_name: family.beneficiary_name,
    national_id: family.national_id ?? "",
    family_book: family.family_book ?? "",
    address: family.address ?? "",
    phone: family.phone ?? "",
    landline_number: family.landline_number ?? "",
    category: family.family_category !== null
      ? categoryNames.get(family.family_category) ?? `#${family.family_category}`
      : "",
    field_supervisor_1: family.field_supervisor_1 ?? "",
    field_supervisor_2: family.field_supervisor_2 ?? "",
    study_writer: family.study_writer ?? "",
    evaluator_1: family.evaluator_1 ?? "",
    evaluator_2: family.evaluator_2 ?? "",
    reviewer: family.reviewer ?? "",
    study_date: family.study_date ?? "",
    assessment_score: family.assessment_score ?? "",
  }));
  const headerCells = columns.map((column, index) =>
    `<c r="${columnName(index)}1" t="inlineStr"><is><t xml:space="preserve">${xmlEscape(column.header)}</t></is></c>`
  ).join("");
  const dataRows = rows.map((row, rowIndex) => {
    const cells = columns.map((column, columnIndex) => {
      const value = row[column.key];
      if (value === "") return "";

      const reference = `${columnName(columnIndex)}${rowIndex + 2}`;
      if (typeof value === "number") {
        return `<c r="${reference}"><v>${value}</v></c>`;
      }

      return `<c r="${reference}" t="inlineStr"><is><t xml:space="preserve">${xmlEscape(value)}</t></is></c>`;
    }).join("");
    return `<row r="${rowIndex + 2}">${cells}</row>`;
  }).join("");

  const zip = new JSZip();
  zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`);
  zip.file("_rels/.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`);
  zip.file("xl/workbook.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="العائلات" sheetId="1" r:id="rId1"/></sheets>
</workbook>`);
  zip.file("xl/_rels/workbook.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>`);
  zip.file("xl/worksheets/sheet1.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <cols>${columns.map((column, index) => `<col min="${index + 1}" max="${index + 1}" width="${column.width}" customWidth="1"/>`).join("")}</cols>
  <sheetData><row r="1">${headerCells}</row>${dataRows}</sheetData>
</worksheet>`);
  const file = await zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
  const body = new ArrayBuffer(file.byteLength);
  new Uint8Array(body).set(file);

  return new Response(body, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename*=UTF-8''families.xlsx",
      "Cache-Control": "no-store",
    },
  });
}
