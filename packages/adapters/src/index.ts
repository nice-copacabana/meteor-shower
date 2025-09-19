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

// 导出具体适配器
export { GeminiAdapter } from './gemini.js';
export { ClaudeAdapter } from './claude.js';
export { CursorAdapter } from './cursor.js';
export { OpenAIAdapter } from './openai.js';

// 适配器工厂
export function createAdapter(target: ToolTarget): Adapter {
  switch (target) {
    case 'gemini':
      return new (require('./gemini.js')).GeminiAdapter();
    case 'claude':
      return new (require('./claude.js')).ClaudeAdapter();
    case 'cursor':
      return new (require('./cursor.js')).CursorAdapter();
    case 'openai':
      return new (require('./openai.js')).OpenAIAdapter();
    default:
      return new NoopAdapter();
  }
}
