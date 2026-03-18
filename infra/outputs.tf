output "dynamodb_table_name" {
  value = aws_dynamodb_table.fayez_music_app.name
}

output "ecr_repository_url" {
  value = aws_ecr_repository.backend.repository_url
}

output "apprunner_service_url" {
  value = aws_apprunner_service.backend.service_url
}

output "apprunner_service_arn" {
  value = aws_apprunner_service.backend.arn
}

output "s3_bucket_name" {
  value = aws_s3_bucket.audio.id
}
