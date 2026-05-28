'use client';

import { useState, useEffect, useCallback } from 'react';
import { pipelineApi } from '@/lib/api';
import type { AgentOutputData } from '@/lib/types';

type AgentName = 'director' | 'writer' | 'character' | 'storyboard' | 'router' | 'video' | 'voice' | 'post' | 'qa';

interface AgentOutputViewerProps {
  jobId: string;
  agentName: AgentName;
  onEdit?: (field: string, value: unknown) => void;
}

interface AgentOutput extends AgentOutputData {
  job_id: string;
  output: Record<string, unknown>;
  state: string;
  cost_cents: number;
  duration_ms: number;
}

const AGENT_LABELS: Record<AgentName, string> = {
  director: '导演',
  writer: '编剧',
  character: '角色',
  storyboard: '分镜',
  router: '路由',
  video: '视频',
  voice: '配音',
  post: '后期',
  qa: '质检',
};

export default function AgentOutputViewer({ jobId, agentName, onEdit }: AgentOutputViewerProps) {
  const [output, setOutput] = useState<AgentOutput | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const fetchOutput = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await pipelineApi.agentOutput(jobId, agentName);
      setOutput(data as AgentOutput);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  }, [jobId, agentName]);

  useEffect(() => {
    fetchOutput();
  }, [fetchOutput]);

  const handleDoubleClick = (field: string, value: unknown) => {
    setEditingField(field);
    setEditValue(typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value));
  };

  const handleSaveEdit = (field: string) => {
    let parsedValue: unknown = editValue;
    try {
      parsedValue = JSON.parse(editValue);
    } catch {
      // Keep as string
    }
    onEdit?.(field, parsedValue);
    setEditingField(null);
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-border rounded w-3/4 mx-auto" />
          <div className="h-4 bg-border rounded w-1/2 mx-auto" />
        </div>
        <p className="text-sm text-muted mt-4">加载中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-error">加载失败: {error}</p>
        <button onClick={fetchOutput} className="mt-2 text-xs text-accent hover:underline">
          重试
        </button>
      </div>
    );
  }

  if (!output) return null;

  const outputData = output.output || {};

  return (
    <div className="w-full bg-surface border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-soft bg-bg">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-fg">
            {AGENT_LABELS[agentName] || agentName}
          </span>
          <span className={`badge text-[10px] px-2 py-0.5 ${
            output.state === 'completed' ? 'badge-success' :
            output.state === 'failed' ? 'badge-error' :
            'badge-muted'
          }`}>
            {output.state}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-meta font-mono">
          <span>成本: {output.cost_cents}分</span>
          <span>耗时: {output.duration_ms?.toFixed(0)}ms</span>
        </div>
      </div>

      {/* Content — rendered differently per agent type */}
      <div className="p-4 max-h-[500px] overflow-y-auto">
        {agentName === 'writer' && <ScriptReader data={outputData} onDoubleClick={handleDoubleClick} editingField={editingField} editValue={editValue} setEditValue={setEditValue} onSave={handleSaveEdit} />}
        {agentName === 'character' && <CharacterCardWall data={outputData} onDoubleClick={handleDoubleClick} editingField={editingField} editValue={editValue} setEditValue={setEditValue} onSave={handleSaveEdit} />}
        {agentName === 'storyboard' && <StoryboardTable data={outputData} onDoubleClick={handleDoubleClick} editingField={editingField} editValue={editValue} setEditValue={setEditValue} onSave={handleSaveEdit} />}
        {agentName === 'video' && <VideoPlayer data={outputData} />}
        {!['writer', 'character', 'storyboard', 'video'].includes(agentName) && (
          <JsonViewer data={outputData} onDoubleClick={handleDoubleClick} editingField={editingField} editValue={editValue} setEditValue={setEditValue} onSave={handleSaveEdit} />
        )}
      </div>
    </div>
  );
}

// ─── Sub-renderers ───

interface SubRendererProps {
  data: Record<string, unknown>;
  onDoubleClick: (field: string, value: unknown) => void;
  editingField: string | null;
  editValue: string;
  setEditValue: (v: string) => void;
  onSave: (field: string) => void;
}

function EditableField({ field, value, editingField, editValue, setEditValue, onSave, onDoubleClick }: {
  field: string; value: unknown;
} & Pick<SubRendererProps, 'editingField' | 'editValue' | 'setEditValue' | 'onSave' | 'onDoubleClick'>) {
  const isEditing = editingField === field;

  if (isEditing) {
    return (
      <div className="flex gap-2">
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="flex-1 bg-bg border border-accent rounded-sm px-2 py-1 text-xs text-fg outline-none"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSave(field);
            if (e.key === 'Escape') onSave(field);
          }}
        />
        <button onClick={() => onSave(field)} className="text-[10px] text-accent px-2">保存</button>
      </div>
    );
  }

  return (
    <span
      onDoubleClick={() => onDoubleClick(field, value)}
      className="cursor-pointer hover:bg-[color-mix(in_oklab,var(--accent)_5%,transparent)] px-1 rounded transition-colors"
      title="双击编辑"
    >
      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
    </span>
  );
}

