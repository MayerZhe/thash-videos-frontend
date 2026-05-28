'use client';

interface DiffLine {
  type: 'add' | 'remove' | 'unchanged';
  text: string;
  lineNum: number;
}

interface ParamDiff {
  param: string;
  fromValue: string;
  toValue: string;
}

interface DiffOverlayProps {
  open: boolean;
  onClose: () => void;
  fromVersion: { id: string; shortId: string; label: string };
  toVersion: { id: string; shortId: string; label: string };
  tab?: 'text' | 'params' | 'frames';
}

const DEMO_TEXT_DIFF: { left: DiffLine[]; right: DiffLine[] } = {
  left: [
    { type: 'unchanged', text: '萧炎站在乌坦城萧家大门前，眼中闪过', lineNum: 1 },
    { type: 'remove', text: '一丝复杂的神色。他握紧拳头，心中暗', lineNum: 2 },
    { type: 'unchanged', text: '暗发誓一定要让家族重新崛起。', lineNum: 3 },
    { type: 'unchanged', text: '', lineNum: 4 },
    { type: 'remove', text: '"三年之约已到，我萧炎回来了。"他嘴', lineNum: 5 },
    { type: 'remove', text: '角扬起一抹自信的笑容，大步迈入府中。', lineNum: 6 },
    { type: 'unchanged', text: '', lineNum: 7 },
    { type: 'unchanged', text: '府内，萧薰儿正在院中练剑，剑光如水，', lineNum: 8 },
    { type: 'unchanged', text: '映照着她清冷的面容。', lineNum: 9 },
  ],
  right: [
    { type: 'unchanged', text: '萧炎站在乌坦城萧家大门前，眼中闪过', lineNum: 1 },
    { type: 'add', text: '一丝坚毅而复杂的神色。他握紧拳头，', lineNum: 2 },
    { type: 'add', text: '指尖几乎刺入掌心。复仇的火焰在心中', lineNum: 3 },
    { type: 'unchanged', text: '暗发誓一定要让家族重新崛起。', lineNum: 4 },
    { type: 'unchanged', text: '', lineNum: 5 },
    { type: 'add', text: '"三年之约...这一天终于到了。"他凝', lineNum: 6 },
    { type: 'add', text: '视着萧家牌匾，眼中闪过一丝泪光。', lineNum: 7 },
    { type: 'add', text: '深吸一口气，他嘴角微扬，大步迈入府中。', lineNum: 8 },
    { type: 'unchanged', text: '', lineNum: 9 },
    { type: 'unchanged', text: '府内，萧薰儿正在院中练剑，剑光如水，', lineNum: 10 },
    { type: 'unchanged', text: '映照着她清冷的面容。', lineNum: 11 },
  ],
};

const DEMO_PARAM_DIFF: ParamDiff[] = [
  { param: '供应商·图片', fromValue: 'Seedream 2.0', toValue: 'Seedream 3.0' },
  { param: '供应商·视频', fromValue: 'Seedance 0.9', toValue: 'Seedance 1.0' },
  { param: '供应商·TTS', fromValue: 'MiniMax 男03', toValue: 'MiniMax 男03' },
  { param: '角色数', fromValue: '4', toValue: '5 (+云韵)' },
  { param: '场景数', fromValue: '4', toValue: '5 (+云岚宗后山)' },
  { param: '镜头数', fromValue: '8', toValue: '12' },
  { param: '总时长', fromValue: '1m 45s', toValue: '2m 15s' },
  { param: 'CLIP 均分', fromValue: '0.82', toValue: '0.88' },
  { param: '总费用', fromValue: '¥6.30', toValue: '¥8.40' },
  { param: '主题', fromValue: '电影写实', toValue: '电影写实' },
  { param: 'Pipeline模式', fromValue: '标准模式', toValue: '标准模式' },
  { param: '作者', fromValue: 'Writer Agent', toValue: 'Director Agent' },
];

