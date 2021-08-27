import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { mergeMap, toArray, mergeAll } from 'rxjs/operators';
import { HeadObjectOutput } from 'aws-sdk/clients/s3';
import * as S3 from 'aws-sdk/clients/s3';
import { Lambda } from 'aws-sdk';

import { Report } from 'src/app/models/report';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class ReportsService {

  private s3: S3;

  constructor(private authService: AuthService) {
  }

  private getS3() {
    if (this.s3) {
      return this.s3;
    }

    // build S3 client with dynamic credentials
    const credentials = this.authService.credentialStore;
    const s3 = new S3({
      region: environment.region,
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      sessionToken: credentials.sessionToken
    });
    return s3;
  }

  getReports(): Observable<Report[]> {
    const params = {
      Bucket: environment.reportsBucket
    }

    return Observable.create(observer => {

      this.getS3().listObjectsV2(params, (err, data) => {
        if (err) {
          console.warn(err);
          observer.error(err);
          return;
        }

        const reports: Report[] = [];
        data.Contents.forEach(file => {
          let id = file.Key;
          id = id.substr(0, id.indexOf('.'));
          const report = {
            id: id,
            name: '',
            site: '',
            path: '',
            updated: file.LastModified,
            key: file.Key,
            url: this.getReportUrl(params.Bucket, file.Key)
          };
          reports.push(report);
        });

        observer.next(reports);
        observer.complete();
      });
    })

  }

  getReportsWithMetadata(): Observable<Report[]> {
    const reportsObservable = this.getReports();
    return reportsObservable.pipe(
      mergeAll(),
      mergeMap((report: Report) => {
        return this.updateReportMetdata(report);
      }),
      toArray()
    );
  }

  updateReportMetdata(report: Report): Observable<Report> {
    const params = {
      Bucket: environment.reportsBucket,
      Key: report.key,
    };

    return Observable.create(observer => {

      this.getS3().headObject(params, (err, data: HeadObjectOutput) => {
        report.name = data.Metadata['name'];
        report.site = data.Metadata['site'];
        report.path = data.Metadata['path'];
        observer.next(report);
        observer.complete();
      });
    })

  }

  /**
   * Generate reports from reporting server and save them to S3.
   * The real work is done by another .NET Core Lambda function.
   * This is just invoking it asynchronously.
   * @returns {Observable<any>}
   * @memberof ReportsService
   */
  generateProductReports(): Observable<any> {
    const credentials = this.authService.credentialStore;
    const lambda = new Lambda({
      region: environment.region,
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      sessionToken: credentials.sessionToken
    });
    const params = {
      FunctionName: `aws-serverless-${environment.stage}-generate`
    };

    return Observable.create(observer => {

      lambda.invoke(params, function(err, data) {
        if (err) {
          console.warn(err, err.stack);
          return;
        }
        observer.next(data);
        observer.complete();
      });

    });
  }

  private getReportUrl(bucket: string, key: string): string {
    const url = `https://${bucket}.s3-${environment.region}.amazonaws.com/${key}`;
    return url;
  }

  public getSignedUrl(report: Report): string {
    const params = {
      Bucket: environment.reportsBucket,
      Key: report.key,
      ResponseContentDisposition: 'attachment; filename="' + report.name + '.xls"'
    };
    const url = this.getS3().getSignedUrl('getObject', params);
    return url;
  }
}
