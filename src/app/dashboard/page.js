"use client";

import { useSelector } from "react-redux";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// Dynamically import ApexCharts to avoid SSR issues
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function DashboardPage() {
  const { user } = useSelector((state) => state.auth);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Common chart options to remove backgrounds and grids
  const commonOptions = {
    chart: {
      toolbar: { show: false },
      background: "transparent",
      fontFamily: "inherit",
    },
    grid: { show: false },
    dataLabels: { enabled: false },
    tooltip: { theme: "dark" },
  };

  const revenueOptions = {
    ...commonOptions,
    chart: { ...commonOptions.chart, type: "area", sparkline: { enabled: true } },
    colors: ["#22d3ee"],
    stroke: { curve: "smooth", width: 2 },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.4,
        opacityTo: 0.05,
        stops: [0, 100],
      },
    },
    xaxis: { crosshairs: { width: 1 } },
  };
  const revenueSeries = [
    { name: "Revenue", data: [15000, 8432, 12000, 4705, 10000, 18000] },
  ];

  const volumeOptions = {
    ...commonOptions,
    chart: { ...commonOptions.chart, type: "bar", sparkline: { enabled: true } },
    colors: ["#22c55e"],
    plotOptions: { bar: { borderRadius: 3, columnWidth: "40%" } },
    xaxis: {
      categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"],
      crosshairs: { width: 1 },
    },
  };
  const volumeSeries = [
    { name: "Volume", data: [4, 6, 5, 8, 3, 5, 7, 4, 6, 8] },
  ];

  const splitOptions = {
    ...commonOptions,
    chart: { ...commonOptions.chart, type: "donut" },
    colors: ["#0ea5e9", "#f59e0b", "#8b5cf6"],
    labels: ["Platform Revenue", "VAT/Tax", "Service Charge"],
    plotOptions: {
      pie: {
        donut: {
          size: "75%",
          labels: {
            show: true,
            name: { show: false },
            value: {
              show: true,
              fontSize: "16px",
              fontWeight: "bold",
              color: "var(--foreground)", // Adjusts dynamically via CSS var
            },
            total: {
              show: true,
              showAlways: false,
              label: "Total",
              fontSize: "10px",
              color: "var(--text-muted)",
              formatter: function (w) {
                return w.globals.seriesTotals.reduce((a, b) => a + b, 0) + "%";
              },
            },
          },
        },
      },
    },
    stroke: { show: false },
    legend: { show: false },
  };
  const splitSeries = [58.4, 36.3, 15.3];

  return (
    <div className="h-full flex flex-col font-sans">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-black text-foreground uppercase tracking-wide">
            OVERVIEW
          </h1>
          <p className="text-text-muted mt-1 text-[11px] font-bold uppercase tracking-wider">
            WELCOME BACK, {user?.displayName ? user.displayName.toUpperCase() : "FOYSAL"}
          </p>
        </div>
      </div>
      
      {/* Top Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
        {/* Revenue Trend */}
        <div className="p-6 rounded-2xl bg-card-bg border border-card-border shadow-sm flex flex-col">
          <h3 className="font-bold text-sm text-foreground mb-1 uppercase tracking-wide">REVENUE TREND</h3>
          <p className="text-text-muted text-[10px] uppercase font-semibold mb-2">FINANCIAL PERFORMANCE</p>
          <div className="h-32 w-full mt-auto">
            {isMounted && (
              <Chart options={revenueOptions} series={revenueSeries} type="area" height="100%" width="100%" />
            )}
          </div>
        </div>

        {/* Monthly Volume */}
        <div className="p-6 rounded-2xl bg-card-bg border border-card-border shadow-sm flex flex-col">
          <h3 className="font-bold text-sm text-foreground mb-1 uppercase tracking-wide">MONTHLY VOLUME</h3>
          <p className="text-text-muted text-[10px] uppercase font-semibold mb-2">RESERVATION INTENSITY</p>
          <div className="h-32 w-full mt-auto">
            {isMounted && (
              <Chart options={volumeOptions} series={volumeSeries} type="bar" height="100%" width="100%" />
            )}
          </div>
          <div className="flex justify-between text-[8px] text-text-muted font-bold mt-2 px-1">
             <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span>
          </div>
        </div>

        {/* Financial Split */}
        <div className="p-6 rounded-2xl bg-card-bg border border-card-border shadow-sm">
          <h3 className="font-bold text-sm text-foreground mb-1 uppercase tracking-wide">FINANCIAL SPLIT</h3>
          <p className="text-text-muted text-[10px] uppercase font-semibold mb-2">PLATFORM YIELD & FREE</p>
          <div className="h-32 w-full relative flex items-center justify-center">
            {isMounted && (
              <Chart options={splitOptions} series={splitSeries} type="donut" height="100%" width="100%" />
            )}
          </div>
          <div className="flex items-center justify-center gap-3 mt-4 text-[9px] text-text-muted font-semibold">
             <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#0ea5e9]"></span> Platform (10%)</div>
             <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#8b5cf6]"></span> Service</div>
             <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#f59e0b]"></span> VAT/Tax</div>
          </div>
        </div>
      </div>

      {/* Bottom Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="p-6 rounded-2xl bg-card-bg border border-card-border shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-background border border-card-border flex items-center justify-center mb-4 text-[#8b5cf6]">
             <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z"></path><path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z"></path></svg>
          </div>
          <p className="text-text-muted text-[10px] font-bold uppercase tracking-wider mb-1">TOTAL ORDERS</p>
          <p className="text-2xl font-black text-foreground">7</p>
        </div>
        
        <div className="p-6 rounded-2xl bg-card-bg border border-card-border shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-background border border-card-border flex items-center justify-center mb-4 text-[#10b981]">
             <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd"></path></svg>
          </div>
          <p className="text-text-muted text-[10px] font-bold uppercase tracking-wider mb-1">TOTAL SALES REVENUE</p>
          <p className="text-2xl font-black text-foreground">$25,195</p>
        </div>
        
        <div className="p-6 rounded-2xl bg-card-bg border border-card-border shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-background border border-card-border flex items-center justify-center mb-4 text-[#3b82f6]">
             <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd"></path></svg>
          </div>
          <p className="text-text-muted text-[10px] font-bold uppercase tracking-wider mb-1">AVAILABLE PACKAGES</p>
          <p className="text-2xl font-black text-foreground">30</p>
        </div>
        
        <div className="p-6 rounded-2xl bg-card-bg border border-card-border shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-background border border-card-border flex items-center justify-center mb-4 text-[#f59e0b]">
             <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"></path></svg>
          </div>
          <p className="text-text-muted text-[10px] font-bold uppercase tracking-wider mb-1">PENDING ORDERS</p>
          <p className="text-2xl font-black text-foreground">5</p>
        </div>
      </div>
      
    </div>
  );
}
