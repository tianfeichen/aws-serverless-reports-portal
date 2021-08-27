export const environment = {
  production: true,
  stage: "#{stage}",
  region: "us-east-1",
  reportsBucket: "aws-serverless-report-#{stage}",
  userPoolId: "#{userPoolId}",
  userPoolWebClientId: "#{userPoolWebClientId}",
  identityPoolId: "#{identityPoolId}"
};
