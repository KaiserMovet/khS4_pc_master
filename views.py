from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponse
from django.template import loader
from django.core import serializers
from django.shortcuts import get_object_or_404

from .models import Computer
import json
# Main


def index(request):
    template = loader.get_template('khS4_pc_master/base.html')
    return HttpResponse(template.render())


# API

@csrf_exempt
def api_register(request, mac):
    print(mac)
    print("api regiuster")
    print(request.POST)

    port = int(request.POST.get('port'))
    ip = request.META.get('REMOTE_ADDR')
    x = Computer.objects.update_or_create(
        mac=mac,
        defaults={"port": port, "ip": ip, "is_alive": True})
    print(x)
    return HttpResponse("0")


@csrf_exempt
def api_send(request, mac):
    computer = get_object_or_404(Computer, pk=mac)
    command = ""
    if request.body:
        body_dict = json.loads(request.body)
        command = body_dict["command"]
    computer.execute_command(command)
    return HttpResponse("0")


@csrf_exempt
def api_get_all(request):
    computer_list = Computer.objects.all()
    [computer.refresh() for computer in computer_list]
    computer_json = serializers.serialize("json", computer_list)
    return HttpResponse(computer_json)
