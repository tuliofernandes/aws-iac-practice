# ======= PROVIDER =======
provider "aws" {
  region = "sa-east-1"
}

# ======= IAM ROLE FOR THE LAMBDA =======
resource "aws_iam_role" "lambda_role" {
    name = "lambda_s3_role"
    assume_role_policy = jsondecode({
        Version = "2012-10-17",
        Statement = [
            {
                Action = "sts:AssumeRole",
                Effect = "Allow",
                Principal = {
                    Service = "lambda.amazonaws.com"
                }
            }
        ]
    })
}

# Inline policy for the lambda to access logs and S3
resource "aws_iam_role_policy" "lambda_policy" {
  name = "lambda_s3_policy"
  role = aws_iam_role.lambda_role.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ],
        Resource = "*"
      },
      {
        Effect = "Allow",
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ],
        Resource = "*"
      }
    ]
  })
}

# ======= S3 BUCKET =======
resource "aws_s3_bucket" "my_bucket" {
  bucket = "normalized_pics"
}

# ======= LAMBDA PACKAGE =======
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_file = "${path.module}/index.js" # The NodeJS script
  output_path = "${path.module}/index.zip"
}

# ======= LAMBDA FUNCTION =======
resource "aws_lambda_function" "my_lambda" {
  function_name = "lambda_s3_trigger"
  filename      = data.archive_file.lambda_zip.output_path
  handler       = "index.handler" # module + function
  runtime       = "nodejs20.x"
  role          = aws_iam_role.lambda_role.arn
  timeout       = 30
}

# ======= PERMISSION TO ALLOW LAMBDA TO CALL S3 =======
resource "aws_lambda_permission" "allow_s3" {
  statement_id  = "AllowS3Invoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.my_lambda.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.my_bucket.arn
}

# ======= S3 NOTIFICATION =======
resource "aws_s3_bucket_notification" "s3_trigger_lambda" {
  bucket = aws_s3_bucket.my_bucket.id

  lambda_function {
    lambda_function_arn = aws_lambda_function.my_lambda.arn
    events              = ["s3:ObjectCreated:*"]
  }

  depends_on = [aws_lambda_permission.allow_s3] # Ensures that Terraform does not create before the permission
}