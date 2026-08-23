from django.shortcuts import render
from django.http import HttpResponse

# Create your views here.
def index(request):
    response_data = '<h1>Page for users</h1>'
    return HttpResponse(response_data)