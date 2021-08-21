module "scheduledLambda" {
  source      = "git@github.com:moggiez/terraform-modules.git//lambda_with_dynamo"
  name        = "${var.project_name}-scheduled"
  dist_dir    = var.dist_dir
  s3_bucket   = aws_s3_bucket._
  environment = "PROD"

  timeout = 60

  policies = [
    aws_iam_policy.s3_access.arn,
    aws_iam_policy.cloudwatch_metrics_access.arn
  ]

  layers = []
}