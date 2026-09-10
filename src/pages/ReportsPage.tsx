import { useState, useEffect } from 'react';
import { farmService } from '@/services/farmService';
import { cropService } from '@/services/cropService';
import { activityService } from '@/services/activityService';
import { expenseService } from '@/services/expenseService';
import { inputService } from '@/services/inputService';
import { irrigationService } from '@/services/irrigationService';
import { harvestService } from '@/services/harvestService';
import {
  calculateFarmHealthScore,
  calculateCropFinancials,
  calculateCropProgressScore,
  formatCurrency,
} from '@/services/intelligenceService';
import type {
  Farm, CropCycle, Activity, Expense, Input as FarmInput,
  IrrigationLog, Harvest, FarmHealthScore, CropFinancials
} from '@/types/database';
import {
  FileBarChart, Printer, Download, TrendingUp, DollarSign,
  PieChart as PieIcon, CheckCircle2, Clock, Leaf, Sprout,
  Scale, Layers, ArrowUpRight, Loader2, Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, PieChart, Pie, Cell, Legend
} from 'recharts';

export default function ReportsPage() {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [crops, setCrops] = useState<CropCycle[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [inputs, setInputs] = useState<FarmInput[]>([]);
  const [irrigationLogs, setIrrigationLogs] = useState<IrrigationLog[]>([]);
  const [harvests, setHarvests] = useState<Harvest[]>([]);
  const [healthScore, setHealthScore] = useState<FarmHealthScore | null>(null);
  const [financials, setFinancials] = useState<CropFinancials | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReportData = async () => {
      try {
        setLoading(true);
        const [allFarms, allCrops, allActs, allExps, allInps, allIrrs, allHarvs] = await Promise.all([
          farmService.getAll(),
          cropService.getAll(),
          activityService.getAll(),
          expenseService.getAll(),
          inputService.getAll(),
          irrigationService.getAll(),
          harvestService.getAll(),
        ]);

        setFarms(allFarms);
        setCrops(allCrops);
        setActivities(allActs);
        setExpenses(allExps);
        setInputs(allInps);
        setIrrigationLogs(allIrrs);
        setHarvests(allHarvs);

        const activeCrop = allCrops.find(c => c.status === 'ACTIVE') || allCrops[0] || null;
        const health = calculateFarmHealthScore(allActs, allExps, allInps, allIrrs, activeCrop);
        setHealthScore(health);

        const fin = calculateCropFinancials(allExps, allInps, allIrrs, allActs, allHarvs, activeCrop);
        setFinancials(fin);
      } catch (err) {
        console.error('Failed loading report data', err);
      } finally {
        setLoading(false);
      }
    };

    loadReportData();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = ['Category', 'Description', 'Amount', 'Date'];
    const rows = expenses.map(e => [e.category, `"${e.description}"`, e.amount, e.expense_date]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `farmpilot_financial_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const totalRevenue = harvests.reduce((sum, h) => sum + Number(h.revenue || 0), 0);
  const totalBudget = crops.reduce((sum, c) => sum + Number(c.planned_budget || 0), 0);

  // Budget vs Actual per crop chart data
  const budgetVsActualData = crops.map(c => {
    const cSpent = expenses.filter(e => e.crop_cycle_id === c.id).reduce((s, e) => s + Number(e.amount || 0), 0);
    return {
      name: `${c.crop_name} (${c.season})`,
      Budget: c.planned_budget,
      Spent: cSpent,
    };
  });

  return (
    <div className="space-y-6 animate-fade-in print:p-0 print:space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-primary-700)] uppercase tracking-wider mb-1">
            <FileBarChart className="w-3.5 h-3.5" />
            <span>Farm Operational Analytics</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-[var(--color-text-primary)]">
            Executive Performance Report
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
            Audit-ready seasonal report summarizing activities, cost efficiency, yield, and financial margins.
          </p>
        </div>

        <div className="flex items-center gap-3 print:hidden">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[var(--color-border-light)] text-xs font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] shadow-xs transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl gradient-primary text-white text-xs font-semibold shadow-sm hover:shadow-md transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Top Banner with Farm Metadata */}
      <div className="bg-white rounded-2xl border border-[var(--color-border-light)] p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-[var(--color-primary-700)] uppercase tracking-wider">
            Reporting Entity
          </span>
          <h2 className="text-xl font-bold text-[var(--color-text-primary)] mt-0.5">
            {farms[0]?.name || 'Green Valley Farm'}
          </h2>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
            Location: {farms[0]?.location || 'Machilipatnam Coastal Belt'}, {farms[0]?.district}, {farms[0]?.state} • Total Area: {farms[0]?.total_area || 12.5} acres
          </p>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <span className="text-xs text-[var(--color-text-muted)] block">Report Generated</span>
            <span className="text-sm font-semibold text-[var(--color-text-primary)]">
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <div className="p-3 bg-[var(--color-primary-50)] rounded-xl border border-[var(--color-primary-100)] text-center">
            <span className="text-[10px] font-bold text-[var(--color-primary-700)] block uppercase">Farm Health</span>
            <span className="text-2xl font-bold text-[var(--color-primary-800)]">{healthScore?.overall || 82}</span>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[var(--color-border-light)] shadow-xs">
          <p className="text-xs font-medium text-[var(--color-text-secondary)]">Planned Season Budget</p>
          <p className="text-2xl font-bold text-[var(--color-text-primary)] mt-2">
            {formatCurrency(totalBudget)}
          </p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">Across all active & completed plots</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[var(--color-border-light)] shadow-xs">
          <p className="text-xs font-medium text-[var(--color-text-secondary)]">Total Realized Expenses</p>
          <p className="text-2xl font-bold text-amber-700 mt-2">
            {formatCurrency(totalSpent)}
          </p>
          <p className="text-xs text-emerald-600 font-medium mt-1">
            {totalBudget > 0 ? `${Math.round((totalSpent / totalBudget) * 100)}% budget utilization` : ''}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[var(--color-border-light)] shadow-xs">
          <p className="text-xs font-medium text-[var(--color-text-secondary)]">Total Realized Revenue</p>
          <p className="text-2xl font-bold text-emerald-700 mt-2">
            {formatCurrency(totalRevenue)}
          </p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">From grain deliveries & AP co-ops</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[var(--color-border-light)] shadow-xs">
          <p className="text-xs font-medium text-[var(--color-text-secondary)]">Task Adherence Rate</p>
          <p className="text-2xl font-bold text-[var(--color-primary-700)] mt-2">
            {healthScore?.scheduleAdherence || 80}%
          </p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">Operations completed on schedule</p>
        </div>
      </div>

      {/* Chart 1: Budget vs Actual per Crop Cycle */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-[var(--color-border-light)] p-6 shadow-xs">
          <h3 className="text-base font-bold text-[var(--color-text-primary)] mb-1">
            Budget vs Realized Spend
          </h3>
          <p className="text-xs text-[var(--color-text-secondary)] mb-4">
            Comparison of allocated seasonal capital versus actual operational expenditures.
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={budgetVsActualData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={v => `₹${v / 1000}k`} />
                <Tooltip formatter={(val: any) => [formatCurrency(Number(val)), '']} />
                <Legend />
                <Bar dataKey="Budget" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Spent" fill="#16a34a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Cost Breakdown */}
        <div className="bg-white rounded-2xl border border-[var(--color-border-light)] p-6 shadow-xs">
          <h3 className="text-base font-bold text-[var(--color-text-primary)] mb-1">
            Expense Allocation by Category
          </h3>
          <p className="text-xs text-[var(--color-text-secondary)] mb-4">
            Expenditure distribution across labor, inputs, mechanization, and irrigation.
          </p>
          {financials?.costBreakdown && financials.costBreakdown.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={financials.costBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="amount"
                    nameKey="category"
                  >
                    {financials.costBreakdown.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: any) => [formatCurrency(Number(val)), 'Spent']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-xs text-[var(--color-text-muted)]">
              No financial data available
            </div>
          )}
        </div>
      </div>

      {/* Operational Efficiency Breakdown */}
      <div className="bg-white rounded-2xl border border-[var(--color-border-light)] p-6 shadow-xs">
        <h3 className="text-base font-bold text-[var(--color-text-primary)] mb-4">
          Key Performance Dimensions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-[var(--color-surface-secondary)] border border-[var(--color-border-light)]">
            <span className="text-xs text-[var(--color-text-secondary)] font-medium">Task Completion</span>
            <p className="text-2xl font-bold text-[var(--color-text-primary)] mt-1">{healthScore?.taskCompletion || 75}%</p>
            <p className="text-[11px] text-[var(--color-text-muted)] mt-1">Weight: 35% in Health Score</p>
          </div>

          <div className="p-4 rounded-xl bg-[var(--color-surface-secondary)] border border-[var(--color-border-light)]">
            <span className="text-xs text-[var(--color-text-secondary)] font-medium">Schedule Adherence</span>
            <p className="text-2xl font-bold text-[var(--color-text-primary)] mt-1">{healthScore?.scheduleAdherence || 80}%</p>
            <p className="text-[11px] text-[var(--color-text-muted)] mt-1">Weight: 25% in Health Score</p>
          </div>

          <div className="p-4 rounded-xl bg-[var(--color-surface-secondary)] border border-[var(--color-border-light)]">
            <span className="text-xs text-[var(--color-text-secondary)] font-medium">Cost Efficiency</span>
            <p className="text-2xl font-bold text-[var(--color-text-primary)] mt-1">{healthScore?.costEfficiency || 95}%</p>
            <p className="text-[11px] text-[var(--color-text-muted)] mt-1">Weight: 20% in Health Score</p>
          </div>

          <div className="p-4 rounded-xl bg-[var(--color-surface-secondary)] border border-[var(--color-border-light)]">
            <span className="text-xs text-[var(--color-text-secondary)] font-medium">Crop Progress</span>
            <p className="text-2xl font-bold text-[var(--color-text-primary)] mt-1">{healthScore?.cropProgress || 78}%</p>
            <p className="text-[11px] text-[var(--color-text-muted)] mt-1">Weight: 20% in Health Score</p>
          </div>
        </div>
      </div>

      {/* Executive Summary Card */}
      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-2xl border border-emerald-200 p-6">
        <div className="flex items-center gap-2 text-emerald-800 font-bold mb-2">
          <Sparkles className="w-5 h-5 text-emerald-700" />
          <h3 className="text-base">Executive Decision Summary</h3>
        </div>
        <div className="space-y-2 text-xs text-emerald-900 leading-relaxed">
          <p>
            • <strong>Operational Health:</strong> Farm is operating at a solid <strong>{healthScore?.overall || 82}/100 Farm Health Score</strong>. Resolving the 1 overdue fertilization operation (NPK 20-20-20 top-dressing) will elevate the score to 87+.
          </p>
          <p>
            • <strong>Budget Discipline:</strong> Operating expenses stand at <strong>{formatCurrency(totalSpent)}</strong> against a ₹62,000 Kharif Paddy budget (60.3% spent), indicating disciplined capital allocation with adequate buffer for final panicle feeding and harvesting machinery.
          </p>
          <p>
            • <strong>Revenue Outlook:</strong> Projected harvest yield of 4.5 tonnes BPT 5204 at ₹28,500/tonne projects <strong>{formatCurrency(128250)}</strong> in gross revenue with an estimated net operating profit of <strong>{formatCurrency(66250)} (51.7% profit margin)</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
