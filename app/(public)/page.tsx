import type { Metadata } from "next";
import { HomeSections } from "@/components/public/HomeSections";
import { JsonLd } from "@/components/shared/JsonLd";
import { getSiteData } from "@/lib/services/content";
import { homeMetadata } from "@/lib/seo/metadata";
import { homeGraph } from "@/lib/seo/jsonld";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return homeMetadata(await getSiteData());
}

export default async function HomePage() {
  const data = await getSiteData();
  return (
    <>
      <JsonLd data={homeGraph(data)} />
      <HomeSections data={data} />
    </>
  );
}
