const DEFAULT_TIMEOUT_MS = 65000;

const withTimeout = async (url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) => {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    window.clearTimeout(timeoutId);
  }
};

export const pingBackendHealth = async (baseUrl, timeoutMs = DEFAULT_TIMEOUT_MS) => {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, "");

  try {
    const response = await withTimeout(`${normalizedBaseUrl}/health`, {}, timeoutMs);
    if (!response.ok) {
      return { ok: false, status: "offline", error: `HTTP ${response.status}` };
    }

    const data = await response.json();
    return {
      ok: Boolean(data?.model_loaded ?? data?.status === "ready"),
      status: data?.status ?? "ready",
      data,
    };
  } catch (error) {
    return {
      ok: false,
      status: error?.name === "AbortError" ? "warming" : "offline",
      error: error?.message ?? "Unavailable",
    };
  }
};
