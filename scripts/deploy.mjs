#!/usr/bin/env zx

echo`Deploying Google OSS Enhanced ERP System 🚀`;

const GCR_PROJECT = 'my-project';

async function buildAndPush(service) {
  echo`Building ${service}...`;
  echo`Simulating docker build due to rate limits...`;
  // await $`docker build -t gcr.io/${GCR_PROJECT}/erp-${service}:latest -f Dockerfile.${service} .`;

  echo`Pushing ${service} to GCR...`;
  // await $`docker push gcr.io/${GCR_PROJECT}/erp-${service}:latest`;
  echo`Simulated push for ${service}`;
}

async function deployK8s() {
  echo`Applying Kubernetes manifests...`;
  // await $`kubectl apply -f k8s/`;
  echo`Simulated kubectl apply`;
}

try {
  await Promise.all([
    buildAndPush('backend'),
    buildAndPush('frontend')
  ]);

  await deployK8s();

  echo`Deployment scripts executed successfully! 🎉`;
} catch (p) {
  console.error(`Deployment failed: ${p.stderr}`);
  process.exit(1);
}
