from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ..models import News, NewsRead
from ..serializers import NewsSerializer


class NewsList(generics.ListAPIView):
    serializer_class = NewsSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        return News.objects.all().prefetch_related("reads")


class NewsDetail(generics.RetrieveAPIView):
    serializer_class = NewsSerializer
    permission_classes = (IsAuthenticated,)
    queryset = News.objects.all().prefetch_related("reads")


class NewsMarkRead(generics.GenericAPIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request, pk):
        news = get_object_or_404(News, pk=pk)
        NewsRead.objects.get_or_create(user=request.user, news=news)
        return Response(status=status.HTTP_204_NO_CONTENT)