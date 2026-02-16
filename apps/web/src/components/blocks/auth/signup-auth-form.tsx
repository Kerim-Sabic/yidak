'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useActionState, useEffect, useMemo, useState } from 'react';



import { type CountryCode, type SkillKey, type SignupRole } from '@/components/blocks/auth/constants';
import { snappySpring } from '@/components/blocks/auth/motion';
import { SignupPhoneStep } from '@/components/blocks/auth/signup-phone-step';
import { SignupProfileStep } from '@/components/blocks/auth/signup-profile-step';
import { SignupProgress } from '@/components/blocks/auth/signup-progress';
import { SignupRoleStep } from '@/components/blocks/auth/signup-role-step';
import {
  completeProfileAction,
  profileStateInitial,
  requestStateInitial,
  sendOtpAction,
  verifyOtpAction,
  verifyStateInitial,
  type Locale
} from '@/lib/auth/actions';

interface SignupAuthFormProps {
  locale: Locale;
}

export const SignupAuthForm = ({ locale }: SignupAuthFormProps): React.JSX.Element => {
  const t = useTranslations('auth.signup');
  const router = useRouter();
  const reduceMotion = useReducedMotion();

  const [step, setStep] = useState(1);
  const [role, setRole] = useState<SignupRole>('customer');
  const [country, setCountry] = useState<CountryCode>('AE');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');

  const [fullName, setFullName] = useState('');
  const [city, setCity] = useState('Dubai');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [skills, setSkills] = useState<ReadonlyArray<SkillKey>>([]);
  const [bio, setBio] = useState('');
  const [hourlyMin, setHourlyMin] = useState('50');
  const [hourlyMax, setHourlyMax] = useState('120');

  const [requestState, requestAction] = useActionState(sendOtpAction, requestStateInitial);
  const [verifyState, verifyAction, verifyPending] = useActionState(verifyOtpAction, verifyStateInitial);
  const [profileState, profileAction] = useActionState(completeProfileAction, profileStateInitial);

  useEffect(() => {
    if (verifyState.status === 'success') {
      setStep(3);
    }
  }, [verifyState.status]);

  useEffect(() => {
    if (profileState.status === 'success' && profileState.redirectPath) {
      router.replace(profileState.redirectPath);
    }
  }, [profileState.redirectPath, profileState.status, router]);

  const cityOptions = useMemo(
    () => [
      { key: 'dubai', label: t('cities.dubai') },
      { key: 'abuDhabi', label: t('cities.abuDhabi') },
      { key: 'sharjah', label: t('cities.sharjah') },
      { key: 'riyadh', label: t('cities.riyadh') },
      { key: 'jeddah', label: t('cities.jeddah') },
      { key: 'doha', label: t('cities.doha') },
      { key: 'manama', label: t('cities.manama') },
      { key: 'kuwaitCity', label: t('cities.kuwaitCity') },
      { key: 'muscat', label: t('cities.muscat') },
      { key: 'dammam', label: t('cities.dammam') },
      { key: 'alAin', label: t('cities.alAin') },
      { key: 'salalah', label: t('cities.salalah') }
    ],
    [t]
  );

  const skillLabels: Readonly<Record<SkillKey, string>> = {
    plumbing: t('skills.plumbing'),
    electrical: t('skills.electrical'),
    acHvac: t('skills.acHvac'),
    painting: t('skills.painting'),
    carpentry: t('skills.carpentry'),
    cleaning: t('skills.cleaning'),
    applianceRepair: t('skills.applianceRepair'),
    smartHome: t('skills.smartHome')
  };

  const progressLabels = [t('steps.role'), t('steps.verify'), t('steps.profile')];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-foreground">{t('title')}</h2>
        <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>

      <SignupProgress currentStep={step} labels={progressLabels} />

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={`signup-step-${step}`}
          initial={reduceMotion ? { opacity: 1 } : { opacity: 0, x: step === 1 ? -18 : 18 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduceMotion ? { opacity: 1 } : { opacity: 0, x: -18 }}
          transition={snappySpring}
        >
          {step === 1 ? (
            <SignupRoleStep
              role={role}
              title={t('role.title')}
              customerTitle={t('role.customer.title')}
              customerDescription={t('role.customer.description')}
              workerTitle={t('role.worker.title')}
              workerDescription={t('role.worker.description')}
              nextLabel={t('role.next')}
              onRoleChange={setRole}
              onNext={() => {
                setStep(2);
              }}
            />
          ) : <></>}

          {step === 2 ? (
            <SignupPhoneStep
              locale={locale}
              role={role}
              country={country}
              phone={phone}
              otp={otp}
              requestState={requestState}
              verifyState={verifyState}
              verifyPending={verifyPending}
              title={t('phone.title')}
              subtitle={t('phone.subtitle')}
              countryLabel={t('phone.countryLabel')}
              phoneLabel={t('phone.phoneLabel')}
              phonePlaceholder={t('phone.phonePlaceholder')}
              otpLabel={t('phone.otpLabel')}
              sendOtpLabel={t('phone.sendOtp')}
              sendingOtpLabel={t('phone.sendingOtp')}
              verifyOtpLabel={t('phone.verifyOtp')}
              verifyingOtpLabel={t('phone.verifyingOtp')}
              resendInLabel={t('phone.resendIn')}
              resendNowLabel={t('phone.resendNow')}
              errorLabel={t('phone.error')}
              onCountryChange={setCountry}
              onPhoneChange={setPhone}
              onOtpChange={setOtp}
              onRequestSubmit={requestAction}
              onVerifySubmit={verifyAction}
            />
          ) : <></>}

          {step === 3 ? (
            <SignupProfileStep
              locale={locale}
              role={role}
              country={country}
              fullName={fullName}
              city={city}
              avatarUrl={avatarUrl}
              bio={bio}
              hourlyMin={hourlyMin}
              hourlyMax={hourlyMax}
              skills={skills}
              cityOptions={cityOptions}
              labels={{
                title: t('profile.title'),
                fullName: t('profile.fullName'),
                city: t('profile.city'),
                photo: t('profile.photo'),
                photoHint: t('profile.photoHint'),
                bio: t('profile.bio'),
                skills: t('profile.skills'),
                hourlyMin: t('profile.hourlyMin'),
                hourlyMax: t('profile.hourlyMax'),
                complete: t('profile.complete'),
                completing: t('profile.completing'),
                camera: t('profile.camera'),
                gallery: t('profile.gallery')
              }}
              skillLabels={skillLabels}
              onFullNameChange={setFullName}
              onCityChange={setCity}
              onBioChange={setBio}
              onHourlyMinChange={setHourlyMin}
              onHourlyMaxChange={setHourlyMax}
              onSkillToggle={(skill) => {
                setSkills((current) => {
                  if (current.includes(skill)) {
                    return current.filter((entry) => entry !== skill);
                  }

                  return [...current, skill];
                });
              }}
              onAvatarChange={setAvatarUrl}
              onSubmit={profileAction}
            />
          ) : <></>}
        </motion.div>
      </AnimatePresence>

      {profileState.status === 'error' ? (
        <p className="text-xs text-destructive">{t(profileState.messageKey ?? 'profile.error')}</p>
      ) : <></>}
    </div>
  );
};
