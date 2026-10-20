locals {
  name = "${var.project}-web"
}

# --- İçerik bucket'ı: private, sadece instance okur ---

resource "aws_s3_bucket" "content" {
  bucket_prefix = "${local.name}-"
  force_destroy = true
}

resource "aws_s3_bucket_public_access_block" "content" {
  bucket                  = aws_s3_bucket.content.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# --- Instance rolü: SSM ile yönetim + bucket okuma, SSH anahtarı yok ---

data "aws_iam_policy_document" "ec2_trust" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "instance" {
  name               = "${local.name}-instance"
  assume_role_policy = data.aws_iam_policy_document.ec2_trust.json
}

resource "aws_iam_role_policy_attachment" "ssm" {
  role       = aws_iam_role.instance.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

data "aws_iam_policy_document" "content_read" {
  statement {
    actions   = ["s3:ListBucket"]
    resources = [aws_s3_bucket.content.arn]
  }
  statement {
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.content.arn}/*"]
  }
}

resource "aws_iam_role_policy" "content_read" {
  name   = "content-read"
  role   = aws_iam_role.instance.id
  policy = data.aws_iam_policy_document.content_read.json
}

resource "aws_iam_instance_profile" "instance" {
  name = "${local.name}-instance"
  role = aws_iam_role.instance.name
}

# --- Ağ: default VPC, 80 ve 443 herkese açık, 22 kapalı ---

data "aws_vpc" "default" {
  default = true
}

resource "aws_security_group" "web" {
  name = "${local.name}-sg"
  # SG açıklaması sadece ASCII ve kısıtlı noktalama kabul eder.
  description = "HTTP and HTTPS from anywhere, no SSH"
  vpc_id      = data.aws_vpc.default.id
}

# 80: Let's Encrypt HTTP-01 doğrulaması ve HTTPS'e yönlendirme.
resource "aws_vpc_security_group_ingress_rule" "web" {
  for_each          = toset(["80", "443"])
  security_group_id = aws_security_group.web.id
  ip_protocol       = "tcp"
  from_port         = tonumber(each.value)
  to_port           = tonumber(each.value)
  cidr_ipv4         = "0.0.0.0/0"
}

# nginx/certbot paketleri, Let's Encrypt, S3 ve SSM uç noktaları için dışarı çıkış.
resource "aws_vpc_security_group_egress_rule" "all" {
  security_group_id = aws_security_group.web.id
  ip_protocol       = "-1"
  cidr_ipv4         = "0.0.0.0/0"
}


# --- Instance ---

data "aws_ssm_parameter" "al2023" {
  name = "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64"
}

resource "aws_instance" "web" {
  ami                         = data.aws_ssm_parameter.al2023.value
  instance_type               = "t3.micro" # Free Tier uygun, Frankfurt'ta var
  iam_instance_profile        = aws_iam_instance_profile.instance.name
  vpc_security_group_ids      = [aws_security_group.web.id]
  associate_public_ip_address = true
  user_data = templatefile("${path.module}/user_data.sh.tftpl", {
    bucket = aws_s3_bucket.content.id
    domain = var.domain
    email  = var.email
  })

  metadata_options {
    http_tokens = "required"
  }

  root_block_device {
    volume_size = 8
    volume_type = "gp3"
    encrypted   = true
  }

  tags = {
    Name = local.name
  }

  # Yeni AMI yayınlandıkça instance'ın yeniden yaratılmasını engeller.
  lifecycle {
    ignore_changes = [ami]
  }
}

# --- Sabit IP: DNS'teki A kayıtları buna bakar ---

# Instance silinip yeniden yaratılsa da IP aynı kalır. Instance durdurulursa da saatlik ücret yazar.
resource "aws_eip" "web" {
  domain   = "vpc"
  instance = aws_instance.web.id

  tags = {
    Name = local.name
  }
}
