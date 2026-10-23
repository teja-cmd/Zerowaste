import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Eye, EyeOff, Globe, Heart, Loader2, Mail, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const LoginPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setNeedsConfirmation(false);

    try {
      await signIn(formData.email, formData.password);
      toast({ title: "Welcome back", description: "You're signed in and ready to share." });
      navigate("/profile");
    } catch (error) {
      const authError = error as Error & { code?: string };
      if (authError.code === "email_not_confirmed") {
        setNeedsConfirmation(true);
        toast({
          title: "Email not confirmed",
          description: "Check your inbox and confirm your email before signing in.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Login failed",
          description: authError.message || "Please check your credentials and try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    setResendLoading(true);
    try {
      const { error } = await supabase.auth.resend({ type: "signup", email: formData.email });
      if (error) throw error;
      toast({ title: "Confirmation email sent", description: "Please check your inbox for the confirmation link." });
    } catch (error) {
      toast({
        title: "Failed to send confirmation email",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-eco-green-50/70 p-4 sm:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-3xl bg-white shadow-xl lg:grid-cols-2">
        <section className="relative hidden min-h-[720px] overflow-hidden lg:block">
          <img
            src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1400&q=85"
            alt="Community members sharing food together"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-eco-green-900/90 via-eco-green-900/30 to-eco-green-900/10" />
          <Link to="/" className="absolute left-8 top-8 flex items-center gap-2 text-xl font-bold text-white">
            <Globe className="h-7 w-7" /> ZeroWaste
          </Link>
          <div className="absolute bottom-10 left-10 right-10 text-white">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
              <Heart className="h-6 w-6" />
            </div>
            <h1 className="max-w-md text-4xl font-bold leading-tight">Good to see you again.</h1>
            <p className="mt-4 max-w-md text-lg leading-relaxed text-white/80">
              Your next food share can make a real difference in your community.
            </p>
          </div>
        </section>

        <section className="flex items-center justify-center px-5 py-10 sm:px-10 lg:px-14">
          <div className="w-full max-w-md">
            <Link to="/" className="mb-10 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-eco-green-700 lg:hidden">
              <ArrowLeft className="h-4 w-4" /> Back to ZeroWaste
            </Link>
            <Link to="/" className="mb-8 hidden items-center gap-2 text-sm font-semibold text-eco-green-800 lg:inline-flex">
              <Globe className="h-5 w-5" /> ZeroWaste
            </Link>
            <div className="mb-8">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-eco-green-100 text-eco-green-700">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-gray-900">Welcome back</h2>
              <p className="mt-2 text-gray-600">Sign in to manage your food shares and find nearby listings.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="h-12 rounded-xl bg-gray-50"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <span className="text-xs text-gray-500">Your account password</span>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="h-12 rounded-xl bg-gray-50 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-gray-500 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-eco-green-600"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {needsConfirmation && (
                <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
                  <p className="text-sm font-semibold">Please confirm your email</p>
                  <p className="mt-1 text-xs leading-relaxed">Check your inbox or request a new confirmation link below.</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3 w-full border-amber-300 bg-white"
                    onClick={handleResendConfirmation}
                    disabled={resendLoading || !formData.email}
                  >
                    {resendLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                    Resend confirmation email
                  </Button>
                </div>
              )}

              <Button type="submit" className="h-12 w-full rounded-xl text-base" disabled={isLoading}>
                {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in…</> : "Sign in"}
              </Button>
            </form>

            <p className="mt-7 text-center text-sm text-gray-600">
              New to ZeroWaste?{" "}
              <Link to="/register" className="font-semibold text-eco-green-700 hover:underline">Create an account</Link>
            </p>
            <div className="mt-8 flex items-center justify-center gap-2 text-xs text-gray-400">
              <Heart className="h-3.5 w-3.5 text-eco-green-600" /> Helping good food find its way
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default LoginPage;