export default function DiffOverlay({ open, onClose, fromVersion, toVersion, tab: initialTab = 'text' }: DiffOverlayProps) {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="fixed inset-4 bg-bg border border-border rounded-sm flex flex-col shadow-raised z-50" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-soft">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-normal text-fg">版本对比</h3>
            {/* Version labels */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-danger font-mono">{fromVersion.shortId}</span>
              <span className="text-muted">← vs →</span>
              <span className="text-success font-mono">{toVersion.shortId}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Tabs */}
            <div className="flex gap-1 bg-border-soft rounded-sm p-0.5">
              {(['text', 'params', 'frames'] as const).map((t) => (
                <button
                  key={t}
                  className={`px-3 py-1 text-xs rounded-sm transition-all ${
                    initialTab === t ? 'bg-bg text-fg' : 'text-muted hover:text-fg-2'
                  }`}
                >
                  {t === 'text' ? '文本差异' : t === 'params' ? '参数差异' : '帧对比'}
                </button>
              ))}
            </div>
            <button onClick={onClose} className="btn btn-ghost btn-sm ml-4">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Diff content */}
        <div className="flex-1 overflow-hidden">
          {/* Text diff */}
          {initialTab === 'text' && (
            <div className="flex h-full">
              {/* Left (from) */}
              <div className="flex-1 overflow-y-auto border-r border-border-soft">
                <div className="sticky top-0 bg-surface px-4 py-2 border-b border-border-soft text-xs text-danger font-medium">
                  旧版本 · {fromVersion.label}
                </div>
                <div className="font-mono text-xs leading-relaxed">
                  {DEMO_TEXT_DIFF.left.map((line, i) => (
                    <div
                      key={i}
                      className={`flex px-4 py-[2px] ${
                        line.type === 'remove'
                          ? 'bg-[color-mix(in_oklab,var(--danger)_8%,transparent)] text-[color-mix(in_oklab,var(--danger)_85%,var(--fg))]'
                          : 'text-fg-2'
                      }`}
                    >
                      <span className="text-muted w-8 flex-shrink-0 text-right mr-3 select-none">{line.lineNum}</span>
                      <span className="flex-1">{line.text || ' '}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Right (to) */}
              <div className="flex-1 overflow-y-auto">
                <div className="sticky top-0 bg-surface px-4 py-2 border-b border-border-soft text-xs text-success font-medium">
                  新版本 · {toVersion.label}
                </div>
                <div className="font-mono text-xs leading-relaxed">
                  {DEMO_TEXT_DIFF.right.map((line, i) => (
                    <div
                      key={i}
                      className={`flex px-4 py-[2px] ${
                        line.type === 'add'
                          ? 'bg-[color-mix(in_oklab,var(--success)_8%,transparent)] text-[color-mix(in_oklab,var(--success)_85%,var(--fg))]'
                          : 'text-fg-2'
                      }`}
                    >
                      <span className="text-muted w-8 flex-shrink-0 text-right mr-3 select-none">{line.lineNum}</span>
                      <span className="flex-1">{line.text || ' '}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Parameter diff */}
          {initialTab === 'params' && (
            <div className="overflow-y-auto h-full p-6">
              <table>
                <thead>
                  <tr>
                    <th>参数</th>
                    <th>旧值 ({fromVersion.shortId})</th>
                    <th>新值 ({toVersion.shortId})</th>
                    <th>变化</th>
                  </tr>
                </thead>
                <tbody>
                  {DEMO_PARAM_DIFF.map((row) => {
                    const changed = row.fromValue !== row.toValue;
                    return (
                      <tr key={row.param} className={changed ? '' : 'opacity-50'}>
                        <td className="text-sm text-fg font-medium">{row.param}</td>
                        <td className={`text-sm ${changed ? 'text-danger line-through' : 'text-muted'}`}>{row.fromValue}</td>
                        <td className={`text-sm ${changed ? 'text-success' : 'text-muted'}`}>{row.toValue}</td>
                        <td>
                          {changed ? (
                            <span className="badge badge-warn text-[10px]">已变更</span>
                          ) : (
                            <span className="text-[10px] text-muted">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Frame comparison */}
          {initialTab === 'frames' && (
            <div className="overflow-y-auto h-full p-6">
              <p className="text-sm text-muted mb-6">帧对比 (并排分镜)</p>
              <div className="grid grid-cols-2 gap-4">
                {Array.from({ length: 4 }, (_, i) => (
                  <div key={i} className="bg-surface border border-border rounded-sm overflow-hidden">
                    <div className="text-[10px] text-muted px-3 py-1.5 border-b border-border-soft">
                      Shot {i < 9 ? '0' : ''}{i + 1} — {['Medium', 'Close-up', 'Long', 'Medium'][i]} Shot
                    </div>
                    <div className="flex">
                      {/* From frame */}
                      <div className="flex-1 p-3 border-r border-border-soft">
                        <p className="text-[10px] text-danger mb-2">旧 (v3)</p>
                        <div className="h-[80px] bg-[color-mix(in_oklab,var(--danger)_8%,var(--bg))] border border-[color-mix(in_oklab,var(--danger)_20%,transparent)] rounded-sm flex items-center justify-center">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5" fill="var(--danger)"/><path d="M21 15l-5-5L5 21"/></svg>
                        </div>
                      </div>
                      {/* To frame */}
                      <div className="flex-1 p-3">
                        <p className="text-[10px] text-success mb-2">新 (v5)</p>
                        <div className="h-[80px] bg-[color-mix(in_oklab,var(--success)_8%,var(--bg))] border border-[color-mix(in_oklab,var(--success)_20%,transparent)] rounded-sm flex items-center justify-center">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5" fill="var(--success)"/><path d="M21 15l-5-5L5 21"/></svg>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
