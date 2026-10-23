
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import DonationForm from "@/components/donations/DonationForm";
import { ArrowRight, HeartHandshake, Leaf, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

const DonatePage = () => {
  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-eco-green-50 to-white">
        <section className="container mx-auto px-4 py-10 md:px-6 md:py-14">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-eco-green-700">
                <HeartHandshake className="h-4 w-4" /> Share what you can
              </p>
              <h1 className="text-3xl font-bold text-eco-green-900 md:text-4xl">Give good food a second chance</h1>
              <p className="mt-2 max-w-2xl text-gray-600">
                Create a clear listing and help someone nearby collect food while it is fresh.
              </p>
            </div>
            <Button variant="outline" className="self-start border-eco-green-200 bg-white sm:self-auto" asChild>
              <Link to="/donations">View your listings <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>

          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.9fr)]">
            <div className="space-y-5">
              <div className="group relative min-h-[250px] overflow-hidden rounded-3xl shadow-lg sm:min-h-[320px]">
                <img
                  src="https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1400&q=85"
                  alt="Freshly baked bread ready to share with the community"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-eco-green-900/90 via-eco-green-900/25 to-transparent" />
                <div className="absolute bottom-0 p-6 text-white sm:p-8">
                  <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-eco-green-100">Small act. Shared impact.</p>
                  <h2 className="max-w-lg text-2xl font-bold sm:text-3xl">Someone nearby could use what you don't need.</h2>
                  <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/80">
                    Add an accurate quantity, pickup window, and clear photo so recipients know exactly what is available.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-eco-green-100 bg-white p-4">
                  <Leaf className="mb-3 h-5 w-5 text-eco-green-600" />
                  <p className="text-sm font-semibold text-gray-900">Share safely</p>
                  <p className="mt-1 text-xs leading-relaxed text-gray-500">List food that's fresh and safe to collect.</p>
                </div>
                <div className="rounded-2xl border border-eco-green-100 bg-white p-4">
                  <ShieldCheck className="mb-3 h-5 w-5 text-eco-green-600" />
                  <p className="text-sm font-semibold text-gray-900">Give details</p>
                  <p className="mt-1 text-xs leading-relaxed text-gray-500">Add quantity, type, and pickup timing.</p>
                </div>
                <div className="rounded-2xl border border-eco-green-100 bg-white p-4">
                  <HeartHandshake className="mb-3 h-5 w-5 text-eco-green-600" />
                  <p className="text-sm font-semibold text-gray-900">Help locally</p>
                  <p className="mt-1 text-xs leading-relaxed text-gray-500">Make your offer visible on the community map.</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-eco-green-100 bg-white p-1 shadow-sm">
              <DonationForm />
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default DonatePage;
