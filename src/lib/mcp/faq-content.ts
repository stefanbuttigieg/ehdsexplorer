/** Match the website: published rich content takes precedence over legacy answers. */
export function faqAnswer(faq: { answer: string | null; rich_content: string | null }): string {
  return faq.rich_content?.trim() || faq.answer?.trim() || "";
}