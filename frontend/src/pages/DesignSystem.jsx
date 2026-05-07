import React, { useState } from 'react';
import {
  RupeeInput, GSTINInput, PANInput, PhoneInput, PincodeInput,
  IFSCInput, DateInput, MoneyDisplay, TrustBadge, ShowWorkingButton,
  StatusPill, RoleBadge, ActivityItem, EmptyState, ErrorState,
  TableSkeleton, CardGridSkeleton, FormSkeleton, FilterBar,
  BulkActionBar, CommandPalette
} from '../components/prsk';
import { showUndoToast } from '../components/prsk/UndoToast';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { FileText, Download, Trash, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

export default function DesignSystem() {
  const { theme, setTheme } = useTheme();
  const [date, setDate] = useState();
  const [searchValue, setSearchValue] = useState("");
  const [selectedCount, setSelectedCount] = useState(0);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleUndo = () => {
    showUndoToast("Item deleted", () => console.log("Undo action triggered"));
  };

  return (
    <div className="min-h-screen bg-bg text-text p-8 space-y-12">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="flex justify-between items-center border-b border-border pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">PRSK Design System</h1>
            <p className="text-text-muted mt-2">Component library & tokens demonstration</p>
          </div>
          <Button variant="outline" size="icon" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </div>

        <section className="space-y-6">
          <h2 className="text-2xl font-semibold border-b border-border pb-2">1. Forms & Inputs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-sm">RupeeInput</CardTitle></CardHeader>
              <CardContent><RupeeInput placeholder="Amount" /></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">GSTINInput</CardTitle></CardHeader>
              <CardContent><GSTINInput /></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">PANInput</CardTitle></CardHeader>
              <CardContent><PANInput /></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">PhoneInput</CardTitle></CardHeader>
              <CardContent><PhoneInput /></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">PincodeInput</CardTitle></CardHeader>
              <CardContent><PincodeInput /></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">IFSCInput</CardTitle></CardHeader>
              <CardContent><IFSCInput /></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">DateInput</CardTitle></CardHeader>
              <CardContent><DateInput date={date} setDate={setDate} /></CardContent>
            </Card>
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-semibold border-b border-border pb-2">2. Display & Data</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-sm">MoneyDisplay</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-text-muted">Standard:</span>
                  <MoneyDisplay amount={150000} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-text-muted">Short (Lakh/Cr):</span>
                  <MoneyDisplay amount={1500000} format="short" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">TrustBadge & ShowWorking</CardTitle></CardHeader>
              <CardContent className="space-y-4 flex flex-col items-start gap-3">
                <div className="flex gap-3">
                  <TrustBadge type="verified" />
                  <TrustBadge type="ai" />
                  <TrustBadge type="unverified" />
                </div>
                <div className="flex items-center text-sm mt-4">
                  <span>Computed Total: <MoneyDisplay amount={1180} /></span>
                  <ShowWorkingButton
                    formula="Base Amount + GST (18%)"
                    lineItems={[
                      { label: "Base Amount", value: 1000 },
                      { label: "CGST (9%)", value: 90 },
                      { label: "SGST (9%)", value: 90 }
                    ]}
                    source="Invoice #INV-2023-001"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">StatusPill & RoleBadge</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <StatusPill status="paid" />
                  <StatusPill status="pending" />
                  <StatusPill status="overdue" />
                  <StatusPill status="draft" />
                  <StatusPill status="cancelled" />
                </div>
                <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
                  <RoleBadge role="superadmin" />
                  <RoleBadge role="admin" />
                  <RoleBadge role="finance" />
                  <RoleBadge role="hr" />
                  <RoleBadge role="manager" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">ActivityItem</CardTitle></CardHeader>
              <CardContent>
                <ActivityItem
                  actor="Rahul Sharma"
                  action="approved"
                  target="Invoice #402"
                  timestamp={new Date(Date.now() - 1000 * 60 * 30).toISOString()}
                  context="via Finance workflow"
                />
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-semibold border-b border-border pb-2">3. States</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <EmptyState
              icon={FileText}
              title="No invoices yet"
              description="Create your first invoice to get paid. It takes 30 seconds."
              primaryAction={{ label: "Create invoice", onClick: () => {} }}
              secondaryAction={{ label: "Import data", onClick: () => {} }}
            />
            <ErrorState
              onRetry={() => {}}
            />
          </div>
          <div className="space-y-4 mt-8">
            <h3 className="text-sm font-medium">Loading Skeletons</h3>
            <TableSkeleton rows={3} />
            <div className="mt-4">
              <CardGridSkeleton count={2} />
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-semibold border-b border-border pb-2">4. Patterns</h2>

          <Card>
            <CardHeader><CardTitle className="text-sm">FilterBar</CardTitle></CardHeader>
            <CardContent>
              <FilterBar
                searchValue={searchValue}
                onSearchChange={setSearchValue}
                activeFilters={[
                  { label: "Status", value: "Pending" },
                  { label: "Date", value: "Last 30 days" }
                ]}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Interactive Patterns</CardTitle></CardHeader>
            <CardContent className="flex gap-4">
              <Button onClick={() => setSelectedCount(selectedCount === 0 ? 3 : 0)}>
                Toggle BulkActionBar ({selectedCount > 0 ? 'On' : 'Off'})
              </Button>
              <Button variant="secondary" onClick={handleUndo}>
                Trigger UndoToast
              </Button>
              <Button variant="outline" onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', {'key': 'k', 'metaKey': true}))}>
                Open Command Palette (Cmd+K)
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* Floating elements */}
        <BulkActionBar
          selectedCount={selectedCount}
          onClear={() => setSelectedCount(0)}
          actions={[
            { label: "Export", icon: Download },
            { label: "Delete", icon: Trash, variant: "destructive" }
          ]}
        />
        <CommandPalette />
      </div>
    </div>
  );
}