function ScriptReader({ data, ...props }: SubRendererProps) {
  const scenes = (data.scenes as Array<Record<string, unknown>>) || [];
  const dialogue = (data.dialogue as Array<Record<string, unknown>>) || [];

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-fg">剧本</h4>
      {scenes.map((scene, i) => (
        <div key={i} className="bg-bg border border-border-soft rounded-sm p-3">
          <div className="text-xs text-muted mb-1">场景 {i + 1}</div>
          <div className="text-sm text-fg-2">
            <EditableField field={`scenes.${i}.description`} value={scene.description || '(无描述)'} {...props} />
          </div>
        </div>
      ))}
      {dialogue.length > 0 && (
        <div className="mt-4">
          <h5 className="text-xs font-medium text-muted mb-2">对白</h5>
          {dialogue.map((d, i) => (
            <div key={i} className="flex gap-2 py-1 text-xs">
              <span className="text-accent font-medium min-w-[60px]">{String(d.character || d.speaker || '?')}:</span>
              <span className="text-fg-2">{String(d.text || d.line || '')}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CharacterCardWall({ data, ...props }: SubRendererProps) {
  const characters = (data.characters as Array<Record<string, unknown>>) || [];

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-fg">角色卡片</h4>
      <div className="grid grid-cols-2 gap-3">
        {characters.map((char, i) => (
          <div key={i} className="bg-bg border border-border-soft rounded-sm p-3">
            <div className="text-sm font-semibold text-fg mb-2">{String(char.name || `角色${i + 1}`)}</div>
            <div className="space-y-1 text-[11px]">
              {Object.entries(char).filter(([k]) => k !== 'name').map(([key, val]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-meta">{key}:</span>
                  <span className="text-fg-2"><EditableField field={`characters.${i}.${key}`} value={val} {...props} /></span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StoryboardTable({ data, ...props }: SubRendererProps) {
  const shots = (data.shots as Array<Record<string, unknown>>) || [];

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-fg">分镜表 ({shots.length} 镜)</h4>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border-soft">
              <th className="text-left py-2 px-2 text-meta font-medium">#</th>
              <th className="text-left py-2 px-2 text-meta font-medium">类型</th>
              <th className="text-left py-2 px-2 text-meta font-medium">运镜</th>
              <th className="text-left py-2 px-2 text-meta font-medium">时长</th>
              <th className="text-left py-2 px-2 text-meta font-medium">提示词</th>
            </tr>
          </thead>
          <tbody>
            {shots.map((shot, i) => (
              <tr key={i} className="border-b border-border-soft/50 hover:bg-bg">
                <td className="py-2 px-2 text-meta font-mono">{String(shot.shot_id || i + 1)}</td>
                <td className="py-2 px-2 text-fg-2">{String(shot.shot_type || '-')}</td>
                <td className="py-2 px-2 text-fg-2">{String(shot.camera_motion || '-')}</td>
                <td className="py-2 px-2 text-fg-2 font-mono">{String(shot.duration_seconds || 0)}s</td>
                <td className="py-2 px-2 text-fg-2 max-w-[200px] truncate">
                  <EditableField field={`shots.${i}.image_prompt`} value={shot.image_prompt || '-'} {...props} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function VideoPlayer({ data }: { data: Record<string, unknown> }) {
  const segments = (data.segments as Array<Record<string, unknown>>) || [];

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-fg">视频片段 ({segments.length})</h4>
      {segments.map((seg, i) => (
        <div key={i} className="bg-bg border border-border-soft rounded-sm p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-fg-2">片段 {String(seg.shot_id || i + 1)}</span>
            <span className="text-[10px] text-meta font-mono">{String(seg.duration_seconds || 0)}s | {String(seg.cost_cents || 0)}分</span>
          </div>
          {seg.video_path ? (
            <video src={String(seg.video_path)} controls className="w-full rounded-sm max-h-48" />
          ) : (
            <div className="w-full h-32 bg-[#111] rounded-sm flex items-center justify-center text-xs text-muted">
              视频未生成
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function JsonViewer({ data, ...props }: SubRendererProps) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-fg mb-3">原始输出</h4>
      {Object.entries(data).map(([key, val]) => (
        <div key={key} className="flex gap-3 py-1 border-b border-border-soft/30 text-xs">
          <span className="text-meta min-w-[120px] font-mono">{key}:</span>
          <span className="text-fg-2 break-all">
            <EditableField field={key} value={val} {...props} />
          </span>
        </div>
      ))}
    </div>
  );
}
