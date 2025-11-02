# Introduction

This is just a simple, practice exercise to cover AWS, Lambda and Terraform.
The only Lambda function is triggered by an image upload to S3. The function then receives the image, crops and stores it in the same S3 bucket with the "-thumbnail" suffix.