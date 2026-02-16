import { ProfileSkeleton } from '@/components/blocks/skeletons';

const AuthLoading = (): React.JSX.Element => (
  <main className="mx-auto max-w-xl px-4 py-12 sm:px-6">
    <ProfileSkeleton />
  </main>
);

export default AuthLoading;
