'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { transitionStatus } from '@/app/admin/(authed)/[collection]/[id]/actions';

type Status =
  | 'draft'
  | 'review'
  | 'scheduled'
  | 'published'
  | 'archived'
  | 'live'
  | 'coming';

const BADGES: Record<string, { label: string; className: string }> = {
  draft:     { label: 'Draft',     className: 'bg-ink-700 text-paper-200' },
  review:    { label: 'In review', className: 'bg-brand-400/20 text-brand-300' },
  scheduled: { label: 'Scheduled', className: 'bg-yellow-900/30 text-yellow-300' },
  published: { label: 'Published', className: 'bg-emerald-900/30 text-emerald-300' },
  live:      { label: 'Live',      className: 'bg-emerald-900/30 text-emerald-300' },
  archived:  { label: 'Archived',  className: 'bg-ink-700 text-paper-400' },
  coming:    { label: 'Coming soon', className: 'bg-yellow-900/30 text-yellow-300' },
};

export default function WorkflowControls({
  collectionId,
  documentId,
  currentStatus,
  scheduledFor,
}: {
  collectionId: string;
  documentId: string;
  currentStatus: string;
  scheduledFor?: string | null;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [scheduleInput, setScheduleInput] = useState(
    scheduledFor ? toLocalInput(scheduledFor) : '',
  );

  const badge = BADGES[currentStatus] ?? BADGES.draft;

  function run(
    action: 'publish' | 'unpublish' | 'review' | 'schedule' | 'archive',
    scheduleArg?: string,
  ) {
    setError(null);
    startTransition(async () => {
      const result = await transitionStatus(
        collectionId,
        documentId,
        action,
        scheduleArg,
      );
      if (result.ok) {
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  // Allowed transitions per current state. Permissive — admin can always
  // override by editing the status dropdown directly.
  const isPublished = currentStatus === 'published' || currentStatus === 'live';
  const showSubmit = currentStatus === 'draft';
  const showApprove = currentStatus === 'review';
  const showPublish = ['draft', 'review', 'scheduled', 'archived'].includes(currentStatus);
  const showUnpublish = isPublished;
  const showSchedule = ['draft', 'review'].includes(currentStatus);
  const showArchive = isPublished || currentStatus === 'draft';

  return (
    <section className="border border-ink-600 rounded-lg bg-ink-800/40 p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="font-mono text-mono-sm text-paper-400">Status</span>
          <span
            className={`px-2.5 py-1 rounded-full text-mono-sm font-mono ${badge.className}`}
          >
            {badge.label}
          </span>
          {currentStatus === 'scheduled' && scheduledFor && (
            <span className="font-mono text-mono-sm text-paper-300">
              → {new Date(scheduledFor).toLocaleString()}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {showSubmit && (
          <Btn label="Submit for review" onClick={() => run('review')} pending={pending} />
        )}
        {showApprove && (
          <Btn label="Approve & publish" emphasis onClick={() => run('publish')} pending={pending} />
        )}
        {showPublish && !showApprove && (
          <Btn label="Publish now" emphasis onClick={() => run('publish')} pending={pending} />
        )}
        {showUnpublish && (
          <Btn label="Unpublish" onClick={() => run('unpublish')} pending={pending} />
        )}
        {showArchive && (
          <Btn label="Archive" onClick={() => run('archive')} pending={pending} />
        )}
      </div>

      {showSchedule && (
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-ink-700">
          <span className="font-mono text-mono-sm text-paper-400">Or schedule</span>
          <input
            type="datetime-local"
            value={scheduleInput}
            onChange={(e) => setScheduleInput(e.target.value)}
            className="bg-transparent border-b border-ink-600 focus:border-paper-50 outline-none text-body text-paper-50 py-1 transition-colors"
          />
          <Btn
            label="Schedule"
            onClick={() => {
              if (!scheduleInput) return;
              run('schedule', new Date(scheduleInput).toISOString());
            }}
            pending={pending}
            disabled={!scheduleInput}
          />
        </div>
      )}

      {error && (
        <p className="font-mono text-mono-sm text-red-400" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}

function Btn({
  label,
  onClick,
  emphasis,
  pending,
  disabled,
}: {
  label: string;
  onClick: () => void;
  emphasis?: boolean;
  pending: boolean;
  disabled?: boolean;
}) {
  const cls = emphasis
    ? 'btn-primary disabled:opacity-50 disabled:cursor-not-allowed'
    : 'inline-flex items-center justify-center px-4 py-2 text-sm rounded-full bg-ink-700 text-paper-100 hover:bg-ink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending || disabled}
      className={cls}
    >
      {pending ? '…' : label}
    </button>
  );
}

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  // Strip seconds + timezone for the datetime-local input.
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
