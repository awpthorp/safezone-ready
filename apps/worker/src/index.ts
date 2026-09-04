import { runFixPipelineStub, type FixJobMessage } from "./pipeline";

export interface WorkerEnv {
  ENVIRONMENT: string;
  GEMINI_MODEL_PRIMARY: string;
  GEMINI_MODEL_ESCALATION: string;
  GEMINI_API_BASE: string;
  FIXES_ENABLED: string;
  GEMINI_API_KEY?: string;
  DB: D1Database;
  ASSETS: R2Bucket;
}

export default {
  async queue(batch: MessageBatch<FixJobMessage>, env: WorkerEnv): Promise<void> {
    if (env.FIXES_ENABLED === "false") {
      for (const message of batch.messages) {
        console.log(
          JSON.stringify({
            event: "fix.killed",
            jobId: message.body.jobId,
          }),
        );
        message.ack();
      }
      return;
    }

    for (const message of batch.messages) {
      const result = await runFixPipelineStub(message.body);
      console.log(
        JSON.stringify({
          event: "fix.stub",
          jobId: message.body.jobId,
          status: result.status,
          hasGeminiKey: Boolean(env.GEMINI_API_KEY),
          primary: env.GEMINI_MODEL_PRIMARY,
          escalation: env.GEMINI_MODEL_ESCALATION,
        }),
      );
      message.ack();
    }
  },
};
