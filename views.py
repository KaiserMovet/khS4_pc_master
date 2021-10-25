from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponse
from django.template import loader
from django.core import serializers
from django.shortcuts import get_object_or_404, render
from .models import Computer
import json
import threading
# Main


def index(request):
    return render(request, 'khS4_pc_master/base.html')


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


def _refresh_non_alive_computers(computer_list):
    print([computer for computer in computer_list if not computer.is_alive])
    [computer.refresh() for computer in computer_list if not computer.is_alive]
    pass


@csrf_exempt
def api_get_all(request):
    computer_list = Computer.objects.all()
    [computer.refresh() for computer in computer_list if computer.is_alive]
    computer_json = serializers.serialize("json", computer_list)
    # Refresh non-alive computers, do not wait for them
    if any([not computer.is_alive for computer in computer_list]):
        print("Start thread")
        th = threading.Thread(
            target=_refresh_non_alive_computers, args=(computer_list,))
        th.daemon = True
        th.start()
    return HttpResponse(computer_json)
