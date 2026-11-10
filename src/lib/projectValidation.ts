export function validateProjectRequiredFields(
  title: string,
  platform: string,
  url: string,
): string | null {
  if (!title.trim()) return "O título é obrigatório";
  if (!platform.trim()) return "A plataforma é obrigatória";
  if (!url.trim()) return "A URL é obrigatória";
  return null;
}

export function isProjectBasicsValid(title: string, platform: string, url: string): boolean {
  return validateProjectRequiredFields(title, platform, url) === null;
}
