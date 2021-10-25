from django.db import models
from django.utils import timezone

from typing import List
import requests
import wakeonlan
import time
import datetime
import json
# Create your models here.


class WrongCommandFormat(Exception):
    pass


class Computer(models.Model):
    mac = models.CharField(max_length=18, unique=True, primary_key=True)
    name = models.CharField(max_length=18, default="Computer")
    port = models.IntegerField()
    ip = models.GenericIPAddressField()
    last_seen = models.DateTimeField(null=True)
    is_alive = models.BooleanField(default=True)

    def send_command(self, command_list: List, timeout=5):
        if not isinstance(command_list, list):
            raise WrongCommandFormat(
                F"command list shoul be list, not {type(command_list)}")

        data = {'command': command_list + [""]}
        print(F"Asking host {self.ip}")
        print("Sending: ", data)
        try:
            r = requests.post(
                F"http://{self.ip}:{self.port}", data, timeout=timeout)
        except requests.exceptions.ConnectionError:
            self.is_alive = False
            self.save()
            return None
        return r

    def wake_up(self):
        for _ in range(5):
            wakeonlan.send_magic_packet(self.mac)
            time.sleep(1)

    def refresh(self):
        # Do not update more than once per 5 seconds
        current_time = datetime.datetime.now(tz=timezone.utc)
        if self.last_seen and self.last_seen > current_time - datetime.timedelta(seconds=5):
            return
        r = self.send_command(['refresh', ], 2)
        if r is None:
            return
        if r.status_code == 200:
            self.last_seen = datetime.datetime.now(tz=timezone.utc)
            self.is_alive = True
        if not r.content:
            return
        # data = json.loads(r.content)
        # # print(data)
        self.save()

    def change_name(self, new_name):
        self.name = new_name
        self.save()

    def execute_command(self, command):
        command_list = command.split(';')
        if not command:
            return
        elif command_list[0] == "refresh":
            self.refresh()
        elif command_list[0] == "on":
            self.wake_up()
        elif command_list[0] == "name":
            self.change_name(command_list[1])
        else:
            self.send_command(command_list)
