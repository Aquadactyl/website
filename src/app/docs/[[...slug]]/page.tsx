import { source, getPageImageUrl } from "@/lib/source";
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from "fumadocs-ui/page";
import {
  MarkdownCopyButton,
  ViewOptionsPopover,
} from "fumadocs-ui/layouts/docs/page";
import { getPageMarkdownUrl } from "@/lib/shared";
import { notFound, redirect } from "next/navigation";
import defaultMdxComponents from "fumadocs-ui/mdx";
import { SetupCodeBlock } from "@/components/docs/setup-code-block";
import { SetupPanel } from "@/components/docs/setup-panel";
import { SetupValue, ShowFor } from "@/components/docs/show-for";
import { ApiEndpointIndex } from "@/components/docs/api-endpoint-index";

export default async function Page(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const params = await props.params;

  if (!params.slug || params.slug.length === 0) {
    redirect("/docs/panel");
  }

  const page = source.getPage(params.slug);

  if (!page) notFound();

  const MDX = page.data.body;
  const markdownUrl = getPageMarkdownUrl(page).url;

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <div className="flex flex-row items-center gap-2 border-b pt-2 pb-6">
        <MarkdownCopyButton markdownUrl={markdownUrl} />
        <ViewOptionsPopover
          markdownUrl={markdownUrl}
          githubUrl={`https://github.com/Aquadactyl/website/blob/main/docs/${page.path}`}
        />
      </div>
      <DocsBody>
        <MDX
          components={{
            ...defaultMdxComponents,
            pre: SetupCodeBlock,
            SetupPanel,
            ShowFor,
            SetupValue,
            ApiEndpointIndex,
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
    openGraph: {
      images: getPageImageUrl(page).url,
    },
  };
}
