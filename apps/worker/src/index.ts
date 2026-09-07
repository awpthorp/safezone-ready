import { runFixPipeline, type FixJobMessage, type PipelineEnv } from "./pipeline";

export type WorkerEnv = PipelineEnv;

export default {
  async queue(batch: MessageBatch<FixJobMessage>, env: WorkerEnv): Promise<void> {
    for (const message of batch.messages) {
      try {
        const result = await runFixPipeline(message.body, env);
        console.log(
          JSON.stringify({
            event: result.status === "succeeded" ? "fix.succeeded" : "fix.failed",
            jobId: message.body.jobId,
            status: result.status,
            failureCode: result.failureCode ?? null,
          }),
        );
      } catch {
        console.log(
          JSON.stringify({
            event: "fix.failed",
            jobId: message.body.jobId,
            status: "failed",
            failureCode: "model_failed",
          }),
        );
      }
      message.ack();
    }
  },
};
