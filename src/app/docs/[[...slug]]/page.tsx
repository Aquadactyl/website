import { source } from "@/lib/source";
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from "fumadocs-ui/page";
import { notFound, redirect } from "next/navigation";
import defaultMdxComponents from "fumadocs-ui/mdx";
import { SetupCodeBlock } from "@/components/docs/setup-code-block";
import { SetupPanel } from "@/components/docs/setup-panel";
import { SetupValue, ShowFor } from "@/components/docs/show-for";

export default async function Page(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const params = await props.params;

  if (!params.slug || params.slug.length === 0) {
    redirect("/docs/getting-started");
  }

  const page = source.getPage(params.slug);

  if (!page) notFound();

  const MDX = page.data.body;

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody>
        <MDX
          components={{
            ...defaultMdxComponents,
            pre: SetupCodeBlock,
            SetupPanel,
            ShowFor,
            SetupValue,
          }}
        />
      </DocsBody>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const params = await props.params;

  if (!params.slug || params.slug.length === 0) {
    return {
      title: "Getting Started — Aquadactyl documentation",
    };
  }

  const page = source.getPage(params.slug);
  if (!page) notFound();

  return {
    title: `${page.data.title} — Aquadactyl documentation`,
    description: page.data.description,
  };
}
