import type { SupabaseClient } from "@supabase/supabase-js";

import { cleanCedula } from "./utils";

function uniqueValues(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function getCedulaDigits(cedula: string): string {
  return cedula.replace(/\D/g, "");
}

export function getCedulaSearchVariants(cedula: string): string[] {
  const cleaned = cleanCedula(cedula);
  const digits = getCedulaDigits(cedula);
  const prefixMatch = cleaned.match(/^([VEJG])-?(.+)$/);
  const prefix = prefixMatch?.[1] || "V";
  const prefixedDigits = digits ? `${prefix}${digits}` : "";
  const dashedPrefixedDigits = digits ? `${prefix}-${digits}` : "";

  return uniqueValues([
    cedula.trim(),
    cleaned,
    digits,
    prefixedDigits,
    dashedPrefixedDigits,
  ]);
}

export async function findAsistenteByCedula<T>(
  supabase: SupabaseClient,
  cedula: string,
  select: string
): Promise<{ data: T | null; error: Error | null }> {
  const variants = getCedulaSearchVariants(cedula);

  const { data, error } = await supabase
    .from("asistentes")
    .select(select)
    .in("cedula", variants)
    .limit(1);

  if (error) {
    return { data: null, error };
  }

  return { data: (data?.[0] as T | undefined) ?? null, error: null };
}
