from django.db import models
from django.core.validators import MinValueValidator


# Create your models here.
class Transaction(models.Model):
    name = models.CharField(max_length=50)
    description = models.CharField(max_length=100)
    transaction_type = models.CharField(max_length=50)
    amount = models.DecimalField(
        validators=[MinValueValidator(0, "Value must positive")]
    )
    date = models.DateTimeField()
