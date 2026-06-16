"use client";

import React from "react";
// We use lucide-react icons as stand-ins for company logos for the monochromatic ribbon
import { 
  Cloud, 
  Database, 
  Cpu, 
  Globe, 
  Shield, 
  Server, 
  Network, 
  MonitorSmartphone,
  Box,
  Layers
} from "lucide-react";

export function CompanyMarquee() {
  const companies = [
    { name: "Google", icon: <Globe className="w-8 h-8" /> },
    { name: "Meta", icon: <Network className="w-8 h-8" /> },
    { name: "Netflix", icon: <MonitorSmartphone className="w-8 h-8" /> },
    { name: "Amazon", icon: <Box className="w-8 h-8" /> },
    { name: "Microsoft", icon: <Layers className="w-8 h-8" /> },
    { name: "Apple", icon: <Cpu className="w-8 h-8" /> },
    { name: "Stripe", icon: <Database className="w-8 h-8" /> },
    { name: "Vercel", icon: <Server className="w-8 h-8" /> },
    { name: "Coinbase", icon: <Shield className="w-8 h-8" /> },
    { name: "Binance", icon: <Cloud className="w-8 h-8" /> },
  ];

  // Duplicate array to ensure seamless infinite scroll
  const duplicatedCompanies = [...companies, ...companies];

  return (
    <div className="relative flex overflow-x-hidden w-full py-8 border-y border-white/5 bg-black/20">
      <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg)] via-transparent to-[var(--bg)] z-10 pointer-events-none" />
      
      <div className="flex w-max animate-marquee space-x-16 px-8 items-center">
        {duplicatedCompanies.map((company, index) => (
          <div 
            key={index} 
            className="flex items-center space-x-3 text-white/40 hover:text-[var(--accent)] hover:scale-105 transition-all duration-300 opacity-60 hover:opacity-100 cursor-pointer"
          >
            {company.icon}
            <span className="text-xl font-bold tracking-wider font-sans uppercase">
              {company.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
