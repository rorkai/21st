
import { ComponentsList } from "@/components/ComponentsList"

interface TagPageProps {
  params: {
    tag_slug: string
  }
}

export default async function TagPage({ params }: TagPageProps) {


  return (
    <div className="container mx-auto px-4">
      <ComponentsList tagSlug={params.tag_slug} />
    </div>
  )
}
