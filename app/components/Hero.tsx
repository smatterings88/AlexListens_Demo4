import React from 'react';
import Image from 'next/image';

const Hero = () => {
  return (
    <section className="relative h-[600px] w-full mt-16">
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=2000&q=80"
          alt="Team collaboration in modern office"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#004AAA]/60 to-[#004AAA]/50" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 h-full flex items-center justify-center text-center">
        <div className="max-w-4xl">
          <h1 className="text-6xl font-bold mb-8 text-white">
            AlexListens:
          </h1>
          <p className="text-2xl text-white mb-12 leading-relaxed mx-auto">
            Sometimes you just need someone who gets you. Someone who's there whenever you need them. 
            Someone who lets you be yourself without criticism. That's Alex.
          </p>
          <div className="flex gap-6 justify-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-white">
              <div className="text-4xl font-bold mb-2">100%</div>
              <div className="text-white">Privacy Protected</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-white">
              <div className="text-4xl font-bold mb-2">24/7</div>
              <div className="text-white">Availability</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-white">
              <div className="text-4xl font-bold mb-2">AI</div>
              <div className="text-white">Powered</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;