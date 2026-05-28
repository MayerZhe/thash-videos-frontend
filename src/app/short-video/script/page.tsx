'use client';

import { useState, useCallback, useMemo } from 'react';

/* ═══════════════════════════════════════════════════════════════════════
 * /short-video/script — Visual Factory script editor
 * 1:1 replica of Thash-video-design/video-script.html
 * ═══════════════════════════════════════════════════════════════════════ */

type SceneType = '口播' | '产品展示' | '剧情' | '结尾' | '转场';
type Emotion = '激情' | '温和' | '神秘' | '轻松' | '悬疑';

interface ScriptScene {
  id: string;
  index: number;
  title: string;
  type: SceneType;
  duration: number;
  emotion: Emotion;
  narration: string;
  description: string;
  wordCount: number;
  cost: number;
}

const TYPE_OPTIONS: SceneType[] = ['口播', '产品展示', '剧情', '结尾', '转场'];
const EMOTION_OPTIONS: Emotion[] = ['激情', '温和', '神秘', '轻松', '悬疑'];
const COST_PER_WORD = 0.0015;

const INITIAL_SCENES: ScriptScene[] = [
  { id: 's1', index: 1, title: '开场 · 口播介绍', type: '口播', duration: 12, emotion: '激情', narration: '大家好，欢迎来到本期产品推荐！今天我们要介绍一款改变生活的神器——夏季护肤精华液。让我们一起来看看它的惊人效果。', description: '主播站在简洁的白色背景前，面对镜头做开场引导。面带自信微笑，手部自然动作，语气热情洋溢。', wordCount: 48, cost: 0.07 },
  { id: 's2', index: 2, title: '产品特写展示', type: '产品展示', duration: 15, emotion: '温和', narration: '这款精华液采用天然植物提取配方，含有玻尿酸、维生素C和胶原蛋白三重活性成分。每天只需两滴，肌肤水润光滑。', description: '产品在旋转展台上缓慢转动，微距镜头捕捉瓶身质感和液体流动。柔光照明，产品在画面中占比70%。', wordCount: 45, cost: 0.07 },
  { id: 's3', index: 3, title: '使用效果对比', type: '产品展示', duration: 20, emotion: '轻松', narration: '使用一周后，肌肤水润度提升45%，使用一个月后，细纹明显减少。千人实测，满意度高达98%！', description: '分屏展示使用前/使用后对比。左侧暗淡粗糙皮肤，右侧水润光滑。数据标签弹出动画强调关键数字。', wordCount: 42, cost: 0.06 },
  { id: 's4', index: 4, title: '结尾 · 行动号召', type: '结尾', duration: 10, emotion: '激情', narration: '限时优惠仅剩3天！点击下方链接立即购买，享受首单7折优惠。错过今天，再等一年！', description: '主播回到镜头前做号召行动。手指向画面下方，出现CTA按钮动画。整体色调温暖明亮。', wordCount: 35, cost: 0.05 },
];

/* ─── Icons ─────────────────────────────────────────────────────────────── */

function IconPlus() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 3v10M3 8h10" strokeLinecap="round"/></svg>;
}
function IconDelete() {
  return <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 10h8l1-10"/></svg>;
}
function IconSave() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M13 2H4a1 1 0 00-1 1v11l5-3 5 3V3a1 1 0 00-1-1z"/></svg>;
}
function IconRefresh() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 8a6 6 0 0111.3-2.8M14 8a6 6 0 01-11.3 2.8M14 2v4h-4M2 14v-4h4"/></svg>;
}
function IconScript() {
  return <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>;
}

