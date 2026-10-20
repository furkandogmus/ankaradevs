output "url" {
  value = "https://${var.domain}"
}

output "public_ip" {
  description = "DNS'te @ ve www için A kaydı bu adrese girilir."
  value       = aws_eip.web.public_ip
}

output "bucket" {
  value = aws_s3_bucket.content.id
}

output "instance_id" {
  value = aws_instance.web.id
}
