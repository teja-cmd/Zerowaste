import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Eye, EyeOff, Globe, Heart, Loader2, MapPin, Sprout, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const RegisterPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "donor" as "donor" | "receiver",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password.length < 6) {
      toast({ title: "Choose a longer password", description: "Your password must contain at least 6 characters.", variant: "destructive" });
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast({ title: "Passwords don't match", description: "Please make sure both password fields match.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      await signUp(formData.email, formData.password, { name: formData.name.trim(), role: formData.role });
      toast({
        title: "You're part of the movement!",
        description: "Your account is ready. Check your email to confirm your address.",
      });
      navigate("/login");
    } catch (error) {
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "An error occurred during registration.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-eco-green-50/70 p-4 sm:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-3xl bg-white shadow-xl lg:grid-cols-2">
        <section className="relative hidden min-h-[780px] overflow-hidden lg:block">
          <img
            src="https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1400&q=85"
            alt="Fresh food prepared to be shared"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-eco-green-900/90 via-eco-green-900/25 to-eco-green-900/10" />
          <Link to="/" className="absolute left-8 top-8 flex items-center gap-2 text-xl font-bold text-white">
            <Globe className="h-7 w-7" /> ZeroWaste
          </Link>
          <div className="absolute bottom-10 left-10 right-10 text-white">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
              <Sprout className="h-6 w-6" />
            </div>
            <h1 className="max-w-md text-4xl font-bold leading-tight">Join a community that shares more.</h1>
            <p className="mt-4 max-w-md text-lg leading-relaxed text-white/80">
              Connect surplus food with the people and organizations who can use it.
            </p>
          </div>
        </section>

        <section className="flex items-center justify-center px-5 py-8 sm:px-10 lg:px-14">
          <div className="w-full max-w-md">
            <Link to="/" className="mb-7 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-eco-green-700 lg:hidden">
              <ArrowLeft className="h-4 w-4" /> Back to ZeroWaste
            </Link>
            <Link to="/" className="mb-6 hidden items-center gap-2 text-sm font-semibold text-eco-green-800 lg:inline-flex">
              <Globe className="h-5 w-5" /> ZeroWaste
            </Link>
            <div className="mb-6">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900">Create your account</h2>
              <p className="mt-2 text-gray-600">Choose how you'd like to make a difference.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Your name</Label>
                <Input
                  id="name"
                  name="name"
                  autoComplete="name"
                  placeholder="e.g. Teja Kumar"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="h-11 rounded-xl bg-gray-50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="h-11 rounded-xl bg-gray-50"
                />
              </div>

              <div className="space-y-2">
                <Label>How would you like to help?</Label>
                <RadioGroup
                  value={formData.role}
                  onValueChange={(role: "donor" | "receiver") => setFormData((previous) => ({ ...previous, role }))}
                  className="grid grid-cols-1 gap-3 sm:grid-cols-2"
                >
                  <label
                    htmlFor="role-donor"
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-all ${formData.role === "donor" ? "border-eco-green-500 bg-eco-green-50 ring-1 ring-eco-green-500" : "border-gray-200 hover:border-eco-green-200"}`}
                  >
                    <RadioGroupItem value="donor" id="role-donor" className="mt-1" />
                    <span>
                      <span className="flex items-center gap-1.5 text-sm font-semibold text-gray-900"><Heart className="h-4 w-4 text-eco-green-700" /> Share food</span>
                      <span className="mt-1 block text-xs leading-relaxed text-gray-500">Post surplus food for others.</span>
                    </span>
                  </label>
                  <label
                    htmlFor="role-receiver"
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-all ${formData.role === "receiver" ? "border-eco-green-500 bg-eco-green-50 ring-1 ring-eco-green-500" : "border-gray-200 hover:border-eco-green-200"}`}
                  >
                    <RadioGroupItem value="receiver" id="role-receiver" className="mt-1" />
                    <span>
                      <span className="flex items-center gap-1.5 text-sm font-semibold text-gray-900"><Users className="h-4 w-4 text-eco-blue-600" /> Find food</span>
                      <span className="mt-1 block text-xs leading-relaxed text-gray-500">Discover nearby food offers.</span>
                    </span>
                  </label>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    minLength={6}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="h-11 rounded-xl bg-gray-50 pr-12"
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
                <p className="text-xs text-gray-500">Use at least 6 characters.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="h-11 rounded-xl bg-gray-50 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((visible) => !visible)}
                    className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-gray-500 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-eco-green-600"
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {formData.confirmPassword && (
                  <p className={`text-xs ${formData.password === formData.confirmPassword ? "text-eco-green-700" : "text-red-600"}`} aria-live="polite">
                    {formData.password === formData.confirmPassword ? "Passwords match" : "Passwords do not match yet"}
                  </p>
                )}
              </div>

              <Button type="submit" className="h-12 w-full rounded-xl text-base" disabled={isLoading}>
                {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating account…</> : <><MapPin className="h-4 w-4" /> Join ZeroWaste</>}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link to="/login" className="font-semibold text-eco-green-700 hover:underline">Sign in</Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
};

export default RegisterPage;
