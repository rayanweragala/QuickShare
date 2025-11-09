import { Zap, Shield, Wifi, Star } from 'lucide-react';
import { Button } from './Button';
import { useOnboarding } from '../../contexts/OnboardingContext';

export const WelcomeModal = () => {
  const { isOnboardingComplete, startOnboarding, completeOnboarding } = useOnboarding();

  if (isOnboardingComplete) return null;

  const features = [
    {
      icon: Zap,
      title: 'Blazing Fast',
      description: 'Direct P2P transfers with no server delays',
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'End-to-end encrypted file transfers',
    },
    {
      icon: Wifi,
      title: 'No Limits',
      description: 'Share files of any size, anytime',
    },
    {
      icon: Star,
      title: 'Simple to Use',
      description: 'Just share a code and start transferring',
    },
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Decorative gradients */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />

        <div className="relative p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 shadow-lg shadow-green-500/50 mb-4">
              <Zap className="w-8 h-8 text-black" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Welcome to QuickShare!
            </h1>
            <p className="text-zinc-400 max-w-md mx-auto">
              The fastest way to share files securely using peer-to-peer technology
            </p>
          </div>

          {/* Features */}
          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="flex items-start gap-3 p-4 bg-zinc-800/50 rounded-xl border border-zinc-700/50"
              >
                <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                  <feature.icon className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-zinc-400">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="primary"
              size="lg"
              onClick={startOnboarding}
              icon={<Star className="w-5 h-5" />}
              className="w-full sm:w-auto"
            >
              Take the Tour
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={completeOnboarding}
              className="w-full sm:w-auto"
            >
              Skip for now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
