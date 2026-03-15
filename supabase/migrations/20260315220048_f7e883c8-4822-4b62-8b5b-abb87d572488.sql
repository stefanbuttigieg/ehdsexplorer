
-- Update Privacy Policy with PostHog information
UPDATE page_content 
SET content = jsonb_set(
  jsonb_set(
    content,
    '{last_updated}',
    '"2026-03-15"'
  ),
  '{sections}',
  (
    SELECT jsonb_agg(
      CASE 
        WHEN elem->>'title' = '3. Information We Collect' THEN
          jsonb_set(elem, '{content}', to_jsonb(
            (elem->>'content') || E'\n\n### 3.3 UX Analytics Data (PostHog)\nWhen you consent to analytics cookies, we collect the following through PostHog:\n- **Session recordings:** Anonymized replays of how you interact with pages (mouse movements, clicks, scrolls)\n- **Heatmaps:** Aggregated click and scroll patterns across pages\n- **Autocaptured events:** Button clicks, form interactions, and page navigation\n- **Page view data:** Which pages you visit and in what order\n\nThis data is processed by PostHog (hosted in the EU at eu.i.posthog.com) and is used solely to improve the user interface and experience. No session recordings or heatmap data is collected until you opt in via the cookie banner.'
          ))
        WHEN elem->>'title' = '7. Third-Party Services' THEN
          jsonb_set(elem, '{content}', '"We use the following third-party services:\n\n- **Umami Analytics:** Privacy-focused web analytics for page view and visitor statistics\n- **PostHog (EU):** UX analytics platform providing heatmaps, session recordings, and click tracking to help us improve the user interface. Data is processed in the EU (eu.i.posthog.com). PostHog''s privacy policy: [posthog.com/privacy](https://posthog.com/privacy)\n\nThese services have their own privacy policies and may collect information as specified in their respective policies. PostHog data collection only occurs when you consent to analytics cookies."'::jsonb)
        ELSE elem
      END
    )
    FROM jsonb_array_elements(content->'sections') AS elem
  )
)
WHERE id = 'privacy-policy';

-- Update Cookies Policy with PostHog information
UPDATE page_content 
SET content = jsonb_set(
  jsonb_set(
    content,
    '{last_updated}',
    '"2026-03-15"'
  ),
  '{sections}',
  (
    SELECT jsonb_agg(
      CASE 
        WHEN elem->>'title' = '2. How We Use Cookies' THEN
          jsonb_set(elem, '{content}', to_jsonb(
            (elem->>'content') || E'\n\n### 2.4 UX Analytics Cookies (PostHog)\nWhen analytics cookies are enabled, PostHog sets cookies to power:\n- **Session Recordings:** Anonymized replays of user interactions to identify UX issues\n- **Heatmaps:** Visual maps of where users click and scroll on each page\n- **Autocapture:** Automatic tracking of clicks, form submissions, and navigation\n\nPostHog data is processed in the EU (eu.i.posthog.com). These cookies are only set when you opt in to analytics cookies via our cookie banner.'
          ))
        WHEN elem->>'title' = '3. Cookie Details' THEN
          jsonb_set(elem, '{content}', to_jsonb(
            (elem->>'content') || E'\n| ph_* | PostHog session and analytics | Analytics | Session/1 year |\n| ph_heatmap | PostHog heatmap data | Analytics | Session |'
          ))
        WHEN elem->>'title' = '5. Third-Party Cookies' THEN
          jsonb_set(elem, '{content}', '"We use the following third-party analytics services that set their own cookies:\n\n- **Umami Analytics:** Privacy-focused analytics (page views, visitor counts)\n- **PostHog:** UX analytics for heatmaps, session recordings, and click tracking. PostHog processes data in the EU and sets cookies prefixed with `ph_`. See [PostHog''s cookie policy](https://posthog.com/privacy) for details.\n\nThese cookies are only active when you consent to analytics cookies."'::jsonb)
        ELSE elem
      END
    )
    FROM jsonb_array_elements(content->'sections') AS elem
  )
)
WHERE id = 'cookies-policy';
