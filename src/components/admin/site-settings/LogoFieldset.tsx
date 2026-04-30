'use client';

import { useState } from 'react';
import ImageUploader from '../ImageUploader';
import { FONT_OPTIONS, LOGO_DEFAULTS, LETTER_SPACING_PATTERN, type FontKey } from '@/app/fonts';

type Props = {
  defaultMode: 'image' | 'text';
  defaultText: string;
  defaultFontFamily: FontKey;
  defaultFontSize: number;
  defaultFontWeight: number;
  defaultLetterSpacing: string;
  defaultWordmarkFileId: string;
};

const WEIGHT_OPTIONS = [100, 300, 400, 500, 600, 700, 800, 900];
const LS_REGEX = new RegExp(LETTER_SPACING_PATTERN);

const inputClass =
  'w-full bg-transparent border-b border-ink-600 focus:border-paper-50 outline-none text-lead text-paper-50 py-2 transition-colors';
const labelClass = 'font-mono text-mono-sm text-paper-400 block mb-2';

/**
 * Logo editor: a mode toggle that swaps between an image uploader and a
 * typography-controls fieldset. Renders a live preview that mirrors the
 * public <Wordmark> component using the editor's current values.
 *
 * State is owned here so toggling between modes does not lose work — the
 * inactive mode's hidden inputs still submit their values.
 */
export default function LogoFieldset(props: Props) {
  const [mode, setMode] = useState<'image' | 'text'>(props.defaultMode);
  const [text, setText] = useState(props.defaultText || LOGO_DEFAULTS.text);
  const [fontFamily, setFontFamily] = useState<FontKey>(props.defaultFontFamily);
  const [fontSize, setFontSize] = useState(props.defaultFontSize || LOGO_DEFAULTS.fontSize);
  const [fontWeight, setFontWeight] = useState(props.defaultFontWeight || LOGO_DEFAULTS.fontWeight);
  const [letterSpacing, setLetterSpacing] = useState(
    props.defaultLetterSpacing || LOGO_DEFAULTS.letterSpacing,
  );
  const lsValid = LS_REGEX.test(letterSpacing);

  const fontOption = FONT_OPTIONS[fontFamily] ?? FONT_OPTIONS[LOGO_DEFAULTS.fontFamily];

  return (
    <fieldset className="space-y-6 border border-ink-700 rounded-lg p-6">
      <legend className="px-2 font-mono text-mono-sm text-paper-400">Logo</legend>

      {/* Mode toggle */}
      <div role="radiogroup" aria-label="Logo mode" className="flex gap-2">
        {(['image', 'text'] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={mode === m}
            onClick={() => setMode(m)}
            className={`px-4 py-2 text-sm rounded-full transition-colors ${
              mode === m
                ? 'bg-paper-50 text-ink-900'
                : 'bg-transparent text-paper-300 border border-ink-600 hover:text-paper-50'
            }`}
          >
            {m === 'image' ? 'Upload image' : 'Set as text'}
          </button>
        ))}
      </div>
      <input type="hidden" name="logoMode" value={mode} />

      {/* Live preview */}
      <div className="rounded-lg border border-ink-700 bg-ink-900 p-6 flex items-center min-h-[80px]">
        {mode === 'image' ? (
          <span className="font-mono text-mono-sm text-paper-400">
            {props.defaultWordmarkFileId
              ? 'Image preview rendered above the uploader'
              : 'No image uploaded yet — upload below.'}
          </span>
        ) : (
          <span
            className={`${fontOption.className} text-paper-50`}
            style={{
              fontSize: `${fontSize}px`,
              fontWeight,
              letterSpacing: lsValid ? letterSpacing : LOGO_DEFAULTS.letterSpacing,
            }}
          >
            {text || LOGO_DEFAULTS.text}
          </span>
        )}
      </div>

      {/* Image-mode fields */}
      <div className={mode === 'image' ? 'space-y-2' : 'hidden'}>
        <label className={labelClass}>Wordmark image</label>
        <ImageUploader name="wordmarkFileId" defaultValue={props.defaultWordmarkFileId} />
      </div>

      {/* Text-mode fields */}
      <div className={mode === 'text' ? 'space-y-4' : 'hidden'}>
        <div>
          <label htmlFor="logoText" className={labelClass}>Logo text</label>
          <input
            id="logoText"
            name="logoText"
            type="text"
            maxLength={64}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="logoFontFamily" className={labelClass}>Font family</label>
          <select
            id="logoFontFamily"
            name="logoFontFamily"
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value as FontKey)}
            className={`${inputClass} appearance-none cursor-pointer pr-8`}
          >
            {Object.values(FONT_OPTIONS).map((o) => (
              <option key={o.key} value={o.key} className="bg-ink-800">
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label htmlFor="logoFontSize" className={labelClass}>Size (px)</label>
            <input
              id="logoFontSize"
              name="logoFontSize"
              type="number"
              min={12}
              max={48}
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value) || LOGO_DEFAULTS.fontSize)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="logoFontWeight" className={labelClass}>Weight</label>
            <select
              id="logoFontWeight"
              name="logoFontWeight"
              value={fontWeight}
              onChange={(e) => setFontWeight(Number(e.target.value))}
              className={`${inputClass} appearance-none cursor-pointer pr-8`}
            >
              {WEIGHT_OPTIONS.map((w) => (
                <option key={w} value={w} className="bg-ink-800">
                  {w}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="logoLetterSpacing" className={labelClass}>Letter spacing</label>
          <input
            id="logoLetterSpacing"
            name="logoLetterSpacing"
            type="text"
            maxLength={16}
            value={letterSpacing}
            onChange={(e) => setLetterSpacing(e.target.value)}
            className={inputClass}
            aria-invalid={!lsValid}
          />
          <p
            className={`font-mono text-mono-sm mt-2 ${
              lsValid ? 'text-paper-400' : 'text-red-400'
            }`}
          >
            {lsValid
              ? 'CSS length, e.g. -0.01em, 0.5px, 1rem, or "normal".'
              : 'Must be a CSS length (em/px/rem) or "normal".'}
          </p>
        </div>
      </div>
    </fieldset>
  );
}
