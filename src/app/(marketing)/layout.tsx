import { SiteHeader } from "@/components/marketing/header";
import { SiteFooter } from "@/components/marketing/footer";
import { SupportChatWidget } from "@/components/support/chat-widget";
import { SupportWidgetProvider } from "@/components/support/widget-context";
import { ToastProvider } from "@/components/ui/toast";
import { themeInitScript } from "@/components/ui/theme-toggle";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <SupportWidgetProvider>
        {/* Applies a stored light/dark preference before first paint (root <html> has suppressHydrationWarning). */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-brand-500 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-[#1a1304]"
        >
          Skip to main content
        </a>
        <SiteHeader />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <SiteFooter />
        <SupportChatWidget />
      </SupportWidgetProvider>
    </ToastProvider>
  );
}
