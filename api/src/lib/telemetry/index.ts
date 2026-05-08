import { PostHog } from 'posthog-node';

let posthogClient: PostHog | null = null;

export const telemetry = () => {
  if (!posthogClient) {
    posthogClient = new PostHog(
      process.env.NEXT_PUBLIC_POSTHOG_KEY || 'mock-key',
      { host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com' }
    );
  }
  return posthogClient;
};

export const captureEvent = (distinctId: string, event: string, properties?: any) => {
  const client = telemetry();
  client.capture({
    distinctId,
    event,
    properties,
  });
};
