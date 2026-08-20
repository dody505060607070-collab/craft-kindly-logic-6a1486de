import { resolveAiModel } from "./ai-gateway.server";
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText, Output } from "ai";
import { z } from "zod";

const GradeInput = z.object({
  question: z.string().min(1).max(4000),
  answer: z.string().min(1).max(8000),
  maxScore: z.number().min(1).max(100).default(10),
});

export const gradeAssignment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => GradeInput.parse(input))
  .handler(async ({ data, context }) => {
    const { data: adminChk } = await context.supabase.rpc("is_admin");
    if (!adminChk) throw new Error("للأدمن فقط");

    const { output } = await generateText({
      model: resolveAiModel(),
      output: Output.object({
        schema: z.object({
          score: z.number(),
          feedback: z.string(),
        }),
      }),
      system:
        "أنت مساعد تصحيح لمنصة تعليمية مصرية لمادة البرمجة. صحّح إجابة الطالب بعدل، وأعطِ درجة من الحد الأقصى المحدد وملاحظات مختصرة باللغة العربية المصرية البسيطة.",
      prompt: `السؤال: ${data.question}\n\nإجابة الطالب: ${data.answer}\n\nالدرجة القصوى: ${data.maxScore}`,
    });

    return output;
  });

const ChatInput = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(4000) }))
    .min(1)
    .max(30),
});

export const askTutor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ChatInput.parse(input))
  .handler(async ({ data }) => {
    const { text } = await generateText({
      model: resolveAiModel(),
      system:
        "أنت 'مساعد المستر'، مدرس برمجة مصري ودود على منصة المستر للأستاذ المستر. جاوب بالعربية المصرية المبسطة، واشرح الكود خطوة بخطوة باختصار.",
      messages: data.messages,
    });

    return { reply: text };
  });
