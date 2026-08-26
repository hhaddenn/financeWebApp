from django.contrib import admin

from .models import User

# Register your models here.
class UserAdmin (admin.ModelAdmin):
   list_filter = ('name','email')
   list_display = ('name', 'email')

admin.site.register(User, UserAdmin)