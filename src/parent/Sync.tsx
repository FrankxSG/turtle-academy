// Parent-facing sync status (Pilot Scope §3). "Saved on this iPad" and "Synced to backend" are different facts:
// local saving is reported from the local writer, sync from server acknowledgements and download catch-up.
import { useState } from 'react'
import type { SaveStatus } from '../engine/persistence.ts'
import type { SyncStatus } from '../sync/manager.ts'
import type { Language } from '../ui/development.ts'

export function SyncPanel({
  status,
  save,
  language,
  busy,
  syncNow,
  signIn,
  signOut,
}: {
  status: SyncStatus | null
  save: SaveStatus | null
  language: Language
  busy: boolean
  syncNow: () => void
  signIn: (email: string, password: string) => void
  signOut: () => void
}) {
  const zh = language === 'zh'
  const tr = (en: string, cn: string) => (zh ? cn : en)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString(zh ? 'zh-SG' : 'en-SG') : tr('Not yet', '尚未同步'))
  const states: Record<SyncStatus['state'], string> = {
    idle: tr('Up to date', '已同步'),
    syncing: tr('Syncing…', '正在同步…'),
    restoring: tr('Restoring records from the backend…', '正在从云端恢复记录…'),
    offline: tr('Offline: changes wait on this iPad and upload when the connection returns', '离线：更改保存在本设备，联网后上传'),
    sign_in_required: tr('Sign-in required to sync. Practice continues on this iPad.', '需要登录才能同步。练习可继续在本设备进行。'),
    failed: tr('Sync failed. Changes stay on this iPad.', '同步失败。更改仍保存在本设备。'),
  }
  const localOk = !save?.warning
  return (
    <section className="sync-panel" aria-label={tr('Sync status', '同步状态')} data-testid="sync-panel">
      <h2>{tr('Saving and sync', '保存与同步')}</h2>
      <dl>
        <dt>{tr('Saved on this iPad', '已保存在本设备')}</dt>
        <dd data-testid="local-save">
          {localOk
            ? tr('Yes: every change is saved on this iPad', '是：所有更改都已保存在本设备')
            : tr(`No: ${save?.pending ?? 0} change(s) are only in memory and may be lost on reload`, `否：${save?.pending ?? 0} 项更改仅在内存中，刷新可能丢失`)}
        </dd>
        <dt>{tr('Synced to backend', '已同步到云端')}</dt>
        <dd data-testid="sync-state">
          {status
            ? status.state === 'idle' && status.waiting > 0
              ? tr('Changes are saved on this iPad and waiting to upload', '更改已保存在本设备，等待上传')
              : states[status.state]
            : tr('Not set up on this device', '本设备未设置同步')}
          {status?.code && status.state !== 'idle' ? ` (${status.code})` : ''}
        </dd>
        <dt>{tr('Last successful sync', '上次成功同步')}</dt>
        <dd data-testid="last-sync">{fmt(status?.lastSyncAt ?? null)}</dd>
        <dt>{tr('Changes waiting to upload', '等待上传的更改')}</dt>
        <dd data-testid="waiting">{status?.waiting ?? 0}</dd>
      </dl>
      {(status?.waiting ?? 0) > 0 && (
        <p className="error" role="note">
          {tr(
            'Clearing this browser’s data or removing the app now would lose the changes still waiting to upload.',
            '现在清除浏览器数据或删除应用，会丢失尚未上传的更改。',
          )}
        </p>
      )}
      {status && status.refused > 0 && (
        <p className="error" role="note">
          {tr(
            `${status.refused} change(s) could not upload and are kept on this iPad only.`,
            `${status.refused} 项更改无法上传，仅保存在本设备。`,
          )}
        </p>
      )}
      {status?.clockWarning && (
        <p className="error" role="note">
          {tr(
            'This iPad’s clock differs from the server by more than five minutes. Set the date and time automatically so edits are ordered correctly.',
            '本设备时钟与服务器相差超过五分钟。请设为自动设置日期与时间，以免更改顺序出错。',
          )}
        </p>
      )}
      {status?.packIssue && (
        <p className="error" role="note">
          {tr('The current mistake pack cannot sync and stays on this iPad only.', '当前错题包无法同步，仅保存在本设备。')}
        </p>
      )}
      <button className="primary" disabled={busy || !status} onClick={syncNow}>
        {tr('Sync now', '立即同步')}
      </button>
      {status?.state === 'sign_in_required' && (
        <form
          onSubmit={(ev) => {
            ev.preventDefault()
            const secret = password
            setPassword('')
            signIn(email, secret)
          }}
        >
          <p>
            {tr(
              'Sign in with the same parent account to resume syncing. A different account cannot sync these records.',
              '请用同一家长账户登录以继续同步。其他账户无法同步这些记录。',
            )}
          </p>
          <label>
            {tr('Parent email', '家长邮箱')}
            <input type="email" autoComplete="username" value={email} onChange={(ev) => setEmail(ev.target.value)} required />
          </label>
          <label>
            {tr('Password', '密码')}
            <input type="password" autoComplete="current-password" value={password} onChange={(ev) => setPassword(ev.target.value)} required />
          </label>
          <button disabled={busy}>{tr('Sign in to sync', '登录并同步')}</button>
        </form>
      )}
      <button className="text-button" disabled={busy} onClick={signOut}>
        {tr('Sign out of this iPad', '在本设备退出登录')}
      </button>
      <p className="small">
        {tr(
          'Sign-out keeps waiting changes on this iPad; they upload after the same account signs in again. Practice needs the account to be signed in on this iPad.',
          '退出登录后，等待上传的更改仍保存在本设备，同一账户再次登录后上传。在本设备练习需要先登录账户。',
        )}
      </p>
    </section>
  )
}
