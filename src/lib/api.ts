export interface ApiRequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
}

export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, message: string, detail: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

/**
 * Centalized, type-safe fetch wrapper connecting Next.js with Python FastAPI.
 * Appends JWT tokens from localStorage and handles error formatting automatically.
 */
export async function apiRequest<T = any>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  
  // Clean path format
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${baseUrl}/api/v1${cleanPath}`);

  // Append Query parameters if provided
  if (options.params) {
    Object.entries(options.params).forEach(([key, val]) => {
      url.searchParams.append(key, String(val));
    });
  }

  // Set default headers
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  // Inject JWT authorization token from localStorage in client runtime
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("campus_connect_token");
    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const fetchOptions: RequestInit = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url.toString(), fetchOptions);

    if (response.status === 204) {
      return {} as T;
    }

    let data: any;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      // Extract FastAPI HTTPException details
      let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
      let errorDetail = "";

      if (data && typeof data === "object") {
        if (typeof data.detail === "string") {
          errorMessage = data.detail;
          errorDetail = data.detail;
        } else if (Array.isArray(data.detail)) {
          // Pydantic validation error lists
          const messages = data.detail.map((err: any) => `${err.loc.join(".")}: ${err.msg}`);
          errorMessage = messages.join(" | ");
          errorDetail = JSON.stringify(data.detail);
        } else {
          errorMessage = JSON.stringify(data);
        }
      } else if (typeof data === "string" && data.trim()) {
        errorMessage = data;
      }

      throw new ApiError(response.status, errorMessage, errorDetail || errorMessage);
    }

    return data as T;
  } catch (err: any) {
    if (err instanceof ApiError) {
      throw err;
    }
    // Network or connection errors
    throw new ApiError(500, err.message || "Network request failed", "Failed to connect to the backend server.");
  }
}
