from django.contrib import admin
from .models import Computer
# Register your models here.


class ComputerAdmin(admin.ModelAdmin):

    list_display = ('name', 'mac', 'port', "ip", "last_seen", "is_alive")


admin.site.register(Computer, ComputerAdmin)
