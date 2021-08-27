// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  stage: "dev",
  region: "us-east-1",
  reportsBucket: "aws-serverless-report-dev",
  userPoolId: "us-east-1_h7myeGXdX",
  userPoolWebClientId: "2mnbmsh9vcskp29livue0l4g74",
  identityPoolId: "us-east-1:d7e7d275-8ad2-4a23-8c95-434ddd8529df"
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
