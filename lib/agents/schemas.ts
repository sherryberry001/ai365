import { CATEGORY_KEYS } from "@/lib/constants";

// JSON Schemas for structured Claude output. Keep to supported constructs:
// types, enum, arrays, objects with additionalProperties:false + required.

const category = { type: "string", enum: CATEGORY_KEYS as unknown as string[] };

export const contentBatchSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    linkedin_posts: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          hook: { type: "string" },
          body: { type: "string" },
          hashtags: { type: "array", items: { type: "string" } },
          category,
          reason: { type: "string" },
          mvp_impact: { type: "string" },
        },
        required: ["hook", "body", "hashtags", "category", "reason", "mvp_impact"],
      },
    },
    article_ideas: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          angle: { type: "string" },
          excerpt: { type: "string" },
          category,
        },
        required: ["title", "angle", "excerpt", "category"],
      },
    },
    image_prompts: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          purpose: { type: "string" },
          prompt: { type: "string" },
          aspect_ratio: { type: "string" },
          category,
        },
        required: ["purpose", "prompt", "aspect_ratio", "category"],
      },
    },
  },
  required: ["linkedin_posts", "article_ideas", "image_prompts"],
} as const;

export const commentBatchSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    comments: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          target_author: { type: "string" },
          target_summary: { type: "string" },
          comment_text: { type: "string" },
          insight_type: { type: "string", enum: ["insight", "question", "experience"] },
          category,
        },
        required: ["target_author", "target_summary", "comment_text", "insight_type", "category"],
      },
    },
  },
  required: ["comments"],
} as const;

export const communityBatchSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    answers: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          platform: {
            type: "string",
            enum: ["microsoft_tech_community", "microsoft_learn", "azure_community", "github_discussions"],
          },
          question_title: { type: "string" },
          answer_text: { type: "string" },
          doc_references: { type: "array", items: { type: "string" } },
          follow_up_question: { type: "string" },
          category,
        },
        required: ["platform", "question_title", "answer_text", "doc_references", "follow_up_question", "category"],
      },
    },
  },
  required: ["answers"],
} as const;

export const articleSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string" },
    subtitle: { type: "string" },
    excerpt: { type: "string" },
    body_mdx: { type: "string" },
    tags: { type: "array", items: { type: "string" } },
    reading_minutes: { type: "integer" },
    seo_title: { type: "string" },
    seo_description: { type: "string" },
    og_title: { type: "string" },
    og_description: { type: "string" },
    cover_image_prompt: { type: "string" },
    linkedin_version: { type: "string" },
    newsletter_version: { type: "string" },
    community_version: { type: "string" },
  },
  required: [
    "title", "subtitle", "excerpt", "body_mdx", "tags", "reading_minutes",
    "seo_title", "seo_description", "og_title", "og_description",
    "cover_image_prompt", "linkedin_version", "newsletter_version", "community_version",
  ],
} as const;

export const githubIdeasSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    ideas: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          idea_type: {
            type: "string",
            enum: ["copilot_prompt", "agent_template", "azure_template", "sample_app", "learning_resource"],
          },
          category,
        },
        required: ["title", "description", "idea_type", "category"],
      },
    },
  },
  required: ["ideas"],
} as const;

export const powershellScriptsSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    scripts: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          filename: { type: "string" },
          category,
          code: { type: "string" },
        },
        required: ["title", "description", "filename", "category", "code"],
      },
    },
  },
  required: ["scripts"],
} as const;

export const styleProfileSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    voice: { type: "string" },
    perspective: { type: "string" },
    sentence_style: { type: "string" },
    do: { type: "array", items: { type: "string" } },
    avoid: { type: "array", items: { type: "string" } },
    topics: { type: "array", items: { type: "string" } },
  },
  required: ["voice", "perspective", "sentence_style", "do", "avoid", "topics"],
} as const;
