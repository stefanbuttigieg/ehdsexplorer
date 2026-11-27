import { beforeEach, afterEach, expect, test } from "bun:test";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";

let db: PGlite;
beforeEach(async () => {
  db = new PGlite();
  await db.exec(`
    CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
    CREATE TABLE public.implementing_act_data_columns (id text PRIMARY KEY, table_id text, name text, column_key text);
    CREATE TABLE public.implementing_act_data_rows (id text PRIMARY KEY, table_id text, "values" jsonb, sort_order integer);
    INSERT INTO public.implementing_act_data_columns VALUES ('col', 'table', 'Patient name', 'patient_name'), ('other', 'table', 'Other', 'other');
    INSERT INTO public.implementing_act_data_rows VALUES ('row', 'table', '{"patient_name":"Ada","other":"kept"}', 3), ('empty', 'table', '{"patient_name":""}', 4), ('missing', 'table', '{}', 5), ('unrelated', 'another', '{"patient_name":"Grace"}', 1);
  `);
  await db.exec(readFileSync(new URL("../drizzle/migrations/0011_preserve_ia_rows_on_column_key_change.sql", import.meta.url), "utf8"));
});
afterEach(async () => { await db.close(); });

test("key rename moves all existing cells without changing order or unrelated data", async () => {
  await db.exec("UPDATE public.implementing_act_data_columns SET column_key = 'patient_full_name' WHERE id = 'col'");
  const result = await db.query('SELECT id, "values", sort_order FROM public.implementing_act_data_rows ORDER BY id');
  expect(result.rows).toEqual([
    { id: "empty", values: { patient_full_name: "" }, sort_order: 4 },
    { id: "missing", values: {}, sort_order: 5 },
    { id: "row", values: { patient_full_name: "Ada", other: "kept" }, sort_order: 3 },
    { id: "unrelated", values: { patient_name: "Grace" }, sort_order: 1 },
  ]);
});

test("duplicate column keys are rejected without changing any cells", async () => {
  await expect(db.exec("UPDATE public.implementing_act_data_columns SET column_key = 'other' WHERE id = 'col'")).rejects.toThrow("already used");
  expect((await db.query("SELECT column_key FROM public.implementing_act_data_columns WHERE id = 'col'")).rows).toEqual([{ column_key: "patient_name" }]);
  expect((await db.query('SELECT "values" FROM public.implementing_act_data_rows WHERE id = \'row\'')).rows).toEqual([{ values: { patient_name: "Ada", other: "kept" } }]);
});

test("existing orphaned data under a new key cannot be overwritten", async () => {
  await db.exec(`UPDATE public.implementing_act_data_rows SET "values" = "values" || '{"occupied":"preserve me"}' WHERE id = 'missing'`);
  await expect(db.exec("UPDATE public.implementing_act_data_columns SET column_key = 'occupied' WHERE id = 'col'")).rejects.toThrow("already contains row data");
  expect((await db.query('SELECT "values" FROM public.implementing_act_data_rows WHERE id = \'missing\'')).rows).toEqual([{ values: { occupied: "preserve me" } }]);
});

test("display-name changes do not migrate keys or cells", async () => {
  await db.exec("UPDATE public.implementing_act_data_columns SET name = 'Full name' WHERE id = 'col'");
  expect((await db.query('SELECT "values" FROM public.implementing_act_data_rows WHERE id = \'row\'')).rows).toEqual([{ values: { patient_name: "Ada", other: "kept" } }]);
});

test("blank keys are rejected", async () => {
  await expect(db.exec("UPDATE public.implementing_act_data_columns SET column_key = '  ' WHERE id = 'col'")).rejects.toThrow("cannot be empty");
});