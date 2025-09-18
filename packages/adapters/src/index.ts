export type ToolTarget = 'gemini' | 'claude' | 'cursor' | 'openai';

export interface ApplyContext {
  target: ToolTarget;
  dryRun: boolean;
  variables: Record<string, unknown>;
}

export interface DiffResult {
  changes: Array<{ path: string; kind: 'create' | 'update' | 'delete'; }>;
  summary: string;
}

export interface Adapter {
  plan(ctx: ApplyContext): Promise<DiffResult>;
  apply(ctx: ApplyContext): Promise<void>;
  rollback?(ctx: ApplyContext): Promise<void>;
}

export class NoopAdapter implements Adapter {
  async plan(): Promise<DiffResult> { return { changes: [], summary: 'noop' }; }
  async apply(): Promise<void> { /* noop */ }
}
