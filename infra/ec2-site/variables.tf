variable "project" {
  description = "Tüm kaynaklara project etiketi olarak yazılır; bootstrap'teki project ile aynı olmalı."
  type        = string
  default     = "demo"

  validation {
    condition     = can(regex("^[a-z0-9-]{3,30}$", var.project))
    error_message = "project küçük harf, rakam ve tire içermeli, 3-30 karakter."
  }
}

variable "domain" {
  description = "Kök domain, www'siz (örnek.com). Sertifika hem bunu hem www'yu kapsar."
  type        = string

  validation {
    condition     = can(regex("^([a-z0-9-]+\\.)+[a-z]{2,}$", var.domain)) && !startswith(var.domain, "www.")
    error_message = "domain küçük harf ve www'siz olmalı: ornek.com"
  }
}

variable "email" {
  description = "Let's Encrypt hesabı için e-posta; boş bırakılabilir."
  type        = string
  default     = ""
}
