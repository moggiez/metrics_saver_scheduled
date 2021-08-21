"use strict";

const AWS = require("aws-sdk");
const CloudWatch = new AWS.CloudWatch({ apiVersion: "2010-08-01" });
const metricsHelpers = require("@moggiez/moggies-metrics");

const { LambdaApiClient } = require("./lambda");

const Metrics = new metricsHelpers.Metrics(CloudWatch);

exports.saveMetricDataToDb = async (loadtest, metricName) => {
  const metricsApiLambda = new LambdaApiClient({
    functionName: "metrics-api",
    AWS: AWS,
  });

  const params = Metrics.generateGetMetricsDataParamsForLoadtest(
    loadtest,
    metricName
  );
  let metricsData = await Metrics.getMetricsData(params);
  metricsData = JSON.parse(JSON.stringify(metricsData));
  metricsData.Source = "DB";

  const lambdaParams = {
    loadtestId: loadtest.LoadtestId,
    metricName,
    metricsData,
  };
  await metricsApiLambda.invoke("updateMetricsData", lambdaParams);
};