export default function VideoScriptPage() {
  const [scenes, setScenes] = useState<ScriptScene[]>(INITIAL_SCENES);
  const [activeSceneId, setActiveSceneId] = useState<string>(INITIAL_SCENES[0]?.id || '');
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saved, setSaved] = useState(false);

  const activeScene = useMemo(() => scenes.find((s) => s.id === activeSceneId), [scenes, activeSceneId]);

  const totalStats = useMemo(() => ({
    duration: scenes.reduce((sum, s) => sum + s.duration, 0),
    wordCount: scenes.reduce((sum, s) => sum + s.wordCount, 0),
    cost: scenes.reduce((sum, s) => sum + s.cost, 0),
  }), [scenes]);

  const handleSelectScene = useCallback((id: string) => {
    setActiveSceneId(id);
    setEditingField(null);
  }, []);

  const startEdit = useCallback((field: string, value: string) => {
    setEditingField(field);
    setEditValue(value);
  }, []);

  const commitEdit = useCallback(() => {
    if (!editingField || !activeSceneId) { setEditingField(null); return; }
    setScenes((prev) => prev.map((s) => {
      if (s.id !== activeSceneId) return s;
      const updated = { ...s, [editingField]: editValue };
      if (editingField === 'narration') {
        updated.wordCount = editValue.length;
        updated.cost = editValue.length * COST_PER_WORD;
      }
      if (editingField === 'duration') {
        updated.duration = parseInt(editValue) || s.duration;
      }
      if (editingField === 'title') {
        updated.title = editValue;
      }
      return updated;
    }));
    setEditingField(null);
    showSavedMessage();
  }, [editingField, activeSceneId, editValue]);

  const showSavedMessage = useCallback(() => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, []);

  const handleTypeChange = useCallback((type: SceneType) => {
    if (!activeSceneId) return;
    setScenes((prev) => prev.map((s) => s.id === activeSceneId ? { ...s, type } : s));
    showSavedMessage();
  }, [activeSceneId, showSavedMessage]);

  const handleEmotionChange = useCallback((emotion: Emotion) => {
    if (!activeSceneId) return;
    setScenes((prev) => prev.map((s) => s.id === activeSceneId ? { ...s, emotion } : s));
    showSavedMessage();
  }, [activeSceneId, showSavedMessage]);

  const handleAddScene = useCallback(() => {
    const newIndex = scenes.length + 1;
    const newScene: ScriptScene = {
      id: `s${Date.now()}`,
      index: newIndex,
      title: `场景 ${newIndex}`,
      type: '口播',
      duration: 10,
      emotion: '温和',
      narration: '',
      description: '',
      wordCount: 0,
      cost: 0,
    };
    setScenes((prev) => [...prev, newScene]);
    setActiveSceneId(newScene.id);
  }, [scenes.length]);

  const handleDeleteScene = useCallback((id: string) => {
    setScenes((prev) => {
      const next = prev.filter((s) => s.id !== id);
      // Reindex
      return next.map((s, i) => ({ ...s, index: i + 1 }));
    });
    if (activeSceneId === id) {
      setActiveSceneId(scenes[0]?.id || '');
    }
  }, [activeSceneId, scenes]);

  const handleRegenerate = useCallback(() => {
    if (!activeScene) return;
    // Simulate regeneration
    const updatedNarration = `[AI 重新生成] ${activeScene.title}的新版旁白文本。基于${activeScene.type}类型和${activeScene.emotion}情绪重新创作。`;
    setScenes((prev) => prev.map((s) =>
      s.id === activeScene.id ? {
        ...s,
        narration: updatedNarration,
        wordCount: updatedNarration.length,
        cost: updatedNarration.length * COST_PER_WORD,
      } : s
    ));
    showSavedMessage();
  }, [activeScene, showSavedMessage]);

  return (
    <>
      <div className="vsc-page">
        {/* Header */}
        <div className="vsc-header">
          <div>
            <h1 className="vsc-title">脚本编辑器</h1>
            <p className="vsc-sub">编辑和管理短视频脚本，AI 将根据场景描述生成视觉内容</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {saved && <span className="vsc-saved-badge"><IconSave /> 已保存</span>}
            <a href="/short-video/studio" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
              返回工坊
            </a>
          </div>
        </div>

        {scenes.length > 0 ? (
          <div className="vsc-body">
            {/* Left: scene list */}
            <div className="vsc-left">
              <div className="vsc-left-header">
                <span className="vsc-section-title">场景列表</span>
                <span className="vsc-section-count">{scenes.length} 个场景</span>
              </div>
              <div className="vsc-scene-list">
                {scenes.map((s) => (
                  <div
                    key={s.id}
                    className={`vsc-scene-card${activeSceneId === s.id ? ' active' : ''}`}
                    onClick={() => handleSelectScene(s.id)}
                  >
                    <div className="vsc-scene-index">{s.index}</div>
                    <div className="vsc-scene-info">
                      <div className="vsc-scene-name">{s.title}</div>
                      <div className="vsc-scene-meta">
                        <span className="vsc-scene-tag">{s.type}</span>
                        <span className="vsc-scene-tag">{s.duration}s</span>
                        <span>{s.wordCount}字</span>
                      </div>
                    </div>
                    <button className="vsc-scene-delete" onClick={(e) => { e.stopPropagation(); handleDeleteScene(s.id); }}>
                      <IconDelete />
                    </button>
                  </div>
                ))}
                <button className="vsc-add-scene-btn" onClick={handleAddScene}>
                  <IconPlus /> 添加场景
                </button>
              </div>
            </div>

            {/* Right: detail / analysis */}
            <div className="vsc-right">
              {activeScene ? (
                <>
                  {/* Scene title */}
                  <div className="vsc-detail-section">
                    {editingField === 'title' ? (
                      <input className="vsc-inline-input" value={editValue} onChange={(e) => setEditValue(e.target.value)}
                        onBlur={commitEdit} onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(); }} autoFocus />
                    ) : (
                      <h3 className="vsc-detail-title" onClick={() => startEdit('title', activeScene.title)}>
                        {activeScene.title}
                      </h3>
                    )}
                  </div>

                  {/* Type & emotion selects */}
                  <div className="vsc-detail-row">
                    <div className="vsc-detail-group">
                      <label className="vsc-detail-label">类型</label>
                      <select className="vsc-detail-select" value={activeScene.type} onChange={(e) => handleTypeChange(e.target.value as SceneType)}>
                        {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="vsc-detail-group">
                      <label className="vsc-detail-label">情绪</label>
                      <select className="vsc-detail-select" value={activeScene.emotion} onChange={(e) => handleEmotionChange(e.target.value as Emotion)}>
                        {EMOTION_OPTIONS.map((e) => <option key={e} value={e}>{e}</option>)}
                      </select>
                    </div>
                    <div className="vsc-detail-group">
                      <label className="vsc-detail-label">时长（秒）</label>
                      {editingField === 'duration' ? (
                        <input className="vsc-detail-input" type="number" value={editValue} min={3} max={300}
                          onChange={(e) => setEditValue(e.target.value)} onBlur={commitEdit}
                          onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(); }} autoFocus />
                      ) : (
                        <div className="vsc-detail-value" onClick={() => startEdit('duration', String(activeScene.duration))}>
                          {activeScene.duration}s
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Narration */}
                  <div className="vsc-detail-section">
                    <label className="vsc-detail-label">旁白/台词</label>
                    {editingField === 'narration' ? (
                      <textarea className="vsc-detail-textarea" value={editValue}
                        onChange={(e) => setEditValue(e.target.value)} onBlur={commitEdit} autoFocus rows={5} />
                    ) : (
                      <div className="vsc-detail-text" onClick={() => startEdit('narration', activeScene.narration)}>
                        {activeScene.narration || '点击此处编辑旁白文本...'}
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <div className="vsc-detail-section">
                    <label className="vsc-detail-label">视觉描述</label>
                    {editingField === 'description' ? (
                      <textarea className="vsc-detail-textarea" value={editValue}
                        onChange={(e) => setEditValue(e.target.value)} onBlur={commitEdit} autoFocus rows={3} />
                    ) : (
                      <div className="vsc-detail-text" onClick={() => startEdit('description', activeScene.description)}>
                        {activeScene.description || '点击此处编辑视觉描述...'}
                      </div>
                    )}
                  </div>

                  {/* Stats panel */}
                  <div className="vsc-stats-panel">
                    <div className="vsc-stat-item">
                      <span className="vsc-stat-label">字数</span>
                      <span className="vsc-stat-value">{activeScene.wordCount} 字</span>
                    </div>
                    <div className="vsc-stat-item">
                      <span className="vsc-stat-label">时长</span>
                      <span className="vsc-stat-value">{activeScene.duration}s</span>
                    </div>
                    <div className="vsc-stat-item">
                      <span className="vsc-stat-label">成本</span>
                      <span className="vsc-stat-value">¥{activeScene.cost.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Action */}
                  <button className="vsc-regenerate-btn" onClick={handleRegenerate}>
                    <IconRefresh /> 重新生成此场景
                  </button>
                </>
              ) : (
                <div className="vsc-no-selection">
                  <p>选择一个场景卡片查看详情</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="vsc-empty">
            <div className="vsc-empty-icon"><IconScript /></div>
            <p className="vsc-empty-title">还没有场景</p>
            <p className="vsc-empty-desc">添加第一个场景开始编写脚本。</p>
            <button className="btn btn-brand" onClick={handleAddScene}>
              <IconPlus /> 添加场景
            </button>
          </div>
        )}

        {/* Total stats bar */}
        {scenes.length > 0 && (
          <div className="vsc-total-bar">
            <span>总计</span>
            <span>{totalStats.duration}秒</span>
            <span>{totalStats.wordCount}字</span>
            <span>¥{totalStats.cost.toFixed(2)}</span>
          </div>
        )}
      </div>

      <style jsx>{`
        .vsc-page { color: var(--fg); display: flex; flex-direction: column; height: 100%; }

        .vsc-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 28px; border-bottom: 1px solid var(--border);
          background: var(--surface); flex-shrink: 0;
        }
        .vsc-title { font-size: var(--text-xl); font-weight: 500; margin: 0; font-family: var(--font-display); }
        .vsc-sub { font-size: 13px; color: var(--muted); margin: 2px 0 0 0; }
        .vsc-saved-badge {
          display: flex; align-items: center; gap: 4px; font-size: 12px;
          color: var(--accent); padding: 4px 10px; border-radius: 4px;
          background: rgba(62,207,142,0.08); border: 1px solid rgba(62,207,142,0.2);
        }

        /* Body */
        .vsc-body { display: flex; flex: 1; overflow: hidden; }

        /* Left panel */
        .vsc-left {
          width: 300px; flex-shrink: 0; border-right: 1px solid var(--border);
          display: flex; flex-direction: column; overflow: hidden;
        }
        .vsc-left-header {
          padding: 12px 16px; border-bottom: 1px solid var(--border);
          display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;
        }
        .vsc-section-title { font-size: 11px; font-family: var(--font-mono); color: var(--meta); text-transform: uppercase; letter-spacing: 0.8px; }
        .vsc-section-count { font-size: 11px; color: var(--muted); }

        .vsc-scene-list { flex: 1; overflow-y: auto; padding: 8px; }
        .vsc-scene-card {
          display: flex; align-items: center; gap: 10px; padding: 10px 12px;
          border-radius: 8px; border: 1px solid var(--border); margin-bottom: 6px;
          cursor: pointer; transition: all 0.15s;
        }
        .vsc-scene-card:hover { border-color: #363636; }
        .vsc-scene-card.active { border-color: var(--accent); background: rgba(62,207,142,0.05); }
        .vsc-scene-index {
          width: 24px; height: 24px; border-radius: 6px; background: var(--border-soft);
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; color: var(--muted); font-family: var(--font-mono); flex-shrink: 0;
        }
        .vsc-scene-info { flex: 1; min-width: 0; }
        .vsc-scene-name {
          font-size: 13px; font-weight: 500; color: var(--fg);
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-bottom: 2px;
        }
        .vsc-scene-meta { display: flex; gap: 6px; font-size: 10px; color: var(--muted); }
        .vsc-scene-tag { padding: 1px 6px; border-radius: 3px; background: var(--border-soft); }
        .vsc-scene-delete {
          width: 22px; height: 22px; border-radius: 4px; border: none;
          background: transparent; color: var(--meta); cursor: pointer;
          display: none; align-items: center; justify-content: center; flex-shrink: 0; padding: 0;
        }
        .vsc-scene-card:hover .vsc-scene-delete { display: flex; }
        .vsc-scene-delete:hover { background: var(--border-soft); color: var(--danger); }
        .vsc-add-scene-btn {
          display: flex; align-items: center; gap: 6px; padding: 10px 14px;
          border-radius: 8px; border: 1px dashed var(--border); background: transparent;
          color: var(--muted); cursor: pointer; font-size: 12px; font-family: var(--font-body);
          width: 100%; transition: all 0.15s;
        }
        .vsc-add-scene-btn:hover { border-color: var(--accent); color: var(--accent); }

        /* Right panel */
        .vsc-right { flex: 1; overflow-y: auto; padding: 24px 28px; }
        .vsc-detail-section { margin-bottom: 16px; }
        .vsc-detail-title {
          font-size: 18px; font-weight: 500; margin: 0 0 12px; cursor: pointer;
          font-family: var(--font-display); transition: color 0.15s;
        }
        .vsc-detail-title:hover { color: var(--accent); }
        .vsc-detail-row { display: flex; gap: 14px; margin-bottom: 16px; }
        .vsc-detail-group { display: flex; flex-direction: column; gap: 4px; }
        .vsc-detail-label {
          font-size: 10px; font-family: var(--font-mono); color: var(--meta);
          text-transform: uppercase; letter-spacing: 0.6px;
        }
        .vsc-detail-select {
          background: var(--border-soft); border: 1px solid var(--border);
          border-radius: 6px; padding: 6px 10px; color: var(--fg);
          font-size: 13px; font-family: var(--font-body); cursor: pointer; outline: none;
        }
        .vsc-detail-select:focus { border-color: var(--accent); }
        .vsc-detail-value {
          padding: 6px 10px; border-radius: 6px; border: 1px solid transparent; cursor: pointer;
          font-size: 13px; font-family: var(--font-mono);
        }
        .vsc-detail-value:hover { border-color: var(--border); }
        .vsc-detail-input {
          background: var(--border-soft); border: 1px solid var(--accent); border-radius: 6px;
          padding: 6px 10px; color: var(--fg); font-size: 13px; font-family: var(--font-mono);
          outline: none; width: 70px;
        }
        .vsc-inline-input {
          background: var(--border-soft); border: 1px solid var(--accent); border-radius: 6px;
          padding: 6px 10px; color: var(--fg); font-size: 18px; font-family: var(--font-display);
          outline: none; width: 100%; box-sizing: border-box;
        }
        .vsc-detail-text {
          background: var(--border-soft); border: 1px solid var(--border); border-radius: 8px;
          padding: 12px; font-size: 13px; line-height: 1.7; color: var(--fg-2);
          cursor: pointer; min-height: 60px; transition: border-color 0.15s;
        }
        .vsc-detail-text:hover { border-color: #363636; }
        .vsc-detail-textarea {
          width: 100%; background: var(--border-soft); border: 1px solid var(--accent);
          border-radius: 8px; padding: 12px; font-size: 13px; line-height: 1.7;
          color: var(--fg); font-family: var(--font-body); outline: none; resize: vertical; box-sizing: border-box;
        }

        /* Stats */
        .vsc-stats-panel {
          display: flex; gap: 16px; padding: 14px; border-radius: 8px;
          background: var(--border-soft); border: 1px solid var(--border); margin-bottom: 16px;
        }
        .vsc-stat-item { flex: 1; text-align: center; }
        .vsc-stat-label { display: block; font-size: 10px; color: var(--meta); text-transform: uppercase; letter-spacing: 0.5px; }
        .vsc-stat-value { display: block; font-size: 16px; font-weight: 500; color: var(--fg); margin-top: 2px; font-family: var(--font-mono); }

        .vsc-regenerate-btn {
          display: flex; align-items: center; gap: 6px; padding: 8px 16px;
          border-radius: 6px; border: 1px solid var(--border); background: transparent;
          color: var(--accent); cursor: pointer; font-size: 13px; font-family: var(--font-body);
          transition: all 0.15s;
        }
        .vsc-regenerate-btn:hover { background: rgba(62,207,142,0.08); border-color: var(--accent); }

        .vsc-no-selection { display: flex; align-items: center; justify-content: center; height: 100%; color: var(--muted); font-size: 14px; }

        /* Empty */
        .vsc-empty {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: 100px 20px; text-align: center;
        }
        .vsc-empty-icon {
          width: 64px; height: 64px; background: var(--border-soft); border-radius: 16px;
          display: flex; align-items: center; justify-content: center; margin-bottom: 16px; color: var(--muted);
        }
        .vsc-empty-title { font-size: 16px; font-weight: 500; color: var(--fg); margin: 0 0 8px; }
        .vsc-empty-desc { font-size: 13px; color: var(--muted); line-height: 1.6; max-width: 300px; margin-bottom: 20px; }

        /* Total bar */
        .vsc-total-bar {
          display: flex; gap: 20px; padding: 10px 28px; border-top: 1px solid var(--border);
          background: var(--surface); font-size: 12px; color: var(--muted); flex-shrink: 0;
        }
        .vsc-total-bar span:first-child { font-weight: 500; color: var(--fg); }

        /* Responsive */
        @media (max-width: 1023px) {
          .vsc-header { padding: 14px 20px; }
          .vsc-left { width: 250px; }
          .vsc-right { padding: 20px; }
          .vsc-total-bar { padding: 10px 20px; }
        }
        @media (max-width: 767px) {
          .vsc-header { flex-direction: column; align-items: flex-start; gap: 10px; padding: 14px 16px; }
          .vsc-header .btn { width: 100%; justify-content: center; }
          .vsc-body { flex-direction: column; }
          .vsc-left { width: 100%; border-right: none; border-bottom: 1px solid var(--border); max-height: 200px; }
          .vsc-right { padding: 16px; }
          .vsc-detail-row { flex-direction: column; gap: 8px; }
          .vsc-stats-panel { flex-direction: column; gap: 8px; }
          .vsc-total-bar { padding: 10px 16px; }
        }
      `}</style>
    </>
  );
}
