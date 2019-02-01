export interface Schema {
  array?: { items: Schema; count?: number; limit?: number };
  cache?: string;
  const?: any;
  faker?: { cmd: string; args?: any[] };
  foreign?: string;
  map?: { ids: Schema; entities: Schema; format: 'simple' | 'detailed' };

  pregenerate?: Schema;

  [key: string]: any;
}