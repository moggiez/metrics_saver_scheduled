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
  const isPreview = "isPreview" in event && event.isPreview;
  const loadtestsApiLambda = new LambdaApiClient({
    functionName: "loadtests-api",
    AWS: AWS,
  });

  try {
    let hourDate = new Date();
    hourDate.setHours(hourDate.getHours() - 1);
    let hourDateString = hourDate.toISOString().substring(0, 13);
    if ("hourDateString" in event) {
      hourDateString = event.hourDateString;
    }
    if (isPreview) {
      console.log("hourDateString is", hourDateString);
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
        if (isPreview) {
          console.log(
            "Will save metrics data for loadtest",
            loadtest.LoadtestId
          );
        } else {
          await cw.saveMetricDataToDb(loadtest, "ResponseTime");
          await setLoadtestMetricsSaved(loadtest, loadtestsApiLambda);
        }
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
