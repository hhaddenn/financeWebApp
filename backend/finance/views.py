from django.http import HttpResponse


# Create your views here.
def index(request):
    response_data = '<h1>Page for transactions</h1>'
    return HttpResponse(response_data)