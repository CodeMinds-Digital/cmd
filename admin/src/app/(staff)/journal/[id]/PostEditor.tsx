'use client';

import { useRef } from 'react';
import type { PostData } from '@codeminds/cms/content/post';
import { readingTime } from '@codeminds/cms/content/rich-text';
import { ActionBar, DangerZone, useDraftForm } from '@/components/draft-form';
import { Area, FieldError, ImageField, Section, Text, input, quiet, slugify } from '@/components/editor';
import RichTextEditor from '@/components/RichTextEditor';
import { deletePost, discardPostDraft, postPreviewLink, publishPostDraft, savePost, setPostVisibility, submitPost } from '../actions';

type Props = {
  rowId: string;
  initial: PostData;
  draftUpdatedAt: string | null;
  draftStatus: 'draft' | 'in_review' | null;
  live: 'published' | 'unpublished' | null;
  isAdmin: boolean;
  filesBase: string;
  projectId: string;
};

export default function PostEditor(p: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const f = useDraftForm<PostData>({
    formRef,
    initial: p.initial,
    draftUpdatedAt: p.draftUpdatedAt,
    draftStatus: p.draftStatus,
    save: (json, expected) => savePost(p.rowId, json, expected),
  });
  const { data, set, err, aria, status, errors } = f;
  const bodyError = Object.entries(errors).find(([k]) => k === 'body' || k.startsWith('body.'))?.[1];
  let minutes = '';
  try {
    minutes = readingTime(data.body);
  } catch {
    minutes = '';
  }

  return (
    <form
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault();
        f.run(f.save);
      }}
      noValidate
      className="pb-32"
    >
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-3xl font-bold">{data.title || 'Untitled post'}</h1>
        <span className="text-sm text-fg-muted">
          {p.live === 'published' ? 'Live' : p.live === 'unpublished' ? 'Hidden from the site' : 'Not published yet'}
          {status === 'draft' && ' · draft changes'}
          {status === 'in_review' && ' · in review'}
        </span>
      </div>

      <Section title="Post">
        <Text label="Title" value={data.title} onChange={(v) => set({ title: v })} error={err('title')} name="title" aria={aria('title')} max={200} />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="slug" className="text-sm font-medium">
            Address
          </label>
          <div className="flex items-center gap-2">
            <span className="text-fg-muted">/journal/</span>
            <input id="slug" className={input} value={data.slug} maxLength={80} onChange={(e) => set({ slug: e.target.value.toLowerCase() })} {...aria('slug')} />
            <button type="button" className={quiet} onClick={() => set({ slug: slugify(data.title) })} disabled={!data.title}>
              From title
            </button>
          </div>
          <FieldError id="slug" text={err('slug')} />
        </div>
        <Area label="Summary (shown on the journal list)" value={data.excerpt} onChange={(v) => set({ excerpt: v })} error={err('excerpt')} name="excerpt" aria={aria('excerpt')} max={500} rows={2} />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="date" className="text-sm font-medium">
              Date shown on the site
            </label>
            <input id="date" type="date" className={input} value={data.date ?? ''} onChange={(e) => set({ date: e.target.value || undefined })} aria-describedby="date-hint" {...aria('date')} />
            <p id="date-hint" className="text-xs text-fg-subtle">
              Leave empty to use the day it’s first published.
            </p>
            <FieldError id="date" text={err('date')} />
          </div>
          <Text label="Author (optional)" value={data.authorName ?? ''} onChange={(v) => set({ authorName: v })} error={err('authorName')} name="authorName" aria={aria('authorName')} max={100} />
        </div>
        <Text
          label="Tags (comma-separated)"
          value={data.tags.join(', ')}
          onChange={(v) => set({ tags: v.split(',').map((t) => t.trim()).filter(Boolean) })}
          error={err('tags')}
          name="tags"
          aria={aria('tags')}
        />
      </Section>

      <Section title="Cover image (optional)">
        <ImageField
          label="Cover"
          url={data.cover.fileId ? `${p.filesBase}/${data.cover.fileId}/view?project=${p.projectId}` : null}
          onChange={(i) => set({ cover: { fileId: i.fileId, alt: data.cover.alt } })}
          error={err('cover')}
        />
        {data.cover.fileId && (
          <Text label="Cover description (alt text)" value={data.cover.alt ?? ''} onChange={(v) => set({ cover: { ...data.cover, alt: v } })} error={err('cover.alt')} name="cover.alt" aria={aria('cover.alt')} max={300} />
        )}
      </Section>

      <Section title="Article">
        <div className="flex items-baseline justify-between">
          <span id="body-label" className="text-sm font-medium">
            Body
          </span>
          {minutes && <span className="text-xs text-fg-subtle">{minutes}</span>}
        </div>
        <RichTextEditor value={data.body} onChange={(body) => set({ body })} filesBase={p.filesBase} projectId={p.projectId} labelledBy="body-label" invalid={!!bodyError} />
        {bodyError && (
          <p role="alert" className="text-sm text-danger">
            {bodyError}
          </p>
        )}
      </Section>

      <Section title="Search & sharing (optional)">
        <Text label="Search title (defaults to the title)" value={data.seoTitle ?? ''} onChange={(v) => set({ seoTitle: v })} error={err('seoTitle')} name="seoTitle" aria={aria('seoTitle')} max={70} />
        <Area label="Search description (defaults to the summary)" value={data.seoDescription ?? ''} onChange={(v) => set({ seoDescription: v })} error={err('seoDescription')} name="seoDescription" aria={aria('seoDescription')} max={160} rows={2} />
      </Section>

      {p.isAdmin && (p.live || f.updatedAt) && (
        <DangerZone
          form={f}
          live={p.live}
          title={data.title || 'Untitled post'}
          deleteNote="Removes the post from the site and the admin. Uploaded images stay in storage."
          setVisible={(v) => setPostVisibility(p.rowId, v)}
          remove={() => deletePost(p.rowId)}
        />
      )}

      <ActionBar
        form={f}
        isAdmin={p.isAdmin}
        previewLink={() => postPreviewLink(p.rowId, data.slug)}
        submit={() => submitPost(p.rowId)}
        publish={(v) => publishPostDraft(p.rowId, v)}
        discard={() => discardPostDraft(p.rowId)}
      />
    </form>
  );
}
