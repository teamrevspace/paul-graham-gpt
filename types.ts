export interface History {
  id: number;
  message?: string;
  response?: string;
}

export type Status = 'idle' | 'responding';
