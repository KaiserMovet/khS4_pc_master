from django.urls import path

from . import views

app_name = 'khS4_pc_master'

urlpatterns = [
    path('', views.index, name='index'),
    path('api/register/<str:mac>/', views.api_register),
    path('api/send/<str:mac>/', views.api_send),
    path('api/get_all/', views.api_get_all),
]
