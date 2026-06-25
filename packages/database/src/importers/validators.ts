const validProgramStatuses = new Set(["Completed", "In progress", "Not started"]);

export type ImportValidationResult = {
  rowNumber: number;
  rawData: Record<string, string>;
  normalizedData: Record<string, string | string[] | Date | null>;
  errors: string[];
};

export function parseCsv(text: string) {
  const [headerLine, ...lines] = text.trim().split(/\r?\n/);
  const headers = splitCsvLine(headerLine);

  return lines.map((line, index) => {
    const values = splitCsvLine(line);
    return {
      rowNumber: index + 2,
      data: Object.fromEntries(headers.map((header, i) => [header, values[i] ?? ""])),
    };
  });
}

function splitCsvLine(line: string) {
  return line.split(",").map((value) => value.trim().replace(/^"|"$/g, ""));
}

export function validateBirdepRows(rows: ReturnType<typeof parseCsv>) {
  return rows.map(({ rowNumber, data }) => {
    const errors: string[] = [];
    if (!data["nama Birdept"]) errors.push("nama Birdept wajib diisi");
    if (!data["singkatan/nama panggilan"]) errors.push("singkatan/nama panggilan wajib diisi");

    return {
      rowNumber,
      rawData: data,
      normalizedData: {
        name: data["nama Birdept"] ?? "",
        code: data["singkatan/nama panggilan"] ?? "",
        description: data["deskripsi/pengertian Birdept"] ?? "",
        focusArea: data["fokus kegiatan utama"] ?? "",
      },
      errors,
    } satisfies ImportValidationResult;
  });
}

export function validateMemberRows(rows: ReturnType<typeof parseCsv>) {
  return rows.map(({ rowNumber, data }) => {
    const errors: string[] = [];
    if (!data["nama lengkap"]) errors.push("nama lengkap wajib diisi");
    if (!data.NIM) errors.push("NIM wajib diisi");
    if (data.Instagram && !data.Instagram.startsWith("@")) {
      errors.push("Instagram harus diawali @");
    }
    if (data["jabatan formal"] !== "Laksana" && data.subdivisi) {
      errors.push("subdivisi hanya diisi untuk jabatan formal Laksana");
    }

    return {
      rowNumber,
      rawData: data,
      normalizedData: {
        fullName: data["nama lengkap"] ?? "",
        nim: data.NIM ?? "",
        formalPosition: data["jabatan formal"] ?? "",
        subdivision: data.subdivisi || null,
        programRole: data["jabatan di proker"] || null,
        instagram: data.Instagram || null,
        birdep: data.Birdept ?? "",
      },
      errors,
    } satisfies ImportValidationResult;
  });
}

export function validatePressReleaseRows(rows: ReturnType<typeof parseCsv>) {
  return rows.map(({ rowNumber, data }) => {
    const errors: string[] = [];
    const date = parseIndonesianDate(data.tanggal);
    if (!data["nama program"]) errors.push("nama program wajib diisi");
    if (!validProgramStatuses.has(data["status proker"])) {
      errors.push("status proker harus Completed, In progress, atau Not started");
    }
    if (!date) errors.push("tanggal harus format DD/MM/YYYY");
    if (!isValidUrl(data["link press release"])) {
      errors.push("link press release harus URL valid");
    }

    return {
      rowNumber,
      rawData: data,
      normalizedData: {
        programName: data["nama program"] ?? "",
        birdeps: (data["Birdept pelaksana"] ?? "")
          .split(/[;&]/)
          .map((item) => item.trim())
          .filter(Boolean),
        status: data["status proker"] ?? "",
        date,
        url: data["link press release"] ?? "",
      },
      errors,
    } satisfies ImportValidationResult;
  });
}

function parseIndonesianDate(value: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value ?? "");
  if (!match) return null;
  const [, day, month, year] = match;
  return new Date(`${year}-${month}-${day}T00:00:00.000Z`);
}

function isValidUrl(value: string) {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}
