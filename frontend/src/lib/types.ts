export interface KbAddTextRequest {
  title: string;
  text: string;
}

export interface KbAddTextResponse {
  ok: boolean;
  addedChunks: number;
}

export interface KbUploadPdfResponse {
  ok: boolean;
  title: string;
  addedChunks: number;
  pages: number | null;
  error?: string;
}

export type WaRole = "owner" | "admin" | "operator" | "viewer";

export interface Membership {
  wa_account_id: string;
  role: WaRole;
}

export interface WaAccount {
  id: string;
  display_name?: string | null;
  phone?: string | null;
  role?: WaRole;
}

