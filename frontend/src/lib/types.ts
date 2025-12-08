export interface KbAddTextRequest {
  title: string;
  text: string;
}

export interface KbAddTextResponse {
  ok: boolean;
  addedChunks: number;
}

