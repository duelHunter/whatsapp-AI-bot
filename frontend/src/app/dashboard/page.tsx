"use client";

const summaryCards = [
  { title: "Bot Status", value: "Online", description: "WhatsApp client + backend", accent: "emerald" },
  { title: "Messages", value: "—", description: "Total processed", accent: "sky" },
  { title: "Active Users", value: "—", description: "Unique WhatsApp senders", accent: "violet" },
  { title: "Uptime", value: "—", description: "Last session duration", accent: "amber" },
];

const recentMessages = [
  { from: "Bot", time: "04:15", text: "Hello, I'm your virtual assistant...", role: "bot" },
  { from: "User", time: "04:15", text: "hi who are you?", role: "user" },
  { from: "Bot", time: "04:16", text: "I'm here to help you with orders and FAQs.", role: "bot" },
  { from: "User", time: "04:17", text: "What are your packages?", role: "user" },
];

const accentMap: Record<string, string> = {
  emerald: "bg-emerald-500/15 text-emerald-300 border-emerald-500/20",
  sky: "bg-sky-500/15 text-sky-300 border-sky-500/20",
  violet: "bg-violet-500/15 text-violet-300 border-violet-500/20",
  amber: "bg-amber-500/15 text-amber-300 border-amber-500/20",
};

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <header className="mb-8 space-y-2">
          <h1 className="text-3xl font-semibold">Dashboard</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Monitor and control your WhatsApp bot.
          </p>
        </header>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <div
              key={card.title}
              className={`rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 ${accentMap[card.accent] ?? ""}`}
            >
              <p className="text-sm font-medium">{card.title}</p>
              <p className="mt-2 text-2xl font-semibold">{card.value}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">{card.description}</p>
              {card.title === "Bot Status" && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  <span className="text-xs text-emerald-200">Online</span>
                  <button className="ml-auto rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                    Stop bot
                  </button>
                </div>
              )}
              {card.title === "Messages" && (
                <div className="mt-3 text-xs text-slate-500">
                  View history → <span className="font-semibold text-slate-300">/messages</span>
                </div>
              )}
              {card.title === "Active Users" && (
                <div className="mt-3 text-xs text-slate-500">
                  See analytics → <span className="font-semibold text-slate-300">/analytics</span>
                </div>
              )}
              {card.title === "Uptime" && (
                <div className="mt-3 text-xs text-slate-500">
                  Detailed metrics → <span className="font-semibold text-slate-300">/analytics</span>
                </div>
              )}
            </div>
          ))}
        </section>

        <section className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Connect WhatsApp
                </p>
                <h2 className="text-xl font-semibold">Scan QR code</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Scan this QR code with your WhatsApp app to connect.
                </p>
              </div>
              <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">
                WhatsApp Disconnected
              </span>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-[220px_1fr]">
              <div className="flex aspect-square items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-100 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400">
                QR code placeholder
              </div>
              <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  WhatsApp Disconnected
                </p>
                <p>Start the bot to display the QR code.</p>
                <ul className="list-disc space-y-1 pl-4">
                  <li>Open WhatsApp on your phone.</li>
                  <li>Go to Settings → Linked Devices.</li>
                  <li>Tap “Link a device” and scan the QR displayed here.</li>
                </ul>
                <button className="mt-3 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400">
                  Start bot
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Recent Messages
                </p>
                <h2 className="text-xl font-semibold">Latest chats</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Preview recent interactions.
                </p>
              </div>
              <button className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                View all
              </button>
            </div>
            <div className="mt-4 max-h-80 space-y-3 overflow-y-auto pr-1">
              {recentMessages.map((msg, idx) => (
                <div
                  key={`${msg.from}-${idx}`}
                  className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/70"
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                      msg.role === "bot"
                        ? "bg-emerald-500/20 text-emerald-200"
                        : "bg-slate-700 text-slate-100"
                    }`}
                  >
                    {msg.from[0]}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>{msg.from}</span>
                      <span>{msg.time}</span>
                    </div>
                    <p className="text-sm text-slate-800 dark:text-slate-200">
                      {msg.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

