import { getAuthToken, setAuthToken, getVendureApiUrl, formatAssetUrl } from "../client";

export interface UploadedVendureAsset {
  id: string;
  name: string;
  source: string;
  preview: string;
  mimeType: string;
}

const UPLOAD_ARTWORK_MUTATION = `
  mutation UploadCustomizationArtwork($file: Upload!, $tags: [String!]) {
    uploadCustomizationArtwork(file: $file, tags: $tags) {
      id
      name
      source
      preview
      mimeType
    }
  }
`;

let artworkUploadSupported: boolean | null = null;

function dataUrlToBlob(dataUrl: string): { blob: Blob; ext: string; mimeType: string } | null {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  const mimeType = match[1] || "image/png";
  const base64 = match[2];
  const byteString = atob(base64);
  const bytes = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i++) {
    bytes[i] = byteString.charCodeAt(i);
  }
  const ext =
    mimeType === "image/jpeg"
      ? "jpg"
      : mimeType === "image/webp"
      ? "webp"
      : mimeType === "image/svg+xml"
      ? "svg"
      : "png";
  return {
    blob: new Blob([bytes], { type: mimeType }),
    ext,
    mimeType,
  };
}

/**
 * Uploads a customer artwork, mockup preview, or print-ready PNG data URL to Vendure's
 * AssetServerPlugin (stored on S3 or local asset storage) via GraphQL multipart upload.
 *
 * Returns null gracefully if the live Vendure server does not yet expose
 * `uploadCustomizationArtwork` or if the upload fails.
 */
export async function uploadCustomizationArtwork(
  dataUrl: string,
  fileName: string,
  tags: string[] = ["custom-artwork"]
): Promise<UploadedVendureAsset | null> {
  if (typeof window === "undefined") return null;
  if (!dataUrl || !dataUrl.startsWith("data:")) return null;
  if (artworkUploadSupported === false) return null;

  const parsed = dataUrlToBlob(dataUrl);
  if (!parsed) return null;

  const cleanBaseName = (fileName || "artwork").replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]+/g, "-");
  const finalName = `${cleanBaseName}.${parsed.ext}`;

  const formData = new FormData();
  formData.append(
    "operations",
    JSON.stringify({
      query: UPLOAD_ARTWORK_MUTATION,
      variables: { file: null, tags },
    })
  );
  formData.append("map", JSON.stringify({ "0": ["variables.file"] }));
  formData.append("0", parsed.blob, finalName);

  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Apollo-Require-Preflight": "true",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(getVendureApiUrl(), {
      method: "POST",
      credentials: "include",
      headers,
      body: formData,
    });

    const authToken = response.headers.get("vendure-auth-token");
    if (authToken) {
      setAuthToken(authToken);
    }

    const json = (await response.json()) as {
      data?: { uploadCustomizationArtwork?: UploadedVendureAsset };
      errors?: Array<{ message?: string }>;
    };

    if (json.errors?.length) {
      const msg = json.errors[0]?.message || "";
      if (msg.includes("uploadCustomizationArtwork") && msg.includes("Cannot query field")) {
        artworkUploadSupported = false;
      }
      console.warn("Vendure artwork upload unavailable:", msg);
      return null;
    }

    const uploaded = json.data?.uploadCustomizationArtwork;
    if (!uploaded) return null;

    artworkUploadSupported = true;
    return {
      ...uploaded,
      source: formatAssetUrl(uploaded.source),
      preview: formatAssetUrl(uploaded.preview),
    };
  } catch (err) {
    console.warn("Failed to upload customization artwork to Vendure:", err);
    return null;
  }
}
