'use client';

import { useState, useRef, useEffect } from 'react';

interface AgentMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface ThinkingBlock {
  id: string;
  label: string;
  content: string;
  open: boolean;
}

interface ToolCall {
  id: string;
  name: string;
  iconType: 'read' | 'edit' | 'write' | 'bash' | 'grep' | 'glob' | 'webfetch' | 'websearch';
  status: 'running' | 'complete' | 'error';
  body: string;
  open: boolean;
}

interface FileOp {
  op: 'created' | 'modified' | 'deleted';
  path: string;
  detail: string;
}

interface ProducedFile {
  name: string;
  path: string;
}

export interface AgentTurn {
  id: string;
  statusLabel: string;
  statusState: 'active' | 'done';
  thinking: ThinkingBlock[];
  toolCalls: ToolCall[];
  fileOps: FileOp[] | null;
  producedFiles: ProducedFile[];
  assistantText: string | null;
}

interface AgentRuntimeProps {
  open: boolean;
  onClose: () => void;
  turns: AgentTurn[];
  messages: AgentMessage[];
  onSend: (text: string) => void;
  isStreaming: boolean;
}

function toolIconClass(type: string): string {
  return `tool-call-icon tci-${type}`;
}

export default function AgentRuntime({ open, onClose, turns, messages, onSend, isStreaming }: AgentRuntimeProps) {
  const [input, setInput] = useState('');
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [turns, messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={`agent-dialog-overlay ${open ? 'open' : ''}`} onClick={onClose}>
      <div className="agent-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="agent-dialog-head">
          <div className="ad-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            Agent 运行时
            <span className="ad-badge">{isStreaming ? '运行中' : '就绪'}</span>
          </div>
          <button className="agent-dialog-close" onClick={onClose}>✕</button>
        </div>

        {/* Body */}
        <div className="agent-dialog-body">
          <div className="agent-log" ref={bodyRef}>
            {turns.length === 0 && messages.length === 0 && (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--meta)', fontSize: '12px' }}>
                发送消息开始 Agent 协作
              </div>
            )}

            {/* Rendered turns */}
            {turns.map((turn) => (
              <div key={turn.id} className="agent-turn">
                {/* Status pill */}
                <div className="status-pill">
                  <span className={`sp-dot ${turn.statusState}`} />
                  {turn.statusLabel}
                </div>

                {/* Thinking blocks */}
                {turn.thinking.map((tb) => (
                  <div key={tb.id} className={`thinking-block ${tb.open ? 'open' : ''}`}>
                    <button className="thinking-toggle" onClick={() => {
                      tb.open = !tb.open;
                    }}>
                      <span className="chevron">▶</span>
                      {tb.label}
                    </button>
                    <div className="thinking-body">{tb.content}</div>
                  </div>
                ))}

                {/* Tool call cards */}
                {turn.toolCalls.map((tc) => (
                  <div key={tc.id} className={`tool-call-card ${tc.open ? 'open' : ''}`}>
                    <div className="tool-call-header">
                      <span className={toolIconClass(tc.iconType)}>
                        {tc.status === 'running' ? (
                          <span className="spin">⟳</span>
                        ) : (
                          tc.iconType.slice(0, 1).toUpperCase()
                        )}
                      </span>
                      <span className="tool-call-name">{tc.name}</span>
                      <span className={`tool-call-status ${tc.status}`}>
                        {tc.status === 'running' ? '运行' : tc.status === 'complete' ? '完成' : '错误'}
                      </span>
                    </div>
                    <div className="tool-call-body">
                      <pre>{tc.body}</pre>
                    </div>
                  </div>
                ))}

                {/* File ops summary */}
                {turn.fileOps && turn.fileOps.length > 0 && (
                  <div className="file-ops-summary">
                    <div className="fos-title">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                      文件操作
                    </div>
                    {turn.fileOps.map((op, i) => (
                      <div key={i} className="file-op-row">
                        <span className={`op-tag ${op.op}`}>
                          {op.op === 'created' ? '创建' : op.op === 'modified' ? '修改' : '删除'}
                        </span>
                        <span className="op-path">{op.path}</span>
                        <span className="op-detail">{op.detail}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Produced files */}
                {turn.producedFiles.length > 0 && (
                  <div className="produced-files">
                    {turn.producedFiles.map((f, i) => (
                      <span key={i} className="prod-file-chip" title={f.path}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                        {f.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Assistant text */}
                {turn.assistantText && (
                  <div className="assistant-text">{turn.assistantText}</div>
                )}
              </div>
            ))}

            {/* Chat messages */}
            {messages.map((msg) => (
              <div key={msg.id} className={`agent-msg-user ${msg.role === 'assistant' ? '' : 'user'}`}>
                {msg.role === 'user' ? (
                  <>
                    <div className="user-bubble">{msg.content}</div>
                    <div className="user-avatar">U</div>
                  </>
                ) : (
                  <div className="assistant-text">{msg.content}</div>
                )}
              </div>
            ))}

            {/* Streaming indicator */}
            {isStreaming && (
              <div className="chat-typing">
                <div className="dots">
                  <span /><span /><span />
                </div>
                Agent 思考中...
              </div>
            )}
          </div>

          {/* Composer */}
          <div className="agent-composer">
            <input
              type="text"
              placeholder="输入指令..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isStreaming}
            />
            <button
              className={`send-btn ${isStreaming ? 'stop' : ''}`}
              onClick={handleSend}
            >
              {isStreaming ? '■' : '↑'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
