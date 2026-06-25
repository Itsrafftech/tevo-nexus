import {
  parseCsv,
  validateBirdepRows,
  validateMemberRows,
  validatePressReleaseRows,
} from "@orma/database/importers";

export type ImportType = "members" | "birdeps" | "press-releases";

export function validateImport(type: ImportType, csvText: string) {
  const rows = parseCsv(csvText);
  if (type === "members") return validateMemberRows(rows);
  if (type === "birdeps") return validateBirdepRows(rows);
  return validatePressReleaseRows(rows);
}
