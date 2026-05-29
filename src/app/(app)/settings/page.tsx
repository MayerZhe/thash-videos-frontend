'use client';

import { useState, useEffect, useCallback } from 'react';
import { settingsApi, authApi, ApiError } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import type { TeamMember, BillingInfo, User } from '@/lib/types';

/* ═══════════════════════════════════════════════════════════════════════
 * Settings Page — 1:1 replica of Thash-video-design/settings.html
 * Route: /settings
 * Settings nav (6 tabs), profile, API keys, suppliers, team, limits, billing
 * ═══════════════════════════════════════════════════════════════════════ */

const SETTING_TABS = [
  'profile', 'api-keys', 'suppliers', 'team', 'limits', 'billing',
] as const;

type SettingTab = (typeof SETTING_TABS)[number];

const TAB_LABELS: Record<SettingTab, string> = {
  'profile': '个人资料',
  'api-keys': 'API 密钥',
  'suppliers': '供应商配置',
  'team': '团队管理',
  'limits': '用量限制',
  'billing': '账单',
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingTab>('profile');
  const [showApiKey, setShowApiKey] = useState(false);
  const [fallbackOn, setFallbackOn] = useState(true);
  const [toasts, setToasts] = useState<{ id: number; msg: string }[]>([]);
  const toastId = useState({ n: 0 })[0];

  const storeUser = useAuthStore((s) => s.user);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamError, setTeamError] = useState<string | null>(null);
  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingError, setBillingError] = useState<string | null>(null);

  // Profile state
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);

  // API Keys state
  const [apiKeys, setApiKeys] = useState<Array<{ id: string; name: string; created_at: string }>>([]);
  const [apiKeysLoading, setApiKeysLoading] = useState(false);
  const [apiKeysError, setApiKeysError] = useState<string | null>(null);
  const [newKeyName, setNewKeyName] = useState('');
  const [showNewKeyInput, setShowNewKeyInput] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);

  // Suppliers state
  const [suppliers, setSuppliers] = useState<Array<{ id?: string; type: string; name: string; priority: number; enabled: boolean }>>([]);
  const [suppliersLoading, setSuppliersLoading] = useState(false);
  const [suppliersError, setSuppliersError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    setProfileLoading(true);
    setProfileError(null);
    try {
      const user = await authApi.getCurrentUser();
      setProfileUser(user);
      setDisplayName(user.display_name || user.name || '');
      setBio(user.bio || '');
    } catch (err) {
      setProfileError((err as Error).message);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  const toast = (msg: string) => {
    const id = ++toastId.n;
    setToasts((prev) => [...prev, { id, msg }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  };

  const loadTeam = useCallback(async () => {
    setTeamLoading(true);
    setTeamError(null);
    try {
      const data = await settingsApi.getTeam();
      setTeam(data || []);
    } catch (err) {
      setTeamError((err as Error).message);
    } finally {
      setTeamLoading(false);
    }
  }, []);

  const loadBilling = useCallback(async () => {
    setBillingLoading(true);
    setBillingError(null);
    try {
      const data = await settingsApi.getBilling();
      setBilling(data);
    } catch (err) {
      setBillingError((err as Error).message);
    } finally {
      setBillingLoading(false);
    }
  }, []);

  const loadApiKeys = useCallback(async () => {
    setApiKeysLoading(true);
    setApiKeysError(null);
    try {
      const data = await settingsApi.getApiKeys();
      setApiKeys(data || []);
    } catch (err) {
      setApiKeysError((err as Error).message);
    } finally {
      setApiKeysLoading(false);
    }
  }, []);

  const loadSuppliers = useCallback(async () => {
    setSuppliersLoading(true);
    setSuppliersError(null);
    try {
      const data = await settingsApi.getSuppliers();
      // support both array and { suppliers: [...] } shapes
      const list = Array.isArray(data) ? data : (data as Record<string, unknown>).suppliers as Array<Record<string, unknown>> || [];
      setSuppliers(list as Array<{ id?: string; type: string; name: string; priority: number; enabled: boolean }>);
    } catch (err) {
      setSuppliersError((err as Error).message);
    } finally {
      setSuppliersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'team' && team.length === 0 && !teamLoading && !teamError) {
      loadTeam();
    }
    if (activeTab === 'billing' && !billing && !billingLoading && !billingError) {
      loadBilling();
    }
    if (activeTab === 'profile' && !profileUser && !profileLoading && !profileError) {
      loadProfile();
    }
    if (activeTab === 'api-keys' && apiKeys.length === 0 && !apiKeysLoading && !apiKeysError) {
      loadApiKeys();
    }
    if (activeTab === 'suppliers' && suppliers.length === 0 && !suppliersLoading && !suppliersError) {
      loadSuppliers();
    }
  }, [activeTab, team, teamLoading, teamError, billing, billingLoading, billingError,
      profileUser, profileLoading, profileError, apiKeys, apiKeysLoading, apiKeysError,
      suppliers, suppliersLoading, suppliersError, loadTeam, loadBilling, loadProfile,
      loadApiKeys, loadSuppliers]);

  const handleSaveProfile = async () => {
    setProfileSaving(true);
    try {
      const patch: Record<string, string> = {};
      if (displayName !== (profileUser?.display_name || profileUser?.name || '')) {
        patch.display_name = displayName;
      }
      if (bio !== (profileUser?.bio || '')) {
        patch.bio = bio;
      }
      if (Object.keys(patch).length > 0) {
        await authApi.updateProfile(patch);
        useAuthStore.getState().updateUser(patch);
        setProfileUser((prev) => prev ? { ...prev, ...patch } : prev);
      }
      toast('个人资料已保存');
    } catch (err) {
      toast((err instanceof ApiError ? err.message : '保存失败'));
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword) { toast('请输入当前密码'); return; }
    if (newPassword.length < 8) { toast('新密码至少 8 位'); return; }
    if (newPassword !== confirmNewPassword) { toast('两次新密码不一致'); return; }
    setPasswordSaving(true);
    try {
      await authApi.changePassword({ current_password: currentPassword, new_password: newPassword });
      toast('密码已修改');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      toast((err instanceof ApiError ? err.message : '密码修改失败，请稍后重试'));
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="st-content">
      <p className="eyebrow">// 账号设置 · 工作空间</p>
      <h2>设置</h2>

      <div className="settings-layout">
        <nav className="settings-nav">
          {SETTING_TABS.map((key) => (
            <button
              key={key}
              className={activeTab === key ? 'active' : ''}
              onClick={() => setActiveTab(key)}
            >
              {TAB_LABELS[key]}
            </button>
          ))}
        </nav>

        <div className="settings-panel">
          {/* Profile */}
          {activeTab === 'profile' && (
            <>
              {profileLoading ? (
                <div className="settings-section">
                  <h3>个人资料</h3>
                  <div className="stack-4">
                    <div className="flex items-center gap-4" style={{ gap: 'var(--space-4)' }}>
                      <div className="skeleton-avatar" />
                      <div className="skeleton-line" style={{ width: 100 }} />
                    </div>
                    <div className="grid-2">
                      <div className="field"><label>显示名称</label><div className="skeleton-input" /></div>
                      <div className="field"><label>邮箱</label><div className="skeleton-input" /></div>
                    </div>
                    <div className="field"><label>简介</label><div className="skeleton-input" style={{ height: 60 }} /></div>
                  </div>
                </div>
              ) : profileError ? (
                <div className="settings-section">
                  <h3>个人资料</h3>
                  <div style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
                    <p className="text-danger" style={{ marginBottom: 'var(--space-3)' }}>{profileError}</p>
                    <button className="btn btn-brand btn-sm" onClick={loadProfile}>重试</button>
                  </div>
                </div>
              ) : profileUser ? (
                <>
                  <div className="settings-section">
                    <h3>个人资料</h3>
                    <div className="stack-4">
                      <div className="flex items-center gap-4" style={{ gap: 'var(--space-4)' }}>
                        <div className="avatar" style={{ width: 64, height: 64, fontSize: 'var(--text-xl)' }}>
                          {profileUser.avatar_url
                            ? <img src={profileUser.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                            : (profileUser.display_name || profileUser.name || '?').charAt(0).toUpperCase()
                          }
                        </div>
                        <div><button className="btn btn-secondary btn-sm">更换头像</button></div>
                      </div>
                      <div className="grid-2">
                        <div className="field">
                          <label>显示名称</label>
                          <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} minLength={2} maxLength={50} />
                          <span style={{ fontSize: 10, color: displayName.length > 50 ? 'var(--danger)' : 'var(--muted)', textAlign: 'right', display: 'block', marginTop: 2 }}>
                            {displayName.length}/50
                          </span>
                        </div>
                        <div className="field">
                          <label>邮箱</label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            <input type="email" value={profileUser.email} readOnly style={{ flex: 1, cursor: 'not-allowed', opacity: 0.7 }} />
                            {profileUser.email_verified ? (
                              <span className="badge badge-success" style={{ whiteSpace: 'nowrap', fontSize: 11 }}>已验证</span>
                            ) : (
                              <>
                                <span className="badge badge-warn" style={{ whiteSpace: 'nowrap', fontSize: 11 }}>
                                  待验证
                                </span>
                                <button className="btn btn-ghost btn-sm" style={{ whiteSpace: 'nowrap', fontSize: 11 }}
                                  onClick={async () => {
                                    try {
                                      await authApi.resendVerification({ user_id: profileUser.id });
                                      toast('验证邮件已重新发送');
                                    } catch { toast('发送失败，请稍后重试'); }
                                  }}>
                                  重发验证邮件
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="field">
                        <label>简介</label>
                        <textarea rows={2} placeholder="介绍一下你的创作方向..." value={bio} onChange={(e) => setBio(e.target.value)} maxLength={200} />
                        <span style={{ fontSize: 10, color: bio.length > 200 ? 'var(--danger)' : 'var(--muted)', textAlign: 'right', display: 'block', marginTop: 2 }}>
                          {bio.length}/200
                        </span>
                      </div>
                      <button className="btn btn-brand" disabled={profileSaving} onClick={handleSaveProfile}>
                        {profileSaving ? '保存中...' : '保存修改'}
                      </button>
                    </div>
                  </div>

                  {/* Change Password (P1) */}
                  <div className="settings-section">
                    <h3>修改密码</h3>
                    <div className="stack-4">
                      <div className="field">
                        <label>当前密码</label>
                        <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="输入当前密码" />
                      </div>
                      <div className="field">
                        <label>新密码</label>
                        <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="至少 8 位" minLength={8} />
                      </div>
                      <div className="field">
                        <label>确认新密码</label>
                        <input type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} placeholder="再次输入新密码" />
                      </div>
                      <button className="btn btn-brand" disabled={passwordSaving} onClick={handleChangePassword}>
                        {passwordSaving ? '修改中...' : '修改密码'}
                      </button>
                    </div>
                  </div>

                  {/* Danger Zone */}
                  <div className="settings-section" style={{ borderColor: 'var(--danger)', borderWidth: 1 }}>
                    <h3 style={{ color: 'var(--danger)' }}>危险区域</h3>
                    <p className="body-muted body-sm" style={{ marginBottom: 'var(--space-3)' }}>
                      删除账号将永久删除所有数据和项目，不可恢复。
                    </p>
                    <button className="btn btn-danger btn-sm" onClick={() => {
                      if (window.confirm('确定要删除账号吗？此操作不可撤销！')) {
                        toast('账号删除功能即将上线');
                      }
                    }}>
                      删除我的账号
                    </button>
                  </div>
                </>
              ) : (
                <div className="settings-section">
                  <h3>个人资料</h3>
                  <p className="text-muted" style={{ padding: 'var(--space-4)', textAlign: 'center' }}>无法加载个人资料</p>
                </div>
              )}
            </>
          )}

          {/* API Keys */}
          {activeTab === 'api-keys' && (
            <div className="settings-section">
              <h3>API 密钥</h3>
              {apiKeysLoading ? (
                <div className="stack-4">
                  <div className="card"><div className="skeleton-line" style={{ width: '60%' }} /></div>
                  <div className="card"><div className="skeleton-line" style={{ width: '50%' }} /></div>
                </div>
              ) : apiKeysError ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
                  <p className="text-danger" style={{ marginBottom: 'var(--space-3)' }}>{apiKeysError}</p>
                  <button className="btn btn-brand btn-sm" onClick={loadApiKeys}>重试</button>
                </div>
              ) : (
                <div className="stack-4">
                  {apiKeys.length === 0 && !showNewKeyInput ? (
                    <p className="text-muted" style={{ padding: 'var(--space-4)', textAlign: 'center' }}>暂无 API 密钥</p>
                  ) : (
                    apiKeys.map((key) => (
                      <div className="card" key={key.id}>
                        <div className="row-between">
                          <span style={{ color: 'var(--fg)' }}>{key.name}</span>
                          <span className="badge badge-success">已配置</span>
                        </div>
                        <div className="api-key-row">
                          <input type="text" value={newlyCreatedKey && `thash_key_••••••••••••••••••••` || `thash_key_••••••••••••••••••••`} readOnly />
                          {newlyCreatedKey ? (
                            <button className="btn btn-ghost btn-sm" onClick={() => { navigator.clipboard.writeText(newlyCreatedKey); toast('已复制到剪贴板'); }}>复制</button>
                          ) : (
                            <button className="btn btn-ghost btn-sm" onClick={() => setShowApiKey(!showApiKey)}>{showApiKey ? '隐藏' : '显示'}</button>
                          )}
                          <button className="btn btn-danger btn-sm" onClick={async () => {
                            try {
                              await settingsApi.deleteApiKey(key.id);
                              setApiKeys((prev) => prev.filter((k) => k.id !== key.id));
                              toast('密钥已删除');
                            } catch (err) {
                              toast((err instanceof ApiError ? err.message : '删除失败'));
                            }
                          }}>删除</button>
                        </div>
                      </div>
                    ))
                  )}
                  {showNewKeyInput ? (
                    <div className="card" style={{ borderColor: 'var(--accent)' }}>
                      <div className="api-key-row">
                        <input
                          type="text"
                          placeholder="密钥名称（如：即梦 API）"
                          value={newKeyName}
                          onChange={(e) => setNewKeyName(e.target.value)}
                          onKeyDown={async (e) => {
                            if (e.key === 'Enter' && newKeyName.trim()) {
                              try {
                                const result = await settingsApi.createApiKey({ name: newKeyName.trim() });
                                setApiKeys((prev) => [...prev, { id: result.id, name: newKeyName.trim(), created_at: new Date().toISOString() }]);
                                setNewlyCreatedKey(result.key);
                                setNewKeyName('');
                                setShowNewKeyInput(false);
                                toast('密钥已创建');
                              } catch (err) {
                                toast((err instanceof ApiError ? err.message : '创建失败'));
                              }
                            }
                            if (e.key === 'Escape') { setShowNewKeyInput(false); setNewKeyName(''); }
                          }}
                        />
                        <button className="btn btn-brand btn-sm" disabled={!newKeyName.trim()} onClick={async () => {
                          if (!newKeyName.trim()) return;
                          try {
                            const result = await settingsApi.createApiKey({ name: newKeyName.trim() });
                            setApiKeys((prev) => [...prev, { id: result.id, name: newKeyName.trim(), created_at: new Date().toISOString() }]);
                            setNewlyCreatedKey(result.key);
                            setNewKeyName('');
                            setShowNewKeyInput(false);
                            toast('密钥已创建');
                          } catch (err) {
                            toast((err instanceof ApiError ? err.message : '创建失败'));
                          }
                        }}>保存</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => { setShowNewKeyInput(false); setNewKeyName(''); }}>取消</button>
                      </div>
                    </div>
                  ) : (
                    <button className="btn btn-secondary btn-sm" onClick={() => setShowNewKeyInput(true)}>+ 添加密钥</button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Supplier Config */}
          {activeTab === 'suppliers' && (
            <div className="settings-section">
              <h3>供应商配置</h3>
              {suppliersLoading ? (
                <div className="stack-3">
                  <div className="card"><div className="skeleton-line" style={{ width: '50%' }} /></div>
                  <div className="card"><div className="skeleton-line" style={{ width: '60%' }} /></div>
                </div>
              ) : suppliersError ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
                  <p className="text-danger" style={{ marginBottom: 'var(--space-3)' }}>{suppliersError}</p>
                  <button className="btn btn-brand btn-sm" onClick={loadSuppliers}>重试</button>
                </div>
              ) : suppliers.length === 0 ? (
                <p className="text-muted" style={{ padding: 'var(--space-4)', textAlign: 'center' }}>暂无供应商配置</p>
              ) : (
                <div className="stack-3">
                  {suppliers.map((supplier) => {
                    const typeLabel = supplier.type === 'image' ? '图片生成' : supplier.type === 'video' ? '视频生成' : supplier.type === 'llm' ? 'LLM 文本' : supplier.type === 'tts' ? 'TTS 语音' : supplier.type;
                    return (
                      <div className="card" key={supplier.id || `${supplier.type}-${supplier.name}`}>
                        <div className="row-between">
                          <div>
                            <span style={{ color: 'var(--fg)' }}>{supplier.name}</span>
                            <p className="body-muted body-sm">{typeLabel}{supplier.enabled ? ' · 已启用' : ' · 已禁用'}</p>
                          </div>
                          <div
                            className={`toggle-switch${supplier.enabled ? ' on' : ''}`}
                            onClick={async () => {
                              const newEnabled = !supplier.enabled;
                              // Optimistic update
                              setSuppliers((prev) => prev.map((s) =>
                                (s.id || `${s.type}-${s.name}`) === (supplier.id || `${supplier.type}-${supplier.name}`)
                                  ? { ...s, is_enabled: newEnabled }
                                  : s
                              ));
                              try {
                                const supplierId = supplier.id || `${supplier.type}-${supplier.name}`;
                                await settingsApi.updateSupplier(supplierId, { is_enabled: newEnabled });
                                toast(`${supplier.name} 已${newEnabled ? '启用' : '禁用'}`);
                              } catch (err) {
                                // Rollback on failure
                                setSuppliers((prev) => prev.map((s) =>
                                  (s.id || `${s.type}-${s.name}`) === (supplier.id || `${supplier.type}-${supplier.name}`)
                                    ? { ...s, enabled: supplier.enabled }
                                    : s
                                ));
                                toast((err instanceof ApiError ? err.message : '更新失败'));
                              }
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Team */}
          {activeTab === 'team' && (
            <div className="settings-section">
              <h3>团队管理</h3>
              {teamLoading ? (
                <p className="text-muted" style={{ padding: 'var(--space-6)', textAlign: 'center' }}>加载团队信息...</p>
              ) : teamError ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
                  <p className="text-danger" style={{ marginBottom: 'var(--space-3)' }}>{teamError}</p>
                  <button className="btn btn-brand btn-sm" onClick={loadTeam}>重试</button>
                </div>
              ) : (
                <div className="stack-3">
                  {team.length === 0 ? (
                    <p className="text-muted" style={{ padding: 'var(--space-6)', textAlign: 'center' }}>暂无团队成员</p>
                  ) : (
                    team.map((m) => (
                      <div className="card" key={m.id}>
                        <div className="row-between">
                          <span style={{ color: 'var(--fg)' }}>{m.name}</span>
                          <span className={`badge${m.role === 'owner' ? ' badge-accent' : ' badge-muted'}`}>{m.role === 'owner' ? '管理员' : m.role === 'admin' ? '管理员' : '成员'}</span>
                        </div>
                        <p className="body-muted body-sm">{m.email}</p>
                      </div>
                    ))
                  )}
                  <button className="btn btn-secondary btn-sm" onClick={() => toast('邀请已发送')}>+ 邀请成员</button>
                </div>
              )}
            </div>
          )}

          {/* Limits */}
          {activeTab === 'limits' && (
            <div className="settings-section">
              <h3>用量限制</h3>
              <div className="stack-4">
                <div className="card">
                  <div className="row-between">
                    <div>
                      <span style={{ color: 'var(--fg)' }}>月度预算上限</span>
                      <p className="body-muted body-sm">达到上限后停止所有 API 调用</p>
                    </div>
                    <div className="field"><input type="number" defaultValue={500} style={{ width: 120 }} /></div>
                  </div>
                  <p className="body-meta">当前已用 ¥158.70 / ¥500.00（31.7%）</p>
                </div>
                <div className="card">
                  <div className="row-between">
                    <div>
                      <span style={{ color: 'var(--fg)' }}>单项目预算上限</span>
                      <p className="body-muted body-sm">单个项目最高预算</p>
                    </div>
                    <div className="field"><input type="number" defaultValue={200} style={{ width: 120 }} /></div>
                  </div>
                </div>
                <button className="btn btn-brand" onClick={() => toast('限制已保存')}>保存限制</button>
              </div>
            </div>
          )}

          {/* Billing */}
          {activeTab === 'billing' && (
            <div className="settings-section">
              <h3>账单</h3>
              {billingLoading ? (
                <p className="text-muted" style={{ padding: 'var(--space-6)', textAlign: 'center' }}>加载账单信息...</p>
              ) : billingError ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
                  <p className="text-danger" style={{ marginBottom: 'var(--space-3)' }}>{billingError}</p>
                  <button className="btn btn-brand btn-sm" onClick={loadBilling}>重试</button>
                </div>
              ) : billing ? (
                <div className="stack-3">
                  <div className="card">
                    <div className="row-between">
                      <span style={{ color: 'var(--fg)' }}>当前套餐</span>
                      <span className="badge badge-accent">{billing.plan}</span>
                    </div>
                    <p className="body-muted body-sm">计费周期: {billing.billing_cycle}{billing.next_billing_date ? ` · 下次扣款: ${billing.next_billing_date}` : ''}</p>
                  </div>
                  <div className="card">
                    <div className="row-between">
                      <span style={{ color: 'var(--fg)' }}>本月费用</span>
                      <span className="text-mono">¥{(billing.cost_to_date_cents / 100).toFixed(2)}</span>
                    </div>
                    {billing.budget_limit_cents != null && (
                      <p className="body-muted body-sm">预算上限: ¥{(billing.budget_limit_cents / 100).toFixed(2)}</p>
                    )}
                  </div>
                  <div className="table-wrap">
                    <table>
                      <thead><tr><th>账单周期</th><th>费用</th><th>状态</th><th></th></tr></thead>
                      <tbody>
                        <tr>
                          <td style={{ color: 'var(--fg)' }}>2026 年 5 月</td>
                          <td className="text-mono">¥{(billing.cost_to_date_cents / 100).toFixed(2)}</td>
                          <td><span className="badge badge-warn">未支付</span></td>
                          <td><button className="btn btn-ghost btn-sm" onClick={() => toast('查看账单详情')}>详情</button></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <p className="text-muted" style={{ padding: 'var(--space-6)', textAlign: 'center' }}>暂无账单数据</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Toasts */}
      <div style={{ position: 'fixed', bottom: 'var(--space-6)', right: 'var(--space-6)', zIndex: 200, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {toasts.map((t) => (
          <div key={t.id} className="toast">{t.msg}</div>
        ))}
      </div>

      <style jsx global>{`
        .st-content { padding: var(--space-8); max-width: 900px; }
        .settings-layout { display: flex; flex-direction: column; gap: var(--space-6); margin-top: var(--space-6); }
        .settings-nav { display: flex; flex-direction: row; flex-wrap: wrap; gap: var(--space-2); }
        .settings-nav button { padding: var(--space-2) var(--space-4); border-radius: var(--radius-pill); color: var(--fg-2); font-size: var(--text-sm); text-decoration: none; transition: all var(--motion-fast) var(--ease-standard); border: 1px solid var(--border); background: var(--bg); cursor: pointer; font-family: var(--font-body); }
        .settings-nav button:hover { background: var(--surface); color: var(--fg); border-color: var(--border); }
        .settings-nav button.active { background: var(--fg); color: var(--bg); border-color: var(--fg); }
        .settings-panel { flex: 1; }
        .settings-section { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: var(--space-6); margin-bottom: var(--space-4); }
        .settings-section h3 { margin-bottom: var(--space-4); font-weight: 500; }
        .settings-section .field input,
        .settings-section .field select,
        .settings-section .field textarea { padding: 9px var(--space-3); border-radius: var(--radius-sm); background: var(--bg); border: 1px solid var(--border); color: var(--fg); font-family: var(--font-body); font-size: var(--text-sm); outline: none; transition: border-color 0.15s; width: 100%; }
        .settings-section .field textarea { resize: vertical; min-height: 60px; }
        .settings-section .field input:focus,
        .settings-section .field select:focus,
        .settings-section .field textarea:focus { border-color: var(--accent); }
        .settings-section input::placeholder, .settings-section textarea::placeholder { color: var(--meta); }
        .settings-section .field input[readonly] { background: var(--bg); }
        /* Skeleton loading */
        .skeleton-avatar { width: 64px; height: 64px; border-radius: 50%; background: linear-gradient(90deg, var(--border) 25%, var(--border-soft) 50%, var(--border) 75%); background-size: 200% 100%; animation: skeleton-wave 1.5s ease-in-out infinite; }
        .skeleton-line { height: 14px; border-radius: var(--radius-sm); background: linear-gradient(90deg, var(--border) 25%, var(--border-soft) 50%, var(--border) 75%); background-size: 200% 100%; animation: skeleton-wave 1.5s ease-in-out infinite; }
        .skeleton-input { width: 100%; height: 40px; border-radius: var(--radius-sm); background: linear-gradient(90deg, var(--border) 25%, var(--border-soft) 50%, var(--border) 75%); background-size: 200% 100%; animation: skeleton-wave 1.5s ease-in-out infinite; }
        @keyframes skeleton-wave { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        .api-key-row { display: flex; gap: var(--space-3); align-items: flex-end; }
        .api-key-row input { flex: 1; padding: 9px var(--space-3); border-radius: var(--radius-sm); background: var(--bg); border: 1px solid var(--border); color: var(--fg); font-family: var(--font-mono); font-size: var(--text-sm); outline: none; }
        .api-key-row input::placeholder { color: var(--meta); }
        .toggle-switch { position: relative; width: 40px; height: 22px; background: var(--border); border-radius: var(--radius-pill); cursor: pointer; transition: background var(--motion-fast); flex-shrink: 0; }
        .toggle-switch.on { background: var(--accent); }
        .toggle-switch::after { content: ''; position: absolute; top: 2px; left: 2px; width: 18px; height: 18px; border-radius: var(--radius-pill); background: white; transition: transform var(--motion-fast); }
        .toggle-switch.on::after { transform: translateX(18px); }
        .toast { padding: 12px 20px; border-radius: var(--radius-sm); background: var(--surface); border: 1px solid var(--border); color: var(--fg); font-size: var(--text-sm); box-shadow: var(--elev-raised); animation: slideUp 0.25s var(--ease-standard); }
        @keyframes slideUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @media (max-width: 1023px) { .settings-nav button { font-size: var(--text-xs); padding: var(--space-2) var(--space-3); } }
        @media (max-width: 639px) { .st-content { padding: var(--space-4); } }
      `}</style>
    </div>
  );
}
