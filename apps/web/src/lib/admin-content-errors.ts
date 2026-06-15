export async function readAdminContentErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const contentType = response.headers.get('content-type') ?? '';

    if (contentType.includes('application/json')) {
      const data = (await response.json()) as { message?: unknown; error?: unknown };
      const message = normalizeAdminContentErrorMessage(data.message) || normalizeAdminContentErrorMessage(data.error);

      return message || fallback;
    }

    const text = (await response.text()).trim();

    return text || fallback;
  } catch {
    return fallback;
  }
}

function normalizeAdminContentErrorMessage(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).join('；');
  }

  return '';
}
