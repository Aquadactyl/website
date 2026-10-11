"use client";
// or `fumadocs-ui/layouts/notebook`
import {
  DocsLayout as Layout,
  type DocsLayoutProps,
} from "fumadocs-ui/layouts/docs";
// the installed components
import { AIChat, AIChatPanel, AIChatTrigger, useAIChat } from "./search";

export function DocsLayout(props: DocsLayoutProps) {
  return (
    <AIChat>
      <ChatLayout {...props} />
      <AIChatTrigger />
    </AIChat>
  );
}

function ChatLayout(props: DocsLayoutProps) {
  const { open, setOpen } = useAIChat();

  return (
    <Layout
      {...props}
      aiChat={{ open, onOpenChange: setOpen, panel: <AIChatPanel /> }}
    />
  );
}
