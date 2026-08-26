from django.contrib import admin

from .models import Account, Category, Subcategory, Transaction


# Register your models here.
class TransactionAdmin(admin.ModelAdmin):
   list_filter = ('account', 'transaction_type', 'subcategory')
   list_display = ('name', 'transaction_type', 'amount')

class AccountAdmin(admin.ModelAdmin):
   list_filter = ('user',)
   list_display = ('name', 'user')

class CategoryAdmin(admin.ModelAdmin):
   list_display = ('name', 'description')

class SubcategoryAdmin(admin.ModelAdmin):
   list_display = ('name', 'category')

admin.site.register(Transaction, TransactionAdmin)
admin.site.register(Account, AccountAdmin)
admin.site.register(Category, CategoryAdmin)
admin.site.register(Subcategory, SubcategoryAdmin)