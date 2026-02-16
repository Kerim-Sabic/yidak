'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { AirVent, Brush, Droplets, Lightbulb, Paintbrush, Sparkles, Wrench } from 'lucide-react';
import { useRef } from 'react';


import type { Locale } from '@/lib/auth/actions';

import { AuthSubmitButton } from '@/components/blocks/auth/auth-submit-button';
import { SKILL_KEYS, type CountryCode, type SkillKey, type SignupRole } from '@/components/blocks/auth/constants';
import { gentleSpring } from '@/components/blocks/auth/motion';

interface SignupProfileStepProps {
  locale: Locale;
  role: SignupRole;
  country: CountryCode;
  fullName: string;
  city: string;
  avatarUrl: string;
  bio: string;
  hourlyMin: string;
  hourlyMax: string;
  skills: ReadonlyArray<SkillKey>;
  cityOptions: ReadonlyArray<{ key: string; label: string }>;
  labels: {
    title: string;
    fullName: string;
    city: string;
    photo: string;
    photoHint: string;
    bio: string;
    skills: string;
    hourlyMin: string;
    hourlyMax: string;
    complete: string;
    completing: string;
    camera: string;
    gallery: string;
  };
  skillLabels: Readonly<Record<SkillKey, string>>;
  onFullNameChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onBioChange: (value: string) => void;
  onHourlyMinChange: (value: string) => void;
  onHourlyMaxChange: (value: string) => void;
  onSkillToggle: (value: SkillKey) => void;
  onAvatarChange: (value: string) => void;
  onSubmit: (formData: FormData) => void;
}

const skillIcons: Readonly<Record<SkillKey, React.ComponentType<{ className?: string }>>> = {
  plumbing: Droplets,
  electrical: Lightbulb,
  acHvac: AirVent,
  painting: Paintbrush,
  carpentry: Wrench,
  cleaning: Sparkles,
  applianceRepair: Brush,
  smartHome: Lightbulb
};

export const SignupProfileStep = ({
  locale,
  role,
  country,
  fullName,
  city,
  avatarUrl,
  bio,
  hourlyMin,
  hourlyMax,
  skills,
  cityOptions,
  labels,
  skillLabels,
  onFullNameChange,
  onCityChange,
  onBioChange,
  onHourlyMinChange,
  onHourlyMaxChange,
  onSkillToggle,
  onAvatarChange,
  onSubmit
}: SignupProfileStepProps): React.JSX.Element => {
  const reduceMotion = useReducedMotion();
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  const readAvatar = (files: FileList | null): void => {
    const file = files?.item(0);
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onAvatarChange(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <form action={onSubmit} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="role" value={role} />
      <input type="hidden" name="country" value={country} />
      <input type="hidden" name="avatarUrl" value={avatarUrl} />
      {skills.map((skill) => (
        <input key={skill} type="hidden" name="skills" value={skill} />
      ))}

      <h3 className="text-lg font-semibold text-foreground">{labels.title}</h3>

      <label className="space-y-2">
        <span className="text-sm font-medium text-foreground">{labels.fullName}</span>
        <input
          name="fullName"
          value={fullName}
          onChange={(event) => {
            onFullNameChange(event.target.value);
          }}
          className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
        />
      </label>

      <label className="space-y-2">
        <span className="text-sm font-medium text-foreground">{labels.city}</span>
        <select
          name="city"
          value={city}
          onChange={(event) => {
            onCityChange(event.target.value);
          }}
          className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
        >
          {cityOptions.map((option) => (
            <option key={option.key} value={option.label}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <div className="space-y-2">
        <span className="text-sm font-medium text-foreground">{labels.photo}</span>
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 overflow-hidden rounded-full border border-border bg-muted">
            {avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" /> : <></>}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="rounded-lg border border-border px-3 py-2"
            >
              {labels.camera}
            </button>
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              className="rounded-lg border border-border px-3 py-2"
            >
              {labels.gallery}
            </button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{labels.photoHint}</p>
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(event) => {
            readAvatar(event.target.files);
          }}
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            readAvatar(event.target.files);
          }}
        />
      </div>

      {role === 'worker' ? (
        <motion.div
          initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={gentleSpring}
          className="space-y-4 rounded-xl border border-border bg-background/70 p-4"
        >
          <label className="space-y-2">
            <span className="text-sm font-medium text-foreground">{labels.skills}</span>
            <div className="flex flex-wrap gap-2">
              {SKILL_KEYS.map((skill) => {
                const Icon = skillIcons[skill];
                const selected = skills.includes(skill);

                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => {
                      onSkillToggle(skill);
                    }}
                    className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs ${selected ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'}`}
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                    {skillLabels[skill]}
                  </button>
                );
              })}
            </div>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-foreground">{labels.bio}</span>
            <textarea
              name="bio"
              value={bio}
              onChange={(event) => {
                onBioChange(event.target.value);
              }}
              rows={3}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-foreground">{labels.hourlyMin}</span>
              <input
                name="hourlyMin"
                type="number"
                min={0}
                value={hourlyMin}
                onChange={(event) => {
                  onHourlyMinChange(event.target.value);
                }}
                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-foreground">{labels.hourlyMax}</span>
              <input
                name="hourlyMax"
                type="number"
                min={0}
                value={hourlyMax}
                onChange={(event) => {
                  onHourlyMaxChange(event.target.value);
                }}
                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
              />
            </label>
          </div>
        </motion.div>
      ) : (
        <>
          <input type="hidden" name="bio" value="" />
          <input type="hidden" name="hourlyMin" value="0" />
          <input type="hidden" name="hourlyMax" value="0" />
        </>
      )}

      <AuthSubmitButton idleLabel={labels.complete} pendingLabel={labels.completing} />
    </form>
  );
};
