"use strict";

const AWS = require("aws-sdk");
const cw = require("./cloudwatch");
const { LambdaApiClient } = require("./lambda");

const setLoadtestMetricsSaved = async (loadtest, loadtestsApiLambda) => {
  const updatedFields = {
    MetricsSavedDate: new Date().toISOString(),
  };

  return await loadtestsApiLambda.invoke("setLoadtestMetricsSaved", {
    organisationId: loadtest.OrganisationId,
    loadtestId: loadtest.LoadtestId,
    updatedFields,
  });
};

exports.handler = async function (event, context, callback) {
  const loadtestsApiLambda = new LambdaApiClient({
    functionName: "loadtests-api",
    AWS: AWS,
  });

  try {
    let hourDateString = new Date().toISOString().substring(0, 13);
    if ("hourDateString" in event) {
      hourDateString = event.hourDateString;
    }
    const data = await loadtestsApiLambda.invoke("getLoadtestsInPastHour", {
      hourDateString,
    });

    data.forEach(async (el) => {
      try {
        const loadtest = await loadtestsApiLambda.invoke("getLoadtest", {
          organisationId: el.OrganisationId,
          loadtestId: el.LoadtestId,
        });

        await cw.saveMetricDataToDb(loadtest.Item, "ResponseTime");
        await setLoadtestMetricsSaved(loadtest.Item, loadtestsApiLambda);
      } catch (errLd) {
        console.log(errLd);
      }
    });

    callback(null, "Success");
  } catch (err) {
    console.log(err);
    callback(err, null);
  }
};
