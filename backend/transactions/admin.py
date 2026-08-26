from django.contrib import admin

from .models import Transaction

# Register your models here.
class TransactionAdmin (admin.ModelAdmin):
   list_filter = ('name', 'transaction_type')
   list_display = ('name', 'transaction_type', 'amount')

admin.site.register(Transaction, TransactionAdmin)