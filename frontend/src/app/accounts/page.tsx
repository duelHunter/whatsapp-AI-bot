"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseClient } from "@/lib/supabaseClient";
import { Membership, WaAccount } from "@/lib/types";
import { getSelectedWaAccountId, setSelectedWaAccountId } from "@/lib/backendClient";

export default function AccountsPage() {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [accounts, setAccounts] = useState<WaAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const accountsWithRole = useMemo(() => {
    return accounts.map((acct) => {
      const membership = memberships.find((m) => m.wa_account_id === acct.id);
      return { ...acct, role: membership?.role };
    });
  }, [accounts, memberships]);

  useEffect(() => {
    setSelected(getSelectedWaAccountId());
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: membershipData, error: membershipError } = await supabaseClient
          .from("memberships")
          .select("wa_account_id, role");

        if (membershipError) throw membershipError;
        setMemberships((membershipData as Membership[]) || []);

        const ids = (membershipData || []).map((m) => m.wa_account_id);
        if (ids.length === 0) {
          setAccounts([]);
          return;
        }

        const { data: accountData, error: accountError } = await supabaseClient
          .from("whatsapp_accounts")
          .select("id, display_name, phone")
          .in("id", ids);

        if (accountError) throw accountError;
        setAccounts((accountData as WaAccount[]) || []);
      } catch (err) {
        setError((err as Error).message || "Failed to load accounts");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const handleSelect = (id: string) => {
    setSelectedWaAccountId(id);
    setSelected(id);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold">WhatsApp Accounts</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Select an account to use for backend calls and KB management.
          </p>
        </header>

        {error && (
          <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-slate-500">Loading...</p>
        ) : accountsWithRole.length === 0 ? (
          <p className="text-slate-500">No accounts found for your user.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {accountsWithRole.map((acct) => (
              <div
                key={acct.id}
                className={`rounded-2xl border p-4 shadow-sm ${
                  selected === acct.id
                    ? "border-emerald-400 bg-emerald-500/5"
                    : "border-slate-200 dark:border-slate-800"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-semibold">{acct.display_name || "Unnamed account"}</h3>
                    <p className="text-sm text-slate-500">ID: {acct.id}</p>
                    {acct.phone && <p className="text-sm text-slate-500">Phone: {acct.phone}</p>}
                  </div>
                  <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-200">
                    {acct.role ?? "member"}
                  </span>
                </div>
                <button
                  className="mt-4 inline-flex items-center justify-center rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400"
                  onClick={() => handleSelect(acct.id)}
                >
                  {selected === acct.id ? "Selected" : "Select"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


